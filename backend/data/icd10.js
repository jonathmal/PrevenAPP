/**
 * ICD-10 Codes — Primary Care / ECNT / Preventiva
 * Subset relevante para PrevenApp v2.0 y atención primaria en Panamá
 * ~180 códigos más comunes
 */

const ICD10_CODES = [
  // ─── Cardiovascular ──────────────────────────────────────
  { code: "I10", name: "Hipertensión arterial esencial (primaria)" },
  { code: "I11.9", name: "Cardiopatía hipertensiva sin insuficiencia cardíaca" },
  { code: "I13.10", name: "Cardiopatía y nefropatía hipertensivas" },
  { code: "I20.9", name: "Angina de pecho, no especificada" },
  { code: "I21.9", name: "Infarto agudo de miocardio, no especificado" },
  { code: "I25.10", name: "Cardiopatía isquémica crónica" },
  { code: "I48.91", name: "Fibrilación auricular no especificada" },
  { code: "I48.92", name: "Aleteo auricular no especificado" },
  { code: "I50.9", name: "Insuficiencia cardíaca, no especificada" },
  { code: "I63.9", name: "Accidente cerebrovascular isquémico" },
  { code: "I64", name: "ACV no especificado como hemorrágico o isquémico" },
  { code: "I67.9", name: "Enfermedad cerebrovascular, no especificada" },
  { code: "I70.0", name: "Aterosclerosis de la aorta" },
  { code: "I73.9", name: "Enfermedad vascular periférica" },
  { code: "I87.2", name: "Insuficiencia venosa crónica" },

  // ─── Metabolismo / Endocrino ─────────────────────────────
  { code: "E11.9", name: "Diabetes mellitus tipo 2 sin complicaciones" },
  { code: "E11.65", name: "DM2 con hiperglucemia" },
  { code: "E11.21", name: "DM2 con nefropatía diabética" },
  { code: "E11.311", name: "DM2 con retinopatía diabética no proliferativa" },
  { code: "E11.40", name: "DM2 con neuropatía diabética" },
  { code: "E11.51", name: "DM2 con úlcera del pie diabético" },
  { code: "E10.9", name: "Diabetes mellitus tipo 1 sin complicaciones" },
  { code: "E13.9", name: "Otra diabetes mellitus especificada" },
  { code: "E03.9", name: "Hipotiroidismo, no especificado" },
  { code: "E05.90", name: "Hipertiroidismo, no especificado" },
  { code: "E04.9", name: "Bocio no tóxico, no especificado" },
  { code: "E06.3", name: "Tiroiditis autoinmune (Hashimoto)" },
  { code: "E66.01", name: "Obesidad mórbida por exceso de calorías" },
  { code: "E66.9", name: "Obesidad, no especificada" },
  { code: "E78.5", name: "Dislipidemia, no especificada" },
  { code: "E78.0", name: "Hipercolesterolemia pura" },
  { code: "E78.1", name: "Hipertrigliceridemia pura" },
  { code: "E78.2", name: "Hiperlipidemia mixta" },
  { code: "E79.0", name: "Hiperuricemia" },
  { code: "E87.6", name: "Hipopotasemia" },
  { code: "E88.81", name: "Síndrome metabólico" },
  { code: "R73.03", name: "Prediabetes (glucosa en ayunas alterada)" },

  // ─── Respiratorio ────────────────────────────────────────
  { code: "J44.1", name: "EPOC con exacerbación aguda" },
  { code: "J44.9", name: "EPOC, no especificada" },
  { code: "J45.20", name: "Asma persistente moderada, no complicada" },
  { code: "J45.909", name: "Asma, no especificada" },
  { code: "J18.9", name: "Neumonía, no especificada" },
  { code: "J06.9", name: "Infección aguda de vías respiratorias superiores" },
  { code: "J20.9", name: "Bronquitis aguda, no especificada" },

  // ─── Renal ───────────────────────────────────────────────
  { code: "N18.1", name: "Enfermedad renal crónica, estadio 1" },
  { code: "N18.2", name: "Enfermedad renal crónica, estadio 2" },
  { code: "N18.3", name: "Enfermedad renal crónica, estadio 3" },
  { code: "N18.4", name: "Enfermedad renal crónica, estadio 4" },
  { code: "N18.5", name: "Enfermedad renal crónica, estadio 5" },
  { code: "N18.9", name: "Enfermedad renal crónica, no especificada" },
  { code: "N39.0", name: "Infección de vías urinarias, sitio no especificado" },
  { code: "N20.0", name: "Cálculo del riñón" },
  { code: "N40.0", name: "Hiperplasia prostática benigna sin obstrucción" },

  // ─── Gastrointestinal ────────────────────────────────────
  { code: "K21.0", name: "Enfermedad por reflujo gastroesofágico con esofagitis" },
  { code: "K29.70", name: "Gastritis, no especificada" },
  { code: "K25.9", name: "Úlcera gástrica, no especificada" },
  { code: "K76.0", name: "Hígado graso (esteatosis hepática)" },
  { code: "K80.20", name: "Colelitiasis sin obstrucción" },
  { code: "K57.90", name: "Enfermedad diverticular del intestino" },
  { code: "K58.9", name: "Síndrome de intestino irritable" },

  // ─── Musculoesquelético ──────────────────────────────────
  { code: "M54.5", name: "Lumbalgia" },
  { code: "M54.2", name: "Cervicalgia" },
  { code: "M17.9", name: "Osteoartrosis de rodilla" },
  { code: "M19.90", name: "Osteoartrosis, no especificada" },
  { code: "M81.0", name: "Osteoporosis postmenopáusica" },
  { code: "M10.9", name: "Gota, no especificada" },
  { code: "M79.3", name: "Paniculitis, no especificada" },
  { code: "G56.00", name: "Síndrome del túnel carpiano" },

  // ─── Neurológico ─────────────────────────────────────────
  { code: "G43.909", name: "Migraña, no especificada" },
  { code: "G40.909", name: "Epilepsia, no especificada" },
  { code: "G47.00", name: "Insomnio, no especificado" },
  { code: "G47.33", name: "Apnea obstructiva del sueño" },
  { code: "G62.9", name: "Polineuropatía, no especificada" },
  { code: "G20", name: "Enfermedad de Parkinson" },

  // ─── Salud mental ────────────────────────────────────────
  { code: "F32.9", name: "Episodio depresivo, no especificado" },
  { code: "F33.0", name: "Trastorno depresivo recurrente, episodio leve" },
  { code: "F41.1", name: "Trastorno de ansiedad generalizada" },
  { code: "F41.9", name: "Trastorno de ansiedad, no especificado" },
  { code: "F10.20", name: "Trastorno por uso de alcohol, dependencia" },
  { code: "F17.210", name: "Dependencia de nicotina, cigarrillos" },
  { code: "F51.01", name: "Insomnio primario" },

  // ─── Oncológico ──────────────────────────────────────────
  { code: "C50.919", name: "Neoplasia maligna de mama, no especificada" },
  { code: "C61", name: "Neoplasia maligna de próstata" },
  { code: "C53.9", name: "Neoplasia maligna de cuello uterino" },
  { code: "C18.9", name: "Neoplasia maligna de colon" },
  { code: "C34.90", name: "Neoplasia maligna de pulmón" },
  { code: "C44.90", name: "Neoplasia maligna de piel, no especificada" },
  { code: "C73", name: "Neoplasia maligna de tiroides" },
  { code: "D25.9", name: "Leiomioma uterino (fibroma), no especificado" },

  // ─── Dermatología ────────────────────────────────────────
  { code: "L30.9", name: "Dermatitis, no especificada" },
  { code: "L40.9", name: "Psoriasis, no especificada" },
  { code: "B35.1", name: "Tiña ungueal (onicomicosis)" },
  { code: "L70.0", name: "Acné vulgar" },

  // ─── Hematológico ────────────────────────────────────────
  { code: "D50.9", name: "Anemia por deficiencia de hierro" },
  { code: "D64.9", name: "Anemia, no especificada" },
  { code: "D69.6", name: "Trombocitopenia, no especificada" },

  // ─── Infeccioso ──────────────────────────────────────────
  { code: "B18.2", name: "Hepatitis C crónica" },
  { code: "B18.1", name: "Hepatitis B crónica" },
  { code: "B20", name: "Enfermedad por VIH" },
  { code: "A09", name: "Gastroenteritis infecciosa" },

  // ─── Oftalmológico ───────────────────────────────────────
  { code: "H40.10", name: "Glaucoma primario de ángulo abierto" },
  { code: "H26.9", name: "Catarata, no especificada" },
  { code: "H36", name: "Retinopatía diabética" },

  // ─── Ginecológico ────────────────────────────────────────
  { code: "N95.1", name: "Menopausia y climaterio femenino" },
  { code: "N92.0", name: "Menstruación excesiva y frecuente" },
  { code: "N80.0", name: "Endometriosis del útero" },

  // ─── Otros ───────────────────────────────────────────────
  { code: "Z87.891", name: "Antecedente personal de tabaquismo" },
  { code: "Z72.0", name: "Uso de tabaco actual" },
  { code: "Z86.73", name: "Antecedente personal de ACV" },
  { code: "Z85.3", name: "Antecedente personal de neoplasia maligna de mama" },
  { code: "Z85.46", name: "Antecedente personal de neoplasia maligna de próstata" },
  { code: "Z96.1", name: "Presencia de lente intraocular" },
  { code: "Z95.1", name: "Presencia de bypass coronario" },
  { code: "Z79.4", name: "Uso prolongado de insulina" },
  { code: "Z79.84", name: "Uso prolongado de anticoagulantes orales" },
  { code: "Z79.899", name: "Uso prolongado de otros medicamentos" },

  // ─── Antecedentes familiares (códigos Z) ─────────────────
  { code: "Z80.0", name: "AHF de neoplasia maligna de órganos digestivos" },
  { code: "Z80.1", name: "AHF de neoplasia maligna de tráquea, bronquio y pulmón" },
  { code: "Z80.3", name: "AHF de neoplasia maligna de mama" },
  { code: "Z80.42", name: "AHF de neoplasia maligna de próstata" },
  { code: "Z82.41", name: "AHF de enfermedad isquémica cardíaca" },
  { code: "Z82.49", name: "AHF de enfermedad cardiovascular" },
  { code: "Z83.3", name: "AHF de diabetes mellitus" },
  { code: "Z82.3", name: "AHF de accidente cerebrovascular" },
  { code: "Z83.42", name: "AHF de enfermedades renales" },
];

module.exports = ICD10_CODES;
