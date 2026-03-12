import { useState, useEffect } from "react";
import api from "../services/api";
import { Card, BigButton, LoadingSpinner, SectionTitle, COLORS } from "../components/UI";

const TCC_PHASES = [
  { phase: 1, title: "Psicoeducación", weeks: "1-2", icon: "🧠", color: "#6366F1",
    description: "Aprenda a identificar la relación entre sus pensamientos, emociones y conductas alimentarias.",
    tools: [
      { name: "Registro ABC", id: "abc", desc: "¿Qué pasó antes? ¿Qué hizo? ¿Cómo se sintió?", icon: "📝" },
      { name: "Lección del día", id: "lesson", desc: "¿Por qué comemos lo que comemos?", icon: "📖" },
    ]},
  { phase: 2, title: "Reestructuración", weeks: "3-4", icon: "🔄", color: "#8B5CF6",
    description: "Identifique y modifique los pensamientos automáticos que afectan su alimentación.",
    tools: [
      { name: "Distorsiones cognitivas", id: "distortions", desc: "¿Reconoce estos patrones?", icon: "💭" },
      { name: "Escala hambre/saciedad", id: "hunger", desc: "¿Hambre real o emocional?", icon: "📊" },
    ]},
  { phase: 3, title: "Modificación", weeks: "5-6", icon: "🎯", color: "#EC4899",
    description: "Establezca metas concretas y aprenda a resolver obstáculos.",
    tools: [
      { name: "Meta SMART semanal", id: "goals", desc: "Establezca su meta de esta semana", icon: "🎯" },
    ]},
  { phase: 4, title: "Consolidación", weeks: "7-8", icon: "🛡️", color: "#F59E0B",
    description: "Consolide sus logros y prepare su plan de mantenimiento.",
    tools: [
      { name: "Mis logros", id: "achievements", desc: "Revise todo lo que ha alcanzado", icon: "🏆" },
    ]},
];

const DISTORTIONS = [
  { name: "Todo o nada", example: "\"Ya comí una empanada, el día está perdido.\"", reframe: "\"Una empanada no arruina todo mi esfuerzo. Puedo retomar en la próxima comida.\"", icon: "⚫" },
  { name: "Catastrofización", example: "\"Nunca voy a poder controlar mi azúcar.\"", reframe: "\"El control es un proceso. Mis valores han mejorado esta semana.\"", icon: "🌪️" },
  { name: "Descalificación", example: "\"Solo bajé un kilo, no sirve de nada.\"", reframe: "\"Un kilo es un logro real. Cada pequeño cambio cuenta.\"", icon: "❌" },
  { name: "Lectura de mente", example: "\"Todos me van a juzgar si no como igual.\"", reframe: "\"No puedo saber lo que otros piensan. Mi salud es mi prioridad.\"", icon: "🔮" },
];

export default function TCCPage() {
  const [activePhase, setActivePhase] = useState(0);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // ABC form
  const [showABC, setShowABC] = useState(false);
  const [abcData, setAbcData] = useState({ antecedent: "", behavior: "", consequence: "" });
  const [savingABC, setSavingABC] = useState(false);

  // Distortions
  const [showDistortion, setShowDistortion] = useState(null);

  const loadProgress = async () => {
    try {
      const res = await api.getTCCProgress();
      setProgress(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProgress(); }, []);

  const handleSaveABC = async () => {
    if (!abcData.antecedent || !abcData.behavior || !abcData.consequence) return;
    setSavingABC(true);
    try {
      await api.createABCRecord(abcData);
      setShowABC(false);
      setAbcData({ antecedent: "", behavior: "", consequence: "" });
      loadProgress();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingABC(false);
    }
  };

  if (loading) return <LoadingSpinner text="Cargando programa TCC..." />;

  const currentWeek = progress?.currentWeek || 1;

  return (
    <div>
      {/* Phase selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {TCC_PHASES.map((p, i) => {
          const isActive = i === activePhase;
          const minWeek = parseInt(p.weeks.split("-")[0]);
          const isLocked = minWeek > currentWeek + 1;
          return (
            <button key={i} onClick={() => !isLocked && setActivePhase(i)} style={{
              flex: 1, padding: "10px 4px", borderRadius: 12, border: "none",
              background: isActive ? p.color : isLocked ? COLORS.divider : `${p.color}15`,
              color: isActive ? "#fff" : isLocked ? COLORS.border : p.color,
              fontSize: 11, fontWeight: 700, cursor: isLocked ? "default" : "pointer",
              opacity: isLocked ? 0.5 : 1,
            }}>
              <span style={{ fontSize: 20, display: "block" }}>{isLocked ? "🔒" : p.icon}</span>
              Fase {p.phase}
            </button>
          );
        })}
      </div>

      {/* Phase info */}
      {(() => {
        const phase = TCC_PHASES[activePhase];
        return (
          <>
            <Card style={{ marginBottom: 16, borderTop: `4px solid ${phase.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 32 }}>{phase.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{phase.title}</div>
                  <div style={{ fontSize: 13, color: phase.color, fontWeight: 600 }}>Semanas {phase.weeks}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: COLORS.textSec, lineHeight: 1.6, margin: 0 }}>{phase.description}</p>
            </Card>

            {/* Engagement stats */}
            {progress && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: "center", padding: 12, borderRadius: 12, background: `${phase.color}10` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: phase.color }}>{progress.totalABCRecords}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSec }}>Registros ABC</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 12, borderRadius: 12, background: `${phase.color}10` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: phase.color }}>{progress.totalGoalsCompleted}/{progress.totalGoalsSet}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSec }}>Metas</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 12, borderRadius: 12, background: `${phase.color}10` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: phase.color }}>S{currentWeek}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSec }}>Semana</div>
                </div>
              </div>
            )}

            <SectionTitle>Herramientas</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {phase.tools.map((tool, ti) => (
                <Card key={ti} onClick={() => {
                  if (tool.id === "abc") setShowABC(true);
                  if (tool.id === "distortions") setShowDistortion(0);
                }} style={{ padding: 16, borderLeft: `3px solid ${phase.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{tool.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{tool.name}</div>
                      <div style={{ fontSize: 13, color: COLORS.textSec }}>{tool.desc}</div>
                    </div>
                    <span style={{ color: phase.color, fontSize: 20 }}>›</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        );
      })()}

      {/* ABC Modal */}
      {showABC && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowABC(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: COLORS.border, margin: "0 auto 20px" }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>📝 Registro ABC</div>
            <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 20 }}>Registre la situación para entender sus patrones.</div>

            {[
              { key: "antecedent", label: "A — Antecedente", placeholder: "¿Qué situación o emoción precedió a la conducta?", color: "#6366F1" },
              { key: "behavior", label: "B — Conducta", placeholder: "¿Qué hizo?", color: "#EC4899" },
              { key: "consequence", label: "C — Consecuencia", placeholder: "¿Cómo se sintió después?", color: "#F59E0B" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: field.color, marginBottom: 6 }}>{field.label}</label>
                <textarea value={abcData[field.key]} onChange={e => setAbcData({ ...abcData, [field.key]: e.target.value })}
                  placeholder={field.placeholder} rows={3}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: `2px solid ${COLORS.border}`, fontSize: 15, resize: "none", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <BigButton onClick={handleSaveABC} disabled={savingABC} icon="✓" color="#6366F1">
              {savingABC ? "Guardando..." : "Guardar registro"}
            </BigButton>
          </div>
        </div>
      )}

      {/* Distortions Modal */}
      {showDistortion !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowDistortion(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 480,
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: COLORS.border, margin: "0 auto 20px" }} />
            {(() => {
              const d = DISTORTIONS[showDistortion];
              return (
                <>
                  <div style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>{d.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#8B5CF6", textAlign: "center", marginBottom: 16 }}>{d.name}</div>
                  <div style={{ padding: 16, borderRadius: 14, background: COLORS.redBg, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.red, marginBottom: 6 }}>PENSAMIENTO AUTOMÁTICO</div>
                    <div style={{ fontSize: 15, color: COLORS.text, fontStyle: "italic" }}>{d.example}</div>
                  </div>
                  <div style={{ textAlign: "center", fontSize: 24, margin: "8px 0" }}>↓</div>
                  <div style={{ padding: 16, borderRadius: 14, background: COLORS.greenBg, marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.green, marginBottom: 6 }}>PENSAMIENTO ALTERNATIVO</div>
                    <div style={{ fontSize: 15, color: COLORS.text }}>{d.reframe}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowDistortion(showDistortion > 0 ? showDistortion - 1 : DISTORTIONS.length - 1)}
                      style={{ flex: 1, padding: 14, borderRadius: 12, border: `2px solid ${COLORS.border}`, background: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                      ← Anterior
                    </button>
                    <button onClick={() => setShowDistortion((showDistortion + 1) % DISTORTIONS.length)}
                      style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                      Siguiente →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
