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
      { name: "Escala hambre/saciedad", id: "hunger", desc: "¿Hambre real o emocional?", icon: "📊" },
    ]},
  { phase: 4, title: "Consolidación", weeks: "7-8", icon: "🛡️", color: "#F59E0B",
    description: "Consolide sus logros y prepare su plan de mantenimiento.",
    tools: [
      { name: "Mis logros", id: "achievements", desc: "Revise todo lo que ha alcanzado", icon: "🏆" },
      { name: "Meta SMART semanal", id: "goals", desc: "Mantenga sus metas activas", icon: "🎯" },
    ]},
];

const DISTORTIONS = [
  { name: "Todo o nada", example: "\"Ya comí una empanada, el día está perdido.\"", reframe: "\"Una empanada no arruina todo mi esfuerzo. Puedo retomar en la próxima comida.\"", icon: "⚫" },
  { name: "Catastrofización", example: "\"Nunca voy a poder controlar mi azúcar.\"", reframe: "\"El control es un proceso. Mis valores han mejorado esta semana.\"", icon: "🌪️" },
  { name: "Descalificación", example: "\"Solo bajé un kilo, no sirve de nada.\"", reframe: "\"Un kilo es un logro real. Cada pequeño cambio cuenta.\"", icon: "❌" },
  { name: "Lectura de mente", example: "\"Todos me van a juzgar si no como igual.\"", reframe: "\"No puedo saber lo que otros piensan. Mi salud es mi prioridad.\"", icon: "🔮" },
];

const MEAL_TYPES = [
  { key: "breakfast", label: "Desayuno", icon: "🌅" },
  { key: "lunch", label: "Almuerzo", icon: "☀️" },
  { key: "dinner", label: "Cena", icon: "🌙" },
  { key: "snack", label: "Merienda", icon: "🍎" },
];

const HUNGER_LABELS = {
  1: "Hambre extrema", 2: "Muy hambriento", 3: "Hambriento",
  4: "Algo de hambre", 5: "Neutral",
  6: "Algo satisfecho", 7: "Satisfecho", 8: "Lleno",
  9: "Muy lleno", 10: "Excesivamente lleno",
};

function HungerSlider({ value, onChange, label }) {
  const getColor = (v) => {
    if (v <= 2) return COLORS.red;
    if (v <= 4) return COLORS.yellow;
    if (v <= 6) return COLORS.green;
    if (v <= 8) return COLORS.yellow;
    return COLORS.red;
  };
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: getColor(value) }}>
          {value} — {HUNGER_LABELS[value]}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, height: 40, borderRadius: 8, border: "none",
            background: n === value ? getColor(n) : n <= value ? getColor(n) + "30" : COLORS.divider,
            color: n === value ? "#fff" : COLORS.textSec,
            fontSize: 13, fontWeight: n === value ? 800 : 600,
            cursor: "pointer", transition: "all 0.15s",
          }}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: COLORS.textSec }}>
        <span>Hambre extrema</span>
        <span>Excesivamente lleno</span>
      </div>
    </div>
  );
}

function BottomSheet({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
        width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: COLORS.border, margin: "0 auto 20px" }} />
        {children}
      </div>
    </div>
  );
}

export default function TCCPage() {
  const [activePhase, setActivePhase] = useState(0);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // ABC
  const [showABC, setShowABC] = useState(false);
  const [abcData, setAbcData] = useState({ antecedent: "", behavior: "", consequence: "" });
  const [savingABC, setSavingABC] = useState(false);

  // Distortions
  const [showDistortion, setShowDistortion] = useState(null);

  // Hunger scale
  const [showHunger, setShowHunger] = useState(false);
  const [hungerData, setHungerData] = useState({ beforeMeal: 3, afterMeal: 7, mealType: "lunch", wasEmotionalHunger: false, notes: "" });
  const [hungerHistory, setHungerHistory] = useState([]);
  const [savingHunger, setSavingHunger] = useState(false);

  // SMART Goals
  const [showGoals, setShowGoals] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ description: "", specific: "", measurable: "", achievable: "", relevant: "", timeBound: "" });
  const [goals, setGoals] = useState([]);
  const [savingGoal, setSavingGoal] = useState(false);

  // Achievements
  const [showAchievements, setShowAchievements] = useState(false);
  const [summary, setSummary] = useState(null);
  const [abcHistory, setAbcHistory] = useState([]);

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

  // ─── ABC ──────────────────────────────────────────────────
  const handleSaveABC = async () => {
    if (!abcData.antecedent || !abcData.behavior || !abcData.consequence) return;
    setSavingABC(true);
    try {
      await api.createABCRecord(abcData);
      setShowABC(false);
      setAbcData({ antecedent: "", behavior: "", consequence: "" });
      loadProgress();
    } catch (err) { alert(err.message); }
    finally { setSavingABC(false); }
  };

  // ─── Hunger ───────────────────────────────────────────────
  const openHunger = async () => {
    setShowHunger(true);
    try {
      const res = await api.getHungerEntries(7);
      setHungerHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSaveHunger = async () => {
    setSavingHunger(true);
    try {
      await api.recordHungerScale(hungerData);
      const res = await api.getHungerEntries(7);
      setHungerHistory(res.data);
      setHungerData({ beforeMeal: 3, afterMeal: 7, mealType: "lunch", wasEmotionalHunger: false, notes: "" });
      loadProgress();
    } catch (err) { alert(err.message); }
    finally { setSavingHunger(false); }
  };

  // ─── Goals ────────────────────────────────────────────────
  const openGoals = async () => {
    setShowGoals(true);
    try {
      const res = await api.getSMARTGoals();
      setGoals(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSaveGoal = async () => {
    if (!goalForm.description) return;
    setSavingGoal(true);
    try {
      await api.createSMARTGoal(goalForm);
      const res = await api.getSMARTGoals();
      setGoals(res.data);
      setShowGoalForm(false);
      setGoalForm({ description: "", specific: "", measurable: "", achievable: "", relevant: "", timeBound: "" });
      loadProgress();
    } catch (err) { alert(err.message); }
    finally { setSavingGoal(false); }
  };

  const handleCheckin = async (goalId, completed) => {
    try {
      await api.checkinGoal(goalId, completed, "");
      const res = await api.getSMARTGoals();
      setGoals(res.data);
    } catch (err) { alert(err.message); }
  };

  const handleCompleteGoal = async (goalId, status) => {
    try {
      await api.completeGoal(goalId, status, "");
      const res = await api.getSMARTGoals();
      setGoals(res.data);
      loadProgress();
    } catch (err) { alert(err.message); }
  };

  // ─── Achievements ─────────────────────────────────────────
  const openAchievements = async () => {
    setShowAchievements(true);
    try {
      const [sumRes, abcRes] = await Promise.all([
        api.getTCCSummary(), api.getABCRecords(5),
      ]);
      setSummary(sumRes.data);
      setAbcHistory(abcRes.data);
    } catch (err) { console.error(err); }
  };

  // ─── Tool router ──────────────────────────────────────────
  const handleToolClick = (toolId) => {
    if (toolId === "abc") setShowABC(true);
    if (toolId === "distortions") setShowDistortion(0);
    if (toolId === "hunger") openHunger();
    if (toolId === "goals") openGoals();
    if (toolId === "achievements") openAchievements();
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
              background: isActive ? p.color : isLocked ? COLORS.divider : p.color + "15",
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

      {/* Phase info + tools */}
      {(() => {
        const phase = TCC_PHASES[activePhase];
        return (
          <>
            <Card style={{ marginBottom: 16, borderTop: "4px solid " + phase.color }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 32 }}>{phase.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{phase.title}</div>
                  <div style={{ fontSize: 13, color: phase.color, fontWeight: 600 }}>Semanas {phase.weeks}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: COLORS.textSec, lineHeight: 1.6, margin: 0 }}>{phase.description}</p>
            </Card>

            {progress && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[
                  { val: progress.totalABCRecords, label: "Registros ABC" },
                  { val: progress.totalGoalsCompleted + "/" + progress.totalGoalsSet, label: "Metas" },
                  { val: progress.totalHungerScales, label: "Escalas H/S" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: 12, borderRadius: 12, background: phase.color + "10" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: phase.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: COLORS.textSec }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <SectionTitle>Herramientas</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {phase.tools.map((tool, ti) => (
                <Card key={ti} onClick={() => handleToolClick(tool.id)} style={{ padding: 16, borderLeft: "3px solid " + phase.color }}>
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

      {/* ═══ ABC Modal ═══════════════════════════════════════ */}
      <BottomSheet show={showABC} onClose={() => setShowABC(false)}>
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
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, fontSize: 15, resize: "none", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <BigButton onClick={handleSaveABC} disabled={savingABC} icon="✓" color="#6366F1">
          {savingABC ? "Guardando..." : "Guardar registro"}
        </BigButton>
      </BottomSheet>

      {/* ═══ Distortions Modal ═══════════════════════════════ */}
      <BottomSheet show={showDistortion !== null} onClose={() => setShowDistortion(null)}>
        {showDistortion !== null && (() => {
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
                  style={{ flex: 1, padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
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
      </BottomSheet>

      {/* ═══ Hunger Scale Modal ══════════════════════════════ */}
      <BottomSheet show={showHunger} onClose={() => setShowHunger(false)}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>📊 Escala de Hambre / Saciedad</div>
        <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 20 }}>
          ¿Hambre real o emocional? Registre cómo se siente antes y después de comer.
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Comida</div>
          <div style={{ display: "flex", gap: 6 }}>
            {MEAL_TYPES.map(m => (
              <button key={m.key} onClick={() => setHungerData({ ...hungerData, mealType: m.key })} style={{
                flex: 1, padding: "10px 4px", borderRadius: 10, border: "none",
                background: hungerData.mealType === m.key ? "#8B5CF6" : COLORS.divider,
                color: hungerData.mealType === m.key ? "#fff" : COLORS.textSec,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                <span style={{ display: "block", fontSize: 18, marginBottom: 2 }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <HungerSlider label="Antes de comer" value={hungerData.beforeMeal} onChange={v => setHungerData({ ...hungerData, beforeMeal: v })} />
        <HungerSlider label="Después de comer" value={hungerData.afterMeal} onChange={v => setHungerData({ ...hungerData, afterMeal: v })} />

        <div onClick={() => setHungerData({ ...hungerData, wasEmotionalHunger: !hungerData.wasEmotionalHunger })} style={{
          display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12,
          background: hungerData.wasEmotionalHunger ? "#FEF3C7" : COLORS.divider,
          marginBottom: 16, cursor: "pointer",
          border: hungerData.wasEmotionalHunger ? "2px solid " + COLORS.yellow : "2px solid transparent",
        }}>
          <span style={{ fontSize: 24 }}>{hungerData.wasEmotionalHunger ? "💛" : "🤔"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>¿Fue hambre emocional?</div>
            <div style={{ fontSize: 12, color: COLORS.textSec }}>Comió por estrés, aburrimiento, tristeza u otra emoción</div>
          </div>
          <div style={{ width: 44, height: 26, borderRadius: 13, background: hungerData.wasEmotionalHunger ? COLORS.yellow : COLORS.border, position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", position: "absolute", top: 2, left: hungerData.wasEmotionalHunger ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
        </div>

        <textarea value={hungerData.notes} onChange={e => setHungerData({ ...hungerData, notes: e.target.value })}
          placeholder="Notas adicionales (opcional)..." rows={2}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "2px solid " + COLORS.border, fontSize: 14, resize: "none", fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 16 }} />

        <BigButton onClick={handleSaveHunger} disabled={savingHunger} icon="✓" color="#8B5CF6">
          {savingHunger ? "Guardando..." : "Guardar registro"}
        </BigButton>

        {hungerHistory.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Registros recientes</div>
            {hungerHistory.slice(0, 5).map((h, i) => {
              const mt = MEAL_TYPES.find(m => m.key === h.mealType);
              return (
                <div key={h._id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < Math.min(hungerHistory.length, 5) - 1 ? "1px solid " + COLORS.divider : "none" }}>
                  <span style={{ fontSize: 18 }}>{mt?.icon || "🍽️"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                      {mt?.label || h.mealType} — {new Date(h.createdAt).toLocaleDateString("es-PA", { day: "numeric", month: "short" })}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSec }}>
                      Antes: {h.beforeMeal} → Después: {h.afterMeal}{h.wasEmotionalHunger && " · 💛 Emocional"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </BottomSheet>

      {/* ═══ SMART Goals Modal ═══════════════════════════════ */}
      <BottomSheet show={showGoals} onClose={() => { setShowGoals(false); setShowGoalForm(false); }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>🎯 Metas SMART</div>
        <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 16 }}>Metas concretas, medibles y alcanzables para esta semana.</div>

        {!showGoalForm ? (
          <>
            <BigButton onClick={() => setShowGoalForm(true)} icon="+" color="#EC4899">Nueva meta semanal</BigButton>

            {goals.filter(g => g.status === "active").length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Metas activas</div>
                {goals.filter(g => g.status === "active").map(g => (
                  <Card key={g._id} style={{ marginBottom: 10, padding: 14, borderLeft: "3px solid #EC4899" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 6 }}>{g.description}</div>
                    {g.specific && <div style={{ fontSize: 12, color: COLORS.textSec, marginBottom: 2 }}>📌 {g.specific}</div>}
                    {g.measurable && <div style={{ fontSize: 12, color: COLORS.textSec, marginBottom: 2 }}>📏 {g.measurable}</div>}
                    <div style={{ display: "flex", gap: 4, margin: "10px 0 8px" }}>
                      {[0,1,2,3,4,5,6].map(day => {
                        const checkin = g.dailyCheckins?.find(c => {
                          const diff = Math.floor((new Date(c.date) - new Date(g.startDate)) / 86400000);
                          return diff === day;
                        });
                        return <div key={day} style={{ flex: 1, height: 8, borderRadius: 4, background: checkin ? (checkin.completed ? COLORS.green : COLORS.red) : COLORS.divider }} />;
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSec, marginBottom: 10 }}>
                      {g.dailyCheckins?.filter(c => c.completed).length || 0} de 7 días cumplidos
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleCheckin(g._id, true)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", background: COLORS.greenBg, color: COLORS.green, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Hoy sí cumplí</button>
                      <button onClick={() => handleCheckin(g._id, false)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", background: COLORS.redBg, color: COLORS.red, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✗ Hoy no</button>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => handleCompleteGoal(g._id, "completed")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid " + COLORS.green, background: "transparent", color: COLORS.green, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🏆 Meta cumplida</button>
                      <button onClick={() => handleCompleteGoal(g._id, "partial")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid " + COLORS.yellow, background: "transparent", color: COLORS.yellow, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Parcial</button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {goals.filter(g => g.status !== "active").length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textSec, marginBottom: 10 }}>Historial</div>
                {goals.filter(g => g.status !== "active").slice(0, 5).map(g => (
                  <div key={g._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid " + COLORS.divider }}>
                    <span style={{ fontSize: 18 }}>{g.status === "completed" ? "🏆" : g.status === "partial" ? "🔶" : "⬜"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{g.description}</div>
                      <div style={{ fontSize: 11, color: COLORS.textSec }}>Semana {g.weekNumber} · {g.status === "completed" ? "Cumplida" : g.status === "partial" ? "Parcial" : "No cumplida"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#EC4899", marginBottom: 16 }}>Nueva meta SMART</div>
            {[
              { key: "description", label: "Mi meta de esta semana", placeholder: "Ej: Caminar 20 min después del almuerzo lunes, miércoles y viernes", rows: 2 },
              { key: "specific", label: "S — Específica", placeholder: "¿Qué exactamente haré?", rows: 1 },
              { key: "measurable", label: "M — Medible", placeholder: "¿Cómo sabré que la cumplí?", rows: 1 },
              { key: "achievable", label: "A — Alcanzable", placeholder: "¿Por qué es realista para mí?", rows: 1 },
              { key: "relevant", label: "R — Relevante", placeholder: "¿Por qué importa para mi salud?", rows: 1 },
              { key: "timeBound", label: "T — Temporal", placeholder: "¿Cuándo y con qué frecuencia?", rows: 1 },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{field.label}</label>
                <textarea value={goalForm[field.key]} onChange={e => setGoalForm({ ...goalForm, [field.key]: e.target.value })}
                  placeholder={field.placeholder} rows={field.rows}
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid " + COLORS.border, fontSize: 14, resize: "none", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowGoalForm(false)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", color: COLORS.textSec }}>Cancelar</button>
              <BigButton onClick={handleSaveGoal} disabled={savingGoal} style={{ flex: 2 }} icon="🎯" color="#EC4899">
                {savingGoal ? "Guardando..." : "Crear meta"}
              </BigButton>
            </div>
          </>
        )}
      </BottomSheet>

      {/* ═══ Achievements Modal ══════════════════════════════ */}
      <BottomSheet show={showAchievements} onClose={() => setShowAchievements(false)}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>🏆 Mis Logros</div>
        <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 20 }}>Revise todo lo que ha alcanzado en su programa.</div>

        {summary ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Semana actual", value: "S" + (summary.progress?.currentWeek || 1), icon: "📅", bg: "#EEF2FF", color: "#6366F1" },
                { label: "Registros ABC", value: summary.progress?.totalABCRecords || 0, icon: "📝", bg: "#FDF2F8", color: "#EC4899" },
                { label: "Metas cumplidas", value: (summary.progress?.totalGoalsCompleted || 0) + "/" + (summary.progress?.totalGoalsSet || 0), icon: "🎯", bg: "#ECFDF5", color: COLORS.green },
                { label: "Escalas H/S", value: summary.progress?.totalHungerScales || 0, icon: "📊", bg: "#FEF3C7", color: COLORS.yellow },
              ].map((s, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 14, background: s.bg, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, borderRadius: 14, background: COLORS.primaryLight, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.primary, marginBottom: 10 }}>Esta semana</div>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { val: summary.thisWeek?.abcRecords || 0, label: "ABC" },
                  { val: summary.thisWeek?.hungerEntries || 0, label: "Hambre/Saciedad" },
                  { val: summary.thisWeek?.activeGoals || 0, label: "Metas activas" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.primary }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: COLORS.textSec }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {abcHistory.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Últimos registros ABC</div>
                {abcHistory.map((abc, i) => (
                  <div key={abc._id || i} style={{ padding: 12, borderRadius: 10, background: COLORS.divider, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: COLORS.textSec, marginBottom: 4 }}>
                      {new Date(abc.createdAt).toLocaleDateString("es-PA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · Semana {abc.week}
                    </div>
                    <div style={{ fontSize: 13, color: "#6366F1", marginBottom: 2 }}><strong>A:</strong> {abc.antecedent}</div>
                    <div style={{ fontSize: 13, color: "#EC4899", marginBottom: 2 }}><strong>B:</strong> {abc.behavior}</div>
                    <div style={{ fontSize: 13, color: "#F59E0B" }}><strong>C:</strong> {abc.consequence}</div>
                  </div>
                ))}
              </div>
            )}

            {(summary.progress?.totalABCRecords > 0 || summary.progress?.totalGoalsCompleted > 0) && (
              <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🌟</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.green }}>¡Excelente progreso!</div>
                <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 4 }}>Cada registro y cada meta cumplida lo acercan a una mejor salud.</div>
              </div>
            )}
          </>
        ) : (
          <LoadingSpinner text="Cargando logros..." />
        )}
      </BottomSheet>
    </div>
  );
}