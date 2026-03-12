const mongoose = require("mongoose");

const GlucoseReadingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  value: { type: Number, required: true, min: 20, max: 800 },
  type: { type: String, enum: ["fasting", "postprandial", "random"], required: true },
  status: { type: String, enum: ["green", "yellow", "red"] },
  source: { type: String, enum: ["self", "clinic", "lab"], default: "self" },
  notes: String,
  verifiedByDoctor: { type: Boolean, default: false },
  measuredAt: { type: Date, default: Date.now },
}, { timestamps: true });

GlucoseReadingSchema.pre("save", function () {
  const v = this.value;
  if (this.type === "fasting") {
    if (v < 70 || v > 180) this.status = "red";
    else if (v > 130) this.status = "yellow";
    else this.status = "green";
  } else if (this.type === "postprandial") {
    if (v < 70 || v > 250) this.status = "red";
    else if (v > 180) this.status = "yellow";
    else this.status = "green";
  } else {
    if (v < 70 || v > 200) this.status = "red";
    else if (v > 140) this.status = "yellow";
    else this.status = "green";
  }
});

GlucoseReadingSchema.index({ patient: 1, measuredAt: -1 });

module.exports = mongoose.model("GlucoseReading", GlucoseReadingSchema);
