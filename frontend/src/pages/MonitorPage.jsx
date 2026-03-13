import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, BigButton, StatusBadge, MiniChart, LoadingSpinner, SectionTitle, COLORS, STATUS, classifyBP, classifyGlucose, formatShortDate } from "../components/UI";

function classifyBMI(bmi) {
  if (bmi < 18.5) return { label: "Bajo peso", color: COLORS.yellow, bg: COLORS.yellowBg };
  if (bmi < 25) return { label: "Normal", color: COLORS.green, bg: COLORS.greenBg };
  if (bmi < 30) return { label: "Sobrepeso", color: COLORS.yellow, bg: COLORS.yellowBg };
  return { label: "Obesidad", color: COLORS.red, bg: COLORS.redBg };
}

export default function MonitorPage() {
  const { patient } = useAuth();
  const [tab, setTab] = useState("bp");
  const [bpHistory, setBpHistory] = useState([]);
  const [glucHistory, setGlucHistory] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // BP form
  const [showBPForm, setShowBPForm] = useState(false);
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [bpResult, setBpResult] = useState(null);
  const [saving, setSaving] = useState(false);

  // Glucose form
  const [showGlucForm, setShowGlucForm] = useState(false);
  const [glucVal, setGlucVal] = useState("");
  const [glucType, setGlucType] = useState("fasting");
  const [glucResult, setGlucResult] = useState(null);

  // Weight form
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightVal, setWeightVal] = useState("");
  const [weightSaved, setWeightSaved] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bp, gluc, weight] = await Promise.all([
        api.getBPHistory(30),
        api.getGlucoseHistory(30),
        api.getWeightHistory(),
      ]);
      setBpHistory(bp.data.reverse());
      setGlucHistory(gluc.data.reverse());
      setWeightHistory(weight.data.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveBP = async () => {
    const s = parseInt(bpSys), d = parseInt(bpDia);
    if (!s || !d) return;
    setSaving(true);
    try {
      const res = await api.recordBP(s, d);
      setBpResult(res.data.status);
      await loadData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleSaveGlucose = async () => {
    const v = parseInt(glucVal);
    if (!v) return;
    setSaving(true);
    try {
      const res = await api.recordGlucose(v, glucType);
      setGlucResult(res.data.status);
      await loadData();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleSaveWeight = async () => {
    const v = parseFloat(weightVal);
    if (!v || v < 20 || v > 400) return;
    setSaving(true);
    try {
      await api.recordWeight(v);
      setWeightSaved(true);
      await loadData();
      setTimeout(() => { setWeightSaved(false); setShowWeightForm(false); setWeightVal(""); }, 1500);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Cargando datos..." />;

  const lastBP = bpHistory.length > 0 ? bpHistory[bpHistory.length - 1] : null;
  const lastGluc = glucHistory.length > 0 ? glucHistory[glucHistory.length - 1] : null;
  const lastWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null;

  const bpChartData = bpHistory.map(r => ({ date: formatShortDate(r.measuredAt), sys: r.systolic, dia: r.diastolic }));
  const glucChartData = glucHistory.map(r => ({ date: formatShortDate(r.measuredAt), val: r.value }));
  const weightChartData = weightHistory.map(r => ({ date: formatShortDate(r.measuredAt), val: r.value }));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "bp", label: "Presión", icon: "❤️" },
          { key: "glucose", label: "Glucosa", icon: "🩸" },
          { key: "weight", label: "Peso", icon: "⚖️" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "12px 8px", borderRadius: 12, border: "none",
            background: tab === t.key ? COLORS.primary : COLORS.divider,
            color: tab === t.key ? "#fff" : COLORS.textSec,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            <span style={{ fontSize: 18, display: "block", marginBottom: 2 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── BP Tab ─────────────────────────────────────── */}
      {tab === "bp" && (
        <div>
          {lastBP && (
            <Card style={{ marginBottom: 16, background: "linear-gradient(135deg, " + COLORS.primaryLight + ", #fff)" }}>
              <div style={{ fontSize: 13, color: COLORS.textSec, fontWeight: 600, marginBottom: 4 }}>Última medición</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: COLORS.text }}>{lastBP.systolic}/{lastBP.diastolic}</span>
                <span style={{ fontSize: 14, color: COLORS.textSec }}>mmHg</span>
              </div>
              <StatusBadge status={lastBP.status} large />
            </Card>
          )}
          {bpChartData.length >= 2 && (
            <>
              <SectionTitle>Tendencia sistólica</SectionTitle>
              <Card style={{ marginBottom: 16 }}>
                <MiniChart data={bpChartData} dataKey="sys" color={COLORS.primary} height={90} goal={140} />
              </Card>
            </>
          )}
          {!showBPForm ? (
            <BigButton onClick={() => setShowBPForm(true)} icon="📏">Registrar nueva medición</BigButton>
          ) : (
            <Card style={{ border: "2px solid " + COLORS.primary }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Nueva medición</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSec, display: "block", marginBottom: 6 }}>Sistólica</label>
                  <input type="number" value={bpSys} onChange={e => setBpSys(e.target.value)} placeholder="130"
                    style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, fontSize: 22, fontWeight: 700, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 14, fontSize: 24, fontWeight: 700, color: COLORS.textSec }}>/</div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSec, display: "block", marginBottom: 6 }}>Diastólica</label>
                  <input type="number" value={bpDia} onChange={e => setBpDia(e.target.value)} placeholder="85"
                    style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, fontSize: 22, fontWeight: 700, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              {bpResult && (
                <div style={{ padding: 14, borderRadius: 12, marginBottom: 16, background: STATUS[bpResult].bg, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: STATUS[bpResult].color }}>
                    {STATUS[bpResult].icon} {bpSys}/{bpDia} mmHg — {STATUS[bpResult].label}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowBPForm(false); setBpResult(null); setBpSys(""); setBpDia(""); }}
                  style={{ flex: 1, padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", color: COLORS.textSec }}>
                  Cancelar
                </button>
                <BigButton onClick={handleSaveBP} disabled={saving} style={{ flex: 2 }} icon="✓">
                  {saving ? "Guardando..." : "Guardar"}
                </BigButton>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── Glucose Tab ────────────────────────────────── */}
      {tab === "glucose" && (
        <div>
          {lastGluc && (
            <Card style={{ marginBottom: 16, background: "linear-gradient(135deg, #FEF3C7, #fff)" }}>
              <div style={{ fontSize: 13, color: COLORS.textSec, fontWeight: 600, marginBottom: 4 }}>Última glucosa</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: COLORS.text }}>{lastGluc.value}</span>
                <span style={{ fontSize: 14, color: COLORS.textSec }}>mg/dL ({lastGluc.type === "fasting" ? "ayunas" : "postprandial"})</span>
              </div>
              <StatusBadge status={lastGluc.status} large />
            </Card>
          )}
          {glucChartData.length >= 2 && (
            <>
              <SectionTitle>Tendencia glucosa</SectionTitle>
              <Card style={{ marginBottom: 16 }}>
                <MiniChart data={glucChartData} dataKey="val" color={COLORS.accent} height={90} goal={130} />
              </Card>
            </>
          )}
          {!showGlucForm ? (
            <BigButton onClick={() => setShowGlucForm(true)} icon="🩸" color={COLORS.accent}>Registrar glucosa</BigButton>
          ) : (
            <Card style={{ border: "2px solid " + COLORS.accent }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Nueva glucosa</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["fasting", "postprandial"].map(t => (
                  <button key={t} onClick={() => setGlucType(t)} style={{
                    flex: 1, padding: 10, borderRadius: 10,
                    border: glucType === t ? "2px solid " + COLORS.accent : "2px solid " + COLORS.border,
                    background: glucType === t ? "#FFF7ED" : "#fff",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    color: glucType === t ? COLORS.accent : COLORS.textSec,
                  }}>
                    {t === "fasting" ? "Ayunas" : "Postprandial"}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="number" value={glucVal} onChange={e => setGlucVal(e.target.value)} placeholder="Ej: 120"
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, fontSize: 22, fontWeight: 700, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
              </div>
              {glucResult && (
                <div style={{ padding: 14, borderRadius: 12, marginBottom: 16, background: STATUS[glucResult].bg, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: STATUS[glucResult].color }}>
                    {glucVal} mg/dL — {STATUS[glucResult].label}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowGlucForm(false); setGlucResult(null); setGlucVal(""); }}
                  style={{ flex: 1, padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", color: COLORS.textSec }}>
                  Cancelar
                </button>
                <BigButton onClick={handleSaveGlucose} disabled={saving} style={{ flex: 2 }} icon="✓" color={COLORS.accent}>
                  {saving ? "Guardando..." : "Guardar"}
                </BigButton>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── Weight Tab ─────────────────────────────────── */}
      {tab === "weight" && (
        <div>
          {lastWeight && (
            <Card style={{ marginBottom: 16, background: "linear-gradient(135deg, #EDE9FE, #fff)" }}>
              <div style={{ fontSize: 13, color: COLORS.textSec, fontWeight: 600, marginBottom: 4 }}>Último registro</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: COLORS.text }}>{lastWeight.value}</span>
                <span style={{ fontSize: 14, color: COLORS.textSec }}>kg</span>
              </div>
              {lastWeight.bmi && (() => {
                const bmiInfo = classifyBMI(lastWeight.bmi);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 14, fontWeight: 700,
                      background: bmiInfo.bg, color: bmiInfo.color,
                    }}>
                      IMC: {lastWeight.bmi}
                    </span>
                    <span style={{ fontSize: 13, color: bmiInfo.color, fontWeight: 600 }}>{bmiInfo.label}</span>
                  </div>
                );
              })()}
              {!lastWeight.bmi && patient?.height && (
                <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 6 }}>
                  IMC: {(lastWeight.value / Math.pow(patient.height / 100, 2)).toFixed(1)}
                </div>
              )}
              <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 6 }}>
                {new Date(lastWeight.measuredAt).toLocaleDateString("es-PA", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              {weightHistory.length >= 2 && (() => {
                const prev = weightHistory[weightHistory.length - 2];
                const diff = (lastWeight.value - prev.value).toFixed(1);
                const sign = diff > 0 ? "+" : "";
                return (
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, color: diff > 0 ? COLORS.yellow : diff < 0 ? COLORS.green : COLORS.textSec }}>
                    {sign}{diff} kg desde el registro anterior
                  </div>
                );
              })()}
            </Card>
          )}

          {weightChartData.length >= 2 && (
            <>
              <SectionTitle>Tendencia de peso</SectionTitle>
              <Card style={{ marginBottom: 16 }}>
                <MiniChart data={weightChartData} dataKey="val" color="#7C3AED" height={90} />
              </Card>
            </>
          )}

          {!showWeightForm ? (
            <BigButton onClick={() => setShowWeightForm(true)} icon="⚖️" color="#7C3AED">Registrar peso</BigButton>
          ) : (
            <Card style={{ border: "2px solid #7C3AED" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Nuevo registro de peso</div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSec, display: "block", marginBottom: 6 }}>Peso en kilogramos</label>
                <input type="number" value={weightVal} onChange={e => setWeightVal(e.target.value)}
                  placeholder={lastWeight ? String(lastWeight.value) : "70"}
                  step="0.1" min="20" max="400"
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, fontSize: 28, fontWeight: 700, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
                <div style={{ textAlign: "center", fontSize: 12, color: COLORS.textSec, marginTop: 6 }}>
                  Use su báscula en la mañana, antes de desayunar, con ropa ligera
                </div>
              </div>
              {weightSaved && (
                <div style={{ padding: 14, borderRadius: 12, marginBottom: 16, background: COLORS.greenBg, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.green }}>✓ {weightVal} kg guardado</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowWeightForm(false); setWeightVal(""); setWeightSaved(false); }}
                  style={{ flex: 1, padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", color: COLORS.textSec }}>
                  Cancelar
                </button>
                <BigButton onClick={handleSaveWeight} disabled={saving} style={{ flex: 2 }} icon="✓" color="#7C3AED">
                  {saving ? "Guardando..." : "Guardar"}
                </BigButton>
              </div>
            </Card>
          )}

          {/* Weight history list */}
          {weightHistory.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <SectionTitle>Historial de peso</SectionTitle>
              {weightHistory.slice().reverse().slice(0, 10).map((w, i) => (
                <div key={w._id || i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 0", borderBottom: "1px solid " + COLORS.divider,
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{w.value} kg</div>
                    <div style={{ fontSize: 12, color: COLORS.textSec }}>
                      {new Date(w.measuredAt).toLocaleDateString("es-PA", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  {w.bmi && (
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: classifyBMI(w.bmi).bg, color: classifyBMI(w.bmi).color,
                    }}>IMC {w.bmi}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}