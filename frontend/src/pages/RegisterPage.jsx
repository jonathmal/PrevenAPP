import { useState } from "react";
import api from "../services/api";

const SECURITY_QUESTIONS = [
  "¿Cuál es el nombre de su madre?",
  "¿En qué ciudad nació?",
  "¿Cuál era el nombre de su primera mascota?",
  "¿Cuál es su comida favorita?",
  "¿Cuál es el nombre de su mejor amigo de la infancia?",
];

export default function RegisterPage({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    cedula: "", name: "", phone: "", email: "",
    dateOfBirth: "", sex: "F",
    password: "", passwordConfirm: "",
    securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  const validateStep1 = () => {
    if (!data.cedula.trim()) return "Ingrese su cédula";
    if (!/^[A-Za-z]{0,3}\d{1,3}-\d{1,4}-\d{1,5}$/.test(data.cedula.trim())) return "Formato inválido. Ejemplo: 8-937-44";
    if (!data.name.trim() || data.name.trim().length < 3) return "Ingrese su nombre completo";
    if (!data.dateOfBirth) return "Ingrese su fecha de nacimiento";
    const age = Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18 || age > 120) return "Debe ser mayor de 18 años";
    return null;
  };
  const validateStep2 = () => {
    if (data.password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    if (data.password !== data.passwordConfirm) return "Las contraseñas no coinciden";
    if (!data.securityAnswer.trim()) return "Ingrese una respuesta a la pregunta de seguridad";
    if (data.securityAnswer.trim().length < 2) return "Respuesta muy corta";
    return null;
  };

  const handleNext = () => {
    setError("");
    const err = validateStep1();
    if (err) return setError(err);
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    const err = validateStep2();
    if (err) return setError(err);
    setLoading(true);
    try {
      await api.register({
        cedula: data.cedula.trim(),
        password: data.password,
        name: data.name.trim(),
        phone: data.phone.trim() || undefined,
        email: data.email.trim().toLowerCase() || undefined,
        dateOfBirth: data.dateOfBirth,
        sex: data.sex,
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Error al registrarse");
    } finally { setLoading(false); }
  };

  const inputStyle = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "2px solid #E2E8F0", fontSize: 16, fontWeight: 500, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #064E52 0%, #0A8A8F 50%, #0FB5A2 100%)",
      padding: 16, fontFamily: "'DM Sans', -apple-system, sans-serif", position: "relative", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 0.8px, transparent 0.8px)", backgroundSize: "28px 28px" }} />

      <div style={{ maxWidth: 420, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Back button */}
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 14,
          cursor: "pointer", fontWeight: 600, marginBottom: 16,
        }}>← Volver</button>

        <div style={{
          background: "#fff", borderRadius: 20, padding: "24px 22px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 4px" }}>Crear cuenta</h1>
            <div style={{ fontSize: 13, color: "#64748B" }}>Paso {step} de 2 — {step === 1 ? "Datos personales" : "Seguridad"}</div>
            <div style={{ height: 4, borderRadius: 2, background: "#F1F5F9", marginTop: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: (step / 2 * 100) + "%", background: "linear-gradient(90deg, #0A8A8F, #0FB5A2)", transition: "width 0.3s" }} />
            </div>
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: 12, background: "#FEF2F2", marginBottom: 14, fontSize: 13, fontWeight: 600, color: "#DC2626" }}>⚠ {error}</div>}

          {step === 1 && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Cédula *</label>
                <input value={data.cedula} onChange={e => set("cedula", e.target.value)} placeholder="8-937-44" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input value={data.name} onChange={e => set("name", e.target.value)} placeholder="María del Carmen Vásquez" style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Fecha de nacimiento *</label>
                  <input type="date" value={data.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Sexo *</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[["F", "♀ Fem"], ["M", "♂ Masc"]].map(([v, l]) => (
                      <button key={v} onClick={() => set("sex", v)} style={{
                        flex: 1, padding: 12, borderRadius: 10, border: "none",
                        background: data.sex === v ? "#0A8A8F" : "#F1F5F9",
                        color: data.sex === v ? "#fff" : "#64748B",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Teléfono (opcional)</label>
                <input value={data.phone} onChange={e => set("phone", e.target.value)} placeholder="6700-1234" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Correo (opcional)</label>
                <input type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="ejemplo@correo.com" style={inputStyle} />
              </div>
              <button onClick={handleNext} style={{
                width: "100%", padding: 14, borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #064E52, #0A8A8F)", color: "#fff",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(10,138,143,0.3)",
              }}>Continuar →</button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Contraseña *</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} value={data.password} onChange={e => set("password", e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} />
                  <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: 13, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}>
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Confirmar contraseña *</label>
                <input type={showPassword ? "text" : "password"} value={data.passwordConfirm} onChange={e => set("passwordConfirm", e.target.value)} placeholder="Repita la contraseña" style={inputStyle} />
              </div>

              <div style={{ padding: "12px 14px", borderRadius: 12, background: "#FFFBEB", border: "1px solid #FEF3C7", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>🔐 PREGUNTA DE SEGURIDAD</div>
                <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
                  Necesaria para recuperar su contraseña si la olvida. Memorice su respuesta exactamente.
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Pregunta *</label>
                <select value={data.securityQuestion} onChange={e => set("securityQuestion", e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Respuesta *</label>
                <input value={data.securityAnswer} onChange={e => set("securityAnswer", e.target.value)} placeholder="Su respuesta" style={inputStyle} />
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>No distingue mayúsculas/espacios al final</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: 14, borderRadius: 12, border: "2px solid #E2E8F0",
                  background: "#fff", color: "#64748B", fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}>← Atrás</button>
                <button onClick={handleSubmit} disabled={loading} style={{
                  flex: 2, padding: 14, borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #064E52, #0A8A8F)", color: "#fff",
                  fontSize: 16, fontWeight: 800, cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 4px 12px rgba(10,138,143,0.3)",
                }}>{loading ? "Creando cuenta..." : "Crear cuenta"}</button>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          Al registrarse acepta el tratamiento de sus datos según la Ley 81 de 2019
        </div>
      </div>
    </div>
  );
}
