import { useState, useEffect } from "react";
import api from "../services/api";
import { Card, BigButton, LoadingSpinner, SectionTitle, EmptyState, COLORS } from "../components/UI";

// ─── Notification helper ────────────────────────────────────
function scheduleNotifications(medications) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  // Cancel existing
  if (window._medTimers) window._medTimers.forEach(t => clearTimeout(t));
  window._medTimers = [];

  const now = new Date();
  medications.forEach(med => {
    (med.schedules || []).forEach(time => {
      const [h, m] = time.split(":").map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      if (target <= now) return; // already passed today
      const delay = target - now;
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          new Notification("💊 PrevenApp — Hora de su medicamento", {
            body: med.name + " " + (med.dose || "") + " — " + time,
            icon: "/icon-192.png",
            tag: "med-" + med._id + "-" + time,
          });
        }, delay);
        window._medTimers.push(timer);
      }
    });
  });
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// ─── Time picker component ──────────────────────────────────
function TimePicker({ schedules, onChange }) {
  const [adding, setAdding] = useState(false);
  const [newTime, setNewTime] = useState("08:00");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {schedules.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 10, background: COLORS.primaryLight, fontSize: 15, fontWeight: 700, color: COLORS.primary }}>
            🕐 {t}
            <button onClick={() => onChange(schedules.filter((_, j) => j !== i))} style={{ background: "none", border: "none", fontSize: 16, color: COLORS.red, cursor: "pointer", padding: "0 2px" }}>×</button>
          </div>
        ))}
        {schedules.length === 0 && !adding && (
          <div style={{ fontSize: 14, color: COLORS.textSec }}>Sin horarios configurados</div>
        )}
      </div>
      {!adding ? (
        <button onClick={() => setAdding(true)} style={{ padding: "8px 14px", borderRadius: 10, border: "2px dashed " + COLORS.border, background: "none", fontSize: 14, fontWeight: 600, color: COLORS.primary, cursor: "pointer" }}>+ Agregar horario</button>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "2px solid " + COLORS.border, fontSize: 16, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
          <button onClick={() => { onChange([...schedules, newTime].sort()); setAdding(false); setNewTime("08:00"); }} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: COLORS.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✓</button>
          <button onClick={() => setAdding(false)} style={{ padding: "8px 14px", borderRadius: 10, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 14, fontWeight: 600, color: COLORS.textSec, cursor: "pointer" }}>×</button>
        </div>
      )}
    </div>
  );
}

export default function MedsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", dose: "", frequency: "QD", schedules: ["08:00"], indication: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getMedLogToday();
      setData(res.data);
      // Schedule notifications for active meds
      if (res.data?.medications) {
        scheduleNotifications(res.data.medications.map(m => m.medication));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); requestNotificationPermission(); }, []);

  const toggleMed = async (medId, scheduledTime, currentlyTaken) => {
    try { await api.logMedDose(medId, scheduledTime, !currentlyTaken); load(); }
    catch (err) { alert(err.message); }
  };

  const handleAddMed = async () => {
    if (!newMed.name) return;
    setSaving(true);
    try {
      await api.addMedication(newMed);
      setShowAddForm(false);
      setNewMed({ name: "", dose: "", frequency: "QD", schedules: ["08:00"], indication: "" });
      load();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteMed = async (medId) => {
    if (!confirm("¿Eliminar este medicamento?")) return;
    try { await api.deleteMedication(medId); load(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <LoadingSpinner text="Cargando medicamentos..." />;
  if (!data || !data.medications || data.medications.length === 0) {
    return (
      <div>
        <EmptyState icon="💊" message="No hay medicamentos registrados" />
        <div style={{ padding: "0 20px" }}>
          <BigButton onClick={() => setShowAddForm(true)} icon="+" color={COLORS.primary}>Agregar medicamento</BigButton>
        </div>
        {showAddForm && <AddMedForm newMed={newMed} setNewMed={setNewMed} onSave={handleAddMed} onCancel={() => setShowAddForm(false)} saving={saving} />}
      </div>
    );
  }

  const { medications, adherenceToday, taken, total } = data;
  const pct = adherenceToday;
  const allDone = pct === 100;

  return (
    <div>
      {/* Adherence ring */}
      <div className="fade-in" style={{ marginBottom: 20, textAlign: "center", padding: "20px 16px", borderRadius: 16, background: "linear-gradient(135deg, " + (allDone ? COLORS.greenBg : COLORS.primaryLight) + ", #fff)", border: "1px solid " + COLORS.border }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textSec, marginBottom: 10 }}>Adherencia hoy</div>
        <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 10px" }}>
          <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: "rotate(-90deg)" }}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={COLORS.divider} strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={allDone ? COLORS.green : COLORS.primary} strokeWidth="3" strokeDasharray={pct + " " + (100 - pct)} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: allDone ? COLORS.green : COLORS.text }}>{pct}%</span>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: allDone ? COLORS.green : COLORS.textSec }}>
          {allDone ? "🎉 ¡Todas las dosis tomadas!" : taken + " de " + total + " medicamentos"}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SectionTitle>Medicamentos de hoy</SectionTitle>
        <button onClick={() => setShowAddForm(true)} style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: COLORS.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Agregar</button>
      </div>

      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {medications.map((item, i) => {
          const med = item.medication;
          const isTaken = item.taken;
          return (
            <Card key={med._id || i} onClick={() => toggleMed(med._id, med.schedules?.[0] || "08:00", isTaken)}
              style={{ padding: 16, borderLeft: "4px solid " + (isTaken ? COLORS.green : COLORS.yellow), opacity: isTaken ? 0.85 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: isTaken ? COLORS.greenBg : COLORS.yellowBg }}>
                  {isTaken ? "✓" : "💊"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, textDecoration: isTaken ? "line-through" : "none" }}>
                    {med.name} {med.dose}
                  </div>
                  <div style={{ fontSize: 14, color: COLORS.textSec }}>
                    🕐 {med.schedules?.join(" / ") || med.frequency}
                    {med.indication && " · " + med.indication}
                  </div>
                  {med.addedBy && (
                    <div style={{ fontSize: 11, color: COLORS.textSec, marginTop: 2 }}>
                      {med.addedBy === "doctor" ? "🩺" : "👤"} Agregado por {med.addedByName || med.addedBy}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: isTaken ? COLORS.greenBg : COLORS.yellowBg, color: isTaken ? COLORS.green : COLORS.yellow }}>
                    {isTaken ? "Tomado" : "Pendiente"}
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDeleteMed(med._id); }} style={{ background: "none", border: "none", fontSize: 11, color: COLORS.textSec, cursor: "pointer", textDecoration: "underline" }}>
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {allDone && (
        <div className="slide-up" style={{ marginTop: 20, padding: 16, borderRadius: 14, background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>💪</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.green }}>¡Excelente adherencia!</div>
          <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 4 }}>Su constancia marca la diferencia en el control de su salud.</div>
        </div>
      )}

      {/* Add medication modal */}
      {showAddForm && <AddMedForm newMed={newMed} setNewMed={setNewMed} onSave={handleAddMed} onCancel={() => setShowAddForm(false)} saving={saving} />}
    </div>
  );
}

function AddMedForm({ newMed, setNewMed, onSave, onCancel, saving }) {
  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid " + COLORS.border, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const freqOptions = [
    { val: "QD", label: "1 vez/día" }, { val: "BID", label: "2 veces/día" },
    { val: "TID", label: "3 veces/día" }, { val: "PRN", label: "Según necesidad" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: COLORS.border, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 16 }}>💊 Agregar Medicamento</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: COLORS.textSec, marginBottom: 4 }}>Nombre del medicamento</label>
          <input type="text" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="Ej: Losartán" style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: COLORS.textSec, marginBottom: 4 }}>Dosis</label>
            <input type="text" value={newMed.dose} onChange={e => setNewMed({ ...newMed, dose: e.target.value })} placeholder="Ej: 50mg" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: COLORS.textSec, marginBottom: 4 }}>Indicación</label>
            <input type="text" value={newMed.indication} onChange={e => setNewMed({ ...newMed, indication: e.target.value })} placeholder="Ej: HTA" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: COLORS.textSec, marginBottom: 6 }}>Frecuencia</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {freqOptions.map(f => (
              <button key={f.val} onClick={() => setNewMed({ ...newMed, frequency: f.val })} style={{
                padding: "10px 8px", borderRadius: 10, border: "none",
                background: newMed.frequency === f.val ? COLORS.primary : COLORS.divider,
                color: newMed.frequency === f.val ? "#fff" : COLORS.textSec,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: COLORS.textSec, marginBottom: 6 }}>Horarios de recordatorio</label>
          <TimePicker schedules={newMed.schedules} onChange={s => setNewMed({ ...newMed, schedules: s })} />
        </div>

        <BigButton onClick={onSave} disabled={saving || !newMed.name} icon="💊" color={COLORS.primary}>
          {saving ? "Guardando..." : "Agregar medicamento"}
        </BigButton>
        <button onClick={onCancel} style={{ width: "100%", padding: 14, marginTop: 8, borderRadius: 14, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 16, fontWeight: 600, color: COLORS.textSec, cursor: "pointer" }}>Cancelar</button>
      </div>
    </div>
  );
}
