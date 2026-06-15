import express from 'express';
import { body } from 'express-validator';
import { createIncident, getAllIncidents, updateIncidentStatus } from '../controllers/incident.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = [];
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }
  next();
};

// Create incident (authenticated)
router.post(
  '/',
  [
    body('type').isIn(['sos', 'anomaly', 'geofence_breach', 'wildlife', 'fraud_attempt']).withMessage('Invalid incident type'),
  ],
  validateRequest,
  authenticateToken,
  createIncident
);

// Get all incidents (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), getAllIncidents);

// Update incident status (admin only)
router.patch(
  '/:id',
  [
    body('status').isIn(['open', 'in_progress', 'resolved']).withMessage('Invalid status'),
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles('admin'),
  updateIncidentStatus
);

export default router;
