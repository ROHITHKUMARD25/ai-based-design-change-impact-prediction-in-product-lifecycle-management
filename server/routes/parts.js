const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { findAffectedParts } = require('../engine/impactPredictor');

// GET /api/parts/:id - Get single part info with parent & children
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const part = await query.get(`
      SELECT p.*, prod.name as product_name, parent.part_name as parent_part_name, parent.part_number as parent_part_number
      FROM parts p
      JOIN products prod ON p.product_id = prod.id
      LEFT JOIN parts parent ON p.parent_part_id = parent.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!part) {
      return res.status(404).json({ error: 'Part not found.' });
    }

    const children = await query.all('SELECT * FROM parts WHERE parent_part_id = ?', [req.params.id]);

    return res.json({ part, children });
  } catch (err) {
    console.error('Error fetching part:', err);
    return res.status(500).json({ error: 'Failed to fetch part.' });
  }
});

// GET /api/parts/:id/where-used - Trace where-used hierarchy
router.get('/:id/where-used', authenticateToken, async (req, res) => {
  try {
    const part = await query.get('SELECT * FROM parts WHERE id = ?', [req.params.id]);
    if (!part) {
      return res.status(404).json({ error: 'Part not found.' });
    }

    const affectedNodes = await findAffectedParts(part.id, part.product_id);
    return res.json({ targetPart: part, whereUsed: affectedNodes });
  } catch (err) {
    console.error('Error tracing where-used:', err);
    return res.status(500).json({ error: 'Failed to trace where-used hierarchy.' });
  }
});

// POST /api/parts - Add part to BOM
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, part_number, part_name, parent_part_id, category, supplier, cost, lead_time_days } = req.body;

    if (!product_id || !part_number || !part_name || !category) {
      return res.status(400).json({ error: 'Please provide product ID, part number, part name, and category.' });
    }

    const partId = `part-${uuidv4().substring(0, 8)}`;
    await query.run(`
      INSERT INTO parts (id, product_id, part_number, part_name, parent_part_id, category, supplier, cost, lead_time_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      partId,
      product_id,
      part_number.trim(),
      part_name.trim(),
      parent_part_id || null,
      category,
      supplier ? supplier.trim() : 'Internal',
      cost ? parseFloat(cost) : 0,
      lead_time_days ? parseInt(lead_time_days) : 0
    ]);

    const newPart = await query.get('SELECT * FROM parts WHERE id = ?', [partId]);
    return res.status(201).json({ message: 'Part added to BOM successfully!', part: newPart });
  } catch (err) {
    console.error('Error adding part:', err);
    return res.status(500).json({ error: 'Failed to add part.' });
  }
});

module.exports = router;
