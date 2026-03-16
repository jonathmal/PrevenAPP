const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const { User, Patient, TCCProgress } = require("../models");
const { refreshScreenings } = require("../rules/refreshScreenings");

// POST /api/auth/register
router.post("/register", asyncHandler(async (req, res) => {
  const { cedula, password, name, phone, email, role, dateOfBirth, sex } = req.body;
  const user = await User.create({ cedula, password, name, phone, email, role: role || "patient" });
  if (user.role === "patient") {
    const patient = await Patient.create({ user: user._id, dateOfBirth: dateOfBirth || new Date("1970-01-01"), sex: sex || "F" });
    await TCCProgress.create({ patient: patient._id });
  }
  const token = user.generateToken();
  res.status(201).json({ success: true, data: { token, user: { id: user._id, name: user.name, role: user.role, cedula: user.cedula } } });
}));

// POST /api/auth/login
router.post("/login", asyncHandler(async (req, res) => {
  const { cedula, password } = req.body;
  if (!cedula || !password) return res.status(400).json({ success: false, error: "Ingrese cédula y contraseña" });
  const user = await User.findOne({ cedula, isActive: true }).select("+password");
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, error: "Credenciales inválidas" });
  const token = user.generateToken();
  let patientId = null;
  if (user.role === "patient") {
    const patient = await Patient.findOne({ user: user._id });
    patientId = patient?._id;
  }
  res.json({ success: true, data: { token, user: { id: user._id, name: user.name, role: user.role, cedula: user.cedula }, patientId } });
}));

// GET /api/auth/me
router.get("/me", protect, asyncHandler(async (req, res) => {
  let patient = null;
  if (req.user.role === "patient") patient = await Patient.findOne({ user: req.user._id });
  res.json({ success: true, data: { user: req.user, patient } });
}));

// PUT /api/auth/me/patient — Update patient data (profile + doctor mode)
// After update, auto-refreshes screening recommendations
router.put("/me/patient", protect, asyncHandler(async (req, res) => {
  if (req.user.role !== "patient" || !req.patient) {
    return res.status(403).json({ success: false, error: "Solo pacientes pueden actualizar su perfil clínico" });
  }
  const allowed = [
    "diagnoses", "familyHistory", "riskFactors", "bloodType",
    "allergies", "surgicalHistory", "emergencyContact",
    "height", "weight", "waistCircumference", "address",
  ];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const patient = await Patient.findByIdAndUpdate(req.patient._id, update, { new: true, runValidators: true });

  // Auto-refresh screenings if clinical data changed
  const clinicalFields = ["diagnoses", "familyHistory", "riskFactors", "height", "weight", "waistCircumference"];
  if (clinicalFields.some(f => update[f] !== undefined)) {
    try { await refreshScreenings(patient); } catch (err) { console.error("[Auth] Screening refresh error:", err.message); }
  }

  res.json({ success: true, data: patient });
}));

// POST /api/auth/consent — Record patient consent (Ley 81 de 2019)
router.post("/consent", protect, asyncHandler(async (req, res) => {
  if (!req.patient) return res.status(400).json({ success: false, error: "Solo pacientes pueden dar consentimiento" });
  const { version } = req.body;
  const patient = await Patient.findByIdAndUpdate(req.patient._id, {
    consentSigned: true,
    consent: {
      version: version || "1.0",
      dateAccepted: new Date(),
      method: "digital",
    },
  }, { new: true });
  res.json({ success: true, data: patient });
}));

// POST /api/auth/consent/revoke — Revoke consent + request data deletion
router.post("/consent/revoke", protect, asyncHandler(async (req, res) => {
  if (!req.patient) return res.status(400).json({ success: false, error: "Solo pacientes" });
  await Patient.findByIdAndUpdate(req.patient._id, {
    consentSigned: false,
    "consent.revokedAt": new Date(),
  });
  res.json({ success: true, message: "Consentimiento revocado. Puede solicitar eliminación de datos contactando a su centro de salud." });
}));

module.exports = router;
