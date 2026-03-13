import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, StatusBadge, BigButton, LoadingSpinner, ErrorMsg, EmptyState, COLORS, STATUS, formatDate } from "../components/UI";
import ICD10Search from "../components/ICD10Search";

// ─── Expandable screening card (larger for elderly) ─────────
function ScreeningCard({ s, groupColor }) {
  const [expanded, setExpanded] = useState(false);
  const priorityConfig = {
    alta: { color: COLORS.red, bg: COLORS.redBg, label: "Prioritario" },
    media: { color: COLORS.yellow, bg: COLORS.yellowBg, label: "Recomendado" },
    baja: { color: COLORS.textSec, bg: COLORS.divider, label: "Sugerido" },
  };
  const pConf = priorityConfig[s.priority] || priorityConfig.media;

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        padding: "14px 16px",
        borderLeft: "5px solid " + (STATUS[s.status]?.color || COLORS.border),
        cursor: "pointer",
        transition: "background 0.2s",
        background: expanded ? (groupColor || "#0D7377") + "18" : (groupColor || "#0D7377") + "08",
        borderBottom: "1px solid " + COLORS.divider,
      }}
    >
      {/* Collapsed row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>
              {s.name}
            </span>
            {s.priority && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: pConf.bg, color: pConf.color }}>
                {pConf.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, color: COLORS.textSec, marginTop: 4 }}>
            {s.intervalMonths === 0 ? "Tamizaje único" : s.intervalMonths >= 12 ? "Cada " + (s.intervalMonths / 12) + " año(s)" : "Cada " + s.intervalMonths + " meses"}
            {s.lastDone ? " · Último: " + formatDate(s.lastDone) : ""}
            {!s.lastDone && <span style={{ color: COLORS.red, fontWeight: 600 }}> · Nunca realizado</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <StatusBadge status={s.status} />
          <span style={{
            fontSize: 16, color: COLORS.textSec,
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}>▼</span>
        </div>
      </div>

      {/* Expanded details */}
      <div style={{
        maxHeight: expanded ? 400 : 0,
        overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <div style={{ paddingTop: 12, marginTop: 12, borderTop: "1px dashed " + COLORS.border }}>

          <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8, lineHeight: 1.6 }}>
            <strong>Frecuencia:</strong> {s.intervalMonths === 0 ? "Una sola vez en la vida" : s.intervalMonths >= 12 ? "Cada " + (s.intervalMonths / 12) + " año(s)" : "Cada " + s.intervalMonths + " meses"}
          </div>

          <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 8, lineHeight: 1.6 }}>
            <strong>Último realizado:</strong> {s.lastDone ? formatDate(s.lastDone) : "Nunca — pendiente de primera vez"}
          </div>

          {s.nextDue && (
            <div style={{ fontSize: 14, color: s.status === "red" ? COLORS.red : COLORS.textSec, marginBottom: 8, lineHeight: 1.6 }}>
              <strong>Próximo:</strong> {formatDate(s.nextDue)}
            </div>
          )}

          {s.reason && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 8,
              background: COLORS.primaryLight, fontSize: 14, color: COLORS.primary, lineHeight: 1.6,
            }}>
              💡 <strong>¿Por qué se recomienda?</strong><br />{s.reason}
            </div>
          )}

          {s.source && (
            <div style={{ fontSize: 13, color: COLORS.textSec, fontStyle: "italic", marginBottom: 8 }}>
              📚 Fuente: {s.source}
            </div>
          )}

          {s.result && (
            <div style={{ fontSize: 14, color: COLORS.green, fontWeight: 600, marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: COLORS.greenBg }}>
              📋 <strong>Resultado:</strong> {s.result}
            </div>
          )}

          {s.status === "red" && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: COLORS.redBg, fontSize: 15, fontWeight: 700, color: COLORS.red }}>
              ⏰ Vencido — Solicite cita para realizarlo
            </div>
          )}
          {s.status === "yellow" && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: COLORS.yellowBg, fontSize: 15, fontWeight: 700, color: COLORS.yellow }}>
              📅 Próximo a vencer — Programe su cita
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Collapsible group that wraps cards ─────────────────────
function ScreeningGroup({ group, items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const groupRed = items.filter(s => s.status === "red").length;
  const groupYellow = items.filter(s => s.status === "yellow").length;
  const groupGreen = items.filter(s => s.status === "green").length;

  return (
    <div style={{
      marginBottom: 16,
      borderRadius: 18,
      overflow: "hidden",
      border: "1px solid " + COLORS.border,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      {/* Group header */}
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        padding: "16px 18px",
        background: group.color, border: "none",
        cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: 26 }}>{group.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>
            {group.label}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 2 }}>{group.subtitle}</div>
        </div>
        {/* Status count badges */}
        <div style={{ display: "flex", gap: 4, marginRight: 6 }}>
          {groupRed > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: COLORS.redBg, color: COLORS.red }}>{groupRed}</span>}
          {groupYellow > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: COLORS.yellowBg, color: COLORS.yellow }}>{groupYellow}</span>}
          {groupGreen > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: COLORS.greenBg, color: COLORS.green }}>{groupGreen}</span>}
        </div>
        <span style={{
          fontSize: 16, color: COLORS.textSec,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.25s ease",
        }}>▼</span>
      </button>

      {/* Cards container — wrapped inside the group */}
      <div style={{
        maxHeight: open ? 5000 : 0,
        overflow: "hidden",
        transition: "max-height 0.4s ease",
        background: COLORS.card,
      }}>
        {items.map((s, i) => (
          <ScreeningCard key={s._id} s={s} groupColor={group.accent} />
        ))}
        {/* Bottom padding inside group */}
        <div style={{ height: 4 }} />
      </div>
    </div>
  );
}

// ─── Screening group config ─────────────────────────────────
const GROUPS = {
  preventivo: { label: "Tamizajes Preventivos", subtitle: "Detección temprana de cáncer y riesgo cardiovascular", icon: "🔬", color: "#EDE9FE", accent: "#8B5CF6", categories: ["oncologic"] },
  cronico: { label: "Control de Enfermedad Crónica", subtitle: "Seguimiento de HTA, DM2, síndrome metabólico", icon: "🩺", color: "#FEF3C7", accent: "#D97706", categories: ["cardiovascular", "metabolic"] },
  general: { label: "Tamizajes Generales", subtitle: "Exámenes de rutina y prevención general", icon: "📋", color: "#E8F5F5", accent: "#0D7377", categories: ["general"] },
};

// ═══════════════════════════════════════════════════════════
// DOCTOR MODE OVERLAY
// ═══════════════════════════════════════════════════════════
const DOCTOR_PIN = "2026";

function DoctorModeOverlay({ patient, screenings, onClose }) {
  const [tab, setTab] = useState("clinical"); // clinical | screenings
  const [newDx, setNewDx] = useState("");
  const [newDxCode, setNewDxCode] = useState("");
  const [newFh, setNewFh] = useState("");
  const [newFhRel, setNewFhRel] = useState("");
  const [localDiag, setLocalDiag] = useState(patient?.diagnoses?.filter(d => d.isActive) || []);
  const [localFhx, setLocalFhx] = useState(patient?.familyHistory || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resultForm, setResultForm] = useState(null);
  const [resultText, setResultText] = useState("");
  const [resultDate, setResultDate] = useState(new Date().toISOString().split("T")[0]);

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid " + COLORS.border, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  const addDx = () => {
    if (!newDx) return;
    setLocalDiag([...localDiag, { name: newDx, code: newDxCode, dateOfDiagnosis: new Date().toISOString(), isActive: true }]);
    setNewDx(""); setNewDxCode("");
  };
  const removeDx = (idx) => setLocalDiag(localDiag.filter((_, i) => i !== idx));
  const addFh = () => {
    if (!newFh || !newFhRel) return;
    setLocalFhx([...localFhx, { condition: newFh, relative: newFhRel }]);
    setNewFh(""); setNewFhRel("");
  };
  const removeFh = (idx) => setLocalFhx(localFhx.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/auth/me/patient", { diagnoses: localDiag, familyHistory: localFhx });
      setSaved(true);
      setTimeout(() => onClose(true), 1200);
    } catch (err) {
      try {
        localStorage.setItem("prevenapp_pending_doctor_edit", JSON.stringify({ diagnoses: localDiag, familyHistory: localFhx, timestamp: Date.now() }));
        setSaved(true);
        setTimeout(() => onClose(true), 1200);
      } catch (e) { alert("Error guardando: " + err.message); }
    } finally { setSaving(false); }
  };

  const handleCompleteScreening = async (screeningId) => {
    setSaving(true);
    try {
      await api.put("/screenings/" + screeningId + "/complete", {
        result: resultText || "",
        completedDate: resultDate || new Date().toISOString(),
      });
      setResultForm(null);
      setResultText("");
      setSaved(true);
      setTimeout(() => onClose(true), 1200);
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const pendingScreenings = (screenings || []).filter(s => s.status === "red" || s.status === "yellow");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={() => onClose(false)}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px",
        width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: COLORS.border, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg, #1E3A5F, #2B5B8A)" }}>
          <span style={{ fontSize: 28 }}>🩺</span>
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Modo Médico</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Validar datos y registrar tamizajes</div>
          </div>
        </div>

        {saved ? (
          <div style={{ padding: 20, borderRadius: 14, background: COLORS.greenBg, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.green }}>Datos guardados</div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[
                { key: "clinical", label: "APP / APF", icon: "🏥" },
                { key: "screenings", label: "Tamizajes (" + pendingScreenings.length + ")", icon: "🛡️" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 12, border: "none",
                  background: tab === t.key ? "#1E3A5F" : COLORS.divider,
                  color: tab === t.key ? "#fff" : COLORS.textSec,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>{t.icon} {t.label}</button>
              ))}
            </div>

            {/* ─── Clinical tab ─────────────────────────── */}
            {tab === "clinical" && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 12 }}>🏥 Antecedentes Personales Patológicos</div>
                  {localDiag.map((dx, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 8, borderRadius: 12, background: COLORS.redBg }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{dx.name}</div>
                        {dx.code && <div style={{ fontSize: 13, color: COLORS.textSec }}>{dx.code}</div>}
                      </div>
                      <button onClick={() => removeDx(i)} style={{ background: "none", border: "none", fontSize: 22, color: COLORS.red, cursor: "pointer", padding: "0 4px" }}>×</button>
                    </div>
                  ))}
                  <div style={{ marginTop: 10 }}>
                    <ICD10Search
                      placeholder="Buscar diagnóstico CIE-10..."
                      onSelect={(item) => {
                        setLocalDiag([...localDiag, { name: item.name, code: item.code, dateOfDiagnosis: new Date().toISOString(), isActive: true }]);
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input type="text" value={newDx} onChange={e => setNewDx(e.target.value)} placeholder="O escribir manualmente" style={{ ...inputStyle, flex: 2 }} />
                      <input type="text" value={newDxCode} onChange={e => setNewDxCode(e.target.value)} placeholder="CIE-10" style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={addDx} disabled={!newDx} style={{ padding: "0 16px", borderRadius: 12, border: "none", background: newDx ? "#1E3A5F" : COLORS.divider, color: newDx ? "#fff" : COLORS.textSec, fontSize: 22, fontWeight: 800, cursor: newDx ? "pointer" : "default" }}>+</button>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 12 }}>👨‍👩‍👧‍👦 Antecedentes Familiares</div>
                  {localFhx.map((fh, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 8, borderRadius: 12, background: "#EDE9FE" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{fh.condition}</div>
                        <div style={{ fontSize: 13, color: COLORS.textSec }}>{fh.relative}{fh.notes ? " — " + fh.notes : ""}</div>
                      </div>
                      <button onClick={() => removeFh(i)} style={{ background: "none", border: "none", fontSize: 22, color: "#6366F1", cursor: "pointer", padding: "0 4px" }}>×</button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <input type="text" value={newFh} onChange={e => setNewFh(e.target.value)} placeholder="Condición" style={{ ...inputStyle, flex: 2 }} />
                    <input type="text" value={newFhRel} onChange={e => setNewFhRel(e.target.value)} placeholder="Parentesco" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={addFh} disabled={!newFh || !newFhRel} style={{ padding: "0 16px", borderRadius: 12, border: "none", background: newFh && newFhRel ? "#6366F1" : COLORS.divider, color: newFh && newFhRel ? "#fff" : COLORS.textSec, fontSize: 22, fontWeight: 800, cursor: newFh && newFhRel ? "pointer" : "default" }}>+</button>
                  </div>
                </div>

                <BigButton onClick={handleSave} disabled={saving} icon="💾" color="#1E3A5F">
                  {saving ? "Guardando..." : "Guardar cambios"}
                </BigButton>
              </>
            )}

            {/* ─── Screenings tab ──────────────────────── */}
            {tab === "screenings" && (
              <div>
                {pendingScreenings.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: COLORS.textSec }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>Todos los tamizajes están al día</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pendingScreenings.map(s => (
                      <div key={s._id} style={{
                        padding: "14px 16px", borderRadius: 14, background: "#fff",
                        border: "2px solid " + (STATUS[s.status]?.color || COLORS.border),
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{s.name}</div>
                            <div style={{ fontSize: 13, color: COLORS.textSec }}>
                              {s.status === "red" ? "⏰ Vencido" : "📅 Próximo"}{s.lastDone ? " · Último: " + formatDate(s.lastDone) : " · Nunca realizado"}
                            </div>
                          </div>
                          <StatusBadge status={s.status} />
                        </div>

                        {resultForm === s._id ? (
                          <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 12, background: COLORS.primaryLight }}>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSec }}>FECHA</label>
                              <input type="date" value={resultDate} onChange={e => setResultDate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
                            </div>
                            <div style={{ marginBottom: 10 }}>
                              <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSec }}>RESULTADO</label>
                              <textarea value={resultText} onChange={e => setResultText(e.target.value)}
                                placeholder="Ej: Normal, sin hallazgos" rows={2}
                                style={{ ...inputStyle, marginTop: 4, resize: "none" }} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => handleCompleteScreening(s._id)} disabled={saving} style={{
                                flex: 1, padding: 12, borderRadius: 10, border: "none",
                                background: COLORS.green, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                              }}>✓ Guardar</button>
                              <button onClick={() => { setResultForm(null); setResultText(""); }} style={{
                                padding: "12px 16px", borderRadius: 10, border: "2px solid " + COLORS.border,
                                background: "#fff", fontSize: 15, fontWeight: 600, color: COLORS.textSec, cursor: "pointer",
                              }}>×</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setResultForm(s._id); setResultText(""); setResultDate(new Date().toISOString().split("T")[0]); }}
                            style={{
                              marginTop: 8, padding: "10px 14px", borderRadius: 10, border: "none",
                              background: COLORS.green, color: "#fff", fontSize: 15, fontWeight: 700,
                              cursor: "pointer", width: "100%",
                            }}>📝 Registrar resultado</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => onClose(false)} style={{ width: "100%", padding: 14, marginTop: 12, borderRadius: 14, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 16, fontWeight: 600, color: COLORS.textSec, cursor: "pointer" }}>
              Cerrar
            </button>
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
  const { user, patient } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [doctorMode, setDoctorMode] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await api.getScreenings(); setScreenings(res.data); setSummary(res.summary); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    try { await api.generateScreenings(); load(); }
    catch (err) { setError(err.message); }
  };

  const handlePinSubmit = () => {
    if (pin === DOCTOR_PIN) { setShowPinEntry(false); setDoctorMode(true); setPin(""); setPinError(false); }
    else { setPinError(true); setPin(""); }
  };

  const handleDoctorClose = (didSave) => {
    setDoctorMode(false);
    if (didSave) window.location.reload();
  };

  if (loading) return <LoadingSpinner text="Cargando tamizajes..." />;
  if (error) return <ErrorMsg message={error} onRetry={load} />;

  const total = screenings.length;
  const completePct = total > 0 && summary ? Math.round(((summary.green || 0) / total) * 100) : 0;

  const grouped = {};
  for (const key of Object.keys(GROUPS)) {
    grouped[key] = screenings
      .filter(s => GROUPS[key].categories.includes(s.category))
      .sort((a, b) => ({ red: 0, yellow: 1, green: 2 }[a.status] || 2) - ({ red: 0, yellow: 1, green: 2 }[b.status] || 2));
  }

  return (
    <div>
      {/* ─── Progress overview ───────────────────────────────── */}
      {summary && total > 0 && (
        <div className="fade-in" style={{ marginBottom: 20 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "16px 18px", borderRadius: 16,
            background: "linear-gradient(135deg, " + COLORS.primaryLight + ", #fff)",
            border: "1px solid " + COLORS.border,
          }}>
            <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: 60, height: 60, transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={COLORS.divider} strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none"
                  stroke={completePct === 100 ? COLORS.green : COLORS.primary}
                  strokeWidth="3" strokeDasharray={completePct + " " + (100 - completePct)}
                  strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: completePct === 100 ? COLORS.green : COLORS.primary }}>{completePct}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>{completePct === 100 ? "¡Todos al día!" : "Progreso de tamizajes"}</div>
              <div style={{ fontSize: 15, color: COLORS.textSec }}>{summary.green || 0} de {total} completados</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {[
              { label: "Vencidos", val: summary.red, color: COLORS.red, bg: COLORS.redBg },
              { label: "Próximos", val: summary.yellow, color: COLORS.yellow, bg: COLORS.yellowBg },
              { label: "Al día", val: summary.green, color: COLORS.green, bg: COLORS.greenBg },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 8px", borderRadius: 14, background: item.bg }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.val || 0}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Grouped collapsible screenings ───────────────────── */}
      {screenings.length === 0 ? (
        <EmptyState icon="🛡️" message="No hay tamizajes registrados aún" action={handleGenerate} actionLabel="Generar tamizajes según mi perfil" />
      ) : (
        Object.entries(GROUPS).map(([key, group]) => {
          const items = grouped[key];
          if (!items || items.length === 0) return null;
          const hasUrgent = items.some(s => s.status === "red");
          return <ScreeningGroup key={key} group={group} items={items} defaultOpen={hasUrgent} />;
        })
      )}

      {/* ─── Doctor mode trigger ─────────────────────────────── */}
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <button onClick={() => setShowPinEntry(true)} style={{
          background: "none", border: "none", fontSize: 14, color: COLORS.textSec,
          cursor: "pointer", padding: "10px 20px", opacity: 0.5, textDecoration: "underline",
        }}>
          🩺 Acceso médico
        </button>
      </div>

      {/* ─── PIN entry modal ─────────────────────────────────── */}
      {showPinEntry && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { setShowPinEntry(false); setPin(""); setPinError(false); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 24, padding: "32px 28px",
            width: "100%", maxWidth: 340, textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🩺</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>Modo Médico</div>
            <div style={{ fontSize: 15, color: COLORS.textSec, marginBottom: 24 }}>
              Ingrese el PIN para validar datos clínicos
            </div>
            <input
              type="password" inputMode="numeric" maxLength={4}
              value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setPinError(false); }}
              onKeyDown={e => e.key === "Enter" && handlePinSubmit()}
              placeholder="• • • •" autoFocus
              style={{
                width: "100%", padding: 18, borderRadius: 16, textAlign: "center",
                border: "3px solid " + (pinError ? COLORS.red : COLORS.border),
                fontSize: 32, fontWeight: 800, letterSpacing: 14,
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
            {pinError && <div style={{ fontSize: 15, color: COLORS.red, fontWeight: 600, marginTop: 10 }}>PIN incorrecto</div>}
            <BigButton onClick={handlePinSubmit} disabled={pin.length < 4} icon="→" color="#1E3A5F" style={{ marginTop: 20 }}>Ingresar</BigButton>
          </div>
        </div>
      )}

      {doctorMode && patient && <DoctorModeOverlay patient={patient} screenings={screenings} onClose={handleDoctorClose} />}
    </div>
  );
}
