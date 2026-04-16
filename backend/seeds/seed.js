/**
 * Seed script — PrevenApp v2.0
 * Populates MongoDB with demo patients for Centro de Salud de Macaracas
 * Usage: node seeds/seed.js
 */
const mongoose = require("mongoose");
const config = require("../config");
const {
  User, Patient, BPReading, GlucoseReading, WeightReading,
  Medication, MedLog, Screening, ABCRecord, SMARTGoal, TCCProgress,
} = require("../models");

const seed = async () => {
  await mongoose.connect(config.mongoURI);
  console.log("🌱 Conectado a MongoDB. Iniciando seed...");

  // Clear existing data
  const models = [User, Patient, BPReading, GlucoseReading, WeightReading, Medication, MedLog, Screening, ABCRecord, SMARTGoal, TCCProgress];
  for (const Model of models) await Model.deleteMany({});
  console.log("🗑️  Datos anteriores eliminados.");

  // ─── Create doctor user ────────────────────────────────
  const doctor = await User.create({
    cedula: "8-937-44",
    password: "doctor2026",
    name: "Dr. Jonathan Jethmal Solís",
    role: "doctor",
    phone: "6000-0000",
    email: "jonathan.jethmal@minsa.gob.pa",
  });
  console.log("👨‍⚕️ Doctor creado:", doctor.name);

  // ─── Create patients ───────────────────────────────────
  const patientsData = [
    {
      cedula: "7-100-1001", name: "María del Carmen Vásquez", phone: "6701-1001",
      dateOfBirth: new Date("1968-04-12"), sex: "F", height: 158, weight: 78.5, waist: 94,
      diagnoses: [
        { name: "Hipertensión arterial", code: "I10", dateOfDiagnosis: new Date("2019-03-01"), isActive: true },
        { name: "Diabetes mellitus tipo 2", code: "E11.9", dateOfDiagnosis: new Date("2020-08-15"), isActive: true },
      ],
      familyHistory: [
        { condition: "HTA", relative: "Madre" },
        { condition: "DM2", relative: "Padre" },
        { condition: "Ca de mama", relative: "Abuela materna" },
        { condition: "IAM", relative: "Padre", notes: "Fallecido a los 68 años" },
      ],
      meds: [
        { name: "Losartán", dose: "50mg", frequency: "QD", schedules: ["08:00"], indication: "HTA" },
        { name: "Metformina", dose: "850mg", frequency: "BID", schedules: ["07:00", "19:00"], indication: "DM2" },
        { name: "Amlodipino", dose: "5mg", frequency: "QD", schedules: ["20:00"], indication: "HTA" },
      ],
      bp: [
        { sys: 148, dia: 92 }, { sys: 142, dia: 88 }, { sys: 138, dia: 86 },
        { sys: 145, dia: 90 }, { sys: 136, dia: 84 }, { sys: 132, dia: 82 },
        { sys: 140, dia: 87 }, { sys: 134, dia: 83 }, { sys: 130, dia: 80 }, { sys: 128, dia: 78 },
      ],
      glucose: [
        { val: 142, type: "fasting" }, { val: 156, type: "fasting" },
        { val: 138, type: "fasting" }, { val: 145, type: "fasting" },
        { val: 132, type: "fasting" }, { val: 128, type: "fasting" },
      ],
    },
    {
      cedula: "7-200-2002", name: "Roberto Alexis Sánchez", phone: "6702-2002",
      dateOfBirth: new Date("1962-11-23"), sex: "M", height: 172, weight: 92, waist: 106,
      riskFactors: { smoking: "former", cigarettesPerDay: 10, yearsSmoked: 20 },
      diagnoses: [
        { name: "Hipertensión arterial", code: "I10", dateOfDiagnosis: new Date("2015-06-01"), isActive: true },
        { name: "Diabetes mellitus tipo 2", code: "E11.9", dateOfDiagnosis: new Date("2018-02-10"), isActive: true },
        { name: "Obesidad", code: "E66.9", dateOfDiagnosis: new Date("2018-02-10"), isActive: true },
      ],
      familyHistory: [
        { condition: "DM2", relative: "Madre" },
        { condition: "HTA", relative: "Padre" },
        { condition: "Ca de próstata", relative: "Padre", notes: "Dx a los 72 años" },
        { condition: "ACV", relative: "Abuelo paterno" },
      ],
      meds: [
        { name: "Enalapril", dose: "20mg", frequency: "BID", schedules: ["07:00", "19:00"], indication: "HTA" },
        { name: "Metformina", dose: "850mg", frequency: "BID", schedules: ["07:00", "19:00"], indication: "DM2" },
        { name: "Hidroclorotiazida", dose: "25mg", frequency: "QD", schedules: ["07:00"], indication: "HTA" },
        { name: "Atorvastatina", dose: "40mg", frequency: "QD", schedules: ["21:00"], indication: "Dislipidemia" },
      ],
      bp: [
        { sys: 158, dia: 96 }, { sys: 155, dia: 94 }, { sys: 152, dia: 93 },
        { sys: 150, dia: 92 }, { sys: 148, dia: 90 }, { sys: 152, dia: 94 },
      ],
      glucose: [
        { val: 186, type: "fasting" }, { val: 192, type: "fasting" },
        { val: 178, type: "fasting" }, { val: 168, type: "fasting" },
      ],
    },
    {
      cedula: "7-300-3003", name: "Carmen Lucía Rodríguez", phone: "6703-3003",
      dateOfBirth: new Date("1974-07-08"), sex: "F", height: 162, weight: 68, waist: 84,
      diagnoses: [
        { name: "Hipertensión arterial", code: "I10", dateOfDiagnosis: new Date("2022-01-15"), isActive: true },
      ],
      familyHistory: [
        { condition: "HTA", relative: "Madre" },
        { condition: "HTA", relative: "Padre" },
      ],
      meds: [
        { name: "Losartán", dose: "50mg", frequency: "QD", schedules: ["08:00"], indication: "HTA" },
      ],
      bp: [
        { sys: 132, dia: 82 }, { sys: 128, dia: 78 }, { sys: 126, dia: 76 },
        { sys: 124, dia: 76 }, { sys: 122, dia: 74 }, { sys: 124, dia: 76 },
      ],
      glucose: [],
    },
    {
      cedula: "7-400-4004", name: "José Manuel González", phone: "6704-4004",
      dateOfBirth: new Date("1955-02-28"), sex: "M", height: 168, weight: 82, waist: 98,
      riskFactors: { smoking: "current", cigarettesPerDay: 15, yearsSmoked: 30 },
      diagnoses: [
        { name: "Hipertensión arterial", code: "I10", dateOfDiagnosis: new Date("2010-05-20"), isActive: true },
        { name: "Síndrome metabólico", code: "E88.81", dateOfDiagnosis: new Date("2019-11-01"), isActive: true },
      ],
      familyHistory: [
        { condition: "IAM", relative: "Padre", notes: "Fallecido a los 60 años" },
        { condition: "DM2", relative: "Hermana" },
        { condition: "Ca de colon", relative: "Madre" },
      ],
      meds: [
        { name: "Amlodipino", dose: "10mg", frequency: "QD", schedules: ["08:00"], indication: "HTA" },
        { name: "Enalapril", dose: "10mg", frequency: "BID", schedules: ["08:00", "20:00"], indication: "HTA" },
      ],
      bp: [
        { sys: 148, dia: 92 }, { sys: 144, dia: 88 }, { sys: 142, dia: 88 },
        { sys: 140, dia: 86 }, { sys: 138, dia: 84 },
      ],
      glucose: [
        { val: 118, type: "fasting" }, { val: 122, type: "fasting" }, { val: 114, type: "fasting" },
      ],
    },
    {
      cedula: "7-500-5005", name: "Ana Isabel Pérez", phone: "6705-5005",
      dateOfBirth: new Date("1979-09-15"), sex: "F", height: 155, weight: 62, waist: 78,
      diagnoses: [
        { name: "Hipertensión arterial", code: "I10", dateOfDiagnosis: new Date("2023-06-01"), isActive: true },
      ],
      familyHistory: [
        { condition: "HTA", relative: "Madre" },
        { condition: "Ca de mama", relative: "Tía materna" },
      ],
      meds: [
        { name: "Losartán", dose: "50mg", frequency: "QD", schedules: ["08:00"], indication: "HTA" },
      ],
      bp: [
        { sys: 126, dia: 78 }, { sys: 122, dia: 76 }, { sys: 120, dia: 74 },
        { sys: 118, dia: 72 }, { sys: 120, dia: 74 },
      ],
      glucose: [],
    },
  ];

  for (const pd of patientsData) {
    // Create user
    const user = await User.create({
      cedula: pd.cedula, password: "paciente2026",
      name: pd.name, phone: pd.phone, role: "patient",
    });

    // Create patient
    const patient = await Patient.create({
      user: user._id, dateOfBirth: pd.dateOfBirth, sex: pd.sex,
      height: pd.height, weight: pd.weight, waistCircumference: pd.waist,
      diagnoses: pd.diagnoses,
      familyHistory: pd.familyHistory || [],
      riskFactors: pd.riskFactors || { smoking: "never" },
      enrollmentDate: new Date(),
      consentSigned: true,
      consent: { version: "1.0", dateAccepted: new Date(), method: "digital" },
      onboardingCompleted: true,
      createdBy: "self",
      studyId: `MAC-${pd.cedula.split("-").pop()}`,
    });

    // Create TCC progress
    await TCCProgress.create({ patient: patient._id, currentPhase: 1, currentWeek: 3 });

    // Create medications
    for (const med of pd.meds) {
      await Medication.create({ ...med, patient: patient._id });
    }

    // Create BP readings (last N days)
    for (let i = 0; i < pd.bp.length; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (pd.bp.length - 1 - i));
      date.setHours(8, 0, 0, 0);
      await BPReading.create({
        patient: patient._id,
        systolic: pd.bp[i].sys, diastolic: pd.bp[i].dia,
        source: "self", measuredAt: date,
      });
    }

    // Create glucose readings
    for (let i = 0; i < pd.glucose.length; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (pd.glucose.length - 1 - i) * 2);
      date.setHours(7, 0, 0, 0);
      await GlucoseReading.create({
        patient: patient._id,
        value: pd.glucose[i].val, type: pd.glucose[i].type,
        source: "self", measuredAt: date,
      });
    }

    // Auto-generate screenings using the rules engine
    const { generateScreeningsForPatient } = require("../rules/screeningRules");
    const recommended = generateScreeningsForPatient(patient);

    for (const rec of recommended) {
      // Randomly assign some as completed, some as overdue for demo purposes
      let lastDone = null;
      if (rec.intervalMonths > 0) {
        const rand = Math.random();
        if (rand > 0.3) {
          lastDone = new Date();
          lastDone.setMonth(lastDone.getMonth() - Math.floor(Math.random() * rec.intervalMonths * 2));
        }
      }
      await Screening.create({
        patient: patient._id,
        name: rec.name,
        category: rec.category,
        intervalMonths: rec.intervalMonths,
        reason: rec.reason,
        source: rec.source,
        priority: rec.priority,
        lastDone,
      });
    }

    console.log(`  ✅ ${pd.name} (${pd.cedula}) — ${pd.meds.length} meds, ${pd.bp.length} BP, ${pd.glucose.length} gluc`);
  }

  // Create a sample ABC record for María
  const maria = await Patient.findOne({ studyId: "MAC-1001" });
  if (maria) {
    await ABCRecord.create({
      patient: maria._id,
      antecedent: "Me sentía estresada después de un día largo en el trabajo. Llegué a casa cansada.",
      behavior: "Comí un paquete completo de galletas con un vaso de jugo azucarado.",
      consequence: "Me sentí culpable y con el estómago pesado. Pensé que nunca voy a poder controlarme.",
      phase: 1, week: 2,
      mealContext: { where: "casa", withWhom: "sola", emotion: "estresada" },
    });

    await SMARTGoal.create({
      patient: maria._id,
      description: "Caminar 20 minutos después del almuerzo los lunes, miércoles y viernes.",
      specific: "Caminar en el parque del pueblo",
      measurable: "3 caminatas por semana",
      achievable: "Puedo salir durante la hora de almuerzo",
      relevant: "Mejora mi glucosa y mi presión",
      timeBound: "Esta semana",
      weekNumber: 3, phase: 3, status: "active",
    });
  }

  console.log("\n🎉 Seed completado exitosamente!");
  console.log(`   📊 ${patientsData.length} pacientes + 1 médico`);
  console.log(`   🔑 Login médico: cédula=8-937-44, contraseña=doctor2026`);
  console.log(`   🔑 Login paciente: cédula=7-100-1001, contraseña=paciente2026`);
  process.exit(0);
};

seed().catch(err => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
