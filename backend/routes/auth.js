const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const { User, Patient, TCCProgress } = require("../models");

// POST /api/auth/register
router.post("/register", asyncHandler(async (req, res) => {
  const { cedula, password, name, phone, email, role, dateOfBirth, sex } = req.body;

  const user = await User.create({ cedula, password, name, phone, email, role: role || "patient" });

  // If patient, create patient profile
  if (user.role === "patient") {
    const patient = await Patient.create({
      user: user._id,
      dateOfBirth: dateOfBirth || new Date("1970-01-01"),
      sex: sex || "F",
    });
    // Initialize TCC progress
    await TCCProgress.create({ patient: patient._id });
  }

  const token = user.generateToken();
  res.status(201).json({
    success: true,
    data: { token, user: { id: user._id, name: user.name, role: user.role, cedula: user.cedula } },
  });
}));

// POST /api/auth/login
router.post("/login", asyncHandler(async (req, res) => {
  const { cedula, password } = req.body;
  if (!cedula || !password) {
    return res.status(400).json({ success: false, error: "Ingrese cédula y contraseña" });
  }

  const user = await User.findOne({ cedula, isActive: true }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, error: "Credenciales inválidas" });
  }

  const token = user.generateToken();

  // Attach patient info if applicable
  let patientId = null;
  if (user.role === "patient") {
    const patient = await Patient.findOne({ user: user._id });
    patientId = patient?._id;
  }

  res.json({
    success: true,
    data: {
      token,
      user: { id: user._id, name: user.name, role: user.role, cedula: user.cedula },
      patientId,
    },
  });
}));

// GET /api/auth/me
router.get("/me", protect, asyncHandler(async (req, res) => {
  const user = req.user;
  let patient = null;
  if (user.role === "patient") {
    patient = await Patient.findOne({ user: user._id });
  }
  res.json({ success: true, data: { user, patient } });
}));

module.exports = router;
