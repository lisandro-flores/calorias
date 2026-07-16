# 🚀 Siguientes Pasos para FuelSmart

**Última actualización:** julio 2026

## Estado Actual

La app está **lista para uso personal**. Tienes:
- Frontend en Vercel
- Backend en Coolify (VPS Oracle)
- APK auto-generado via GitHub Actions
- 231 tests unitarios pasando con 86.65% de cobertura
- 53 tests E2E pasando
- Sync multi-dispositivo con outbox offline

---

## Para Empezar a Usar Diariamente

1. **Hacer push de los cambios pendientes:**
   ```bash
   git add -A
   git commit -m "test: improve coverage to 86%+ and stabilize test suite"
   git push origin main
   ```

2. **Esperar que GitHub Actions genere el APK** (~3-5 min)

3. **Descargar el APK** desde la release `latest` en tu repo de GitHub, o desde la landing page

4. **Instalar en tu teléfono** y empezar a registrar comidas

---

## Roadmap de Mejoras

### Prioridad 1 — Cámara IA Multimodal (Diferenciador)

**Qué:** Tomar foto del plato → Gemini analiza → devuelve calorías y macros.

**Archivos a tocar:**
- `backend/src/ai/` — Agregar endpoint que reciba imagen base64
- `src/app/components/camera.component.ts` — Conectar cámara → API
- `src/app/services/ai.service.ts` — Agregar método `analyzeImage()`

**Cómo:**
1. Capturar imagen con API de cámara del navegador o plugin Capacitor
2. Enviar base64 al backend
3. Backend envía a Gemini 2.5 Flash con prompt de visión
4. Respuesta JSON con alimentos detectados
5. Usuario confirma/edita antes de guardar

### Prioridad 2 — Coach Proactivo con Historial

**Qué:** El coach IA analiza tu semana completa, no solo el día actual.

**Archivos a tocar:**
- `src/app/components/coach.component.ts` — Pasar historial al prompt
- `src/app/services/nutrition-state.service.ts` — Método `getWeeklySummary()`
- `backend/src/ai/` — Prompt optimizado con contexto semanal

### Prioridad 3 — Gráficos con Chart.js (✅ Completado)

**Qué:** Reemplazar las barras simples de progreso con gráficos interactivos.

**Archivos a tocar:**
- `src/app/components/progress.component.ts` (Implementado)
- Instalar `ng2-charts` o `chart.js` (Implementado)

### Prioridad 4 — Health Connect en Dispositivo Real

**Qué:** Validar que la integración con Health Connect funcione en Android real.

**Archivos a tocar:**
- `src/app/services/health-connect.service.ts`
- `android/app/src/main/AndroidManifest.xml` — Permisos

**Checklist:**
- [ ] Verificar permisos Android en manifest
- [ ] Crear privacy policy (requerido por Google)
- [ ] Testear lectura de pasos, calorías quemadas, peso
- [ ] UI de consentimiento claro para el usuario

### Prioridad 5 — Publicar en Google Play

**Requisitos:**
- Privacy policy pública (puede ser una página estática en Vercel)
- Capturas de pantalla para la store
- Descripción y categorización
- Cuenta de desarrollador Google ($25 una vez)

---

## Comandos Útiles

```bash
# Desarrollo frontend
npm start                                     # Dev server

# Desarrollo backend
cd backend && npm run start:dev               # Watch mode

# Tests
npm run test -- --no-watch --code-coverage    # Con coverage
npm run e2e:test                              # Playwright

# Build y deploy
npm run build                                 # Build producción
npx cap sync android                          # Sync a Android

# Servidor VPS
connect oraclevps                             # SSH al VPS
```

## Notas Importantes

- **API URL prod:** `https://caloriasapi.ngicode.com` (configurada en `environment.prod.ts`)
- **Google Client ID:** Compartido entre frontend y backend
- **Outbox:** Los cambios offline se encolan y reintentan automáticamente
- **Versionado:** El backend usa versionado optimista para evitar conflictos multi-dispositivo
- **Caché local:** `localStorage` se usa como fallback cuando no hay conexión al cloud
