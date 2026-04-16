const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  sex: { type: String, enum: ["M", "F"], required: true },
  address: { type: String, trim: true },
  bloodType: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""], default: "" },
  diagnoses: [{
    name: { type: String, required: true },
    code: String,
    dateOfDiagnosis: Date,
    isActive: { type: Boolean, default: true },
    selfReported: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
    validatedBy: String,
    validatedAt: Date,
  }],
  allergies: [{
    name: { type: String, required: true },
    severity: { type: String, enum: ["leve", "moderada", "severa"], default: "moderada" },
    selfReported: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
    validatedBy: String,
    validatedAt: Date,
  }],
  surgicalHistory: [{
    procedure: { type: String, required: true },
    year: Number,
    notes: String,
    selfReported: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
    validatedBy: String,
    validatedAt: Date,
  }],
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
  familyHistory: [{
    condition: { type: String, required: true },
    relative: { type: String },
    notes: String,
    selfReported: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
    validatedBy: String,
    validatedAt: Date,
  }],
  emergencyContact: { name: String, phone: String, relationship: String },
  height: Number,
  weight: Number,
  waistCircumference: Number,
  studyId: String,
  enrollmentDate: Date,
  consentSigned: { type: Boolean, default: false },
  consent: {
    version: String,         // e.g. "1.0"
    dateAccepted: Date,
    method: { type: String, default: "digital" }, // digital
    revokedAt: Date,
  },
  tccCurrentPhase: { type: Number, default: 1, min: 1, max: 4 },
  tccCurrentWeek: { type: Number, default: 1, min: 1, max: 8 },
  onboardingCompleted: { type: Boolean, default: false },
  createdBy: { type: String, enum: ["self", "doctor"], default: "self" },
  createdByDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

PatientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});
PatientSchema.virtual("bmi").get(function () {
  if (!this.height || !this.weight) return null;
  return (this.weight / Math.pow(this.height / 100, 2)).toFixed(1);
});
PatientSchema.set("toJSON", { virtuals: true });
PatientSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Patient", PatientSchema);
