import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, COLORS, SectionTitle } from "../components/UI";

// ═══════════════════════════════════════════════════════════
// Esquema Nacional de Vacunación de Panamá — Adultos
// Fuente: PAI MINSA Panamá, Ley 48 del 5/12/2007, OPS 2025
// ═══════════════════════════════════════════════════════════

const VACCINE_GROUPS = [
  {
    title: "Vacunas de rutina — Todos los adultos",
    icon: "💉",
    color: "#0D7377",
    bg: "#E8F5F5",
    vaccines: [
      { name: "Influenza", dose: "1 dosis anual", who: "Todos los adultos, énfasis en ≥60 años y enfermedades crónicas", interval: "Anual", notes: "Vacuna estacional. Campaña nacional cada año entre abril y junio.", status: "routine" },
      { name: "dT (Tétanos y Difteria)", dose: "1 refuerzo", who: "Todos los adultos", interval: "Cada 10 años", notes: "Si no tiene esquema completo: serie de 3 dosis (0, 1, 6 meses). Mujeres embarazadas reciben Tdap.", status: "routine" },
      { name: "COVID-19", dose: "Dosis de refuerzo", who: "Todos los adultos", interval: "Según lineamientos vigentes", notes: "Refuerzos disponibles en centros de salud. Prioridad: ≥60 años e inmunocomprometidos.", status: "routine" },
    ],
  },
  {
    title: "Adultos mayores (≥60 años)",
    icon: "👴",
    color: "#6366F1",
    bg: "#EDE9FE",
    vaccines: [
      { name: "Neumococo (PCV20 Valente)", dose: "1 dosis", who: "Adultos ≥60 años", interval: "Dosis única (si no vacunado previamente)", notes: "Panamá actualizó de PCV13 a PCV20 en 2025. Previene neumonía y enfermedad invasiva por neumococo.", status: "age" },
      { name: "Virus Sincitial Respiratorio (VSR)", dose: "1 dosis", who: "Adultos ≥60 años", interval: "Dosis única", notes: "Panamá: primer país de la región en incluir VSR para adultos mayores en el sector público (julio 2025).", status: "age" },
      { name: "Herpes Zóster (Shingrix)", dose: "2 dosis", who: "Adultos ≥50 años", interval: "2 dosis separadas por 2-6 meses", notes: "Previene el herpes zóster y la neuralgia postherpética. Disponible en sector privado.", status: "age" },
    ],
  },
  {
    title: "Pacientes con enfermedades crónicas",
    icon: "🏥",
    color: "#DC2626",
    bg: "#FEE2E2",
    vaccines: [
      { name: "Influenza (prioridad)", dose: "1 dosis anual", who: "HTA, DM2, enfermedad cardíaca, renal, hepática, pulmonar", interval: "Anual", notes: "Mayor riesgo de complicaciones graves. Prioridad en campaña nacional.", status: "chronic" },
      { name: "Neumococo (PCV20)", dose: "1 dosis", who: "Adultos con ECNT, independiente de la edad", interval: "Dosis única", notes: "Indicada en diabetes, enfermedad cardíaca, pulmonar crónica, hepatopatía, nefropatía, asplenia.", status: "chronic" },
      { name: "Hepatitis B", dose: "3 dosis", who: "Diabéticos, pacientes en hemodiálisis, hepatopatía crónica", interval: "0, 1 y 6 meses", notes: "Verificar anti-HBs post-vacunación en pacientes en diálisis. Serie completa si no vacunado.", status: "chronic" },
      { name: "COVID-19 (refuerzo)", dose: "Refuerzo", who: "Inmunocomprometidos y ECNT", interval: "Según lineamientos", notes: "Dosis adicionales recomendadas para inmunosuprimidos.", status: "chronic" },
    ],
  },
  {
    title: "Mujeres en edad reproductiva",
    icon: "🤰",
    color: "#EC4899",
    bg: "#FDF2F8",
    vaccines: [
      { name: "VPH (Nona Valente)", dose: "2-3 dosis", who: "Mujeres y hombres, esquema a los 10 años", interval: "0 y 6 meses (2 dosis <15 años) o 0, 2, 6 meses (3 dosis ≥15 años)", notes: "Panamá actualizó a VPH Nona Valente en 2025. Previene cáncer cervicouterino. Catch-up disponible.", status: "women" },
      { name: "Tdap (Tétanos, Difteria, Tosferina)", dose: "1 dosis", who: "Embarazadas (sem 27-36 de cada embarazo)", interval: "Cada embarazo", notes: "Protege al recién nacido contra tosferina. Se aplica en cada gestación.", status: "women" },
      { name: "VSR (embarazadas)", dose: "1 dosis", who: "Embarazadas (semana 32-36)", interval: "En cada embarazo", notes: "Panamá incluye VSR para embarazadas desde julio 2025. Protege al neonato.", status: "women" },
      { name: "Influenza", dose: "1 dosis", who: "Embarazadas en cualquier trimestre", interval: "Anual", notes: "Segura en cualquier trimestre. Previene complicaciones maternas y protege al neonato.", status: "women" },
    ],
  },
  {
    title: "Según factores de riesgo",
    icon: "⚠️",
    color: "#CA8A04",
    bg: "#FEF9C3",
    vaccines: [
      { name: "Hepatitis A", dose: "2 dosis", who: "Viajeros, hepatopatía crónica, HSH, usuarios de drogas IV", interval: "0 y 6-12 meses", notes: "Recomendada según factores de riesgo. Disponible en sector público.", status: "risk" },
      { name: "Hepatitis B", dose: "3 dosis", who: "Personal de salud, múltiples parejas sexuales, HSH, usuarios de drogas IV", interval: "0, 1 y 6 meses", notes: "Esquema completo si anti-HBs negativo.", status: "risk" },
      { name: "Fiebre Amarilla", dose: "1 dosis", who: "Viajeros a zonas endémicas (Darién, comarcas)", interval: "Dosis única de por vida", notes: "Requerida para viaje a ciertas regiones de Panamá y otros países.", status: "risk" },
      { name: "Meningococo (ACWY)", dose: "1-2 dosis", who: "Asplenia, deficiencia de complemento, viajeros a zonas de riesgo", interval: "Según indicación", notes: "Disponible en sector privado. Indicaciones específicas.", status: "risk" },
    ],
  },
];

function VaccineCard({ v, color }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div onClick={() => setExpanded(!expanded)} style={{
      padding: "14px 16px", borderLeft: "5px solid " + color,
      cursor: "pointer", background: expanded ? color + "10" : "transparent",
      borderBottom: "1px solid " + COLORS.divider, transition: "background 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{v.name}</div>
          <div style={{ fontSize: 14, color: COLORS.textSec, marginTop: 3 }}>{v.dose} · {v.interval}</div>
        </div>
        <span style={{ fontSize: 16, color: COLORS.textSec, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
      </div>
      <div style={{ maxHeight: expanded ? 300 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ paddingTop: 10, marginTop: 10, borderTop: "1px dashed " + COLORS.border }}>
          <div style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 6, lineHeight: 1.6 }}>
            <strong>¿Quién?</strong> {v.who}
          </div>
          <div style={{ fontSize: 14, color: COLORS.primary, marginBottom: 6, lineHeight: 1.6, padding: "8px 12px", borderRadius: 10, background: COLORS.primaryLight }}>
            💡 {v.notes}
          </div>
        </div>
      </div>
    </div>
  );
}

function VaccineGroup({ group, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, borderRadius: 18, overflow: "hidden", border: "1px solid " + COLORS.border, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "16px 18px",
        background: group.bg, border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: 26 }}>{group.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>{group.title}</div>
          <div style={{ fontSize: 13, color: COLORS.textSec }}>{group.vaccines.length} vacunas</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "#fff", color: group.color }}>{group.vaccines.length}</span>
        <span style={{ fontSize: 16, color: COLORS.textSec, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}>▼</span>
      </button>
      <div style={{ maxHeight: open ? 5000 : 0, overflow: "hidden", transition: "max-height 0.4s ease", background: COLORS.card }}>
        {group.vaccines.map((v, i) => <VaccineCard key={i} v={v} color={group.color} />)}
        <div style={{ height: 4 }} />
      </div>
    </div>
  );
}

export default function VacunacionPage() {
  const { patient } = useAuth();
  const age = patient?.age;
  const sex = patient?.sex;
  const hasChronic = patient?.diagnoses?.some(d => d.isActive && (d.name.toLowerCase().includes("hipertens") || d.name.toLowerCase().includes("diabetes") || d.name.toLowerCase().includes("metabólic")));

  return (
    <div>
      {/* Personalized note */}
      <Card className="fade-in" style={{ marginBottom: 16, padding: "14px 16px", borderTop: "4px solid " + COLORS.primary, background: "linear-gradient(135deg, " + COLORS.primaryLight + ", #fff)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
          🛡️ Su esquema de vacunación
        </div>
        <div style={{ fontSize: 14, color: COLORS.textSec, lineHeight: 1.6 }}>
          Basado en su perfil
          {age ? " (" + age + " años" + (sex === "F" ? ", femenino" : sex === "M" ? ", masculino" : "") + ")" : ""}
          {hasChronic ? " y sus enfermedades crónicas" : ""}
          , estas son las vacunas recomendadas según el Programa Ampliado de Inmunización de Panamá.
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 8, fontStyle: "italic" }}>
          📚 Fuente: PAI MINSA Panamá · Ley 48 del 5/12/2007 · OPS 2025
        </div>
      </Card>

      {/* Vaccine groups */}
      {VACCINE_GROUPS.map((group, i) => {
        // Smart default open: show groups relevant to this patient
        let relevant = false;
        if (i === 0) relevant = true; // routine always open
        if (i === 1 && age >= 55) relevant = true;
        if (i === 2 && hasChronic) relevant = true;
        if (i === 3 && sex === "F" && age >= 15 && age <= 49) relevant = true;
        return <VaccineGroup key={i} group={group} defaultOpen={relevant} />;
      })}

      <div style={{ textAlign: "center", padding: "16px 20px", fontSize: 13, color: COLORS.textSec, lineHeight: 1.6 }}>
        Consulte con su médico para verificar qué vacunas le corresponden según su historial.
        Las vacunas del esquema nacional son <strong>gratuitas</strong> en todos los centros de salud del MINSA y la CSS.
      </div>
    </div>
  );
}
