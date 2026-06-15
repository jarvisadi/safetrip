import { createTouristProfile, getTouristByUserId, getTouristById, getTouristCardData } from '../services/tourist.service.js';
import { v2 as cloudinary } from 'cloudinary';
import pool from '../config/db.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'missing',
});

export const completeProfile = async (req, res) => {
  try {
    const { emergency_contact_name, emergency_contact_phone } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    if (!emergency_contact_name || !emergency_contact_phone) {
      return res.status(400).json({ error: 'Emergency contact details are required' });
    }

    // Upload photo to Cloudinary using buffer
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'safetrip/tourists' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const photoUrl = uploadResult.secure_url;

    // Create tourist profile
    const tourist = await createTouristProfile(
      userId,
      photoUrl,
      emergency_contact_name,
      emergency_contact_phone
    );

    res.status(201).json(tourist);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getTouristProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const tourist = await getTouristById(id);
    res.json(tourist);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getMyTouristProfile = async (req, res) => {
  try {
    const tourist = await getTouristByUserId(req.user.id);
    res.json(tourist);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getTouristCard = async (req, res) => {
  try {
    const { id } = req.params;
    const cardData = await getTouristCardData(id);
    res.json(cardData);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.phone,
        t.id as tourist_id, t.photo_url, t.emergency_contact_name, 
        t.emergency_contact_phone, t.emergency_contact_relation,
        t.date_of_birth, t.nationality, t.home_address
       FROM users u
       LEFT JOIN tourists t ON u.id = t.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, date_of_birth, nationality, home_address } = req.body;
    
    let photoUrl = null;
    
    // Upload new photo if provided
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'safetrip/tourists' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      photoUrl = uploadResult.secure_url;
    }
    
    // Update users table
    await pool.query(
      'UPDATE users SET name = $1, phone = $2 WHERE id = $3',
      [name, phone, userId]
    );
    
    // Update tourists table
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (emergency_contact_name) {
      updateFields.push(`emergency_contact_name = $${paramIndex++}`);
      updateValues.push(emergency_contact_name);
    }
    if (emergency_contact_phone) {
      updateFields.push(`emergency_contact_phone = $${paramIndex++}`);
      updateValues.push(emergency_contact_phone);
    }
    if (emergency_contact_relation) {
      updateFields.push(`emergency_contact_relation = $${paramIndex++}`);
      updateValues.push(emergency_contact_relation);
    }
    if (date_of_birth) {
      updateFields.push(`date_of_birth = $${paramIndex++}`);
      updateValues.push(date_of_birth);
    }
    if (nationality) {
      updateFields.push(`nationality = $${paramIndex++}`);
      updateValues.push(nationality);
    }
    if (home_address) {
      updateFields.push(`home_address = $${paramIndex++}`);
      updateValues.push(home_address);
    }
    if (photoUrl) {
      updateFields.push(`photo_url = $${paramIndex++}`);
      updateValues.push(photoUrl);
    }
    
    if (updateFields.length > 0) {
      updateValues.push(userId);
      const updateQuery = `
        UPDATE tourists 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
      `;
      await pool.query(updateQuery, updateValues);
    }
    
    // Fetch updated profile
    const updatedProfile = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.phone,
        t.id as tourist_id, t.photo_url, t.emergency_contact_name, 
        t.emergency_contact_phone, t.emergency_contact_relation,
        t.date_of_birth, t.nationality, t.home_address
       FROM users u
       LEFT JOIN tourists t ON u.id = t.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    res.json(updatedProfile.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
