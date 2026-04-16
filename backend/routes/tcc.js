const express = require("express");
const router = express.Router();
const { asyncHandler, protect } = require("../middleware");
const { ABCRecord, SMARTGoal, HungerScale, TCCProgress } = require("../models");

// ═══════════════════════════════════════════════════════════
// TCC PROGRESS
// ═══════════════════════════════════════════════════════════

// GET /api/tcc/progress — Get TCC progress
router.get("/progress", protect, asyncHandler(async (req, res) => {
  let progress = await TCCProgress.findOne({ patient: req.patient._id });
  if (!progress) {
    progress = await TCCProgress.create({ patient: req.patient._id });
  }
  res.json({ success: true, data: progress });
}));

// PUT /api/tcc/progress/advance — Advance to next week/phase
router.put("/progress/advance", protect, asyncHandler(async (req, res) => {
  const progress = await TCCProgress.findOne({ patient: req.patient._id });
  if (!progress) return res.status(404).json({ success: false, error: "Progreso no encontrado" });

  progress.currentWeek = Math.min(progress.currentWeek + 1, 8);
  // Auto-advance phase based on week
  if (progress.currentWeek <= 2) progress.currentPhase = 1;
  else if (progress.currentWeek <= 4) progress.currentPhase = 2;
  else if (progress.currentWeek <= 6) progress.currentPhase = 3;
  else progress.currentPhase = 4;

  progress.lastActivityAt = new Date();
  await progress.save();

  // Also update patient record
  const Patient = require("../models/Patient");
  await Patient.findByIdAndUpdate(req.patient._id, {
    tccCurrentPhase: progress.currentPhase,
    tccCurrentWeek: progress.currentWeek,
  });

  res.json({ success: true, data: progress });
}));

// PUT /api/tcc/progress/lesson — Mark a lesson as completed
router.put("/progress/lesson", protect, asyncHandler(async (req, res) => {
  const { lessonId } = req.body;
  const progress = await TCCProgress.findOneAndUpdate(
    { patient: req.patient._id },
    {
      $addToSet: { lessonsCompleted: lessonId },
      $inc: { totalLessonsViewed: 1 },
      lastActivityAt: new Date(),
    },
    { new: true }
  );
  res.json({ success: true, data: progress });
}));

// ═══════════════════════════════════════════════════════════
// ABC RECORDS
// ═══════════════════════════════════════════════════════════

// POST /api/tcc/abc — Create ABC record
router.post("/abc", protect, asyncHandler(async (req, res) => {
  const { antecedent, behavior, consequence, mealContext } = req.body;
  const progress = await TCCProgress.findOne({ patient: req.patient._id });

  const record = await ABCRecord.create({
    patient: req.patient._id,
    antecedent, behavior, consequence, mealContext,
    phase: progress?.currentPhase || 1,
    week: progress?.currentWeek || 1,
  });

  // Update engagement metrics
  if (progress) {
    progress.totalABCRecords += 1;
    progress.lastActivityAt = new Date();
    await progress.save();
  }

  res.status(201).json({ success: true, data: record });
}));

// GET /api/tcc/abc — Get ABC records
router.get("/abc", protect, asyncHandler(async (req, res) => {
  const { limit = 20, week } = req.query;
  const query = { patient: req.patient._id };
  if (week) query.week = parseInt(week);

  const records = await ABCRecord.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({ success: true, count: records.length, data: records });
}));

// ═══════════════════════════════════════════════════════════
// SMART GOALS
// ═══════════════════════════════════════════════════════════

// POST /api/tcc/goals — Create a SMART goal
router.post("/goals", protect, asyncHandler(async (req, res) => {
  const { description, specific, measurable, achievable, relevant, timeBound } = req.body;
  const progress = await TCCProgress.findOne({ patient: req.patient._id });

  const goal = await SMARTGoal.create({
    patient: req.patient._id,
    description, specific, measurable, achievable, relevant, timeBound,
    weekNumber: progress?.currentWeek || 5,
    phase: progress?.currentPhase || 3,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
  });

  if (progress) {
    progress.totalGoalsSet += 1;
    progress.lastActivityAt = new Date();
    await progress.save();
  }

  res.status(201).json({ success: true, data: goal });
}));

// GET /api/tcc/goals — Get goals
router.get("/goals", protect, asyncHandler(async (req, res) => {
  const { status, week } = req.query;
  const query = { patient: req.patient._id };
  if (status) query.status = status;
  if (week) query.weekNumber = parseInt(week);

  const goals = await SMARTGoal.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: goals.length, data: goals });
}));

// PUT /api/tcc/goals/:id/checkin — Daily check-in on a goal
router.put("/goals/:id/checkin", protect, asyncHandler(async (req, res) => {
  const { completed, notes } = req.body;
  const goal = await SMARTGoal.findOne({ _id: req.params.id, patient: req.patient._id });
  if (!goal) return res.status(404).json({ success: false, error: "Meta no encontrada" });

  goal.dailyCheckins.push({ date: new Date(), completed, notes });
  await goal.save();

  res.json({ success: true, data: goal });
}));

// PUT /api/tcc/goals/:id/complete — Complete or close a goal
router.put("/goals/:id/complete", protect, asyncHandler(async (req, res) => {
  const { status, completionNotes } = req.body;
  const goal = await SMARTGoal.findOneAndUpdate(
    { _id: req.params.id, patient: req.patient._id },
    { status: status || "completed", completionNotes },
    { new: true }
  );
  if (!goal) return res.status(404).json({ success: false, error: "Meta no encontrada" });

  if (status === "completed") {
    await TCCProgress.findOneAndUpdate(
      { patient: req.patient._id },
      { $inc: { totalGoalsCompleted: 1 }, lastActivityAt: new Date() }
    );
  }

  res.json({ success: true, data: goal });
}));

// ═══════════════════════════════════════════════════════════
// HUNGER SCALE
// ═══════════════════════════════════════════════════════════

// POST /api/tcc/hunger — Record hunger scale
router.post("/hunger", protect, asyncHandler(async (req, res) => {
  const { beforeMeal, afterMeal, mealType, wasEmotionalHunger, notes } = req.body;
  const entry = await HungerScale.create({
    patient: req.patient._id,
    beforeMeal, afterMeal, mealType, wasEmotionalHunger, notes,
  });

  await TCCProgress.findOneAndUpdate(
    { patient: req.patient._id },
    { $inc: { totalHungerScales: 1 }, lastActivityAt: new Date() }
  );

  res.status(201).json({ success: true, data: entry });
}));

// GET /api/tcc/hunger — Get hunger scale entries
router.get("/hunger", protect, asyncHandler(async (req, res) => {
  const { limit = 20, days } = req.query;
  const query = { patient: req.patient._id };
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    query.createdAt = { $gte: since };
  }
  const entries = await HungerScale.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
  res.json({ success: true, count: entries.length, data: entries });
}));

// ═══════════════════════════════════════════════════════════
// TCC ENGAGEMENT SUMMARY
// ═══════════════════════════════════════════════════════════

// GET /api/tcc/summary — Overall TCC engagement metrics
router.get("/summary", protect, asyncHandler(async (req, res) => {
  const progress = await TCCProgress.findOne({ patient: req.patient._id });
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);

  const [abcThisWeek, goalsActive, hungerThisWeek] = await Promise.all([
    ABCRecord.countDocuments({ patient: req.patient._id, createdAt: { $gte: thisWeek } }),
    SMARTGoal.countDocuments({ patient: req.patient._id, status: "active" }),
    HungerScale.countDocuments({ patient: req.patient._id, createdAt: { $gte: thisWeek } }),
  ]);

  res.json({
    success: true,
    data: {
      progress,
      thisWeek: { abcRecords: abcThisWeek, hungerEntries: hungerThisWeek, activeGoals: goalsActive },
    },
  });
}));

module.exports = router;
