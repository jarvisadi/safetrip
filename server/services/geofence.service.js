import pool from '../config/db.js';

// Ray-casting algorithm to check if point is inside polygon
export const isPointInPolygon = (point, polygon) => {
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
};

export const createGeofence = async (name, type, polygon) => {
  const result = await pool.query(
    `INSERT INTO geofences (name, type, polygon) 
     VALUES ($1, $2, $3) 
     RETURNING id, name, type, polygon, created_at`,
    [name, type, JSON.stringify(polygon)]
  );

  return result.rows[0];
};

export const getAllGeofences = async () => {
  const result = await pool.query(
    'SELECT id, name, type, polygon, created_at FROM geofences ORDER BY created_at DESC'
  );

  return result.rows.map(row => ({
    ...row,
    polygon: typeof row.polygon === 'string' ? JSON.parse(row.polygon) : row.polygon,
  }));
};

export const getGeofenceById = async (id) => {
  const result = await pool.query(
    'SELECT id, name, type, polygon, created_at FROM geofences WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Geofence not found');
  }

  const geofence = result.rows[0];
  return {
    ...geofence,
    polygon: typeof geofence.polygon === 'string' ? JSON.parse(geofence.polygon) : geofence.polygon,
  };
};

export const updateGeofence = async (id, name, type, polygon) => {
  const result = await pool.query(
    `UPDATE geofences 
     SET name = $1, type = $2, polygon = $3 
     WHERE id = $4 
     RETURNING id, name, type, polygon, created_at`,
    [name, type, JSON.stringify(polygon), id]
  );

  if (result.rows.length === 0) {
    throw new Error('Geofence not found');
  }

  const geofence = result.rows[0];
  return {
    ...geofence,
    polygon: typeof geofence.polygon === 'string' ? JSON.parse(geofence.polygon) : geofence.polygon,
  };
};

export const deleteGeofence = async (id) => {
  const result = await pool.query(
    'DELETE FROM geofences WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Geofence not found');
  }

  return { id };
};

export const checkPointInGeofences = async (lat, lng) => {
  const geofences = await getAllGeofences();
  const point = { lat, lng };

  for (const geofence of geofences) {
    if (isPointInPolygon(point, geofence.polygon)) {
      return geofence;
    }
  }

  return null;
};
