const API_URL = import.meta.env.VITE_API_URL || "/api";

class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.token = localStorage.getItem("prevenapp_token");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("prevenapp_token", token);
    } else {
      localStorage.removeItem("prevenapp_token");
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }
      return data;
    } catch (err) {
      if (err.message === "Failed to fetch") {
        // Offline — return cached or throw friendly error
        throw new Error("Sin conexión a internet. Los datos se sincronizarán al reconectar.");
      }
      throw err;
    }
  }

  get(endpoint, params) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request(`${endpoint}${query}`);
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: "POST", body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: "PUT", body: JSON.stringify(body) });
  }

  del(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // ─── Auth ──────────────────────────────────────────────
  async login(cedula, password) {
    const res = await this.post("/auth/login", { cedula, password });
    this.setToken(res.data.token);
    return res.data;
  }

  async register(data) {
    const res = await this.post("/auth/register", data);
    this.setToken(res.data.token);
    return res.data;
  }

  async getMe() {
    return this.get("/auth/me");
  }

  giveConsent(version) { return this.post("/auth/consent", { version }); }
  revokeConsent() { return this.post("/auth/consent/revoke"); }
  changePassword(currentPassword, newPassword) { return this.post("/auth/change-password", { currentPassword, newPassword }); }
  forgotPassword(cedula) { return this.post("/auth/forgot-password", { cedula }); }
  resetPassword(cedula, securityAnswer, newPassword) { return this.post("/auth/reset-password", { cedula, securityAnswer, newPassword }); }
  completeOnboarding() { return this.post("/auth/onboarding/complete"); }
  updateMyProfile(data) { return this.put("/auth/me/profile", data); }
updatePatientProfile(data) { return this.put("/auth/me/patient", data); }
  // Doctor → patient management
  createPatient(data) { return this.post("/dashboard/patient", data); }
  deactivatePatient(patientId) { return this.put("/dashboard/patient/" + patientId + "/deactivate"); }
  resetPatientPassword(patientId) { return this.post("/dashboard/patient/" + patientId + "/reset-password"); }

  logout() {
    this.setToken(null);
    localStorage.removeItem("prevenapp_user");
    localStorage.removeItem("prevenapp_patientId");
  }

  // ─── Vitals ────────────────────────────────────────────
  recordBP(systolic, diastolic, heartRate) {
    return this.post("/vitals/bp", { systolic, diastolic, heartRate });
  }
  getBPHistory(days = 30) { return this.get("/vitals/bp", { days }); }
  getBPLatest() { return this.get("/vitals/bp/latest"); }
  getBPStats(days = 30) { return this.get("/vitals/bp/stats", { days }); }

  recordGlucose(value, type = "fasting") {
    return this.post("/vitals/glucose", { value, type });
  }
  getGlucoseHistory(days = 30) { return this.get("/vitals/glucose", { days }); }
  getGlucoseLatest() { return this.get("/vitals/glucose/latest"); }

  recordWeight(value) { return this.post("/vitals/weight", { value }); }
  getWeightHistory() { return this.get("/vitals/weight"); }

  // ─── Medications ───────────────────────────────────────
  getMedications() { return this.get("/medications"); }
  addMedication(data) { return this.post("/medications", data); }
  deleteMedication(id) { return this.del("/medications/" + id); }
  logMedDose(medicationId, scheduledTime, taken) {
    return this.post("/medications/log", { medicationId, scheduledTime, taken });
  }
  getMedLogToday() { return this.get("/medications/log/today"); }
  getAdherence(days = 7) { return this.get("/medications/log/adherence", { days }); }

  // ─── Screenings ────────────────────────────────────────
  getScreenings() { return this.get("/screenings"); }
  completeScreening(id, completedDate) {
    return this.put("/screenings/" + id + "/complete", { completedDate });
  }
  generateScreenings() { return this.post("/screenings/generate"); }

  // ─── Vaccinations ─────────────────────────────────────
  getVaccinations() { return this.get("/vaccinations"); }
  recordVaccination(data) { return this.post("/vaccinations", data); }
  removeVaccination(key) { return this.del("/vaccinations/" + key); }

  // ─── TCC ───────────────────────────────────────────────
  getTCCProgress() { return this.get("/tcc/progress"); }
  advanceTCCWeek() { return this.put("/tcc/progress/advance"); }
  completeTCCLesson(lessonId) { return this.put("/tcc/progress/lesson", { lessonId }); }

  createABCRecord(data) { return this.post("/tcc/abc", data); }
  getABCRecords(limit = 20) { return this.get("/tcc/abc", { limit }); }

  createSMARTGoal(data) { return this.post("/tcc/goals", data); }
  getSMARTGoals(status) { return this.get("/tcc/goals", status ? { status } : {}); }
  checkinGoal(goalId, completed, notes) {
    return this.put("/tcc/goals/" + goalId + "/checkin", { completed, notes });
  }
  completeGoal(goalId, status, notes) {
    return this.put("/tcc/goals/" + goalId + "/complete", { status, completionNotes: notes });
  }

  recordHungerScale(data) { return this.post("/tcc/hunger", data); }
  getHungerEntries(days = 7) { return this.get("/tcc/hunger", { days }); }

  getTCCSummary() { return this.get("/tcc/summary"); }

  // ─── Doctor Dashboard ──────────────────────────────────
  getDashboardOverview() { return this.get("/dashboard/overview"); }
  getPatientDetail(patientId) { return this.get("/dashboard/patient/" + patientId); }
  updatePatient(patientId, data) { return this.put("/dashboard/patient/" + patientId, data); }
  updateScreeningStatus(screeningId, data) { return this.put("/dashboard/screening/" + screeningId, data); }
  searchICD10(q) { return this.get("/icd10", { q }); }
  addPatientMedication(patientId, data) { return this.post("/dashboard/patient/" + patientId + "/medications", data); }
  deletePatientMedication(patientId, medId) { return this.del("/dashboard/patient/" + patientId + "/medications/" + medId); }
  validatePatientItem(patientId, field, index) { return this.put("/dashboard/patient/" + patientId + "/validate", { field, index }); }
}

const api = new ApiService();
export default api;
