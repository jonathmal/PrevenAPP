const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const { User, Patient, TCCProgress } = require("../models");
const { refreshScreenings } = require("../rules/refreshScreenings");

// ─── Helpers ─────────────────────────────────────────
function normalizeCedula(c) {
  if (!c) return "";
  return c.trim().toUpperCase().replace(/\s+/g, "");
}

function isValidCedula(c) {
  // Panama formats: 8-937-44, PE-12-345, N-12-345, E-12-345
  return /^[A-Z]{0,3}\d{1,3}-\d{1,4}-\d{1,5}$/.test(c) || /^\d{1,3}-\d{1,4}-\d{1,5}$/.test(c);
}

// ─── POST /api/auth/register — Self-service patient registration ──
router.post("/register", asyncHandler(async (req, res) => {
  const { cedula, password, name, phone, email, dateOfBirth, sex, securityQuestion, securityAnswer } = req.body;

  // Validation
  if (!cedula || !password || !name || !dateOfBirth || !sex) {
    return res.status(400).json({ success: false, error: "Cédula, contraseña, nombre, fecha de nacimiento y sexo son requeridos" });
  }
  const ced = normalizeCedula(cedula);
  if (!isValidCedula(ced)) {
    return res.status(400).json({ success: false, error: "Formato de cédula inválido. Ejemplo: 8-937-44" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: "La contraseña debe tener al menos 6 caracteres" });
  }
  if (!securityQuestion || !securityAnswer) {
    return res.status(400).json({ success: false, error: "Pregunta y respuesta de seguridad son requeridas para recuperación" });
  }

  // Check if already exists
  const existing = await User.findOne({ cedula: ced });
  if (existing) {
    return res.status(409).json({ success: false, error: "Ya existe una cuenta con esta cédula. Inicie sesión o use 'Olvidé mi contraseña'." });
  }
  if (email) {
    const emailTaken = await User.findOne({ email: email.trim().toLowerCase() });
    if (emailTaken) return res.status(409).json({ success: false, error: "Este correo ya está registrado" });
  }

  // Create user — always patient role on self-service
  const user = await User.create({
    cedula: ced, password, name: name.trim(), phone, email,
    role: "patient",
    securityQuestion: securityQuestion.trim(),
    securityAnswerHash: securityAnswer.trim(),
    mustChangePassword: false,
  });

  const patient = await Patient.create({
    user: user._id,
    dateOfBirth: new Date(dateOfBirth),
    sex,
    enrollmentDate: new Date(),
    createdBy: "self",
    onboardingCompleted: false,
  });
  await TCCProgress.create({ patient: patient._id });

  const token = user.generateToken();
  res.status(201).json({
    success: true,
    data: { token, user: { id: user._id, name: user.name, role: user.role, cedula: user.cedula }, patientId: patient._id },
  });
}));

// ─── POST /api/auth/login ────────────────────────────
router.post("/login", asyncHandler(async (req, res) => {
  const { cedula, password } = req.body;
  if (!cedula || !password) return res.status(400).json({ success: false, error: "Ingrese cédula y contraseña" });
  const ced = normalizeCedula(cedula);
  const user = await User.findOne({ cedula: ced, isActive: true }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, error: "Credenciales inválidas" });
  }
  const token = user.generateToken();
  let patientId = null;
  if (user.role === "patient") {
    const patient = await Patient.findOne({ user: user._id });
    patientId = patient?._id;
  }
  res.json({
    success: true,
    data: {
      token,
      user: { id: user._id, name: user.name, role: user.role, cedula: user.cedula, mustChangePassword: user.mustChangePassword },
      patientId,
    },
  });
}));

// ─── GET /api/auth/me ────────────────────────────────
router.get("/me", protect, asyncHandler(async (req, res) => {
  let patient = null;
  if (req.user.role === "patient") patient = await Patient.findOne({ user: req.user._id });
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id, name: req.user.name, role: req.user.role,
        cedula: req.user.cedula, phone: req.user.phone, email: req.user.email,
        mustChangePassword: req.user.mustChangePassword,
      },
      patient,
    },
  });
}));

// ─── POST /api/auth/change-password ──────────────────
router.post("/change-password", protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" });
  }
  const user = await User.findById(req.user._id).select("+password");
  // If mustChangePassword is set, allow without verifying current (first login flow)
  if (!user.mustChangePassword) {
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, error: "Contraseña actual incorrecta" });
    }
  }
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();
  res.json({ success: true, message: "Contraseña actualizada" });
}));

// ─── POST /api/auth/forgot-password — Step 1: get security question ──
router.post("/forgot-password", asyncHandler(async (req, res) => {
  const { cedula } = req.body;
  const ced = normalizeCedula(cedula);
  const user = await User.findOne({ cedula: ced, isActive: true });
  if (!user) {
    // Don't reveal if user exists
    return res.json({ success: true, data: { question: "Si esta cédula existe, contacte a su médico para recuperar acceso" } });
  }
  if (!user.securityQuestion) {
    return res.status(400).json({ success: false, error: "No tiene pregunta de seguridad. Contacte a su médico para restablecer su contraseña." });
  }
  res.json({ success: true, data: { question: user.securityQuestion } });
}));

// ─── POST /api/auth/reset-password — Step 2: verify answer + reset ──
router.post("/reset-password", asyncHandler(async (req, res) => {
  const { cedula, securityAnswer, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" });
  }
  const ced = normalizeCedula(cedula);
  const user = await User.findOne({ cedula: ced, isActive: true }).select("+securityAnswerHash");
  if (!user) return res.status(401).json({ success: false, error: "Datos incorrectos" });
  const ok = await user.compareSecurityAnswer(securityAnswer);
  if (!ok) return res.status(401).json({ success: false, error: "Respuesta de seguridad incorrecta" });
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();
  res.json({ success: true, message: "Contraseña restablecida. Ingrese con su nueva contraseña." });
}));

// ─── POST /api/auth/onboarding/complete ──────────────
router.post("/onboarding/complete", protect, asyncHandler(async (req, res) => {
  if (!req.patient) return res.status(403).json({ success: false, error: "Solo pacientes" });
  await Patient.findByIdAndUpdate(req.patient._id, { onboardingCompleted: true });
  // Refresh screenings now that profile is complete
  try { const p = await Patient.findById(req.patient._id); await refreshScreenings(p); } catch (e) { console.error("[Onboarding] Screening refresh:", e.message); }
  res.json({ success: true });
}));

// ─── PUT /api/auth/me/patient ────────────────────────
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
  const clinicalFields = ["diagnoses", "familyHistory", "riskFactors", "height", "weight", "waistCircumference"];
  if (clinicalFields.some(f => update[f] !== undefined)) {
    try { await refreshScreenings(patient); } catch (err) { console.error("[Auth] Screening refresh error:", err.message); }
  }
  res.json({ success: true, data: patient });
}));

// ─── PUT /api/auth/me/profile ─ Update user-level fields (name, phone, email) ──
router.put("/me/profile", protect, asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "email"];
  const update = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  res.json({ success: true, data: { user } });
}));

// ─── POST /api/auth/consent ──────────────────────────
router.post("/consent", protect, asyncHandler(async (req, res) => {
  if (!req.patient) return res.status(400).json({ success: false, error: "Solo pacientes pueden dar consentimiento" });
  const { version } = req.body;
  const patient = await Patient.findByIdAndUpdate(req.patient._id, {
    consentSigned: true,
    consent: { version: version || "1.0", dateAccepted: new Date(), method: "digital" },
  }, { new: true });
  res.json({ success: true, data: patient });
}));

// ─── POST /api/auth/consent/revoke ───────────────────
router.post("/consent/revoke", protect, asyncHandler(async (req, res) => {
  if (!req.patient) return res.status(400).json({ success: false, error: "Solo pacientes" });
  await Patient.findByIdAndUpdate(req.patient._id, {
    consentSigned: false,
    "consent.revokedAt": new Date(),
  });
  res.json({ success: true, message: "Consentimiento revocado." });
}));

module.exports = router;
