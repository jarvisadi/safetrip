import pool from '../config/db.js';
import QRCode from 'qrcode';

export const createTouristProfile = async (userId, photoUrl, emergencyContactName, emergencyContactPhone) => {
  // Generate unique QR code string based on tourist ID
  const touristId = crypto.randomUUID();
  const qrCodeString = `TOURIST-${touristId}`;
  
  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
    width: 200,
    margin: 2,
  });

  const result = await pool.query(
    `INSERT INTO tourists (user_id, photo_url, qr_code, emergency_contact_name, emergency_contact_phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, photo_url, qr_code, emergency_contact_name, emergency_contact_phone, is_active, created_at`,
    [userId, photoUrl, qrCodeString, emergencyContactName, emergencyContactPhone]
  );

  return {
    ...result.rows[0],
    qrCodeDataUrl,
  };
};

export const getTouristByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT t.*, u.name, u.email, u.phone, u.role
     FROM tourists t
     JOIN users u ON t.user_id = u.id
     WHERE t.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Tourist profile not found');
  }

  const tourist = result.rows[0];
  
  // Generate QR code data URL
  const qrCodeDataUrl = await QRCode.toDataURL(tourist.qr_code, {
    width: 200,
    margin: 2,
  });

  return {
    ...tourist,
    qrCodeDataUrl,
  };
};

export const getTouristById = async (touristId) => {
  const result = await pool.query(
    `SELECT t.*, u.name, u.email, u.phone, u.role
     FROM tourists t
     JOIN users u ON t.user_id = u.id
     WHERE t.id = $1`,
    [touristId]
  );

  if (result.rows.length === 0) {
    throw new Error('Tourist not found');
  }

  const tourist = result.rows[0];
  
  // Generate QR code data URL
  const qrCodeDataUrl = await QRCode.toDataURL(tourist.qr_code, {
    width: 200,
    margin: 2,
  });

  return {
    ...tourist,
    qrCodeDataUrl,
  };
};

export const getTouristCardData = async (touristId) => {
  const tourist = await getTouristById(touristId);

  return {
    id: tourist.id,
    name: tourist.name,
    phone: tourist.phone,
    photoUrl: tourist.photo_url,
    qrCode: tourist.qr_code,
    qrCodeDataUrl: tourist.qrCodeDataUrl,
    emergencyContactName: tourist.emergency_contact_name,
    emergencyContactPhone: tourist.emergency_contact_phone,
    createdAt: tourist.created_at,
  };
};
