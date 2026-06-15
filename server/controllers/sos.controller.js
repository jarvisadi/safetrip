import pool from '../config/db.js';
import { generateAlertMessage, sendSMS } from '../services/groq.service.js';

export const triggerSOS = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get tourist profile
    const touristResult = await pool.query(
      'SELECT t.*, u.name, u.phone FROM tourists t JOIN users u ON t.user_id = u.id WHERE t.user_id = $1',
      [userId]
    );

    if (touristResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tourist profile not found' });
    }

    const tourist = touristResult.rows[0];

    // Get latest location
    const locationResult = await pool.query(
      'SELECT lat, lng FROM location_logs WHERE tourist_id = $1 ORDER BY logged_at DESC LIMIT 1',
      [tourist.id]
    );

    const location = locationResult.rows[0] || { lat: 0, lng: 0 };

    // Safety conversion for location coordinates
    const safeLat = parseFloat(location?.lat || 0);
    const safeLng = parseFloat(location?.lng || 0);

    // Generate AI alert message
    const aiMessage = await generateAlertMessage(
      tourist.name,
      { lat: safeLat, lng: safeLng },
      'SOS emergency triggered by tourist'
    );

    // Create incident
    const incidentResult = await pool.query(
      `INSERT INTO incidents (tourist_id, type, risk_score, status, ai_message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [tourist.id, 'sos', 100, 'open', aiMessage]
    );

    // Send SMS to emergency contact
    if (tourist.emergency_contact_phone) {
      await sendSMS(
        tourist.emergency_contact_phone,
        `SOS ALERT: ${tourist.name} needs immediate help. Location: ${safeLat.toFixed(6)}, ${safeLng.toFixed(6)}. ${aiMessage}`
      );
    }

    // Emit socket event (will be handled by the socket.io server)
    // The socket event is already handled in the existing socket handler

    res.status(201).json({
      success: true,
      incidentId: incidentResult.rows[0].id,
      message: aiMessage,
    });
  } catch (error) {
    console.error('Error triggering SOS:', error);
    res.status(500).json({ error: 'Failed to trigger SOS' });
  }
};
