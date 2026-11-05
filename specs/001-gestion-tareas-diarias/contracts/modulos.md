# Contrato: módulos internos de JavaScript

**Plan**: [../plan.md](../plan.md) | **Modelo de datos**: [../data-model.md](../data-model.md)

Funciones que exporta cada módulo y que prueban las pruebas unitarias. Las funciones de `tareas.js` y `fechas.js` son **puras**: no tocan el DOM ni el almacenamiento, no leen el reloj y no modifican sus argumentos (devuelven listas nuevas). Así las pruebas son deterministas (principio II).

## `src/fechas.js`

| Función | Entrada | Salida |
|---------|---------|--------|
| `hoyLocal(ahora)` | un `Date` | texto `AAAA-MM-DD` con la fecha local de ese momento |
| `esFechaValida(texto)` | texto | `true` si es `AAAA-MM-DD` y existe en el calendario (p. ej. `2026-02-30` es `false`) |
| `formatearFecha(texto)` | texto `AAAA-MM-DD` | fecha legible en español, p. ej. "6 nov 2026" |

## `src/tareas.js`

| Función | Entrada | Salida |
|---------|---------|--------|
| `validarDatos({ titulo, fechaLimite, prioridad })` | datos del formulario | `{ ok: true, datos }` con el título ya recortado y la fecha vacía convertida en `null`, o `{ ok: false, errores: [{ campo, codigo }] }` (códigos en [data-model.md](../data-model.md#errores-de-validación)) |
| `crearTarea(datos, { id, creadaEn })` | datos ya validados, más el id y el momento de creación | una Tarea nueva, pendiente |
| `editarTarea(tareas, id, datos)` | lista, id y datos ya validados | lista nueva con esa tarea cambiada; `completada`, `id` y `creadaEn` se conservan |
| `alternarCompletada(tareas, id)` | lista e id | lista nueva con esa tarea completada o desmarcada |
| `borrarTarea(tareas, id)` | lista e id | lista nueva sin esa tarea |
| `borrarCompletadas(tareas)` | lista | lista nueva solo con las pendientes |
| `contarCompletadas(tareas)` | lista | número |
| `estaVencida(tarea, hoy)` | tarea y texto `AAAA-MM-DD` | booleano (regla en [data-model.md](../data-model.md)) |
| `ordenarTareas(tareas)` | lista | lista nueva ordenada según FR-005 |
| `generarId(cripto)` | objeto `crypto` (o uno falso en las pruebas) | texto único: un UUID si hay `randomUUID`; si no, 128 bits aleatorios en hexadecimal |

Si un `id` no existe, las funciones devuelven la lista sin cambios.

Además exporta las constantes `LIMITE_TITULO` (200) y `PRIORIDADES` (`"alta"`, `"media"`, `"baja"`), que usa `almacen.js` para validar lo guardado.

## `src/almacen.js`

Recibe el almacenamiento (`localStorage` en la app, un sustituto en memoria en las pruebas).

| Función | Entrada | Salida |
|---------|---------|--------|
| `almacenDisponible(almacen)` | almacenamiento | `true` si se puede escribir y borrar |
| `cargarTareas(almacen)` | almacenamiento | `{ tareas, problema }`, donde `problema` es `null`, `"datos-ilegibles"` o `"no-disponible"` (reglas en [almacenamiento.md](almacenamiento.md)) |
| `guardarTareas(almacen, tareas)` | almacenamiento y lista | `true` si se guardó, `false` si falló |

## `src/interfaz.js`

| Función | Entrada | Efecto |
|---------|---------|--------|
| `iniciarApp({ documento, almacen, confirmar, ahora, nuevoId })` | el `document`, el almacenamiento, una función de confirmación (por defecto `window.confirm`), una función que da la hora actual y otra que da ids nuevos | carga las tareas, dibuja la página según [interfaz.md](interfaz.md) y conecta los eventos |

Internamente se divide en funciones pequeñas (dibujar, leer el formulario, mostrar avisos); solo `iniciarApp` se exporta y se usa desde fuera.

Recibir estas piezas como parámetros permite que las pruebas de integración fijen la fecha, los ids y las respuestas de confirmación.

## `src/main.js`

Punto de entrada que carga `index.html`. Solo llama a `iniciarApp` con las piezas reales del navegador (`document`, `localStorage`, `window.confirm`, `() => new Date()`, `() => generarId(crypto)`).
