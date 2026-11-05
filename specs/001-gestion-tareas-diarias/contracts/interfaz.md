# Contrato: interfaz de usuario

**Plan**: [../plan.md](../plan.md) | **Especificación**: [../spec.md](../spec.md)

Describe lo que el usuario ve y puede hacer, y los nombres accesibles que usan las pruebas de integración para encontrar cada elemento. Las pruebas buscan los elementos **por su rol y su texto visible**, no por clases CSS, para que el diseño pueda cambiar sin romperlas.

## Estructura de la página

1. **Encabezado**: título "Mis tareas".
2. **Zona de avisos** (`role="status"`): solo aparece cuando hay un problema con el guardado (ver [almacenamiento.md](almacenamiento.md)).
3. **Formulario de tarea** (`<form>` con nombre accesible "Nueva tarea" o "Editar tarea"):

   | Campo | Control | Etiqueta | Reglas |
   |-------|---------|----------|--------|
   | Título | `<input type="text" maxlength="200" required>` | "Título" | Obligatorio. |
   | Fecha límite | `<input type="date">` | "Fecha límite (opcional)" | Se puede dejar vacía o vaciarla. |
   | Prioridad | 3 opciones (radio o `<select>`) | "Prioridad": Alta / Media / Baja | "Media" está elegida por defecto. |

   - Al crear, el botón principal dice **"Añadir tarea"**.
   - Al editar, el botón dice **"Guardar cambios"** y aparece **"Cancelar"**.
   - Si hay un error, el mensaje aparece junto al campo afectado (vinculado con `aria-describedby`) y el foco vuelve a ese campo. No se guarda nada.
   - Tras crear una tarea, el formulario se vacía, vuelve a "Media" y el foco vuelve a "Título".

4. **Lista de tareas** (`<ul>` con nombre accesible "Tareas"), ordenada según [data-model.md](../data-model.md#orden-de-la-lista-fr-005). Cada tarea (`<li>`) muestra:

   | Elemento | Detalle |
   |----------|---------|
   | Casilla | `<input type="checkbox">` con nombre accesible "Completar «título»" (marcada si está completada). |
   | Título | Texto completo. Si es largo, ocupa varias líneas. Tachado si está completada. |
   | Prioridad | Texto visible: "Alta", "Media" o "Baja", además del color. |
   | Fecha límite | En español (p. ej. "6 nov 2026"). No aparece si no tiene fecha. |
   | Marca de vencida | Solo en pendientes vencidas: texto "Vencida", además del resaltado de color. |
   | Botón "Editar" | Nombre accesible "Editar «título»". |
   | Botón "Borrar" | Nombre accesible "Borrar «título»". Pide confirmación: "¿Borrar la tarea «título»?" |

5. **Estado vacío**: si no hay tareas, en lugar de la lista se ve "No tienes tareas. Escribe la primera arriba."
6. **Botón "Borrar completadas"**: solo aparece si hay al menos una completada. Pide confirmación: "¿Borrar N tareas completadas?" (en singular si es 1).

## Reglas comunes

- Todos los controles miden al menos 44×44 px y funcionan solo con toques (FR-016).
- No hay desplazamiento horizontal a partir de 360 px de ancho.
- Ninguna información depende solo del color: prioridad y "vencida" siempre llevan texto.
- Los títulos se muestran como texto. Si alguien escribe HTML en un título, se ve tal cual y no se ejecuta.
- Al volver a la pestaña (o al recargar), la marca "Vencida" se recalcula con la fecha de ese momento.
