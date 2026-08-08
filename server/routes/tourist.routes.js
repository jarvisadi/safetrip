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
router.get('/me', authenticateToken, getProfile);

// Get tourist profile by ID
router.get('/:id', authenticateToken, getTouristProfile);

// Get tourist card data
router.get('/:id/card', authenticateToken, getTouristCard);

// Get profile
router.get('/profile', authenticateToken, getProfile);

// Update profile
router.patch('/profile', authenticateToken, upload.single('photo'), updateProfile);

export default router;
