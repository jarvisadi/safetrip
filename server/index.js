import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import touristRoutes from './routes/tourist.routes.js';
import geofenceRoutes from './routes/geofence.routes.js';
import sosRoutes from './routes/sos.routes.js';
import incidentRoutes from './routes/incident.routes.js';
import wildlifeRoutes from './routes/wildlife.routes.js';
import chatRoutes from './routes/chat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { setIO as setWildlifeIO } from './controllers/wildlife.controller.js';
import jwt from 'jsonwebtoken';
import pool from './config/db.js';
import { checkPointInGeofences } from './services/geofence.service.js';
import { startAnomalyDetection } from './services/anomaly.service.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://safetrip-32mvwacrz-adityak1.vercel.app',
      /\.vercel\.app$/
    ],
    credentials: true
  }
});

// Set IO instance for wildlife controller
setWildlifeIO(io);

const PORT = process.env.PORT || 5000;

// In-memory storage for active tourists
const activeTourists = new Map();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://safetrip-32mvwacrz-adityak1.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const uptime = process.uptime();
    const uptimeFormatted = `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`;

    // Check database connection
    let dbStatus = 'disconnected';
    try {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }

    // Count active tourists (in-memory)
    const activeTouristCount = activeTourists.size;

    res.json({
      status: 'ok',
      uptime: uptimeFormatted,
      database: dbStatus,
      activeTourists: activeTouristCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Health check failed',
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tourists', touristRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/wildlife', wildlifeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const user = socket.user;

  // Tourist joins
  socket.on('tourist:join', async () => {
    if (user.role !== 'tourist') return;

    try {
      // Get tourist profile
      const result = await pool.query(
        'SELECT t.*, u.name, u.phone FROM tourists t JOIN users u ON t.user_id = u.id WHERE t.user_id = $1',
        [user.id]
      );

      if (result.rows.length > 0) {
        const tourist = result.rows[0];
        activeTourists.set(tourist.id, {
          socketId: socket.id,
          touristId: tourist.id,
          userId: user.id,
          name: tourist.name,
          phone: tourist.phone,
          photoUrl: tourist.photo_url,
          qrCode: tourist.qr_code,
          lastLocation: null,
          riskScore: 0,
        });
        socket.join(`tourist:${tourist.id}`);
      }
    } catch (error) {
      console.error('Error fetching tourist profile:', error);
    }
  });

  // Tourist location update
  socket.on('tourist:location_update', async (data) => {
    if (user.role !== 'tourist') return;

    const { lat, lng, accuracy } = data;

    try {
      // Get tourist ID from user
      const result = await pool.query(
        'SELECT id FROM tourists WHERE user_id = $1',
        [user.id]
      );

      if (result.rows.length > 0) {
        const touristId = result.rows[0].id;

        // Save to database
        await pool.query(
          'INSERT INTO location_logs (tourist_id, lat, lng, accuracy) VALUES ($1, $2, $3, $4)',
          [touristId, lat, lng, accuracy]
        );

        // Check geofence breach
        const geofence = await checkPointInGeofences(lat, lng);
        
        // Update in-memory storage
        const tourist = activeTourists.get(touristId);
        if (tourist) {
          tourist.lastLocation = { lat, lng, accuracy };
          
          // Update risk score based on geofence
          if (geofence) {
            if (geofence.type === 'danger') {
              tourist.riskScore = 100;
              
              // Create incident for danger zone breach
              await pool.query(
                'INSERT INTO incidents (tourist_id, type, risk_score, status) VALUES ($1, $2, $3, $4)',
                [touristId, 'geofence_breach', 100, 'open']
              );
              
              // Get tourist details for alert
              const touristDetails = await pool.query(
                'SELECT t.*, u.name, u.phone FROM tourists t JOIN users u ON t.user_id = u.id WHERE t.id = $1',
                [touristId]
              );
              
              if (touristDetails.rows.length > 0) {
                const tData = touristDetails.rows[0];
                io.emit('admin:alert', {
                  type: 'geofence_breach',
                  touristId,
                  name: tData.name,
                  phone: tData.phone,
                  photoUrl: tData.photo_url,
                  location: { lat, lng, accuracy },
                  geofence: geofence.name,
                  timestamp: new Date().toISOString(),
                });
              }
            } else if (geofence.type === 'safe') {
              tourist.riskScore = 0;
            } else if (geofence.type === 'trail') {
              tourist.riskScore = 30;
            }
          }
          
          activeTourists.set(touristId, tourist);

          // Broadcast to all admins
          io.emit('admin:tourist_moved', {
            touristId,
            name: tourist.name,
            photoUrl: tourist.photoUrl,
            location: { lat, lng, accuracy },
            riskScore: tourist.riskScore,
          });
        }
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  });

  // SOS triggered
  socket.on('sos:triggered', async () => {
    if (user.role !== 'tourist') return;

    try {
      const result = await pool.query(
        'SELECT t.*, u.name, u.phone FROM tourists t JOIN users u ON t.user_id = u.id WHERE t.user_id = $1',
        [user.id]
      );

      if (result.rows.length > 0) {
        const tourist = result.rows[0];
        const touristData = activeTourists.get(tourist.id);

        // Create incident record
        await pool.query(
          'INSERT INTO incidents (tourist_id, type, risk_score, status) VALUES ($1, $2, $3, $4)',
          [tourist.id, 'sos', 100, 'open']
        );

        // Broadcast SOS to all admins
        io.emit('admin:sos_alert', {
          touristId: tourist.id,
          name: tourist.name,
          phone: tourist.phone,
          photoUrl: tourist.photo_url,
          emergencyContactName: tourist.emergency_contact_name,
          emergencyContactPhone: tourist.emergency_contact_phone,
          location: touristData?.lastLocation || null,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error handling SOS:', error);
    }
  });

  // Tourist leaves
  socket.on('tourist:leave', () => {
    if (user.role !== 'tourist') return;

    // Remove from active tourists
    for (const [touristId, tourist] of activeTourists.entries()) {
      if (tourist.userId === user.id) {
        activeTourists.delete(touristId);
        break;
      }
    }
  });

  // Admin joins
  socket.on('admin:join', () => {
    if (user.role !== 'admin') return;
    socket.join('admins');
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Remove from active tourists
    for (const [touristId, tourist] of activeTourists.entries()) {
      if (tourist.socketId === socket.id) {
        activeTourists.delete(touristId);
        break;
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start anomaly detection service
  startAnomalyDetection(io);
});
