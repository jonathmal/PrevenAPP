const express = require("express");
const router = express.Router();
const { asyncHandler, protect, authorize } = require("../middleware");
const {
  User, Patient, BPReading, GlucoseReading, WeightReading, Medication, MedLog,
  Screening, TCCProgress, ABCRecord, SMARTGoal, HungerScale, Vaccination,
} = require("../models");
const { refreshScreenings } = require("../rules/refreshScreenings");

router.use(protect, authorize("doctor", "admin"));

// GET /api/dashboard/overview
router.get("/overview", asyncHandler(async (req, res) => {
  const patients = await Patient.find({ isActive: true }).populate("user", "name cedula");
  const patientSummaries = await Promise.all(patients.map(async (patient) => {
    const [latestBP, latestGluc, tccProgress] = await Promise.all([
      BPReading.findOne({ patient: patient._id }).sort({ measuredAt: -1 }),
      GlucoseReading.findOne({ patient: patient._id }).sort({ measuredAt: -1 }),
      TCCProgress.findOne({ patient: patient._id }),
    ]);
    const date = new Date().toISOString().split("T")[0];
    const medsCount = await Medication.countDocuments({ patient: patient._id, isActive: true });
    const takenCount = await MedLog.countDocuments({ patient: patient._id, date, taken: true });
    const adherence = medsCount > 0 ? Math.round((takenCount / medsCount) * 100) : null;
    const overdueScreenings = await Screening.countDocuments({ patient: patient._id, status: "red", isActive: true });
    let alertCount = 0;
    if (latestBP?.status === "red") alertCount++;
    if (latestGluc?.status === "red") alertCount++;
    if (adherence !== null && adherence < 60) alertCount++;
    if (overdueScreenings > 0) alertCount++;
    return {
      patient: {
        id: patient._id, name: patient.user?.name || "N/A",
        age: patient.age, sex: patient.sex,
        diagnoses: patient.diagnoses?.filter(d => d.isActive).map(d => d.name) || [],
        onboardingCompleted: patient.onboardingCompleted,
        consentSigned: patient.consentSigned,
        createdBy: patient.createdBy,
      },
      vitals: {
        bp: latestBP ? { value: latestBP.systolic + "/" + latestBP.diastolic, status: latestBP.status, date: latestBP.measuredAt } : null,
        glucose: latestGluc ? { value: latestGluc.value, status: latestGluc.status, date: latestGluc.measuredAt } : null,
      },
      adherence, tcc: tccProgress ? { phase: tccProgress.currentPhase, week: tccProgress.currentWeek, lastActivity: tccProgress.lastActivityAt } : null,
      overdueScreenings, alertCount,
    };
  }));
  patientSummaries.sort((a, b) => b.alertCount - a.alertCount);
  const patientsInAlert = patientSummaries.filter(p => p.alertCount > 0).length;
  const adhArr = patientSummaries.filter(p => p.adherence !== null);
  const avgAdherence = adhArr.length > 0 ? Math.round(adhArr.reduce((s, p) => s + p.adherence, 0) / adhArr.length) : 0;
  const bpControlled = patientSummaries.filter(p => p.vitals.bp && p.vitals.bp.status === "green").length;
  res.json({ success: true, data: {
    summary: { totalPatients: patients.length, patientsInAlert, avgAdherence, bpControlled, bpControlRate: patients.length > 0 ? Math.round((bpControlled / patients.length) * 100) : 0 },
    patients: patientSummaries,
  }});
}));

// GET /api/dashboard/patient/:patientId — Detailed view
router.get("/patient/:patientId", asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId).populate("user", "name cedula phone");
  if (!patient) return res.status(404).json({ success: false, error: "Paciente no encontrado" });
  const [bpHistory, glucHistory, medications, screenings, tccProgress, abcRecords, goals] = await Promise.all([
    BPReading.find({ patient: patient._id }).sort({ measuredAt: -1 }).limit(30),
    GlucoseReading.find({ patient: patient._id }).sort({ measuredAt: -1 }).limit(30),
    Medication.find({ patient: patient._id, isActive: true }),
    Screening.find({ patient: patient._id, isActive: true }).sort({ status: 1 }),
    TCCProgress.findOne({ patient: patient._id }),
    ABCRecord.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(10),
    SMARTGoal.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(10),
  ]);
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const medLogs = await MedLog.find({ patient: patient._id, date: { $gte: sevenDaysAgo.toISOString().split("T")[0] } });
  const adherence7d = medLogs.length > 0 ? Math.round((medLogs.filter(l => l.taken).length / medLogs.length) * 100) : null;
  res.json({ success: true, data: { patient, vitals: { bp: bpHistory, glucose: glucHistory }, medications, screenings, adherence7d, tcc: { progress: tccProgress, recentABC: abcRecords, recentGoals: goals } } });
}));

// PUT /api/dashboard/patient/:patientId — Doctor updates patient + auto-refresh screenings
router.put("/patient/:patientId", asyncHandler(async (req, res) => {
  const allowed = ["diagnoses", "familyHistory", "riskFactors", "height", "weight", "waistCircumference", "bloodType", "allergies", "surgicalHistory"];
  const update = {};
  for (const key of allowed) { if (req.body[key] !== undefined) update[key] = req.body[key]; }

  const patient = await Patient.findByIdAndUpdate(req.params.patientId, update, { new: true, runValidators: true }).populate("user", "name cedula phone");
  if (!patient) return res.status(404).json({ success: false, error: "Paciente no encontrado" });

  // Auto-refresh screenings
  try { await refreshScreenings(patient); } catch (err) { console.error("[Dashboard] Screening refresh error:", err.message); }

  res.json({ success: true, data: patient });
}));

// PUT /api/dashboard/screening/:screeningId — Doctor marks screening completed with result
router.put("/screening/:screeningId", asyncHandler(async (req, res) => {
  const { lastDone, result, resultClassification, customNextDue } = req.body;
  const screening = await Screening.findById(req.params.screeningId);
  if (!screening) return res.status(404).json({ success: false, error: "Tamizaje no encontrado" });
  if (lastDone) screening.lastDone = lastDone;
  if (result !== undefined) screening.result = result;
  if (resultClassification) {
    screening.resultClassification = resultClassification;
    if (resultClassification === "borderline" && screening.borderlineInterval) screening.intervalMonths = screening.borderlineInterval;
    else if (resultClassification === "pathological" && screening.pathologicalInterval) screening.intervalMonths = screening.pathologicalInterval;
    else if (resultClassification === "normal" && screening.normalInterval) screening.intervalMonths = screening.normalInterval;
  }
  if (customNextDue) {
    screening.nextDue = new Date(customNextDue);
    screening._customNextDue = true;
  }
  await screening.save();
  res.json({ success: true, data: screening });
}));

// PUT /api/dashboard/screening/:screeningId/validate — Doctor validates self-reported items
router.put("/screening/:screeningId/validate", asyncHandler(async (req, res) => {
  const screening = await Screening.findByIdAndUpdate(req.params.screeningId, { validated: true }, { new: true });
  if (!screening) return res.status(404).json({ success: false, error: "Tamizaje no encontrado" });
  res.json({ success: true, data: screening });
}));

// ─── Doctor Medication Management ──────────────────────────

router.post("/patient/:patientId/medications", asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId);
  if (!patient) return res.status(404).json({ success: false, error: "Paciente no encontrado" });
  const med = await Medication.create({ ...req.body, patient: patient._id, addedBy: "doctor", addedByName: req.user.name });
  res.status(201).json({ success: true, data: med });
}));

router.delete("/patient/:patientId/medications/:medId", asyncHandler(async (req, res) => {
  const med = await Medication.findOneAndUpdate({ _id: req.params.medId, patient: req.params.patientId }, { isActive: false, endDate: new Date() }, { new: true });
  if (!med) return res.status(404).json({ success: false, error: "Medicamento no encontrado" });
  res.json({ success: true, data: med });
}));

// ─── Validate patient-reported items ────────────────────────
router.put("/patient/:patientId/validate", asyncHandler(async (req, res) => {
  const { field, index } = req.body;
  const patient = await Patient.findById(req.params.patientId);
  if (!patient) return res.status(404).json({ success: false, error: "Paciente no encontrado" });
  const allowed = ["diagnoses", "familyHistory", "allergies", "surgicalHistory"];
  if (!allowed.includes(field) || index === undefined) return res.status(400).json({ success: false, error: "Campo o índice inválido" });
  if (patient[field] && patient[field][index]) {
    patient[field][index].validated = true;
    patient[field][index].validatedBy = req.user.name;
    patient[field][index].validatedAt = new Date();
    await patient.save();
  }
  res.json({ success: true, data: patient });
}));

// ─── POST /api/dashboard/patient — Doctor creates patient ────────
router.post("/patient", asyncHandler(async (req, res) => {
  const { cedula, name, phone, email, dateOfBirth, sex, temporaryPassword } = req.body;
  if (!cedula || !name || !dateOfBirth || !sex) {
    return res.status(400).json({ success: false, error: "Cédula, nombre, fecha de nacimiento y sexo son requeridos" });
  }
  const ced = cedula.trim().toUpperCase();
  const existing = await User.findOne({ cedula: ced });
  if (existing) return res.status(409).json({ success: false, error: "Ya existe un usuario con esta cédula" });

  const tempPwd = temporaryPassword || ("Preven" + Math.floor(1000 + Math.random() * 9000));
  const user = await User.create({
    cedula: ced, password: tempPwd, name: name.trim(), phone, email,
    role: "patient",
    mustChangePassword: true,
  });
  const patient = await Patient.create({
    user: user._id,
    dateOfBirth: new Date(dateOfBirth),
    sex,
    enrollmentDate: new Date(),
    createdBy: "doctor",
    createdByDoctor: req.user._id,
    onboardingCompleted: false,
  });
  await TCCProgress.create({ patient: patient._id });

  res.status(201).json({
    success: true,
    data: {
      patient,
      credentials: {
        cedula: user.cedula,
        temporaryPassword: tempPwd,
        message: "El paciente debe cambiar la contraseña en el primer ingreso. Comparta estas credenciales de forma segura.",
      },
    },
  });
}));

// ─── PUT /api/dashboard/patient/:id/deactivate ───────────────────
router.put("/patient/:patientId/deactivate", asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId);
  if (!patient) return res.status(404).json({ success: false, error: "Paciente no encontrado" });
  patient.isActive = false;
  await patient.save();
  await User.findByIdAndUpdate(patient.user, { isActive: false });
  res.json({ success: true, message: "Paciente desactivado" });
}));

// ─── DELETE /api/dashboard/patient/:id — Permanent delete ────────
router.delete("/patient/:patientId", asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId);
  if (!patient) return res.status(404).json({ success: false, error: "Paciente no encontrado" });
  const pid = patient._id;
  const uid = patient.user;
  // Delete all patient data
  await Promise.all([
    BPReading.deleteMany({ patient: pid }),
    GlucoseReading.deleteMany({ patient: pid }),
    WeightReading.deleteMany({ patient: pid }),
    Medication.deleteMany({ patient: pid }),
    MedLog.deleteMany({ patient: pid }),
    Screening.deleteMany({ patient: pid }),
    TCCProgress.deleteMany({ patient: pid }),
    ABCRecord.deleteMany({ patient: pid }),
    SMARTGoal.deleteMany({ patient: pid }),
    HungerScale.deleteMany({ patient: pid }),
    Vaccination.deleteMany({ patient: pid }),
  ]);
  await Patient.findByIdAndDelete(pid);
  await User.findByIdAndDelete(uid);
  res.json({ success: true, message: "Paciente y todos sus datos eliminados permanentemente" });
}));

// ─── POST /api/dashboard/patient/:id/reset-password ──────────────
router.post("/patient/:patientId/reset-password", asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId);
  if (!patient) return res.status(404).json({ success: false, error: "Paciente no encontrado" });
  const tempPwd = "Preven" + Math.floor(1000 + Math.random() * 9000);
  const user = await User.findById(patient.user).select("+password");
  user.password = tempPwd;
  user.mustChangePassword = true;
  await user.save();
  res.json({
    success: true,
    data: {
      cedula: user.cedula,
      temporaryPassword: tempPwd,
      message: "Contraseña temporal generada. El paciente deberá cambiarla en el próximo ingreso.",
    },
  });
}));

module.exports = router;
