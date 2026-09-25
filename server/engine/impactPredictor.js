const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/db');
const { GEMINI_API_KEY } = require('../config');

/**
 * Traverses the BOM graph to find where a part is used up to the root,
 * as well as sibling parts and direct sub-components.
 */
async function findAffectedParts(targetPartId, productId) {
  // Fetch all parts for the product
  const allParts = await query.all('SELECT * FROM parts WHERE product_id = ?', [productId]);
  const partsMap = new Map(allParts.map(p => [p.id, p]));
  
  const targetPart = partsMap.get(targetPartId);
  if (!targetPart) return [];

  const affectedMap = new Map();

  // 1. Traverse UP the BOM hierarchy (Where-Used path to root)
  let curr = targetPart;
  let depth = 1;
  while (curr && curr.parent_part_id) {
    const parent = partsMap.get(curr.parent_part_id);
    if (parent && !affectedMap.has(parent.id)) {
      affectedMap.set(parent.id, {
        part: parent,
        relationship: depth === 1 ? 'Direct Parent Assembly' : `Ancestor Assembly (Level ${depth})`,
        distance: depth
      });
      curr = parent;
      depth++;
    } else {
      break;
    }
  }

  // 2. Find SIBLINGS (parts under the same parent assembly)
  if (targetPart.parent_part_id) {
    for (const p of allParts) {
      if (p.id !== targetPartId && p.parent_part_id === targetPart.parent_part_id) {
        if (!affectedMap.has(p.id)) {
          affectedMap.set(p.id, {
            part: p,
            relationship: 'Co-Dependent Sibling Part',
            distance: 1
          });
        }
      }
    }
  }

  // 3. Find CHILD parts (if targetPart is a sub-assembly)
  for (const p of allParts) {
    if (p.parent_part_id === targetPartId && !affectedMap.has(p.id)) {
      affectedMap.set(p.id, {
        part: p,
        relationship: 'Child Sub-Component',
        distance: 1
      });
    }
  }

  // If hierarchy has very few items, include root assembly or top-level components
  if (affectedMap.size === 0) {
    const rootPart = allParts.find(p => !p.parent_part_id && p.id !== targetPartId);
    if (rootPart) {
      affectedMap.set(rootPart.id, {
        part: rootPart,
        relationship: 'System Level Master Assembly',
        distance: 2
      });
    }
  }

  return Array.from(affectedMap.values());
}

/**
 * Generates an impact prediction for each affected part using structured PLM heuristics.
 */
function generatePredictionData(targetPart, affectedInfo, title, description) {
  const { part: affectedPart, relationship, distance } = affectedInfo;

  // Impact types: cost, schedule, compliance, manufacturing, supplier
  let impactType = 'manufacturing';
  let impactScore = 50;
  let costDelta = 0;
  let delayDays = 0;
  let confidence = 0.90;
  let explanation = '';

  const isTargetElec = targetPart.category.toLowerCase().includes('elec') || targetPart.part_name.toLowerCase().includes('mcu') || targetPart.part_name.toLowerCase().includes('board');
  const isAffectedElec = affectedPart.category.toLowerCase().includes('elec');
  const isMech = affectedPart.category.toLowerCase().includes('mech');

  if (relationship.includes('Parent')) {
    impactType = isTargetElec ? 'manufacturing' : 'cost';
    impactScore = Math.min(95, Math.max(65, 90 - (distance * 10) + Math.floor(Math.random() * 8)));
    costDelta = Math.round(affectedPart.cost * (0.15 + Math.random() * 0.25));
    delayDays = Math.round(affectedPart.lead_time_days * 0.4 + 5);
    confidence = 0.94;
    explanation = `${relationship} '${affectedPart.part_name}' (${affectedPart.part_number}) requires dimensional fit re-verification, PCB layout adjustments, and assembly process tooling review.`;
  } else if (relationship.includes('Sibling')) {
    if (isTargetElec && isAffectedElec) {
      impactType = 'compliance';
      impactScore = Math.min(85, Math.max(55, 75 + Math.floor(Math.random() * 10)));
      costDelta = Math.round(affectedPart.cost * 0.2 + 250);
      delayDays = Math.round(affectedPart.lead_time_days * 0.3 + 3);
      confidence = 0.89;
      explanation = `Shared electrical bus interface with '${targetPart.part_name}' requires firmware protocol handshake update and signal timing re-calibration.`;
    } else {
      impactType = 'supplier';
      impactScore = Math.min(70, Math.max(40, 50 + Math.floor(Math.random() * 15)));
      costDelta = Math.round(affectedPart.cost * 0.1);
      delayDays = 4;
      confidence = 0.87;
      explanation = `Co-dependent component under assembly. Supplier '${affectedPart.supplier || 'Vendor'}' must be notified of mating interface tolerance revision.`;
    }
  } else if (relationship.includes('Child')) {
    impactType = 'schedule';
    impactScore = Math.min(80, Math.max(45, 60 + Math.floor(Math.random() * 15)));
    costDelta = Math.round(affectedPart.cost * 0.15);
    delayDays = Math.round(affectedPart.lead_time_days * 0.25 + 2);
    confidence = 0.91;
    explanation = `Sub-component '${affectedPart.part_name}' upstream feed will experience schedule offset during modification of parent unit.`;
  } else {
    impactType = 'cost';
    impactScore = 55;
    costDelta = Math.round(affectedPart.cost * 0.1);
    delayDays = 7;
    confidence = 0.85;
    explanation = `System master assembly compliance audit required due to design modification on '${targetPart.part_name}'.`;
  }

  return {
    affected_part_id: affectedPart.id,
    impact_type: impactType,
    impact_score: Number(impactScore.toFixed(1)),
    predicted_cost_delta: Number(costDelta.toFixed(2)),
    predicted_delay_days: Math.max(1, delayDays),
    confidence_score: Number(confidence.toFixed(2)),
    explanation
  };
}

/**
 * Main prediction orchestrator function.
 */
async function runImpactPrediction(changeRequestId) {
  // Fetch change request details
  const cr = await query.get(`
    SELECT cr.*, p.part_name, p.part_number, p.category, p.cost, p.supplier
    FROM change_requests cr
    JOIN parts p ON cr.part_id = p.id
    WHERE cr.id = ?
  `, [changeRequestId]);

  if (!cr) {
    throw new Error('Change Request not found.');
  }

  // Clear any existing predictions for this CR
  await query.run('DELETE FROM impact_predictions WHERE change_request_id = ?', [changeRequestId]);

  const targetPart = {
    id: cr.part_id,
    part_name: cr.part_name,
    part_number: cr.part_number,
    category: cr.category,
    cost: cr.cost,
    supplier: cr.supplier
  };

  // Find affected parts via BOM graph search
  const affectedNodes = await findAffectedParts(cr.part_id, cr.product_id);

  const predictions = [];

  for (const node of affectedNodes) {
    const predData = generatePredictionData(targetPart, node, cr.title, cr.description);
    const predId = `imp-${uuidv4().substring(0, 8)}`;

    await query.run(`
      INSERT INTO impact_predictions (
        id, change_request_id, affected_part_id, impact_type, impact_score,
        predicted_cost_delta, predicted_delay_days, confidence_score, explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      predId,
      changeRequestId,
      predData.affected_part_id,
      predData.impact_type,
      predData.impact_score,
      predData.predicted_cost_delta,
      predData.predicted_delay_days,
      predData.confidence_score,
      predData.explanation
    ]);

    predictions.push({ id: predId, ...predData });
  }

  return predictions;
}

module.exports = { runImpactPrediction, findAffectedParts };
