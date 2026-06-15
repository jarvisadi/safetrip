import pool from '../config/db.js';

export const createIncident = async (req, res) => {
  try {
    const { tourist_id, type, risk_score, status, ai_message, details } = req.body;

    if (!tourist_id || !type) {
      return res.status(400).json({ error: 'tourist_id and type are required' });
    }

    const result = await pool.query(
      `INSERT INTO incidents (tourist_id, type, risk_score, status, ai_message, details)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tourist_id, type, risk_score || 50, status || 'open', ai_message, JSON.stringify(details)]
    );

    const incident = result.rows[0];
    res.status(201).json({
      ...incident,
      details: typeof incident.details === 'string' ? JSON.parse(incident.details) : incident.details,
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
};

export const getAllIncidents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, t.user_id, u.name as tourist_name, u.phone as tourist_phone, t.photo_url
       FROM incidents i
       JOIN tourists t ON i.tourist_id = t.id
       JOIN users u ON t.user_id = u.id
       ORDER BY i.created_at DESC`
    );

    const incidents = result.rows.map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
    }));

    res.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
};

export const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE incidents SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const incident = result.rows[0];
    res.json({
      ...incident,
      details: typeof incident.details === 'string' ? JSON.parse(incident.details) : incident.details,
    });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
};
