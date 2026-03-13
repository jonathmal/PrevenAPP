import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, BigButton, LoadingSpinner, SectionTitle, COLORS } from "../components/UI";

// ─── Pill selector ──────────────────────────────────────────
function PillSelect({ options, value, onChange, columns = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(" + columns + ", 1fr)", gap: 6 }}>
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const isActive = value === val;
        return (
          <button key={val} onClick={() => onChange(val)} style={{
            padding: "10px 6px", borderRadius: 10, border: "none",
            background: isActive ? COLORS.primary : COLORS.divider,
            color: isActive ? "#fff" : COLORS.textSec,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            transition: "all 0.15s",
          }}>{label}</button>
        );
      })}
    </div>
  );
}

// ─── Editable list with add/remove ──────────────────────────
function EditableList({ items, onUpdate, renderItem, addFields, addLabel, emptyMessage, badgeBg, badgeColor }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({});

  const handleAdd = () => {
    const merged = { ...newItem, selfReported: true, validated: false };
    onUpdate([...items, merged]);
    setNewItem({});
    setAdding(false);
  };

  const handleRemove = (idx) => {
    onUpdate(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {items.length === 0 && !adding && (
        <div style={{ fontSize: 13, color: COLORS.textSec, padding: "8px 0", textAlign: "center" }}>
          {emptyMessage || "No hay registros aún"}
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 6,
          borderRadius: 10, background: badgeBg || COLORS.divider,
        }}>
          <div style={{ flex: 1 }}>{renderItem(item)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {item.validated && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: COLORS.greenBg, color: COLORS.green }}>✓ Validado</span>
            )}
            {item.selfReported && !item.validated && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: COLORS.yellowBg, color: COLORS.yellow }}>Pendiente</span>
            )}
            <button onClick={() => handleRemove(i)} style={{
              background: "none", border: "none", fontSize: 18,
              color: badgeColor || COLORS.red, cursor: "pointer", padding: "0 2px",
            }}>×</button>
          </div>
        </div>
      ))}

      {!adding ? (
        <button onClick={() => setAdding(true)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%", padding: "10px 12px", borderRadius: 10,
          border: "2px dashed " + COLORS.border, background: "none",
          fontSize: 13, fontWeight: 600, color: COLORS.primary, cursor: "pointer",
          marginTop: 4,
        }}>
          + {addLabel || "Agregar"}
        </button>
      ) : (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: COLORS.primaryLight, marginTop: 4 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {addFields.map(field => (
              <input key={field.key} type={field.type || "text"} value={newItem[field.key] || ""}
                onChange={e => setNewItem({ ...newItem, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={{
                  flex: field.flex || 1, padding: "8px 10px", borderRadius: 8,
                  border: "2px solid " + COLORS.border, fontSize: 13,
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                  minWidth: 0,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { setAdding(false); setNewItem({}); }} style={{
              flex: 1, padding: 8, borderRadius: 8, border: "2px solid " + COLORS.border,
              background: "#fff", fontSize: 13, fontWeight: 600, color: COLORS.textSec, cursor: "pointer",
            }}>Cancelar</button>
            <button onClick={handleAdd} disabled={!addFields.some(f => f.required && newItem[f.key])} style={{
              flex: 1, padding: 8, borderRadius: 8, border: "none",
              background: addFields.some(f => f.required && newItem[f.key]) ? COLORS.primary : COLORS.border,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Agregar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────
function Section({ title, icon, children, color }) {
  return (
    <Card style={{ marginBottom: 14, padding: "16px 14px", borderTop: "3px solid " + (color || COLORS.primary) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>{title}</span>
      </div>
      {children}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PROFILE PAGE
// ═══════════════════════════════════════════════════════════
export default function ProfilePage() {
  const { user, patient } = useAuth();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (patient) {
      setData({
        bloodType: patient.bloodType || "",
        height: patient.height || "",
        weight: patient.weight || "",
        waistCircumference: patient.waistCircumference || "",
        diagnoses: patient.diagnoses || [],
        familyHistory: patient.familyHistory || [],
        allergies: patient.allergies || [],
        surgicalHistory: patient.surgicalHistory || [],
        riskFactors: patient.riskFactors || {},
        emergencyContact: patient.emergencyContact || {},
        address: patient.address || "",
      });
    }
  }, [patient]);

  const save = async (field, value) => {
    setSaving(true);
    try {
      await api.put("/auth/me/patient", { [field]: value });
      setToast("Guardado ✓");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setToast("Error: " + err.message);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    save(field, value);
  };

  if (!data) return <LoadingSpinner text="Cargando perfil..." />;

  const age = patient?.age;
  const bmi = data.height && data.weight ? (data.weight / Math.pow(data.height / 100, 2)).toFixed(1) : null;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 300, padding: "10px 20px", borderRadius: 12,
          background: toast.includes("Error") ? COLORS.redBg : COLORS.greenBg,
          color: toast.includes("Error") ? COLORS.red : COLORS.green,
          fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}>
          {toast}
        </div>
      )}

      {/* ─── Identity header ─────────────────────────────────── */}
      <Card className="fade-in" style={{
        marginBottom: 14, padding: "18px 16px", textAlign: "center",
        background: "linear-gradient(135deg, " + COLORS.primaryLight + ", #fff)",
        borderTop: "4px solid " + COLORS.primary,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 10px",
          background: COLORS.primary, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 24, color: "#fff", fontWeight: 800,
        }}>{user?.name?.charAt(0) || "P"}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>
          {user?.name}
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 2 }}>
          {age ? age + " años · " : ""}{patient?.sex === "M" ? "Masculino" : "Femenino"}
          {patient?.studyId ? " · " + patient.studyId : ""}
        </div>
        {data.bloodType && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8,
            padding: "4px 14px", borderRadius: 20,
            background: COLORS.redBg, color: COLORS.red, fontSize: 14, fontWeight: 800,
          }}>
            🩸 {data.bloodType}
          </div>
        )}
        <div style={{ fontSize: 11, color: COLORS.textSec, marginTop: 8, fontStyle: "italic" }}>
          Los datos que usted reporte aquí serán validados por su médico
        </div>
      </Card>

      {/* ─── Tipo de sangre ──────────────────────────────────── */}
      <Section title="Tipo de Sangre" icon="🩸" color="#DC2626">
        <PillSelect
          options={["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}
          value={data.bloodType}
          onChange={v => updateField("bloodType", v)}
        />
        {!data.bloodType && (
          <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 8, textAlign: "center" }}>
            Seleccione su tipo de sangre si lo conoce
          </div>
        )}
      </Section>

      {/* ─── Antropometría ───────────────────────────────────── */}
      <Section title="Medidas Corporales" icon="📏" color={COLORS.primary}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[
            { key: "height", label: "Talla (cm)", placeholder: "158" },
            { key: "weight", label: "Peso (kg)", placeholder: "78" },
            { key: "waistCircumference", label: "Cintura (cm)", placeholder: "94" },
          ].map(f => (
            <div key={f.key} style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textSec, marginBottom: 4, textTransform: "uppercase" }}>{f.label}</label>
              <input type="number" value={data[f.key] || ""} placeholder={f.placeholder}
                onChange={e => setData(prev => ({ ...prev, [f.key]: e.target.value }))}
                onBlur={e => { if (e.target.value) save(f.key, parseFloat(e.target.value)); }}
                style={{
                  width: "100%", padding: "10px 8px", borderRadius: 10,
                  border: "2px solid " + COLORS.border, fontSize: 16, fontWeight: 700,
                  textAlign: "center", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }} />
            </div>
          ))}
        </div>
        {bmi && (
          <div style={{
            textAlign: "center", padding: "8px 12px", borderRadius: 10,
            background: bmi < 25 ? COLORS.greenBg : bmi < 30 ? COLORS.yellowBg : COLORS.redBg,
            color: bmi < 25 ? COLORS.green : bmi < 30 ? COLORS.yellow : COLORS.red,
            fontSize: 14, fontWeight: 800,
          }}>
            IMC: {bmi} — {bmi < 18.5 ? "Bajo peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidad"}
          </div>
        )}
      </Section>

      {/* ─── APP ─────────────────────────────────────────────── */}
      <Section title="Antecedentes Personales Patológicos" icon="🏥" color="#DC2626">
        <EditableList
          items={data.diagnoses}
          onUpdate={v => updateField("diagnoses", v)}
          badgeBg={COLORS.redBg}
          badgeColor={COLORS.red}
          emptyMessage="No ha reportado enfermedades"
          addLabel="Agregar enfermedad"
          addFields={[
            { key: "name", placeholder: "Ej: Hipertensión arterial", required: true, flex: 2 },
            { key: "code", placeholder: "CIE-10", flex: 1 },
          ]}
          renderItem={item => (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{item.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textSec }}>
                {item.code ? item.code + " · " : ""}
                {item.dateOfDiagnosis ? "Dx: " + new Date(item.dateOfDiagnosis).getFullYear() : ""}
              </div>
            </div>
          )}
        />
      </Section>

      {/* ─── Alergias ────────────────────────────────────────── */}
      <Section title="Alergias" icon="⚠️" color="#F59E0B">
        <EditableList
          items={data.allergies}
          onUpdate={v => updateField("allergies", v)}
          badgeBg={COLORS.yellowBg}
          badgeColor={COLORS.yellow}
          emptyMessage="No ha reportado alergias"
          addLabel="Agregar alergia"
          addFields={[
            { key: "name", placeholder: "Ej: Penicilina", required: true, flex: 2 },
            { key: "severity", placeholder: "leve/moderada/severa", flex: 1 },
          ]}
          renderItem={item => (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{item.name}</div>
              {item.severity && <div style={{ fontSize: 11, color: COLORS.textSec }}>Severidad: {item.severity}</div>}
            </div>
          )}
        />
      </Section>

      {/* ─── Cirugías previas ────────────────────────────────── */}
      <Section title="Cirugías Previas" icon="🔪" color="#8B5CF6">
        <EditableList
          items={data.surgicalHistory}
          onUpdate={v => updateField("surgicalHistory", v)}
          badgeBg="#EDE9FE"
          badgeColor="#8B5CF6"
          emptyMessage="No ha reportado cirugías"
          addLabel="Agregar cirugía"
          addFields={[
            { key: "procedure", placeholder: "Ej: Apendicectomía", required: true, flex: 2 },
            { key: "year", placeholder: "Año", type: "number", flex: 1 },
          ]}
          renderItem={item => (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{item.procedure}</div>
              {item.year && <div style={{ fontSize: 11, color: COLORS.textSec }}>Año: {item.year}</div>}
              {item.notes && <div style={{ fontSize: 11, color: COLORS.textSec }}>{item.notes}</div>}
            </div>
          )}
        />
      </Section>

      {/* ─── APF ─────────────────────────────────────────────── */}
      <Section title="Antecedentes Familiares" icon="👨‍👩‍👧‍👦" color="#6366F1">
        <EditableList
          items={data.familyHistory}
          onUpdate={v => updateField("familyHistory", v)}
          badgeBg="#EDE9FE"
          badgeColor="#6366F1"
          emptyMessage="No ha reportado antecedentes familiares"
          addLabel="Agregar antecedente"
          addFields={[
            { key: "condition", placeholder: "Ej: Diabetes", required: true, flex: 2 },
            { key: "relative", placeholder: "Parentesco", required: true, flex: 1 },
          ]}
          renderItem={item => (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{item.condition}</div>
              <div style={{ fontSize: 11, color: COLORS.textSec }}>{item.relative}{item.notes ? " — " + item.notes : ""}</div>
            </div>
          )}
        />
      </Section>

      {/* ─── Factores de riesgo ──────────────────────────────── */}
      <Section title="Hábitos y Estilo de Vida" icon="🏃" color={COLORS.primary}>
        {/* Smoking */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSec, marginBottom: 6 }}>🚬 Tabaquismo</label>
          <PillSelect
            options={[
              { value: "never", label: "Nunca" },
              { value: "former", label: "Exfumador" },
              { value: "current", label: "Activo" },
            ]}
            value={data.riskFactors.smoking || "never"}
            onChange={v => updateField("riskFactors", { ...data.riskFactors, smoking: v })}
            columns={3}
          />
          {(data.riskFactors.smoking === "current" || data.riskFactors.smoking === "former") && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: COLORS.textSec }}>Cigarrillos/día</label>
                <input type="number" value={data.riskFactors.cigarettesPerDay || ""}
                  onChange={e => setData(prev => ({ ...prev, riskFactors: { ...prev.riskFactors, cigarettesPerDay: parseInt(e.target.value) || 0 } }))}
                  onBlur={() => save("riskFactors", data.riskFactors)}
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "2px solid " + COLORS.border, fontSize: 14, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: COLORS.textSec }}>Años fumando</label>
                <input type="number" value={data.riskFactors.yearsSmoked || ""}
                  onChange={e => setData(prev => ({ ...prev, riskFactors: { ...prev.riskFactors, yearsSmoked: parseInt(e.target.value) || 0 } }))}
                  onBlur={() => save("riskFactors", data.riskFactors)}
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "2px solid " + COLORS.border, fontSize: 14, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
          )}
        </div>

        {/* Alcohol */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSec, marginBottom: 6 }}>🍺 Consumo de alcohol</label>
          <PillSelect
            options={[
              { value: "never", label: "Nunca" },
              { value: "occasional", label: "Ocasional" },
              { value: "moderate", label: "Moderado" },
              { value: "heavy", label: "Frecuente" },
            ]}
            value={data.riskFactors.alcohol || "never"}
            onChange={v => updateField("riskFactors", { ...data.riskFactors, alcohol: v })}
          />
        </div>

        {/* Exercise */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSec, marginBottom: 6 }}>🏃 Actividad física</label>
          <PillSelect
            options={[
              { value: "sedentary", label: "Sedentario" },
              { value: "light", label: "Leve" },
              { value: "moderate", label: "Moderada" },
              { value: "active", label: "Activo" },
            ]}
            value={data.riskFactors.exercise || "sedentary"}
            onChange={v => updateField("riskFactors", { ...data.riskFactors, exercise: v })}
          />
          {(data.riskFactors.exercise === "moderate" || data.riskFactors.exercise === "active") && (
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, color: COLORS.textSec }}>Minutos por semana</label>
              <input type="number" value={data.riskFactors.exerciseMinutesPerWeek || ""}
                onChange={e => setData(prev => ({ ...prev, riskFactors: { ...prev.riskFactors, exerciseMinutesPerWeek: parseInt(e.target.value) || 0 } }))}
                onBlur={() => save("riskFactors", data.riskFactors)}
                placeholder="150"
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "2px solid " + COLORS.border, fontSize: 14, textAlign: "center", outline: "none", boxSizing: "border-box", marginTop: 4 }} />
            </div>
          )}
        </div>

        {/* Diet */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSec, marginBottom: 6 }}>🥗 Calidad de alimentación</label>
          <PillSelect
            options={[
              { value: "poor", label: "Mala" },
              { value: "regular", label: "Regular" },
              { value: "good", label: "Buena" },
              { value: "excellent", label: "Excelente" },
            ]}
            value={data.riskFactors.diet || "regular"}
            onChange={v => updateField("riskFactors", { ...data.riskFactors, diet: v })}
          />
        </div>
      </Section>

      {/* ─── Contacto de emergencia ──────────────────────────── */}
      <Section title="Contacto de Emergencia" icon="📞" color="#1E3A5F">
        {[
          { key: "name", label: "Nombre completo", placeholder: "Ej: Juan Pérez" },
          { key: "phone", label: "Teléfono", placeholder: "Ej: 6700-1234", type: "tel" },
          { key: "relationship", label: "Parentesco", placeholder: "Ej: Esposo, Hija, Hermano" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textSec, marginBottom: 4, textTransform: "uppercase" }}>{f.label}</label>
            <input type={f.type || "text"} value={data.emergencyContact?.[f.key] || ""}
              onChange={e => setData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, [f.key]: e.target.value } }))}
              onBlur={() => save("emergencyContact", data.emergencyContact)}
              placeholder={f.placeholder}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: "2px solid " + COLORS.border, fontSize: 14,
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }} />
          </div>
        ))}
      </Section>

      {/* ─── Footer note ─────────────────────────────────────── */}
      <div style={{
        textAlign: "center", padding: "16px 20px", marginBottom: 20,
        fontSize: 12, color: COLORS.textSec, lineHeight: 1.6,
      }}>
        <div style={{ fontSize: 20, marginBottom: 4 }}>📋</div>
        Los datos que usted autoreporte serán revisados y validados
        por su médico tratante en la próxima consulta.
        Las etiquetas <span style={{ fontWeight: 700, color: COLORS.yellow }}>Pendiente</span> cambiarán a{" "}
        <span style={{ fontWeight: 700, color: COLORS.green }}>✓ Validado</span> tras la verificación médica.
      </div>
    </div>
  );
}
