/**
 * refreshScreenings(patient)
 * 
 * Re-evaluates all screening rules for a patient and:
 * 1. Creates new screenings that the rules engine recommends but don't exist yet
 * 2. Updates existing screenings with reason/source/priority if missing
 * 3. Deactivates screenings that no longer apply (e.g. diagnosis removed)
 * 4. Preserves lastDone/result for existing screenings (doesn't reset progress)
 *
 * Call this after any patient profile change (diagnoses, familyHistory, riskFactors, etc.)
 */
const Screening = require("../models/Screening");
const { generateScreeningsForPatient } = require("./screeningRules");

async function refreshScreenings(patient) {
  // Run rules engine against current patient data
  const recommended = generateScreeningsForPatient(patient);
  const recommendedNames = new Set(recommended.map(r => r.name.toLowerCase()));

  // Get all existing active screenings
  const existing = await Screening.find({ patient: patient._id, isActive: true });
  const existingByName = {};
  existing.forEach(e => { existingByName[e.name.toLowerCase()] = e; });

  let created = 0;
  let updated = 0;
  let deactivated = 0;

  // 1. Create new screenings that don't exist yet
  for (const rec of recommended) {
    const key = rec.name.toLowerCase();
    const match = existingByName[key] || existing.find(e => fuzzyMatch(e.name, rec.name));

    if (!match) {
      await Screening.create({
        patient: patient._id,
        name: rec.name,
        category: rec.category,
        intervalMonths: rec.intervalMonths,
        normalInterval: rec.normalInterval,
        borderlineInterval: rec.borderlineInterval,
        pathologicalInterval: rec.pathologicalInterval,
        reason: rec.reason,
        source: rec.source,
        priority: rec.priority,
      });
      created++;
    } else {
      // 2. Update existing with latest reason/source/priority/intervals
      let changed = false;
      if (rec.reason && match.reason !== rec.reason) { match.reason = rec.reason; changed = true; }
      if (rec.source && match.source !== rec.source) { match.source = rec.source; changed = true; }
      if (rec.priority && match.priority !== rec.priority) { match.priority = rec.priority; changed = true; }
      if (rec.intervalMonths !== match.intervalMonths) { match.intervalMonths = rec.intervalMonths; changed = true; }
      if (rec.normalInterval && rec.normalInterval !== match.normalInterval) { match.normalInterval = rec.normalInterval; changed = true; }
      if (rec.borderlineInterval && rec.borderlineInterval !== match.borderlineInterval) { match.borderlineInterval = rec.borderlineInterval; changed = true; }
      if (rec.pathologicalInterval && rec.pathologicalInterval !== match.pathologicalInterval) { match.pathologicalInterval = rec.pathologicalInterval; changed = true; }
      if (changed) {
        await match.save();
        updated++;
      }
    }
  }

  // 3. Deactivate screenings that no longer apply
  for (const ex of existing) {
    const stillRecommended = recommended.some(r => fuzzyMatch(r.name, ex.name));
    if (!stillRecommended) {
      // Only deactivate if it was auto-generated (has a reason) and hasn't been completed
      // Keep manually-added or completed screenings active
      if (ex.reason && !ex.lastDone) {
        ex.isActive = false;
        await ex.save();
        deactivated++;
      }
    }
  }

  return { created, updated, deactivated, totalRules: recommended.length };
}

function fuzzyMatch(nameA, nameB) {
  const a = nameA.toLowerCase();
  const b = nameB.toLowerCase();
  if (a === b) return true;
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  const matches = wordsB.filter(w => wordsA.some(wa => wa.includes(w) || w.includes(wa)));
  return matches.length >= Math.min(wordsA.length, wordsB.length) * 0.6;
}

module.exports = { refreshScreenings };
