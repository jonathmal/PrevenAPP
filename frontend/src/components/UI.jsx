import { useState, useEffect } from "react";

export const COLORS = {
  bg: "#F7FAFA", card: "#FFFFFF",
  primary: "#0D7377", primaryLight: "#E8F5F5", primaryDark: "#095456",
  accent: "#FF8C42",
  green: "#16A34A", greenBg: "#DCFCE7",
  yellow: "#CA8A04", yellowBg: "#FEF9C3",
  red: "#DC2626", redBg: "#FEE2E2",
  text: "#1A2332", textSec: "#5A6B7F",
  border: "#E2E8F0", divider: "#F1F5F9",
};

export const STATUS = {
  green: { color: COLORS.green, bg: COLORS.greenBg, label: "Normal", icon: "✓" },
  yellow: { color: COLORS.yellow, bg: COLORS.yellowBg, label: "Precaución", icon: "⚠" },
  red: { color: COLORS.red, bg: COLORS.redBg, label: "Alerta", icon: "!" },
};

export function StatusBadge({ status, large }) {
  const s = STATUS[status] || STATUS.green;
  return (
    <span className="scale-in" style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: large ? "6px 14px" : "3px 10px",
      borderRadius: 20, fontSize: large ? 15 : 12, fontWeight: 700,
      background: s.bg, color: s.color,
    }}>
      <span style={{ fontSize: large ? 16 : 13 }}>{s.icon}</span> {s.label}
    </span>
  );
}

export function Card({ children, style, onClick, className = "", animated = true }) {
  return (
    <div onClick={onClick} className={(onClick ? "card-tap " : "") + (animated ? "fade-in " : "") + className} style={{
      background: COLORS.card, borderRadius: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      border: "1px solid " + COLORS.border,
      padding: 20, cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.2s, transform 0.15s",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: 16, fontWeight: 800, color: COLORS.text,
      margin: "0 0 12px", letterSpacing: -0.3,
      fontFamily: "'Source Serif 4', Georgia, serif",
    }}>{children}</h2>
  );
}

export function BigButton({ children, onClick, color, icon, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      width: "100%", padding: "16px 20px",
      background: disabled ? COLORS.border : (color || COLORS.primary),
      color: disabled ? COLORS.textSec : "#fff",
      border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s",
      boxShadow: disabled ? "none" : "0 2px 8px " + (color || COLORS.primary) + "40",
      ...style,
    }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      {children}
    </button>
  );
}

export function MiniChart({ data, dataKey, color, height = 80, goal }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d[dataKey]);
  const min = Math.min(...vals) - 10;
  const max = Math.max(...vals) + 10;
  const w = 300, h = height;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d[dataKey] - min) / (max - min)) * h;
    return x + "," + y;
  }).join(" ");
  const goalY = goal ? h - ((goal - min) / (max - min)) * h : null;

  // Gradient fill under the line
  const fillPoints = points + " " + w + "," + h + " 0," + h;

  return (
    <svg viewBox={"0 0 " + w + " " + (h + 10)} style={{ width: "100%", height: height + 10 }}>
      <defs>
        <linearGradient id={"grad-" + dataKey} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon fill={"url(#grad-" + dataKey + ")"} points={fillPoints} />
      {goalY !== null && (
        <>
          <line x1="0" y1={goalY} x2={w} y2={goalY} stroke={COLORS.green} strokeWidth="1.5" strokeDasharray="6,4" opacity="0.6" />
          <text x={w - 2} y={goalY - 4} fill={COLORS.green} fontSize="10" textAnchor="end" fontWeight="600">Meta</text>
        </>
      )}
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((d[dataKey] - min) / (max - min)) * h;
        const isLast = i === data.length - 1;
        return <circle key={i} cx={x} cy={y} r={isLast ? 5 : 3.5} fill={isLast ? color : "#fff"} stroke={color} strokeWidth={isLast ? 2.5 : 2} />;
      })}
      {/* Value label on last point */}
      {(() => {
        const last = data[data.length - 1];
        const x = w;
        const y = h - ((last[dataKey] - min) / (max - min)) * h;
        return <text x={x - 4} y={y - 10} fill={color} fontSize="11" textAnchor="end" fontWeight="700">{last[dataKey]}</text>;
      })()}
    </svg>
  );
}

export function LoadingSpinner({ text = "Cargando..." }) {
  return (
    <div style={{ textAlign: "center", padding: 40 }} className="fade-in">
      <div style={{
        width: 40, height: 40,
        border: "3px solid " + COLORS.divider,
        borderTop: "3px solid " + COLORS.primary,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto 14px",
      }} />
      <div style={{ fontSize: 14, color: COLORS.textSec, fontWeight: 500 }}>{text}</div>
    </div>
  );
}

export function ErrorMsg({ message, onRetry }) {
  return (
    <Card style={{ textAlign: "center", borderLeft: "4px solid " + COLORS.red }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>😓</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>Algo salió mal</div>
      <div style={{ fontSize: 14, color: COLORS.red, marginBottom: onRetry ? 16 : 0, lineHeight: 1.5 }}>{message}</div>
      {onRetry && <BigButton onClick={onRetry} color={COLORS.red} icon="🔄">Reintentar</BigButton>}
    </Card>
  );
}

export function EmptyState({ icon, message, action, actionLabel }) {
  return (
    <div className="fade-in" style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
        background: COLORS.primaryLight, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 36,
      }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{message}</div>
      <div style={{ fontSize: 13, color: COLORS.textSec, lineHeight: 1.5, marginBottom: action ? 20 : 0 }}>
        Cuando tenga datos, aparecerán aquí
      </div>
      {action && <BigButton onClick={action} icon="+">{actionLabel || "Comenzar"}</BigButton>}
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.textSec, marginBottom: 6 }}>{label}</label>}
      <input {...props} style={{
        width: "100%", padding: "14px 12px", borderRadius: 12,
        border: "2px solid " + COLORS.border, fontSize: 16, fontWeight: 600,
        outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...props.style,
      }} />
    </div>
  );
}

// ─── Toast notification ─────────────────────────────────────
export function Toast({ message, type = "success", show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose?.(), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const config = {
    success: { bg: COLORS.greenBg, color: COLORS.green, icon: "✓" },
    error: { bg: COLORS.redBg, color: COLORS.red, icon: "✗" },
    info: { bg: COLORS.primaryLight, color: COLORS.primary, icon: "ℹ" },
    warning: { bg: COLORS.yellowBg, color: COLORS.yellow, icon: "⚠" },
  }[type];

  return (
    <div className="toast" style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 300, maxWidth: 400, width: "calc(100% - 32px)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px", borderRadius: 14,
        background: config.bg, color: config.color,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        fontWeight: 600, fontSize: 14,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800 }}>{config.icon}</span>
        <span style={{ flex: 1 }}>{message}</span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: config.color,
          fontSize: 18, cursor: "pointer", padding: "0 4px", opacity: 0.7,
        }}>×</button>
      </div>
    </div>
  );
}

// ─── Offline banner ─────────────────────────────────────────
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (!offline) return null;
  return (
    <div className="offline-banner" style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 250,
      background: COLORS.yellow, color: "#fff", textAlign: "center",
      padding: "8px 16px", fontSize: 13, fontWeight: 700,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      📡 Sin conexión — Los datos se sincronizarán al reconectar
    </div>
  );
}

// ─── PWA Install prompt ─────────────────────────────────────
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled || dismissed || !deferredPrompt) return null;
  return (
    <div className="install-banner" style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 60,
      maxWidth: 448, margin: "0 auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", borderRadius: 16, background: "#fff",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid " + COLORS.border,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: COLORS.primary, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22, color: "#fff", fontWeight: 800,
        }}>P</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Instalar PrevenApp</div>
          <div style={{ fontSize: 12, color: COLORS.textSec }}>Acceso rápido desde su pantalla</div>
        </div>
        <button onClick={handleInstall} style={{
          padding: "8px 16px", borderRadius: 10, border: "none",
          background: COLORS.primary, color: "#fff", fontSize: 13,
          fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
        }}>Instalar</button>
        <button onClick={() => setDismissed(true)} style={{
          background: "none", border: "none", color: COLORS.textSec,
          fontSize: 20, cursor: "pointer", padding: "0 4px",
        }}>×</button>
      </div>
    </div>
  );
}

// ─── Skeleton loader ────────────────────────────────────────
export function Skeleton({ width, height = 16, style: customStyle }) {
  return (
    <div className="skeleton" style={{ width: width || "100%", height, ...customStyle }} />
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      background: COLORS.card, borderRadius: 16, padding: 20,
      border: "1px solid " + COLORS.border,
    }}>
      <Skeleton width="60%" height={18} style={{ marginBottom: 10 }} />
      <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="40%" height={14} />
    </div>
  );
}

// ─── Classify helpers ───────────────────────────────────────
export function classifyBP(sys, dia) {
  if (sys >= 140 || dia >= 90) return "red";
  if (sys >= 130 || dia >= 80) return "yellow";
  return "green";
}

export function classifyGlucose(val, type = "fasting") {
  if (type === "fasting") {
    if (val < 70 || val > 180) return "red";
    if (val > 130) return "yellow";
    return "green";
  }
  if (val < 70 || val > 250) return "red";
  if (val > 180) return "yellow";
  return "green";
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-PA", { day: "numeric", month: "short", year: "numeric" });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.getDate() + "/" + (d.getMonth() + 1);
}
