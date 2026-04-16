import { useState } from "react";
import api from "../services/api";

const CONSENT_VERSION = "1.0";

const SECTIONS = [
  {
    title: "1. Responsable del tratamiento",
    content: "El Centro de Salud de Macaracas (MINSA), ubicado en el distrito de Macaracas, provincia de Los Santos, República de Panamá, es el responsable del tratamiento de sus datos personales a través de la aplicación PrevenApp. El investigador principal es el Dr. Jonathan Solís (MI-7382-24, HRAAM).",
  },
  {
    title: "2. Datos que se recolectan",
    content: "PrevenApp recolecta los siguientes datos personales sensibles de salud:\n\n• Datos de identificación: nombre, cédula, fecha de nacimiento, sexo, dirección, teléfono.\n• Datos clínicos: diagnósticos (CIE-10), antecedentes personales y familiares, alergias, cirugías previas, tipo de sangre.\n• Signos vitales: presión arterial, glucosa capilar, peso, circunferencia de cintura.\n• Medicamentos: nombre, dosis, horarios, registro de adherencia.\n• Tamizajes preventivos: resultados, fechas, clasificación clínica.\n• Vacunación: fechas de administración de vacunas.\n• Datos conductuales: registros del módulo de Terapia Cognitivo-Conductual (ABC, escala hambre/saciedad, metas).\n• Factores de riesgo: tabaquismo, consumo de alcohol, actividad física, alimentación.",
  },
  {
    title: "3. Finalidad del tratamiento",
    content: "Sus datos serán utilizados exclusivamente para:\n\na) Brindarle atención médica preventiva personalizada en el Centro de Salud de Macaracas.\nb) Generar alertas y recordatorios de tamizajes, vacunas y medicamentos.\nc) Permitir a su médico tratante monitorear su salud de forma remota.\nd) Con fines de investigación científica en salud pública — en este caso, los datos serán ANONIMIZADOS antes de cualquier análisis, conforme al Art. 12 de la Ley 81 de 2019.",
  },
  {
    title: "4. Almacenamiento y seguridad",
    content: "Sus datos se almacenan en servidores de MongoDB Atlas (Amazon Web Services) ubicados fuera del territorio panameño. Esta infraestructura cumple con certificaciones SOC 2, ISO 27001 y GDPR europeo, estándares superiores a los exigidos por la Ley 81 de 2019, conforme al Art. 25.\n\nMedidas de seguridad implementadas:\n• Cifrado de contraseñas con bcrypt (hash irreversible).\n• Comunicaciones cifradas con HTTPS/TLS.\n• Autenticación por token JWT con expiración.\n• Acceso restringido por roles (paciente, médico).\n• Base de datos con acceso controlado por IP.",
  },
  {
    title: "5. Acceso a sus datos",
    content: "Tendrán acceso a sus datos personales identificables:\n\n• Usted, el titular, a través de la aplicación.\n• Su médico tratante asignado en el Centro de Salud de Macaracas.\n\nNadie más tendrá acceso a sus datos identificables sin su autorización expresa o una orden judicial.",
  },
  {
    title: "6. Sus derechos (ARCOP)",
    content: "Conforme a la Ley 81 de 2019 y el Decreto Ejecutivo 285 de 2021, usted tiene derecho a:\n\n• ACCESO: Consultar todos sus datos personales almacenados.\n• RECTIFICACIÓN: Solicitar corrección de datos inexactos.\n• CANCELACIÓN: Solicitar la eliminación de sus datos.\n• OPOSICIÓN: Negarse al tratamiento de sus datos.\n• PORTABILIDAD: Obtener copia de sus datos en formato digital.\n\nPara ejercer estos derechos, puede contactar al Centro de Salud de Macaracas o revocar su consentimiento directamente desde la sección \"Mi Perfil\" de la aplicación.",
  },
  {
    title: "7. Revocación del consentimiento",
    content: "Usted puede revocar este consentimiento en cualquier momento desde la sección \"Mi Perfil\" de la aplicación, sin efecto retroactivo. La revocación no afecta la licitud del tratamiento previo. Tras la revocación, se suspenderá el procesamiento de nuevos datos.",
  },
  {
    title: "8. Base legal",
    content: "• Ley 81 de 26 de marzo de 2019 — Protección de Datos Personales.\n• Decreto Ejecutivo 285 de 28 de mayo de 2021 — Reglamento.\n• Constitución Política, Art. 42 y 44 — Habeas Data.\n• Autoridad competente: ANTAI (Autoridad Nacional de Transparencia y Acceso a la Información).",
  },
];

export default function ConsentPage({ onAccept }) {
  const [expandedSection, setExpandedSection] = useState(0);
  const [readAll, setReadAll] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scrolledBottom, setScrolledBottom] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      setReadAll(true);
    }
  };

  const handleAccept = async () => {
    setSaving(true);
    try {
      await api.giveConsent(CONSENT_VERSION);
      onAccept();
    } catch (err) {
      alert("Error al registrar consentimiento: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FAFB", fontFamily: "'DM Sans', -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #064E52 0%, #0A8A8F 50%, #0FB5A2 100%)",
        padding: "20px 24px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 0.8px, transparent 0.8px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", letterSpacing: -0.5 }}>Protección de Datos Personales</h1>
          <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>Ley 81 de 2019 · República de Panamá</p>
        </div>
      </div>

      {/* Intro */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{
          padding: "14px 16px", borderRadius: 14, marginBottom: 12,
          background: "#FFFBEB", border: "1px solid #FEF3C7",
        }}>
          <div style={{ fontSize: 14, color: "#92400E", lineHeight: 1.6 }}>
            <strong>Antes de continuar</strong>, necesitamos su consentimiento para el tratamiento de sus datos personales de salud. Por favor lea cuidadosamente la siguiente información.
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div onScroll={handleScroll} style={{
        flex: 1, padding: "0 20px", overflowY: "auto", maxHeight: "calc(100vh - 340px)",
      }}>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{
            marginBottom: 8, borderRadius: 14, overflow: "hidden",
            background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <button onClick={() => setExpandedSection(expandedSection === i ? -1 : i)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "14px 16px", background: "#fff", border: "none",
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: expandedSection === i ? "#0A8A8F" : "#F1F5F9",
                color: expandedSection === i ? "#fff" : "#64748B",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
              }}>{i + 1}</div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{s.title.replace(/^\d+\.\s*/, "")}</span>
              <span style={{ color: "#94A3B8", transform: expandedSection === i ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
            </button>
            <div style={{ maxHeight: expandedSection === i ? 800 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
              <div style={{ padding: "0 16px 16px", fontSize: 14, color: "#475569", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {s.content}
              </div>
            </div>
          </div>
        ))}

        {/* Version info */}
        <div style={{ padding: "12px 0", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>
          Versión del consentimiento: {CONSENT_VERSION} · {new Date().toLocaleDateString("es-PA")}
        </div>
      </div>

      {/* Bottom action area */}
      <div style={{
        padding: "12px 20px 24px", background: "#fff",
        borderTop: "1px solid #E2E8F0", boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
      }}>
        {/* Checkbox */}
        <label onClick={() => { if (readAll) setChecked(!checked); }} style={{
          display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
          borderRadius: 12, marginBottom: 12, cursor: readAll ? "pointer" : "default",
          background: checked ? "#F0FDF4" : readAll ? "#fff" : "#F8FAFB",
          border: checked ? "2px solid #16A34A" : "2px solid #E2E8F0",
          opacity: readAll ? 1 : 0.5,
          transition: "all 0.2s",
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 1,
            border: checked ? "none" : "2px solid #CBD5E1",
            background: checked ? "#16A34A" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {checked && <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>✓</span>}
          </div>
          <div style={{ fontSize: 14, color: "#1E293B", lineHeight: 1.5 }}>
            <strong>He leído y acepto</strong> el tratamiento de mis datos personales de salud conforme a la Ley 81 de 2019, para los fines descritos en este documento. Entiendo que puedo revocar este consentimiento en cualquier momento.
          </div>
        </label>

        {!readAll && (
          <div style={{ fontSize: 12, color: "#D97706", textAlign: "center", marginBottom: 8 }}>
            ↓ Desplácese hacia abajo para leer todo el documento
          </div>
        )}

        <button onClick={handleAccept} disabled={!checked || saving} style={{
          width: "100%", padding: 16, borderRadius: 14, border: "none",
          background: checked ? "linear-gradient(135deg, #064E52, #0A8A8F)" : "#E2E8F0",
          color: checked ? "#fff" : "#94A3B8",
          fontSize: 17, fontWeight: 800, cursor: checked ? "pointer" : "default",
          boxShadow: checked ? "0 4px 12px rgba(10,138,143,0.3)" : "none",
          transition: "all 0.2s",
        }}>
          {saving ? "Registrando..." : "Aceptar y continuar"}
        </button>

        <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
          ANTAI · Dirección de Protección de Datos Personales<br />
          Ley 81 de 2019 · D.E. 285 de 2021
        </div>
      </div>
    </div>
  );
}
