# Implementation Plan: Gestión de tareas diarias

**Branch**: `001-gestion-tareas-diarias` (el proyecto aún no es un repositorio git) | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-gestion-tareas-diarias/spec.md`

## Summary

App web personal para organizar las tareas del día. Permite crear, editar, completar y borrar tareas (también todas las completadas de una vez). Cada tarea tiene título, fecha límite opcional y prioridad, y las pendientes con la fecha pasada aparecen resaltadas como "Vencida". Las tareas se conservan al cerrar el navegador.

Enfoque técnico, según lo pedido por el usuario: HTML, CSS y JavaScript sin frameworks, cargado como módulos ES nativos sin paso de compilación. Los datos se guardan en `localStorage` como un único documento JSON versionado. La lógica va en funciones puras, separadas del DOM y del almacenamiento, que se prueban con Vitest. La interfaz se prueba con Vitest + jsdom. Detalle de las decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: JavaScript (ES2022, módulos ES nativos), HTML5, CSS3. Node.js 22 solo para las pruebas y el servidor de desarrollo.

**Primary Dependencies**: ninguna en la app publicada. Para desarrollo: `vitest` y `jsdom`, con versión exacta (ver [research.md §R8](research.md#r8-pruebas-vitest--jsdom)).

**Storage**: `localStorage` del navegador, clave `mis-tareas`, formato en [contracts/almacenamiento.md](contracts/almacenamiento.md).

**Testing**: Vitest. Pruebas unitarias en entorno Node y pruebas de integración de la interfaz en jsdom. Se ejecutan con un único comando: `npm test`.

**Target Platform**: navegadores actuales de móvil y escritorio (Chrome, Edge, Firefox y Safari de los dos últimos años). La app se sirve por HTTP: en desarrollo, `http://localhost:8080`.

**Project Type**: aplicación web estática de una sola página (solo frontend, sin servidor propio en producción).

**Performance Goals**: con 500 tareas, la lista se muestra y responde a cada acción en menos de 1 s en un móvil de gama media (SC-005).

**Constraints**: usable desde 360 px de ancho, solo con toques y con controles de al menos 44×44 px. No necesita servidor propio: todo se guarda en el dispositivo. Sin frameworks ni dependencias en la app.

**Scale/Scope**: una sola persona y un solo dispositivo; hasta unos cientos de tareas; una pantalla.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo lo cumple el plan | Estado |
|-----------|------------------------|--------|
| **I. Código simple y legible** | Cinco módulos pequeños, cada uno con una sola responsabilidad (fechas, tareas, almacén, interfaz, entrada). Sin capas ni configurabilidad extra. Un único formulario para crear y editar. La lista se redibuja entera en lugar de actualizarse por partes. Nombres en español, iguales a los de la especificación. | ✅ Cumple |
| **II. Pruebas automáticas obligatorias** | Cada función de [contracts/modulos.md](contracts/modulos.md) y cada escenario de la especificación tiene pruebas. La fecha, los ids, las confirmaciones y el almacenamiento se reciben como parámetros, así que las pruebas no dependen del reloj ni de la red. Un único comando: `npm test`. | ✅ Cumple |
| **III. Interfaz apta para móvil** | CSS mobile-first, controles de 44×44 px como mínimo y ninguna acción que dependa de pasar el ratón por encima. Verificación manual a 360 px incluida en [quickstart.md](quickstart.md). | ✅ Cumple |
| **IV. Dependencias mínimas** | La app no tiene dependencias. Solo `vitest` (pedido por el usuario) y `jsdom` para desarrollo, justificados en [research.md §R8](research.md#r8-pruebas-vitest--jsdom), con versión exacta y `package-lock.json`. El servidor de desarrollo usa solo `node:http`. | ✅ Cumple |
| **Restricciones adicionales** | Se prefieren las capacidades nativas: `localStorage`, `<input type="date">`, `Intl.DateTimeFormat`, `crypto` (con un respaldo si no hay `randomUUID`) y `window.confirm()`. | ✅ Cumple |

**Resultado previo a Phase 0**: sin violaciones.

**Re-evaluación tras Phase 1** (con el modelo de datos y los contratos ya diseñados): sigue sin violaciones. El diseño no introduce módulos, dependencias ni abstracciones nuevas respecto al plan inicial.

## Project Structure

### Documentation (this feature)

```text
specs/001-gestion-tareas-diarias/
├── plan.md              # Este archivo
├── research.md          # Phase 0: decisiones técnicas
├── data-model.md        # Phase 1: entidad Tarea, estados y orden
├── quickstart.md        # Phase 1: cómo ejecutar y validar
├── contracts/
│   ├── almacenamiento.md  # Formato guardado en localStorage
│   ├── interfaz.md        # Lo que ve y puede hacer el usuario
│   └── modulos.md         # Funciones que exporta cada módulo
├── checklists/
│   └── requirements.md  # Revisión de calidad de la especificación
└── tasks.md             # Phase 2 (lo crea /speckit-tasks, no este comando)
```

### Source Code (repository root)

```text
index.html              # Página única: estructura y carga de src/main.js
styles.css              # Estilos mobile-first
src/
├── main.js             # Entrada: llama a iniciarApp con las piezas reales del navegador
├── interfaz.js         # Dibuja la página y conecta los eventos (DOM)
├── tareas.js           # Lógica pura: validar, crear, editar, completar, borrar, ordenar, vencida
├── fechas.js           # Lógica pura: hoy local, validar y formatear fechas
└── almacen.js          # Leer y guardar en localStorage, con gestión de errores
scripts/
└── servidor.js         # Servidor estático de desarrollo (solo node:http)
tests/
├── unit/
│   ├── tareas.test.js
│   ├── fechas.test.js
│   └── almacen.test.js
└── integration/
    └── interfaz.test.js  # jsdom: escenarios de la especificación de principio a fin
package.json            # Scripts "test" y "start"; devDependencies con versión exacta
package-lock.json
```

**Structure Decision**: un único proyecto estático en la raíz. `index.html` y `styles.css` quedan en la raíz para que la app se sirva tal cual, sin compilar. El código va en `src/`, separando la lógica pura (`tareas.js`, `fechas.js`), que se prueba sin navegador, del acceso al almacenamiento (`almacen.js`) y del DOM (`interfaz.js`). Las pruebas siguen esa misma separación: `tests/unit/` para la lógica y el almacén, `tests/integration/` para la interfaz completa en jsdom.

## Complexity Tracking

No hay violaciones de la constitución que justificar.
