/**
 * Seed script — PrevenApp v2.4
 * Creates only the doctor account. Patients are created via the app.
 * Usage: node seeds/seed.js
 */
const mongoose = require("mongoose");
const config = require("../config");
const {
  User, Patient, BPReading, GlucoseReading, WeightReading, Vaccination,
  Medication, MedLog, Screening, ABCRecord, SMARTGoal, TCCProgress, HungerScale,
} = require("../models");

const seed = async () => {
  await mongoose.connect(config.mongoURI);
  console.log("🌱 Conectado a MongoDB. Iniciando seed...");

  // Clear existing data
  const models = [User, Patient, BPReading, GlucoseReading, WeightReading, Medication, MedLog, Screening, ABCRecord, SMARTGoal, TCCProgress, HungerScale, Vaccination];
  for (const Model of models) {
    if (Model && typeof Model.deleteMany === "function") await Model.deleteMany({});
  }
  console.log("🗑️  Datos anteriores eliminados.");

  // ─── Create doctor user ────────────────────────────────
  const doctor = await User.create({
    cedula: "8-937-44",
    password: "doctor2026",
    name: "Dr. Jonathan Jethmal Solís",
    role: "doctor",
    phone: "6000-0000",
    email: "jonathan.jethmal@minsa.gob.pa",
  });
  console.log("👨‍⚕️ Doctor creado:", doctor.name);

  console.log("\n✅ Seed completado.");
  console.log(`   🔑 Login médico: cédula=8-937-44, contraseña=doctor2026`);
  console.log(`   📋 Los pacientes se crean desde el dashboard del médico o por autoregistro.\n`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
