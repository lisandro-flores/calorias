# 🔥 FuelSmart — Contador de Calorías con IA

> App móvil/PWA para tracking nutricional con IA, sincronización multi-dispositivo y Health Connect.

## Índice

- [Arquitectura General](#arquitectura-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Setup Local](#setup-local)
- [Despliegue](#despliegue)
- [Testing](#testing)
- [Estado Actual](#estado-actual)
- [Guía para Retomar Desarrollo](#guía-para-retomar-desarrollo)

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Angular/Ionic)          │
│   Vercel: fuelsmart.app                             │
│                                                     │
│   ┌─────────┐ ┌──────────┐ ┌──────────┐            │
│   │Dashboard│ │ Profile  │ │ Progress │            │
│   │(comidas)│ │(metas/hc)│ │(gráficas)│            │
│   └────┬────┘ └────┬─────┘ └────┬─────┘            │
│        │           │            │                   │
│   ┌────▼───────────▼────────────▼─────┐             │
│   │       NutritionStateService       │             │
│   │ (Signals, localStorage, outbox)   │             │
│   └────────────────┬──────────────────┘             │
│                    │ HTTP + AuthInterceptor          │
└────────────────────┼────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                BACKEND (NestJS)                     │
│   Coolify/Docker: caloriasapi.ngicode.com           │
│                                                     │
│   ┌──────────┐ ┌──────────┐ ┌──────────────┐       │
│   │ Auth     │ │ Entries  │ │ AI (Gemini)  │       │
│   │(Google)  │ │(day/hist)│ │(text/vision) │       │
│   └────┬─────┘ └────┬─────┘ └──────┬───────┘       │
│        │            │               │               │
│        └────────────▼───────────────┘               │
│                     │                               │
│              MongoDB Atlas                          │
└─────────────────────────────────────────────────────┘
```

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Angular + Ionic | 20.x / 8.x |
| **Estado** | Angular Signals | Nativo |
| **Offline** | Outbox + localStorage | Custom |
| **Nativo** | Capacitor | 8.x |
| **Health** | @capgo/capacitor-health | 8.x |
| **Backend** | NestJS | 11.x |
| **Base de datos** | MongoDB Atlas | - |
| **IA** | Google Gemini | 2.5 Flash |
| **CI/CD** | GitHub Actions | - |
| **Deploy FE** | Vercel | - |
| **Deploy BE** | Coolify (Docker) | - |

## Estructura del Proyecto

```
calorias/
├── src/                          # Frontend Angular
│   ├── app/
│   │   ├── components/           # 18 componentes standalone
│   │   │   ├── dashboard         # Pantalla principal (comidas, agua, sync)
│   │   │   ├── profile           # Perfil, metas, Health Connect
│   │   │   ├── progress          # Gráficos, racha, predicción
│   │   │   ├── camera            # Captura rápida manual
│   │   │   ├── coach             # Coach IA conversacional
│   │   │   ├── food-search       # Búsqueda OpenFoodFacts
│   │   │   ├── ai-input          # Input IA texto "comí arroz"
│   │   │   ├── meal-block        # Bloque de comida (CRUD alimentos)
│   │   │   ├── hero-summary      # Resumen superior calorías
│   │   │   ├── goal-progress     # Barras de macro goals
│   │   │   ├── water-tracker     # Tracker de agua
│   │   │   ├── landing           # Landing page pública
│   │   │   ├── login             # Login con Google
│   │   │   ├── onboarding        # Wizard de configuración inicial
│   │   │   ├── outbox-panel      # Panel de sync pendientes
│   │   │   ├── sync-indicator    # Badge de estado sync
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── nutrition-state   # CORE: estado global (signals)
│   │   │   ├── auth              # Autenticación Google
│   │   │   ├── outbox            # Cola offline con reintentos
│   │   │   ├── health-connect    # Health Connect wrapper
│   │   │   ├── ai                # Servicio IA (Gemini)
│   │   │   ├── open-food-facts   # API OpenFoodFacts
│   │   │   ├── network-status    # Detección online/offline
│   │   │   └── pwa               # Service Worker updates
│   │   └── guards/               # Auth guard
│   └── environments/             # dev / prod configs
├── backend/                      # API NestJS
│   ├── src/
│   │   ├── auth/                 # Google OAuth, JWT
│   │   ├── entries/              # CRUD entries diarias
│   │   ├── ai/                   # Proxy Gemini
│   │   └── app.module.ts
│   ├── Dockerfile                # Para Coolify
│   └── .env                      # Variables de entorno
├── android/                      # Proyecto Capacitor Android
├── e2e/                          # Tests Playwright (53 specs)
├── docs/                         # Documentación
├── .github/workflows/
│   ├── build-apk.yml             # CI: compila APK en push a main
│   └── e2e-playwright.yml        # CI: tests Playwright
└── capacitor.config.ts
```

## Setup Local

### Requisitos

- Node.js 20+
- npm 10+
- (Opcional) Android Studio para APK

### Frontend

```bash
cd calorias
npm install
npm start
# Abre en http://localhost:4200
```

### Backend

```bash
cd calorias/backend
npm install
# Copia .env.example o configura las variables:
#   MONGO_URI=mongodb+srv://...
#   JWT_SECRET=...
#   GOOGLE_CLIENT_ID=...
#   GEMINI_API_KEY=...
npm run start:dev
# Abre en http://localhost:3000
```

### Variables de Entorno Backend (.env)

| Variable | Descripción |
|----------|-------------|
| `MONGO_URI` | URI de MongoDB Atlas |
| `JWT_SECRET` | Secreto para tokens JWT |
| `GOOGLE_CLIENT_ID` | ID de cliente Google OAuth |
| `GEMINI_API_KEY` | API key de Google Gemini |
| `PORT` | Puerto del servidor (default: 3000) |

## Despliegue

### Frontend → Vercel

El frontend se despliega automáticamente desde `main` en Vercel.

- **URL producción:** `https://fuelsmart.app` (o la URL configurada)
- **Build command:** `npm run build`
- **Output dir:** `www`
- **Environment:** `environment.prod.ts` apunta a `caloriasapi.ngicode.com`

### Backend → Coolify (Docker)

El backend corre en un VPS Oracle con Coolify usando Docker.

- **URL producción:** `https://caloriasapi.ngicode.com`
- **Acceso VPS:** `connect oraclevps`
- **Dockerfile:** `backend/Dockerfile`

### APK Android → GitHub Actions

Al hacer push a `main`, el workflow `build-apk.yml`:
1. Instala dependencias y Java 17
2. Ejecuta `npm run build` + `npx cap sync android`
3. Compila APK debug con Gradle
4. Sube el APK al release `latest` en GitHub

## Testing

### Tests Unitarios (Jasmine/Karma)

```bash
npm run test                          # Modo watch
npm run test -- --no-watch            # Una vez
npm run test -- --no-watch --code-coverage   # Con coverage
```

**Cobertura actual (julio 2026):**

| Métrica | Porcentaje |
|---------|-----------|
| **Lines** | **86.65%** |
| **Functions** | **87.85%** |
| **Statements** | 84.42% |
| **Branches** | 66.94% |

El reporte HTML está en `coverage/app/index.html`.

### Tests E2E (Playwright)

```bash
npm run e2e:build                     # Compilar la app
npm run e2e:serve &                   # Servir estático en :8100
npm run e2e:test                      # Ejecutar los 53 specs
```

### Tests Backend

```bash
cd backend
npm run test                          # Unitarios (51 specs)
npm run test:e2e                      # Integración
```

## Estado Actual

### ✅ Funcional y Usable

- **Dashboard:** Registro de comidas (4 tiempos), agregar/editar/eliminar alimentos, copiar del día anterior
- **IA por texto:** "Comí 2 huevos con pan" → parsea y registra automáticamente
- **Búsqueda:** OpenFoodFacts con escáner de código de barras
- **Agua:** Tracker visual de vasos
- **Metas:** BMR/TDEE automáticos, calorías/proteínas/macros, overrides manuales
- **Perfil:** Edad, peso, altura, género, nivel de actividad
- **Sync:** Cloud-first con fallback local, outbox para offline
- **Auth:** Google Sign-In
- **PWA:** Instalable desde navegador
- **APK:** Build automático en CI

### ⚠️ Parcialmente Implementado

- **Health Connect:** Servicio creado, falta validar permisos en dispositivo real
- **Cámara IA:** Tab existe como captura manual; foto → IA multimodal pendiente
- **Coach IA:** Funciona solo con datos del día actual

### 📋 Pendiente / Futuro

- Foto de plato → análisis IA multimodal
- Coach proactivo con retrospectivas semanales
- Gráficos avanzados con Chart.js
- Push notifications de recordatorio
- Publicación en Google Play Store
- Privacy policy para Health Connect

---

## Guía para Retomar Desarrollo

### Prioridades sugeridas (en orden)

1. **Cámara multimodal** — Diferenciador de producto
2. **Coach con historial** — Más engagement
3. **Gráficos avanzados** — Retención
4. **Health Connect real** — Integración Android
5. **Play Store** — Distribución

### Archivos clave a conocer

| Archivo | Para qué |
|---------|----------|
| `nutrition-state.service.ts` | **Core de toda la app.** Estado, sync, historial, cálculos. |
| `outbox.service.ts` | Cola de sincronización offline con reintentos exponenciales. |
| `auth.service.ts` | Google Sign-In + JWT. |
| `dashboard.component.ts` | Pantalla principal con composición de sub-componentes. |
| `profile.component.ts` | Configuración de usuario y metas. |
| `environment.prod.ts` | URL del API de producción. |
| `capacitor.config.ts` | Config de la app nativa (appId, nombre). |

### Convenciones

- **Componentes:** Standalone, sin módulos. Inline template y styles.
- **Estado:** Angular Signals (no NgRx/RxJS stores).
- **Sync:** Outbox pattern con versionado optimista.
- **Tests:** Jasmine con mocks manuales (no jest, no spectator).
- **Estilo:** CSS variables (`--app-surface`, `--app-accent`, etc.) en dark mode.

### Cómo agregar un nuevo componente

```bash
# 1. Crear el archivo
src/app/components/mi-componente.component.ts

# 2. Seguir el patrón standalone:
@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `...`,
  styles: [`...`]
})
export class MiComponenteComponent { ... }

# 3. Agregar a app.routes.ts si es una página
# 4. Crear spec: mi-componente.component.spec.ts
```
