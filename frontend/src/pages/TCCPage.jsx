import { useState, useEffect } from "react";
import api from "../services/api";
import { LoadingSpinner, COLORS } from "../components/UI";

const T = { text: "#1E293B", sub: "#64748B", muted: "#94A3B8", border: "#E2E8F0", div: "#F1F5F9", card: "#fff", r: 14 };
const card = { background: T.card, borderRadius: T.r, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)", overflow: "hidden" };
const iS = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid " + T.border, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

const PHASES = [
  { phase: 1, title: "Psicoeducación", weeks: "1-2", icon: "🧠", color: "#6366F1" },
  { phase: 2, title: "Reestructuración", weeks: "3-4", icon: "🔄", color: "#8B5CF6" },
  { phase: 3, title: "Modificación", weeks: "5-6", icon: "🎯", color: "#EC4899" },
  { phase: 4, title: "Consolidación", weeks: "7-8", icon: "🛡️", color: "#F59E0B" },
];

const MEALS = [{ k: "breakfast", l: "Desayuno", i: "🌅" }, { k: "lunch", l: "Almuerzo", i: "☀️" }, { k: "dinner", l: "Cena", i: "🌙" }, { k: "snack", l: "Merienda", i: "🍎" }];
const HL = { 1: "Hambre extrema", 2: "Muy hambriento", 3: "Hambriento", 4: "Algo de hambre", 5: "Neutral", 6: "Algo satisfecho", 7: "Satisfecho", 8: "Lleno", 9: "Muy lleno", 10: "Excesivamente lleno" };
function hColor(v) { if (v <= 2) return "#DC2626"; if (v <= 4) return "#D97706"; if (v <= 6) return "#16A34A"; if (v <= 8) return "#D97706"; return "#DC2626"; }

export default function TCCPage() {
  const [progress, setProgress] = useState(null); const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState(null);
  // ABC state
  const [abcRecords, setAbcRecords] = useState([]); const [showABC, setShowABC] = useState(false);
  const [abcA, setAbcA] = useState(""); const [abcB, setAbcB] = useState(""); const [abcC, setAbcC] = useState(""); const [abcE, setAbcE] = useState(""); const [abcAlt, setAbcAlt] = useState("");
  // Hunger state
  const [hungerEntries, setHungerEntries] = useState([]); const [showHunger, setShowHunger] = useState(false);
  const [hBefore, setHBefore] = useState(5); const [hAfter, setHAfter] = useState(5); const [hMeal, setHMeal] = useState("lunch"); const [hEmotional, setHEmotional] = useState(false);
  // Goals state
  const [goals, setGoals] = useState([]); const [showGoal, setShowGoal] = useState(false);
  const [gS, setGS] = useState(""); const [gM, setGM] = useState(""); const [gA, setGA] = useState(""); const [gR, setGR] = useState(""); const [gT, setGT] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, abc, h, g] = await Promise.all([api.getTCCProgress(), api.getABCRecords(10), api.getHungerEntries(14), api.getSMARTGoals()]);
      setProgress(p.data); setAbcRecords(abc.data || []); setHungerEntries(h.data || []); setGoals(g.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveABC = async () => {
    if (!abcA) return; setSaving(true);
    try { await api.createABCRecord({ activatingEvent: abcA, belief: abcB, consequence: abcC, emotion: abcE, alternativeThought: abcAlt }); setShowABC(false); setAbcA(""); setAbcB(""); setAbcC(""); setAbcE(""); setAbcAlt(""); load(); }
    catch (e) { alert(e.message); } finally { setSaving(false); }
  };
  const saveHunger = async () => {
    setSaving(true);
    try { await api.recordHungerScale({ hungerBefore: hBefore, hungerAfter: hAfter, mealType: hMeal, emotionalHunger: hEmotional }); setShowHunger(false); load(); }
    catch (e) { alert(e.message); } finally { setSaving(false); }
  };
  const saveGoal = async () => {
    if (!gS) return; setSaving(true);
    try { await api.createSMARTGoal({ specific: gS, measurable: gM, achievable: gA, relevant: gR, timeBound: gT }); setShowGoal(false); setGS(""); setGM(""); setGA(""); setGR(""); setGT(""); load(); }
    catch (e) { alert(e.message); } finally { setSaving(false); }
  };
  const checkinGoal = async (id, completed) => { try { await api.checkinGoal(id, completed); load(); } catch (e) { alert(e.message); } };

  if (loading) return <LoadingSpinner text="Cargando TCC..." />;
  const ph = progress?.currentPhase || 1, wk = progress?.currentWeek || 1;
  const phData = PHASES[ph - 1] || PHASES[0];
  const phasePct = ((wk - 1) / 8) * 100;
  const activeGoals = goals.filter(g => g.status === "active");

  return (
    <div>
      {/* Phase progress */}
      <div style={{ ...card, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>Fase {ph} — {phData.title}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>Semana {wk}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.muted }}>ABC registros</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#8B5CF6" }}>{progress?.totalABCRecords || 0}</div>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: T.div, overflow: "hidden" }}>
          <div style={{ height: "100%", width: phasePct + "%", background: "linear-gradient(90deg, " + phData.color + ", " + phData.color + "80)", borderRadius: 3, transition: "width 0.6s" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#EC489915", color: "#EC4899" }}>🎯 {progress?.totalGoalsCompleted || 0}/{progress?.totalGoalsSet || 0} metas</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#0A8A8F15", color: "#0A8A8F" }}>📊 {progress?.totalHungerScales || 0} escalas</span>
        </div>
      </div>

      {/* Tools grid */}
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 10 }}>Herramientas</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { key: "abc", icon: "📝", label: "Registro ABC", sub: "Pensamiento-emoción-conducta", color: "#8B5CF6", bg: "#F5F3FF" },
          { key: "hunger", icon: "🍽️", label: "Escala H/S", sub: "Hambre y saciedad", color: "#0D9488", bg: "#F0FDFA" },
          { key: "goals", icon: "🎯", label: "Metas SMART", sub: "Objetivos semanales", color: "#D97706", bg: "#FFFBEB" },
          { key: "achievements", icon: "🏆", label: "Mis Logros", sub: "Resumen de progreso", color: "#EC4899", bg: "#FDF2F8" },
        ].map(t => (
          <button key={t.key} onClick={() => setTool(tool === t.key ? null : t.key)} style={{
            ...card, padding: "16px 14px", border: tool === t.key ? "2px solid " + t.color : "2px solid transparent",
            cursor: "pointer", textAlign: "left", background: tool === t.key ? t.bg : T.card,
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.label}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* ─── ABC Tool ─────────────────────────── */}
      {tool === "abc" && (
        <div style={card}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Registros ABC</div>
            <button onClick={() => setShowABC(true)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Nuevo</button>
          </div>
          {abcRecords.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.muted }}>Sin registros aún. ¡Cree su primer registro ABC!</div>}
          {abcRecords.slice(0, 5).map((r, i) => (
            <div key={r._id || i} style={{ padding: "12px 16px", borderBottom: "1px solid " + T.div }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{new Date(r.createdAt).toLocaleDateString("es-PA", { day: "numeric", month: "short" })}</span>
                {r.emotion && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#EC489915", color: "#EC4899" }}>{r.emotion}</span>}
              </div>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
                <div><strong style={{ color: "#DC2626" }}>A:</strong> {r.activatingEvent}</div>
                <div><strong style={{ color: "#D97706" }}>B:</strong> {r.belief}</div>
                {r.alternativeThought && <div><strong style={{ color: "#16A34A" }}>💡:</strong> {r.alternativeThought}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Hunger Tool ──────────────────────── */}
      {tool === "hunger" && (
        <div style={card}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Escala Hambre/Saciedad</div>
            <button onClick={() => setShowHunger(true)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", background: "#0D9488", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Registrar</button>
          </div>
          {hungerEntries.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.muted }}>Sin registros</div>}
          {hungerEntries.slice(0, 5).map((e, i) => (
            <div key={e._id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid " + T.div }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: hColor(e.hungerBefore) }}>{e.hungerBefore}</div>
                <div style={{ fontSize: 10, color: T.muted }}>→</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: hColor(e.hungerAfter) }}>{e.hungerAfter}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{MEALS.find(m => m.k === e.mealType)?.l || e.mealType}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{new Date(e.createdAt).toLocaleDateString("es-PA", { day: "numeric", month: "short" })}{e.emotionalHunger ? " · ⚡ Emocional" : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Goals Tool ───────────────────────── */}
      {tool === "goals" && (
        <div style={card}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Metas SMART</div>
            <button onClick={() => setShowGoal(true)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", background: "#D97706", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Nueva</button>
          </div>
          {activeGoals.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.muted }}>Sin metas activas</div>}
          {activeGoals.map((g, i) => (
            <div key={g._id || i} style={{ padding: "12px 16px", borderBottom: "1px solid " + T.div }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{g.specific}</div>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>{g.measurable}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {(g.dailyCheckins || []).slice(-7).map((c, j) => (
                  <div key={j} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: c.completed ? "#DCFCE7" : "#FEE2E2", color: c.completed ? "#16A34A" : "#DC2626" }}>{c.completed ? "✓" : "×"}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => checkinGoal(g._id, true)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: "#16A34A", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Cumplida hoy</button>
                <button onClick={() => checkinGoal(g._id, false)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid " + T.border, background: "#fff", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✗ No hoy</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Achievements ─────────────────────── */}
      {tool === "achievements" && (
        <div style={card}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Mis Logros</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 16 }}>
            {[
              { label: "Semanas completadas", val: wk - 1, icon: "📅", color: "#6366F1" },
              { label: "Registros ABC", val: progress?.totalABCRecords || 0, icon: "📝", color: "#8B5CF6" },
              { label: "Metas cumplidas", val: progress?.totalGoalsCompleted || 0, icon: "🎯", color: "#EC4899" },
              { label: "Escalas H/S", val: progress?.totalHungerScales || 0, icon: "📊", color: "#0D9488" },
            ].map((a, i) => (
              <div key={i} style={{ padding: "14px", borderRadius: 12, background: a.color + "08", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{a.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: a.color }}>{a.val}</div>
                <div style={{ fontSize: 12, color: T.sub }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ABC Form Modal ───────────────────── */}
      {showABC && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowABC(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "16px 16px 28px", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 14 }}>📝 Nuevo Registro ABC</div>
            {[
              { label: "A — Situación activadora", val: abcA, set: setAbcA, ph: "¿Qué pasó?", color: "#DC2626" },
              { label: "B — Pensamiento", val: abcB, set: setAbcB, ph: "¿Qué pensé?", color: "#D97706" },
              { label: "C — Consecuencia", val: abcC, set: setAbcC, ph: "¿Qué hice?", color: "#8B5CF6" },
              { label: "Emoción", val: abcE, set: setAbcE, ph: "¿Cómo me sentí?", color: "#EC4899" },
              { label: "💡 Pensamiento alternativo", val: abcAlt, set: setAbcAlt, ph: "¿Qué podría hacer diferente?", color: "#16A34A" },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: f.color, display: "block", marginBottom: 4 }}>{f.label}</label>
                <textarea value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} rows={2} style={{ ...iS, resize: "none" }} />
              </div>
            ))}
            <button onClick={saveABC} disabled={saving || !abcA} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: abcA ? "#8B5CF6" : T.border, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{saving ? "Guardando..." : "Guardar registro"}</button>
          </div>
        </div>
      )}

      {/* ─── Hunger Form Modal ────────────────── */}
      {showHunger && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowHunger(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "16px 16px 28px", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 14 }}>🍽️ Escala Hambre/Saciedad</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Comida</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {MEALS.map(m => (<button key={m.k} onClick={() => setHMeal(m.k)} style={{ padding: 10, borderRadius: 10, border: "none", background: hMeal === m.k ? "#0D9488" : T.div, color: hMeal === m.k ? "#fff" : T.sub, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{m.i} {m.l}</button>))}
              </div>
            </div>
            {[{ label: "Hambre ANTES de comer", val: hBefore, set: setHBefore }, { label: "Saciedad DESPUÉS de comer", val: hAfter, set: setHAfter }].map((s, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6 }}>{s.label}</div>
                <div style={{ textAlign: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: hColor(s.val) }}>{s.val}</span>
                  <span style={{ fontSize: 14, color: T.sub, marginLeft: 6 }}>{HL[s.val]}</span>
                </div>
                <input type="range" min={1} max={10} value={s.val} onChange={e => s.set(parseInt(e.target.value))} style={{ width: "100%", accentColor: hColor(s.val) }} />
              </div>
            ))}
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: hEmotional ? "#FEF2F2" : T.div, border: hEmotional ? "2px solid #DC2626" : "2px solid transparent", cursor: "pointer", marginBottom: 14 }}>
              <input type="checkbox" checked={hEmotional} onChange={e => setHEmotional(e.target.checked)} />
              <span style={{ fontSize: 14, fontWeight: 600, color: hEmotional ? "#DC2626" : T.sub }}>⚡ Fue hambre emocional</span>
            </label>
            <button onClick={saveHunger} disabled={saving} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#0D9488", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{saving ? "Guardando..." : "Guardar escala"}</button>
          </div>
        </div>
      )}

      {/* ─── Goal Form Modal ──────────────────── */}
      {showGoal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowGoal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "16px 16px 28px", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 14 }}>🎯 Nueva Meta SMART</div>
            {[
              { label: "S — Específica", val: gS, set: setGS, ph: "¿Qué quiero lograr?" },
              { label: "M — Medible", val: gM, set: setGM, ph: "¿Cómo voy a medirlo?" },
              { label: "A — Alcanzable", val: gA, set: setGA, ph: "¿Es realista?" },
              { label: "R — Relevante", val: gR, set: setGR, ph: "¿Por qué es importante?" },
              { label: "T — Temporal", val: gT, set: setGT, ph: "¿Para cuándo?" },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, display: "block", marginBottom: 4 }}>{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={iS} />
              </div>
            ))}
            <button onClick={saveGoal} disabled={saving || !gS} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: gS ? "#D97706" : T.border, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{saving ? "Guardando..." : "Crear meta"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
