const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('./db');

async function seedDatabase() {
  const existingUsers = await query.all('SELECT id FROM users LIMIT 1');
  if (existingUsers.length > 0) {
    console.log('Database already populated with seed data.');
    return;
  }

  console.log('Seeding initial PLM data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users
  const users = [
    { id: 'u-eng-01', full_name: 'Alex Chen', email: 'engineer@acmplm.com', company_role: 'Lead Avionics Engineer', role: 'engineer' },
    { id: 'u-mgr-01', full_name: 'Sarah Jenkins', email: 'manager@acmplm.com', company_role: 'Engineering Program Manager', role: 'manager' },
    { id: 'u-adm-01', full_name: 'Marcus Vance', email: 'admin@acmplm.com', company_role: 'Chief Technology Officer', role: 'admin' }
  ];

  for (const u of users) {
    await query.run(
      `INSERT INTO users (id, full_name, email, company_role, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.id, u.full_name, u.email, u.company_role, passwordHash, u.role]
    );
  }

  // 2. Seed Products
  const products = [
    {
      id: 'prod-apex-drone',
      name: 'Apex-V Autonomous Delivery Drone',
      description: 'Heavy-lift autonomous UAV engineered for medical and emergency payload transport in GPS-denied environments.',
      created_by: 'u-eng-01'
    },
    {
      id: 'prod-titan-ev',
      name: 'Titan-EV 75kWh Battery Pack',
      description: 'Modular high-voltage liquid-cooled energy storage system designed for commercial utility electric vehicles.',
      created_by: 'u-mgr-01'
    }
  ];

  for (const p of products) {
    await query.run(
      `INSERT INTO products (id, name, description, created_by) VALUES (?, ?, ?, ?)`,
      [p.id, p.name, p.description, p.created_by]
    );
  }

  // 3. Seed Parts Hierarchy for Apex-V Drone
  const parts = [
    // Product 1: Apex Drone
    { id: 'p-apex-root', product_id: 'prod-apex-drone', part_number: 'ASY-APX-001', part_name: 'Apex-V Drone Master Airframe Assembly', parent_part_id: null, category: 'mechanical', supplier: 'In-House Assembly', cost: 4200.00, lead_time_days: 35 },
    
    // Avionics Subsystem
    { id: 'p-avionics', product_id: 'prod-apex-drone', part_number: 'SUB-AVX-100', part_name: 'Flight Avionics Stack Assembly', parent_part_id: 'p-apex-root', category: 'electrical', supplier: 'AeroElectronics Systems', cost: 1250.00, lead_time_days: 25 },
    { id: 'p-mcu', product_id: 'prod-apex-drone', part_number: 'PCB-MCU-204', part_name: 'Main Flight MCU Logic Board', parent_part_id: 'p-avionics', category: 'electrical', supplier: 'MicroTech Solutions', cost: 480.00, lead_time_days: 28 },
    { id: 'p-imu', product_id: 'prod-apex-drone', part_number: 'SEN-IMU-601', part_name: 'Triple-Redundant 6-DOF IMU Sensor', parent_part_id: 'p-avionics', category: 'electrical', supplier: 'Sensortron Labs', cost: 110.00, lead_time_days: 14 },
    { id: 'p-telemetry', product_id: 'prod-apex-drone', part_number: 'MOD-TEL-900', part_name: 'Long-Range 900MHz Telemetry Transceiver', parent_part_id: 'p-avionics', category: 'electrical', supplier: 'RadioSky RF Systems', cost: 145.00, lead_time_days: 18 },

    // Propulsion Subsystem
    { id: 'p-propulsion', product_id: 'prod-apex-drone', part_number: 'SUB-PRP-200', part_name: 'Quad Motor & Drive Assembly', parent_part_id: 'p-apex-root', category: 'mechanical', supplier: 'AeroDrive Dynamics', cost: 1400.00, lead_time_days: 21 },
    { id: 'p-motor', product_id: 'prod-apex-drone', part_number: 'MOT-BL-850', part_name: '850KV High-Torque Brushless Motor', parent_part_id: 'p-propulsion', category: 'mechanical', supplier: 'AeroDrive Dynamics', cost: 185.00, lead_time_days: 20 },
    { id: 'p-esc', product_id: 'prod-apex-drone', part_number: 'ESC-60A-HV', part_name: '60A HV Opto-Isolated ESC Module', parent_part_id: 'p-propulsion', category: 'electrical', supplier: 'PowerPulse Corp', cost: 95.00, lead_time_days: 12 },
    { id: 'p-propeller', product_id: 'prod-apex-drone', part_number: 'PRP-CF-1445', part_name: '14x4.5 Carbon Fiber Propeller Set', parent_part_id: 'p-propulsion', category: 'mechanical', supplier: 'Composite Flight', cost: 65.00, lead_time_days: 7 },

    // Structural Subsystem
    { id: 'p-airframe', product_id: 'prod-apex-drone', part_number: 'SUB-STR-300', part_name: 'Carbon Fiber Frame Chassis', parent_part_id: 'p-apex-root', category: 'mechanical', supplier: 'CarbonFab Composites', cost: 890.00, lead_time_days: 30 },
    { id: 'p-arm-bracket', product_id: 'prod-apex-drone', part_number: 'BRK-TIT-012', part_name: 'CNC Titanium Motor Arm Clamp', parent_part_id: 'p-airframe', category: 'mechanical', supplier: 'Precision CNC Works', cost: 72.00, lead_time_days: 15 },

    // Product 2: Titan EV Power Pack
    { id: 'p-ev-root', product_id: 'prod-titan-ev', part_number: 'ASY-EV-75K', part_name: 'Titan-EV 75kWh Pack Assembly', parent_part_id: null, category: 'mechanical', supplier: 'Titan Power Systems', cost: 8500.00, lead_time_days: 45 },
    { id: 'p-bms', product_id: 'prod-titan-ev', part_number: 'SUB-BMS-500', part_name: 'Master BMS Management Stack', parent_part_id: 'p-ev-root', category: 'electrical', supplier: 'VoltTech Logic', cost: 980.00, lead_time_days: 32 },
    { id: 'p-bms-board', product_id: 'prod-titan-ev', part_number: 'PCB-BMS-501', part_name: 'BMS Safety & Cell Balance PCB', parent_part_id: 'p-bms', category: 'electrical', supplier: 'VoltTech Logic', cost: 410.00, lead_time_days: 28 },
    { id: 'p-cool-plate', product_id: 'prod-titan-ev', part_number: 'PLT-CLM-880', part_name: 'Aluminum Cold Plate Heat Exchanger', parent_part_id: 'p-ev-root', category: 'mechanical', supplier: 'ThermalFlow Eng', cost: 350.00, lead_time_days: 24 }
  ];

  for (const part of parts) {
    await query.run(
      `INSERT INTO parts (id, product_id, part_number, part_name, parent_part_id, category, supplier, cost, lead_time_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [part.id, part.product_id, part.part_number, part.part_name, part.parent_part_id, part.category, part.supplier, part.cost, part.lead_time_days]
    );
  }

  // 4. Seed Demo Change Request & Predictions
  const demoCrId = 'cr-demo-ecn-88';
  await query.run(
    `INSERT INTO change_requests (id, product_id, part_id, title, description, requested_by, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      demoCrId,
      'prod-apex-drone',
      'p-mcu',
      'ECN-2026-88: Microprocessor Upgrade & Pinout Spec Revision',
      'Upgrading Main Flight MCU PCB to dual-core processor to support real-time lidar obstacle processing. Pinout shifts affect telemetry bus & IMU SPI interface frequency.',
      'u-eng-01',
      'under_review'
    ]
  );

  const demoPredictions = [
    {
      id: 'imp-01',
      change_request_id: demoCrId,
      affected_part_id: 'p-avionics',
      impact_type: 'manufacturing',
      impact_score: 88,
      predicted_cost_delta: 2400.00,
      predicted_delay_days: 14,
      confidence_score: 0.94,
      explanation: 'Direct parent sub-assembly require complete re-qualification of PCB mounting drill patterns and power distribution bus thermal compliance.'
    },
    {
      id: 'imp-02',
      change_request_id: demoCrId,
      affected_part_id: 'p-telemetry',
      impact_type: 'compliance',
      impact_score: 76,
      predicted_cost_delta: 850.00,
      predicted_delay_days: 10,
      confidence_score: 0.89,
      explanation: 'Telemetry transceiver requires firmware protocol update to support 3.3V to 1.8V SPI logic shift on the upgraded MCU bus.'
    },
    {
      id: 'imp-03',
      change_request_id: demoCrId,
      affected_part_id: 'p-esc',
      impact_type: 'schedule',
      impact_score: 62,
      predicted_cost_delta: 400.00,
      predicted_delay_days: 7,
      confidence_score: 0.91,
      explanation: 'Electronic Speed Controller PWM timing loop synchronization must be re-calibrated against the new MCU clock source.'
    },
    {
      id: 'imp-04',
      change_request_id: demoCrId,
      affected_part_id: 'p-apex-root',
      impact_type: 'cost',
      impact_score: 54,
      predicted_cost_delta: 3650.00,
      predicted_delay_days: 18,
      confidence_score: 0.92,
      explanation: 'Root drone assembly validation requires full system bench testing and FCC re-certification audit due to clock frequency changes.'
    }
  ];

  for (const imp of demoPredictions) {
    await query.run(
      `INSERT INTO impact_predictions (id, change_request_id, affected_part_id, impact_type, impact_score, predicted_cost_delta, predicted_delay_days, confidence_score, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [imp.id, imp.change_request_id, imp.affected_part_id, imp.impact_type, imp.impact_score, imp.predicted_cost_delta, imp.predicted_delay_days, imp.confidence_score, imp.explanation]
    );
  }

  // 5. Seed Audit Log for initial submission
  await query.run(
    `INSERT INTO audit_logs (id, change_request_id, action, performed_by, comments)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'aud-01',
      demoCrId,
      'SUBMITTED',
      'u-eng-01',
      'Initial submission of ECN-2026-88 with 4 automated AI impact predictions generated.'
    ]
  );

  console.log('Database successfully seeded with demo PLM products, BOM hierarchy, and change request!');
}

module.exports = { seedDatabase };
