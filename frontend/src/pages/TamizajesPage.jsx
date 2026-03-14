import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { BigButton, LoadingSpinner, ErrorMsg, EmptyState, StatusBadge, COLORS, STATUS, formatDate } from "../components/UI";
import ICD10Search from "../components/ICD10Search";

// ─── Colors per group ──────────────────────────────────────
const GROUP_THEMES = {
  preventivo: { accent: "#8B5CF6", bg: "#F5F3FF", light: "#EDE9FE", icon: "🔬", label: "Preventivos", sub: "Cáncer y riesgo CV", cats: ["oncologic"] },
  cronico: { accent: "#D97706", bg: "#FFFBEB", light: "#FEF3C7", icon: "🩺", label: "Enfermedad Crónica", sub: "HTA, DM2, síndrome metabólico", cats: ["cardiovascular", "metabolic"] },
  general: { accent: "#0D9488", bg: "#F0FDFA", light: "#CCFBF1", icon: "📋", label: "Generales", sub: "Rutina y prevención", cats: ["general"] },
};

// ─── Screening card ─────────────────────────────────────────
function ScreeningCard({ s, accent }) {
  const [open, setOpen] = useState(false);
  const prio = { alta: { label: "Prioritario", c: "#DC2626" }, media: { label: "Recomendado", c: "#D97706" }, baja: { label: "Sugerido", c: "#64748B" } };
  const p = prio[s.priority] || prio.media;
  return (
    <div onClick={() => setOpen(!open)} style={{
      padding: "12px 14px", cursor: "pointer",
      borderBottom: "1px solid #F1F5F9", transition: "background 0.15s",
      background: open ? accent + "08" : "transparent",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 6, height: 6, borderRadius: 3, flexShrink: 0,
          background: STATUS[s.status]?.color || "#94A3B8",
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1E293B" }}>{s.name}</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 1 }}>
            {s.intervalMonths === 0 ? "Único" : s.intervalMonths >= 12 ? "c/" + (s.intervalMonths / 12) + "a" : "c/" + s.intervalMonths + "m"}
            {s.lastDone ? " · " + formatDate(s.lastDone) : ""}
            {!s.lastDone && <span style={{ color: "#DC2626", fontWeight: 600 }}> · Pendiente</span>}
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: p.c + "15", color: p.c }}>{p.label}</span>
        <span style={{ fontSize: 14, color: "#CBD5E1", transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
      </div>
      <div style={{ maxHeight: open ? 500 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ paddingTop: 10, marginTop: 10, borderTop: "1px dashed #E2E8F0" }}>
          {s.reason && (
            <div style={{ padding: "8px 12px", borderRadius: 10, background: accent + "10", fontSize: 13, color: accent, lineHeight: 1.6, marginBottom: 6 }}>
              💡 {s.reason}
            </div>
          )}
          {s.source && <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic", marginBottom: 6 }}>📚 {s.source}</div>}
          {s.result && <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 600, padding: "6px 10px", borderRadius: 8, background: "#F0FDF4", marginBottom: 6 }}>📋 {s.result}</div>}
          {s.resultClassification && (
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>
              Clasificación: <span style={{ fontWeight: 700, color: s.resultClassification === "normal" ? "#16A34A" : s.resultClassification === "borderline" ? "#D97706" : "#DC2626" }}>
                {s.resultClassification === "normal" ? "Normal" : s.resultClassification === "borderline" ? "Limítrofe" : "Patológico"}
              </span>
            </div>
          )}
          {s.status === "red" && <div style={{ padding: "8px 12px", borderRadius: 10, background: "#FEF2F2", fontSize: 14, fontWeight: 600, color: "#DC2626" }}>⏰ Vencido — solicite cita</div>}
          {s.status === "yellow" && <div style={{ padding: "8px 12px", borderRadius: 10, background: "#FFFBEB", fontSize: 14, fontWeight: 600, color: "#D97706" }}>📅 Próximo a vencer</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Group section ──────────────────────────────────────────
function Group({ theme, items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const red = items.filter(s => s.status === "red").length;
  const yellow = items.filter(s => s.status === "yellow").length;
  const green = items.filter(s => s.status === "green").length;
  return (
    <div style={{ marginBottom: 12, borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "14px 16px", background: theme.bg, border: "none",
        cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: 22 }}>{theme.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>{theme.label}</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>{theme.sub}</div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {red > 0 && <span style={{ fontSize: 11, fontWeight: 700, width: 22, height: 22, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "#FEE2E2", color: "#DC2626" }}>{red}</span>}
          {yellow > 0 && <span style={{ fontSize: 11, fontWeight: 700, width: 22, height: 22, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "#FEF3C7", color: "#D97706" }}>{yellow}</span>}
          {green > 0 && <span style={{ fontSize: 11, fontWeight: 700, width: 22, height: 22, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "#DCFCE7", color: "#16A34A" }}>{green}</span>}
        </div>
        <span style={{ fontSize: 16, color: "#94A3B8", transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
      </button>
      <div style={{ maxHeight: open ? 5000 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
        {items.map(s => <ScreeningCard key={s._id} s={s} accent={theme.accent} />)}
      </div>
    </div>
  );
}

// ─── Progress bar (segmented) ───────────────────────────────
function ProgressBar({ red, yellow, green, total }) {
  if (total === 0) return null;
  const pctG = Math.round((green / total) * 100);
  const pctY = Math.round((yellow / total) * 100);
  const pctR = Math.round((red / total) * 100);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#1E293B" }}>{green}</span>
          <span style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}> / {total} al día</span>
        </div>
        <div style={{ fontSize: 13, color: "#64748B" }}>
          {red > 0 && <span style={{ color: "#DC2626", fontWeight: 600 }}>{red} vencido{red > 1 ? "s" : ""}</span>}
          {red > 0 && yellow > 0 && " · "}
          {yellow > 0 && <span style={{ color: "#D97706", fontWeight: 600 }}>{yellow} próximo{yellow > 1 ? "s" : ""}</span>}
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#F1F5F9", overflow: "hidden", display: "flex" }}>
        {pctG > 0 && <div style={{ width: pctG + "%", background: "linear-gradient(90deg, #16A34A, #22C55E)", borderRadius: 4, transition: "width 0.6s ease" }} />}
        {pctY > 0 && <div style={{ width: pctY + "%", background: "linear-gradient(90deg, #EAB308, #FACC15)", transition: "width 0.6s ease" }} />}
        {pctR > 0 && <div style={{ width: pctR + "%", background: "linear-gradient(90deg, #DC2626, #EF4444)", transition: "width 0.6s ease" }} />}
      </div>
    </div>
  );
}

// ─── Section toggle (Tamizajes vs Vacunas) ──────────────────
function SectionToggle({ active, onChange }) {
  return (
    <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 3, marginBottom: 16 }}>
      {[
        { key: "tamizajes", label: "Tamizajes", icon: "🛡️" },
        { key: "vacunas", label: "Vacunación", icon: "💉" },
      ].map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex: 1, padding: "10px 8px", borderRadius: 10, border: "none",
          background: active === t.key ? "#fff" : "transparent",
          boxShadow: active === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          color: active === t.key ? "#1E293B" : "#64748B",
          fontSize: 14, fontWeight: active === t.key ? 700 : 500,
          cursor: "pointer", transition: "all 0.15s",
        }}>{t.icon} {t.label}</button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VACCINATION CARD — PAI MINSA Panamá 2025
// ═══════════════════════════════════════════════════════════

function buildVaccineSchedule(patient) {
  const age = patient?.age || 30;
  const sex = patient?.sex || "F";
  const hasDx = (kw) => (patient?.diagnoses || []).some(d => d.isActive && kw.some(k => d.name.toLowerCase().includes(k)));
  const hasChronic = hasDx(["hipertens", "diabetes", "cardio", "pulmon", "renal", "hepat", "obesidad", "asplenia", "vih"]);
  const isHealthWorker = false; // could be a patient field in future
  const groups = [];

  // 1. Base — all adults
  const base = { title: "Esquema base — Todo adulto", icon: "💉", accent: "#0D9488", bg: "#F0FDFA", vaccines: [] };
  base.vaccines.push(
    { key: "td_dose1", name: "Td (Tétanos-Difteria)", dose: "1.ª dosis", info: "Iniciar esquema", totalDoses: 3 },
    { key: "td_dose2", name: "Td (Tétanos-Difteria)", dose: "2.ª dosis", info: "1 mes después de la 1.ª" },
    { key: "td_dose3", name: "Td (Tétanos-Difteria)", dose: "3.ª dosis / Refuerzo", info: "12 meses después de la 2.ª, luego c/10 años" },
    { key: "mr_dose1", name: "MR (Sarampión-Rubéola)", dose: "1 dosis", info: "Si nunca fue vacunado/a" },
    { key: "influenza_" + new Date().getFullYear(), name: "Influenza", dose: "1 dosis anual", info: "Campaña anual para todos los adultos" },
    { key: "covid_2025", name: "COVID-19", dose: "1 dosis", info: "Esquema 2025, aplicación anual" },
  );
  groups.push(base);

  // 2. Women of reproductive age / pregnant
  if (sex === "F" && age >= 15 && age <= 49) {
    const women = { title: "Mujer en edad fértil / Embarazo", icon: "🤰", accent: "#EC4899", bg: "#FDF2F8", vaccines: [] };
    women.vaccines.push(
      { key: "tdap_pregnancy", name: "Tdap", dose: "1 dosis por embarazo", info: "Desde semana 27; reemplaza 1 dosis de Td" },
      { key: "influenza_pregnancy", name: "Influenza (embarazo)", dose: "1 dosis anual", info: "En cualquier trimestre de gestación" },
      { key: "vsr_pregnancy", name: "VSR (embarazo)", dose: "1 dosis", info: "Entre semana 32 y 36 de gestación" },
      { key: "mr_mef", name: "MR (puérpera)", dose: "1 dosis", info: "Si nunca vacunada, preferiblemente puerperio inmediato" },
      { key: "covid_pregnancy", name: "COVID-19 (embarazo)", dose: "1 dosis", info: "Independiente del período de gestación" },
    );
    groups.push(women);
  }

  // 3. Age 60+
  if (age >= 60) {
    const sixty = { title: "Adulto ≥60 años", icon: "👴", accent: "#1E40AF", bg: "#EFF6FF", vaccines: [] };
    sixty.vaccines.push(
      { key: "pcv20", name: "Neumococo PCV20", dose: "Dosis única", info: "A partir de los 60 años" },
      { key: "ppsv23", name: "Neumococo PPSV23", dose: "Según evaluación", info: "Complementario al PCV20 según contexto local" },
      { key: "tdap_60", name: "Tdap", dose: "1 dosis", info: "A partir de los 60; revacunar c/10 años, c/5 si herida grave" },
      { key: "vsr_60", name: "VSR", dose: "1 dosis", info: "A partir de los 60 años" },
    );
    if (age < 50) { /* influenza already added above */ }
    groups.push(sixty);
  }

  // 5. Chronic conditions
  if (hasChronic) {
    const chronic = { title: "Condiciones de riesgo", icon: "🏥", accent: "#DC2626", bg: "#FEF2F2", vaccines: [] };
    chronic.vaccines.push(
      { key: "pcv20_risk", name: "Neumococo PCV20", dose: "Dosis única", info: "Independiente de edad en pacientes con ECNT" },
      { key: "hepb_risk_1", name: "Hepatitis B", dose: "1.ª dosis", info: "DM, hemodiálisis, hepatopatía; esquema 0, 1, 6 meses" },
      { key: "hepb_risk_2", name: "Hepatitis B", dose: "2.ª dosis", info: "1 mes después de la 1.ª" },
      { key: "hepb_risk_3", name: "Hepatitis B", dose: "3.ª dosis", info: "6 meses después de la 1.ª" },
    );
    if (hasDx(["vih"]) || hasDx(["asplenia"])) {
      chronic.vaccines.push({ key: "hepa_risk", name: "Hepatitis A", dose: "2 dosis", info: "0 y 6-12 meses; VIH, hepatopatía, HSH" });
    }
    groups.push(chronic);
  }

  // 6. Health workers (future: detect from patient profile)
  // Placeholder — can be toggled

  return groups;
}

function VaccineSection({ patient }) {
  const [records, setRecords] = useState({}); // { vaccineKey: dateString }
  const [openGroup, setOpenGroup] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getVaccinations();
        const map = {};
        (res.data || []).forEach(r => { map[r.vaccineKey] = r.dateAdministered?.split("T")[0] || r.dateAdministered; });
        setRecords(map);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleVaccine = async (key, name, dose, dateStr) => {
    if (records[key]) {
      // Remove
      setSaving(key);
      try { await api.removeVaccination(key); setRecords(r => { const n = { ...r }; delete n[key]; return n; }); }
      catch (e) { alert(e.message); }
      finally { setSaving(null); }
    } else {
      // Add with date
      const date = dateStr || new Date().toISOString().split("T")[0];
      setSaving(key);
      try {
        await api.recordVaccination({ vaccineKey: key, vaccineName: name, doseLabel: dose, dateAdministered: date });
        setRecords(r => ({ ...r, [key]: date }));
      } catch (e) { alert(e.message); }
      finally { setSaving(null); }
    }
  };

  const updateDate = async (key, name, dose, date) => {
    setSaving(key);
    try {
      await api.recordVaccination({ vaccineKey: key, vaccineName: name, doseLabel: dose, dateAdministered: date });
      setRecords(r => ({ ...r, [key]: date }));
    } catch (e) { alert(e.message); }
    finally { setSaving(null); }
  };

  const groups = buildVaccineSchedule(patient);
  const totalVaccines = groups.reduce((s, g) => s + g.vaccines.length, 0);
  const administered = Object.keys(records).length;

  return (
    <div>
      {/* Summary */}
      <div style={{ padding: "14px 16px", marginBottom: 12, borderRadius: 14, background: "linear-gradient(135deg, #F0FDFA, #fff)", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>Tarjeta de Vacunación</div>
            <div style={{ fontSize: 13, color: "#64748B" }}>PAI MINSA Panamá 2025</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0A8A8F" }}>{administered}/{totalVaccines}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>registradas</div>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#E2E8F0", overflow: "hidden" }}>
          <div style={{ height: "100%", width: (totalVaccines > 0 ? (administered / totalVaccines) * 100 : 0) + "%", background: "linear-gradient(90deg, #0A8A8F, #0FB5A2)", borderRadius: 3, transition: "width 0.5s" }} />
        </div>
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 20, color: "#94A3B8" }}>Cargando...</div> : (
        groups.map((g, gi) => {
          const groupDone = g.vaccines.filter(v => records[v.key]).length;
          return (
            <div key={gi} style={{ marginBottom: 10, borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <button onClick={() => setOpenGroup(openGroup === gi ? -1 : gi)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px",
                background: g.bg, border: "none", cursor: "pointer", textAlign: "left",
              }}>
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{g.title}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: groupDone === g.vaccines.length ? "#DCFCE7" : "#fff", color: groupDone === g.vaccines.length ? "#16A34A" : g.accent }}>
                  {groupDone}/{g.vaccines.length}
                </span>
                <span style={{ color: "#94A3B8", transform: openGroup === gi ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
              </button>
              <div style={{ maxHeight: openGroup === gi ? 2000 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
                {g.vaccines.map((v, vi) => {
                  const done = !!records[v.key];
                  const dateVal = records[v.key] || "";
                  return (
                    <div key={v.key} style={{ padding: "10px 14px", borderBottom: vi < g.vaccines.length - 1 ? "1px solid #F1F5F9" : "none", background: done ? "#F0FDF4" + "60" : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Checkbox */}
                        <button onClick={() => { if (!done) { toggleVaccine(v.key, v.name, v.dose, new Date().toISOString().split("T")[0]); } else { toggleVaccine(v.key); } }}
                          disabled={saving === v.key}
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: done ? "none" : "2px solid #CBD5E1",
                            background: done ? "#16A34A" : "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
                          }}>
                          {done && <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>✓</span>}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", textDecoration: done ? "none" : "none" }}>{v.name}</div>
                          <div style={{ fontSize: 12, color: "#64748B" }}>{v.dose} · {v.info}</div>
                        </div>
                      </div>
                      {/* Date picker — always visible when checked */}
                      {done && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, marginLeft: 38 }}>
                          <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>📅</span>
                          <input type="date" value={dateVal}
                            onChange={e => updateDate(v.key, v.name, v.dose, e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, color: "#1E293B", outline: "none", fontFamily: "inherit" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <div style={{ textAlign: "center", padding: "12px 16px", fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
        Fuente: PAI MINSA Panamá · Ley 48 del 5/12/2007<br />
        Vacunas gratuitas en centros de salud MINSA y CSS
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DOCTOR MODE (kept compact, same functionality)
// ═══════════════════════════════════════════════════════════
const DOCTOR_PIN = "2026";

function DoctorMode({ patient, screenings, onClose }) {
  const [tab, setTab] = useState("clinical");
  const [newDx, setNewDx] = useState(""); const [newDxCode, setNewDxCode] = useState("");
  const [newFh, setNewFh] = useState(""); const [newFhRel, setNewFhRel] = useState("");
  const [localDiag, setLocalDiag] = useState(patient?.diagnoses?.filter(d => d.isActive) || []);
  const [localFhx, setLocalFhx] = useState(patient?.familyHistory || []);
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
  const [resultForm, setResultForm] = useState(null);
  const [resultText, setResultText] = useState("");
  const [resultDate, setResultDate] = useState(new Date().toISOString().split("T")[0]);
  const [resultCls, setResultCls] = useState("");
  const [nextMode, setNextMode] = useState("suggested");
  const [sugNext, setSugNext] = useState(""); const [cusNext, setCusNext] = useState("");

  const iS = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #E2E8F0", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  const addDx = () => { if (!newDx) return; setLocalDiag([...localDiag, { name: newDx, code: newDxCode, dateOfDiagnosis: new Date().toISOString(), isActive: true }]); setNewDx(""); setNewDxCode(""); };
  const addFh = () => { if (!newFh || !newFhRel) return; setLocalFhx([...localFhx, { condition: newFh, relative: newFhRel }]); setNewFh(""); setNewFhRel(""); };

  const handleSave = async () => {
    setSaving(true);
    try { await api.put("/auth/me/patient", { diagnoses: localDiag, familyHistory: localFhx }); setSaved(true); setTimeout(() => onClose(true), 1000); }
    catch (err) { try { localStorage.setItem("prevenapp_pending_doctor_edit", JSON.stringify({ diagnoses: localDiag, familyHistory: localFhx })); setSaved(true); setTimeout(() => onClose(true), 1000); } catch (e) { alert(err.message); } }
    finally { setSaving(false); }
  };

  const computeSug = (s, cls) => {
    const d = new Date(resultDate); let m = s.normalInterval || s.intervalMonths || 12;
    if (cls === "borderline") m = s.borderlineInterval || Math.round(m * 0.5);
    if (cls === "pathological") m = s.pathologicalInterval || 3;
    d.setMonth(d.getMonth() + m); return d.toISOString().split("T")[0];
  };

  const handleCompleteSc = async (sid) => {
    setSaving(true);
    try {
      const body = { result: resultText, completedDate: resultDate, resultClassification: resultCls || undefined };
      if (nextMode === "suggested" && sugNext) body.customNextDue = sugNext;
      else if (nextMode === "custom" && cusNext) body.customNextDue = cusNext;
      await api.put("/screenings/" + sid + "/complete", body);
      setSaved(true); setTimeout(() => onClose(true), 1000);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const pending = (screenings || []).filter(s => s.status === "red" || s.status === "yellow");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => onClose(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "16px 16px 28px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E2E8F0", margin: "0 auto 12px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 12px", borderRadius: 12, background: "linear-gradient(135deg, #1A2F4B, #2B5B8A)" }}>
          <span style={{ fontSize: 24 }}>🩺</span>
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Modo Médico</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>APP / APF / Tamizajes</div>
          </div>
        </div>

        {saved ? (
          <div style={{ padding: 16, borderRadius: 12, background: "#F0FDF4", textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#16A34A" }}>Guardado</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {[{ k: "clinical", l: "🏥 Clínico" }, { k: "screenings", l: "🛡️ Tamizajes (" + pending.length + ")" }].map(t => (
                <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, border: "none", background: tab === t.k ? "#1A2F4B" : "#F1F5F9", color: tab === t.k ? "#fff" : "#64748B", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t.l}</button>
              ))}
            </div>

            {tab === "clinical" && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Diagnósticos (APP)</div>
                  {localDiag.map((dx, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 4, borderRadius: 10, background: "#FEF2F2" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{dx.name}</div>
                        {dx.code && <div style={{ fontSize: 12, color: "#64748B" }}>{dx.code}</div>}
                      </div>
                      <button onClick={() => setLocalDiag(localDiag.filter((_, j) => j !== i))} style={{ background: "none", border: "none", fontSize: 18, color: "#DC2626", cursor: "pointer" }}>×</button>
                    </div>
                  ))}
                  <ICD10Search placeholder="Buscar CIE-10..." onSelect={item => setLocalDiag([...localDiag, { name: item.name, code: item.code, dateOfDiagnosis: new Date().toISOString(), isActive: true }])} />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input value={newDx} onChange={e => setNewDx(e.target.value)} placeholder="Manual" style={{ ...iS, flex: 2 }} />
                    <input value={newDxCode} onChange={e => setNewDxCode(e.target.value)} placeholder="Código" style={{ ...iS, flex: 1 }} />
                    <button onClick={addDx} disabled={!newDx} style={{ padding: "0 14px", borderRadius: 10, border: "none", background: newDx ? "#1A2F4B" : "#E2E8F0", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>+</button>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Antecedentes Familiares</div>
                  {localFhx.map((fh, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 4, borderRadius: 10, background: "#F5F3FF" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{fh.condition}</div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>{fh.relative}</div>
                      </div>
                      <button onClick={() => setLocalFhx(localFhx.filter((_, j) => j !== i))} style={{ background: "none", border: "none", fontSize: 18, color: "#6366F1", cursor: "pointer" }}>×</button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={newFh} onChange={e => setNewFh(e.target.value)} placeholder="Condición" style={{ ...iS, flex: 2 }} />
                    <input value={newFhRel} onChange={e => setNewFhRel(e.target.value)} placeholder="Parentesco" style={{ ...iS, flex: 1 }} />
                    <button onClick={addFh} disabled={!newFh || !newFhRel} style={{ padding: "0 14px", borderRadius: 10, border: "none", background: newFh && newFhRel ? "#6366F1" : "#E2E8F0", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>+</button>
                  </div>
                </div>
                <BigButton onClick={handleSave} disabled={saving} icon="💾" color="#1A2F4B">{saving ? "Guardando..." : "Guardar"}</BigButton>
              </>
            )}

            {tab === "screenings" && (
              <div>
                {pending.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 16, color: "#64748B" }}>
                    <div style={{ fontSize: 24 }}>✓</div><div style={{ fontSize: 14, fontWeight: 600 }}>Todos al día</div>
                  </div>
                ) : pending.map(s => (
                  <div key={s._id} style={{ marginBottom: 8, padding: "12px 14px", borderRadius: 12, border: "2px solid " + (STATUS[s.status]?.color || "#E2E8F0"), background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>{s.lastDone ? "Últ: " + formatDate(s.lastDone) : "Nunca realizado"}</div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    {resultForm === s._id ? (
                      <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#F8FAFC" }}>
                        <input type="date" value={resultDate} onChange={e => { setResultDate(e.target.value); if (resultCls) { setSugNext(computeSug(s, resultCls)); } }} style={{ ...iS, marginBottom: 8 }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
                          {[{ v: "normal", l: "✓ Normal", c: "#16A34A" }, { v: "borderline", l: "⚠ Limítrofe", c: "#D97706" }, { v: "pathological", l: "✗ Patológico", c: "#DC2626" }].map(o => (
                            <button key={o.v} onClick={() => { setResultCls(o.v); setSugNext(computeSug(s, o.v)); setNextMode("suggested"); }} style={{
                              padding: "8px 4px", borderRadius: 8, border: resultCls === o.v ? "2px solid " + o.c : "2px solid #E2E8F0",
                              background: resultCls === o.v ? o.c + "12" : "#fff", color: resultCls === o.v ? o.c : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            }}>{o.l}</button>
                          ))}
                        </div>
                        <textarea value={resultText} onChange={e => setResultText(e.target.value)} placeholder="Hallazgos" rows={2} style={{ ...iS, marginBottom: 8, resize: "none" }} />
                        {resultCls && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>PRÓXIMA</div>
                            {[{ m: "suggested", l: "Sugerida: " + sugNext }, { m: "default", l: "Estándar" }, { m: "custom", l: "Personalizada" }].map(o => (
                              <button key={o.m} onClick={() => setNextMode(o.m)} style={{
                                display: "block", width: "100%", padding: "6px 10px", marginBottom: 3, borderRadius: 8, textAlign: "left",
                                border: nextMode === o.m ? "2px solid #0A8A8F" : "1px solid #E2E8F0", background: nextMode === o.m ? "#F0FDFA" : "#fff",
                                fontSize: 13, fontWeight: nextMode === o.m ? 700 : 500, color: "#1E293B", cursor: "pointer",
                              }}>{o.l}</button>
                            ))}
                            {nextMode === "custom" && <input type="date" value={cusNext} onChange={e => setCusNext(e.target.value)} style={{ ...iS, marginTop: 4 }} />}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleCompleteSc(s._id)} disabled={saving || !resultCls} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: resultCls ? "#16A34A" : "#E2E8F0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✓ Guardar</button>
                          <button onClick={() => setResultForm(null)} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer" }}>×</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setResultForm(s._id); setResultText(""); setResultDate(new Date().toISOString().split("T")[0]); setResultCls(""); }} style={{ marginTop: 8, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", background: "#16A34A", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>📝 Registrar resultado</button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => onClose(false)} style={{ width: "100%", padding: 12, marginTop: 8, borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff", fontSize: 14, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function TamizajesPage() {
  const { patient } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [section, setSection] = useState("tamizajes");
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState(""); const [pinErr, setPinErr] = useState(false);
  const [doctorMode, setDoctorMode] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.getScreenings(); setScreenings(r.data); setSummary(r.summary); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleGenerate = async () => { try { await api.generateScreenings(); load(); } catch (e) { setError(e.message); } };
  const submitPin = () => { if (pin === DOCTOR_PIN) { setShowPin(false); setDoctorMode(true); setPin(""); } else { setPinErr(true); setPin(""); } };

  if (loading) return <LoadingSpinner text="Cargando..." />;
  if (error) return <ErrorMsg message={error} onRetry={load} />;

  const total = screenings.length;
  const grouped = {};
  for (const [k, v] of Object.entries(GROUP_THEMES)) {
    grouped[k] = screenings.filter(s => v.cats.includes(s.category)).sort((a, b) => ({ red: 0, yellow: 1, green: 2 }[a.status] || 2) - ({ red: 0, yellow: 1, green: 2 }[b.status] || 2));
  }

  return (
    <div>
      <SectionToggle active={section} onChange={setSection} />

      {section === "tamizajes" && (
        <>
          {total === 0 ? (
            <EmptyState icon="🛡️" message="Sin tamizajes aún" action={handleGenerate} actionLabel="Generar tamizajes" />
          ) : (
            <>
              <ProgressBar red={summary?.red || 0} yellow={summary?.yellow || 0} green={summary?.green || 0} total={total} />
              {Object.entries(GROUP_THEMES).map(([k, theme]) => {
                const items = grouped[k];
                if (!items?.length) return null;
                return <Group key={k} theme={theme} items={items} defaultOpen={items.some(s => s.status === "red")} />;
              })}
            </>
          )}
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button onClick={() => setShowPin(true)} style={{ background: "none", border: "none", fontSize: 13, color: "#94A3B8", cursor: "pointer", padding: "8px 16px", textDecoration: "underline" }}>🩺 Modo médico</button>
          </div>
        </>
      )}

      {section === "vacunas" && <VaccineSection patient={patient} />}

      {/* PIN modal */}
      {showPin && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { setShowPin(false); setPin(""); setPinErr(false); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🩺</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", marginBottom: 4 }}>Modo Médico</div>
            <div style={{ fontSize: 14, color: "#64748B", marginBottom: 20 }}>Ingrese PIN</div>
            <input type="password" inputMode="numeric" maxLength={4} value={pin} autoFocus
              onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setPinErr(false); }}
              onKeyDown={e => e.key === "Enter" && submitPin()}
              style={{ width: "100%", padding: 16, borderRadius: 14, textAlign: "center", border: "2px solid " + (pinErr ? "#DC2626" : "#E2E8F0"), fontSize: 28, fontWeight: 800, letterSpacing: 12, outline: "none", boxSizing: "border-box" }} />
            {pinErr && <div style={{ fontSize: 14, color: "#DC2626", fontWeight: 600, marginTop: 8 }}>PIN incorrecto</div>}
            <BigButton onClick={submitPin} disabled={pin.length < 4} icon="→" color="#1A2F4B" style={{ marginTop: 16 }}>Ingresar</BigButton>
          </div>
        </div>
      )}

      {doctorMode && patient && <DoctorMode patient={patient} screenings={screenings} onClose={d => { setDoctorMode(false); if (d) window.location.reload(); }} />}
    </div>
  );
}