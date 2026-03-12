const mongoose = require("mongoose");

// ─── Medication (prescribed medications) ─────────────────
const MedicationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  name: { type: String, required: true, trim: true },
  dose: { type: String, trim: true }, // "850mg"
  frequency: { type: String, trim: true }, // "BID", "QD"
  schedules: [{ type: String }], // ["07:00", "19:00"]
  indication: String, // "Diabetes mellitus tipo 2"
  prescribedBy: String,
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── MedLog (daily medication tracking) ──────────────────
const MedLogSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  medication: { type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true },
  scheduledTime: { type: String, required: true }, // "07:00"
  taken: { type: Boolean, default: false },
  takenAt: Date,
  skippedReason: String,
  date: { type: String, required: true }, // "2026-03-11" for easy querying
}, { timestamps: true });

MedLogSchema.index({ patient: 1, date: -1 });
MedLogSchema.index({ patient: 1, medication: 1, date: 1 }, { unique: true });

const Medication = mongoose.model("Medication", MedicationSchema);
const MedLog = mongoose.model("MedLog", MedLogSchema);

module.exports = { Medication, MedLog };
