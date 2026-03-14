const mongoose = require("mongoose");

const VaccinationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  vaccineKey: { type: String, required: true },
  vaccineName: { type: String, required: true },
  doseLabel: String,
  dateAdministered: { type: Date, required: true },
  nextDoseDate: Date,
  nextDoseKey: String,
  nextDoseLabel: String,
  administeredBy: String,
  location: String,
  notes: String,
}, { timestamps: true });

VaccinationSchema.index({ patient: 1, vaccineKey: 1 }, { unique: true });

module.exports = mongoose.model("Vaccination", VaccinationSchema);
