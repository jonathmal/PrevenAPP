import { useState, useEffect } from "react";
import api from "../services/api";
import { Card, BigButton, LoadingSpinner, SectionTitle, COLORS } from "../components/UI";

export default function MedsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getMedLogToday();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleMed = async (medId, scheduledTime, currentlyTaken) => {
    try {
      await api.logMedDose(medId, scheduledTime, !currentlyTaken);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner text="Cargando medicamentos..." />;
  if (!data) return null;

  const { medications, adherenceToday, taken, total } = data;
  const pct = adherenceToday;

  return (
    <div>
      <Card style={{ marginBottom: 20, textAlign: "center", background: `linear-gradient(135deg, ${pct === 100 ? COLORS.greenBg : COLORS.primaryLight}, #fff)` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSec, marginBottom: 6 }}>Adherencia hoy</div>
        <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 8px" }}>
          <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: "rotate(-90deg)" }}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={COLORS.border} strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none"
              stroke={pct === 100 ? COLORS.green : COLORS.primary}
              strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.5s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: pct === 100 ? COLORS.green : COLORS.text }}>{pct}%</span>
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: pct === 100 ? COLORS.green : COLORS.textSec }}>
          {pct === 100 ? "🎉 ¡Todas las dosis tomadas!" : `${taken} de ${total} medicamentos`}
        </div>
      </Card>

      <SectionTitle>Medicamentos de hoy</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {medications.map((item, i) => {
          const med = item.medication;
          const isTaken = item.taken;
          return (
            <Card key={med._id || i} onClick={() => toggleMed(med._id, med.schedules?.[0] || "08:00", isTaken)}
              style={{
                padding: 16,
                borderLeft: `4px solid ${isTaken ? COLORS.green : COLORS.yellow}`,
                opacity: isTaken ? 0.85 : 1,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 22,
                  background: isTaken ? COLORS.greenBg : COLORS.yellowBg,
                }}>
                  {isTaken ? "✓" : "💊"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 16, color: COLORS.text,
                    textDecoration: isTaken ? "line-through" : "none",
                  }}>
                    {med.name} {med.dose}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textSec }}>
                    🕐 {med.schedules?.join(" / ") || med.frequency}
                    {med.indication && ` · ${med.indication}`}
                  </div>
                </div>
                <div style={{
                  padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: isTaken ? COLORS.greenBg : COLORS.yellowBg,
                  color: isTaken ? COLORS.green : COLORS.yellow,
                }}>
                  {isTaken ? "Tomado" : "Pendiente"}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
