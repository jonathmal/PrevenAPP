const mongoose = require("mongoose");

const MedicationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  name: { type: String, required: true, trim: true },
  dose: { type: String, trim: true },
  frequency: { type: String, trim: true },
  schedules: [{ type: String }],
  indication: String,
  prescribedBy: String,
  addedBy: { type: String, enum: ["patient", "doctor"], default: "doctor" },
  addedByName: String,
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const MedLogSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  medication: { type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true },
  scheduledTime: { type: String, required: true },
  taken: { type: Boolean, default: false },
  takenAt: Date,
  skippedReason: String,
  date: { type: String, required: true },
}, { timestamps: true });

MedLogSchema.index({ patient: 1, date: -1 });
MedLogSchema.index({ patient: 1, medication: 1, date: 1 }, { unique: true });

const Medication = mongoose.model("Medication", MedicationSchema);
const MedLog = mongoose.model("MedLog", MedLogSchema);
module.exports = { Medication, MedLog };
