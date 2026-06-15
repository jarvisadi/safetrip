import express from 'express';
import { getSummary, getHeatmap, getTrends, getRecentIncidents } from '../controllers/analytics.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get analytics summary (admin only)
router.get('/summary', authenticateToken, authorizeRoles('admin'), getSummary);

// Get heatmap data (admin only)
router.get('/heatmap', authenticateToken, authorizeRoles('admin'), getHeatmap);

// Get trends data (admin only)
router.get('/trends', authenticateToken, authorizeRoles('admin'), getTrends);

// Get recent incidents (admin only)
router.get('/recent-incidents', authenticateToken, authorizeRoles('admin'), getRecentIncidents);

export default router;
