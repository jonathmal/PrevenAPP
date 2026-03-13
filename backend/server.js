const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const { errorHandler } = require("./middleware");

// ─── Initialize Express ──────────────────────────────────
const app = express();

// Trust Render's reverse proxy (required for express-rate-limit + X-Forwarded-For)
app.set("trust proxy", 1);

// ─── Security & Middleware ───────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: "Demasiadas solicitudes, intente más tarde" },
});
app.use("/api/", limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Demasiados intentos de autenticación" },
});

// ─── Routes ──────────────────────────────────────────────
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/vitals", require("./routes/vitals"));
app.use("/api/medications", require("./routes/medications"));
app.use("/api/screenings", require("./routes/screenings"));
app.use("/api/tcc", require("./routes/tcc"));
app.use("/api/dashboard", require("./routes/dashboard"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      app: "PrevenApp v2.0 API",
      version: "2.0.0",
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    },
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

// Error handler
app.use(errorHandler);

// ─── Database & Server ───────────────────────────────────
const startServer = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log(`✅ MongoDB conectado: ${mongoose.connection.host}`);

    const server = app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🛡️  PrevenApp v2.0 API Server                      ║
║   📍 Puerto: ${String(config.port).padEnd(39)}║
║   🌐 Entorno: ${String(config.nodeEnv).padEnd(37)}║
║   🏥 Centro de Salud de Macaracas, Los Santos        ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
      `);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Puerto ${config.port} está ocupado. En Mac, desactiva AirPlay Receiver (System Settings → General → AirDrop & Handoff) o usa otro puerto en .env`);
      } else {
        console.error("❌ Error del servidor:", err.message);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Error al iniciar servidor:", err.message);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  process.exit(1);
});

startServer();

module.exports = app;