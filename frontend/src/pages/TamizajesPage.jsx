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

  const total = sorted.length;
  const completePct = total > 0 && summary
    ? Math.round(((summary.green || 0) / total) * 100)
    : 0;

  return (
    <div>
      {summary && (
        <div className="fade-in" style={{ marginBottom: 20 }}>
          {/* Progress ring */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "16px 20px", borderRadius: 16,
            background: "linear-gradient(135deg, " + COLORS.primaryLight + ", #fff)",
            border: "1px solid " + COLORS.border, marginBottom: 12,
          }}>
            <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: 56, height: 56, transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={COLORS.divider} strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none"
                  stroke={completePct === 100 ? COLORS.green : COLORS.primary}
                  strokeWidth="3" strokeDasharray={completePct + " " + (100 - completePct)}
                  strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: completePct === 100 ? COLORS.green : COLORS.primary }}>
                  {completePct}%
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>
                {completePct === 100 ? "¡Todos al día!" : "Tamizajes completados"}
              </div>
              <div style={{ fontSize: 13, color: COLORS.textSec }}>
                {summary.green || 0} de {total} al día
              </div>
            </div>
          </div>

          {/* Status pills */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Vencidos", val: summary.red, color: COLORS.red, bg: COLORS.redBg },
              { label: "Próximos", val: summary.yellow, color: COLORS.yellow, bg: COLORS.yellowBg },
              { label: "Al día", val: summary.green, color: COLORS.green, bg: COLORS.greenBg },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center", padding: "12px 8px", borderRadius: 14, background: item.bg,
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.val || 0}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon="🛡️"
          message="No hay tamizajes registrados aún"
          action={handleGenerate}
          actionLabel="Generar tamizajes según mi perfil"
        />
      ) : (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map(s => (
            <Card key={s._id} style={{ padding: 16, borderLeft: "4px solid " + (STATUS[s.status]?.color || COLORS.border) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: COLORS.textSec }}>
                    Cada {s.intervalMonths >= 12 ? (s.intervalMonths / 12) + " año(s)" : s.intervalMonths + " meses"}
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
