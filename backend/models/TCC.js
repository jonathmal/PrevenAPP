const mongoose = require("mongoose");

// ─── ABC Record (Antecedent-Behavior-Consequence) ────────
const ABCRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  antecedent: { type: String, required: true }, // What happened before
  behavior: { type: String, required: true },   // What did you do
  consequence: { type: String, required: true }, // How did you feel after
  phase: { type: Number, min: 1, max: 4 },
  week: { type: Number, min: 1, max: 8 },
  mealContext: {
    where: String,     // home, work, restaurant, etc.
    withWhom: String,  // alone, family, friends
    emotion: String,   // stressed, bored, happy, sad, anxious
  },
}, { timestamps: true });

ABCRecordSchema.index({ patient: 1, createdAt: -1 });

// ─── SMART Goal ──────────────────────────────────────────
const SMARTGoalSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  description: { type: String, required: true },
  specific: String,    // What exactly
  measurable: String,  // How will you measure
  achievable: String,  // Why is it realistic
  relevant: String,    // Why does it matter
  timeBound: String,   // When by
  weekNumber: { type: Number, min: 1, max: 8 },
  phase: { type: Number, min: 3, max: 4 }, // Goals start in phase 3
  status: { type: String, enum: ["active", "completed", "partial", "missed"], default: "active" },
  completionNotes: String,
  dailyCheckins: [{
    date: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    notes: String,
  }],
  startDate: { type: Date, default: Date.now },
  endDate: Date,
}, { timestamps: true });

SMARTGoalSchema.index({ patient: 1, weekNumber: 1 });

// ─── Hunger Scale Entry ──────────────────────────────────
const HungerScaleSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  beforeMeal: { type: Number, required: true, min: 1, max: 10 }, // 1=starving, 10=stuffed
  afterMeal: { type: Number, required: true, min: 1, max: 10 },
  mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
  wasEmotionalHunger: { type: Boolean },
  notes: String,
}, { timestamps: true });

// ─── TCC Progress (overall tracking) ─────────────────────
const TCCProgressSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, unique: true },
  currentPhase: { type: Number, default: 1, min: 1, max: 4 },
  currentWeek: { type: Number, default: 1, min: 1, max: 8 },
  phaseCompletions: [{
    phase: Number,
    completedAt: Date,
    toolsUsed: [String],
  }],
  // Engagement metrics
  totalABCRecords: { type: Number, default: 0 },
  totalGoalsSet: { type: Number, default: 0 },
  totalGoalsCompleted: { type: Number, default: 0 },
  totalHungerScales: { type: Number, default: 0 },
  totalLessonsViewed: { type: Number, default: 0 },
  // Content progress
  lessonsCompleted: [{ type: String }], // lesson IDs
  distortionsReviewed: [{ type: String }], // distortion IDs
  lastActivityAt: Date,
}, { timestamps: true });

const ABCRecord = mongoose.model("ABCRecord", ABCRecordSchema);
const SMARTGoal = mongoose.model("SMARTGoal", SMARTGoalSchema);
const HungerScale = mongoose.model("HungerScale", HungerScaleSchema);
const TCCProgress = mongoose.model("TCCProgress", TCCProgressSchema);

module.exports = { ABCRecord, SMARTGoal, HungerScale, TCCProgress };
