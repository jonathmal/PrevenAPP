/**
 * ═══════════════════════════════════════════════════════════════
 * PrevenApp v2.0 — Motor de Reglas de Tamizaje
 * ═══════════════════════════════════════════════════════════════
 *
 * Fuentes:
 *  - Plan Estratégico Nacional para la Prevención y Control del Cáncer 2019-2029 (MINSA Panamá)
 *  - Normas de Prevención, Detección y Seguimiento de Lesiones Preinvasoras CaCu (MINSA)
 *  - USPSTF A & B Recommendations (2024-2025)
 *  - ADA Standards of Care in Diabetes 2025
 *  - ACC/AHA Hypertension Guidelines 2017
 *  - ACS Cancer Screening Guidelines 2024
 *  - GOLD 2026 (EPOC)
 *
 * Cada regla evalúa: edad, sexo, diagnósticos, antecedentes familiares,
 * hábitos tóxicos, IMC, circunferencia de cintura, y valores vitales.
 */

// ─── Helper: check if patient has a diagnosis ───────────────
function hasDx(patient, keywords) {
  if (!patient.diagnoses) return false;
  return patient.diagnoses.some(d =>
    d.isActive && keywords.some(kw =>
      d.name.toLowerCase().includes(kw.toLowerCase()) ||
      (d.code && d.code.toLowerCase().startsWith(kw.toLowerCase()))
    )
  );
}

// ─── Helper: check family history ───────────────────────────
function hasFamilyHx(patient, keywords) {
  if (!patient.familyHistory) return false;
  return patient.familyHistory.some(fh =>
    keywords.some(kw => fh.condition.toLowerCase().includes(kw.toLowerCase()))
  );
}

// ─── Helper: smoking status ─────────────────────────────────
function isSmokerOrFormer(patient) {
  return patient.riskFactors?.smoking === "current" || patient.riskFactors?.smoking === "former";
}

function isCurrentSmoker(patient) {
  return patient.riskFactors?.smoking === "current";
}

function packYears(patient) {
  const cpd = patient.riskFactors?.cigarettesPerDay || 0;
  const years = patient.riskFactors?.yearsSmoked || 0;
  return (cpd / 20) * years;
}

// ─── Helper: BMI ────────────────────────────────────────────
function getBMI(patient) {
  if (patient.bmi) return parseFloat(patient.bmi);
  if (patient.height && patient.weight) {
    return parseFloat((patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1));
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// SCREENING RULES — Cada regla retorna null (no aplica) o un
// objeto { name, category, intervalMonths, reason, source, priority }
// ═══════════════════════════════════════════════════════════════

const SCREENING_RULES = [

  // ─── ONCOLÓGICOS (Preventivos) ────────────────────────────

  // 1. CÁNCER DE MAMA — Mamografía
  (p) => {
    if (p.sex !== "F") return null;
    const age = p.age;
    const fhx = hasFamilyHx(p, ["mama", "breast", "brca"]);

    if (fhx && age >= 30) {
      return {
        name: "Mamografía",
        category: "oncologic",
        intervalMonths: 12,
        reason: "Mujer con antecedente familiar de Ca de mama — inicio temprano",
        source: "ACS 2024 / MINSA",
        priority: "alta",
      };
    }
    if (age >= 40 && age <= 74) {
      return {
        name: "Mamografía",
        category: "oncologic",
        intervalMonths: age >= 55 ? 24 : 12,
        reason: age >= 55
          ? "Mujer 55-74 años — tamizaje bienal recomendado"
          : "Mujer 40-54 años — tamizaje anual recomendado",
        source: "MINSA Plan Nacional Cáncer / ACS 2024",
        priority: age < 55 ? "alta" : "media",
      };
    }
    return null;
  },

  // 2. CÁNCER CERVICOUTERINO — Pap / VPH
  (p) => {
    if (p.sex !== "F") return null;
    const age = p.age;

    if (age >= 21 && age <= 29) {
      return {
        name: "Citología cervical (Papanicolaou)",
        category: "oncologic",
        intervalMonths: 36,
        reason: "Mujer 21-29 años — Pap cada 3 años",
        source: "USPSTF 2024 / MINSA Normas CaCu",
        priority: "alta",
      };
    }
    if (age >= 30 && age <= 65) {
      return {
        name: "Prueba VPH / Citología cervical",
        category: "oncologic",
        intervalMonths: 60,
        reason: "Mujer 30-65 años — prueba VPH cada 5 años (o Pap c/3 años)",
        source: "USPSTF 2024 / MINSA Normas CaCu / OPS",
        priority: "alta",
      };
    }
    return null;
  },

  // 3. CÁNCER DE PRÓSTATA — PSA + Tacto rectal
  (p) => {
    if (p.sex !== "M") return null;
    const age = p.age;
    const fhx = hasFamilyHx(p, ["próstata", "prostat"]);

    if (fhx && age >= 40) {
      return {
        name: "PSA + Tacto rectal",
        category: "oncologic",
        intervalMonths: 12,
        reason: "Hombre con antecedente familiar de Ca de próstata — inicio a los 40",
        source: "MINSA Plan Nacional Cáncer / ACS 2024",
        priority: "alta",
      };
    }
    if (age >= 50 && age <= 75) {
      return {
        name: "PSA + Tacto rectal",
        category: "oncologic",
        intervalMonths: 12,
        reason: "Hombre ≥50 años — tamizaje anual (decisión compartida)",
        source: "MINSA Plan Nacional Cáncer",
        priority: "media",
      };
    }
    return null;
  },

  // 4. CÁNCER COLORRECTAL — SOH / Colonoscopía
  (p) => {
    const age = p.age;
    const fhx = hasFamilyHx(p, ["colon", "colorrectal", "intestin"]);

    if (fhx && age >= 40) {
      return {
        name: "Sangre oculta en heces / Colonoscopía",
        category: "oncologic",
        intervalMonths: 12,
        reason: "Antecedente familiar de Ca colorrectal — SOH anual o colonoscopía c/5 años",
        source: "ACS 2024 / USPSTF",
        priority: "alta",
      };
    }
    if (age >= 45 && age <= 75) {
      return {
        name: "Sangre oculta en heces (SOH)",
        category: "oncologic",
        intervalMonths: 12,
        reason: "Adulto 45-75 años — tamizaje anual con SOH (o colonoscopía c/10 años)",
        source: "USPSTF 2021 / MINSA",
        priority: "media",
      };
    }
    return null;
  },

  // 5. CÁNCER DE PULMÓN — TAC baja dosis
  (p) => {
    const age = p.age;
    const py = packYears(p);
    const rf = p.riskFactors;

    if (age >= 50 && age <= 80 && py >= 20 && (rf?.smoking === "current" || rf?.smoking === "former")) {
      return {
        name: "TAC de tórax de baja dosis",
        category: "oncologic",
        intervalMonths: 12,
        reason: `Paciente ${age} años, ${py.toFixed(0)} paquetes-año — tamizaje anual de Ca de pulmón`,
        source: "USPSTF 2021",
        priority: "alta",
      };
    }
    return null;
  },

  // ─── CARDIOVASCULAR ───────────────────────────────────────

  // 6. PERFIL LIPÍDICO
  (p) => {
    const age = p.age;
    const hasRF = hasDx(p, ["hipertens", "I10", "diabetes", "E11", "metabólic"]) || isCurrentSmoker(p);
    const bmi = getBMI(p);

    if (hasDx(p, ["hipertens", "I10", "diabetes", "E11", "metabólic"])) {
      return {
        name: "Perfil lipídico completo",
        category: "cardiovascular",
        intervalMonths: 12,
        reason: "Paciente con ECNT — control anual de lípidos",
        source: "ACC/AHA 2018 / ADA 2025",
        priority: "alta",
      };
    }
    if ((p.sex === "M" && age >= 35) || (p.sex === "F" && age >= 45)) {
      return {
        name: "Perfil lipídico completo",
        category: "cardiovascular",
        intervalMonths: hasRF ? 12 : 60,
        reason: hasRF
          ? "Adulto con factores de riesgo — perfil lipídico anual"
          : "Tamizaje de rutina — perfil lipídico cada 5 años",
        source: "USPSTF / ACC/AHA",
        priority: hasRF ? "alta" : "baja",
      };
    }
    if (age >= 20 && (bmi && bmi >= 25 || hasRF)) {
      return {
        name: "Perfil lipídico completo",
        category: "cardiovascular",
        intervalMonths: 60,
        reason: "Adulto joven con sobrepeso o factores de riesgo — tamizaje cada 5 años",
        source: "USPSTF / ACC/AHA",
        priority: "baja",
      };
    }
    return null;
  },

  // 7. ELECTROCARDIOGRAMA
  (p) => {
    if (hasDx(p, ["hipertens", "I10"])) {
      return {
        name: "Electrocardiograma (EKG)",
        category: "cardiovascular",
        intervalMonths: 12,
        reason: "Paciente hipertenso — EKG anual para evaluar hipertrofia ventricular",
        source: "ACC/AHA 2017",
        priority: "media",
      };
    }
    if (hasDx(p, ["diabetes", "E11"]) && p.age >= 40) {
      return {
        name: "Electrocardiograma (EKG)",
        category: "cardiovascular",
        intervalMonths: 12,
        reason: "Diabético ≥40 años — evaluación cardiovascular anual",
        source: "ADA 2025",
        priority: "media",
      };
    }
    return null;
  },

  // 8. CREATININA / BUN / TFG
  (p) => {
    if (hasDx(p, ["hipertens", "I10", "diabetes", "E11"])) {
      return {
        name: "Creatinina + BUN + TFG estimada",
        category: "cardiovascular",
        intervalMonths: 12,
        reason: "Paciente con HTA y/o DM2 — función renal anual",
        source: "ADA 2025 / ACC/AHA 2017 / KDIGO",
        priority: "alta",
      };
    }
    return null;
  },

  // 9. ANEURISMA AÓRTICO ABDOMINAL
  (p) => {
    if (p.sex === "M" && p.age >= 65 && p.age <= 75 && isSmokerOrFormer(p)) {
      return {
        name: "Ultrasonido abdominal (tamizaje AAA)",
        category: "cardiovascular",
        intervalMonths: 0, // una sola vez
        reason: "Hombre 65-75 años con historia de tabaquismo — tamizaje único de AAA",
        source: "USPSTF 2019",
        priority: "media",
      };
    }
    return null;
  },

  // ─── METABÓLICO ───────────────────────────────────────────

  // 10. HbA1c
  (p) => {
    if (hasDx(p, ["diabetes", "E11", "E10"])) {
      return {
        name: "Hemoglobina glicosilada (HbA1c)",
        category: "metabolic",
        intervalMonths: 3,
        reason: "Paciente diabético — HbA1c cada 3 meses (c/6 si en meta)",
        source: "ADA 2025",
        priority: "alta",
      };
    }
    return null;
  },

  // 11. GLUCOSA EN AYUNAS — tamizaje de DM2
  (p) => {
    if (hasDx(p, ["diabetes", "E11", "E10"])) return null; // ya tiene dx
    const age = p.age;
    const bmi = getBMI(p);
    const fhx = hasFamilyHx(p, ["diabetes", "DM2", "DM1"]);

    if (age >= 35 && bmi && bmi >= 25) {
      return {
        name: "Glucosa en ayunas (tamizaje DM2)",
        category: "metabolic",
        intervalMonths: 36,
        reason: "Adulto ≥35 años con sobrepeso — tamizaje de diabetes cada 3 años",
        source: "USPSTF 2021 / ADA 2025",
        priority: "media",
      };
    }
    if (age >= 30 && fhx) {
      return {
        name: "Glucosa en ayunas (tamizaje DM2)",
        category: "metabolic",
        intervalMonths: 36,
        reason: "Adulto con antecedente familiar de DM2 — tamizaje cada 3 años",
        source: "ADA 2025",
        priority: "media",
      };
    }
    return null;
  },

  // 12. MICROALBUMINURIA
  (p) => {
    if (hasDx(p, ["diabetes", "E11"])) {
      return {
        name: "Microalbuminuria (relación albúmina/creatinina)",
        category: "metabolic",
        intervalMonths: 12,
        reason: "Paciente diabético — tamizaje anual de nefropatía",
        source: "ADA 2025 / KDIGO",
        priority: "alta",
      };
    }
    if (hasDx(p, ["hipertens", "I10"]) && hasDx(p, ["diabetes", "E11"])) {
      return {
        name: "Microalbuminuria (relación albúmina/creatinina)",
        category: "metabolic",
        intervalMonths: 12,
        reason: "HTA + DM2 — alto riesgo de nefropatía",
        source: "KDIGO / ADA 2025",
        priority: "alta",
      };
    }
    return null;
  },

  // 13. TSH — tamizaje tiroideo
  (p) => {
    if (p.sex === "F" && p.age >= 50) {
      return {
        name: "TSH (función tiroidea)",
        category: "metabolic",
        intervalMonths: 60,
        reason: "Mujer ≥50 años — tamizaje de hipotiroidismo cada 5 años",
        source: "ATA / AACE",
        priority: "baja",
      };
    }
    return null;
  },

  // 14. ÁCIDO ÚRICO
  (p) => {
    if (hasDx(p, ["metabólic", "E88", "gota"])) {
      return {
        name: "Ácido úrico sérico",
        category: "metabolic",
        intervalMonths: 12,
        reason: "Síndrome metabólico — control anual de ácido úrico",
        source: "Práctica clínica",
        priority: "baja",
      };
    }
    return null;
  },

  // ─── GENERAL ──────────────────────────────────────────────

  // 15. EXAMEN FÍSICO PREVENTIVO
  (p) => {
    return {
      name: "Examen físico preventivo completo",
      category: "general",
      intervalMonths: 12,
      reason: "Evaluación integral anual recomendada",
      source: "MINSA / Práctica clínica",
      priority: "media",
    };
  },

  // 16. DENSITOMETRÍA ÓSEA
  (p) => {
    if (p.sex === "F" && p.age >= 65) {
      return {
        name: "Densitometría ósea (DEXA)",
        category: "general",
        intervalMonths: 24,
        reason: "Mujer ≥65 años — tamizaje de osteoporosis",
        source: "USPSTF 2025",
        priority: "media",
      };
    }
    if (p.sex === "F" && p.age >= 50 && (isCurrentSmoker(p) || getBMI(p) < 20)) {
      return {
        name: "Densitometría ósea (DEXA)",
        category: "general",
        intervalMonths: 24,
        reason: "Mujer postmenopáusica con factores de riesgo — tamizaje de osteoporosis",
        source: "USPSTF 2025",
        priority: "baja",
      };
    }
    return null;
  },

  // 17. EXAMEN OFTALMOLÓGICO
  (p) => {
    if (hasDx(p, ["diabetes", "E11", "E10"])) {
      return {
        name: "Examen oftalmológico (fondo de ojo)",
        category: "general",
        intervalMonths: 12,
        reason: "Paciente diabético — tamizaje anual de retinopatía",
        source: "ADA 2025",
        priority: "alta",
      };
    }
    if (p.age >= 65) {
      return {
        name: "Examen oftalmológico",
        category: "general",
        intervalMonths: 24,
        reason: "Adulto ≥65 años — evaluación visual bienal",
        source: "AAO / AAFP",
        priority: "baja",
      };
    }
    return null;
  },

  // 18. HEMOGRAMA COMPLETO
  (p) => {
    if (hasDx(p, ["hipertens", "diabetes", "metabólic", "renal"])) {
      return {
        name: "Hemograma completo",
        category: "general",
        intervalMonths: 12,
        reason: "Paciente con ECNT — hemograma anual de control",
        source: "Práctica clínica",
        priority: "baja",
      };
    }
    return null;
  },

  // 19. DEPRESIÓN — PHQ-2 / PHQ-9
  (p) => {
    if (p.age >= 18) {
      return {
        name: "Tamizaje de depresión (PHQ-2)",
        category: "general",
        intervalMonths: 12,
        reason: "Tamizaje anual de depresión en adultos",
        source: "USPSTF 2016",
        priority: "baja",
      };
    }
    return null;
  },

  // 20. CONSEJERÍA DE CESACIÓN TABÁQUICA
  (p) => {
    if (isCurrentSmoker(p)) {
      return {
        name: "Consejería de cesación tabáquica",
        category: "general",
        intervalMonths: 6,
        reason: "Fumador activo — intervención conductual de cesación",
        source: "USPSTF 2021",
        priority: "alta",
      };
    }
    return null;
  },

  // 21. TAMIZAJE DE PREDIABETES CON IMC ≥ 25 y cintura elevada
  (p) => {
    if (hasDx(p, ["diabetes", "E11", "E10"])) return null;
    const bmi = getBMI(p);
    const waist = p.waistCircumference;
    const elevatedWaist = (p.sex === "M" && waist >= 102) || (p.sex === "F" && waist >= 88);

    if (bmi && bmi >= 30 && elevatedWaist) {
      return {
        name: "HbA1c + Glucosa en ayunas (riesgo metabólico alto)",
        category: "metabolic",
        intervalMonths: 12,
        reason: `IMC ${bmi} + cintura ${waist} cm — riesgo metabólico elevado, tamizaje anual`,
        source: "ADA 2025 / Criterios armonizados Sx metabólico",
        priority: "alta",
      };
    }
    return null;
  },

  // 22. HEPATITIS B y C (basado en factores de riesgo)
  (p) => {
    if (p.age >= 18 && p.age <= 79) {
      return {
        name: "Tamizaje de Hepatitis C (anti-HCV)",
        category: "general",
        intervalMonths: 0, // una sola vez
        reason: "Adulto 18-79 años — tamizaje único de Hepatitis C",
        source: "USPSTF 2020",
        priority: "baja",
      };
    }
    return null;
  },

  // 23. ESPIROMETRÍA si fumador con síntomas respiratorios
  (p) => {
    if (isCurrentSmoker(p) && p.age >= 40) {
      return {
        name: "Espirometría",
        category: "general",
        intervalMonths: 24,
        reason: "Fumador ≥40 años — detección de EPOC",
        source: "GOLD 2026",
        priority: "media",
      };
    }
    return null;
  },
];

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION: Evaluate all rules for a patient
// ═══════════════════════════════════════════════════════════════

function generateScreeningsForPatient(patient) {
  const results = [];
  const seen = new Set(); // avoid duplicates by name

  for (const rule of SCREENING_RULES) {
    try {
      const screening = rule(patient);
      if (screening && !seen.has(screening.name)) {
        seen.add(screening.name);
        results.push({
          ...screening,
          patient: patient._id,
        });
      }
    } catch (err) {
      console.error("[ScreeningRules] Error evaluating rule:", err.message);
    }
  }

  return results;
}

module.exports = { generateScreeningsForPatient, SCREENING_RULES };
