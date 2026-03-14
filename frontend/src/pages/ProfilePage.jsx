import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner, COLORS } from "../components/UI";

const T = { text: "#1E293B", sub: "#64748B", muted: "#94A3B8", border: "#E2E8F0", div: "#F1F5F9", card: "#fff", r: 14 };
const card = { background: T.card, borderRadius: T.r, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)", overflow: "hidden" };
const iS = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid " + T.border, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

function Section({ title, icon, color, children }) {
  return (
    <div style={{ ...card, marginBottom: 10 }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid " + T.div, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</span>
      </div>
      <div style={{ padding: "12px 16px" }}>{children}</div>
    </div>
  );
}

function EditableList({ items, onUpdate, renderItem, addFields, addLabel, emptyMsg, bg, color }) {
  const [adding, setAdding] = useState(false); const [nw, setNw] = useState({});
  return (
    <div>
      {items.length === 0 && !adding && <div style={{ fontSize: 14, color: T.muted, textAlign: "center", padding: "8px 0" }}>{emptyMsg}</div>}
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 4, borderRadius: 10, background: bg || T.div }}>
          <div style={{ flex: 1 }}>{renderItem(it)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {it.validated && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#DCFCE7", color: "#16A34A" }}>✓</span>}
            {it.selfReported && !it.validated && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#FEF3C7", color: "#D97706" }}>Pendiente</span>}
            <button onClick={() => onUpdate(items.filter((_, j) => j !== i))} style={{ background: "none", border: "none", fontSize: 16, color: color || "#DC2626", cursor: "pointer" }}>×</button>
          </div>
        </div>
      ))}
      {!adding ? (
        <button onClick={() => setAdding(true)} style={{ width: "100%", padding: 10, marginTop: 4, borderRadius: 10, border: "2px dashed " + T.border, background: "none", fontSize: 13, fontWeight: 600, color: "#0A8A8F", cursor: "pointer" }}>+ {addLabel || "Agregar"}</button>
      ) : (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "#F0FDFA", marginTop: 4 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {addFields.map(f => <input key={f.key} type={f.type || "text"} value={nw[f.key] || ""} onChange={e => setNw({ ...nw, [f.key]: e.target.value })} placeholder={f.ph} style={{ ...iS, flex: f.flex || 1, minWidth: 0 }} />)}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { setAdding(false); setNw({}); }} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid " + T.border, background: "#fff", color: T.sub, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
            <button onClick={() => { if (addFields.some(f => f.req && nw[f.key])) { onUpdate([...items, { ...nw, selfReported: true, validated: false }]); setNw({}); setAdding(false); } }} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: "#0A8A8F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Agregar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PillSelect({ options, value, onChange, cols = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(" + cols + ", 1fr)", gap: 6 }}>
      {options.map(o => {
        const v = typeof o === "string" ? o : o.value, l = typeof o === "string" ? o : o.label;
        return <button key={v} onClick={() => onChange(v)} style={{ padding: "10px 6px", borderRadius: 10, border: "none", background: value === v ? "#0A8A8F" : T.div, color: value === v ? "#fff" : T.sub, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{l}</button>;
      })}
    </div>
  );
}

export default function ProfilePage() {
  const { user, patient } = useAuth();
  const [saving, setSaving] = useState(false); const [toast, setToast] = useState(null);
  const [d, setD] = useState(null);

  useEffect(() => {
    if (patient) setD({
      bloodType: patient.bloodType || "", height: patient.height || "", weight: patient.weight || "",
      waistCircumference: patient.waistCircumference || "", diagnoses: patient.diagnoses || [],
      familyHistory: patient.familyHistory || [], allergies: patient.allergies || [],
      surgicalHistory: patient.surgicalHistory || [], riskFactors: patient.riskFactors || {},
      emergencyContact: patient.emergencyContact || {}, address: patient.address || "",
    });
  }, [patient]);

  const save = async (field, value) => {
    setSaving(true);
    try { await api.put("/auth/me/patient", { [field]: value }); setToast("Guardado ✓"); setTimeout(() => setToast(null), 2000); }
    catch (e) { setToast("Error: " + e.message); setTimeout(() => setToast(null), 3000); }
    finally { setSaving(false); }
  };
  const upd = (f, v) => { setD(p => ({ ...p, [f]: v })); save(f, v); };

  if (!d) return <LoadingSpinner text="Cargando perfil..." />;
  const bmi = d.height && d.weight ? (d.weight / Math.pow(d.height / 100, 2)).toFixed(1) : null;

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 300, padding: "10px 20px", borderRadius: 12, background: toast.includes("Error") ? "#FEF2F2" : "#F0FDF4", color: toast.includes("Error") ? "#DC2626" : "#16A34A", fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>{toast}</div>}

      {/* Identity */}
      <div style={{ ...card, padding: 20, marginBottom: 14, textAlign: "center", background: "linear-gradient(135deg, #F0FDFA, #fff)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 10px", background: "linear-gradient(135deg, #064E52, #0A8A8F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff", fontWeight: 800 }}>{user?.name?.charAt(0)}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{user?.name}</div>
        <div style={{ fontSize: 14, color: T.sub, marginTop: 2 }}>{patient?.age} años · {patient?.sex === "M" ? "Masculino" : "Femenino"}</div>
        {d.bloodType && <div style={{ display: "inline-flex", marginTop: 8, padding: "4px 14px", borderRadius: 20, background: "#FEE2E2", color: "#DC2626", fontSize: 14, fontWeight: 800 }}>🩸 {d.bloodType}</div>}
        <div style={{ fontSize: 12, color: T.muted, marginTop: 8, fontStyle: "italic" }}>Sus datos serán validados por su médico</div>
      </div>

      <Section title="Tipo de Sangre" icon="🩸" color="#DC2626">
        <PillSelect options={["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]} value={d.bloodType} onChange={v => upd("bloodType", v)} />
      </Section>

      <Section title="Medidas Corporales" icon="📏">
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[{ k: "height", l: "Talla (cm)", ph: "158" }, { k: "weight", l: "Peso (kg)", ph: "78" }, { k: "waistCircumference", l: "Cintura (cm)", ph: "94" }].map(f => (
            <div key={f.k} style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: "block", marginBottom: 4 }}>{f.l}</label>
              <input type="number" value={d[f.k] || ""} placeholder={f.ph} onChange={e => setD(p => ({ ...p, [f.k]: e.target.value }))} onBlur={e => { if (e.target.value) save(f.k, parseFloat(e.target.value)); }}
                style={{ width: "100%", padding: "10px 8px", borderRadius: 10, border: "2px solid " + T.border, fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        {bmi && <div style={{ textAlign: "center", padding: "8px 12px", borderRadius: 10, background: bmi < 25 ? "#F0FDF4" : bmi < 30 ? "#FFFBEB" : "#FEF2F2", color: bmi < 25 ? "#16A34A" : bmi < 30 ? "#D97706" : "#DC2626", fontSize: 15, fontWeight: 800 }}>IMC {bmi} — {bmi < 18.5 ? "Bajo peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidad"}</div>}
      </Section>

      <Section title="Diagnósticos (APP)" icon="🏥">
        <EditableList items={d.diagnoses} onUpdate={v => upd("diagnoses", v)} bg="#FEF2F2" color="#DC2626" emptyMsg="Sin diagnósticos reportados" addLabel="Agregar diagnóstico"
          addFields={[{ key: "name", ph: "Ej: Hipertensión", req: true, flex: 2 }, { key: "code", ph: "CIE-10", flex: 1 }]}
          renderItem={it => <><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{it.name}</div>{it.code && <div style={{ fontSize: 12, color: T.sub }}>{it.code}</div>}</>} />
      </Section>

      <Section title="Alergias" icon="⚠️">
        <EditableList items={d.allergies} onUpdate={v => upd("allergies", v)} bg="#FFFBEB" color="#D97706" emptyMsg="Sin alergias" addLabel="Agregar alergia"
          addFields={[{ key: "name", ph: "Ej: Penicilina", req: true, flex: 2 }, { key: "severity", ph: "leve/moderada/severa", flex: 1 }]}
          renderItem={it => <><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{it.name}</div>{it.severity && <div style={{ fontSize: 12, color: T.sub }}>Severidad: {it.severity}</div>}</>} />
      </Section>

      <Section title="Cirugías Previas" icon="🔪">
        <EditableList items={d.surgicalHistory} onUpdate={v => upd("surgicalHistory", v)} bg="#F5F3FF" color="#6366F1" emptyMsg="Sin cirugías" addLabel="Agregar cirugía"
          addFields={[{ key: "procedure", ph: "Ej: Apendicectomía", req: true, flex: 2 }, { key: "year", ph: "Año", type: "number", flex: 1 }]}
          renderItem={it => <><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{it.procedure}</div>{it.year && <div style={{ fontSize: 12, color: T.sub }}>Año: {it.year}</div>}</>} />
      </Section>

      <Section title="Antecedentes Familiares" icon="👨‍👩‍👧‍👦">
        <EditableList items={d.familyHistory} onUpdate={v => upd("familyHistory", v)} bg="#F5F3FF" color="#6366F1" emptyMsg="Sin antecedentes" addLabel="Agregar antecedente"
          addFields={[{ key: "condition", ph: "Ej: Diabetes", req: true, flex: 2 }, { key: "relative", ph: "Parentesco", req: true, flex: 1 }]}
          renderItem={it => <><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{it.condition}</div><div style={{ fontSize: 12, color: T.sub }}>{it.relative}</div></>} />
      </Section>

      <Section title="Hábitos y Estilo de Vida" icon="🏃">
        {[
          { label: "🚬 Tabaquismo", field: "smoking", opts: [{ value: "never", label: "Nunca" }, { value: "former", label: "Exfumador" }, { value: "current", label: "Activo" }], cols: 3 },
          { label: "🍺 Alcohol", field: "alcohol", opts: [{ value: "never", label: "Nunca" }, { value: "occasional", label: "Ocasional" }, { value: "moderate", label: "Moderado" }, { value: "heavy", label: "Frecuente" }] },
          { label: "🏃 Actividad física", field: "exercise", opts: [{ value: "sedentary", label: "Sedentario" }, { value: "light", label: "Leve" }, { value: "moderate", label: "Moderada" }, { value: "active", label: "Activo" }] },
          { label: "🥗 Alimentación", field: "diet", opts: [{ value: "poor", label: "Mala" }, { value: "regular", label: "Regular" }, { value: "good", label: "Buena" }, { value: "excellent", label: "Excelente" }] },
        ].map((h, i) => (
          <div key={i} style={{ marginBottom: i < 3 ? 14 : 0 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, display: "block", marginBottom: 6 }}>{h.label}</label>
            <PillSelect options={h.opts} value={d.riskFactors[h.field] || h.opts[0].value} onChange={v => upd("riskFactors", { ...d.riskFactors, [h.field]: v })} cols={h.cols || 4} />
          </div>
        ))}
      </Section>

      <Section title="Contacto de Emergencia" icon="📞">
        {[
          { k: "name", l: "Nombre", ph: "Juan Pérez" },
          { k: "phone", l: "Teléfono", ph: "6700-1234", type: "tel" },
          { k: "relationship", l: "Parentesco", ph: "Esposo" },
        ].map(f => (
          <div key={f.k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: "block", marginBottom: 4 }}>{f.l}</label>
            <input type={f.type || "text"} value={d.emergencyContact?.[f.k] || ""} onChange={e => setD(p => ({ ...p, emergencyContact: { ...p.emergencyContact, [f.k]: e.target.value } }))} onBlur={() => save("emergencyContact", d.emergencyContact)} placeholder={f.ph} style={iS} />
          </div>
        ))}
      </Section>

      <div style={{ textAlign: "center", padding: "16px 20px 20px", fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
        📋 Los datos autoreportados serán validados por su médico.
      </div>
    </div>
  );
}
