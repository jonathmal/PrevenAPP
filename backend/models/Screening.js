const mongoose = require("mongoose");

const ScreeningSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ["oncologic", "cardiovascular", "metabolic", "general"], default: "general" },
  intervalMonths: { type: Number, required: true },
  lastDone: Date,
  nextDue: Date,
  status: { type: String, enum: ["green", "yellow", "red"], default: "red" },
  result: String,
  resultClassification: { type: String, enum: ["normal", "borderline", "pathological", ""], default: "" },
  orderedBy: String,
  reason: String,
  source: String,
  priority: { type: String, enum: ["alta", "media", "baja"], default: "media" },
  normalInterval: Number,
  borderlineInterval: Number,
  pathologicalInterval: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ScreeningSchema.pre("save", function () {
  if (this.lastDone && this.intervalMonths > 0) {
    // If nextDue was explicitly set by doctor, keep it; otherwise calculate
    if (!this._customNextDue) {
      const next = new Date(this.lastDone);
      next.setMonth(next.getMonth() + this.intervalMonths);
      this.nextDue = next;
    }
    const now = new Date();
    const warn = new Date();
    warn.setMonth(warn.getMonth() + 3);
    if (now > this.nextDue) this.status = "red";
    else if (this.nextDue <= warn) this.status = "yellow";
    else this.status = "green";
  } else if (this.intervalMonths === 0 && this.lastDone) {
    this.status = "green";
    this.nextDue = null;
  } else if (!this.lastDone) {
    this.status = "red";
  }
});

module.exports = mongoose.model("Screening", ScreeningSchema);
