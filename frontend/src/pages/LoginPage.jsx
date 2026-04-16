import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onRegister, onForgot }) {
  const { login } = useAuth();
  const [cedula, setCedula] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await login(cedula.trim(), password); }
    catch (err) { setError(err.message || "Error al iniciar sesión"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #064E52 0%, #0A8A8F 40%, #0FB5A2 100%)",
      padding: 20, fontFamily: "'DM Sans', -apple-system, sans-serif", position: "relative", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 0.8px, transparent 0.8px)", backgroundSize: "28px 28px" }} />
      <div style={{ position: "absolute", top: "-20%", right: "-30%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)" }} />

      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px 26px",
        width: "100%", maxWidth: 380, position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/icon-512.png" alt="PrevenApp" style={{ width: 72, height: 72, borderRadius: 18, margin: "0 auto 10px", display: "block", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", letterSpacing: -0.5 }}>PrevenApp</h1>
          <div style={{ fontSize: 13, color: "#64748B" }}>Centro de Salud de Macaracas</div>
        </div>

        {error && <div style={{ padding: "10px 14px", borderRadius: 12, background: "#FEF2F2", marginBottom: 14, fontSize: 13, fontWeight: 600, color: "#DC2626", textAlign: "center" }}>⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Cédula</label>
            <input type="text" value={cedula} onChange={e => setCedula(e.target.value)} placeholder="8-937-44"
              style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "2px solid #E2E8F0", fontSize: 16, fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#0A8A8F"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••"
                style={{ width: "100%", padding: "13px 42px 13px 16px", borderRadius: 14, border: "2px solid #E2E8F0", fontSize: 16, fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "#0A8A8F"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: 12, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <button type="button" onClick={onForgot} style={{ background: "none", border: "none", color: "#0A8A8F", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
              ¿Olvidó su contraseña?
            </button>
          </div>
          <button type="submit" disabled={loading || !cedula || !password} style={{
            width: "100%", padding: 15, borderRadius: 14, border: "none",
            background: cedula && password ? "linear-gradient(135deg, #064E52, #0A8A8F)" : "#E2E8F0",
            color: cedula && password ? "#fff" : "#94A3B8",
            fontSize: 17, fontWeight: 800, cursor: loading ? "wait" : "pointer",
            boxShadow: cedula && password ? "0 4px 12px rgba(10,138,143,0.3)" : "none",
          }}>{loading ? "Ingresando..." : "Ingresar"}</button>
        </form>

        <div style={{ marginTop: 18, padding: "14px 0 0", borderTop: "1px solid #F1F5F9", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 6 }}>¿No tiene cuenta?</div>
          <button onClick={onRegister} style={{
            background: "none", border: "2px solid #0A8A8F", color: "#0A8A8F",
            padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>Crear cuenta nueva</button>
        </div>

        <div style={{ marginTop: 16, padding: "10px", borderRadius: 10, background: "#F8FAFB", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
            MINSA Panamá · Ley 81 de Protección de Datos
          </div>
        </div>
      </div>
    </div>
  );
}
