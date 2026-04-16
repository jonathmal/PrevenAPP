const jwt = require("jsonwebtoken");
const config = require("../config");
const { User, Patient } = require("../models");

// ─── Async handler (avoids try/catch boilerplate) ────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── JWT Auth middleware ─────────────────────────────────
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, error: "No autorizado" });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(decoded.id);
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, error: "Usuario no válido" });
    }
    // Attach patient profile if role is patient
    if (req.user.role === "patient") {
      req.patient = await Patient.findOne({ user: req.user._id });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Token no válido" });
  }
});

// ─── Role-based authorization ────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `El rol '${req.user.role}' no tiene acceso a este recurso`,
    });
  }
  next();
};

// ─── Error handler middleware ────────────────────────────
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error("Error:", err.message);

  // Mongoose duplicate key
  if (err.code === 11000) {
    error.message = "Valor duplicado ingresado";
    return res.status(400).json({ success: false, error: error.message });
  }
  // Mongoose validation
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(", ") });
  }
  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(404).json({ success: false, error: "Recurso no encontrado" });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: error.message || "Error del servidor",
  });
};

module.exports = { asyncHandler, protect, authorize, errorHandler };
