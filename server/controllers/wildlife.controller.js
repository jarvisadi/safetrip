import pool from '../config/db.js';
import { detectWildlife } from '../services/wildlife.service.js';

// Global io instance (set by index.js)
let io = null;

export const setIO = (socketIO) => {
  io = socketIO;
};

export const detectWildlifeImage = async (req, res) => {
  try {
    let result;

    if (req.file) {
      // Upload mode: file saved by multer, pass the path
      result = await detectWildlife({ type: 'file', path: req.file.path });
    } else {
      // Camera mode: base64 string from req.body.image
      result = await detectWildlife({ type: 'base64', data: req.body.image });
    }

    res.json({ result });
  } catch (error) {
    console.error('Error detecting wildlife:', error);
    res.status(500).json({ error: 'Wildlife detection failed' });
  }
};

