import { useState } from "react";
import api from "../services/api";

const T = { text: "#1E293B", sub: "#64748B", muted: "#94A3B8", border: "#E2E8F0" };
const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid " + T.border, fontSize: 16, fontWeight: 500, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 4 };

const STEPS = [
  { key: "welcome", title: "Bienvenido/a", icon: "👋" },
  { key: "body", title: "Datos básicos", icon: "📏" },
  { key: "blood", title: "Tipo de sangre", icon: "🩸" },
  { key: "diagnoses", title: "Diagnósticos", icon: "🏥" },
  { key: "family", title: "Antecedentes familiares", icon: "👨‍👩‍👧‍👦" },
  { key: "habits", title: "Hábitos", icon: "🏃" },
  { key: "emergency", title: "Contacto de emergencia", icon: "📞" },
  { key: "done", title: "¡Listo!", icon: "✅" },
];

const COMMON_DX = [
  { name: "Hipertensión arterial", code: "I10" },
  { name: "Diabetes mellitus tipo 2", code: "E11.9" },
  { name: "Dislipidemia", code: "E78.5" },
  { name: "Obesidad", code: "E66.9" },
  { name: "Asma", code: "J45.9" },
  { name: "EPOC", code: "J44.9" },
  { name: "Hipotiroidismo", code: "E03.9" },
];

const COMMON_FH = [
  "Diabetes", "Hipertensión", "Cáncer de mama", "Cáncer de próstata",
  "Cáncer de colon", "Infarto", "ACV", "Tuberculosis",
];

export default function OnboardingPage({ patient, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    height: patient?.height || "", weight: patient?.weight || "",
    waistCircumference: patient?.waistCircumference || "",
    bloodType: patient?.bloodType || "",
    diagnoses: patient?.diagnoses?.filter(d => d.isActive) || [],
    familyHistory: patient?.familyHistory || [],
    riskFactors: {
      smoking: patient?.riskFactors?.smoking || "never",
      alcohol: patient?.riskFactors?.alcohol || "never",
      exercise: patient?.riskFactors?.exercise || "sedentary",
      diet: patient?.riskFactors?.diet || "regular",
    },
    emergencyContact: patient?.emergencyContact || { name: "", phone: "", relationship: "" },
  });
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [newDx, setNewDx] = useState(""); const [newDxCode, setNewDxCode] = useState("");
  const [newFh, setNewFh] = useState(""); const [newFhRel, setNewFhRel] = useState("");

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const setRF = (k, v) => setData(p => ({ ...p, riskFactors: { ...p.riskFactors, [k]: v } }));
  const setEC = (k, v) => setData(p => ({ ...p, emergencyContact: { ...p.emergencyContact, [k]: v } }));

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const saveAndFinish = async (skip = false) => {
    setSaving(true);
    try {
      if (!skip) {
        const update = {
          height: data.height ? parseFloat(data.height) : undefined,
          weight: data.weight ? parseFloat(data.weight) : undefined,
          waistCircumference: data.waistCircumference ? parseFloat(data.waistCircumference) : undefined,
          bloodType: data.bloodType || undefined,
          diagnoses: data.diagnoses,
          familyHistory: data.familyHistory,
          riskFactors: data.riskFactors,
          emergencyContact: data.emergencyContact,
        };
        // Remove undefined keys
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
        await api.updatePatientProfile(update);
      }
      await api.completeOnboarding();
      onComplete();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const cur = STEPS[step];
  const progress = ((step) / (STEPS.length - 1)) * 100;
  const bmi = data.height && data.weight ? (parseFloat(data.weight) / Math.pow(parseFloat(data.height) / 100, 2)).toFixed(1) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFB", fontFamily: "'DM Sans', -apple-system, sans-serif",
      maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header with progress */}
      <div style={{
        background: "linear-gradient(160deg, #064E52 0%, #0A8A8F 50%, #0FB5A2 100%)",
        padding: "16px 20px", color: "#fff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>Configuración inicial</div>
          <button onClick={() => { if (confirm("¿Saltar onboarding? Puede completarlo después desde su Perfil.")) { setSkipping(true); saveAndFinish(true); } }}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            Saltar
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>{cur.icon}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{cur.title}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Paso {step + 1} de {STEPS.length}</div>
          </div>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: progress + "%", background: "#fff", borderRadius: 2, transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        {cur.key === "welcome" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>👋</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 12 }}>¡Bienvenido/a a PrevenApp!</h2>
            <div style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, marginBottom: 20 }}>
              Antes de comenzar, vamos a recoger algunos datos básicos sobre su salud.
            </div>
            <div style={{ padding: "16px", borderRadius: 14, background: "#F0FDFA", textAlign: "left", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0A8A8F", marginBottom: 8 }}>Esto nos ayudará a:</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.8 }}>
                ✓ Generar sus tamizajes preventivos personalizados<br />
                ✓ Calcular su riesgo cardiovascular<br />
                ✓ Recomendarle vacunas según su edad y condición<br />
                ✓ Permitir que su médico tenga su historia al día
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              Tomará unos 5 minutos. Toda la información puede ser editada después.
            </div>
          </div>
        )}

        {cur.key === "body" && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
              Estos datos son esenciales para calcular su IMC y evaluar su riesgo cardiometabólico.
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Talla (cm) *</label>
              <input type="number" value={data.height} onChange={e => set("height", e.target.value)} placeholder="158" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Peso (kg) *</label>
              <input type="number" step="0.1" value={data.weight} onChange={e => set("weight", e.target.value)} placeholder="78" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Circunferencia de cintura (cm)</label>
              <input type="number" value={data.waistCircumference} onChange={e => set("waistCircumference", e.target.value)} placeholder="94" style={inputStyle} />
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Mida a la altura del ombligo, sin apretar</div>
            </div>
            {bmi && (
              <div style={{ padding: "12px 14px", borderRadius: 12, background: bmi < 25 ? "#F0FDF4" : bmi < 30 ? "#FFFBEB" : "#FEF2F2", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 2 }}>Su IMC es</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: bmi < 25 ? "#16A34A" : bmi < 30 ? "#D97706" : "#DC2626" }}>
                  {bmi} — {bmi < 18.5 ? "Bajo peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidad"}
                </div>
              </div>
            )}
          </div>
        )}

        {cur.key === "blood" && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
              Importante para emergencias médicas. Si no lo recuerda, puede dejarlo en blanco y agregarlo después.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(bt => (
                <button key={bt} onClick={() => set("bloodType", bt)} style={{
                  padding: 16, borderRadius: 12, border: "none",
                  background: data.bloodType === bt ? "#DC2626" : "#F1F5F9",
                  color: data.bloodType === bt ? "#fff" : T.sub,
                  fontSize: 18, fontWeight: 800, cursor: "pointer",
                }}>🩸 {bt}</button>
              ))}
            </div>
            <button onClick={() => set("bloodType", "")} style={{ width: "100%", padding: 12, marginTop: 12, borderRadius: 10, border: "1px solid " + T.border, background: "#fff", color: T.sub, fontSize: 13, cursor: "pointer" }}>
              No lo recuerdo
            </button>
          </div>
        )}

        {cur.key === "diagnoses" && (
          <div>
            <div style={{ marginBottom: 12, fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
              ¿Tiene alguna enfermedad diagnosticada por un médico?
            </div>
            {data.diagnoses.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {data.diagnoses.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 6, borderRadius: 10, background: "#FEF2F2" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
                      {d.code && <div style={{ fontSize: 12, color: T.muted }}>{d.code}</div>}
                    </div>
                    <button onClick={() => set("diagnoses", data.diagnoses.filter((_, j) => j !== i))} style={{ background: "none", border: "none", fontSize: 18, color: "#DC2626", cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Sugerencias rápidas:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {COMMON_DX.filter(c => !data.diagnoses.some(d => d.code === c.code)).map((c, i) => (
                <button key={i} onClick={() => set("diagnoses", [...data.diagnoses, { ...c, isActive: true, selfReported: true }])}
                  style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid " + T.border, background: "#fff", fontSize: 13, fontWeight: 600, color: T.text, cursor: "pointer" }}>
                  + {c.name}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={newDx} onChange={e => setNewDx(e.target.value)} placeholder="Otro (escribir nombre)" style={{ ...inputStyle, flex: 2 }} />
              <input value={newDxCode} onChange={e => setNewDxCode(e.target.value)} placeholder="CIE-10" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => { if (newDx) { set("diagnoses", [...data.diagnoses, { name: newDx, code: newDxCode, isActive: true, selfReported: true }]); setNewDx(""); setNewDxCode(""); } }}
                disabled={!newDx} style={{ padding: "0 16px", borderRadius: 12, border: "none", background: newDx ? "#0A8A8F" : T.border, color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>+</button>
            </div>
            {data.diagnoses.length === 0 && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#F0FDF4", fontSize: 13, color: "#16A34A", fontWeight: 600, textAlign: "center" }}>
                ✓ No tengo diagnósticos — Continuar
              </div>
            )}
          </div>
        )}

        {cur.key === "family" && (
          <div>
            <div style={{ marginBottom: 12, fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
              ¿Sus padres, hermanos o abuelos tienen alguna de estas enfermedades?
            </div>
            {data.familyHistory.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {data.familyHistory.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 6, borderRadius: 10, background: "#F5F3FF" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{f.condition}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{f.relative}</div>
                    </div>
                    <button onClick={() => set("familyHistory", data.familyHistory.filter((_, j) => j !== i))} style={{ background: "none", border: "none", fontSize: 18, color: "#6366F1", cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <select value={newFh} onChange={e => setNewFh(e.target.value)} style={{ ...inputStyle, flex: 2, appearance: "auto" }}>
                <option value="">Condición...</option>
                {COMMON_FH.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={newFhRel} onChange={e => setNewFhRel(e.target.value)} style={{ ...inputStyle, flex: 1, appearance: "auto" }}>
                <option value="">Parentesco...</option>
                {["Madre", "Padre", "Hermano/a", "Abuelo/a materno/a", "Abuelo/a paterno/a", "Tío/a"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={() => { if (newFh && newFhRel) { set("familyHistory", [...data.familyHistory, { condition: newFh, relative: newFhRel, selfReported: true }]); setNewFh(""); setNewFhRel(""); } }}
              disabled={!newFh || !newFhRel} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: newFh && newFhRel ? "#6366F1" : T.border, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              + Agregar antecedente familiar
            </button>
          </div>
        )}

        {cur.key === "habits" && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
              Estos hábitos influyen en su riesgo cardiovascular. Sea honesto/a — su médico no juzga.
            </div>
            {[
              { f: "smoking", l: "🚬 ¿Fuma cigarrillos?", opts: [["never", "Nunca"], ["former", "Antes sí, ya no"], ["current", "Actualmente"]] },
              { f: "alcohol", l: "🍺 ¿Toma alcohol?", opts: [["never", "Nunca"], ["occasional", "Ocasional"], ["moderate", "Moderado"], ["heavy", "Frecuente"]] },
              { f: "exercise", l: "🏃 ¿Hace ejercicio?", opts: [["sedentary", "No"], ["light", "Leve"], ["moderate", "Moderado"], ["active", "Activo"]] },
              { f: "diet", l: "🥗 Su alimentación es", opts: [["poor", "Mala"], ["regular", "Regular"], ["good", "Buena"], ["excellent", "Excelente"]] },
            ].map((h, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{h.l}</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(" + h.opts.length + ", 1fr)", gap: 4 }}>
                  {h.opts.map(([v, l]) => (
                    <button key={v} onClick={() => setRF(h.f, v)} style={{
                      padding: "10px 4px", borderRadius: 10, border: "none",
                      background: data.riskFactors[h.f] === v ? "#0A8A8F" : "#F1F5F9",
                      color: data.riskFactors[h.f] === v ? "#fff" : T.sub,
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>{l}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {cur.key === "emergency" && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
              ¿A quién debemos contactar en caso de emergencia médica?
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Nombre completo</label>
              <input value={data.emergencyContact.name} onChange={e => setEC("name", e.target.value)} placeholder="Juan Pérez" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Teléfono</label>
              <input type="tel" value={data.emergencyContact.phone} onChange={e => setEC("phone", e.target.value)} placeholder="6700-1234" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Parentesco</label>
              <select value={data.emergencyContact.relationship} onChange={e => setEC("relationship", e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
                <option value="">Seleccionar...</option>
                {["Esposo/a", "Padre/Madre", "Hijo/a", "Hermano/a", "Amigo/a", "Otro"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {cur.key === "done" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8 }}>¡Configuración completada!</h2>
            <div style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, marginBottom: 20 }}>
              Ya está listo/a para usar PrevenApp. Generaremos sus tamizajes y vacunas personalizadas.
            </div>
            <div style={{ padding: "16px", borderRadius: 14, background: "#F0FDF4", textAlign: "left", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#16A34A", marginBottom: 8 }}>Próximos pasos:</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.8 }}>
                ✓ Revisar sus tamizajes recomendados<br />
                ✓ Registrar sus medicamentos actuales<br />
                ✓ Tomar su primera presión y glucosa<br />
                ✓ Su médico validará sus datos en su próxima cita
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div style={{ padding: "12px 20px 20px", background: "#fff", borderTop: "1px solid " + T.border }}>
        <div style={{ display: "flex", gap: 8 }}>
          {step > 0 && cur.key !== "done" && (
            <button onClick={back} style={{
              flex: 1, padding: 14, borderRadius: 12, border: "2px solid " + T.border,
              background: "#fff", color: T.sub, fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>← Atrás</button>
          )}
          {cur.key !== "done" ? (
            <button onClick={next} style={{
              flex: 2, padding: 14, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #064E52, #0A8A8F)", color: "#fff",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(10,138,143,0.3)",
            }}>{step === STEPS.length - 2 ? "Finalizar →" : "Continuar →"}</button>
          ) : (
            <button onClick={() => saveAndFinish(false)} disabled={saving} style={{
              flex: 1, padding: 14, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff",
              fontSize: 16, fontWeight: 800, cursor: saving ? "wait" : "pointer",
              boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
            }}>{saving ? "Guardando..." : "Comenzar a usar PrevenApp 🚀"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
