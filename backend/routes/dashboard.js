const express = require("express");
const router = express.Router();
const { asyncHandler, protect, authorize } = require("../middleware");
const {
  Patient, BPReading, GlucoseReading, Medication, MedLog,
  Screening, TCCProgress, ABCRecord, SMARTGoal,
} = require("../models");

// All routes require doctor or admin role
router.use(protect, authorize("doctor", "admin"));

// GET /api/dashboard/overview — High-level stats
router.get("/overview", asyncHandler(async (req, res) => {
  const patients = await Patient.find({ isActive: true }).populate("user", "name cedula");
  const totalPatients = patients.length;

  // Get latest BP for each patient
  const patientSummaries = await Promise.all(patients.map(async (patient) => {
    const [latestBP, latestGluc, tccProgress] = await Promise.all([
      BPReading.findOne({ patient: patient._id }).sort({ measuredAt: -1 }),
      GlucoseReading.findOne({ patient: patient._id }).sort({ measuredAt: -1 }),
      TCCProgress.findOne({ patient: patient._id }),
    ]);

    // Calculate today's adherence
    const date = new Date().toISOString().split("T")[0];
    const medsCount = await Medication.countDocuments({ patient: patient._id, isActive: true });
    const takenCount = await MedLog.countDocuments({ patient: patient._id, date, taken: true });
    const adherence = medsCount > 0 ? Math.round((takenCount / medsCount) * 100) : null;

    // Screening alerts
    const overdueScreenings = await Screening.countDocuments({ patient: patient._id, status: "red", isActive: true });

    // Calculate alert level
    let alertCount = 0;
    if (latestBP?.status === "red") alertCount++;
    if (latestGluc?.status === "red") alertCount++;
    if (adherence !== null && adherence < 60) alertCount++;
    if (overdueScreenings > 0) alertCount++;

    return {
      patient: {
        id: patient._id,
        name: patient.user?.name || "N/A",
        age: patient.age,
        sex: patient.sex,
        diagnoses: patient.diagnoses?.filter(d => d.isActive).map(d => d.name) || [],
      },
      vitals: {
        bp: latestBP ? { value: `${latestBP.systolic}/${latestBP.diastolic}`, status: latestBP.status, date: latestBP.measuredAt } : null,
        glucose: latestGluc ? { value: latestGluc.value, status: latestGluc.status, date: latestGluc.measuredAt } : null,
      },
      adherence,
      tcc: tccProgress ? { phase: tccProgress.currentPhase, week: tccProgress.currentWeek, lastActivity: tccProgress.lastActivityAt } : null,
      overdueScreenings,
      alertCount,
      lastActive: tccProgress?.lastActivityAt || latestBP?.measuredAt || null,
    };
  }));

  // Sort by alert count descending
  patientSummaries.sort((a, b) => b.alertCount - a.alertCount);

  // Aggregate stats
  const patientsInAlert = patientSummaries.filter(p => p.alertCount > 0).length;
  const avgAdherence = patientSummaries.filter(p => p.adherence !== null).reduce((sum, p) => sum + p.adherence, 0)
    / (patientSummaries.filter(p => p.adherence !== null).length || 1);
  const bpControlled = patientSummaries.filter(p => p.vitals.bp && p.vitals.bp.status === "green").length;

  res.json({
    success: true,
    data: {
      summary: {
        totalPatients,
        patientsInAlert,
        avgAdherence: Math.round(avgAdherence),
        bpControlled,
        bpControlRate: totalPatients > 0 ? Math.round((bpControlled / totalPatients) * 100) : 0,
      },
      patients: patientSummaries,
    },
  });
}));

// GET /api/dashboard/patient/:patientId — Detailed patient view
router.get("/patient/:patientId", asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId).populate("user", "name cedula phone");
  if (!patient) return res.status(404).json({ success: false, error: "Paciente no encontrado" });

  const [bpHistory, glucHistory, medications, screenings, tccProgress, abcRecords, goals] = await Promise.all([
    BPReading.find({ patient: patient._id }).sort({ measuredAt: -1 }).limit(30),
    GlucoseReading.find({ patient: patient._id }).sort({ measuredAt: -1 }).limit(30),
    Medication.find({ patient: patient._id, isActive: true }),
    Screening.find({ patient: patient._id, isActive: true }),
    TCCProgress.findOne({ patient: patient._id }),
    ABCRecord.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(10),
    SMARTGoal.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(10),
  ]);

  // 7-day adherence
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split("T")[0];
  const medLogs = await MedLog.find({ patient: patient._id, date: { $gte: dateStr } });
  const takenLogs = medLogs.filter(l => l.taken).length;
  const adherence7d = medLogs.length > 0 ? Math.round((takenLogs / medLogs.length) * 100) : null;

  res.json({
    success: true,
    data: {
      patient,
      vitals: { bp: bpHistory, glucose: glucHistory },
      medications,
      screenings,
      adherence7d,
      tcc: { progress: tccProgress, recentABC: abcRecords, recentGoals: goals },
    },
  });
}));

module.exports = router;
