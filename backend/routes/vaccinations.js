const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const { Vaccination } = require("../models");

// Next-dose chain: { currentKey: { nextKey, nextLabel, monthsUntil } }
const DOSE_CHAIN = {
  td_dose1: { nextKey: "td_dose2", nextLabel: "Td 2.ª dosis", months: 1 },
  td_dose2: { nextKey: "td_dose3", nextLabel: "Td 3.ª dosis / Refuerzo", months: 12 },
  td_dose3: { nextKey: "td_refuerzo", nextLabel: "Td Refuerzo", months: 120 }, // 10 years
  td_refuerzo: { nextKey: "td_refuerzo", nextLabel: "Td Refuerzo", months: 120 },
  hepb_risk_1: { nextKey: "hepb_risk_2", nextLabel: "Hepatitis B 2.ª dosis", months: 1 },
  hepb_risk_2: { nextKey: "hepb_risk_3", nextLabel: "Hepatitis B 3.ª dosis", months: 5 }, // 6m from dose 1 = 5m from dose 2
  tdap_60: { nextKey: "tdap_60_ref", nextLabel: "Tdap Refuerzo", months: 120 },
};

// Annual vaccines — next dose is same key, 12 months later
const ANNUAL_KEYS = [
  "influenza_", "covid_", "influenza_pregnancy", "covid_pregnancy",
];

function computeNextDose(key, dateAdministered) {
  const d = new Date(dateAdministered);

  // Check chain
  const chain = DOSE_CHAIN[key];
  if (chain) {
    const next = new Date(d);
    next.setMonth(next.getMonth() + chain.months);
    return { nextDoseDate: next, nextDoseKey: chain.nextKey, nextDoseLabel: chain.nextLabel };
  }

  // Check annual
  if (ANNUAL_KEYS.some(ak => key.startsWith(ak))) {
    const next = new Date(d);
    next.setFullYear(next.getFullYear() + 1);
    const year = next.getFullYear();
    const newKey = key.replace(/\d{4}$/, year); // influenza_2025 -> influenza_2026
    return { nextDoseDate: next, nextDoseKey: newKey || key, nextDoseLabel: "Próxima dosis anual" };
  }

  return { nextDoseDate: null, nextDoseKey: null, nextDoseLabel: null };
}

// GET /api/vaccinations
router.get("/", protect, asyncHandler(async (req, res) => {
  const records = await Vaccination.find({ patient: req.patient._id }).sort({ dateAdministered: -1 });
  res.json({ success: true, data: records });
}));

// POST /api/vaccinations — Record a vaccine dose with auto next-dose calculation
router.post("/", protect, asyncHandler(async (req, res) => {
  const { vaccineKey, vaccineName, doseLabel, dateAdministered, notes } = req.body;
  const next = computeNextDose(vaccineKey, dateAdministered);

  const record = await Vaccination.findOneAndUpdate(
    { patient: req.patient._id, vaccineKey },
    {
      patient: req.patient._id, vaccineKey, vaccineName, doseLabel,
      dateAdministered, notes, administeredBy: req.user.name,
      ...next,
    },
    { upsert: true, new: true, runValidators: true }
  );
  res.json({ success: true, data: record });
}));

// DELETE /api/vaccinations/:key
router.delete("/:key", protect, asyncHandler(async (req, res) => {
  await Vaccination.findOneAndDelete({ patient: req.patient._id, vaccineKey: req.params.key });
  res.json({ success: true });
}));

module.exports = router;
