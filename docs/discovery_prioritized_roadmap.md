# Descubrimientos y Prioridades

Fecha de analisis: 2026-07-12

## Resumen

FuelSmart ya tiene una base fuerte: Angular/Ionic, backend NestJS/Mongo, auth, IA para texto, Health Connect, outbox offline, versionado de entradas, pruebas unitarias y Playwright. El mayor valor ahora no esta en agregar pantallas sueltas, sino en cerrar confiabilidad, claridad de UX y flujos principales.

Verificaciones ejecutadas:

| Area | Resultado |
| --- | --- |
| Frontend build | OK |
| Frontend unit tests | 139/139 OK |
| Backend build | OK |
| Backend tests | 51/51 OK |
| Playwright e2e | 53/53 OK con build estatico |

## Prioridad 1 - UX de estado, sincronizacion y offline

Impacto: Muy alto  
Urgencia: Alta  
Riesgo que reduce: perdida o confusion de datos entre dispositivos
Estado: Iniciado

### Lo que descubrimos

La app ya tiene piezas importantes:

- Overlay de carga inicial en dashboard.
- Badge de estado de sync.
- Outbox para cambios offline.
- Versionado y merge en backend.
- Plan documentado de consistencia multi-dispositivo.

Pero el usuario todavia puede no entender con total claridad si esta viendo datos de nube, datos locales, cambios pendientes o errores de sincronizacion. En una app de salud/comidas, esa ambiguedad baja mucho la confianza.

### Objetivo UX

Que el usuario siempre pueda responder estas tres preguntas sin pensar:

1. Estoy viendo datos confirmados o locales?
2. Mis cambios ya se guardaron?
3. Que puedo hacer si algo falla?

### Trabajo propuesto

| Tarea | Impacto | Esfuerzo | Resultado esperado |
| --- | --- | --- | --- |
| Banner visible para `local/loading/cloud` | Alto | Bajo | Menos confusion al abrir la app |
| Estado compacto del outbox en dashboard | Alto | Medio | Cambios pendientes visibles |
| Copy claro para offline/sync error | Alto | Bajo | Mejor recuperacion ante fallos |
| Accion "reintentar sync" | Medio | Medio | Control directo del usuario |
| E2E estable para flujo offline y multi-dispositivo | Alto | Medio | Confianza antes de seguir con features |

### Criterios de aceptacion

- Cuando `dataReady` es false, el dashboard muestra carga sin exponer datos viejos.
- Cuando los datos vienen de localStorage, aparece un aviso persistente y entendible.
- Cuando hay cambios pendientes, el usuario ve cuantos cambios faltan por sincronizar.
- Si sync falla, la UI explica el problema y ofrece reintentar.
- Hay al menos una prueba e2e para: abrir offline, editar, ver pendiente, recuperar conexion, sincronizar.

### Primer paso recomendado

Empezar por la UI de estado en dashboard:

1. Agregar un banner de fuente de datos: `loading`, `cloud`, `local`.
2. Integrar contador de outbox pendiente.
3. Agregar copy corto y consistente para `synced`, `pending`, `syncing`, `error`.
4. Cubrirlo con una prueba e2e ligera.

### Avance inicial

Implementado:

- Banda de confianza en dashboard con fuente de datos y estado de sync.
- Copy para datos locales, cambios pendientes, guardando cambios y error de sincronizacion.
- Accion "Reintentar" para procesar outbox y refrescar desde servidor.
- Fallback local explicito cuando la hidratacion cloud falla o excede timeout.
- Conteo de outbox considera tambien items `failed`, para no ocultar cambios que requieren atencion.

## Prioridad 2 - Arreglar infraestructura de e2e

Impacto: Alto  
Urgencia: Alta  
Riesgo que reduce: no detectar regresiones de flujo real
Estado: Primer corte completado

### Lo que descubrimos

La suite Playwright arranca y varias pruebas pasan, pero `ng serve` genero muchos errores `ENOSPC: System limit for number of file watchers reached`. La ejecucion fue interrumpida despues de 42 pruebas pasadas, con 10 sin correr.

### Trabajo propuesto

| Tarea | Impacto | Esfuerzo | Resultado esperado |
| --- | --- | --- | --- |
| Usar build estatico para e2e | Alto | Medio | Menos dependencia de watchers |
| Separar script `e2e:serve` | Medio | Bajo | Comando reproducible |
| Reducir ruido de consola en Playwright | Medio | Bajo | Fallas mas faciles de leer |
| Revisar test interrumpido de onboarding | Medio | Bajo | Suite confiable |

### Avance inicial

Implementado:

- Servidor estatico local para `www/` sin dependencias nuevas.
- Playwright ahora ejecuta `ng build` y sirve el build estatico.
- `baseURL` unificada en `127.0.0.1`.
- `reuseExistingServer` queda opt-in con `E2E_REUSE_SERVER=1`, para evitar reutilizar accidentalmente un `ng serve` con watchers.
- Búsqueda manual estabilizada en e2e: el `ion-searchbar` ahora tiene altura estable y el helper dispara eventos Ionic (`ionInput`/`ionChange`) sin depender del shadow DOM.
- Suite e2e completa verificada: 53/53 OK.

## Prioridad 3 - Flujo central "Agregar comida"

Impacto: Alto  
Urgencia: Media  
Riesgo que reduce: friccion diaria

### Lo que descubrimos

El dashboard ofrece varias formas de registrar comida: IA, busqueda, recientes, captura rapida y meal blocks. Funciona, pero puede sentirse disperso.

### Trabajo propuesto

Crear un flujo unico:

1. Boton principal "Agregar comida".
2. Opciones: IA, Buscar producto, Captura rapida, Foto.
3. Confirmacion de comida destino.
4. Resultado visible inmediato y posibilidad de deshacer.

## Prioridad 4 - Camara con IA multimodal

Impacto: Alto  
Urgencia: Media  
Riesgo que reduce: diferenciacion de producto

### Lo que descubrimos

La pestaña Captura ya existe como captura rapida manual, pero la foto automatica sigue pendiente. Es una feature estrella, aunque conviene hacerla despues de estabilizar sync y e2e.

### Trabajo propuesto

- Capturar imagen desde web/Capacitor.
- Enviar imagen al backend.
- Analizar con modelo multimodal.
- Devolver JSON con alimentos, porciones y macros.
- Permitir editar antes de guardar.

## Prioridad 5 - Progreso como insights

Impacto: Medio-alto  
Urgencia: Media  
Riesgo que reduce: abandono por falta de feedback

### Lo que descubrimos

La pantalla Progreso ya tiene graficas de 7 dias, deficit, racha y prediccion. Puede evolucionar de numeros a recomendaciones accionables.

### Trabajo propuesto

- Resumen semanal en lenguaje natural.
- Comparacion contra meta: calorias, proteina, agua.
- Alertas suaves: bajo consumo de proteina, exceso repetido, falta de registro.
- Coach usando datos historicos, no solo el dia actual.

## Prioridad 6 - Health Connect listo para uso real

Impacto: Medio  
Urgencia: Media-baja  
Riesgo que reduce: integracion incompleta en Android

### Lo que descubrimos

El servicio existe y el plan esta documentado. Falta cerrar permisos, privacidad, validacion en dispositivo y UX de consentimiento.

### Trabajo propuesto

- Revisar permisos Android.
- Confirmar politica de privacidad.
- Probar lectura real de pasos, calorias y peso.
- Explicar que datos se leen y cuales se escriben.

## Prioridad 7 - Sistema visual y heuristicas de Nielsen

Impacto: Medio  
Urgencia: Media-baja  
Riesgo que reduce: inconsistencia y carga cognitiva

### Lo que descubrimos

La UI tiene una base consistente, pero hay oportunidad de formalizar estados, botones, vacios, errores y acciones destructivas.

### Trabajo propuesto

- Definir estados comunes: loading, empty, error, offline, synced.
- Unificar botones primarios, secundarios y destructivos.
- Agregar undo en acciones de riesgo.
- Revisar microcopy con lenguaje simple: evitar terminos tecnicos sin contexto.
