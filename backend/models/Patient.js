const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  // Demographics
  dateOfBirth: { type: Date, required: true },
  sex: { type: String, enum: ["M", "F"], required: true },
  address: { type: String, trim: true },
  // Clinical
  diagnoses: [{
    name: { type: String, required: true },
    code: String, // ICD-10
    dateOfDiagnosis: Date,
    isActive: { type: Boolean, default: true },
  }],
  riskFactors: {
    smoking: { type: String, enum: ["never", "former", "current"], default: "never" },
    cigarettesPerDay: { type: Number, default: 0 },
    yearsSmoked: { type: Number, default: 0 },
    familyHistoryCancer: { type: Boolean, default: false },
    familyHistoryCancerType: [String], // ["breast", "prostate", "colon"]
    ethnicity: String,
  },
  familyHistory: [{
    condition: { type: String, required: true }, // "HTA", "DM2", "Ca mama", etc.
    relative: { type: String }, // "madre", "padre", "hermano/a", "abuelo/a"
    notes: String,
  }],
  // Anthropometrics (latest)
  height: Number, // cm
  weight: Number, // kg
  waistCircumference: Number, // cm
  // Study enrollment
  studyId: String, // Anonymous code for research
  enrollmentDate: Date,
  consentSigned: { type: Boolean, default: false },
  // TCC progress
  tccCurrentPhase: { type: Number, default: 1, min: 1, max: 4 },
  tccCurrentWeek: { type: Number, default: 1, min: 1, max: 8 },
  // Computed
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Virtual: age
PatientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual: BMI
PatientSchema.virtual("bmi").get(function () {
  if (!this.height || !this.weight) return null;
  return (this.weight / Math.pow(this.height / 100, 2)).toFixed(1);
});

PatientSchema.set("toJSON", { virtuals: true });
PatientSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Patient", PatientSchema);