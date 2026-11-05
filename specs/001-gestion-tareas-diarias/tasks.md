---

description: "Lista de tareas para implementar la gestión de tareas diarias"
---

# Tasks: Gestión de tareas diarias

**Input**: documentos de diseño en `specs/001-gestion-tareas-diarias/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: OBLIGATORIAS. La spec no las pide, pero el principio II de la constitución ("Pruebas automáticas obligatorias") sí. En cada historia, las pruebas se escriben primero y deben FALLAR antes de implementar. Se ejecutan con `npm test`.

**Organization**: las tareas se agrupan por historia de usuario para poder implementar y probar cada una por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin depender de tareas sin terminar)
- **[Story]**: historia a la que pertenece (US1 a US6)
- Todas las rutas son relativas a la raíz del proyecto (`C:\Users\alvar\Documents\ai-projects\mis-tareas`)

## Path Conventions

Proyecto único y estático (ver "Structure Decision" en [plan.md](plan.md)): `index.html` y `styles.css` en la raíz, código en `src/`, pruebas en `tests/unit/` y `tests/integration/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicializar el proyecto y su estructura

- [X] T001 Crear `package.json` en la raíz con `"type": "module"`, el script `"test": "vitest run"` y el script `"start": "node scripts/servidor.js"`, y crear las carpetas `src/`, `scripts/`, `tests/unit/`, `tests/integration/` y `tests/helpers/`
- [X] T002 Instalar las únicas dependencias, solo de desarrollo y con versión exacta, con `npm install --save-dev --save-exact vitest jsdom`; comprobar que en `package.json` las versiones no llevan `^` ni `~` y que existe `package-lock.json`
- [X] T003 [P] Crear `scripts/servidor.js`: servidor estático de desarrollo con solo `node:http` y `node:fs` (sin dependencias) que sirve los archivos del proyecto en `http://localhost:8080`, con el tipo de contenido correcto para `.html`, `.css` y `.js` (los módulos ES exigen `text/javascript`) y responde 404 para lo que no existe
- [X] T004 [P] Crear `index.html` en la raíz con `lang="es"`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, enlace a `styles.css` y `<script type="module" src="src/main.js">`; la estructura de [contracts/interfaz.md](contracts/interfaz.md): encabezado "Mis tareas", zona de avisos con `role="status"`, formulario "Nueva tarea" (campos "Título" con `maxlength="200"`, "Fecha límite (opcional)" y "Prioridad" con Alta/Media/Baja y "Media" elegida por defecto, y botón "Añadir tarea"), y la lista con nombre accesible "Tareas"
- [X] T005 [P] Crear `styles.css` en la raíz con la base mobile-first de [research.md §R9](research.md#r9-css-mobile-first-sin-bibliotecas): variables de color y de tamaño táctil (44px), reinicio básico, `box-sizing: border-box`, ninguna anchura fija que cause desplazamiento horizontal a 360 px, y soporte de tema claro y oscuro con `prefers-color-scheme`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: piezas que necesitan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [X] T006 [P] Escribir `tests/unit/fechas.test.js` (debe fallar antes de T009) con casos para `hoyLocal(ahora)` (devuelve la fecha **local** en `AAAA-MM-DD`; p. ej. `new Date(2026, 10, 5, 23, 59)` da `"2026-11-05"`), `esFechaValida(texto)` (`"2026-11-05"` es válida; `"2026-02-30"`, `"2026-13-01"`, `"05/11/2026"` y `""` no lo son) y `formatearFecha(texto)` (`"2026-11-06"` da `"6 nov 2026"`)
- [X] T007 [P] Crear `tests/helpers/almacenMemoria.js`: un almacenamiento falso con `getItem`, `setItem` y `removeItem` en memoria, con opciones para simular que falla al leer o al escribir (lanzando error), que usan las pruebas de `almacen.js` y de la interfaz
- [X] T008 [P] Crear `tests/helpers/montarApp.js`: carga el contenido de `index.html` en el `document` de jsdom y devuelve ayudas para las pruebas de integración (buscar elementos por rol y texto visible, como pide [contracts/interfaz.md](contracts/interfaz.md), no por clases CSS)
- [X] T009 Implementar `src/fechas.js` con `hoyLocal`, `esFechaValida` y `formatearFecha` según [contracts/modulos.md](contracts/modulos.md): sin usar `new Date("AAAA-MM-DD")` (interpreta en UTC y desplaza el día) y formateando con `Intl.DateTimeFormat('es')`; hasta que `tests/unit/fechas.test.js` pase

**Checkpoint**: base lista; ya se pueden empezar las historias

---

## Phase 3: User Story 1 - Crear tareas y verlas en la lista (Priority: P1) 🎯 MVP

**Goal**: crear una tarea con título, fecha límite opcional y prioridad, y verla en la lista ordenada; con estado vacío y errores de validación.

**Independent Test**: crear varias tareas con distintas combinaciones de fecha y prioridad y comprobar que aparecen con sus datos y en el orden correcto (escenarios 1, 2 y 11 de [quickstart.md](quickstart.md)).

### Tests for User Story 1 ⚠️ (escribir primero; deben fallar)

- [X] T010 [P] [US1] Escribir en `tests/unit/tareas.test.js` las pruebas de `validarDatos` (título vacío o solo espacios da `titulo-vacio`; el título se devuelve sin espacios al inicio ni al final; 201 caracteres da `titulo-largo` y 200 es válido; fecha inexistente da `fecha-invalida`; fecha vacía se convierte en `null`; sin prioridad se asigna `"media"`; una prioridad distinta de `"alta"`, `"media"` o `"baja"` da `prioridad-invalida`), de `crearTarea` (tarea pendiente con `completada: false` y el `id` y `creadaEn` recibidos) y de `ordenarTareas` (FR-005: pendientes antes que completadas; luego fecha más cercana primero y las tareas sin fecha al final; a igual fecha, prioridad alta, media, baja; a igualdad, `creadaEn` menor primero; no modifica la lista original), y de `generarId` (usa `randomUUID` si existe; con un objeto que solo tiene `getRandomValues` devuelve un texto no vacío y distinto en dos llamadas)
- [X] T011 [P] [US1] Escribir en `tests/integration/interfaz.test.js` (con `// @vitest-environment jsdom` al inicio) las pruebas de la historia 1 con los ayudantes de `tests/helpers/`: mensaje "No tienes tareas. Escribe la primera arriba." con la lista vacía; crear "Comprar pan" con prioridad Alta y fecha la deja en la lista con título, "Alta" y la fecha en español; sin tocar prioridad queda "Media"; título vacío o con espacios no crea nada y muestra "El título es obligatorio." junto al campo, con el foco en él; tras crear, el formulario se vacía, vuelve a "Media" y el foco vuelve a "Título"; un título largo (200 caracteres) se muestra completo; un título `<b>hola</b>` se ve como texto y no crea ningún elemento `<b>`; el campo Título tiene `maxlength="200"` y, si se envía un título de 201 caracteres (asignado por código, porque jsdom no recorta valores asignados por código), no se crea y se muestra "El título no puede superar los 200 caracteres."

### Implementation for User Story 1

- [X] T012 [US1] Implementar en `src/tareas.js` (funciones puras, no modifican sus argumentos) `validarDatos`, `crearTarea`, `ordenarTareas` y `generarId(cripto)` (usa `cripto.randomUUID()` si existe y, si no, 128 bits aleatorios en hexadecimal con `cripto.getRandomValues`, porque `randomUUID` no existe fuera de HTTPS o `localhost`) según [contracts/modulos.md](contracts/modulos.md) y [data-model.md](data-model.md), citando las reglas literalmente: título "se quitan los espacios del principio y del final. Debe tener entre 1 y 200 caracteres después de quitarlos"; `fechaLimite` "texto `AAAA-MM-DD` o `null`", "debe ser una fecha de calendario válida", "se admiten fechas pasadas"; `prioridad` `"alta"` | `"media"` | `"baja"`, "por defecto `"media"`"; errores `titulo-vacio`, `titulo-largo`, `fecha-invalida` y `prioridad-invalida`; hasta que `tests/unit/tareas.test.js` pase
- [X] T013 [US1] Implementar en `src/interfaz.js` la función `iniciarApp({ documento, ahora, nuevoId })` (por ahora solo en memoria; el almacenamiento llega en la historia 2): dibujar la lista ordenada con `ordenarTareas` (casilla, título, prioridad con texto "Alta"/"Media"/"Baja", fecha con `formatearFecha` si la hay), el estado vacío, el envío del formulario con `validarDatos`/`crearTarea` (`creadaEn` con `ahora().getTime()` e id con `nuevoId()`), los mensajes de error junto al campo con `aria-describedby` ("El título es obligatorio.", "El título no puede superar los 200 caracteres.", "La fecha límite no es válida.") y el movimiento del foco; todos los textos se insertan con `textContent`, nunca con `innerHTML`; organizar `src/interfaz.js` en funciones pequeñas de una sola responsabilidad (por ejemplo `dibujarLista`, `dibujarTarea`, `leerFormulario`, `mostrarErrores` y `mostrarAviso`), dejando `iniciarApp` solo para conectar piezas (principio I de la constitución); las tareas siguientes añaden funciones nuevas en lugar de ampliar `iniciarApp`; hasta que pasen las pruebas de T011
- [X] T014 [US1] Crear `src/main.js` que llama a `iniciarApp` con las piezas reales del navegador: `document`, `() => new Date()` y `() => generarId(crypto)` (importando `generarId` de `src/tareas.js`)
- [X] T015 [P] [US1] Añadir a `styles.css` los estilos del formulario, la lista y el estado vacío: controles de al menos 44×44 px, títulos largos que se parten en varias líneas sin desplazamiento horizontal, prioridad siempre con texto además del color, y distribución mobile-first ampliada con `@media (min-width: 640px)`
- [X] T016 [US1] Comprobar a mano en el navegador a 360 px de ancho (`npm start`) los escenarios 1, 2 y 11 de [quickstart.md](quickstart.md): sin desplazamiento horizontal, controles cómodos de pulsar y sin depender de pasar el ratón por encima

**Checkpoint**: la historia 1 funciona sola como lista de pendientes (todavía sin conservar al cerrar)

---

## Phase 4: User Story 2 - Conservar las tareas al cerrar el navegador (Priority: P1)

**Goal**: que las tareas, con sus datos y estado, sigan ahí al cerrar y volver a abrir el navegador, y que los fallos de guardado se avisen sin bloquear la app.

**Independent Test**: crear tareas, cerrar el navegador por completo, volver a abrir la app y comprobar que todo sigue igual (escenarios 8, 9 y 10 de [quickstart.md](quickstart.md)).

### Tests for User Story 2 ⚠️ (escribir primero; deben fallar)

- [X] T017 [P] [US2] Escribir `tests/unit/almacen.test.js` con `tests/helpers/almacenMemoria.js` según [contracts/almacenamiento.md](contracts/almacenamiento.md): `almacenDisponible` es `true` si se puede escribir y borrar, y `false` si lanza error; `cargarTareas` devuelve `{ tareas: [], problema: null }` si no existe la clave `mis-tareas`, las tareas guardadas si el JSON es válido con `version: 1`, y `problema: "datos-ilegibles"` con lista vacía si el JSON no se puede leer, si `version` es desconocida o si `tareas` no es una lista (sin borrar el valor guardado), y solo las tareas válidas con `problema: "datos-ilegibles"` si alguna está mal formada; `problema: "no-disponible"` si el almacenamiento no está disponible; `guardarTareas` escribe `{ "version": 1, "tareas": [...] }` bajo la clave `mis-tareas` y devuelve `true`, o `false` si la escritura falla
- [X] T018 [P] [US2] Añadir a `tests/integration/interfaz.test.js` las pruebas de la historia 2: tras crear tareas, volver a montar la app con el mismo almacén en memoria las muestra con los mismos datos; con almacenamiento no disponible la app funciona y muestra "Tus tareas no se guardarán al cerrar el navegador."; con JSON dañado la lista sale vacía, se muestra "No se pudieron recuperar tus tareas guardadas." y el valor guardado no se sobrescribe hasta el primer cambio del usuario; si una escritura falla, la tarea nueva sigue en pantalla y se muestra el aviso

### Implementation for User Story 2

- [X] T019 [US2] Implementar `src/almacen.js` con `almacenDisponible`, `cargarTareas` y `guardarTareas` según [contracts/modulos.md](contracts/modulos.md) y [contracts/almacenamiento.md](contracts/almacenamiento.md): clave `mis-tareas`, documento `{ "version": 1, "tareas": [...] }`, todo el acceso al almacenamiento dentro de `try/catch`; hasta que `tests/unit/almacen.test.js` pase
- [X] T020 [US2] Ampliar `iniciarApp` en `src/interfaz.js` con el parámetro `almacen`: cargar las tareas al arrancar, guardar el documento completo tras cada cambio confirmado (FR-013) y mostrar los avisos en la zona `role="status"` con los textos exactos de [contracts/almacenamiento.md](contracts/almacenamiento.md); si no se puede guardar, la app sigue funcionando en memoria; hacerlo en funciones propias, de modo que `iniciarApp` solo conecte el evento; hasta que pasen las pruebas de T018
- [X] T021 [US2] Pasar `localStorage` como `almacen` a `iniciarApp` en `src/main.js`
- [X] T022 [P] [US2] Añadir a `styles.css` el estilo de la zona de avisos (visible, legible, con texto además del color y sin desplazamiento horizontal a 360 px)

**Checkpoint**: las historias 1 y 2 juntas forman el MVP: una lista de tareas que se conserva

---

## Phase 5: User Story 3 - Marcar tareas como completadas (Priority: P2)

**Goal**: marcar y desmarcar tareas como hechas; las completadas se ven distintas y pasan al final.

**Independent Test**: marcar una tarea pendiente, comprobar su aspecto y su posición, y desmarcarla (escenario 4 de [quickstart.md](quickstart.md)).

### Tests for User Story 3 ⚠️ (escribir primero; deben fallar)

- [X] T023 [P] [US3] Añadir a `tests/unit/tareas.test.js` las pruebas de `alternarCompletada(tareas, id)`: marca una pendiente, desmarca una completada, no modifica la lista original y, si el `id` no existe, devuelve la lista sin cambios
- [X] T024 [P] [US3] Añadir a `tests/integration/interfaz.test.js` las pruebas de la historia 3: la casilla "Completar «título»" marca la tarea, que se ve completada (tachada y con la casilla marcada) y pasa al final, debajo de las pendientes; al desmarcarla recupera su posición entre las pendientes; el cambio se conserva al volver a montar la app

### Implementation for User Story 3

- [X] T025 [US3] Implementar `alternarCompletada` en `src/tareas.js` (función pura); hasta que pasen las pruebas de T023
- [X] T026 [US3] En `src/interfaz.js`, conectar la casilla "Completar «título»" a `alternarCompletada`, marcar visualmente la tarea completada (FR-007), redibujar la lista y guardar; hacerlo en funciones propias, de modo que `iniciarApp` solo conecte el evento; hasta que pasen las pruebas de T024
- [X] T027 [P] [US3] Añadir a `styles.css` el aspecto de tarea completada (tachado y atenuado, sin depender solo del color)

**Checkpoint**: las historias 1, 2 y 3 funcionan por separado

---

## Phase 6: User Story 4 - Resaltar las tareas vencidas (Priority: P2)

**Goal**: que las tareas pendientes con la fecha límite pasada se vean resaltadas y marcadas como "Vencida".

**Independent Test**: crear tareas con fecha de ayer, hoy y mañana y comprobar que solo la de ayer aparece como vencida (escenarios 3 y 4 de [quickstart.md](quickstart.md)).

### Tests for User Story 4 ⚠️ (escribir primero; deben fallar)

- [X] T028 [P] [US4] Añadir a `tests/unit/tareas.test.js` las pruebas de `estaVencida(tarea, hoy)` con `hoy` fijado, siguiendo `vencida = !completada && fechaLimite !== null && fechaLimite < hoy`: fecha anterior a hoy y pendiente es `true`; fecha igual a hoy es `false`; fecha futura es `false`; tarea completada con fecha pasada es `false`; tarea sin fecha es `false`
- [X] T029 [P] [US4] Añadir a `tests/integration/interfaz.test.js` las pruebas de la historia 4 con `ahora` controlado: con fechas de ayer, hoy y mañana solo la de ayer muestra el texto "Vencida" y va la primera; una tarea creada directamente con fecha pasada aparece como vencida; al completar una tarea vencida (depende de la historia 3) deja de mostrar "Vencida"; si `ahora` pasa al día siguiente y se dispara `visibilitychange`, la tarea con fecha de hoy pasa a mostrar "Vencida"; una tarea sin fecha nunca la muestra

### Implementation for User Story 4

- [X] T030 [US4] Implementar `estaVencida` en `src/tareas.js` (función pura que recibe `hoy`, sin leer el reloj); hasta que pasen las pruebas de T028
- [X] T031 [US4] En `src/interfaz.js`, calcular `hoy` con `hoyLocal(ahora())` en cada redibujado, mostrar el texto "Vencida" y marcar la tarea como vencida cuando `estaVencida` sea `true`, y volver a dibujar la lista al disparar el evento `visibilitychange` de la página; hacerlo en funciones propias, de modo que `iniciarApp` solo conecte el evento; hasta que pasen las pruebas de T029
- [X] T032 [P] [US4] Añadir a `styles.css` el resaltado de las tareas vencidas (color de fondo o borde distinguible, además de la etiqueta "Vencida" que ya aporta el texto) manteniendo el contraste en tema claro y oscuro

**Checkpoint**: las historias 1 a 4 funcionan por separado

---

## Phase 7: User Story 5 - Borrar tareas (Priority: P3)

**Goal**: borrar una tarea (con confirmación) y borrar todas las completadas de una vez (con confirmación).

**Independent Test**: borrar una tarea cancelando y aceptando, y usar "Borrar completadas" (escenarios 6 y 7 de [quickstart.md](quickstart.md)).

### Tests for User Story 5 ⚠️ (escribir primero; deben fallar)

- [X] T033 [P] [US5] Añadir a `tests/unit/tareas.test.js` las pruebas de `borrarTarea(tareas, id)` (quita solo esa tarea; con un `id` inexistente devuelve la lista sin cambios), `borrarCompletadas(tareas)` (deja solo las pendientes) y `contarCompletadas(tareas)`; ninguna modifica la lista original
- [X] T034 [P] [US5] Añadir a `tests/integration/interfaz.test.js` las pruebas de la historia 5 con una función `confirmar` falsa: "Borrar «título»" pide confirmar con "¿Borrar la tarea «título»?" y, si se acepta, la tarea desaparece y no vuelve al montar de nuevo la app, y, si se cancela, no cambia nada; "Borrar completadas" solo aparece si hay al menos una completada, pide confirmar con "¿Borrar 2 tareas completadas?" (en singular, "¿Borrar 1 tarea completada?"), al aceptar quita solo las completadas y deja intactas las pendientes, y al cancelar no borra nada

### Implementation for User Story 5

- [X] T035 [US5] Implementar `borrarTarea`, `borrarCompletadas` y `contarCompletadas` en `src/tareas.js` (funciones puras); hasta que pasen las pruebas de T033
- [X] T036 [US5] En `src/interfaz.js`, añadir el parámetro `confirmar` a `iniciarApp`, los botones "Borrar «título»" en cada tarea y el botón "Borrar completadas" (visible solo si `contarCompletadas` es mayor que 0), con los mensajes de confirmación de [contracts/interfaz.md](contracts/interfaz.md); tras confirmar, redibujar y guardar; hacerlo en funciones propias, de modo que `iniciarApp` solo conecte el evento; hasta que pasen las pruebas de T034
- [X] T037 [US5] Pasar `confirmar: (mensaje) => window.confirm(mensaje)` a `iniciarApp` en `src/main.js`
- [X] T038 [P] [US5] Añadir a `styles.css` el estilo de los botones "Borrar" y "Borrar completadas" (al menos 44×44 px, sin desplazamiento horizontal a 360 px)

**Checkpoint**: las historias 1 a 5 funcionan por separado

---

## Phase 8: User Story 6 - Editar tareas (Priority: P3)

**Goal**: cambiar el título, la fecha límite (poner, cambiar o quitar) y la prioridad de una tarea con el mismo formulario, o cancelar la edición.

**Independent Test**: editar una tarea cambiando título, fecha y prioridad, y cancelar otra edición (escenario 5 de [quickstart.md](quickstart.md)).

### Tests for User Story 6 ⚠️ (escribir primero; deben fallar)

- [X] T039 [P] [US6] Añadir a `tests/unit/tareas.test.js` las pruebas de `editarTarea(tareas, id, datos)`: cambia título, fecha límite (incluso a `null`) y prioridad; conserva `id`, `completada` y `creadaEn` (FR-017); no modifica la lista original; con un `id` inexistente devuelve la lista sin cambios
- [X] T040 [P] [US6] Añadir a `tests/integration/interfaz.test.js` las pruebas de la historia 6: "Editar «título»" rellena el formulario (nombre accesible "Editar tarea") con los datos de la tarea y el botón pasa a "Guardar cambios" con un botón "Cancelar"; guardar cambia título, fecha y prioridad y recoloca la tarea según FR-005; quitar la fecha la deja sin fecha y sin "Vencida"; cambiar a mañana la fecha de una tarea vencida le quita "Vencida"; con el título vacío o con espacios no se guarda, se muestra "El título es obligatorio." y la tarea conserva sus datos; cancelar la deja exactamente igual; editar una tarea completada la mantiene completada; el cambio se conserva al volver a montar la app

### Implementation for User Story 6

- [X] T041 [US6] Implementar `editarTarea` en `src/tareas.js` (función pura que conserva `id`, `completada` y `creadaEn`, y reutiliza `validarDatos` para el título); hasta que pasen las pruebas de T039
- [X] T042 [US6] En `src/interfaz.js`, añadir el botón "Editar «título»" en cada tarea y el modo edición del mismo formulario (rellenar los campos, cambiar el nombre accesible a "Editar tarea", mostrar "Guardar cambios" y "Cancelar", y restaurar el formulario de creación al terminar), con las mismas validaciones, el foco y el guardado que al crear; hacerlo en funciones propias, de modo que `iniciarApp` solo conecte el evento; hasta que pasen las pruebas de T040
- [X] T043 [P] [US6] Añadir a `styles.css` el estilo del modo edición (señal clara de qué tarea se edita y botones "Guardar cambios" y "Cancelar" de al menos 44×44 px)

**Checkpoint**: las seis historias funcionan por separado

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: comprobaciones finales que afectan a varias historias

- [X] T044 [P] Añadir a `tests/integration/interfaz.test.js` una prueba con 500 tareas guardadas: la lista dibuja las 500 y completar o borrar una sigue funcionando (sin medir tiempos en la prueba, para que sea determinista; el tiempo se comprueba a mano en T046)
- [X] T045 Ejecutar `npm test` y comprobar que todas las pruebas pasan, sin pruebas omitidas ni errores en la salida
- [ ] T046 Recorrer a mano en el navegador a 360 px de ancho todos los escenarios de [quickstart.md](quickstart.md) (los 11 más la comprobación de rendimiento con 500 tareas, que debe responder en menos de 1 s) y confirmar que no hay desplazamiento horizontal, que todos los controles miden al menos 44×44 px y que todo se puede hacer solo con toques; comprobar también SC-004 (borrar una tarea = 2 toques, completarla = 1) y, con un cronómetro, SC-001 (crear la primera tarea en menos de 20 segundos) y SC-003 (identificar las vencidas en menos de 5 segundos)
- [X] T047 Comprobar el principio IV: `package.json` no tiene `dependencies` (solo `devDependencies` con `vitest` y `jsdom` en versión exacta), existe `package-lock.json` y ningún archivo de `src/` importa nada externo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; empieza de inmediato.
- **Foundational (Phase 2)**: depende de Setup (necesita `index.html` para T008 y `package.json` para ejecutar pruebas); bloquea todas las historias.
- **User Stories (Phase 3 a 8)**: dependen de Foundational y se hacen en orden de prioridad (US1 → US2 → US3 → US4 → US5 → US6).
- **Polish (Phase 9)**: depende de las historias que se quieran entregar.

### User Story Dependencies

- **US1 (P1)**: tras Foundational; sin dependencias de otras historias.
- **US2 (P1)**: modifica `src/interfaz.js` y `src/main.js` creados en US1, así que va después de US1.
- **US3 (P2)**: tras US2 (el cambio de estado se guarda y se prueba su conservación).
- **US4 (P2)**: tras US3 (una de sus pruebas completa una tarea vencida).
- **US5 (P3)**: tras US2 (el borrado se guarda y se prueba su conservación).
- **US6 (P3)**: tras US2 (la edición se guarda y se prueba su conservación).

Las historias tocan los mismos archivos (`src/tareas.js`, `src/interfaz.js`, `styles.css` y `tests/integration/interfaz.test.js`), por eso se hacen una detrás de otra y el paralelismo se da dentro de cada historia, entre archivos distintos.

### Within Each User Story

- Las pruebas se escriben primero y deben fallar antes de implementar.
- Lógica pura (`src/tareas.js`, `src/almacen.js`) → interfaz (`src/interfaz.js`) → entrada (`src/main.js`) → estilos.
- Cada historia termina cuando sus pruebas pasan y se cumple su "Independent Test".

### Parallel Opportunities

- Phase 1: T003, T004 y T005 en paralelo (archivos distintos).
- Phase 2: T006, T007 y T008 en paralelo.
- Dentro de cada historia: las pruebas unitarias y las de integración (archivos distintos) en paralelo, y los estilos en paralelo con la lógica y la interfaz.

---

## Parallel Example: User Story 1

```text
# Escribir las pruebas de la historia 1 a la vez (archivos distintos):
Task: "Pruebas unitarias de validarDatos, crearTarea y ordenarTareas en tests/unit/tareas.test.js"   (T010)
Task: "Pruebas de integración de crear y ver tareas en tests/integration/interfaz.test.js"           (T011)

# Después, en paralelo con la lógica y la interfaz:
Task: "Estilos del formulario, la lista y el estado vacío en styles.css"                             (T015)
```

---

## Implementation Strategy

### MVP First (User Stories 1 y 2)

1. Terminar Phase 1: Setup.
2. Terminar Phase 2: Foundational.
3. Terminar Phase 3: US1 (crear y ver).
4. Terminar Phase 4: US2 (conservar al cerrar).
5. **PARAR Y VALIDAR**: probar US1 y US2 con `npm test` y a mano en 360 px.

US2 forma parte del MVP porque una lista de tareas que se borra al cerrar el navegador no sirve para organizar el día (ambas son P1 en la spec).

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 + US2 → MVP: lista de tareas que se conserva.
3. US3 → ya se puede marcar lo hecho.
4. US4 → las vencidas se ven resaltadas.
5. US5 → se puede limpiar la lista.
6. US6 → se pueden corregir las tareas.
7. Polish → comprobaciones finales y entrega.

Cada historia añade valor sin romper las anteriores.

---

## Notes

- [P] = archivos distintos y sin dependencias entre sí.
- La etiqueta [Story] relaciona cada tarea con su historia de [spec.md](spec.md).
- No se crea `vitest.config.js`: la configuración por defecto basta, y cada archivo de integración declara su entorno con `// @vitest-environment jsdom`. Solo se añadiría si hiciera falta.
- Las funciones de `src/tareas.js`, `src/fechas.js` y `src/almacen.js` no leen el reloj ni el DOM; reciben `hoy`, `ahora` y el almacén como parámetros (principio II).
- Verifica que las pruebas fallan antes de implementar.
- Al cerrar cada historia con cambios de interfaz, repite a 360 px los escenarios del quickstart de esa historia (principio III), además de la comprobación completa de T046.
- El proyecto aún no es un repositorio git; si se inicializa, conviene hacer un commit tras cada tarea o grupo lógico.
- Evita: tareas vagas, dos tareas que editen el mismo archivo a la vez y dependencias entre historias que rompan su independencia.
