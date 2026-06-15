import express from 'express';
import rateLimit from 'express-rate-limit';
import { triggerSOS } from '../controllers/sos.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rate limiting for SOS endpoint: max 5 requests per minute per IP
const sosRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many SOS requests. Please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Trigger SOS (tourist only)
router.post('/trigger', sosRateLimit, authenticateToken, authorizeRoles('tourist'), triggerSOS);

export default router;
