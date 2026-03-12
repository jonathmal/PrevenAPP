import { useState } from "react";

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
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: large ? "6px 14px" : "3px 10px",
      borderRadius: 20, fontSize: large ? 15 : 12, fontWeight: 700,
      background: s.bg, color: s.color,
    }}>
      <span style={{ fontSize: large ? 16 : 13 }}>{s.icon}</span> {s.label}
    </span>
  );
}

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: COLORS.card, borderRadius: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      border: `1px solid ${COLORS.border}`,
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
      boxShadow: disabled ? "none" : `0 2px 8px ${(color || COLORS.primary)}40`,
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
    return `${x},${y}`;
  }).join(" ");
  const goalY = goal ? h - ((goal - min) / (max - min)) * h : null;
  return (
    <svg viewBox={`0 0 ${w} ${h + 10}`} style={{ width: "100%", height: height + 10 }}>
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
        return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke={color} strokeWidth="2" />;
      })}
    </svg>
  );
}

export function LoadingSpinner({ text = "Cargando..." }) {
  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{
        width: 36, height: 36, border: `3px solid ${COLORS.border}`,
        borderTop: `3px solid ${COLORS.primary}`, borderRadius: "50%",
        animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
      }} />
      <div style={{ fontSize: 14, color: COLORS.textSec }}>{text}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorMsg({ message, onRetry }) {
  return (
    <Card style={{ textAlign: "center", borderLeft: `4px solid ${COLORS.red}` }}>
      <div style={{ fontSize: 14, color: COLORS.red, marginBottom: onRetry ? 12 : 0 }}>⚠ {message}</div>
      {onRetry && <BigButton onClick={onRetry} color={COLORS.red} icon="🔄">Reintentar</BigButton>}
    </Card>
  );
}

export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: "center", padding: 40, color: COLORS.textSec }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.textSec, marginBottom: 6 }}>{label}</label>}
      <input {...props} style={{
        width: "100%", padding: "14px 12px", borderRadius: 12,
        border: `2px solid ${COLORS.border}`, fontSize: 16, fontWeight: 600,
        outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        ...props.style,
      }} />
    </div>
  );
}

// Classify helpers
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
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
