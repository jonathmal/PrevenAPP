const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const Screening = require("../models/Screening");
const { generateScreeningsForPatient } = require("../rules/screeningRules");
const { refreshScreenings } = require("../rules/refreshScreenings");

// POST /api/screenings — Add a screening record manually
router.post("/", protect, asyncHandler(async (req, res) => {
  const screening = await Screening.create({ ...req.body, patient: req.patient._id });
  res.status(201).json({ success: true, data: screening });
}));

// GET /api/screenings — Get all screenings for patient
router.get("/", protect, asyncHandler(async (req, res) => {
  const screenings = await Screening.find({ patient: req.patient._id, isActive: true })
    .sort({ status: 1 });
  const summary = {
    total: screenings.length,
    red: screenings.filter(s => s.status === "red").length,
    yellow: screenings.filter(s => s.status === "yellow").length,
    green: screenings.filter(s => s.status === "green").length,
  };
  res.json({ success: true, data: screenings, summary });
}));

// PUT /api/screenings/:id/complete — Mark screening as completed with result
router.put("/:id/complete", protect, asyncHandler(async (req, res) => {
  const { result, completedDate } = req.body;
  const screening = await Screening.findOne({ _id: req.params.id, patient: req.patient._id });
  if (!screening) return res.status(404).json({ success: false, error: "Tamizaje no encontrado" });
  screening.lastDone = completedDate || new Date();
  if (result !== undefined) screening.result = result;
  await screening.save(); // pre-save hook recalculates status → green/yellow based on interval
  res.json({ success: true, data: screening });
}));

// POST /api/screenings/generate — Generate + refresh screenings from rules engine
router.post("/generate", protect, asyncHandler(async (req, res) => {
  const result = await refreshScreenings(req.patient);
  const allScreenings = await Screening.find({ patient: req.patient._id, isActive: true }).sort({ status: 1 });
  res.json({
    success: true,
    data: { ...result, screenings: allScreenings },
  });
}));

module.exports = router;
