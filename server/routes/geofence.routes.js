import express from 'express';
import { body } from 'express-validator';
import { create, getAll, getById, update, remove, check } from '../controllers/geofence.controller.js';
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

// Create geofence (admin only)
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Geofence name is required'),
    body('type').isIn(['safe', 'danger', 'trail']).withMessage('Invalid geofence type'),
    body('polygon').isArray({ min: 3 }).withMessage('Polygon must have at least 3 points'),
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles('admin'),
  create
);

// Get all geofences (authenticated)
router.get('/', authenticateToken, getAll);

// Get geofence by ID (authenticated)
router.get('/:id', authenticateToken, getById);

// Update geofence (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), update);

// Delete geofence (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), remove);

// Check if point is in any geofence (authenticated)
router.post(
  '/check',
  [
    body('lat').isFloat().withMessage('Valid latitude is required'),
    body('lng').isFloat().withMessage('Valid longitude is required'),
  ],
  validateRequest,
  authenticateToken,
  check
);

export default router;
