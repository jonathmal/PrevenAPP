const mongoose = require("mongoose");

const BPReadingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  systolic: { type: Number, required: true, min: 60, max: 300 },
  diastolic: { type: Number, required: true, min: 30, max: 200 },
  heartRate: { type: Number, min: 30, max: 250 },
  // Classification (computed on save)
  classification: {
    type: String,
    enum: ["normal", "elevated", "stage1", "stage2", "crisis"],
  },
  status: { type: String, enum: ["green", "yellow", "red"] },
  // Context
  source: { type: String, enum: ["self", "clinic", "doctor"], default: "self" },
  notes: String,
  verifiedByDoctor: { type: Boolean, default: false },
  measuredAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-classify on save
BPReadingSchema.pre("save", function () {
  const { systolic: s, diastolic: d } = this;
  if (s >= 180 || d >= 120) {
    this.classification = "crisis"; this.status = "red";
  } else if (s >= 140 || d >= 90) {
    this.classification = "stage2"; this.status = "red";
  } else if (s >= 130 || d >= 80) {
    this.classification = "stage1"; this.status = "yellow";
  } else if (s >= 120 && d < 80) {
    this.classification = "elevated"; this.status = "yellow";
  } else {
    this.classification = "normal"; this.status = "green";
  }
});

BPReadingSchema.index({ patient: 1, measuredAt: -1 });

module.exports = mongoose.model("BPReading", BPReadingSchema);
