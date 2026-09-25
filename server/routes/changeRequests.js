const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { runImpactPrediction } = require('../engine/impactPredictor');

// GET /api/change-requests - List change requests with metrics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, status } = req.query;

    let sql = `
      SELECT cr.*,
        p.name as product_name,
        pt.part_name, pt.part_number, pt.category as part_category,
        u.full_name as requester_name, u.email as requester_email,
        (SELECT COUNT(*) FROM impact_predictions WHERE change_request_id = cr.id) as affected_parts_count,
        (SELECT MAX(impact_score) FROM impact_predictions WHERE change_request_id = cr.id) as max_impact_score,
        (SELECT SUM(predicted_cost_delta) FROM impact_predictions WHERE change_request_id = cr.id) as total_cost_delta,
        (SELECT MAX(predicted_delay_days) FROM impact_predictions WHERE change_request_id = cr.id) as max_delay_days
      FROM change_requests cr
      JOIN products p ON cr.product_id = p.id
      JOIN parts pt ON cr.part_id = pt.id
      LEFT JOIN users u ON cr.requested_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      sql += ' AND cr.product_id = ?';
      params.push(product_id);
    }
    if (status) {
      sql += ' AND cr.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY cr.created_at DESC';

    const changeRequests = await query.all(sql, params);
    return res.json({ changeRequests });
  } catch (err) {
    console.error('Error fetching change requests:', err);
    return res.status(500).json({ error: 'Failed to fetch change requests.' });
  }
});

// GET /api/change-requests/:id - Single CR with predictions & audit log
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const cr = await query.get(`
      SELECT cr.*,
        p.name as product_name, p.description as product_description,
        pt.part_name, pt.part_number, pt.category as part_category, pt.cost as part_cost, pt.supplier as part_supplier, pt.lead_time_days as part_lead_time,
        u.full_name as requester_name, u.email as requester_email, u.company_role as requester_role
      FROM change_requests cr
      JOIN products p ON cr.product_id = p.id
      JOIN parts pt ON cr.part_id = pt.id
      LEFT JOIN users u ON cr.requested_by = u.id
      WHERE cr.id = ?
    `, [req.params.id]);

    if (!cr) {
      return res.status(404).json({ error: 'Change Request not found.' });
    }

    const predictions = await query.all(`
      SELECT ip.*,
        pt.part_name, pt.part_number, pt.category, pt.supplier, pt.cost, pt.lead_time_days
      FROM impact_predictions ip
      JOIN parts pt ON ip.affected_part_id = pt.id
      WHERE ip.change_request_id = ?
      ORDER BY ip.impact_score DESC
    `, [req.params.id]);

    const auditLogs = await query.all(`
      SELECT al.*, u.full_name as user_name, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.performed_by = u.id
      WHERE al.change_request_id = ?
      ORDER BY al.timestamp ASC
    `, [req.params.id]);

    // Calculate aggregate risk statistics
    const affectedPartsCount = predictions.length;
    const maxScore = predictions.reduce((max, p) => Math.max(max, p.impact_score), 0);
    const totalCostDelta = predictions.reduce((sum, p) => sum + (p.predicted_cost_delta || 0), 0);
    const maxDelayDays = predictions.reduce((max, p) => Math.max(max, p.predicted_delay_days || 0), 0);
    
    // Unique suppliers affected
    const suppliersSet = new Set(predictions.map(p => p.supplier).filter(Boolean));

    let riskLevel = 'LOW';
    if (maxScore >= 80 || affectedPartsCount >= 6) riskLevel = 'CRITICAL';
    else if (maxScore >= 65 || affectedPartsCount >= 4) riskLevel = 'HIGH';
    else if (maxScore >= 45) riskLevel = 'MEDIUM';

    const riskSummary = `${riskLevel} RISK: Affects ${affectedPartsCount} connected component(s) across ${suppliersSet.size} supplier(s). Estimated cost impact: +$${totalCostDelta.toLocaleString()}, schedule delay: +${maxDelayDays} days.`;

    return res.json({
      changeRequest: cr,
      predictions,
      auditLogs,
      summary: {
        affectedPartsCount,
        maxScore,
        totalCostDelta,
        maxDelayDays,
        suppliersCount: suppliersSet.size,
        riskLevel,
        riskSummary
      }
    });
  } catch (err) {
    console.error('Error fetching change request details:', err);
    return res.status(500).json({ error: 'Failed to fetch change request details.' });
  }
});

// POST /api/change-requests - Create CR and trigger impact prediction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, part_id, title, description } = req.body;

    if (!product_id || !part_id || !title) {
      return res.status(400).json({ error: 'Please select a product, target part, and enter a title.' });
    }

    const crId = `cr-${uuidv4().substring(0, 8)}`;

    await query.run(`
      INSERT INTO change_requests (id, product_id, part_id, title, description, requested_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'under_review')
    `, [crId, product_id, part_id, title.trim(), description ? description.trim() : '', req.user.id]);

    // Automatically trigger impact prediction engine!
    const predictions = await runImpactPrediction(crId);

    // Create Audit Log entry
    await query.run(`
      INSERT INTO audit_logs (id, change_request_id, action, performed_by, comments)
      VALUES (?, ?, 'SUBMITTED', ?, ?)
    `, [
      `aud-${uuidv4().substring(0, 8)}`,
      crId,
      req.user.id,
      `Change request created and automated impact analysis executed. ${predictions.length} parts evaluated.`
    ]);

    const createdCR = await query.get('SELECT * FROM change_requests WHERE id = ?', [crId]);

    return res.status(201).json({
      message: 'Change Request created & impact predictions generated!',
      changeRequest: createdCR,
      predictionsCount: predictions.length
    });
  } catch (err) {
    console.error('Error creating change request:', err);
    return res.status(500).json({ error: 'Failed to create change request and predict impact.' });
  }
});

// PATCH /api/change-requests/:id/status - Approve or Reject CR (Manager / Admin ONLY)
router.patch('/:id/status', authenticateToken, requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { status, comments } = req.body;

    if (!['approved', 'rejected', 'under_review', 'implemented'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'approved', 'rejected', 'under_review', or 'implemented'." });
    }

    const cr = await query.get('SELECT * FROM change_requests WHERE id = ?', [req.params.id]);
    if (!cr) {
      return res.status(404).json({ error: 'Change Request not found.' });
    }

    await query.run(`
      UPDATE change_requests
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, req.params.id]);

    // Record Audit Log
    const actionText = status.toUpperCase();
    await query.run(`
      INSERT INTO audit_logs (id, change_request_id, action, performed_by, comments)
      VALUES (?, ?, ?, ?, ?)
    `, [
      `aud-${uuidv4().substring(0, 8)}`,
      req.params.id,
      actionText,
      req.user.id,
      comments ? comments.trim() : `Status updated to ${status} by ${req.user.full_name} (${req.user.role}).`
    ]);

    return res.json({
      message: `Change Request ${status} successfully!`,
      status
    });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ error: 'Failed to update change request status.' });
  }
});

module.exports = router;
