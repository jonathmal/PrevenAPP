import { useEffect, useState } from "react";
import api from "../services/api";
import { Card, StatusBadge, BigButton, LoadingSpinner, ErrorMsg, EmptyState, COLORS, STATUS, formatDate } from "../components/UI";

export default function TamizajesPage() {
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

  const sorted = [...screenings].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return (order[a.status] || 2) - (order[b.status] || 2);
  });

  return (
    <div>
      {summary && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Vencidos", val: summary.red, color: COLORS.red, bg: COLORS.redBg },
            { label: "Próximos", val: summary.yellow, color: COLORS.yellow, bg: COLORS.yellowBg },
            { label: "Al día", val: summary.green, color: COLORS.green, bg: COLORS.greenBg },
          ].map((item, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center", padding: "14px 8px", borderRadius: 14, background: item.bg,
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.val || 0}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div>
          <EmptyState icon="🛡️" message="No hay tamizajes registrados aún" />
          <BigButton onClick={handleGenerate} icon="⚡">Generar tamizajes según mi perfil</BigButton>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map(s => (
            <Card key={s._id} style={{ padding: 16, borderLeft: `4px solid ${STATUS[s.status]?.color || COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: COLORS.textSec }}>
                    Cada {s.intervalMonths >= 12 ? `${s.intervalMonths / 12} año(s)` : `${s.intervalMonths} meses`}
                  </div>
                  {s.lastDone && (
                    <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 4 }}>
                      Último: {formatDate(s.lastDone)}
                    </div>
                  )}
                  {!s.lastDone && (
                    <div style={{ fontSize: 12, color: COLORS.red, marginTop: 4, fontWeight: 600 }}>
                      Nunca realizado
                    </div>
                  )}
                </div>
                <StatusBadge status={s.status} />
              </div>
              {s.status === "red" && (
                <div style={{
                  marginTop: 10, padding: "8px 12px", borderRadius: 10,
                  background: COLORS.redBg, fontSize: 13, fontWeight: 600, color: COLORS.red,
                }}>
                  ⏰ Vencido — Solicite cita para realizarlo
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
