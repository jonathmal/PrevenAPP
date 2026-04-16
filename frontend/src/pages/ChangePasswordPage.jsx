import { useState } from "react";
import api from "../services/api";

export default function ChangePasswordPage({ forced, onSuccess, onSkip }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "2px solid #E2E8F0", fontSize: 16, fontWeight: 500, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 };

  const submit = async () => {
    setError("");
    if (newPwd.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    if (newPwd !== confirm) return setError("Las contraseñas no coinciden");
    if (!forced && !current) return setError("Ingrese su contraseña actual");
    setLoading(true);
    try { await api.changePassword(forced ? null : current, newPwd); onSuccess(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #064E52 0%, #0A8A8F 50%, #0FB5A2 100%)",
      padding: 16, fontFamily: "'DM Sans', -apple-system, sans-serif", position: "relative", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 0.8px, transparent 0.8px)", backgroundSize: "28px 28px" }} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 22px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px" }}>
              {forced ? "Cambie su contraseña" : "Cambiar contraseña"}
            </h1>
            {forced && (
              <div style={{ fontSize: 13, color: "#D97706", marginTop: 6, padding: "8px 12px", borderRadius: 10, background: "#FFFBEB", lineHeight: 1.5 }}>
                Su médico le asignó una contraseña temporal. Por seguridad, debe cambiarla ahora.
              </div>
            )}
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: 12, background: "#FEF2F2", marginBottom: 14, fontSize: 13, fontWeight: 600, color: "#DC2626" }}>⚠ {error}</div>}

          {!forced && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Contraseña actual</label>
              <input type="password" value={current} onChange={e => setCurrent(e.target.value)} style={inputStyle} />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Nueva contraseña</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} autoFocus={forced} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Confirmar nueva contraseña</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />
          </div>

          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: 14, borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #064E52, #0A8A8F)", color: "#fff",
            fontSize: 16, fontWeight: 800, cursor: loading ? "wait" : "pointer",
            boxShadow: "0 4px 12px rgba(10,138,143,0.3)",
          }}>{loading ? "Cambiando..." : "Cambiar contraseña"}</button>

          {!forced && onSkip && (
            <button onClick={onSkip} style={{
              width: "100%", padding: 12, marginTop: 10, borderRadius: 12, border: "1px solid #E2E8F0",
              background: "#fff", color: "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>Cancelar</button>
          )}
        </div>
      </div>
    </div>
  );
}
