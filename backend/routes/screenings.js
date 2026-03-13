const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const Screening = require("../models/Screening");
const { generateScreeningsForPatient } = require("../rules/screeningRules");

// POST /api/screenings — Add a screening record manually
router.post("/", protect, asyncHandler(async (req, res) => {
  const screening = await Screening.create({ ...req.body, patient: req.patient._id });
  res.status(201).json({ success: true, data: screening });
}));

// GET /api/screenings — Get all screenings for patient
router.get("/", protect, asyncHandler(async (req, res) => {
  const screenings = await Screening.find({ patient: req.patient._id, isActive: true })
    .sort({ status: 1 }); // red first

  const summary = {
    total: screenings.length,
    red: screenings.filter(s => s.status === "red").length,
    yellow: screenings.filter(s => s.status === "yellow").length,
    green: screenings.filter(s => s.status === "green").length,
  };

  res.json({ success: true, data: screenings, summary });
}));

// PUT /api/screenings/:id — Update screening
router.put("/:id", protect, asyncHandler(async (req, res) => {
  const screening = await Screening.findOneAndUpdate(
    { _id: req.params.id, patient: req.patient._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!screening) return res.status(404).json({ success: false, error: "Tamizaje no encontrado" });
  res.json({ success: true, data: screening });
}));

// PUT /api/screenings/:id/complete — Mark screening as completed
router.put("/:id/complete", protect, asyncHandler(async (req, res) => {
  const { result, completedDate } = req.body;
  const screening = await Screening.findOne({ _id: req.params.id, patient: req.patient._id });
  if (!screening) return res.status(404).json({ success: false, error: "Tamizaje no encontrado" });

  screening.lastDone = completedDate || new Date();
  if (result) screening.result = result;
  await screening.save(); // triggers status recalculation

  res.json({ success: true, data: screening });
}));

// ═══════════════════════════════════════════════════════════════
// POST /api/screenings/generate — Auto-generate screenings using
// the rules engine based on complete patient profile
// ═══════════════════════════════════════════════════════════════
router.post("/generate", protect, asyncHandler(async (req, res) => {
  const patient = req.patient;

  // Run the rules engine
  const recommended = generateScreeningsForPatient(patient);

  // Find existing screenings to avoid duplicates
  const existing = await Screening.find({ patient: patient._id, isActive: true });
  const existingNames = new Set(existing.map(s => s.name.toLowerCase()));

  // Create only new screenings
  const created = [];
  for (const rec of recommended) {
    // Check for name match (case-insensitive, partial matching for renamed screenings)
    const alreadyExists = existingNames.has(rec.name.toLowerCase()) ||
      existing.some(e => {
        const eName = e.name.toLowerCase();
        const rName = rec.name.toLowerCase();
        // Fuzzy match: if 70%+ of the words match
        const eWords = eName.split(/\s+/);
        const rWords = rName.split(/\s+/);
        const matches = rWords.filter(w => eWords.some(ew => ew.includes(w) || w.includes(ew)));
        return matches.length >= Math.min(eWords.length, rWords.length) * 0.6;
      });

    if (!alreadyExists) {
      const screening = await Screening.create({
        patient: patient._id,
        name: rec.name,
        category: rec.category,
        intervalMonths: rec.intervalMonths,
        reason: rec.reason,
        source: rec.source,
        priority: rec.priority,
      });
      created.push(screening);
    }
  }

  // Also update existing screenings with reason/source if they don't have them
  for (const ex of existing) {
    if (!ex.reason) {
      const match = recommended.find(r =>
        r.name.toLowerCase() === ex.name.toLowerCase()
      );
      if (match) {
        ex.reason = match.reason;
        ex.source = match.source;
        ex.priority = match.priority;
        await ex.save();
      }
    }
  }

  // Return all screenings
  const allScreenings = await Screening.find({ patient: patient._id, isActive: true })
    .sort({ status: 1 });

  res.json({
    success: true,
    data: {
      created: created.length,
      existing: existing.length,
      total: allScreenings.length,
      rulesEvaluated: recommended.length,
      screenings: allScreenings,
    },
  });
}));

module.exports = router;
