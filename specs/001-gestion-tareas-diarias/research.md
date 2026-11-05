# Research: Gestión de tareas diarias

**Fecha**: 2026-11-05 | **Plan**: [plan.md](plan.md)

Restricciones dadas por el usuario: HTML, CSS y JavaScript sin frameworks; datos en `localStorage`; pruebas con Vitest. No quedaba ningún "NEEDS CLARIFICATION" en el contexto técnico. Las decisiones siguientes resuelven cómo cumplir esas restricciones y la constitución.

## R1. Organización del JavaScript: módulos ES nativos, sin empaquetador

- **Decision**: el código se escribe como módulos ES (`import`/`export`) que el navegador carga directamente con `<script type="module">`. No hay paso de compilación ni empaquetador.
- **Rationale**: Vitest necesita importar el código como módulos, y los navegadores actuales los cargan sin herramientas extra. Un único formato sirve para la app y para las pruebas (principios I y IV).
- **Alternatives considered**: scripts clásicos con variables globales (no se pueden importar limpiamente desde Vitest); Vite como servidor y empaquetador (añade una dependencia que no hace falta para unos pocos archivos).

## R2. Servir la app en desarrollo: servidor estático propio con Node

- **Decision**: un script `scripts/servidor.js` de unas 30 líneas que usa solo el módulo `node:http` y sirve los archivos del proyecto en `http://localhost:8080`. Se arranca con `npm start`.
- **Rationale**: los módulos ES no cargan desde `file://`, y `crypto.randomUUID()` solo existe en contextos seguros (`localhost` lo es; ver R5 para el caso de abrir la app por la IP del PC). Node ya está instalado (v22), así que no se añade ninguna dependencia.
- **Alternatives considered**: los paquetes `serve` o `http-server` (dependencias innecesarias); `python -m http.server` (exige tener Python y no forma parte de las herramientas del proyecto).

## R3. Persistencia: `localStorage` con un único documento versionado

- **Decision**: todas las tareas se guardan bajo una clave, `mis-tareas`, como un JSON `{ "version": 1, "tareas": [...] }`. Se reescribe el documento completo tras cada cambio confirmado. El acceso a `localStorage` se aísla en `src/almacen.js`, que recibe el objeto de almacenamiento como parámetro para poder probarlo con un sustituto en memoria.
- **Rationale**: con cientos de tareas el JSON ocupa unas decenas de KB, muy por debajo del límite habitual (~5 MB), y reescribirlo entero tarda menos de un milisegundo. El campo `version` permite cambiar el formato en el futuro sin perder datos.
- **Gestión de errores** (FR-014 y casos límite de la especificación):
  - Al arrancar se comprueba si se puede escribir (escribir y borrar una clave de prueba dentro de `try/catch`). Si falla, la app funciona solo en memoria y muestra un aviso permanente.
  - Si el JSON guardado no se puede leer o no tiene el formato esperado, se arranca con la lista vacía, se muestra un aviso **y no se sobrescribe la copia dañada** hasta el primer cambio del usuario. Así no se pierde algo que todavía podría recuperarse a mano.
  - Si una escritura falla (por ejemplo, por cuota llena), se mantiene el cambio en pantalla y se muestra el aviso.
- **Alternatives considered**: IndexedDB (API asíncrona y más compleja, sin ventaja para este volumen); una clave por tarea (más difícil de leer y de mantener coherente).

## R4. Fechas y cálculo de "vencida"

- **Decision**: la fecha límite se guarda como texto `AAAA-MM-DD`, que es lo que devuelve `<input type="date">`. "Hoy" se calcula con la fecha **local** del dispositivo y el mismo formato. Una tarea está vencida si está pendiente, tiene fecha y `fechaLimite < hoy` (comparar los textos basta, porque el formato ordena igual que las fechas). Todas las funciones que dependen del día reciben `hoy` como parámetro.
- **Rationale**: evita los errores de zona horaria de `new Date("AAAA-MM-DD")`, que interpreta el texto en UTC y puede desplazar el día. Recibir `hoy` como parámetro hace las pruebas deterministas (principio II).
- **Cambio de día con la app abierta**: se recalcula la lista al volver a la pestaña (evento `visibilitychange`) y al recargar.
- **Presentación**: la fecha se muestra en español con `Intl.DateTimeFormat('es')`, que viene incluido en el navegador.
- **Alternatives considered**: guardar marcas de tiempo (no hace falta hora, y complica el "hoy"); bibliotecas de fechas (dependencia innecesaria).

## R5. Identificadores de tarea

- **Decision**: `crypto.randomUUID()` cuando el navegador lo ofrece; si no, un identificador aleatorio de 128 bits en hexadecimal construido con `crypto.getRandomValues`. Se encapsula en la función pura `generarId(cripto)` de `src/tareas.js`, que recibe el objeto `crypto` como parámetro.
- **Rationale**: `randomUUID` solo existe en contextos seguros (HTTPS o `localhost`); abrir la app desde un móvil con `http://192.168.x.x:8080` la rompería. `getRandomValues` está disponible en todos los contextos. Al recibir `crypto` como parámetro, la función se prueba sin depender del navegador.
- **Alternatives considered**: contador incremental (hay que guardarlo aparte); `Date.now()` (puede repetirse si se crean dos tareas en el mismo milisegundo).

## R6. Confirmaciones (borrar y "Borrar completadas")

- **Decision**: usar `window.confirm()` del navegador. La interfaz recibe la función de confirmación como parámetro, para sustituirla en las pruebas.
- **Rationale**: es la opción más simple y ya es táctil y accesible en todos los móviles. Con ella, borrar cuesta exactamente 2 toques (SC-004).
- **Alternatives considered**: un `<dialog>` propio (más código y más estilos, y jsdom no implementa del todo `showModal()`, lo que complica las pruebas). Se puede adoptar más adelante si se quiere un aspecto personalizado.

## R7. Interfaz: un solo formulario para crear y editar; renderizado completo

- **Decision**: el mismo formulario sirve para crear y editar. Al pulsar "Editar" en una tarea, el formulario se rellena con sus datos y aparecen "Guardar cambios" y "Cancelar". Tras cada cambio se vuelve a dibujar la lista entera a partir del estado; los textos se insertan con `textContent`, nunca con `innerHTML`.
- **Rationale**: un único formulario y un único punto de validación reducen el código (principio I). Redibujar la lista completa es lo más simple de razonar y, con 500 tareas, está muy por debajo del objetivo de 1 s (SC-005). `textContent` evita que un título con HTML se interprete como código.
- **Alternatives considered**: edición dentro de cada fila (duplica el formulario y la validación); actualizar solo los elementos que cambian (más complejo sin beneficio a esta escala).

## R8. Pruebas: Vitest + jsdom

- **Decision**:
  - Pruebas unitarias (`tests/unit/`) de la lógica de tareas, las fechas y el almacenamiento, en el entorno Node de Vitest, con un almacenamiento en memoria y `hoy` fijado.
  - Pruebas de integración (`tests/integration/`) de la interfaz con jsdom: se monta `index.html`, se simulan toques y envíos de formulario y se comprueba el HTML resultante y lo guardado.
  - Se ejecutan con un único comando: `npm test`.
- **Dependencias de desarrollo** (solo para pruebas; la app publicada no lleva ninguna):
  - `vitest`: la herramienta de pruebas elegida por el usuario.
  - `jsdom`: simula el navegador para probar la interfaz, y Vitest lo usa directamente. Escribir un simulador propio no es razonable. Ambos paquetes tienen mantenimiento activo.
  - Se instalan con versión exacta (`npm install --save-dev --save-exact`) y se fijan en `package-lock.json` (principio IV).
- **Verificación en móvil**: las pruebas automáticas no miden la apariencia. La comprobación a 360 px se hace a mano con las herramientas de desarrollo del navegador, siguiendo [quickstart.md](quickstart.md) (principio III).
- **Alternatives considered**: happy-dom (más rápido pero menos fiel al navegador); Playwright (navegadores reales, pero es una dependencia pesada que hoy no hace falta).

## R9. CSS: mobile-first sin bibliotecas

- **Decision**: una sola hoja `styles.css`, escrita primero para móvil y ampliada con `@media (min-width: 640px)`. Botones y casillas de al menos 44×44 px. Prioridades y "vencida" se marcan con texto o icono además del color (FR-009). Se respetan el tema claro u oscuro del sistema con `prefers-color-scheme`.
- **Rationale**: cumple el principio III y las restricciones adicionales de la constitución sin dependencias.
- **Alternatives considered**: frameworks CSS (descartados por el principio IV y por la petición del usuario).
