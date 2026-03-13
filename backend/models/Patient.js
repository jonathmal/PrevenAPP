const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  // Demographics
  dateOfBirth: { type: Date, required: true },
  sex: { type: String, enum: ["M", "F"], required: true },
  address: { type: String, trim: true },
  bloodType: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""], default: "" },
  // Clinical — APP
  diagnoses: [{
    name: { type: String, required: true },
    code: String, // ICD-10
    dateOfDiagnosis: Date,
    isActive: { type: Boolean, default: true },
    selfReported: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
  }],
  // Allergies
  allergies: [{
    name: { type: String, required: true },
    severity: { type: String, enum: ["leve", "moderada", "severa"], default: "moderada" },
    selfReported: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
  }],
  // Surgical history
  surgicalHistory: [{
    procedure: { type: String, required: true },
    year: Number,
    notes: String,
    selfReported: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
  }],
  // Risk factors
  riskFactors: {
    smoking: { type: String, enum: ["never", "former", "current"], default: "never" },
    cigarettesPerDay: { type: Number, default: 0 },
    yearsSmoked: { type: Number, default: 0 },
    alcohol: { type: String, enum: ["never", "occasional", "moderate", "heavy"], default: "never" },
    exercise: { type: String, enum: ["sedentary", "light", "moderate", "active"], default: "sedentary" },
    exerciseMinutesPerWeek: { type: Number, default: 0 },
    diet: { type: String, enum: ["poor", "regular", "good", "excellent"], default: "regular" },
    familyHistoryCancer: { type: Boolean, default: false },
    familyHistoryCancerType: [String],
    ethnicity: String,
  },
  // APF
  familyHistory: [{
    condition: { type: String, required: true },
    relative: { type: String },
    notes: String,
    selfReported: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
  }],
  // Emergency contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  // Anthropometrics (latest)
  height: Number, // cm
  weight: Number, // kg
  waistCircumference: Number, // cm
  // Study enrollment
  studyId: String,
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
