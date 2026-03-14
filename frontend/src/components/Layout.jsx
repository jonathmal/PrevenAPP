import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "./UI";

const NAV_ITEMS_PATIENT = [
  { key: "tamizajes", label: "Salud", icon: "🛡️" },
  { key: "monitor", label: "Signos", icon: "❤️" },
  { key: "meds", label: "Meds", icon: "💊" },
  { key: "tcc", label: "TCC", icon: "🧠" },
  { key: "perfil", label: "Perfil", icon: "👤" },
];
const NAV_ITEMS_DOCTOR = [{ key: "dashboard", label: "Pacientes", icon: "👥" }];

const TITLES = {
  tamizajes: "Mi Salud", monitor: "Signos Vitales", meds: "Medicación",
  tcc: "Mi Mente", perfil: "Mi Perfil", dashboard: "Panel Clínico",
};

function bmiColor(bmi) {
  if (bmi < 18.5) return { c: "#D97706", bg: "rgba(217,119,6,0.15)" };
  if (bmi < 25) return { c: "#16A34A", bg: "rgba(22,163,74,0.15)" };
  if (bmi < 30) return { c: "#D97706", bg: "rgba(217,119,6,0.15)" };
  return { c: "#DC2626", bg: "rgba(220,38,38,0.15)" };
}

export default function Layout({ children, activeTab, onNavigate }) {
  const { user, patient, logout, isDoctor } = useAuth();
  const navItems = isDoctor ? NAV_ITEMS_DOCTOR : NAV_ITEMS_PATIENT;
  const contentRef = useRef(null);
  const [apfOpen, setApfOpen] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
      contentRef.current.style.transform = "translateY(6px)";
      const t = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.style.opacity = "1";
          contentRef.current.style.transform = "translateY(0)";
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [activeTab]);

  const showCard = !isDoctor && patient && activeTab !== "tcc" && activeTab !== "perfil";
  const bmi = patient?.weight && patient?.height
    ? parseFloat((patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)) : null;
  const bmiS = bmi ? bmiColor(bmi) : null;
  const diagnoses = patient?.diagnoses?.filter(d => d.isActive) || [];
  const familyHx = patient?.familyHistory || [];

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FAFB",
      fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
    }} className="safe-bottom">

      {/* ─── Header ──────────────────────────────────────── */}
      <div style={{
        background: isDoctor
          ? "linear-gradient(160deg, #1A2F4B 0%, #2B5B8A 100%)"
          : "linear-gradient(160deg, #064E52 0%, #0A8A8F 50%, #0FB5A2 100%)",
        padding: showCard ? "14px 20px 12px" : "14px 20px 16px",
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        {/* Subtle mesh */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.06,
          backgroundImage: "radial-gradient(circle at 20% 80%, #fff 0.5px, transparent 0.5px), radial-gradient(circle at 80% 20%, #fff 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px, 24px 24px",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Top row — compact */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showCard ? 10 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/icon-192.png" alt="" style={{ width: 32, height: 32, borderRadius: 9 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>{TITLES[activeTab] || "PrevenApp"}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                background: "rgba(255,255,255,0.15)", borderRadius: 20,
                padding: "5px 12px", fontSize: 13, fontWeight: 600,
                backdropFilter: "blur(8px)",
              }}>{user?.name?.split(" ")[0]}</div>
              <button onClick={logout} style={{
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 20, padding: "5px 10px", color: "rgba(255,255,255,0.7)",
                fontSize: 11, cursor: "pointer", fontWeight: 600,
              }}>Salir</button>
            </div>
          </div>

          {/* Patient strip — compact */}
          {showCard && (
            <div style={{
              padding: "10px 14px", borderRadius: 14,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
              {/* Name + metrics in one row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: diagnoses.length > 0 ? 8 : 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800,
                }}>{user?.name?.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.name}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 3 }}>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>{patient.age}a · {patient.sex === "M" ? "M" : "F"}</span>
                    {bmi && <span style={{ fontSize: 11, fontWeight: 700, padding: "0 6px", borderRadius: 6, background: bmiS.bg }}>IMC {bmi}</span>}
                    {patient.waistCircumference && <span style={{ fontSize: 11, opacity: 0.7 }}>CC {patient.waistCircumference}</span>}
                  </div>
                </div>
              </div>

              {/* APP badges — compact inline */}
              {diagnoses.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {diagnoses.map((dx, i) => (
                    <span key={i} style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                      background: "rgba(255,100,100,0.2)", color: "#fff",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}>{dx.name}{dx.code ? " (" + dx.code + ")" : ""}</span>
                  ))}
                </div>
              )}

              {/* APF toggle — only on tamizajes */}
              {familyHx.length > 0 && activeTab === "tamizajes" && (
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => setApfOpen(!apfOpen)} style={{
                    display: "flex", alignItems: "center", gap: 6, background: "none",
                    border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer",
                    fontSize: 11, fontWeight: 600, padding: 0,
                  }}>
                    <span>APF ({familyHx.length})</span>
                    <span style={{ transform: apfOpen ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }}>▾</span>
                  </button>
                  <div style={{ maxHeight: apfOpen ? 200 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                      {familyHx.map((fh, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 6, background: "rgba(139,92,246,0.2)", color: "#fff" }}>
                          {fh.condition} — {fh.relative}
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
      <div ref={contentRef} style={{
        padding: "16px 16px 100px",
        transition: "opacity 0.12s ease, transform 0.12s ease",
        minHeight: "calc(100vh - 160px)",
      }}>
        {children}
      </div>

      {/* ─── Bottom Nav — frosted glass ───────────────────── */}
      <div className="nav-safe" style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        display: "flex", padding: "2px 0 0",
        zIndex: 50,
      }}>
        {navItems.map(item => {
          const isActive = activeTab === item.key;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 1, padding: "10px 0 8px", border: "none",
              background: "none", cursor: "pointer", position: "relative",
              minHeight: 56, WebkitTapHighlightColor: "transparent",
            }}>
              {isActive && (
                <div style={{
                  position: "absolute", top: 0, left: "30%", right: "30%",
                  height: 3, borderRadius: "0 0 3px 3px",
                  background: "linear-gradient(90deg, #0A8A8F, #0FB5A2)",
                }} />
              )}
              <span style={{
                fontSize: 24, lineHeight: 1,
                filter: isActive ? "none" : "grayscale(0.6) opacity(0.5)",
                transition: "all 0.15s ease",
                transform: isActive ? "scale(1.1)" : "scale(1)",
              }}>{item.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: isActive ? 800 : 500,
                color: isActive ? "#0A8A8F" : "#94A3B8",
                letterSpacing: -0.2,
              }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
