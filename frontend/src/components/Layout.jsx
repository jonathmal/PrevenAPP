import { useAuth } from "../context/AuthContext";
import { COLORS } from "./UI";

const NAV_ITEMS_PATIENT = [
  { key: "tamizajes", label: "Tamizajes", icon: "🛡️", path: "/" },
  { key: "monitor", label: "Monitor", icon: "❤️", path: "/monitor" },
  { key: "meds", label: "Medicación", icon: "💊", path: "/meds" },
  { key: "tcc", label: "Mi Mente", icon: "🧠", path: "/tcc" },
];

const NAV_ITEMS_DOCTOR = [
  { key: "dashboard", label: "Pacientes", icon: "👥", path: "/" },
  { key: "alerts", label: "Alertas", icon: "🔔", path: "/alerts" },
];

export default function Layout({ children, activeTab, onNavigate }) {
  const { user, patient, logout, isDoctor } = useAuth();
  const navItems = isDoctor ? NAV_ITEMS_DOCTOR : NAV_ITEMS_PATIENT;

  const titles = {
    tamizajes: "Mis Tamizajes",
    monitor: "Automonitoreo",
    meds: "Mi Medicación",
    tcc: "Mi Mente — TCC",
    dashboard: "Dashboard Clínico",
    alerts: "Alertas",
  };

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: isDoctor ? "#F0F4F8" : COLORS.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      paddingBottom: 90,
    }}>
      {/* Header */}
      <div style={{
        background: isDoctor
          ? "linear-gradient(135deg, #1E3A5F, #2B5B8A)"
          : `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
        padding: "16px 20px 20px", color: "#fff",
        borderRadius: "0 0 24px 24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              {isDoctor ? "🩺 Modo Médico" : "🛡️ PrevenApp"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {isDoctor ? "Panel de control clínico" : "Tu salud preventiva al día"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              background: "rgba(255,255,255,0.15)", borderRadius: 12,
              padding: "6px 12px", fontSize: 12, fontWeight: 600, backdropFilter: "blur(10px)",
            }}>
              {user?.name?.split(" ")[0]} 👋
            </div>
            <button onClick={logout} style={{
              background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
              padding: "6px 10px", color: "#fff", fontSize: 11, cursor: "pointer",
            }}>Salir</button>
          </div>
        </div>
        <div style={{
          fontSize: 16, fontWeight: 700,
          fontFamily: "'Source Serif 4', Georgia, serif",
        }}>
          {titles[activeTab] || "PrevenApp"}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {children}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: "#fff",
        borderTop: `1px solid ${COLORS.border}`,
        display: "flex", padding: "6px 4px 10px",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        zIndex: 50,
      }}>
        {navItems.map(item => {
          const isActive = activeTab === item.key;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, padding: "6px 0", border: "none", background: "none", cursor: "pointer",
            }}>
              <span style={{
                fontSize: 22, transform: isActive ? "scale(1.15)" : "scale(1)",
                filter: isActive ? "none" : "grayscale(0.5)",
                transition: "all 0.2s",
              }}>{item.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: isActive ? 800 : 500,
                color: isActive ? COLORS.primary : COLORS.textSec,
              }}>{item.label}</span>
              {isActive && <div style={{ width: 20, height: 3, borderRadius: 2, background: COLORS.primary }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
