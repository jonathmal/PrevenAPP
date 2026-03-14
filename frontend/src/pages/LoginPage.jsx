import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [cedula, setCedula] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await login(cedula, password); }
    catch (err) { setError(err.message || "Error al iniciar sesión"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #064E52 0%, #0A8A8F 40%, #0FB5A2 100%)",
      padding: 20, fontFamily: "'DM Sans', -apple-system, sans-serif", position: "relative", overflow: "hidden",
    }}>
      {/* Mesh pattern */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 0.8px, transparent 0.8px)", backgroundSize: "28px 28px" }} />
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: "-20%", right: "-30%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)" }} />

      <div style={{
        background: "#fff", borderRadius: 24, padding: "36px 28px",
        width: "100%", maxWidth: 380, position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.08)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/icon-512.png" alt="PrevenApp" style={{ width: 80, height: 80, borderRadius: 18, margin: "0 auto 12px", display: "block", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", letterSpacing: -0.5 }}>PrevenApp</h1>
          <div style={{ fontSize: 13, color: "#64748B" }}>Medicina preventiva digital · Macaracas</div>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "#FEF2F2", marginBottom: 16, fontSize: 14, fontWeight: 600, color: "#DC2626", textAlign: "center" }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Cédula</label>
            <input type="text" value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Ej: 8-937-44"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "2px solid #E2E8F0", fontSize: 17, fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#0A8A8F"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "2px solid #E2E8F0", fontSize: 17, fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#0A8A8F"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          </div>
          <button type="submit" disabled={loading || !cedula || !password} style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: cedula && password ? "linear-gradient(135deg, #064E52, #0A8A8F)" : "#E2E8F0",
            color: cedula && password ? "#fff" : "#94A3B8",
            fontSize: 17, fontWeight: 800, cursor: loading ? "wait" : "pointer",
            boxShadow: cedula && password ? "0 4px 12px rgba(10,138,143,0.3)" : "none",
            transition: "all 0.2s",
          }}>{loading ? "Ingresando..." : "Ingresar"}</button>
        </form>

        <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: "#F8FAFB", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
            Centro de Salud de Macaracas · MINSA<br />
            Proyecto de investigación PrevenApp v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
