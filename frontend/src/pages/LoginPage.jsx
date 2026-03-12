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
    e.preventDefault();
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
      background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary}, #0A9396)`,
      padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "36px 28px",
        width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛡️</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: COLORS.text, margin: "0 0 4px",
            fontFamily: "'Source Serif 4', Georgia, serif",
          }}>PrevenApp</h1>
          <p style={{ fontSize: 14, color: COLORS.textSec, margin: 0 }}>
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
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: COLORS.redBg, color: COLORS.red, fontSize: 14, fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <BigButton onClick={handleSubmit} disabled={loading} icon={loading ? "⏳" : "→"}>
            {loading ? "Ingresando..." : "Ingresar"}
          </BigButton>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: COLORS.textSec, marginTop: 20, lineHeight: 1.5 }}>
          Centro de Salud de Macaracas<br />
          Región de Salud de Los Santos · MINSA
        </p>
      </div>
    </div>
  );
}
