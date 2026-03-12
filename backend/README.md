# PrevenApp v2.0 — Backend API

**Medicina Preventiva + Automonitoreo Cardiometabólico + Intervención Conductual Digital (TCC)**

Centro de Salud de Macaracas · Región de Salud de Los Santos · Panamá

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Base de datos:** MongoDB (Atlas o local)
- **Autenticación:** JWT (bcryptjs)
- **Seguridad:** Helmet, CORS, rate limiting

## Estructura del proyecto

```
prevenapp-backend/
├── config/          # Configuración (env vars)
├── middleware/       # Auth JWT, error handler, async handler
├── models/          # Mongoose schemas
│   ├── User.js          # Auth (paciente/médico/admin)
│   ├── Patient.js       # Perfil clínico, diagnósticos, antropometría
│   ├── BPReading.js     # Lecturas de presión arterial (auto-clasificación)
│   ├── GlucoseReading.js # Lecturas de glucosa (auto-clasificación)
│   ├── WeightReading.js  # Registros de peso (auto-IMC)
│   ├── Medication.js     # Medicamentos + MedLog (tracking diario)
│   ├── Screening.js      # Tamizajes (auto-status semáforo)
│   └── TCC.js           # ABCRecord, SMARTGoal, HungerScale, TCCProgress
├── routes/
│   ├── auth.js          # POST /register, /login  |  GET /me
│   ├── vitals.js        # CRUD BP, glucosa, peso + estadísticas
│   ├── medications.js   # CRUD meds + tracking diario + adherencia
│   ├── screenings.js    # CRUD + auto-generación por perfil clínico
│   ├── tcc.js           # ABC records, SMART goals, hunger scale, progreso
│   └── dashboard.js     # Vista agregada para médicos (requiere role doctor)
├── seeds/
│   └── seed.js          # Datos demo: 5 pacientes + 1 médico
├── server.js            # Entry point
└── .env.example         # Variables de entorno
```

## Setup rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu MongoDB URI y JWT secret

# 3. Poblar datos demo
npm run seed

# 4. Iniciar servidor (puerto 5001 por defecto)
npm run dev
```

> **Nota macOS:** El puerto 5000 está ocupado por AirPlay Receiver. Este proyecto usa el puerto 5001 por defecto. Si necesitas cambiar el puerto, edita `PORT` en tu `.env`.

## API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión → token JWT |
| GET | `/api/auth/me` | Perfil del usuario autenticado |

### Signos Vitales (requiere auth)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/vitals/bp` | Registrar presión arterial |
| GET | `/api/vitals/bp` | Historial de PA (?limit, ?days) |
| GET | `/api/vitals/bp/latest` | Última lectura de PA |
| GET | `/api/vitals/bp/stats` | Estadísticas PA (?days) |
| POST | `/api/vitals/glucose` | Registrar glucosa |
| GET | `/api/vitals/glucose` | Historial glucosa |
| POST | `/api/vitals/weight` | Registrar peso |
| GET | `/api/vitals/weight` | Historial peso |

### Medicación (requiere auth)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/medications` | Agregar medicamento |
| GET | `/api/medications` | Listar medicamentos activos |
| POST | `/api/medications/log` | Registrar dosis tomada/omitida |
| GET | `/api/medications/log/today` | Log de hoy con % adherencia |
| GET | `/api/medications/log/adherence` | Adherencia últimos N días |

### Tamizajes (requiere auth)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/screenings` | Agregar tamizaje |
| GET | `/api/screenings` | Listar tamizajes + resumen semáforo |
| PUT | `/api/screenings/:id/complete` | Marcar tamizaje como realizado |
| POST | `/api/screenings/generate` | Auto-generar por perfil clínico |

### TCC Digital (requiere auth)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tcc/progress` | Progreso TCC (fase, semana, métricas) |
| PUT | `/api/tcc/progress/advance` | Avanzar semana/fase |
| POST | `/api/tcc/abc` | Crear registro ABC |
| GET | `/api/tcc/abc` | Listar registros ABC |
| POST | `/api/tcc/goals` | Crear meta SMART |
| PUT | `/api/tcc/goals/:id/checkin` | Check-in diario en meta |
| POST | `/api/tcc/hunger` | Registrar escala hambre/saciedad |
| GET | `/api/tcc/summary` | Resumen engagement TCC |

### Dashboard Médico (requiere role: doctor)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/overview` | Todos los pacientes con alertas |
| GET | `/api/dashboard/patient/:id` | Vista detallada de un paciente |

## Credenciales demo (después de seed)

- **Médico:** cédula `8-937-44`, contraseña `doctor2026`
- **Paciente (María):** cédula `7-100-1001`, contraseña `paciente2026`

## Deploy en Render

1. Crear Web Service en render.com
2. Conectar repositorio GitHub
3. Build command: `npm install`
4. Start command: `npm start`
5. Agregar variables de entorno (MONGODB_URI, JWT_SECRET, NODE_ENV=production)

## Lógica clínica

### Auto-clasificación de PA (ACC/AHA 2017)
- **Verde (Normal):** <130/80 mmHg
- **Amarillo (Elevada/Stage 1):** 130-139/80-89 mmHg
- **Rojo (Stage 2/Crisis):** ≥140/90 mmHg

### Auto-clasificación de glucosa
- **Verde:** 70-130 mg/dL (ayunas)
- **Amarillo:** 130-180 mg/dL
- **Rojo:** >180 o <70 mg/dL

### Motor de tamizajes
Genera automáticamente los tamizajes según edad, sexo, comorbilidades y factores de riesgo del paciente, basado en guías MINSA/CSS, USPSTF y ACS.

---

*Investigador Principal: Dr. Jonathan Jethmal Solís (MI-7382-24)*
*Co-investigadora: Isabella Batista Roquer*
*Hospital Regional de Azuero Anita Moreno · Centro de Salud de Macaracas*
