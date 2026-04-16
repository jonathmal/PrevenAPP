/**
 * ═══════════════════════════════════════════════════════════════
 * PrevenApp v2.2 — Motor de Reglas de Tamizaje (REVISADO)
 * ═══════════════════════════════════════════════════════════════
 *
 * Fuentes verificadas:
 *  - MINSA Panamá: Plan Nacional Cáncer 2019-2029, Normas CaCu
 *  - USPSTF 2021-2025 (A & B Recommendations)
 *  - ADA Standards of Care 2025
 *  - ACC/AHA Hypertension 2017 / Cholesterol 2018
 *  - ACS Cancer Screening 2024
 *  - GOLD 2026 (EPOC)
 *  - KDIGO 2024 (ERC)
 *  - NOF/ISCD (Osteoporosis)
 *
 * Cada regla retorna:
 *  normalInterval     — meses entre tamizajes si resultado normal
 *  borderlineInterval — meses si resultado borderline/limítrofe
 *  pathologicalInterval — meses si resultado patológico
 *  intervalMonths     — default (= normalInterval)
 */

function hasDx(p, kw) {
  return (p.diagnoses || []).some(d => d.isActive && kw.some(k => d.name.toLowerCase().includes(k.toLowerCase()) || (d.code && d.code.toLowerCase().startsWith(k.toLowerCase()))));
}
function hasFHx(p, kw) {
  return (p.familyHistory || []).some(f => kw.some(k => f.condition.toLowerCase().includes(k.toLowerCase())));
}
function isSmoker(p) { return p.riskFactors?.smoking === "current"; }
function isSmokerOrFormer(p) { return p.riskFactors?.smoking === "current" || p.riskFactors?.smoking === "former"; }
function packYears(p) { return ((p.riskFactors?.cigarettesPerDay || 0) / 20) * (p.riskFactors?.yearsSmoked || 0); }
function getBMI(p) { return p.bmi ? parseFloat(p.bmi) : (p.height && p.weight ? parseFloat((p.weight / Math.pow(p.height / 100, 2)).toFixed(1)) : null); }

const RULES = [

  // ════════════════════════════════════════════════════════════
  // ONCOLÓGICOS
  // ════════════════════════════════════════════════════════════

  // 1. MAMOGRAFÍA
  (p) => {
    if (p.sex !== "F") return null;
    const fhx = hasFHx(p, ["mama", "breast", "brca"]);
    if (fhx && p.age >= 30) {
      return { name: "Mamografía", category: "oncologic",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Mujer con AHF de Ca de mama — mamografía anual desde los 30",
        source: "ACS 2024 / NCCN", priority: "alta" };
    }
    if (p.age >= 40 && p.age <= 74) {
      // ACS: annual 40-54, biennial 55-74; USPSTF 2024: biennial 40-74
      const interval = p.age < 55 ? 12 : 24;
      return { name: "Mamografía", category: "oncologic",
        normalInterval: interval, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: interval,
        reason: p.age < 55 ? "Mujer 40-54 años — mamografía anual" : "Mujer 55-74 años — mamografía bienal",
        source: "ACS 2024 / USPSTF 2024 / MINSA", priority: p.age < 55 ? "alta" : "media" };
    }
    return null;
  },

  // 2. CERVICOUTERINO (Pap / VPH)
  (p) => {
    if (p.sex !== "F") return null;
    if (p.age >= 21 && p.age <= 29) {
      return { name: "Citología cervical (Papanicolaou)", category: "oncologic",
        normalInterval: 36, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 36,
        reason: "Mujer 21-29 años — Pap cada 3 años",
        source: "USPSTF 2024 / MINSA Normas CaCu", priority: "alta" };
    }
    if (p.age >= 30 && p.age <= 65) {
      return { name: "Prueba VPH / Citología cervical", category: "oncologic",
        normalInterval: 60, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 60,
        reason: "Mujer 30-65 años — VPH cada 5 años (alternativa: Pap c/3 años o co-test c/5 años)",
        source: "USPSTF 2024 / OPS / MINSA", priority: "alta" };
    }
    return null;
  },

  // 3. PRÓSTATA (PSA + Tacto rectal)
  (p) => {
    if (p.sex !== "M") return null;
    const fhx = hasFHx(p, ["próstata", "prostat"]);
    if (fhx && p.age >= 40) {
      return { name: "PSA + Tacto rectal", category: "oncologic",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Hombre con AHF Ca de próstata — tamizaje anual desde los 40",
        source: "ACS 2024 / MINSA", priority: "alta" };
    }
    if (p.age >= 50 && p.age <= 75) {
      return { name: "PSA + Tacto rectal", category: "oncologic",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Hombre 50-75 años — tamizaje anual (decisión compartida)",
        source: "MINSA / ACS 2024", priority: "media" };
    }
    return null;
  },

  // 4. COLORRECTAL — SOH vs Colonoscopía
  (p) => {
    const fhx = hasFHx(p, ["colon", "colorrectal", "intestin"]);
    if (fhx && p.age >= 40) {
      return { name: "Colonoscopía", category: "oncologic",
        normalInterval: 60, borderlineInterval: 36, pathologicalInterval: 12,
        intervalMonths: 60,
        reason: "AHF Ca colorrectal — colonoscopía cada 5 años (o SOH anual)",
        source: "ACS 2024 / USPSTF / NCCN", priority: "alta" };
    }
    if (p.age >= 45 && p.age <= 75) {
      return { name: "Sangre oculta en heces (SOH)", category: "oncologic",
        normalInterval: 12, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 12,
        reason: "Adulto 45-75 años — SOH anual (alternativa: colonoscopía c/10 años)",
        source: "USPSTF 2021 / MINSA", priority: "media" };
    }
    return null;
  },

  // 5. PULMÓN — TAC baja dosis
  (p) => {
    const py = packYears(p);
    if (p.age >= 50 && p.age <= 80 && py >= 20 && isSmokerOrFormer(p)) {
      return { name: "TAC de tórax de baja dosis", category: "oncologic",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: `${py.toFixed(0)} paquetes-año — tamizaje anual de Ca de pulmón`,
        source: "USPSTF 2021", priority: "alta" };
    }
    return null;
  },

  // ════════════════════════════════════════════════════════════
  // CARDIOVASCULAR
  // ════════════════════════════════════════════════════════════

  // 6. PERFIL LIPÍDICO
  (p) => {
    const hasECNT = hasDx(p, ["hipertens", "I10", "diabetes", "E11", "metabólic"]);
    const bmi = getBMI(p);
    if (hasECNT) {
      return { name: "Perfil lipídico completo", category: "cardiovascular",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Paciente con ECNT — perfil lipídico anual",
        source: "ACC/AHA 2018 / ADA 2025", priority: "alta" };
    }
    if ((p.sex === "M" && p.age >= 35) || (p.sex === "F" && p.age >= 45)) {
      return { name: "Perfil lipídico completo", category: "cardiovascular",
        normalInterval: 60, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 60,
        reason: "Tamizaje de rutina — perfil lipídico cada 5 años",
        source: "USPSTF / ACC/AHA 2018", priority: "baja" };
    }
    if (p.age >= 20 && bmi && bmi >= 25) {
      return { name: "Perfil lipídico completo", category: "cardiovascular",
        normalInterval: 60, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 60,
        reason: "Adulto joven con sobrepeso — tamizaje cada 5 años",
        source: "USPSTF / ACC/AHA", priority: "baja" };
    }
    return null;
  },

  // 7. EKG
  (p) => {
    if (hasDx(p, ["hipertens", "I10"])) {
      return { name: "Electrocardiograma (EKG)", category: "cardiovascular",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Paciente hipertenso — EKG anual (HVI, arritmias)",
        source: "ACC/AHA 2017", priority: "media" };
    }
    if (hasDx(p, ["diabetes", "E11"]) && p.age >= 40) {
      return { name: "Electrocardiograma (EKG)", category: "cardiovascular",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Diabético ≥40 años — evaluación CV anual",
        source: "ADA 2025", priority: "media" };
    }
    return null;
  },

  // 8. CREATININA / BUN / TFG
  (p) => {
    if (hasDx(p, ["hipertens", "I10", "diabetes", "E11"])) {
      return { name: "Creatinina + BUN + TFG estimada", category: "cardiovascular",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "HTA y/o DM2 — función renal anual",
        source: "ADA 2025 / KDIGO 2024 / ACC/AHA 2017", priority: "alta" };
    }
    return null;
  },

  // 9. AAA — Aneurisma aórtico abdominal
  (p) => {
    if (p.sex === "M" && p.age >= 65 && p.age <= 75 && isSmokerOrFormer(p)) {
      return { name: "Ultrasonido abdominal (tamizaje AAA)", category: "cardiovascular",
        normalInterval: 0, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 0,
        reason: "Hombre 65-75 años + tabaquismo — tamizaje único de AAA",
        source: "USPSTF 2019", priority: "media" };
    }
    return null;
  },

  // ════════════════════════════════════════════════════════════
  // METABÓLICO
  // ════════════════════════════════════════════════════════════

  // 10. HbA1c (diabéticos)
  (p) => {
    if (hasDx(p, ["diabetes", "E11", "E10"])) {
      return { name: "Hemoglobina glicosilada (HbA1c)", category: "metabolic",
        normalInterval: 6, borderlineInterval: 3, pathologicalInterval: 3,
        intervalMonths: 6,
        reason: "Paciente diabético — HbA1c cada 6 meses (c/3 si fuera de meta)",
        source: "ADA 2025", priority: "alta" };
    }
    return null;
  },

  // 11. GLUCOSA EN AYUNAS — tamizaje DM2
  (p) => {
    if (hasDx(p, ["diabetes", "E11", "E10"])) return null;
    const bmi = getBMI(p);
    const fhx = hasFHx(p, ["diabetes", "DM2", "DM1"]);
    if (p.age >= 35 && bmi && bmi >= 25) {
      return { name: "Glucosa en ayunas (tamizaje DM2)", category: "metabolic",
        normalInterval: 36, borderlineInterval: 12, pathologicalInterval: 3,
        intervalMonths: 36,
        reason: "Adulto ≥35 años con sobrepeso — tamizaje cada 3 años",
        source: "USPSTF 2021 / ADA 2025", priority: "media" };
    }
    if (p.age >= 30 && fhx) {
      return { name: "Glucosa en ayunas (tamizaje DM2)", category: "metabolic",
        normalInterval: 36, borderlineInterval: 12, pathologicalInterval: 3,
        intervalMonths: 36,
        reason: "AHF de DM2 — tamizaje cada 3 años",
        source: "ADA 2025", priority: "media" };
    }
    return null;
  },

  // 12. MICROALBUMINURIA
  (p) => {
    if (hasDx(p, ["diabetes", "E11"])) {
      return { name: "Microalbuminuria (albúmina/creatinina)", category: "metabolic",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Paciente diabético — tamizaje anual de nefropatía",
        source: "ADA 2025 / KDIGO 2024", priority: "alta" };
    }
    return null;
  },

  // 13. TSH
  (p) => {
    if (p.sex === "F" && p.age >= 50) {
      return { name: "TSH (función tiroidea)", category: "metabolic",
        normalInterval: 60, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 60,
        reason: "Mujer ≥50 años — tamizaje de disfunción tiroidea c/5 años",
        source: "ATA / AACE", priority: "baja" };
    }
    return null;
  },

  // 14. ÁCIDO ÚRICO
  (p) => {
    if (hasDx(p, ["metabólic", "E88", "gota"])) {
      return { name: "Ácido úrico sérico", category: "metabolic",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Sx metabólico / gota — control anual",
        source: "Práctica clínica", priority: "baja" };
    }
    return null;
  },

  // 15. PREDIABETES ALTO RIESGO
  (p) => {
    if (hasDx(p, ["diabetes", "E11", "E10"])) return null;
    const bmi = getBMI(p);
    const waist = p.waistCircumference;
    const elevW = (p.sex === "M" && waist >= 102) || (p.sex === "F" && waist >= 88);
    if (bmi && bmi >= 30 && elevW) {
      return { name: "HbA1c + Glucosa (riesgo metabólico)", category: "metabolic",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: `IMC ${bmi} + cintura ${waist} cm — riesgo metabólico alto`,
        source: "ADA 2025 / IDF", priority: "alta" };
    }
    return null;
  },

  // ════════════════════════════════════════════════════════════
  // GENERAL
  // ════════════════════════════════════════════════════════════

  // 16. EXAMEN FÍSICO PREVENTIVO
  (p) => ({
    name: "Examen físico preventivo completo", category: "general",
    normalInterval: 12, borderlineInterval: 12, pathologicalInterval: 6,
    intervalMonths: 12,
    reason: "Evaluación integral anual",
    source: "MINSA / Práctica clínica", priority: "media",
  }),

  // 17. DENSITOMETRÍA ÓSEA
  (p) => {
    if (p.sex === "F" && p.age >= 65) {
      return { name: "Densitometría ósea (DEXA)", category: "general",
        normalInterval: 60, borderlineInterval: 24, pathologicalInterval: 12,
        intervalMonths: 60,
        reason: "Mujer ≥65 años — tamizaje de osteoporosis c/5 años si normal",
        source: "USPSTF 2025 / NOF", priority: "media" };
    }
    if (p.sex === "F" && p.age >= 50 && (isSmoker(p) || (getBMI(p) && getBMI(p) < 20))) {
      return { name: "Densitometría ósea (DEXA)", category: "general",
        normalInterval: 60, borderlineInterval: 24, pathologicalInterval: 12,
        intervalMonths: 60,
        reason: "Mujer postmenopáusica con FR — tamizaje c/5 años si normal",
        source: "USPSTF 2025 / NOF", priority: "baja" };
    }
    return null;
  },

  // 18. EXAMEN OFTALMOLÓGICO
  (p) => {
    if (hasDx(p, ["diabetes", "E11", "E10"])) {
      return { name: "Examen oftalmológico (fondo de ojo)", category: "general",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Diabético — fondo de ojo anual (retinopatía)",
        source: "ADA 2025 / AAO", priority: "alta" };
    }
    if (p.age >= 65) {
      return { name: "Examen oftalmológico", category: "general",
        normalInterval: 24, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 24,
        reason: "Adulto ≥65 años — evaluación visual bienal",
        source: "AAO / AAFP", priority: "baja" };
    }
    return null;
  },

  // 19. HEMOGRAMA
  (p) => {
    if (hasDx(p, ["hipertens", "diabetes", "metabólic", "renal"])) {
      return { name: "Hemograma completo", category: "general",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "ECNT — hemograma anual de control",
        source: "Práctica clínica", priority: "baja" };
    }
    return null;
  },

  // 21. CESACIÓN TABÁQUICA
  (p) => {
    if (isSmoker(p)) {
      return { name: "Consejería de cesación tabáquica", category: "general",
        normalInterval: 6, borderlineInterval: 3, pathologicalInterval: 3,
        intervalMonths: 6,
        reason: "Fumador activo — intervención conductual cada 6 meses",
        source: "USPSTF 2021", priority: "alta" };
    }
    return null;
  },

  // 23. ESPIROMETRÍA
  (p) => {
    if (isSmoker(p) && p.age >= 40) {
      return { name: "Espirometría", category: "general",
        normalInterval: 24, borderlineInterval: 12, pathologicalInterval: 6,
        intervalMonths: 24,
        reason: "Fumador ≥40 años — detección de EPOC c/2 años",
        source: "GOLD 2026", priority: "media" };
    }
    if (hasDx(p, ["EPOC", "J44", "asma", "J45"])) {
      return { name: "Espirometría", category: "general",
        normalInterval: 12, borderlineInterval: 6, pathologicalInterval: 3,
        intervalMonths: 12,
        reason: "Dx de EPOC/asma — espirometría anual de seguimiento",
        source: "GOLD 2026 / GINA", priority: "media" };
    }
    return null;
  },
];

function generateScreeningsForPatient(patient) {
  const results = [];
  const seen = new Set();
  for (const rule of RULES) {
    try {
      const s = rule(patient);
      if (s && !seen.has(s.name)) {
        seen.add(s.name);
        results.push({ ...s, patient: patient._id });
      }
    } catch (err) { console.error("[ScreeningRules] Error:", err.message); }
  }
  return results;
}

module.exports = { generateScreeningsForPatient, SCREENING_RULES: RULES };
