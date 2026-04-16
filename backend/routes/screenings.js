const express = require("express");

const router = express.Router();
const { asyncHandler, protect, requirePatient } = require("../middleware");
const Screening = require("../models/Screening");
const { generateScreeningsForPatient } = require("../rules/screeningRules");
const { refreshScreenings } = require("../rules/refreshScreenings");

router.use(protect, requirePatient);

// POST /api/screenings — Add a screening record manually
router.post("/", asyncHandler(async (req, res) => {
  const screening = await Screening.create({ ...req.body, patient: req.patient._id });
  res.status(201).json({ success: true, data: screening });
}));

// GET /api/screenings — Get all screenings for patient
router.get("/", asyncHandler(async (req, res) => {
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

// PUT /api/screenings/:id/complete — Mark screening as completed with result + classification
router.put("/:id/complete", asyncHandler(async (req, res) => {
  const { result, completedDate, resultClassification, customNextDue } = req.body;
  const screening = await Screening.findOne({ _id: req.params.id, patient: req.patient._id });
  if (!screening) return res.status(404).json({ success: false, error: "Tamizaje no encontrado" });

  screening.lastDone = completedDate || new Date();
  if (result !== undefined) screening.result = result;
  if (resultClassification) {
    screening.resultClassification = resultClassification;
    // Adjust interval based on classification
    if (resultClassification === "borderline" && screening.borderlineInterval) {
      screening.intervalMonths = screening.borderlineInterval;
    } else if (resultClassification === "pathological" && screening.pathologicalInterval) {
      screening.intervalMonths = screening.pathologicalInterval;
    } else if (resultClassification === "normal" && screening.normalInterval) {
      screening.intervalMonths = screening.normalInterval;
    }
  }
  if (customNextDue) {
    screening.nextDue = new Date(customNextDue);
    screening._customNextDue = true; // flag to skip auto-calc in pre-save
  }

  await screening.save();
  res.json({ success: true, data: screening });
}));

// POST /api/screenings/generate — Generate + refresh screenings from rules engine
router.post("/generate", asyncHandler(async (req, res) => {
  const result = await refreshScreenings(req.patient);
  const allScreenings = await Screening.find({ patient: req.patient._id, isActive: true }).sort({ status: 1 });
  res.json({
    success: true,
    data: { ...result, screenings: allScreenings },
  });
}));

module.exports = router;
