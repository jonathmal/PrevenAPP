import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, StatusBadge, BigButton, LoadingSpinner, ErrorMsg, EmptyState, SectionTitle, COLORS, STATUS, formatDate } from "../components/UI";

// ─── Collapsible section component ──────────────────────────
function Collapsible({ title, icon, count, defaultOpen, children, color }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "14px 16px", borderRadius: open ? "14px 14px 0 0" : 14,
        background: color || COLORS.primaryLight, border: "none",
        cursor: "pointer", textAlign: "left",
        transition: "border-radius 0.2s",
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: COLORS.text }}>{title}</span>
        {count !== undefined && (
          <span style={{
            fontSize: 12, fontWeight: 700, color: COLORS.primary,
            background: "#fff", padding: "2px 10px", borderRadius: 20,
          }}>{count}</span>
        )}
        <span style={{
          fontSize: 14, color: COLORS.textSec,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.25s ease",
        }}>▼</span>
      </button>
      <div style={{
        maxHeight: open ? 2000 : 0,
        overflow: "hidden",
        transition: "max-height 0.35s ease",
        background: "#fff",
        borderRadius: "0 0 14px 14px",
        border: open ? "1px solid " + COLORS.border : "none",
        borderTop: "none",
      }}>
        <div style={{ padding: open ? "12px 16px 16px" : "0 16px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Screening group config ─────────────────────────────────
const GROUPS = {
  preventivo: {
    label: "Tamizajes Preventivos",
    subtitle: "Detección temprana de cáncer y riesgo cardiovascular",
    icon: "🔬",
    color: "#EDE9FE",
    categories: ["oncologic"],
  },
  cronico: {
    label: "Control de Enfermedad Crónica",
    subtitle: "Seguimiento de HTA, DM2, síndrome metabólico",
    icon: "🩺",
    color: "#FEF3C7",
    categories: ["cardiovascular", "metabolic"],
  },
  general: {
    label: "Tamizajes Generales",
    subtitle: "Exámenes de rutina y prevención general",
    icon: "📋",
    color: "#E8F5F5",
    categories: ["general"],
  },
};

export default function TamizajesPage() {
  const { user, patient } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getScreenings();
      setScreenings(res.data);
      setSummary(res.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    try {
      await api.generateScreenings();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner text="Cargando tamizajes..." />;
  if (error) return <ErrorMsg message={error} onRetry={load} />;

  const total = screenings.length;
  const completePct = total > 0 && summary
    ? Math.round(((summary.green || 0) / total) * 100)
    : 0;

  // Group screenings by category
  const grouped = {};
  for (const key of Object.keys(GROUPS)) {
    grouped[key] = screenings
      .filter(s => GROUPS[key].categories.includes(s.category))
      .sort((a, b) => {
        const order = { red: 0, yellow: 1, green: 2 };
        return (order[a.status] || 2) - (order[b.status] || 2);
      });
  }

  // Patient info
  const age = patient?.age;
  const sexLabel = patient?.sex === "M" ? "Masculino" : patient?.sex === "F" ? "Femenino" : "—";
  const bmi = patient?.bmi;
  const diagnoses = patient?.diagnoses?.filter(d => d.isActive) || [];
  const familyHx = patient?.familyHistory || [];

  return (
    <div>
      {/* ─── Patient identity card ───────────────────────────── */}
      <Card className="fade-in" style={{
        marginBottom: 16, padding: "18px 16px",
        background: "linear-gradient(135deg, " + COLORS.primaryLight + ", #fff)",
        borderTop: "4px solid " + COLORS.primary,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: COLORS.primary, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 22, color: "#fff", fontWeight: 800,
          }}>
            {user?.name?.charAt(0) || "P"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 17, fontWeight: 800, color: COLORS.text,
              fontFamily: "'Source Serif 4', Georgia, serif",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {user?.name || "Paciente"}
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSec }}>
              {age ? age + " años" : ""}{age ? " · " : ""}{sexLabel}
              {patient?.studyId ? " · ID: " + patient.studyId : ""}
            </div>
          </div>
        </div>
        {/* Anthropometrics row */}
        {(patient?.height || patient?.weight) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {patient?.height && (
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary, background: "#fff", padding: "3px 10px", borderRadius: 8 }}>
                📏 {patient.height} cm
              </span>
            )}
            {patient?.weight && (
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary, background: "#fff", padding: "3px 10px", borderRadius: 8 }}>
                ⚖️ {patient.weight} kg
              </span>
            )}
            {bmi && (
              <span style={{
                fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 8,
                background: bmi < 25 ? COLORS.greenBg : bmi < 30 ? COLORS.yellowBg : COLORS.redBg,
                color: bmi < 25 ? COLORS.green : bmi < 30 ? COLORS.yellow : COLORS.red,
              }}>
                IMC {bmi}
              </span>
            )}
            {patient?.waistCircumference && (
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary, background: "#fff", padding: "3px 10px", borderRadius: 8 }}>
                📐 CC: {patient.waistCircumference} cm
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ─── Antecedentes Personales Patológicos ─────────────── */}
      <Collapsible
        title="Antecedentes Personales Patológicos"
        icon="🏥"
        count={diagnoses.length}
        defaultOpen={false}
        color="#FEE2E2"
      >
        {diagnoses.length === 0 ? (
          <div style={{ fontSize: 13, color: COLORS.textSec, padding: "8px 0" }}>
            No se han registrado antecedentes patológicos.
          </div>
        ) : (
          <div>
            {diagnoses.map((dx, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0",
                borderBottom: i < diagnoses.length - 1 ? "1px solid " + COLORS.divider : "none",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                  background: dx.isActive ? COLORS.red : COLORS.textSec,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{dx.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSec }}>
                    {dx.code ? dx.code + " · " : ""}
                    {dx.dateOfDiagnosis
                      ? "Dx: " + new Date(dx.dateOfDiagnosis).toLocaleDateString("es-PA", { month: "short", year: "numeric" })
                      : "Fecha no registrada"
                    }
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                  background: dx.isActive ? COLORS.redBg : COLORS.divider,
                  color: dx.isActive ? COLORS.red : COLORS.textSec,
                }}>
                  {dx.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* ─── Antecedentes Familiares ─────────────────────────── */}
      <Collapsible
        title="Antecedentes Familiares"
        icon="👨‍👩‍👧‍👦"
        count={familyHx.length}
        defaultOpen={false}
        color="#EDE9FE"
      >
        {familyHx.length === 0 ? (
          <div style={{ fontSize: 13, color: COLORS.textSec, padding: "8px 0" }}>
            No se han registrado antecedentes familiares.
          </div>
        ) : (
          <div>
            {familyHx.map((fh, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0",
                borderBottom: i < familyHx.length - 1 ? "1px solid " + COLORS.divider : "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "#EDE9FE", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{fh.condition}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSec }}>
                    {fh.relative}{fh.notes ? " — " + fh.notes : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* ─── Overall progress ────────────────────────────────── */}
      {summary && total > 0 && (
        <div className="fade-in" style={{ marginBottom: 16, marginTop: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 16px", borderRadius: 14,
            background: "linear-gradient(135deg, " + COLORS.primaryLight + ", #fff)",
            border: "1px solid " + COLORS.border,
          }}>
            <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: 52, height: 52, transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={COLORS.divider} strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none"
                  stroke={completePct === 100 ? COLORS.green : COLORS.primary}
                  strokeWidth="3" strokeDasharray={completePct + " " + (100 - completePct)}
                  strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: completePct === 100 ? COLORS.green : COLORS.primary }}>
                  {completePct}%
                </span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>
                {completePct === 100 ? "¡Todos al día!" : "Progreso de tamizajes"}
              </div>
              <div style={{ fontSize: 13, color: COLORS.textSec }}>
                {summary.green || 0} de {total} completados
              </div>
            </div>
          </div>
          {/* Status pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {[
              { label: "Vencidos", val: summary.red, color: COLORS.red, bg: COLORS.redBg },
              { label: "Próximos", val: summary.yellow, color: COLORS.yellow, bg: COLORS.yellowBg },
              { label: "Al día", val: summary.green, color: COLORS.green, bg: COLORS.greenBg },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center", padding: "10px 6px", borderRadius: 12, background: item.bg,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.val || 0}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Grouped screenings ──────────────────────────────── */}
      {screenings.length === 0 ? (
        <EmptyState
          icon="🛡️"
          message="No hay tamizajes registrados aún"
          action={handleGenerate}
          actionLabel="Generar tamizajes según mi perfil"
        />
      ) : (
        Object.entries(GROUPS).map(([key, group]) => {
          const items = grouped[key];
          if (!items || items.length === 0) return null;
          const groupRed = items.filter(s => s.status === "red").length;
          const groupYellow = items.filter(s => s.status === "yellow").length;
          const groupGreen = items.filter(s => s.status === "green").length;

          return (
            <div key={key} style={{ marginBottom: 20 }}>
              {/* Group header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 10, padding: "0 2px",
              }}>
                <span style={{ fontSize: 22 }}>{group.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 800, color: COLORS.text,
                    fontFamily: "'Source Serif 4', Georgia, serif",
                  }}>{group.label}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSec }}>{group.subtitle}</div>
                </div>
                {/* Mini status summary */}
                <div style={{ display: "flex", gap: 4 }}>
                  {groupRed > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: COLORS.redBg, color: COLORS.red }}>
                      {groupRed}
                    </span>
                  )}
                  {groupYellow > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: COLORS.yellowBg, color: COLORS.yellow }}>
                      {groupYellow}
                    </span>
                  )}
                  {groupGreen > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: COLORS.greenBg, color: COLORS.green }}>
                      {groupGreen}
                    </span>
                  )}
                </div>
              </div>

              {/* Screening cards */}
              <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map(s => {
                  const priorityConfig = {
                    alta: { color: COLORS.red, bg: COLORS.redBg, label: "Prioritario" },
                    media: { color: COLORS.yellow, bg: COLORS.yellowBg, label: "Recomendado" },
                    baja: { color: COLORS.textSec, bg: COLORS.divider, label: "Sugerido" },
                  };
                  const pConf = priorityConfig[s.priority] || priorityConfig.media;

                  return (
                    <Card key={s._id} style={{
                      padding: 14,
                      borderLeft: "4px solid " + (STATUS[s.status]?.color || COLORS.border),
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>
                              {s.name}
                            </span>
                            {s.priority && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                background: pConf.bg, color: pConf.color,
                              }}>{pConf.label}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.textSec }}>
                            {s.intervalMonths === 0
                              ? "Único — una sola vez"
                              : s.intervalMonths >= 12
                                ? "Cada " + (s.intervalMonths / 12) + " año(s)"
                                : "Cada " + s.intervalMonths + " meses"
                            }
                          </div>
                          {s.lastDone ? (
                            <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 3 }}>
                              Último: {formatDate(s.lastDone)}
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: COLORS.red, marginTop: 3, fontWeight: 600 }}>
                              Nunca realizado
                            </div>
                          )}
                        </div>
                        <StatusBadge status={s.status} />
                      </div>

                      {/* Reason (why this screening was recommended) */}
                      {s.reason && (
                        <div style={{
                          marginTop: 8, padding: "6px 10px", borderRadius: 8,
                          background: COLORS.primaryLight, fontSize: 12, color: COLORS.primary,
                          lineHeight: 1.5,
                        }}>
                          💡 {s.reason}
                        </div>
                      )}

                      {/* Source guideline */}
                      {s.source && (
                        <div style={{ marginTop: 4, fontSize: 10, color: COLORS.textSec, fontStyle: "italic" }}>
                          Fuente: {s.source}
                        </div>
                      )}

                      {s.status === "red" && (
                        <div style={{
                          marginTop: 6, padding: "7px 10px", borderRadius: 8,
                          background: COLORS.redBg, fontSize: 12, fontWeight: 600, color: COLORS.red,
                        }}>
                          ⏰ Vencido — Solicite cita para realizarlo
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
