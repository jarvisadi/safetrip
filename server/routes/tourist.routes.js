import express from 'express';
import { body } from 'express-validator';
import { completeProfile, getTouristProfile, getMyTouristProfile, getTouristCard, getProfile, updateProfile } from '../controllers/tourist.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import pool from '../config/db.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = [];
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }
  next();
};

// Complete tourist profile (upload photo, add emergency contacts)
router.post(
  '/complete-profile',
  [
    body('emergencyContactName').trim().notEmpty().withMessage('Emergency contact name is required'),
    body('emergencyContactPhone').trim().notEmpty().withMessage('Emergency contact phone is required'),
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles('tourist'),
  upload.single('photo'),
  completeProfile
);

// Get my tourist profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.name, u.email, u.phone FROM tourists t JOIN users u ON t.user_id = u.id WHERE t.user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tourist profile not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tourist profile by ID
router.get('/:id', authenticateToken, getTouristProfile);

// Get tourist card data
router.get('/:id/card', authenticateToken, getTouristCard);

// Get profile
router.get('/profile', authenticateToken, getProfile);

// Update profile
router.patch('/profile', authenticateToken, upload.single('photo'), updateProfile);

export default router;
