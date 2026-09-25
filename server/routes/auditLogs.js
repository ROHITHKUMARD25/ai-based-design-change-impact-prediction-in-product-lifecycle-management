const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/audit-logs - Audit trail feed
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await query.all(`
      SELECT al.*,
        cr.title as change_request_title,
        u.full_name as user_name, u.role as user_role, u.company_role
      FROM audit_logs al
      JOIN change_requests cr ON al.change_request_id = cr.id
      LEFT JOIN users u ON al.performed_by = u.id
      ORDER BY al.timestamp DESC
      LIMIT 30
    `);
    return res.json({ logs });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
