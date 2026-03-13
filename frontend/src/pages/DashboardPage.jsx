import { useState, useEffect } from "react";
import api from "../services/api";
import { Card, BigButton, LoadingSpinner, SectionTitle, StatusBadge, EmptyState, COLORS, STATUS, formatDate } from "../components/UI";

// ═══════════════════════════════════════════════════════════
// PATIENT LIST VIEW (default)
// ═══════════════════════════════════════════════════════════
function PatientList({ patients, summary, onSelectPatient }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, alert, controlled

  const filtered = patients.filter(p => {
    const nameMatch = p.patient.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "alert") return nameMatch && p.alertCount > 0;
    if (filter === "controlled") return nameMatch && p.alertCount === 0;
    return nameMatch;
  });

  return (
    <div>
      {/* Summary cards */}
      <div className="fade-in" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { val: summary.totalPatients, label: "Pacientes", bg: COLORS.primaryLight, color: COLORS.primary },
          { val: summary.patientsInAlert, label: "En alerta", bg: COLORS.redBg, color: COLORS.red },
          { val: summary.avgAdherence + "%", label: "Adherencia", bg: COLORS.greenBg, color: COLORS.green },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: 14, borderRadius: 14, background: s.bg, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12, position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: 13, fontSize: 16, opacity: 0.4 }}>🔍</span>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar paciente por nombre..."
          style={{
            width: "100%", padding: "12px 12px 12px 40px", borderRadius: 12,
            border: "2px solid " + COLORS.border, fontSize: 14, fontWeight: 500,
            outline: "none", boxSizing: "border-box", fontFamily: "inherit",
          }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { key: "all", label: "Todos", count: patients.length },
          { key: "alert", label: "En alerta", count: patients.filter(p => p.alertCount > 0).length },
          { key: "controlled", label: "Controlados", count: patients.filter(p => p.alertCount === 0).length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            flex: 1, padding: "8px 6px", borderRadius: 10, border: "none",
            background: filter === f.key ? "#1E3A5F" : COLORS.divider,
            color: filter === f.key ? "#fff" : COLORS.textSec,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Patient list */}
      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && (
          <EmptyState icon="🔍" message="No se encontraron pacientes" />
        )}
        {filtered.map((p, i) => {
          const alertColor = p.alertCount > 0 ? COLORS.red : p.vitals.bp?.status === "yellow" ? COLORS.yellow : COLORS.green;
          return (
            <Card key={i} onClick={() => onSelectPatient(p.patient.id)} style={{ padding: 14, borderLeft: "4px solid " + alertColor }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{p.patient.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSec }}>
                    {p.patient.age} años · {p.patient.sex === "M" ? "♂" : "♀"}
                    {p.patient.diagnoses?.length > 0 && " · " + p.patient.diagnoses.join(", ")}
                  </div>
                </div>
                {p.alertCount > 0 && (
                  <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: COLORS.redBg, color: COLORS.red }}>
                    {p.alertCount} alerta{p.alertCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {p.vitals.bp && (
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: STATUS[p.vitals.bp.status]?.bg || COLORS.divider, textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: STATUS[p.vitals.bp.status]?.color }}>PA</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: STATUS[p.vitals.bp.status]?.color }}>{p.vitals.bp.value}</div>
                  </div>
                )}
                {p.vitals.glucose && (
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: STATUS[p.vitals.glucose.status]?.bg || COLORS.divider, textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: STATUS[p.vitals.glucose.status]?.color }}>Glucosa</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: STATUS[p.vitals.glucose.status]?.color }}>{p.vitals.glucose.value}</div>
                  </div>
                )}
                {p.adherence !== null && (
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: p.adherence >= 80 ? COLORS.greenBg : p.adherence >= 60 ? COLORS.yellowBg : COLORS.redBg, textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: p.adherence >= 80 ? COLORS.green : p.adherence >= 60 ? COLORS.yellow : COLORS.red }}>Adherencia</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: p.adherence >= 80 ? COLORS.green : p.adherence >= 60 ? COLORS.yellow : COLORS.red }}>{p.adherence}%</div>
                  </div>
                )}
                {p.overdueScreenings > 0 && (
                  <div style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: COLORS.yellowBg, textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.yellow }}>Tamizajes</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.yellow }}>{p.overdueScreenings}</div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PATIENT DETAIL VIEW
// ═══════════════════════════════════════════════════════════
function PatientDetail({ patientId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("screenings");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPatientDetail(patientId);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [patientId]);

  const handleCompleteScreening = async (screeningId, result, dateStr) => {
    setSaving(true);
    try {
      await api.updateScreeningStatus(screeningId, {
        lastDone: dateStr || new Date().toISOString(),
        result: result || "",
      });
      setResultForm(null);
      load();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  // Result form state: { screeningId, screeningName }
  const [resultForm, setResultForm] = useState(null);
  const [resultText, setResultText] = useState("");
  const [resultDate, setResultDate] = useState(new Date().toISOString().split("T")[0]);

  const handleUpdatePatient = async (field, value) => {
    setSaving(true);
    try {
      await api.updatePatient(patientId, { [field]: value });
      load();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Cargando paciente..." />;
  if (!data) return null;

  const { patient, vitals, medications, screenings, adherence7d, tcc } = data;
  const p = patient;
  const diag = p.diagnoses?.filter(d => d.isActive) || [];
  const fhx = p.familyHistory || [];
  const bmi = p.bmi || (p.height && p.weight ? (p.weight / Math.pow(p.height / 100, 2)).toFixed(1) : null);

  const screeningsByStatus = {
    red: screenings.filter(s => s.status === "red"),
    yellow: screenings.filter(s => s.status === "yellow"),
    green: screenings.filter(s => s.status === "green"),
  };

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 0", marginBottom: 12,
        background: "none", border: "none", fontSize: 14, fontWeight: 600, color: COLORS.primary, cursor: "pointer",
      }}>
        ← Volver a la lista
      </button>

      {/* Patient header */}
      <Card style={{ marginBottom: 16, padding: 16, borderTop: "4px solid #1E3A5F" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#1E3A5F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", fontWeight: 800 }}>
            {p.user?.name?.charAt(0) || "P"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>{p.user?.name}</div>
            <div style={{ fontSize: 13, color: COLORS.textSec }}>
              {p.age} años · {p.sex === "M" ? "Masculino" : "Femenino"} · {p.user?.cedula}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {p.height && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: COLORS.primaryLight, color: COLORS.primary }}>📏 {p.height} cm</span>}
          {p.weight && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: COLORS.primaryLight, color: COLORS.primary }}>⚖️ {p.weight} kg</span>}
          {bmi && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: bmi < 25 ? COLORS.greenBg : bmi < 30 ? COLORS.yellowBg : COLORS.redBg, color: bmi < 25 ? COLORS.green : bmi < 30 ? COLORS.yellow : COLORS.red }}>IMC {bmi}</span>}
          {p.waistCircumference && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: COLORS.primaryLight, color: COLORS.primary }}>📐 CC: {p.waistCircumference} cm</span>}
          {adherence7d !== null && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: adherence7d >= 80 ? COLORS.greenBg : COLORS.yellowBg, color: adherence7d >= 80 ? COLORS.green : COLORS.yellow }}>💊 Adherencia 7d: {adherence7d}%</span>}
        </div>

        {/* APP badges */}
        {diag.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSec, marginBottom: 4, textTransform: "uppercase" }}>APP</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {diag.map((dx, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: COLORS.redBg, color: COLORS.red }}>{dx.name}</span>
              ))}
            </div>
          </div>
        )}
        {fhx.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSec, marginBottom: 4, textTransform: "uppercase" }}>APF</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {fhx.map((fh, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "#EDE9FE", color: "#6366F1" }}>{fh.condition} ({fh.relative})</span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { key: "screenings", label: "Tamizajes", count: screenings.length },
          { key: "vitals", label: "Vitales" },
          { key: "meds", label: "Meds", count: medications.length },
          { key: "edit", label: "Editar", icon: "✏️" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "10px 4px", borderRadius: 10, border: "none",
            background: tab === t.key ? "#1E3A5F" : COLORS.divider,
            color: tab === t.key ? "#fff" : COLORS.textSec,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            {t.icon || ""}{t.label}{t.count !== undefined ? " (" + t.count + ")" : ""}
          </button>
        ))}
      </div>

      {/* ─── Screenings tab ──────────────────────────────── */}
      {tab === "screenings" && (
        <div>
          {["red", "yellow", "green"].map(status => {
            const items = screeningsByStatus[status];
            if (!items || items.length === 0) return null;
            const labels = { red: "Vencidos", yellow: "Próximos a vencer", green: "Al día" };
            const colors = { red: COLORS.red, yellow: COLORS.yellow, green: COLORS.green };
            return (
              <div key={status} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors[status], marginBottom: 8 }}>
                  {STATUS[status]?.icon} {labels[status]} ({items.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map(s => (
                    <Card key={s._id} style={{ padding: 12, borderLeft: "3px solid " + colors[status] }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{s.name}</div>
                          {s.reason && <div style={{ fontSize: 11, color: COLORS.primary, marginTop: 2 }}>💡 {s.reason}</div>}
                          {s.lastDone && <div style={{ fontSize: 11, color: COLORS.textSec, marginTop: 2 }}>Último: {formatDate(s.lastDone)}</div>}
                          {s.source && <div style={{ fontSize: 10, color: COLORS.textSec, fontStyle: "italic" }}>{s.source}</div>}
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      {status !== "green" && (
                        <button onClick={() => { setResultForm({ id: s._id, name: s.name }); setResultText(""); setResultDate(new Date().toISOString().split("T")[0]); }} disabled={saving}
                          style={{
                            marginTop: 8, padding: "8px 12px", borderRadius: 8, border: "none",
                            background: COLORS.green, color: "#fff", fontSize: 12, fontWeight: 700,
                            cursor: saving ? "not-allowed" : "pointer", width: "100%",
                          }}>
                          📝 Registrar resultado
                        </button>
                      )}
                      {s.result && (
                        <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, background: COLORS.greenBg, fontSize: 12, color: COLORS.green }}>
                          <strong>Resultado:</strong> {s.result}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Result input form modal */}
          {resultForm && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
              onClick={() => setResultForm(null)}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>📝 Registrar Resultado</div>
                <div style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600, marginBottom: 16 }}>{resultForm.name}</div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSec, marginBottom: 4 }}>FECHA DE REALIZACIÓN</label>
                  <input type="date" value={resultDate} onChange={e => setResultDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid " + COLORS.border, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSec, marginBottom: 4 }}>RESULTADO / HALLAZGOS</label>
                  <textarea value={resultText} onChange={e => setResultText(e.target.value)}
                    placeholder="Ej: Normal, sin hallazgos patológicos" rows={3}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid " + COLORS.border, fontSize: 14, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>

                <BigButton onClick={() => handleCompleteScreening(resultForm.id, resultText, resultDate)} disabled={saving} icon="✓" color={COLORS.green}>
                  {saving ? "Guardando..." : "Guardar y marcar como realizado"}
                </BigButton>
                <button onClick={() => setResultForm(null)} style={{ width: "100%", padding: 12, marginTop: 8, borderRadius: 10, border: "2px solid " + COLORS.border, background: "#fff", fontSize: 14, fontWeight: 600, color: COLORS.textSec, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Vitals tab ──────────────────────────────────── */}
      {tab === "vitals" && (
        <div>
          <SectionTitle>Últimas presiones arteriales</SectionTitle>
          {vitals.bp.length === 0 ? <div style={{ fontSize: 13, color: COLORS.textSec, marginBottom: 16 }}>Sin registros</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
              {vitals.bp.slice(0, 10).map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: STATUS[r.status]?.bg || COLORS.divider }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: STATUS[r.status]?.color }}>{r.systolic}/{r.diastolic} mmHg</span>
                  <span style={{ fontSize: 11, color: COLORS.textSec }}>{new Date(r.measuredAt).toLocaleDateString("es-PA", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>
          )}
          <SectionTitle>Últimas glucosas</SectionTitle>
          {vitals.glucose.length === 0 ? <div style={{ fontSize: 13, color: COLORS.textSec }}>Sin registros</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {vitals.glucose.slice(0, 10).map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: STATUS[r.status]?.bg || COLORS.divider }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: STATUS[r.status]?.color }}>{r.value} mg/dL ({r.type === "fasting" ? "ayunas" : "postprandial"})</span>
                  <span style={{ fontSize: 11, color: COLORS.textSec }}>{new Date(r.measuredAt).toLocaleDateString("es-PA", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Meds tab ────────────────────────────────────── */}
      {tab === "meds" && (
        <div>
          {medications.length === 0 ? <EmptyState icon="💊" message="Sin medicamentos registrados" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {medications.map((m, i) => (
                <Card key={m._id || i} style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{m.name} {m.dose}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSec }}>{m.frequency} · {m.schedules?.join(", ")} {m.indication ? " · " + m.indication : ""}</div>
                </Card>
              ))}
            </div>
          )}
          {tcc?.progress && (
            <div style={{ marginTop: 20 }}>
              <SectionTitle>Progreso TCC</SectionTitle>
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 14, color: COLORS.text }}>
                  🧠 Fase {tcc.progress.currentPhase}, Semana {tcc.progress.currentWeek}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 4 }}>
                  ABC: {tcc.progress.totalABCRecords} · Metas: {tcc.progress.totalGoalsCompleted}/{tcc.progress.totalGoalsSet} · H/S: {tcc.progress.totalHungerScales}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ─── Edit tab ────────────────────────────────────── */}
      {tab === "edit" && (
        <EditPatientForm patient={p} onSave={handleUpdatePatient} saving={saving} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EDIT PATIENT FORM
// ═══════════════════════════════════════════════════════════
function EditPatientForm({ patient, onSave, saving }) {
  const [height, setHeight] = useState(patient.height || "");
  const [weight, setWeight] = useState(patient.weight || "");
  const [waist, setWaist] = useState(patient.waistCircumference || "");
  const [smoking, setSmoking] = useState(patient.riskFactors?.smoking || "never");
  const [cpd, setCpd] = useState(patient.riskFactors?.cigarettesPerDay || "");
  const [years, setYears] = useState(patient.riskFactors?.yearsSmoked || "");
  const [newDx, setNewDx] = useState("");
  const [newDxCode, setNewDxCode] = useState("");
  const [newFh, setNewFh] = useState("");
  const [newFhRel, setNewFhRel] = useState("");

  const diag = patient.diagnoses || [];
  const fhx = patient.familyHistory || [];

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid " + COLORS.border, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSec, marginBottom: 4, textTransform: "uppercase" };

  return (
    <div>
      <SectionTitle>Antropometría</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Talla (cm)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Peso (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>CC (cm)</label>
          <input type="number" value={waist} onChange={e => setWaist(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <BigButton onClick={() => {
        const update = {};
        if (height) update.height = parseFloat(height);
        if (weight) update.weight = parseFloat(weight);
        if (waist) update.waistCircumference = parseFloat(waist);
        if (Object.keys(update).length) onSave("height", update.height); // triggers reload
        if (update.weight) onSave("weight", update.weight);
        if (update.waistCircumference) onSave("waistCircumference", update.waistCircumference);
      }} disabled={saving} icon="💾" color="#1E3A5F">
        Guardar antropometría
      </BigButton>

      <div style={{ height: 1, background: COLORS.divider, margin: "20px 0" }} />

      <SectionTitle>Hábitos tóxicos</SectionTitle>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Tabaquismo</label>
        <div style={{ display: "flex", gap: 6 }}>
          {[["never", "Nunca"], ["former", "Exfumador"], ["current", "Activo"]].map(([val, label]) => (
            <button key={val} onClick={() => setSmoking(val)} style={{
              flex: 1, padding: 10, borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: smoking === val ? (val === "current" ? COLORS.redBg : val === "former" ? COLORS.yellowBg : COLORS.greenBg) : COLORS.divider,
              color: smoking === val ? (val === "current" ? COLORS.red : val === "former" ? COLORS.yellow : COLORS.green) : COLORS.textSec,
            }}>{label}</button>
          ))}
        </div>
      </div>
      {(smoking === "current" || smoking === "former") && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Cig/día</label>
            <input type="number" value={cpd} onChange={e => setCpd(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Años fumando</label>
            <input type="number" value={years} onChange={e => setYears(e.target.value)} style={inputStyle} />
          </div>
        </div>
      )}
      <BigButton onClick={() => onSave("riskFactors", { smoking, cigarettesPerDay: parseInt(cpd) || 0, yearsSmoked: parseInt(years) || 0 })} disabled={saving} icon="💾" color="#1E3A5F">
        Guardar hábitos
      </BigButton>

      <div style={{ height: 1, background: COLORS.divider, margin: "20px 0" }} />

      <SectionTitle>Agregar diagnóstico (APP)</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input type="text" value={newDx} onChange={e => setNewDx(e.target.value)} placeholder="Ej: Diabetes mellitus tipo 2" style={{ ...inputStyle, flex: 2 }} />
        <input type="text" value={newDxCode} onChange={e => setNewDxCode(e.target.value)} placeholder="CIE-10" style={{ ...inputStyle, flex: 1 }} />
      </div>
      <BigButton onClick={() => {
        if (!newDx) return;
        const updated = [...diag, { name: newDx, code: newDxCode, dateOfDiagnosis: new Date(), isActive: true }];
        onSave("diagnoses", updated);
        setNewDx(""); setNewDxCode("");
      }} disabled={saving || !newDx} icon="+" color="#1E3A5F">Agregar APP</BigButton>

      <div style={{ height: 1, background: COLORS.divider, margin: "20px 0" }} />

      <SectionTitle>Agregar antecedente familiar (APF)</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input type="text" value={newFh} onChange={e => setNewFh(e.target.value)} placeholder="Ej: Ca de mama" style={{ ...inputStyle, flex: 2 }} />
        <input type="text" value={newFhRel} onChange={e => setNewFhRel(e.target.value)} placeholder="Parentesco" style={{ ...inputStyle, flex: 1 }} />
      </div>
      <BigButton onClick={() => {
        if (!newFh || !newFhRel) return;
        const updated = [...fhx, { condition: newFh, relative: newFhRel }];
        onSave("familyHistory", updated);
        setNewFh(""); setNewFhRel("");
      }} disabled={saving || !newFh || !newFhRel} icon="+" color="#1E3A5F">Agregar APF</BigButton>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getDashboardOverview();
        setData(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadingSpinner text="Cargando dashboard..." />;
  if (!data) return null;

  if (selectedPatient) {
    return <PatientDetail patientId={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return <PatientList patients={data.patients} summary={data.summary} onSelectPatient={setSelectedPatient} />;
}
