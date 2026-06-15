import {
  createGeofence,
  getAllGeofences,
  getGeofenceById,
  updateGeofence,
  deleteGeofence,
  checkPointInGeofences,
} from '../services/geofence.service.js';

export const create = async (req, res) => {
  try {
    const { name, type, polygon } = req.body;

    if (!name || !type || !polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({ error: 'Invalid geofence data' });
    }

    const geofence = await createGeofence(name, type, polygon);
    res.status(201).json(geofence);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const geofences = await getAllGeofences();
    res.json(geofences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const geofence = await getGeofenceById(id);
    res.json(geofence);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, polygon } = req.body;

    if (!name || !type || !polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({ error: 'Invalid geofence data' });
    }

    const geofence = await updateGeofence(id, name, type, polygon);
    res.json(geofence);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteGeofence(id);
    res.json({ message: 'Geofence deleted successfully' });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const check = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Lat and lng are required' });
    }

    const geofence = await checkPointInGeofences(lat, lng);
    res.json(geofence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
