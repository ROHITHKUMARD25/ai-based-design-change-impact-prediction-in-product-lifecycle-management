const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard - Get summary metrics and KPI data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const totalProducts = await query.get('SELECT COUNT(*) as count FROM products');
    const totalParts = await query.get('SELECT COUNT(*) as count FROM parts');
    const openCRs = await query.get("SELECT COUNT(*) as count FROM change_requests WHERE status = 'under_review'");
    const totalCRs = await query.get('SELECT COUNT(*) as count FROM change_requests');

    // High risk predictions (score >= 70)
    const highRiskPreds = await query.get('SELECT COUNT(*) as count FROM impact_predictions WHERE impact_score >= 70');
    
    // Financial risk sum
    const financialRisk = await query.get('SELECT SUM(predicted_cost_delta) as total FROM impact_predictions');

    // Recent change requests list with risk badges
    const recentCRs = await query.all(`
      SELECT cr.*,
        p.name as product_name,
        pt.part_name, pt.part_number,
        u.full_name as requester_name,
        (SELECT COUNT(*) FROM impact_predictions WHERE change_request_id = cr.id) as affected_count,
        (SELECT MAX(impact_score) FROM impact_predictions WHERE change_request_id = cr.id) as max_score
      FROM change_requests cr
      JOIN products p ON cr.product_id = p.id
      JOIN parts pt ON cr.part_id = pt.id
      LEFT JOIN users u ON cr.requested_by = u.id
      ORDER BY cr.created_at DESC
      LIMIT 6
    `);

    // Distribution by Category
    const categoryBreakdown = await query.all(`
      SELECT category, COUNT(*) as count FROM parts GROUP BY category
    `);

    return res.json({
      metrics: {
        totalProducts: totalProducts.count,
        totalParts: totalParts.count,
        openChangeRequests: openCRs.count,
        totalChangeRequests: totalCRs.count,
        highRiskPredictionsThisMonth: highRiskPreds.count,
        totalCostRisk: financialRisk.total || 0
      },
      recentCRs,
      categoryBreakdown
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
});

module.exports = router;
