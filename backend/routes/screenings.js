const express = require("express");
const router = express.Router();
const { asyncHandler, protect, authorize } = require("../middleware");
const Screening = require("../models/Screening");

// POST /api/screenings — Add a screening record
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

// PUT /api/screenings/:id — Update screening (e.g., mark as done)
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

// POST /api/screenings/generate — Auto-generate screenings based on patient profile
router.post("/generate", protect, asyncHandler(async (req, res) => {
  const patient = req.patient;
  const age = patient.age;
  const sex = patient.sex;
  const hasHTN = patient.diagnoses?.some(d => d.name.toLowerCase().includes("hipertens") && d.isActive);
  const hasDM = patient.diagnoses?.some(d => d.name.toLowerCase().includes("diabetes") && d.isActive);
  const rules = [];

  // Cervical cancer screening (women)
  if (sex === "F") {
    if (age >= 30 && age <= 49) {
      rules.push({ name: "Prueba VPH", category: "oncologic", intervalMonths: 60 });
    }
    if ((age >= 21 && age < 30) || age > 50) {
      rules.push({ name: "Papanicolau", category: "oncologic", intervalMonths: 36 });
    }
  }

  // Breast cancer (women 40-74)
  if (sex === "F" && age >= 40 && age <= 74) {
    rules.push({ name: "Mamografía", category: "oncologic", intervalMonths: 24 });
  }

  // Prostate (men 50+, or 40+ with risk)
  if (sex === "M" && age >= 50) {
    rules.push({ name: "PSA + Tacto Rectal", category: "oncologic", intervalMonths: 12 });
  }

  // Cardiovascular (hypertensive or diabetic)
  if (hasHTN || hasDM) {
    rules.push({ name: "Perfil Lipídico", category: "cardiovascular", intervalMonths: 12 });
    rules.push({ name: "Creatinina + EKG", category: "cardiovascular", intervalMonths: 12 });
  } else if (age >= 40) {
    rules.push({ name: "Perfil Lipídico", category: "cardiovascular", intervalMonths: 36 });
  }

  // HbA1c for diabetics
  if (hasDM) {
    rules.push({ name: "Hemoglobina Glicosilada (HbA1c)", category: "metabolic", intervalMonths: 6 });
    rules.push({ name: "Microalbuminuria", category: "metabolic", intervalMonths: 12 });
  }

  // Lung screening (smokers with high IPA)
  const rf = patient.riskFactors;
  if (rf && rf.smoking === "current" && rf.cigarettesPerDay && rf.yearsSmoked) {
    const ipa = (rf.cigarettesPerDay * rf.yearsSmoked) / 20;
    if (ipa > 20 && age >= 50 && age <= 80) {
      rules.push({ name: "TAC Tórax Baja Dosis", category: "oncologic", intervalMonths: 12 });
    }
  }

  // AAA screening (men, smoker, 65-75)
  if (sex === "M" && rf?.smoking !== "never" && age >= 65 && age <= 75) {
    rules.push({ name: "Ultrasonido Aorta Abdominal", category: "cardiovascular", intervalMonths: 0 }); // one-time
  }

  // General preventive
  rules.push({ name: "Examen Físico Preventivo", category: "general", intervalMonths: 12 });

  // Create screenings that don't already exist
  const existing = await Screening.find({ patient: patient._id, isActive: true });
  const existingNames = existing.map(s => s.name);
  const newRules = rules.filter(r => !existingNames.includes(r.name));

  const created = [];
  for (const rule of newRules) {
    const s = await Screening.create({ ...rule, patient: patient._id });
    created.push(s);
  }

  res.json({
    success: true,
    data: { created: created.length, existing: existing.length, screenings: [...existing, ...created] },
  });
}));

module.exports = router;
