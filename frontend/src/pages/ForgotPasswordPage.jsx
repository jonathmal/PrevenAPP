import { useState } from "react";
import api from "../services/api";

export default function ForgotPasswordPage({ onBack, onSuccess }) {
  const [step, setStep] = useState(1); // 1=cedula, 2=question+answer+newPwd, 3=done
  const [cedula, setCedula] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwdConfirm, setNewPwdConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "2px solid #E2E8F0", fontSize: 16, fontWeight: 500, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 };

  const fetchQuestion = async () => {
    setError(""); setLoading(true);
    try {
      const res = await api.forgotPassword(cedula.trim());
      setQuestion(res.data.question);
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    setError("");
    if (newPwd.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    if (newPwd !== newPwdConfirm) return setError("Las contraseñas no coinciden");
    if (!answer.trim()) return setError("Ingrese su respuesta de seguridad");
    setLoading(true);
    try {
      await api.resetPassword(cedula.trim(), answer.trim(), newPwd);
      setStep(3);
    } catch (err) { setError(err.message); }
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
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 14,
          cursor: "pointer", fontWeight: 600, marginBottom: 16,
        }}>← Volver al login</button>

        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 22px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px" }}>Recuperar contraseña</h1>
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: 12, background: "#FEF2F2", marginBottom: 14, fontSize: 13, fontWeight: 600, color: "#DC2626" }}>⚠ {error}</div>}

          {step === 1 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Su cédula</label>
                <input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="8-937-44" style={inputStyle} autoFocus />
              </div>
              <button onClick={fetchQuestion} disabled={loading || !cedula.trim()} style={{
                width: "100%", padding: 14, borderRadius: 12, border: "none",
                background: cedula.trim() ? "linear-gradient(135deg, #064E52, #0A8A8F)" : "#E2E8F0",
                color: cedula.trim() ? "#fff" : "#94A3B8",
                fontSize: 16, fontWeight: 800, cursor: cedula.trim() ? "pointer" : "default",
              }}>{loading ? "Buscando..." : "Continuar"}</button>
              <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
                Si no recuerda su pregunta de seguridad, contacte a su médico para restablecer su acceso.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "#F0FDFA", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0A8A8F", marginBottom: 4 }}>PREGUNTA DE SEGURIDAD</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{question}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Su respuesta</label>
                <input value={answer} onChange={e => setAnswer(e.target.value)} style={inputStyle} autoFocus />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nueva contraseña</label>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Confirmar nueva contraseña</label>
                <input type="password" value={newPwdConfirm} onChange={e => setNewPwdConfirm(e.target.value)} style={inputStyle} />
              </div>
              <button onClick={handleReset} disabled={loading} style={{
                width: "100%", padding: 14, borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #064E52, #0A8A8F)", color: "#fff",
                fontSize: 16, fontWeight: 800, cursor: loading ? "wait" : "pointer",
              }}>{loading ? "Cambiando..." : "Restablecer contraseña"}</button>
            </>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 50, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#16A34A", marginBottom: 6 }}>Contraseña restablecida</div>
              <div style={{ fontSize: 14, color: "#64748B", marginBottom: 20, lineHeight: 1.6 }}>
                Ya puede iniciar sesión con su nueva contraseña.
              </div>
              <button onClick={onSuccess} style={{
                width: "100%", padding: 14, borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #064E52, #0A8A8F)", color: "#fff",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
              }}>Ir al login</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
