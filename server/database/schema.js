const { query } = require('./db');

async function initDatabaseSchema() {
  console.log('Initializing database schema and indexes...');
  
  await query.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      company_role TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'engineer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      part_number TEXT NOT NULL,
      part_name TEXT NOT NULL,
      parent_part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      supplier TEXT,
      cost REAL DEFAULT 0,
      lead_time_days INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS change_requests (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      requested_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'under_review',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS impact_predictions (
      id TEXT PRIMARY KEY,
      change_request_id TEXT NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
      affected_part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
      impact_type TEXT NOT NULL,
      impact_score REAL NOT NULL,
      predicted_cost_delta REAL DEFAULT 0,
      predicted_delay_days INTEGER DEFAULT 0,
      confidence_score REAL NOT NULL DEFAULT 0.9,
      explanation TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      change_request_id TEXT NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      performed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      comments TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high-performance BOM traversal and where-used lookup
    CREATE INDEX IF NOT EXISTS idx_parts_product_id ON parts(product_id);
    CREATE INDEX IF NOT EXISTS idx_parts_parent_part_id ON parts(parent_part_id);
    CREATE INDEX IF NOT EXISTS idx_change_requests_product_id ON change_requests(product_id);
    CREATE INDEX IF NOT EXISTS idx_change_requests_part_id ON change_requests(part_id);
    CREATE INDEX IF NOT EXISTS idx_impact_predictions_cr_id ON impact_predictions(change_request_id);
    CREATE INDEX IF NOT EXISTS idx_impact_predictions_part_id ON impact_predictions(affected_part_id);
  `);

  console.log('Database schema and indexes initialized successfully.');
}

module.exports = { initDatabaseSchema };
