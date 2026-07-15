# Reporte de Estado — FuelSmart

**Fecha:** 14 de julio de 2026  
**Autor:** Antigravity AI  
**Versión:** 1.0.0

---

## Resumen Ejecutivo

FuelSmart es una app de tracking nutricional con IA lista para uso personal. El frontend está desplegado en Vercel, el backend en Coolify (VPS Oracle), y el APK Android se genera automáticamente vía GitHub Actions al hacer push a `main`.

La app permite registrar comidas manualmente o por IA de texto, buscar alimentos en OpenFoodFacts, trackear agua, configurar metas calóricas/proteicas personalizadas, y visualizar progreso semanal. La sincronización multi-dispositivo funciona con un patrón outbox para resiliencia offline.

## Métricas de Calidad

### Cobertura de Tests Unitarios

| Métrica | Antes | Después | Δ |
|---------|-------|---------|---|
| Lines | ~71% | **86.65%** | +15.6% |
| Functions | ~68% | **87.85%** | +19.8% |
| Statements | ~67% | **84.42%** | +17.4% |
| Branches | ~55% | **66.94%** | +12% |
| Tests | 139 | **231** | +92 |

### Suites de Test

| Suite | Tests | Estado |
|-------|-------|--------|
| Frontend unitarios (Jasmine) | 231/231 | ✅ Pass |
| Frontend E2E (Playwright) | 53/53 | ✅ Pass |
| Backend unitarios (Jest) | 51/51 | ✅ Pass |
| Build de producción | - | ✅ Pass |

### Componentes con Mejor Cobertura (post-mejora)

| Componente | Lines | Functions |
|-----------|-------|-----------|
| `MealBlockComponent` | 100% | 100% |
| `OutboxPanelComponent` | 100% | 100% |
| `HeroSummaryComponent` | 100% | 100% |
| `GoalProgressComponent` | 100% | 100% |
| `WaterTrackerComponent` | 100% | 100% |
| `DashboardComponent` | 97% | 100% |
| `ProfileComponent` | 95% | 94.7% |
| `FoodSearchComponent` | 94.8% | 89.5% |
| `OnboardingComponent` | 91.7% | 80% |

## Trabajo Completado en Esta Sesión

### 1. Refactorización para Testabilidad
- **`HealthConnectService`**: Reestructurado para inyectar dependencias nativas (Capacitor, Health plugin) via protected getters, eliminando la dependencia de mocks globales.

### 2. Tests de Componentes Agregados
- **`ProfileComponent`** (+7 tests): `setGender`, `resetCalAuto`, `connectHealth`, `refreshHealth`, `resetToday`, `confirmSave`, `logout`.
- **`MealBlockComponent`** (+7 tests): `confirmRemoveFood`, `onQuickAdd` (valid/invalid), `onEditFood` (valid/invalid), `onRemoveFood`.
- **`OutboxPanelComponent`** (+7 tests — nuevo): `create`, `refresh on pending$`, `clear` confirm/cancel, `remove` confirm/cancel/error.
- **`DashboardComponent`** (+5 tests): `onCopyYesterday`, `trackByMeal`, `retrySync`, `trustTitle`, `trustMessage`.

### 3. Tests de Servicio Core
- **`NutritionStateService`** (+8 tests):
  - `pullFromMongo` error → fallback
  - `pullProfileFromMongo` error → fallback
  - `pullHistoryFromMongo` error → fallback
  - `pullHistoryFromMongo` maps response
  - `syncToMongo` enqueue outbox
  - `syncToMongo` offline mode
  - Estabilización de HTTP mocks con Angular Signals

### 4. Verificación de Build
- Build de producción (`npm run build`) exitoso sin errores.
- Output en `www/` listo para deploy.

## Estado de los Despliegues

| Componente | URL | Estado |
|-----------|-----|--------|
| Frontend (Vercel) | fuelsmart.app | ✅ Activo |
| Backend (Coolify) | caloriasapi.ngicode.com | ✅ Activo |
| APK (GitHub Actions) | Release `latest` | ✅ Configurado |

## Funcionalidades Listas para Uso Personal

### ✅ Completamente Funcional
1. **Registro de comidas** — 4 tiempos (Desayuno, Comida, Cena, Snacks)
2. **Agregar por IA** — Texto libre: "comí 2 huevos con pan y un jugo"
3. **Búsqueda OpenFoodFacts** — Por nombre o código de barras
4. **Captura rápida** — Nombre + calorías + proteína manualmente
5. **Editar/Eliminar alimentos** — CRUD completo por comida
6. **Copiar del día anterior** — Reusar comidas de ayer
7. **Tracker de agua** — Agregar/quitar vasos
8. **Perfil completo** — Edad, peso, altura, género, actividad
9. **Metas automáticas** — BMR/TDEE por Mifflin-St Jeor con ajuste según objetivo
10. **Metas personalizadas** — Override manual de calorías/proteínas
11. **Progreso semanal** — Gráfico de 7 días, déficit, racha
12. **Predicción de peso** — Basada en déficit promedio
13. **Sincronización cloud** — Datos siempre en MongoDB
14. **Modo offline** — Outbox con reintentos exponenciales
15. **Multi-dispositivo** — Versionado optimista de entradas
16. **Login Google** — OAuth2 seguro
17. **PWA instalable** — Service Worker con cache
18. **APK Android** — Build automático en CI

### ⚠️ Requiere Atención Menor
- **Coach IA**: Funciona pero solo analiza el día actual (no historial)
- **Health Connect**: Servicio listo, requiere testing en dispositivo Android real
- **Cámara**: Captura manual funciona, análisis por foto pendiente

## Próximos Pasos Sugeridos

> Ver `docs/discovery_prioritized_roadmap.md` para el roadmap completo.

### Corto plazo (uso personal)
- [ ] Hacer push de los tests actualizados a `main`
- [ ] Verificar que el APK se genera correctamente en GitHub Actions
- [ ] Instalar APK en tu teléfono y usar diariamente

### Medio plazo (mejoras)
- [ ] Implementar foto → IA multimodal (Gemini Vision)
- [ ] Coach con retrospectiva semanal
- [ ] Gráficos con Chart.js en progreso

### Largo plazo (publicación)
- [ ] Privacy policy para Health Connect
- [ ] Publicar en Google Play Store
- [ ] Monetización opcional (coach premium)
