const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const { Vaccination } = require("../models");

// GET /api/vaccinations — Get all vaccination records for patient
router.get("/", protect, asyncHandler(async (req, res) => {
  const records = await Vaccination.find({ patient: req.patient._id }).sort({ dateAdministered: -1 });
  res.json({ success: true, data: records });
}));

// POST /api/vaccinations — Record a vaccine dose
router.post("/", protect, asyncHandler(async (req, res) => {
  const { vaccineKey, vaccineName, doseLabel, dateAdministered, notes } = req.body;
  const record = await Vaccination.findOneAndUpdate(
    { patient: req.patient._id, vaccineKey },
    { patient: req.patient._id, vaccineKey, vaccineName, doseLabel, dateAdministered, notes, administeredBy: req.user.name },
    { upsert: true, new: true, runValidators: true }
  );
  res.json({ success: true, data: record });
}));

// DELETE /api/vaccinations/:key — Remove a vaccination record
router.delete("/:key", protect, asyncHandler(async (req, res) => {
  await Vaccination.findOneAndDelete({ patient: req.patient._id, vaccineKey: req.params.key });
  res.json({ success: true });
}));

module.exports = router;
