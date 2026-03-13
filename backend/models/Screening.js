const mongoose = require("mongoose");

const ScreeningSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ["oncologic", "cardiovascular", "metabolic", "general"], default: "general" },
  intervalMonths: { type: Number, required: true }, // e.g., 24 for "every 2 years"
  lastDone: Date,
  nextDue: Date,
  status: { type: String, enum: ["green", "yellow", "red"], default: "red" },
  result: String, // latest result notes
  orderedBy: String,
  reason: String, // why this screening was recommended
  source: String, // guideline source (USPSTF, MINSA, ADA, etc.)
  priority: { type: String, enum: ["alta", "media", "baja"], default: "media" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Compute status and nextDue on save
ScreeningSchema.pre("save", function () {
  if (this.lastDone && this.intervalMonths) {
    const next_due = new Date(this.lastDone);
    next_due.setMonth(next_due.getMonth() + this.intervalMonths);
    this.nextDue = next_due;

    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (now > next_due) {
      this.status = "red"; // overdue
    } else if (next_due <= threeMonthsFromNow) {
      this.status = "yellow"; // due within 3 months
    } else {
      this.status = "green"; // up to date
    }
  } else if (!this.lastDone) {
    this.status = "red"; // never done
  }
});

module.exports = mongoose.model("Screening", ScreeningSchema);
