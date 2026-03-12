const mongoose = require("mongoose");

const WeightReadingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  value: { type: Number, required: true, min: 20, max: 400 }, // kg
  bmi: Number, // computed on save using patient height
  source: { type: String, enum: ["self", "clinic"], default: "self" },
  measuredAt: { type: Date, default: Date.now },
}, { timestamps: true });

WeightReadingSchema.index({ patient: 1, measuredAt: -1 });

module.exports = mongoose.model("WeightReading", WeightReadingSchema);
