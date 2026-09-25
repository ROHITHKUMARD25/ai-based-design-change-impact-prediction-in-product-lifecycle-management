const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Helper to construct nested BOM tree from flat list of parts
function buildBOMTree(parts) {
  const map = new Map();
  const roots = [];

  parts.forEach(p => {
    map.set(p.id, { ...p, children: [] });
  });

  parts.forEach(p => {
    if (p.parent_part_id && map.has(p.parent_part_id)) {
      map.get(p.parent_part_id).children.push(map.get(p.id));
    } else {
      roots.push(map.get(p.id));
    }
  });

  return roots;
}

// GET /api/products - List products with metrics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const products = await query.all(`
      SELECT p.*, u.full_name as creator_name,
        (SELECT COUNT(*) FROM parts WHERE product_id = p.id) as total_parts,
        (SELECT COUNT(*) FROM change_requests WHERE product_id = p.id AND status = 'under_review') as open_change_requests
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);
    return res.json({ products });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/:id - Get single product with full BOM tree
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await query.get(`
      SELECT p.*, u.full_name as creator_name
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const parts = await query.all(`
      SELECT p.*,
        (SELECT COUNT(*) FROM parts child WHERE child.parent_part_id = p.id) as child_count
      FROM parts p
      WHERE p.product_id = ?
      ORDER BY p.part_number ASC
    `, [req.params.id]);

    const bomTree = buildBOMTree(parts);

    return res.json({ product, parts, bomTree });
  } catch (err) {
    console.error('Error fetching product BOM:', err);
    return res.status(500).json({ error: 'Failed to fetch product BOM.' });
  }
});

// POST /api/products - Create product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Product name is required.' });
    }

    const productId = `prod-${uuidv4().substring(0, 8)}`;
    await query.run(
      `INSERT INTO products (id, name, description, created_by) VALUES (?, ?, ?, ?)`,
      [productId, name.trim(), description ? description.trim() : '', req.user.id]
    );

    // Also auto-create a root assembly part for this product
    const rootPartId = `part-${uuidv4().substring(0, 8)}`;
    const rootPartNumber = `ASY-${name.substring(0, 3).toUpperCase()}-001`;
    await query.run(
      `INSERT INTO parts (id, product_id, part_number, part_name, parent_part_id, category, supplier, cost, lead_time_days)
       VALUES (?, ?, ?, ?, NULL, 'mechanical', 'In-House Assembly', 1000.00, 30)`,
      [rootPartId, productId, rootPartNumber, `${name} Master Assembly`]
    );

    const newProduct = await query.get('SELECT * FROM products WHERE id = ?', [productId]);
    return res.status(201).json({ message: 'Product created successfully!', product: newProduct });
  } catch (err) {
    console.error('Error creating product:', err);
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

module.exports = router;
