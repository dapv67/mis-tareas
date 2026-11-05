# Feature Specification: Gestión de tareas diarias

**Feature Branch**: `001-gestion-tareas-diarias` (el proyecto aún no es un repositorio git; no se creó rama)

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Quiero una app para organizar mis tareas diarias. Puedo crear, completar y borrar tareas. Cada tarea tiene título, fecha límite opcional y prioridad (alta, media, baja). Las tareas vencidas se muestran resaltadas. Las tareas se guardan aunque cierre el navegador."

## Clarifications

### Session 2026-11-05

- Q: ¿Se podrán editar las tareas después de crearlas (título, fecha límite o prioridad)? → A: Sí, edición completa: título, fecha límite (poner, cambiar o quitar) y prioridad.
- Q: ¿Qué pasa con las tareas completadas a medida que se acumulan? → A: Siguen visibles al final de la lista y hay una acción "Borrar completadas", con confirmación, que las elimina todas de una vez.
- Q: Al borrar una sola tarea, ¿confirmación previa o borrado inmediato con "Deshacer"? → A: Confirmación previa; sin opción de deshacer.
- Q: ¿Qué pasa con un título de más de 200 caracteres? → A: El campo no deja escribir más y recorta lo pegado a 200; la validación rechaza más de 200 solo como salvaguarda.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear tareas y verlas en la lista (Priority: P1)

Como persona que organiza su día, quiero anotar una tarea con su título, una fecha límite si la tiene y su prioridad, para tener a la vista todo lo que debo hacer.

**Why this priority**: sin poder crear y ver tareas no existe la aplicación; es el núcleo mínimo que ya aporta valor como lista de pendientes.

**Independent Test**: se prueba creando varias tareas con distintas combinaciones de fecha y prioridad y comprobando que aparecen en la lista con sus datos correctos.

**Acceptance Scenarios**:

1. **Given** la lista está vacía, **When** escribo el título "Comprar pan", elijo prioridad alta y confirmo, **Then** la tarea aparece en la lista como pendiente, con su título y prioridad alta visibles.
2. **Given** estoy creando una tarea, **When** indico una fecha límite, **Then** la tarea muestra esa fecha en la lista.
3. **Given** estoy creando una tarea, **When** no elijo prioridad, **Then** la tarea se crea con prioridad media.
4. **Given** estoy creando una tarea, **When** intento confirmarla con el título vacío o solo con espacios, **Then** la tarea no se crea y se me indica que el título es obligatorio.
5. **Given** la lista está vacía, **When** abro la aplicación, **Then** veo un mensaje que me invita a crear mi primera tarea.

---

### User Story 2 - Conservar las tareas al cerrar el navegador (Priority: P1)

Como usuario, quiero que mis tareas sigan ahí cuando cierre y vuelva a abrir la aplicación, para no perder lo que he anotado.

**Why this priority**: una lista que se borra al cerrar no sirve para organizar el día; es tan esencial como crear tareas.

**Independent Test**: se prueba creando tareas, cerrando completamente el navegador, volviendo a abrir la aplicación en el mismo dispositivo y navegador, y comprobando que todas las tareas siguen con sus mismos datos y estado.

**Acceptance Scenarios**:

1. **Given** he creado tres tareas, **When** cierro el navegador y vuelvo a abrir la aplicación, **Then** veo las mismas tres tareas con su título, fecha límite, prioridad y estado.
2. **Given** he completado o borrado una tarea, **When** cierro y vuelvo a abrir la aplicación, **Then** el cambio se mantiene.

---

### User Story 3 - Marcar tareas como completadas (Priority: P2)

Como usuario, quiero marcar una tarea como hecha para distinguir lo que ya terminé de lo que me queda pendiente.

**Why this priority**: da sentido de progreso y despeja la lista, pero la aplicación ya es útil sin ello.

**Independent Test**: se prueba marcando una tarea pendiente como completada y comprobando que cambia su aspecto y posición; luego desmarcándola y comprobando que vuelve a pendiente.

**Acceptance Scenarios**:

1. **Given** una tarea pendiente, **When** la marco como completada, **Then** se muestra visualmente como completada y pasa al final de la lista, debajo de las pendientes.
2. **Given** una tarea completada, **When** la desmarco, **Then** vuelve a estar pendiente y recupera su posición entre las pendientes.
3. **Given** una tarea vencida, **When** la marco como completada, **Then** deja de mostrarse resaltada como vencida.

---

### User Story 4 - Resaltar las tareas vencidas (Priority: P2)

Como usuario, quiero que las tareas cuya fecha límite ya pasó se vean resaltadas, para darme cuenta de inmediato de lo que se me está quedando atrás.

**Why this priority**: es lo que convierte la lista en una ayuda activa, pero depende de que ya existan tareas con fecha.

**Independent Test**: se prueba creando tareas con fecha límite de ayer, hoy y mañana, y comprobando que solo la de ayer aparece resaltada.

**Acceptance Scenarios**:

1. **Given** una tarea pendiente con fecha límite anterior a hoy, **When** veo la lista, **Then** la tarea aparece resaltada como vencida, de forma distinguible incluso sin percibir colores (por ejemplo, con un texto o icono de "Vencida").
2. **Given** una tarea pendiente con fecha límite de hoy, **When** veo la lista, **Then** no aparece como vencida.
3. **Given** una tarea pendiente con fecha límite de hoy, **When** abro la aplicación al día siguiente, **Then** la tarea aparece resaltada como vencida.
4. **Given** una tarea sin fecha límite, **When** veo la lista, **Then** nunca aparece como vencida.

---

### User Story 5 - Borrar tareas (Priority: P3)

Como usuario, quiero eliminar tareas que ya no me interesan para mantener la lista limpia.

**Why this priority**: mejora el orden de la lista, pero es lo menos crítico para el uso diario.

**Independent Test**: se prueba borrando una tarea, confirmando la acción y comprobando que desaparece de la lista y no vuelve al reabrir la aplicación.

**Acceptance Scenarios**:

1. **Given** una tarea en la lista, **When** elijo borrarla y confirmo, **Then** la tarea desaparece de la lista de forma permanente.
2. **Given** una tarea en la lista, **When** elijo borrarla pero cancelo la confirmación, **Then** la tarea sigue en la lista sin cambios.
3. **Given** hay varias tareas completadas y otras pendientes, **When** elijo "Borrar completadas" y confirmo, **Then** desaparecen todas las completadas y las pendientes quedan intactas.
4. **Given** hay tareas completadas, **When** elijo "Borrar completadas" pero cancelo la confirmación, **Then** no se borra ninguna tarea.
5. **Given** no hay ninguna tarea completada, **When** veo la lista, **Then** la acción "Borrar completadas" no está disponible.

---

### User Story 6 - Editar tareas (Priority: P3)

Como usuario, quiero cambiar el título, la fecha límite o la prioridad de una tarea ya creada, para corregir errores o reprogramarla sin tener que borrarla y crearla de nuevo.

**Why this priority**: evita rehacer tareas para pequeños cambios, pero la aplicación ya es útil sin ello.

**Independent Test**: se prueba editando el título, la fecha y la prioridad de una tarea existente y comprobando que los cambios se ven en la lista, reordenan la tarea si corresponde y se conservan al reabrir la aplicación.

**Acceptance Scenarios**:

1. **Given** una tarea existente, **When** cambio su título y guardo, **Then** la lista muestra el nuevo título.
2. **Given** una tarea con fecha límite, **When** quito la fecha y guardo, **Then** la tarea queda sin fecha, pasa a ordenarse con las tareas sin fecha y deja de poder aparecer como vencida.
3. **Given** una tarea vencida, **When** cambio su fecha límite a mañana, **Then** deja de mostrarse como vencida.
4. **Given** estoy editando una tarea, **When** dejo el título vacío o solo con espacios e intento guardar, **Then** el cambio no se guarda, se me indica que el título es obligatorio y la tarea conserva sus datos anteriores.
5. **Given** estoy editando una tarea, **When** cancelo la edición, **Then** la tarea queda exactamente como estaba.
6. **Given** una tarea completada, **When** la edito, **Then** se guardan los cambios y sigue completada.

---

### Edge Cases

- **Título solo con espacios**: se trata como vacío y la tarea no se crea.
- **Título muy largo**: se admite hasta 200 caracteres; en la lista se muestra completo, ajustándose a varias líneas sin provocar desplazamiento horizontal. Un texto pegado de más de 200 caracteres se recorta a 200.
- **Fecha límite en el pasado al crear**: se permite; la tarea aparece directamente como vencida.
- **Cambio de día con la aplicación abierta**: al volver a la aplicación o recargarla, el estado de vencida se recalcula con la fecha actual.
- **Almacenamiento no disponible** (por ejemplo, navegación privada que bloquea el guardado): la aplicación sigue funcionando durante la sesión y avisa de que las tareas no se conservarán al cerrar.
- **Datos guardados dañados o ilegibles**: la aplicación no se bloquea; arranca con la lista vacía y avisa de que no pudo recuperar las tareas.
- **Muchas tareas** (cientos): la lista sigue siendo utilizable y fluida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Los usuarios MUST poder crear una tarea indicando un título (obligatorio), una fecha límite (opcional) y una prioridad entre alta, media y baja.
- **FR-002**: El sistema MUST asignar prioridad media cuando el usuario no elija ninguna.
- **FR-003**: El sistema MUST rechazar la creación de una tarea cuyo título esté vacío o contenga solo espacios, informando al usuario del motivo; MUST eliminar los espacios sobrantes al inicio y al final del título. El título MUST tener como máximo 200 caracteres: el campo no deja escribir más y, si se pega un texto más largo, se recorta a 200 (si aun así llegara uno más largo, la tarea no se crea y se informa del motivo).
- **FR-004**: El sistema MUST mostrar todas las tareas en una única lista, indicando para cada una su título, su prioridad, su fecha límite (si tiene) y su estado (pendiente o completada).
- **FR-005**: El sistema MUST ordenar la lista así: primero las pendientes y después las completadas; entre las pendientes, por fecha límite de la más cercana a la más lejana, con las tareas sin fecha al final; a igual fecha, por prioridad (alta, media, baja) y, a igualdad, por orden de creación. Las completadas se ordenan entre sí con el mismo criterio.
- **FR-006**: Los usuarios MUST poder marcar una tarea pendiente como completada y desmarcar una completada para que vuelva a pendiente.
- **FR-007**: El sistema MUST distinguir visualmente las tareas completadas de las pendientes.
- **FR-008**: El sistema MUST considerar vencida una tarea pendiente cuya fecha límite sea anterior al día actual según la fecha del dispositivo; una tarea con fecha límite de hoy no está vencida.
- **FR-009**: El sistema MUST resaltar las tareas vencidas de forma que se distingan sin depender solo del color (por ejemplo, con una etiqueta de texto "Vencida").
- **FR-010**: El sistema MUST NOT mostrar como vencidas las tareas completadas ni las tareas sin fecha límite.
- **FR-011**: Los usuarios MUST poder borrar una tarea, previa confirmación; el borrado es permanente.
- **FR-012**: El sistema MUST conservar todas las tareas, con sus datos y estado, al cerrar y volver a abrir el navegador en el mismo dispositivo.
- **FR-013**: El sistema MUST guardar cada cambio (crear, editar, completar, desmarcar, borrar, borrar completadas) en el momento en que el usuario lo confirma, sin un paso de guardado aparte para conservarlo.
- **FR-014**: El sistema MUST avisar al usuario si no puede guardar las tareas de forma persistente o si no puede recuperar las guardadas, sin dejar de funcionar.
- **FR-015**: El sistema MUST mostrar un mensaje orientativo cuando no haya tareas.
- **FR-016**: Todas las funciones MUST poder usarse en pantallas desde 360 px de ancho, sin desplazamiento horizontal, únicamente con interacción táctil, y con elementos interactivos de al menos 44×44 px.
- **FR-017**: Los usuarios MUST poder editar una tarea existente, pendiente o completada, para cambiar su título, poner, cambiar o quitar su fecha límite y cambiar su prioridad; la edición aplica las mismas reglas del título que la creación (FR-003), puede cancelarse sin cambios y no altera el estado ni el momento de creación de la tarea.
- **FR-018**: Tras editar una tarea, el sistema MUST recolocarla en la lista según el orden de FR-005 y recalcular si está vencida.
- **FR-019**: Los usuarios MUST poder borrar todas las tareas completadas de una sola vez mediante la acción "Borrar completadas", previa confirmación que indique cuántas se borrarán; las tareas pendientes no se ven afectadas. La acción solo está disponible cuando hay al menos una tarea completada.

### Key Entities

- **Tarea**: algo que el usuario quiere hacer. Atributos: título (texto obligatorio, máx. 200 caracteres), fecha límite (día del calendario, opcional), prioridad (alta, media o baja), estado (pendiente o completada) y momento de creación (para desempatar el orden). "Vencida" no se guarda: se deduce de la fecha límite, el estado y el día actual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo puede crear su primera tarea con título, fecha y prioridad en menos de 20 segundos y sin instrucciones.
- **SC-002**: El 100 % de las tareas y sus estados se conservan tras cerrar y reabrir el navegador en el mismo dispositivo.
- **SC-003**: Al abrir la lista, el usuario identifica todas las tareas vencidas en menos de 5 segundos.
- **SC-004**: Marcar como completada o borrar una tarea requiere como máximo 2 toques.
- **SC-005**: Con 500 tareas guardadas, la lista se muestra y responde a las acciones sin demora perceptible (menos de 1 segundo).
- **SC-006**: Todas las acciones pueden completarse en una pantalla de 360 px de ancho sin desplazamiento horizontal.

## Assumptions

- La aplicación es personal y de un solo usuario: no hay cuentas, inicio de sesión ni tareas compartidas.
- Las tareas se guardan solo en el dispositivo y navegador donde se crean; no hay sincronización entre dispositivos ni copia en la nube.
- La fecha límite es un día del calendario, sin hora; "vencida" se calcula con la fecha local del dispositivo.
- Las tareas completadas permanecen visibles al final de la lista hasta que el usuario las borra, una a una o todas a la vez con "Borrar completadas"; no se eliminan automáticamente.
- Fuera del alcance de esta versión: descripciones o notas, categorías o etiquetas, búsqueda y filtros, recordatorios o notificaciones, tareas repetitivas, deshacer un borrado, y exportar o importar tareas.
- La interfaz estará en español.
