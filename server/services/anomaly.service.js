import pool from '../config/db.js';
import { checkPointInGeofences } from './geofence.service.js';
import { generateAlertMessage } from './groq.service.js';

// Calculate distance between two points in meters using Haversine formula
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Check if current time is between 9pm and 5am
export const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= 21 || hour < 5;
};

export const analyzeTouristRisk = async (touristId) => {
  try {
    // Fetch location logs from last 45 minutes
    const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000);
    
    const locationResult = await pool.query(
      `SELECT lat, lng, logged_at 
       FROM location_logs 
       WHERE tourist_id = $1 AND logged_at >= $2 
       ORDER BY logged_at ASC`,
      [touristId, fortyFiveMinutesAgo.toISOString()]
    );

    const locations = locationResult.rows;
    let riskScore = 0;
    let riskFactors = [];

    if (locations.length === 0) {
      // No location data - no movement detected
      riskScore += 10;
      riskFactors.push('no_location_data');
    } else {
      // Calculate total movement
      let totalMovement = 0;
      for (let i = 1; i < locations.length; i++) {
        totalMovement += calculateDistance(
          locations[i - 1].lat,
          locations[i - 1].lng,
          locations[i].lat,
          locations[i].lng
        );
      }

      // Check if stationary (less than 50 meters total movement)
      if (totalMovement < 50) {
        riskScore += 40;
        riskFactors.push('stationary');
      }

      // Check if no movement at all
      if (totalMovement === 0) {
        riskScore += 10;
        riskFactors.push('no_movement');
      }

      // Check if in danger zone
      const latestLocation = locations[locations.length - 1];
      const geofence = await checkPointInGeofences(latestLocation.lat, latestLocation.lng);
      
      if (geofence && geofence.type === 'danger') {
        riskScore += 30;
        riskFactors.push('danger_zone');
      }
    }

    // Check if night time
    if (isNightTime()) {
      riskScore += 20;
      riskFactors.push('night_time');
    }

    return { riskScore, riskFactors };
  } catch (error) {
    console.error('Error analyzing tourist risk:', error);
    return { riskScore: 0, riskFactors: [] };
  }
};

export const runAnomalyDetection = async (io) => {
  try {
    // Get all active tourists from in-memory storage or database
    const result = await pool.query(
      `SELECT t.id, t.user_id, u.name, u.phone, t.photo_url, t.emergency_contact_name, t.emergency_contact_phone
       FROM tourists t
       JOIN users u ON t.user_id = u.id
       WHERE t.is_active = true`
    );

    const tourists = result.rows;

    for (const tourist of tourists) {
      const { riskScore, riskFactors } = await analyzeTouristRisk(tourist.id);

      if (riskScore > 65) {
        // Generate AI alert message
        const latestLocation = await pool.query(
          `SELECT lat, lng FROM location_logs WHERE tourist_id = $1 ORDER BY logged_at DESC LIMIT 1`,
          [tourist.id]
        );

        const location = latestLocation.rows[0] || { lat: 0, lng: 0 };
        const situation = riskFactors.join(', ');

        const aiMessage = await generateAlertMessage(
          tourist.name,
          location,
          situation
        );

        // Create incident
        await pool.query(
          `INSERT INTO incidents (tourist_id, type, risk_score, status, ai_message, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [tourist.id, 'anomaly', riskScore, 'open', aiMessage, JSON.stringify(riskFactors)]
        );

        // Notify admin via socket
        io.emit('admin:alert', {
          type: 'anomaly',
          touristId: tourist.id,
          name: tourist.name,
          phone: tourist.phone,
          photoUrl: tourist.photo_url,
          location,
          riskScore,
          riskFactors,
          aiMessage,
          timestamp: new Date().toISOString(),
        });

        console.log(`Anomaly detected for tourist ${tourist.name}: risk score ${riskScore}`);
      }
    }
  } catch (error) {
    console.error('Error running anomaly detection:', error);
  }
};

export const startAnomalyDetection = (io) => {
  // Run every 5 minutes
  setInterval(() => {
    runAnomalyDetection(io);
  }, 5 * 60 * 1000);

  // Run immediately on start
  runAnomalyDetection(io);
};
