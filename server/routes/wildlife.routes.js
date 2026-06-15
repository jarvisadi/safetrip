import express from 'express';
import multer from 'multer';
import { detectWildlifeImage } from '../controllers/wildlife.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Route 1: File upload (FormData) from upload mode
router.post(
  '/detect/upload',
  authenticateToken,
  authorizeRoles('tourist'),
  upload.single('image'),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    next();
  },
  detectWildlifeImage
);

// Route 2: Base64 JSON from camera mode
router.post(
  '/detect/camera',
  authenticateToken,
  authorizeRoles('tourist'),
  (req, res, next) => {
    if (!req.body || !req.body.image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    next();
  },
  detectWildlifeImage
);

export default router;
