import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner, COLORS, STATUS, formatShortDate } from "../components/UI";

const T = { text: "#1E293B", sub: "#64748B", muted: "#94A3B8", border: "#E2E8F0", div: "#F1F5F9", card: "#fff", r: 14 };
const card = { background: T.card, borderRadius: T.r, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)", overflow: "hidden" };
const input = { width: "100%", padding: "14px 16px", borderRadius: 12, border: "2px solid " + T.border, fontSize: 18, fontWeight: 700, textAlign: "center", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btn = (bg) => ({ width: "100%", padding: 14, borderRadius: 12, border: "none", background: bg, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" });

function Spark({ data, color, h = 40, w = 110 }) {
  if (!data?.length || data.length < 2) return null;
  const mn = Math.min(...data) * 0.92, mx = Math.max(...data) * 1.08, rg = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rg) * h}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="0" cy={h - ((data[0] - mn) / rg) * h} r="3" fill={color} /></svg>;
}

function StatusDot({ status }) {
  const c = { red: "#DC2626", yellow: "#D97706", green: "#16A34A" }[status] || T.muted;
  return <div style={{ width: 8, height: 8, borderRadius: 4, background: c, flexShrink: 0 }} />;
}

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
  const bmi = patient?.weight && patient?.height ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1) : null;

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
              <div style={{ fontSize: 11, color: T.muted }}>mmHg</div>
              <div style={{ marginTop: 8 }}><Spark data={bpH.map(b => b.systolic)} color="#DC2626" /></div>
            </>
          ) : <div style={{ fontSize: 14, color: T.muted, padding: "10px 0" }}>Sin registros</div>}
        </div>
        <div style={{ flex: 1, ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 4 }}>Última glucosa</div>
          {lastGluc ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: lastGluc.status === "green" ? "#16A34A" : "#D97706" }}>{lastGluc.value}</div>
              <div style={{ fontSize: 11, color: T.muted }}>mg/dL · {lastGluc.type === "fasting" ? "ayunas" : "postprandial"}</div>
              <div style={{ marginTop: 8 }}><Spark data={glucH.map(g => g.value)} color="#8B5CF6" /></div>
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

      {/* ─── BP ──────────────────────────────────── */}
      {tab === "bp" && (
        <div style={card}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Presión arterial</div><div style={{ fontSize: 13, color: T.sub }}>{bpH.length} registros</div></div>
            <button onClick={() => setShowForm(!showForm)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: "#0A8A8F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Registrar</button>
          </div>
          {showForm && (
            <div style={{ padding: 16, background: "#F0FDFA", borderBottom: "1px solid " + T.div }}>
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
              <button onClick={saveBP} disabled={saving || !bpSys || !bpDia} style={btn(bpSys && bpDia ? "#0A8A8F" : T.border)}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          )}
          {bpH.slice().reverse().slice(0, 10).map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid " + T.div }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusDot status={r.status} />
                <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{r.systolic}/{r.diastolic}</span>
                <span style={{ fontSize: 13, color: T.muted }}>mmHg</span>
              </div>
              <span style={{ fontSize: 13, color: T.muted }}>{formatShortDate(r.measuredAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Glucose ─────────────────────────────── */}
      {tab === "glucose" && (
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
              <button onClick={saveGluc} disabled={saving || !glucVal} style={btn(glucVal ? "#8B5CF6" : T.border)}>{saving ? "Guardando..." : "Guardar"}</button>
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
      )}

      {/* ─── Weight ──────────────────────────────── */}
      {tab === "weight" && (
        <div>
          <div style={{ ...card, padding: "20px", textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: T.text }}>
              {weightH.length > 0 ? weightH[weightH.length - 1].value : patient?.weight || "—"}
              <span style={{ fontSize: 18, color: T.muted, fontWeight: 500 }}> kg</span>
            </div>
            {bmi && <div style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>IMC {bmi} · {bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidad"}</div>}
            {weightH.length >= 2 && <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}><Spark data={weightH.map(w => w.value)} color="#0A8A8F" w={200} h={50} /></div>}
          </div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={btn("linear-gradient(135deg, #064E52, #0FB5A2)")}>+ Registrar peso</button>
          ) : (
            <div style={{ ...card, padding: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, display: "block", marginBottom: 4 }}>PESO (kg)</label>
              <input type="number" step="0.1" value={weightVal} onChange={e => setWeightVal(e.target.value)} placeholder="77" style={{ ...input, marginBottom: 12 }} />
              <button onClick={saveWeight} disabled={saving || !weightVal} style={btn(weightVal ? "#0A8A8F" : T.border)}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          )}
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
              <div style={{ width: 60, height: 60, borderRadius: 30, margin: "0 auto 10px", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, animation: "pulse 1s infinite" }}>🚨</div>
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
