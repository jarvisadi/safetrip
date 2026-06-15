import pool from '../config/db.js';

export const getSummary = async (req, res) => {
  try {
    // Total tourists (all registered users with tourist role)
    const touristCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['tourist']
    );

    // Total tourists today
    const touristsTodayResult = await pool.query(
      `SELECT COUNT(DISTINCT t.id) as count
       FROM tourists t
       JOIN location_logs ll ON t.id = ll.tourist_id
       WHERE DATE(ll.logged_at) = CURRENT_DATE`
    );

    // Active tourists right now (last 10 minutes)
    const activeNowResult = await pool.query(
      `SELECT COUNT(DISTINCT t.id) as count
       FROM tourists t
       JOIN location_logs ll ON t.id = ll.tourist_id
       WHERE ll.logged_at >= NOW() - INTERVAL '10 minutes'`
    );

    // Total incidents this week
    const incidentsThisWeekResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM incidents
       WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)`
    );

    // Resolved incidents this week
    const resolvedIncidentsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM incidents
       WHERE status = 'resolved' AND created_at >= DATE_TRUNC('week', CURRENT_DATE)`
    );

    // Incidents by type this week
    const incidentsByTypeResult = await pool.query(
      `SELECT type, COUNT(*) as count
       FROM incidents
       WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
       GROUP BY type`
    );

    // Average risk score this week
    const avgRiskScoreResult = await pool.query(
      `SELECT AVG(risk_score) as avg_score
       FROM incidents
       WHERE risk_score IS NOT NULL AND created_at >= DATE_TRUNC('week', CURRENT_DATE)`
    );

    const incidentsByType = {
      sos: 0,
      anomaly: 0,
      geofence_breach: 0,
      wildlife: 0,
    };

    incidentsByTypeResult.rows.forEach((row) => {
      if (incidentsByType.hasOwnProperty(row.type)) {
        incidentsByType[row.type] = parseInt(row.count);
      }
    });

    res.json({
      totalTourists: parseInt(touristCountResult.rows[0].count),
      totalTouristsToday: parseInt(touristsTodayResult.rows[0].count),
      activeTourists: parseInt(activeNowResult.rows[0].count),
      totalIncidents: parseInt(incidentsThisWeekResult.rows[0].count),
      resolvedIncidents: parseInt(resolvedIncidentsResult.rows[0].count),
      incidentsByType,
      averageRiskScore: parseFloat(avgRiskScoreResult.rows[0].avg_score || 0).toFixed(1),
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
};

export const getHeatmap = async (req, res) => {
  try {
    // Get incident locations from the last 30 days
    const result = await pool.query(
      `SELECT 
         ll.lat, 
         ll.lng, 
         COUNT(*) as count
       FROM incidents i
       JOIN location_logs ll ON i.tourist_id = ll.tourist_id
       WHERE i.created_at >= NOW() - INTERVAL '30 days'
         AND ll.logged_at >= i.created_at - INTERVAL '1 hour'
         AND ll.logged_at <= i.created_at + INTERVAL '1 hour'
       GROUP BY ll.lat, ll.lng
       HAVING COUNT(*) >= 1
       ORDER BY count DESC
       LIMIT 50`
    );

    const heatmap = result.rows.map((row) => ({
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      count: parseInt(row.count),
    }));

    res.json(heatmap);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
};

export const getTrends = async (req, res) => {
  try {
    // Get incident count per day for the last 7 days
    const result = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as count
       FROM incidents
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    const trends = result.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count),
    }));

    // Fill in missing days with 0
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const trend = trends.find((t) => t.date === dateStr);
      last7Days.push({
        date: dateStr,
        count: trend ? trend.count : 0,
      });
    }

    res.json(last7Days);
  } catch (error) {
    console.error('Error fetching trends data:', error);
    res.status(500).json({ error: 'Failed to fetch trends data' });
  }
};

export const getRecentIncidents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, t.user_id, u.name as tourist_name, u.phone as tourist_phone
       FROM incidents i
       JOIN tourists t ON i.tourist_id = t.id
       JOIN users u ON t.user_id = u.id
       ORDER BY i.created_at DESC
       LIMIT 10`
    );

    const incidents = result.rows.map((row) => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
    }));

    res.json(incidents);
  } catch (error) {
    console.error('Error fetching recent incidents:', error);
    res.status(500).json({ error: 'Failed to fetch recent incidents' });
  }
};
