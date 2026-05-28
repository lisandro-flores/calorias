# 🧪 Plan de Pruebas — FuelSmart

## Visión general

La app ofrece 4 grandes áreas funcionales. El plan cubre tres capas de testing:

| Capa | Framework | Archivos destino |
|------|-----------|-----------------|
| **Unitaria** | Karma + Jasmine (ya configurado) | `src/app/services/*.spec.ts` |
| **Integración** | Karma + Jasmine con mocks HTTP | `src/app/components/*.spec.ts` |
| **E2E** | Playwright (ya configurado) | `e2e/tests/*.spec.ts` |

---

## 1. Pruebas Unitarias — `NutritionStateService`

Archivo: `src/app/services/nutrition-state.service.spec.ts` *(ya existe, ampliar)*

### 1.1 Cálculos nutricionales (BMR / TDEE / Metas)

```
describe('Cálculos BMR y TDEE')
```

| # | Caso de prueba | Entrada | Resultado esperado |
|---|----------------|---------|-------------------|
| U-01 | BMR hombre (Mifflin-St Jeor) | peso=80, altura=170, edad=25, género=male | `bmr() === 1738.5` → `10*80 + 6.25*170 - 5*25 + 5` |
| U-02 | BMR mujer | peso=60, altura=165, edad=30, género=female | `bmr() === 1392.5` |
| U-03 | TDEE con nivel sedentario | BMR=1738, activityLevel=sedentary | `tdee() === Math.round(1738 * 1.2)` |
| U-04 | TDEE con nivel very_active | BMR=1738, activityLevel=very_active | `tdee() === Math.round(1738 * 1.9)` |
| U-05 | Meta calorías — déficit (bajar de peso) | currentWeight=80, goalWeight=70 | `calorieGoal() === tdee() - 400` |
| U-06 | Meta calorías — superávit (subir de peso) | currentWeight=60, goalWeight=70 | `calorieGoal() === tdee() + 300` |
| U-07 | Meta calorías — override manual | calorieGoalOverride=2000 | `calorieGoal() === 2000` |
| U-08 | Meta proteína automática | currentWeight=80, proteinGoalOverride=null | `proteinGoal() === Math.round(80 * 1.8)` |
| U-09 | Meta proteína override | proteinGoalOverride=150 | `proteinGoal() === 150` |

### 1.2 Gestión de comidas y alimentos

```
describe('Gestión de comidas')
```

| # | Caso de prueba | Acción | Resultado esperado |
|---|----------------|--------|--------------------|
| U-10 | Agregar alimento a comida existente | `addFoodToMeal('Desayuno', food)` | El array `meals[0].foods` contiene el alimento |
| U-11 | Totalizar calorías tras agregar | Agregar 2 alimentos (300 + 200 kcal) | `totalCalories() === 500` |
| U-12 | Totalizar proteína | Agregar food con protein=30 | `totalProtein() === 30` |
| U-13 | Eliminar alimento de comida | `removeFoodFromMeal('Desayuno', food.id)` | El alimento ya no aparece en foods |
| U-14 | quickAdd crea FoodItem correcto | `quickAdd('Cena', 'Arroz', 250, 5, 50, 1)` | calories=250, protein=5, carbs=50, fat=1 |
| U-15 | quickAdd redondea valores flotantes | `quickAdd('Cena', 'A', 100.7, 5.3, 20.1, 3.9)` | Todos los valores son enteros |
| U-16 | Agregar a comida inexistente | `addFoodToMeal('Merienda', food)` | Ningún meal es modificado (sin crash) |
| U-17 | recentFoods se actualiza al agregar | Agregar un alimento | `recentFoods()[0].name === food.name` |
| U-18 | recentFoods no duplica por nombre | Agregar mismo food dos veces | `recentFoods().filter(f => f.name==='X').length === 1` |
| U-19 | recentFoods máximo 15 elementos | Agregar 16 alimentos distintos | `recentFoods().length === 15` |
| U-20 | resetToday limpia meals y agua | Llamar `resetToday()` | `totalCalories()===0`, `waterGlasses()===0` |

### 1.3 Tracker de agua

| # | Caso de prueba | Acción | Resultado esperado |
|---|----------------|--------|--------------------|
| U-21 | Sumar vaso de agua | `addWater()` | `waterGlasses() === 1` |
| U-22 | Restar vaso | `addWater(); removeWater()` | `waterGlasses() === 0` |
| U-23 | No llega a negativo | `removeWater()` en 0 | `waterGlasses() === 0` |

### 1.4 Historial y predicción de peso

| # | Caso de prueba | Acción | Resultado esperado |
|---|----------------|--------|--------------------|
| U-24 | getCaloriesForDate sin datos | Fecha inexistente | Retorna `0` |
| U-25 | getCaloriesForDate con datos | Preparar history con datos | Retorna la suma correcta |
| U-26 | getDeficitForDate | Preparar entry con 1500 kcal, TDEE=2000 | `getDeficitForDate(date) === 500` |
| U-27 | getLast7Days devuelve 7 elementos | Llamar `getLast7Days()` | Array con exactamente 7 items |
| U-28 | weeklyWeightChangePrediction sin historial | history vacío | Retorna `null` |
| U-29 | weeklyWeightChangePrediction con datos | Historial con avg 1500 kcal, TDEE 2000 | Retorna positivo (predicción pérdida de peso) |

### 1.5 checkDateChange

| # | Caso de prueba | Acción | Resultado esperado |
|---|----------------|--------|--------------------|
| U-30 | No hace nada si la fecha es la misma | `checkDateChange()` con key actual | `todayKey` no cambia |
| U-31 | Recarga datos si la fecha cambió | Forzar `todayKey` al pasado | `todayKey` se actualiza y se llama `pullFromMongo` |

### 1.6 updateProfile / updateGoals

| # | Caso de prueba | Acción | Resultado esperado |
|---|----------------|--------|--------------------|
| U-32 | updateProfile modifica solo el campo enviado | `updateProfile({ displayName: 'Ana' })` | Solo `displayName` cambia |
| U-33 | updateGoals mapea calorieGoal a override | `updateGoals({ calorieGoal: 1800 })` | `calorieGoalOverride === 1800` |

---

## 2. Pruebas Unitarias — `OutboxService`

Archivo: `src/app/services/outbox.service.spec.ts` *(crear)*

| # | Caso de prueba | Acción | Resultado esperado |
|---|----------------|--------|--------------------|
| O-01 | enqueue crea un item | `enqueue('entry-sync', payload)` | `list().length === 1` |
| O-02 | enqueue deduplica entry-sync por fecha | 2x `enqueue` con misma fecha | `list().length === 1` y payload actualizado |
| O-03 | enqueue deduplica profile-sync | 2x `enqueue('profile-sync', ...)` | `list().length === 1` |
| O-04 | pending$ emite la cuenta correcta | Encolar 2 items | `pending$` emite `2` |
| O-05 | clear() vacía la cola | `enqueue` + `clear()` | `list().length === 0` |
| O-06 | processQueue marca item como done tras éxito HTTP | Mock HTTP 200 | Item removido de la cola |
| O-07 | processQueue marca como failed después de 5 intentos | Mock HTTP 500 x5 | `item.status === 'failed'` |

---

## 3. Pruebas Unitarias — `AuthService`

Archivo: `src/app/services/auth.service.spec.ts` *(crear)*

| # | Caso de prueba | Resultado esperado |
|---|----------------|--------------------|
| A-01 | `currentUser()` arranca en null si localStorage vacío | `null` |
| A-02 | Carga usuario persistido de localStorage al init | Usuario del localStorage |
| A-03 | `loginWithGoogleToken` — backend OK | `currentUser()` tiene id real, dispara evento |
| A-04 | `loginWithGoogleToken` — backend falla → fallback offline | `currentUser().id === 'offline_mode'` |
| A-05 | `logout()` limpia currentUser y localStorage | `currentUser() === null` |

---

## 4. Pruebas de Integración — Componentes

### 4.1 `FoodSearchComponent`

Archivo: `src/app/components/food-search.component.spec.ts` *(crear)*

| # | Caso de prueba | Resultado esperado |
|---|----------------|--------------------|
| I-01 | Búsqueda con < 3 chars no dispara request | No llama al servicio |
| I-02 | Búsqueda con >= 3 chars llama `searchProducts` | Servicio invocado con debounce |
| I-03 | `calcKcal()` para 150g de producto con 100kcal/100g | Retorna 150 |
| I-04 | `adjustGrams(-25)` no baja de 1 | `portionGrams === 1` |
| I-05 | `onProductTap` con kcal=0 no abre modal | `selectedProduct() === null` |

### 4.2 `AiInputComponent`

Archivo: `src/app/components/ai-input.component.spec.ts` *(crear)*

| # | Caso de prueba | Resultado esperado |
|---|----------------|--------------------|
| I-06 | `sendToAI()` con text vacío no llama al servicio | `aiService.parseMeal` no invocado |
| I-07 | Respuesta exitosa llena `results()` | `results().length > 0` |
| I-08 | Error `MISSING_API_KEY` activa `isMissingApiKey()` | `true` |
| I-09 | Error `RATE_LIMIT_EXCEEDED` muestra mensaje correcto | `errorMsg()` contiene 'límite' |
| I-10 | `confirmAll()` abre el picker | `mealPickerOpen() === true` |
| I-11 | `addAllToMeal` agrega todos los foods al servicio | `nutritionState.addFoodToMeal` llamado N veces |
| I-12 | `clearResults()` limpia results y errorMsg | Ambas signals vacías |

---

## 5. Pruebas E2E — Playwright

Todos los specs en: `e2e/tests/`

### Configuración base compartida

Todos los specs deben hacer mock de los endpoints del backend para evitar dependencia de red real:

```ts
await page.route('**/entries/day*', r => r.fulfill({ json: { success: true, data: { meals: [], waterGlasses: 0 } } }));
await page.route('**/auth/profile*',  r => r.fulfill({ json: { success: true, data: {} } }));
await page.route('**/entries/range*', r => r.fulfill({ json: { success: true, data: [] } }));
await page.route('**/entries/sync*',  r => r.fulfill({ json: { success: true } }));
await page.addInitScript(() => {
  localStorage.setItem('current_user', JSON.stringify({ id: 'test_user', name: 'Tester' }));
  localStorage.setItem('onboardingSeen', '1');
});
```

---

### E2E-01: Flujo Onboarding

Archivo: `e2e/tests/onboarding.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Navegar a `/` con localStorage limpio (sin `onboardingSeen`) | Redirige a `/onboarding` |
| 2 | Click "Siguiente" | Slide 2 visible (texto "Impulsado por IA") |
| 3 | Click "Siguiente" | Slide 3 visible ("Sincronización Total") |
| 4 | Click "Comenzar" | Navega a `/login` |
| 5 | Navegar a `/` con `onboardingSeen=1` | NO redirige a onboarding |

### E2E-02: Flujo Login / Auth Guard

Archivo: `e2e/tests/auth.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Intentar acceder a `/tabs/dashboard` sin usuario | Redirige a `/login` o `/landing` |
| 2 | Inyectar `current_user` válido en localStorage | Accede al dashboard |
| 3 | Dashboard carga con estado `dataReady` | Overlay de carga desaparece |

### E2E-03: Dashboard — Registro con IA *(ya existe, mejorar)*

Archivo: `e2e/tests/ai-add-all.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Mockear `/ai/parse-meal` con respuesta de 2 alimentos | — |
| 2 | Click "Registrar con IA" | Panel se expande |
| 3 | Escribir texto en textarea | Texto visible |
| 4 | Click "Analizar" | Spinner aparece y desaparece |
| 5 | Esperar resultados | "2 alimentos detectados" visible |
| 6 | Click "Agregar todos" | Picker de comidas visible |
| 7 | Seleccionar "Desayuno" | Picker cierra |
| 8 | Verificar contador de calorías aumentó | `totalCalories > 0` en el hero |

### E2E-04: Dashboard — Búsqueda Manual (Open Food Facts)

Archivo: `e2e/tests/food-search.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Mockear llamada a `openfoodfacts.org` con 3 productos | — |
| 2 | Escribir "arr" en el searchbar | Sin resultados (< 3 chars procesados) |
| 3 | Escribir "arroz" | Aparecen 3 resultados |
| 4 | Click en primer resultado | Modal de porción aparece |
| 5 | Cambiar gramos a 150 | Calorías calculadas actualizadas en tiempo real |
| 6 | Click "+25" en el stepper | Gramos aumentan a 175 |
| 7 | Click "Agregar" | Action sheet de selección de comida aparece |
| 8 | Seleccionar comida | Item aparece en el meal block |

### E2E-05: Dashboard — Tracker de Agua

Archivo: `e2e/tests/water-tracker.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Verificar estado inicial | "0 / 8 vasos de agua" visible |
| 2 | Click "+" 3 veces | Contador muestra "3 / 8" |
| 3 | Verificar dots | 3 dots azules rellenos |
| 4 | Click "-" 1 vez | Contador muestra "2 / 8" |
| 5 | Click "-" en 0 | Botón deshabilitado; contador sigue en 0 |

### E2E-06: Dashboard — Copiar desde Ayer

Archivo: `e2e/tests/copy-yesterday.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Inyectar datos de ayer en localStorage (`meals_YYYY-MM-DD`) | — |
| 2 | Click "Copiar de Ayer" en meal block "Desayuno" | Alimentos de ayer aparecen en Desayuno |
| 3 | `totalCalories` refleja los alimentos copiados | Calorías > 0 |

### E2E-07: Pestaña Progreso

Archivo: `e2e/tests/progress.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Navegar a `/tabs/progress` | Página carga |
| 2 | Verificar gráfica de 7 días visible | Contenedor de barras o elementos `day-bar` presentes |
| 3 | Verificar predicción de peso visible | Elemento de predicción presente |

### E2E-08: Pestaña Perfil

Archivo: `e2e/tests/profile.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Navegar a `/tabs/profile` | Página carga |
| 2 | Cambiar peso actual | Nuevo valor visible en el campo |
| 3 | Guardar cambios | Toast de confirmación aparece |
| 4 | Volver al dashboard | `calorieGoal` refleja nuevo TDEE |

### E2E-09: Comportamiento Offline

Archivo: `e2e/tests/offline.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Simular offline (bloquear todas las rutas de API) | — |
| 2 | Navegar al dashboard | Banner "Mostrando datos locales" visible |
| 3 | Agregar un alimento manualmente | Alimento aparece en la lista |
| 4 | Badge de sync muestra "Pendiente" | Estado visual correcto |

### E2E-10: Flujo Coach IA

Archivo: `e2e/tests/coach.spec.ts`

| Paso | Acción | Aserción |
|------|--------|----------|
| 1 | Mockear `/ai/coach-advice` con respuesta de consejo | — |
| 2 | Navegar a `/tabs/coach` | Página carga |
| 3 | Esperar o triggear el consejo | Texto de consejo visible |

---

## 6. Cobertura por Funcionalidad

| Funcionalidad prometida | Unidad | Integración | E2E |
|-------------------------|--------|-------------|-----|
| Registro con IA (texto natural) | ✅ I-06–12 | ✅ I-06 | ✅ E2E-03 |
| Búsqueda manual (Open Food Facts) | ✅ I-01–05 | ✅ | ✅ E2E-04 |
| Cálculo automático de metas (BMR/TDEE) | ✅ U-01–09 | — | ✅ E2E-08 |
| Tracker de agua | ✅ U-21–23 | — | ✅ E2E-05 |
| Historial y progreso semanal | ✅ U-24–29 | — | ✅ E2E-07 |
| Copiar comida de ayer | — | — | ✅ E2E-06 |
| Sincronización cloud (Outbox) | ✅ O-01–07 | — | ✅ E2E-09 |
| Auth Google / Login | ✅ A-01–05 | — | ✅ E2E-02 |
| Onboarding | — | — | ✅ E2E-01 |
| Coach IA | — | — | ✅ E2E-10 |

---

## 7. Orden de implementación sugerido

```
Fase 1 — Unitarias (más fácil, sin browser)
  ├── Ampliar nutrition-state.service.spec.ts (U-01 a U-33)
  ├── Crear outbox.service.spec.ts (O-01 a O-07)
  └── Crear auth.service.spec.ts (A-01 a A-05)

Fase 2 — Integración de componentes
  ├── food-search.component.spec.ts (I-01 a I-05)
  └── ai-input.component.spec.ts (I-06 a I-12)

Fase 3 — E2E con Playwright
  ├── Crear helper compartido: e2e/helpers/setup.ts (mocks y login bypass)
  ├── onboarding.spec.ts (E2E-01)
  ├── auth.spec.ts (E2E-02)
  ├── ai-add-all.spec.ts (E2E-03) ← mejorar el existente
  ├── food-search.spec.ts (E2E-04)
  ├── water-tracker.spec.ts (E2E-05)
  ├── copy-yesterday.spec.ts (E2E-06)
  ├── progress.spec.ts (E2E-07)
  ├── profile.spec.ts (E2E-08)
  ├── offline.spec.ts (E2E-09)
  └── coach.spec.ts (E2E-10)
```

> [!TIP]
> Empezar por las pruebas **unitarias de los cálculos** (Fase 1). Son las más rápidas de correr (`npm test`) y dan confianza inmediata sobre la lógica central de la app.

> [!NOTE]
> Para las pruebas E2E, hay que crear un helper `e2e/helpers/setup.ts` que centralice el mock de endpoints y el bypass de login, así cada spec es más conciso.
