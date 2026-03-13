import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "./UI";

const NAV_ITEMS_PATIENT = [
  { key: "tamizajes", label: "Tamizajes", icon: "🛡️" },
  { key: "monitor", label: "Monitor", icon: "❤️" },
  { key: "meds", label: "Meds", icon: "💊" },
  { key: "vacunas", label: "Vacunas", icon: "💉" },
  { key: "tcc", label: "TCC", icon: "🧠" },
  { key: "perfil", label: "Perfil", icon: "👤" },
];
const NAV_ITEMS_DOCTOR = [
  { key: "dashboard", label: "Pacientes", icon: "👥" },
];
const TITLES = { tamizajes: "Mis Tamizajes", monitor: "Automonitoreo", meds: "Mi Medicación", tcc: "Mi Mente — TCC", vacunas: "Vacunación", perfil: "Mi Perfil", dashboard: "Dashboard Clínico" };
const SUBTITLES = { tamizajes: "Exámenes preventivos según tu perfil", monitor: "Presión, glucosa y peso corporal", meds: "Control de adherencia diaria", tcc: "Intervención conductual digital", vacunas: "Esquema de inmunización MINSA", perfil: "Mis datos clínicos y antecedentes", dashboard: "Panel de monitoreo de pacientes" };

function bmiColor(bmi) {
  if (bmi < 18.5) return "rgba(202,138,4,0.25)";
  if (bmi < 25) return "rgba(22,163,74,0.25)";
  if (bmi < 30) return "rgba(202,138,4,0.25)";
  return "rgba(220,38,38,0.25)";
}

export default function Layout({ children, activeTab, onNavigate }) {
  const { user, patient, logout, isDoctor } = useAuth();
  const navItems = isDoctor ? NAV_ITEMS_DOCTOR : NAV_ITEMS_PATIENT;
  const contentRef = useRef(null);
  const [apfOpen, setApfOpen] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
      contentRef.current.style.transform = "translateY(8px)";
      const t = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.style.opacity = "1";
          contentRef.current.style.transform = "translateY(0)";
        }
      }, 120);
      return () => clearTimeout(t);
    }
  }, [activeTab]);

  const showCard = !isDoctor && patient && activeTab !== "tcc" && activeTab !== "perfil";
  const bmi = patient?.weight && patient?.height ? parseFloat((patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)) : null;
  const diagnoses = patient?.diagnoses?.filter(d => d.isActive) || [];
  const familyHx = patient?.familyHistory || [];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: isDoctor ? "#F0F4F8" : COLORS.bg, fontFamily: "'Inter', -apple-system, sans-serif" }} className="safe-bottom">

      {/* ─── Header ──────────────────────────────────────── */}
      <div style={{
        background: isDoctor ? "linear-gradient(135deg, #1E3A5F, #2B5B8A)" : "linear-gradient(135deg, " + COLORS.primaryDark + ", " + COLORS.primary + ", #0A9396)",
        padding: "16px 20px " + (showCard ? "14px" : "20px"), color: "#fff",
        borderRadius: "0 0 24px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/icon-192.png" alt="PrevenApp" style={{ width: 36, height: 36, borderRadius: 10 }} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>PrevenApp</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>v2.0 · Macaracas</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "6px 10px", fontSize: 12, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name?.split(" ")[0]} 👋
              </div>
              <button onClick={logout} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.8)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Salir</button>
            </div>
          </div>

          {/* Title */}
          <div style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{TITLES[activeTab] || "PrevenApp"}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{SUBTITLES[activeTab]}</div>
          </div>

          {/* ─── Patient card (Tamizajes) ─────────────────── */}
          {showCard && (
            <div style={{ marginTop: 14 }}>

              {/* Identity + metrics */}
              <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", borderRadius: familyHx.length > 0 && activeTab === "tamizajes" ? "16px 16px 0 0" : 16, border: "1px solid rgba(255,255,255,0.18)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
                    {user?.name?.charAt(0) || "P"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Source Serif 4', Georgia, serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Paciente"}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {patient.age ? patient.age + " años · " : ""}{patient.sex === "M" ? "Masculino" : "Femenino"}{patient.studyId ? " · " + patient.studyId : ""}
                    </div>
                  </div>
                </div>

                {/* Metric pills */}
                {(patient.height || patient.weight) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: diagnoses.length > 0 ? 10 : 0 }}>
                    {patient.height && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8, background: "rgba(255,255,255,0.15)" }}>📏 {patient.height} cm</span>}
                    {patient.weight && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8, background: "rgba(255,255,255,0.15)" }}>⚖️ {patient.weight} kg</span>}
                    {bmi && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: bmiColor(bmi) }}>IMC {bmi}</span>}
                    {patient.waistCircumference && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8, background: "rgba(255,255,255,0.15)" }}>📐 CC: {patient.waistCircumference} cm</span>}
                  </div>
                )}

                {/* APP badges */}
                {diagnoses.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Antecedentes Personales Patológicos</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {diagnoses.map((dx, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 8,
                          background: "rgba(220,38,38,0.2)", color: "#fff",
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}>
                          {dx.name}{dx.code ? " (" + dx.code + ")" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* APF — collapsible, only on tamizajes */}
              {familyHx.length > 0 && activeTab === "tamizajes" && (
                <div style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "0 0 16px 16px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}>
                  <button onClick={() => setApfOpen(!apfOpen)} style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "10px 16px", background: "none", border: "none",
                    color: "#fff", cursor: "pointer", textAlign: "left",
                  }}>
                    <span style={{ fontSize: 14 }}>👨‍👩‍👧‍👦</span>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Antecedentes Familiares ({familyHx.length})
                    </span>
                    <span style={{ fontSize: 12, opacity: 0.6, transform: apfOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
                  </button>
                  <div style={{
                    maxHeight: apfOpen ? 300 : 0, overflow: "hidden",
                    transition: "max-height 0.3s ease",
                  }}>
                    <div style={{ padding: "0 16px 12px", display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {familyHx.map((fh, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 8,
                          background: "rgba(139,92,246,0.2)", color: "#fff",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}>
                          {fh.condition} — {fh.relative}{fh.notes ? " (" + fh.notes + ")" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────── */}
      <div ref={contentRef} style={{ padding: 20, transition: "opacity 0.15s ease, transform 0.15s ease", minHeight: "calc(100vh - 200px)" }}>
        {children}
      </div>

      {/* ─── Bottom Nav ───────────────────────────────────── */}
      <div className="nav-safe" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid " + COLORS.border, display: "flex", padding: "4px 2px 0", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)", zIndex: 50 }}>
        {navItems.map(item => {
          const isActive = activeTab === item.key;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "10px 0 8px", border: "none", background: "none", cursor: "pointer", position: "relative", minHeight: 54 }}>
              {isActive && <div style={{ position: "absolute", top: -1, left: "20%", right: "20%", height: 3, borderRadius: "0 0 2px 2px", background: COLORS.primary }} />}
              <span style={{ fontSize: 24, transform: isActive ? "scale(1.12)" : "scale(1)", filter: isActive ? "none" : "grayscale(0.4) opacity(0.7)", transition: "all 0.2s" }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 500, color: isActive ? COLORS.primary : COLORS.textSec }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
