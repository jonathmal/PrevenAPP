import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner, COLORS, STATUS, formatShortDate } from "../components/UI";

const T = { text: "#1E293B", sub: "#64748B", muted: "#94A3B8", border: "#E2E8F0", div: "#F1F5F9", card: "#fff", r: 14 };
const card = { background: T.card, borderRadius: T.r, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)", overflow: "hidden" };
const input = { width: "100%", padding: "14px 16px", borderRadius: 12, border: "2px solid " + T.border, fontSize: 18, fontWeight: 700, textAlign: "center", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btnS = (bg) => ({ width: "100%", padding: 14, borderRadius: 12, border: "none", background: bg, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" });

function StatusDot({ status }) {
  const c = { red: "#DC2626", yellow: "#D97706", green: "#16A34A" }[status] || T.muted;
  return <div style={{ width: 8, height: 8, borderRadius: 4, background: c, flexShrink: 0 }} />;
}

// ═══════════════════════════════════════════════════════════
// BMI GAUGE — semicircular needle gauge
// ═══════════════════════════════════════════════════════════
function BMIGauge({ bmi }) {
  if (!bmi) return null;
  const b = parseFloat(bmi);
  // Map BMI to angle: 15→0°, 40→180°
  const clampBmi = Math.max(15, Math.min(40, b));
  const angle = ((clampBmi - 15) / 25) * 180;
  const needleAngle = 180 - angle; // SVG arc: 180=left, 0=right

  const zones = [
    { start: 0, end: 14, color: "#60A5FA", label: "Bajo peso" },      // <18.5
    { start: 14, end: 40, color: "#22C55E", label: "Normal" },         // 18.5-24.9
    { start: 40, end: 60, color: "#F59E0B", label: "Sobrepeso" },      // 25-29.9
    { start: 60, end: 100, color: "#EF4444", label: "Obesidad" },      // 30+
  ];

  const statusText = b < 18.5 ? "Bajo peso" : b < 25 ? "Peso saludable" : b < 30 ? "Sobrepeso" : b < 35 ? "Obesidad I" : b < 40 ? "Obesidad II" : "Obesidad III";
  const statusColor = b < 18.5 ? "#60A5FA" : b < 25 ? "#22C55E" : b < 30 ? "#F59E0B" : "#EF4444";

  const cx = 140, cy = 125, r = 100;
  const needleRad = (needleAngle * Math.PI) / 180;
  const nx = cx + (r - 10) * Math.cos(needleRad);
  const ny = cy - (r - 10) * Math.sin(needleRad);

  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 280 160" style={{ width: "100%", maxWidth: 300 }}>
        {zones.map((z, i) => {
          const s = (z.start / 100) * 180;
          const e = (z.end / 100) * 180;
          const sRad = ((180 - s) * Math.PI) / 180;
          const eRad = ((180 - e) * Math.PI) / 180;
          const x1 = cx + r * Math.cos(sRad), y1 = cy - r * Math.sin(sRad);
          const x2 = cx + r * Math.cos(eRad), y2 = cy - r * Math.sin(eRad);
          const large = e - s > 90 ? 1 : 0;
          return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={z.color} strokeWidth="20" strokeLinecap="butt" opacity="0.85" />;
        })}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="#1E293B" />
        <circle cx={cx} cy={cy} r="3" fill="#fff" />
        {/* Labels */}
        <text x="30" y="135" fill="#64748B" fontSize="10" fontWeight="600">15</text>
        <text x="60" y="55" fill="#64748B" fontSize="10" fontWeight="600">18.5</text>
        <text x="130" y="25" fill="#64748B" fontSize="10" fontWeight="600">25</text>
        <text x="200" y="55" fill="#64748B" fontSize="10" fontWeight="600">30</text>
        <text x="240" y="135" fill="#64748B" fontSize="10" fontWeight="600">40</text>
      </svg>
      <div style={{ marginTop: -10 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: statusColor }}>{bmi}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: statusColor, marginTop: 2 }}>{statusText}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LINE CHART — reusable for BP and Glucose
// ═══════════════════════════════════════════════════════════
function LineChart({ data, lines, height = 180, goalMin, goalMax, goalLabel }) {
  if (!data?.length || data.length < 2) return <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 14 }}>Necesita al menos 2 registros para mostrar la gráfica</div>;

  const W = 320, H = height, pad = { top: 20, right: 15, bottom: 35, left: 40 };
  const plotW = W - pad.left - pad.right, plotH = H - pad.top - pad.bottom;

  // Compute global min/max across all lines
  let allVals = [];
  lines.forEach(l => data.forEach(d => { const v = l.getValue(d); if (v != null) allVals.push(v); }));
  if (goalMin != null) allVals.push(goalMin);
  if (goalMax != null) allVals.push(goalMax);
  const mn = Math.min(...allVals) * 0.92, mx = Math.max(...allVals) * 1.08;
  const rg = mx - mn || 1;

  const xScale = (i) => pad.left + (i / (data.length - 1)) * plotW;
  const yScale = (v) => pad.top + plotH - ((v - mn) / rg) * plotH;

  // Date labels (show ~5)
  const step = Math.max(1, Math.floor(data.length / 5));
  const dateLabels = data.map((d, i) => i % step === 0 || i === data.length - 1 ? { i, label: formatShortDate(d.date || d.measuredAt) } : null).filter(Boolean);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const y = pad.top + plotH * (1 - p);
        const val = Math.round(mn + rg * p);
        return (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="#F1F5F9" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} fill="#94A3B8" fontSize="9" textAnchor="end" fontWeight="600">{val}</text>
          </g>
        );
      })}

      {/* Goal zone */}
      {goalMin != null && goalMax != null && (
        <rect x={pad.left} y={yScale(goalMax)} width={plotW} height={yScale(goalMin) - yScale(goalMax)}
          fill="#22C55E" opacity="0.08" rx="4" />
      )}
      {goalMax != null && (
        <line x1={pad.left} x2={W - pad.right} y1={yScale(goalMax)} y2={yScale(goalMax)} stroke="#22C55E" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      )}
      {goalMin != null && (
        <line x1={pad.left} x2={W - pad.right} y1={yScale(goalMin)} y2={yScale(goalMin)} stroke="#22C55E" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      )}
      {goalLabel && goalMax != null && (
        <text x={W - pad.right - 2} y={yScale(goalMax) - 4} fill="#22C55E" fontSize="8" textAnchor="end" fontWeight="700">{goalLabel}</text>
      )}

      {/* Data lines */}
      {lines.map((l, li) => {
        const pts = data.map((d, i) => {
          const v = l.getValue(d);
          return v != null ? { x: xScale(i), y: yScale(v), v } : null;
        }).filter(Boolean);
        if (pts.length < 2) return null;
        const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p.x + " " + p.y).join(" ");
        const last = pts[pts.length - 1];
        return (
          <g key={li}>
            <polyline points={pts.map(p => p.x + "," + p.y).join(" ")} fill="none" stroke={l.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill={l.color} stroke="#fff" strokeWidth="1.5" />)}
            <text x={last.x + 6} y={last.y + 4} fill={l.color} fontSize="10" fontWeight="700">{Math.round(last.v)}</text>
          </g>
        );
      })}

      {/* Date labels */}
      {dateLabels.map((dl, i) => (
        <text key={i} x={xScale(dl.i)} y={H - 5} fill="#94A3B8" fontSize="8" textAnchor="middle" fontWeight="600">{dl.label}</text>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function MonitorPage() {
  const { patient } = useAuth();
  const [tab, setTab] = useState("bp");
  const [bpH, setBpH] = useState([]); const [glucH, setGlucH] = useState([]); const [weightH, setWeightH] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [bpSys, setBpSys] = useState(""); const [bpDia, setBpDia] = useState("");
  const [glucVal, setGlucVal] = useState(""); const [glucType, setGlucType] = useState("fasting");
  const [weightVal, setWeightVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [emergency, setEmergency] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bp, gl, wt] = await Promise.all([api.getBPHistory(30), api.getGlucoseHistory(30), api.getWeightHistory()]);
      setBpH(bp.data.reverse()); setGlucH(gl.data.reverse()); setWeightH(wt.data.reverse());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveBP = async () => {
    const s = parseInt(bpSys), d = parseInt(bpDia); if (!s || !d) return;
    setSaving(true);
    try {
      await api.recordBP(s, d); await load(); setShowForm(false); setBpSys(""); setBpDia("");
      if (s >= 180 || d >= 120) setEmergency({ title: "⚠️ CRISIS HIPERTENSIVA", value: s + "/" + d + " mmHg", msg: "Presión peligrosamente alta. Busque atención de EMERGENCIA.", actions: ["Llame al 911 o acuda a urgencias AHORA", "No conduzca", "Si tiene dolor de pecho o dificultad respiratoria, es emergencia cardiovascular"] });
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const saveGluc = async () => {
    const v = parseInt(glucVal); if (!v) return;
    setSaving(true);
    try {
      await api.recordGlucose(v, glucType); await load(); setShowForm(false); setGlucVal("");
      if (v < 54) setEmergency({ title: "⚠️ HIPOGLUCEMIA SEVERA", value: v + " mg/dL", msg: "Glucosa peligrosamente BAJA.", actions: ["Consuma 15-20g de azúcar de acción rápida AHORA", "Espere 15 min y remida", "Si no mejora, llame al 911"] });
      else if (v > 400) setEmergency({ title: "⚠️ HIPERGLUCEMIA SEVERA", value: v + " mg/dL", msg: "Glucosa peligrosamente ALTA.", actions: ["Llame al 911 o acuda a urgencias", "Tome abundante agua", "Si tiene náuseas/vómitos, puede ser cetoacidosis"] });
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const saveWeight = async () => {
    const v = parseFloat(weightVal); if (!v || v < 20 || v > 400) return;
    setSaving(true);
    try { await api.recordWeight(v); await load(); setShowForm(false); setWeightVal(""); }
    catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Cargando datos..." />;

  const lastBP = bpH[bpH.length - 1]; const lastGluc = glucH[glucH.length - 1];
  const curWeight = weightH.length > 0 ? weightH[weightH.length - 1].value : patient?.weight;
  const curHeight = patient?.height;
  const bmi = curWeight && curHeight ? (curWeight / Math.pow(curHeight / 100, 2)).toFixed(1) : null;

  return (
    <div>
      {/* Quick stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 4 }}>Última PA</div>
          {lastBP ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: lastBP.status === "green" ? "#16A34A" : lastBP.status === "yellow" ? "#D97706" : "#DC2626" }}>
                {lastBP.systolic}/{lastBP.diastolic}
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>mmHg · PAM {Math.round(lastBP.diastolic + (lastBP.systolic - lastBP.diastolic) / 3)}</div>
            </>
          ) : <div style={{ fontSize: 14, color: T.muted, padding: "10px 0" }}>Sin registros</div>}
        </div>
        <div style={{ flex: 1, ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 4 }}>Última glucosa</div>
          {lastGluc ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: lastGluc.status === "green" ? "#16A34A" : "#D97706" }}>{lastGluc.value}</div>
              <div style={{ fontSize: 11, color: T.muted }}>mg/dL · {lastGluc.type === "fasting" ? "ayunas" : "postprandial"}</div>
            </>
          ) : <div style={{ fontSize: 14, color: T.muted, padding: "10px 0" }}>Sin registros</div>}
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "flex", background: T.div, borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {[{ k: "bp", l: "❤️ Presión" }, { k: "glucose", l: "🩸 Glucosa" }, { k: "weight", l: "⚖️ Peso" }].map(t => (
          <button key={t.k} onClick={() => { setTab(t.k); setShowForm(false); }} style={{
            flex: 1, padding: "9px 6px", borderRadius: 8, border: "none",
            background: tab === t.k ? "#fff" : "transparent",
            boxShadow: tab === t.k ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            fontSize: 14, fontWeight: tab === t.k ? 700 : 500, color: tab === t.k ? T.text : T.sub, cursor: "pointer",
          }}>{t.l}</button>
        ))}
      </div>

      {/* ─── BP TAB ──────────────────────────────── */}
      {tab === "bp" && (
        <div>
          {/* Chart */}
          <div style={{ ...card, padding: "16px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4, paddingLeft: 4 }}>Tendencia de Presión Arterial</div>
            <div style={{ display: "flex", gap: 12, paddingLeft: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}>● Sistólica</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6" }}>● Diastólica</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8B5CF6" }}>● PAM</span>
            </div>
            <LineChart
              data={bpH}
              lines={[
                { color: "#DC2626", getValue: d => d.systolic },
                { color: "#3B82F6", getValue: d => d.diastolic },
                { color: "#8B5CF6", getValue: d => Math.round(d.diastolic + (d.systolic - d.diastolic) / 3) },
              ]}
              goalMin={60} goalMax={140} goalLabel="Meta PA"
            />
          </div>

          {/* Form + History */}
          <div style={card}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Presión arterial</div><div style={{ fontSize: 13, color: T.sub }}>{bpH.length} registros</div></div>
              <button onClick={() => setShowForm(!showForm)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Registrar</button>
            </div>
            {showForm && (
              <div style={{ padding: 16, background: "#FEF2F2", borderBottom: "1px solid " + T.div }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, display: "block", marginBottom: 4 }}>SISTÓLICA</label>
                    <input type="number" value={bpSys} onChange={e => setBpSys(e.target.value)} placeholder="140" style={input} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, display: "block", marginBottom: 4 }}>DIASTÓLICA</label>
                    <input type="number" value={bpDia} onChange={e => setBpDia(e.target.value)} placeholder="90" style={input} />
                  </div>
                </div>
                <button onClick={saveBP} disabled={saving || !bpSys || !bpDia} style={btnS(bpSys && bpDia ? "#0A8A8F" : T.border)}>{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            )}
            {bpH.slice().reverse().slice(0, 10).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid " + T.div }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusDot status={r.status} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{r.systolic}/{r.diastolic}</span>
                  <span style={{ fontSize: 12, color: T.muted }}>PAM {Math.round(r.diastolic + (r.systolic - r.diastolic) / 3)}</span>
                </div>
                <span style={{ fontSize: 13, color: T.muted }}>{formatShortDate(r.measuredAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── GLUCOSE TAB ─────────────────────────── */}
      {tab === "glucose" && (
        <div>
          {/* Chart */}
          <div style={{ ...card, padding: "16px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4, paddingLeft: 4 }}>Seguimiento de Glicemia</div>
            <div style={{ display: "flex", gap: 12, paddingLeft: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8B5CF6" }}>● Glucosa (mg/dL)</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#22C55E", opacity: 0.6 }}>◻ Meta 70-130</span>
            </div>
            <LineChart
              data={glucH}
              lines={[{ color: "#8B5CF6", getValue: d => d.value }]}
              goalMin={70} goalMax={130} goalLabel="Meta ADA"
            />
          </div>

          {/* Form + History */}
          <div style={card}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Glucosa</div><div style={{ fontSize: 13, color: T.sub }}>{glucH.length} registros</div></div>
              <button onClick={() => setShowForm(!showForm)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Registrar</button>
            </div>
            {showForm && (
              <div style={{ padding: 16, background: "#F5F3FF", borderBottom: "1px solid " + T.div }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, display: "block", marginBottom: 4 }}>VALOR (mg/dL)</label>
                <input type="number" value={glucVal} onChange={e => setGlucVal(e.target.value)} placeholder="120" style={{ ...input, marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {[["fasting", "Ayunas"], ["postprandial", "Postprandial"]].map(([v, l]) => (
                    <button key={v} onClick={() => setGlucType(v)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: glucType === v ? "#8B5CF6" : T.div, color: glucType === v ? "#fff" : T.sub, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
                <button onClick={saveGluc} disabled={saving || !glucVal} style={btnS(glucVal ? "#8B5CF6" : T.border)}>{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            )}
            {glucH.slice().reverse().slice(0, 10).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid " + T.div }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusDot status={r.status} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{r.value}</span>
                  <span style={{ fontSize: 13, color: T.muted }}>mg/dL</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: r.type === "fasting" ? "#0A8A8F15" : "#8B5CF615", color: r.type === "fasting" ? "#0A8A8F" : "#8B5CF6" }}>{r.type === "fasting" ? "Ayunas" : "PP"}</span>
                </div>
                <span style={{ fontSize: 13, color: T.muted }}>{formatShortDate(r.measuredAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── WEIGHT TAB ──────────────────────────── */}
      {tab === "weight" && (
        <div>
          {/* BMI Gauge */}
          <div style={{ ...card, padding: "20px 16px", marginBottom: 16 }}>
            <BMIGauge bmi={bmi} />
            {curWeight && (
              <div style={{ textAlign: "center", marginTop: 12, padding: "10px 16px", borderRadius: 10, background: T.div }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: T.text }}>{curWeight}</span>
                <span style={{ fontSize: 16, color: T.muted, fontWeight: 500 }}> kg</span>
                {curHeight && <span style={{ fontSize: 13, color: T.muted, marginLeft: 8 }}>· {curHeight} cm</span>}
              </div>
            )}
            {!bmi && (
              <div style={{ textAlign: "center", padding: 20, color: T.muted, fontSize: 14 }}>
                Registre su peso para calcular el IMC
              </div>
            )}
          </div>

          {/* Weight trend chart */}
          {weightH.length >= 2 && (
            <div style={{ ...card, padding: "16px 12px", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8, paddingLeft: 4 }}>Tendencia de Peso</div>
              <LineChart
                data={weightH.map(w => ({ ...w, date: w.measuredAt }))}
                lines={[{ color: "#0A8A8F", getValue: d => d.value }]}
                height={140}
              />
            </div>
          )}

          {/* Register */}
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={btnS("linear-gradient(135deg, #064E52, #0FB5A2)")}>+ Registrar peso</button>
          ) : (
            <div style={{ ...card, padding: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, display: "block", marginBottom: 4 }}>PESO (kg)</label>
              <input type="number" step="0.1" value={weightVal} onChange={e => setWeightVal(e.target.value)} placeholder="77" style={{ ...input, marginBottom: 12 }} />
              <button onClick={saveWeight} disabled={saving || !weightVal} style={btnS(weightVal ? "#0A8A8F" : T.border)}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          )}

          {/* History */}
          {weightH.length > 0 && (
            <div style={{ ...card, marginTop: 16 }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div, fontSize: 15, fontWeight: 700, color: T.text }}>Historial</div>
              {weightH.slice().reverse().slice(0, 8).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid " + T.div }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{r.value} kg</span>
                  <span style={{ fontSize: 13, color: T.muted }}>{formatShortDate(r.measuredAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Emergency modal */}
      {emergency && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 380, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 30, margin: "0 auto 10px", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🚨</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#DC2626" }}>{emergency.title}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.text, marginTop: 4 }}>{emergency.value}</div>
            </div>
            <div style={{ fontSize: 15, color: T.sub, lineHeight: 1.6, marginBottom: 16 }}>{emergency.msg}</div>
            {emergency.actions.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: i < emergency.actions.length - 1 ? "1px solid " + T.div : "none" }}>
                <span style={{ color: "#DC2626", fontWeight: 800 }}>{i + 1}.</span>
                <span style={{ fontSize: 14, color: T.text, lineHeight: 1.5 }}>{a}</span>
              </div>
            ))}
            <a href="tel:911" style={{ display: "block", width: "100%", padding: 16, marginTop: 16, borderRadius: 14, background: "#DC2626", color: "#fff", fontSize: 18, fontWeight: 800, textAlign: "center", textDecoration: "none" }}>📞 Llamar al 911</a>
            <button onClick={() => setEmergency(null)} style={{ width: "100%", padding: 14, marginTop: 8, borderRadius: 14, border: "1px solid " + T.border, background: "#fff", fontSize: 15, fontWeight: 600, color: T.sub, cursor: "pointer" }}>Cerrar alerta</button>
          </div>
        </div>
      )}
    </div>
  );
}
