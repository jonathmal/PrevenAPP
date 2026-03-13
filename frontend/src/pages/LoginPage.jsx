import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { COLORS, BigButton, Input } from "../components/UI";

export default function LoginPage() {
  const { login } = useAuth();
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!cedula || !password) return setError("Ingrese cédula y contraseña");
    setLoading(true);
    setError(null);
    try {
      await login(cedula, password);
    } catch (err) {
      setError(err.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, " + COLORS.primaryDark + " 0%, " + COLORS.primary + " 40%, #0A9396 100%)",
      padding: 20, position: "relative", overflow: "hidden",
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.035,
        backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }} />

      {/* Decorative circles */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: "rgba(255,255,255,0.04)",
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: "rgba(255,255,255,0.03)",
      }} />

      <div className="fade-in" style={{
        background: "#fff", borderRadius: 24, padding: "36px 28px",
        width: "100%", maxWidth: 400, position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.1)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img
            src="/icon-512.png"
            alt="PrevenApp"
            style={{
              width: 80, height: 80, borderRadius: 18, margin: "0 auto 12px",
              display: "block",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          />
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: COLORS.text, margin: "0 0 4px",
            fontFamily: "'Source Serif 4', Georgia, serif", letterSpacing: -0.5,
          }}>PrevenApp</h1>
          <p style={{ fontSize: 14, color: COLORS.textSec, margin: 0, fontWeight: 500 }}>
            Medicina Preventiva · Macaracas
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Cédula"
            type="text"
            value={cedula}
            onChange={e => setCedula(e.target.value)}
            placeholder="Ej: 7-100-1001"
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && (
            <div className="scale-in" style={{
              padding: "12px 14px", borderRadius: 12, marginBottom: 16,
              background: COLORS.redBg, color: COLORS.red, fontSize: 14, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid rgba(220,38,38,0.15)",
            }}>
              <span style={{ fontSize: 16 }}>⚠</span>
              {error}
            </div>
          )}

          <BigButton onClick={handleSubmit} disabled={loading} icon={loading ? "⏳" : "→"}>
            {loading ? "Ingresando..." : "Ingresar"}
          </BigButton>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <div style={{
            width: "100%", height: 1, background: COLORS.divider, marginBottom: 16,
            position: "relative",
          }}>
            <span style={{
              position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)",
              background: "#fff", padding: "0 12px", fontSize: 11,
              color: COLORS.textSec, fontWeight: 500,
            }}>MINSA · Los Santos</span>
          </div>
          <p style={{ fontSize: 12, color: COLORS.textSec, margin: 0, lineHeight: 1.6 }}>
            Centro de Salud de Macaracas<br />
            Región de Salud de Los Santos
          </p>
        </div>
      </div>

      {/* Version tag */}
      <div style={{
        marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.5)",
        textAlign: "center", fontWeight: 500, position: "relative",
      }}>
        PrevenApp v2.0 · Protocolo de Investigación
      </div>
    </div>
  );
}
