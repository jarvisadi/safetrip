import express from 'express';
import { body } from 'express-validator';
import { chat } from '../controllers/chat.controller.js';
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

// Chat endpoint (tourist only)
router.post(
  '/',
  [
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('lat').isFloat().withMessage('Valid latitude is required'),
    body('lng').isFloat().withMessage('Valid longitude is required'),
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles('tourist'),
  chat
);

export default router;
