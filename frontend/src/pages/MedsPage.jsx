import { useState, useEffect } from "react";
import api from "../services/api";
import { LoadingSpinner, COLORS } from "../components/UI";

const T = { text: "#1E293B", sub: "#64748B", muted: "#94A3B8", border: "#E2E8F0", div: "#F1F5F9", card: "#fff", r: 14 };
const card = { background: T.card, borderRadius: T.r, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)", overflow: "hidden" };
const iS = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid " + T.border, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

function scheduleNotifications(meds) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (window._mt) window._mt.forEach(t => clearTimeout(t)); window._mt = [];
  const now = new Date();
  meds.forEach(m => (m.schedules || []).forEach(time => {
    const [h, mi] = time.split(":").map(Number); const tgt = new Date(now); tgt.setHours(h, mi, 0, 0);
    const delay = tgt - now;
    if (delay > 0 && delay < 86400000) window._mt.push(setTimeout(() => { new Notification("💊 PrevenApp", { body: m.name + " " + (m.dose || "") + " — " + time, icon: "/icon-192.png" }); }, delay));
  }));
}

export default function MedsPage() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false); const [saving, setSaving] = useState(false);
  const [nM, setNM] = useState({ name: "", dose: "", frequency: "QD", schedules: ["08:00"], indication: "" });
  const [newTime, setNewTime] = useState("08:00"); const [addingTime, setAddingTime] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.getMedLogToday(); setData(r.data);
      if (r.data?.medications) scheduleNotifications(r.data.medications.map(m => m.medication));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); }, []);

  const toggle = async (medId, time, cur) => { try { await api.logMedDose(medId, time, !cur); load(); } catch (e) { alert(e.message); } };
  const addMed = async () => {
    if (!nM.name) return; setSaving(true);
    try { await api.addMedication(nM); setShowAdd(false); setNM({ name: "", dose: "", frequency: "QD", schedules: ["08:00"], indication: "" }); load(); }
    catch (e) { alert(e.message); } finally { setSaving(false); }
  };
  const delMed = async (id) => { if (!confirm("¿Eliminar?")) return; try { await api.deleteMedication(id); load(); } catch (e) { alert(e.message); } };

  if (loading) return <LoadingSpinner text="Cargando medicamentos..." />;

  const meds = data?.medications || []; const taken = meds.filter(m => m.taken).length;
  const pct = meds.length > 0 ? Math.round((taken / meds.length) * 100) : 100;

  return (
    <div>
      {/* Adherence */}
      <div style={{ ...card, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: 60, height: 60, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={T.div} strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={pct === 100 ? "#16A34A" : "#0A8A8F"} strokeWidth="2.5" strokeDasharray={pct + " " + (100 - pct)} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: pct === 100 ? "#16A34A" : T.text }}>{pct}%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.sub }}>Adherencia hoy</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{taken}/{meds.length}</div>
            {pct === 100 && <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 600 }}>🎉 ¡Todo tomado!</div>}
          </div>
        </div>
      </div>

      {/* Med list */}
      <div style={card}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid " + T.div, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Medicamentos</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", background: "#0A8A8F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Agregar</button>
        </div>
        {meds.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.muted }}>Sin medicamentos registrados</div>}
        {meds.map((item, i) => {
          const m = item.medication, done = item.taken;
          return (
            <div key={m._id || i} onClick={() => toggle(m._id, m.schedules?.[0] || "08:00", done)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderBottom: i < meds.length - 1 ? "1px solid " + T.div : "none",
              cursor: "pointer", background: done ? "#F0FDF460" : "transparent", transition: "background 0.15s",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: done ? "#DCFCE7" : "#FEF3C7" }}>{done ? "✓" : "💊"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>
                  {m.name} <span style={{ fontWeight: 400, color: T.sub }}>{m.dose}</span>
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>🕐 {m.schedules?.join(" / ") || m.frequency}{m.indication ? " · " + m.indication : ""}</div>
                {m.addedBy && <div style={{ fontSize: 11, color: T.muted }}>{m.addedBy === "doctor" ? "🩺" : "👤"} {m.addedByName || m.addedBy}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: done ? "#16A34A15" : "#D9770615", color: done ? "#16A34A" : "#D97706" }}>{done ? "Tomado" : "Pendiente"}</span>
                <button onClick={e => { e.stopPropagation(); delMed(m._id); }} style={{ background: "none", border: "none", fontSize: 11, color: T.muted, cursor: "pointer", textDecoration: "underline" }}>Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add form modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "16px 16px 28px", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 14 }}>💊 Agregar Medicamento</div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Nombre</label><input value={nM.name} onChange={e => setNM({ ...nM, name: e.target.value })} placeholder="Ej: Losartán" style={{ ...iS, marginTop: 4 }} /></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Dosis</label><input value={nM.dose} onChange={e => setNM({ ...nM, dose: e.target.value })} placeholder="50mg" style={{ ...iS, marginTop: 4 }} /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Indicación</label><input value={nM.indication} onChange={e => setNM({ ...nM, indication: e.target.value })} placeholder="HTA" style={{ ...iS, marginTop: 4 }} /></div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6, display: "block" }}>Frecuencia</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[["QD", "1×/día"], ["BID", "2×/día"], ["TID", "3×/día"], ["PRN", "S/necesidad"]].map(([v, l]) => (
                  <button key={v} onClick={() => setNM({ ...nM, frequency: v })} style={{ padding: 10, borderRadius: 10, border: "none", background: nM.frequency === v ? "#0A8A8F" : T.div, color: nM.frequency === v ? "#fff" : T.sub, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6, display: "block" }}>Horarios</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                {nM.schedules.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 10, background: "#F0FDFA", fontSize: 15, fontWeight: 700, color: "#0A8A8F" }}>
                    🕐 {t} <button onClick={() => setNM({ ...nM, schedules: nM.schedules.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
              {!addingTime ? (
                <button onClick={() => setAddingTime(true)} style={{ padding: "8px 14px", borderRadius: 10, border: "2px dashed " + T.border, background: "none", fontSize: 13, fontWeight: 600, color: "#0A8A8F", cursor: "pointer" }}>+ Horario</button>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "2px solid " + T.border, fontSize: 16, fontWeight: 700, outline: "none" }} />
                  <button onClick={() => { setNM({ ...nM, schedules: [...nM.schedules, newTime].sort() }); setAddingTime(false); }} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#0A8A8F", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✓</button>
                  <button onClick={() => setAddingTime(false)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid " + T.border, background: "#fff", color: T.sub, cursor: "pointer" }}>×</button>
                </div>
              )}
            </div>
            <button onClick={addMed} disabled={saving || !nM.name} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: nM.name ? "#0A8A8F" : T.border, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{saving ? "Guardando..." : "Agregar medicamento"}</button>
            <button onClick={() => setShowAdd(false)} style={{ width: "100%", padding: 12, marginTop: 8, borderRadius: 12, border: "1px solid " + T.border, background: "#fff", fontSize: 15, fontWeight: 600, color: T.sub, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
