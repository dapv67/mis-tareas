# Mis tareas

App web personal para organizar las tareas del día. Funciona en el navegador, sin cuentas ni servidor: las tareas se guardan en tu propio dispositivo.

## Qué permite hacer

- **Crear** tareas con título, fecha límite opcional y prioridad (alta, media o baja; por defecto, media).
- **Editar** el título, la fecha o la prioridad de una tarea ya creada.
- **Completar** y desmarcar tareas; las completadas pasan al final de la lista.
- **Borrar** una tarea (con confirmación) o todas las completadas de una vez.
- **Ver de un vistazo lo vencido:** las tareas pendientes con la fecha límite pasada se resaltan y llevan la etiqueta «Vencida». Una tarea con fecha de hoy aún no está vencida.
- **No perder nada al cerrar el navegador:** los datos se guardan en `localStorage`. Si el guardado no está disponible o los datos están dañados, la app lo avisa y sigue funcionando.

La lista se ordena sola: primero las pendientes, por fecha límite más cercana (las que no tienen fecha, al final) y, a igual fecha, por prioridad.

## Cómo está hecha

- HTML, CSS y JavaScript puros (módulos ES), **sin frameworks y sin dependencias en la app**.
- Diseñada primero para móvil: se usa desde 360 px de ancho, solo con toques y con controles de al menos 44×44 px.
- Pruebas automáticas con [Vitest](https://vitest.dev/) y jsdom.

## Cómo ejecutarla

Necesitas [Node.js](https://nodejs.org/) 22 o superior.

```bash
npm install   # instala solo las herramientas de prueba (vitest y jsdom)
npm start     # sirve la app en http://localhost:8080
npm test      # ejecuta todas las pruebas una vez
```

Los módulos ES no cargan abriendo `index.html` directamente desde el disco; por eso `npm start` levanta un pequeño servidor local (solo con módulos de Node, sin dependencias). Para usar otro puerto: `PORT=3000 npm start`.

## Estructura del proyecto

```text
index.html           Página única
styles.css           Estilos (mobile-first, tema claro y oscuro)
src/
├── main.js          Punto de entrada: conecta la app con el navegador
├── interfaz.js      Dibuja la página y conecta los eventos
├── tareas.js        Lógica pura: validar, crear, editar, ordenar, vencidas…
├── fechas.js        Fechas AAAA-MM-DD, "hoy" local y formato en español
└── almacen.js       Lectura y escritura en localStorage, con gestión de errores
scripts/servidor.js  Servidor estático de desarrollo
tests/
├── unit/            Pruebas de la lógica y del almacenamiento
├── integration/     Pruebas de la interfaz completa (jsdom)
└── helpers/         Ayudas compartidas por las pruebas
specs/               Especificación, plan, tareas y contratos de cada funcionalidad
.specify/            Constitución del proyecto y plantillas de Spec Kit
```

## Cómo se desarrolló

El proyecto sigue el flujo de [Spec Kit](https://github.com/github/spec-kit): especificación → plan → tareas → implementación, con pruebas escritas antes del código. Toda la documentación de la primera funcionalidad está en [`specs/001-gestion-tareas-diarias/`](specs/001-gestion-tareas-diarias/), y los principios que guían el proyecto (código simple, pruebas obligatorias, interfaz apta para móvil y dependencias mínimas) están en [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Alcance y límites

- Es una app de **una sola persona y un solo dispositivo**: los datos viven en el navegador donde se crean y no se sincronizan.
- Fuera de esta versión: descripciones o notas, categorías, búsqueda y filtros, recordatorios, tareas repetitivas, deshacer un borrado y exportar o importar tareas.
