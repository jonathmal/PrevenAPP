const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const { Medication, MedLog } = require("../models");

// POST /api/medications — Add a medication
router.post("/", protect, asyncHandler(async (req, res) => {
  const med = await Medication.create({ ...req.body, patient: req.patient._id });
  res.status(201).json({ success: true, data: med });
}));

// GET /api/medications — Get active medications
router.get("/", protect, asyncHandler(async (req, res) => {
  const meds = await Medication.find({ patient: req.patient._id, isActive: true })
    .sort({ name: 1 });
  res.json({ success: true, count: meds.length, data: meds });
}));

// PUT /api/medications/:id — Update medication
router.put("/:id", protect, asyncHandler(async (req, res) => {
  const med = await Medication.findOneAndUpdate(
    { _id: req.params.id, patient: req.patient._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!med) return res.status(404).json({ success: false, error: "Medicamento no encontrado" });
  res.json({ success: true, data: med });
}));

// DELETE /api/medications/:id — Deactivate medication
router.delete("/:id", protect, asyncHandler(async (req, res) => {
  const med = await Medication.findOneAndUpdate(
    { _id: req.params.id, patient: req.patient._id },
    { isActive: false, endDate: new Date() },
    { new: true }
  );
  if (!med) return res.status(404).json({ success: false, error: "Medicamento no encontrado" });
  res.json({ success: true, data: med });
}));

// ─── Daily Tracking ──────────────────────────────────────

// POST /api/medications/log — Record a dose taken/skipped
router.post("/log", protect, asyncHandler(async (req, res) => {
  const { medicationId, scheduledTime, taken, skippedReason } = req.body;
  const date = new Date().toISOString().split("T")[0];

  const log = await MedLog.findOneAndUpdate(
    { patient: req.patient._id, medication: medicationId, date },
    {
      patient: req.patient._id, medication: medicationId, date,
      scheduledTime, taken,
      takenAt: taken ? new Date() : undefined,
      skippedReason: !taken ? skippedReason : undefined,
    },
    { upsert: true, new: true, runValidators: true }
  );
  res.json({ success: true, data: log });
}));

// GET /api/medications/log/today — Today's medication log
router.get("/log/today", protect, asyncHandler(async (req, res) => {
  const date = new Date().toISOString().split("T")[0];
  const meds = await Medication.find({ patient: req.patient._id, isActive: true });
  const logs = await MedLog.find({ patient: req.patient._id, date });

  const result = meds.map(med => {
    const log = logs.find(l => l.medication.toString() === med._id.toString());
    return {
      medication: med,
      taken: log?.taken || false,
      takenAt: log?.takenAt,
      logId: log?._id,
    };
  });

  const taken = result.filter(r => r.taken).length;
  const adherenceToday = meds.length > 0 ? Math.round((taken / meds.length) * 100) : 100;

  res.json({ success: true, data: { medications: result, adherenceToday, taken, total: meds.length } });
}));

// GET /api/medications/log/adherence — Adherence stats
router.get("/log/adherence", protect, asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));
  const dateStr = since.toISOString().split("T")[0];

  const logs = await MedLog.find({
    patient: req.patient._id,
    date: { $gte: dateStr },
  });

  const totalDoses = logs.length;
  const takenDoses = logs.filter(l => l.taken).length;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  // Daily breakdown
  const byDay = {};
  logs.forEach(l => {
    if (!byDay[l.date]) byDay[l.date] = { total: 0, taken: 0 };
    byDay[l.date].total++;
    if (l.taken) byDay[l.date].taken++;
  });

  const dailyAdherence = Object.entries(byDay).map(([date, data]) => ({
    date, adherence: Math.round((data.taken / data.total) * 100),
  })).sort((a, b) => a.date.localeCompare(b.date));

  res.json({ success: true, data: { adherenceRate, totalDoses, takenDoses, dailyAdherence } });
}));

module.exports = router;
