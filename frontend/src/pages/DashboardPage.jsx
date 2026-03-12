import { useState, useEffect } from "react";
import api from "../services/api";
import { Card, LoadingSpinner, SectionTitle, StatusBadge, COLORS, STATUS } from "../components/UI";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getDashboardOverview();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner text="Cargando dashboard..." />;
  if (!data) return null;

  const { summary, patients } = data;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, padding: 16, borderRadius: 14, background: COLORS.primaryLight, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.primary }}>{summary.totalPatients}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>Pacientes</div>
        </div>
        <div style={{ flex: 1, padding: 16, borderRadius: 14, background: COLORS.redBg, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.red }}>{summary.patientsInAlert}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.red }}>En alerta</div>
        </div>
        <div style={{ flex: 1, padding: 16, borderRadius: 14, background: COLORS.greenBg, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.green }}>{summary.avgAdherence}%</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.green }}>Adherencia</div>
        </div>
      </div>

      <SectionTitle>Pacientes — prioridad por alertas</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {patients.map((p, i) => {
          const alertColor = p.alertCount > 0 ? COLORS.red : p.vitals.bp?.status === "yellow" ? COLORS.yellow : COLORS.green;
          return (
            <Card key={i} style={{ padding: 16, borderLeft: `4px solid ${alertColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{p.patient.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSec }}>
                    {p.patient.age} años · {p.patient.sex === "M" ? "♂" : "♀"}
                    {p.patient.diagnoses?.length > 0 && ` · ${p.patient.diagnoses.join(", ")}`}
                  </div>
                </div>
                {p.alertCount > 0 && (
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: COLORS.redBg, color: COLORS.red,
                  }}>{p.alertCount} alertas</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {p.vitals.bp && (
                  <div style={{
                    flex: 1, padding: "8px 10px", borderRadius: 10,
                    background: STATUS[p.vitals.bp.status]?.bg || COLORS.divider, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: STATUS[p.vitals.bp.status]?.color }}>PA</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: STATUS[p.vitals.bp.status]?.color }}>{p.vitals.bp.value}</div>
                  </div>
                )}
                {p.vitals.glucose && (
                  <div style={{
                    flex: 1, padding: "8px 10px", borderRadius: 10,
                    background: STATUS[p.vitals.glucose.status]?.bg || COLORS.divider, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: STATUS[p.vitals.glucose.status]?.color }}>Glucosa</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: STATUS[p.vitals.glucose.status]?.color }}>{p.vitals.glucose.value}</div>
                  </div>
                )}
                {p.adherence !== null && (
                  <div style={{
                    flex: 1, padding: "8px 10px", borderRadius: 10,
                    background: p.adherence >= 80 ? COLORS.greenBg : p.adherence >= 60 ? COLORS.yellowBg : COLORS.redBg,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: p.adherence >= 80 ? COLORS.green : p.adherence >= 60 ? COLORS.yellow : COLORS.red }}>Adherencia</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: p.adherence >= 80 ? COLORS.green : p.adherence >= 60 ? COLORS.yellow : COLORS.red }}>{p.adherence}%</div>
                  </div>
                )}
              </div>
              {p.tcc && (
                <div style={{ marginTop: 8, fontSize: 12, color: COLORS.textSec }}>
                  🧠 TCC: Fase {p.tcc.phase}, Semana {p.tcc.week}
                  {p.tcc.lastActivity && ` · Activo: ${new Date(p.tcc.lastActivity).toLocaleDateString("es-PA")}`}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
