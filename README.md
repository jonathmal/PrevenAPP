# PrevenApp v2.3 — Operational Release

## Files (13 total)

### Backend (5)
- `backend/models/Patient.js`     — Added: onboardingCompleted, createdBy, createdByDoctor
- `backend/models/User.js`        — Added: mustChangePassword, securityQuestion, securityAnswerHash
- `backend/models/index.js`       — Fixed destructuring bug from prior audit
- `backend/routes/auth.js`        — Rewritten with all auth flows
- `backend/routes/dashboard.js`   — Added doctor-creates-patient endpoints

### Frontend (8)
- `frontend/src/App.jsx`              — Wired all flows
- `frontend/src/services/api.js`      — Added 8 new methods
- `frontend/src/pages/LoginPage.jsx`  — Added "Crear cuenta" + "¿Olvidé contraseña?"
- `frontend/src/pages/RegisterPage.jsx`        — NEW: 2-step self-service registration
- `frontend/src/pages/ForgotPasswordPage.jsx`  — NEW: 3-step recovery via security question
- `frontend/src/pages/ChangePasswordPage.jsx`  — NEW: forced change for first login
- `frontend/src/pages/OnboardingPage.jsx`      — NEW: 8-step setup wizard
- `frontend/src/pages/DashboardPage.jsx`       — Added "+ Crear" + CreatePatientModal

## User flows

### Self-service (paciente)
Login → "Crear cuenta nueva" → Datos personales → Contraseña + Pregunta seguridad → Consentimiento → Onboarding → App

### Doctor crea paciente
Dashboard → "+ Crear" → Formulario → Sistema genera `Preven####` → Doctor entrega credenciales → Paciente: ChangePassword forzado → Consentimiento → Onboarding → App

### Recuperación
Login → "¿Olvidó su contraseña?" → Cédula → Pregunta seguridad → Respuesta + Nueva contraseña → Login

### Cédulas válidas (Panamá)
`8-937-44`, `PE-12-345`, `N-12-345`, `E-12-345`

## Notes
- Self-registered users always get `role: "patient"`. Doctors created via seed only.
- Temp passwords: `Preven` + 4 random digits (e.g. `Preven4837`).
- Security answers stored hashed (bcrypt), case-insensitive, trimmed.
- Onboarding can be skipped (completable later from Profile).
