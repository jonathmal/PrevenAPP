const express = require("express");

const router = express.Router();
const { asyncHandler, protect, requirePatient } = require("../middleware");
const { BPReading, GlucoseReading, WeightReading, Patient } = require("../models");

router.use(protect, requirePatient);

// ═══════════════════════════════════════════════════════════
// BLOOD PRESSURE
// ═══════════════════════════════════════════════════════════

// POST /api/vitals/bp — Record a BP reading
router.post("/bp", asyncHandler(async (req, res) => {
  const { systolic, diastolic, heartRate, source, notes, measuredAt } = req.body;
  const reading = await BPReading.create({
    patient: req.patient._id,
    systolic, diastolic, heartRate, source, notes,
    measuredAt: measuredAt || Date.now(),
  });
  res.status(201).json({ success: true, data: reading });
}));

// GET /api/vitals/bp — Get BP history
router.get("/bp", asyncHandler(async (req, res) => {
  const { limit = 30, days } = req.query;
  const query = { patient: req.patient._id };
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    query.measuredAt = { $gte: since };
  }
  const readings = await BPReading.find(query)
    .sort({ measuredAt: -1 })
    .limit(parseInt(limit));
  res.json({ success: true, count: readings.length, data: readings });
}));

// GET /api/vitals/bp/latest — Last reading
router.get("/bp/latest", asyncHandler(async (req, res) => {
  const reading = await BPReading.findOne({ patient: req.patient._id })
    .sort({ measuredAt: -1 });
  res.json({ success: true, data: reading });
}));

// GET /api/vitals/bp/stats — Stats for a period
router.get("/bp/stats", asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  const stats = await BPReading.aggregate([
    { $match: { patient: req.patient._id, measuredAt: { $gte: since } } },
    {
      $group: {
        _id: null,
        avgSystolic: { $avg: "$systolic" },
        avgDiastolic: { $avg: "$diastolic" },
        maxSystolic: { $max: "$systolic" },
        minSystolic: { $min: "$systolic" },
        totalReadings: { $sum: 1 },
        controlledCount: {
          $sum: { $cond: [{ $and: [{ $lt: ["$systolic", 140] }, { $lt: ["$diastolic", 90] }] }, 1, 0] },
        },
      },
    },
  ]);

  const result = stats[0] || { avgSystolic: 0, avgDiastolic: 0, totalReadings: 0, controlledCount: 0 };
  result.controlRate = result.totalReadings > 0
    ? Math.round((result.controlledCount / result.totalReadings) * 100)
    : 0;

  res.json({ success: true, data: result });
}));

// ═══════════════════════════════════════════════════════════
// GLUCOSE
// ═══════════════════════════════════════════════════════════

// POST /api/vitals/glucose
router.post("/glucose", asyncHandler(async (req, res) => {
  const { value, type, source, notes, measuredAt } = req.body;
  const reading = await GlucoseReading.create({
    patient: req.patient._id,
    value, type: type || "fasting", source, notes,
    measuredAt: measuredAt || Date.now(),
  });
  res.status(201).json({ success: true, data: reading });
}));

// GET /api/vitals/glucose
router.get("/glucose", asyncHandler(async (req, res) => {
  const { limit = 30, days, type } = req.query;
  const query = { patient: req.patient._id };
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    query.measuredAt = { $gte: since };
  }
  if (type) query.type = type;
  const readings = await GlucoseReading.find(query)
    .sort({ measuredAt: -1 })
    .limit(parseInt(limit));
  res.json({ success: true, count: readings.length, data: readings });
}));

// GET /api/vitals/glucose/latest
router.get("/glucose/latest", asyncHandler(async (req, res) => {
  const reading = await GlucoseReading.findOne({ patient: req.patient._id })
    .sort({ measuredAt: -1 });
  res.json({ success: true, data: reading });
}));

// ═══════════════════════════════════════════════════════════
// WEIGHT
// ═══════════════════════════════════════════════════════════

// POST /api/vitals/weight
router.post("/weight", asyncHandler(async (req, res) => {
  const { value, measuredAt } = req.body;
  // Compute BMI if patient has height
  let bmi = null;
  if (req.patient.height) {
    bmi = parseFloat((value / Math.pow(req.patient.height / 100, 2)).toFixed(1));
  }
  // Also update patient's latest weight
  await Patient.findByIdAndUpdate(req.patient._id, { weight: value });

  const reading = await WeightReading.create({
    patient: req.patient._id, value, bmi,
    measuredAt: measuredAt || Date.now(),
  });
  res.status(201).json({ success: true, data: reading });
}));

// GET /api/vitals/weight
router.get("/weight", asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;
  const readings = await WeightReading.find({ patient: req.patient._id })
    .sort({ measuredAt: -1 })
    .limit(parseInt(limit));
  res.json({ success: true, count: readings.length, data: readings });
}));

module.exports = router;
