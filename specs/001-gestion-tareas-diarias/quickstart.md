# Quickstart: validar "Gestión de tareas diarias"

**Plan**: [plan.md](plan.md) | **Especificación**: [spec.md](spec.md)

Guía para comprobar, una vez implementada, que la funcionalidad cumple la especificación.

## Requisitos previos

- Node.js 22 o superior, con npm.
- Un navegador actual (Chrome, Edge, Firefox o Safari).

## Puesta en marcha

```powershell
npm install      # instala solo las herramientas de prueba (Vitest y jsdom)
npm test         # ejecuta todas las pruebas automáticas una vez
npm start        # sirve la app en http://localhost:8080
```

**Resultado esperado**: `npm test` termina sin pruebas fallidas, y la app abre en el navegador con el mensaje "No tienes tareas. Escribe la primera arriba."

## Comprobación manual en móvil (principio III)

Abre la app con las herramientas de desarrollo del navegador en modo dispositivo, con **360 px de ancho**, y repite los escenarios siguientes. En todos ellos:

- no debe haber desplazamiento horizontal;
- todos los botones y casillas deben poder pulsarse cómodamente (al menos 44×44 px);
- no hace falta pasar el ratón por encima de nada ni usar el teclado salvo para escribir.

## Escenarios

Cada escenario corresponde a una historia de la [especificación](spec.md); los detalles de la pantalla están en [contracts/interfaz.md](contracts/interfaz.md).

| # | Pasos | Resultado esperado |
|---|-------|--------------------|
| 1 | Crea "Comprar pan" con prioridad Alta y fecha de mañana. Crea "Leer" sin tocar la prioridad ni la fecha. | Aparecen las dos. "Leer" tiene prioridad Media y no muestra fecha. "Comprar pan" va primero. |
| 2 | Intenta crear una tarea con el título vacío o solo con espacios. | No se crea. Aparece "El título es obligatorio." |
| 3 | Crea tareas con fecha de ayer, hoy y mañana. | Solo la de ayer muestra "Vencida" y va la primera. |
| 4 | Marca como completada la tarea vencida. | Baja al final, se ve tachada y ya no dice "Vencida". Al desmarcarla, vuelve a su sitio. |
| 5 | Edita "Leer": cambia el título, ponle fecha de ayer y prioridad Baja. Luego vuelve a editarla, quita la fecha y cancela. | Tras guardar, se ve el título nuevo, aparece como vencida y se recoloca. Tras cancelar, no cambia nada. |
| 6 | Pulsa "Borrar" en una tarea y cancela; luego repite y acepta. | Al cancelar, sigue ahí. Al aceptar, desaparece. |
| 7 | Completa dos tareas y pulsa "Borrar completadas". | La confirmación dice "¿Borrar 2 tareas completadas?". Al aceptar, desaparecen solo esas dos y el botón se oculta. |
| 8 | Cierra el navegador por completo y vuelve a abrir la app. | Todas las tareas siguen con sus datos y su estado. |
| 9 | Abre la app en una ventana privada que bloquee el almacenamiento (o bloquea los datos del sitio). | La app funciona y avisa: "Tus tareas no se guardarán al cerrar el navegador." |
| 10 | En la consola del navegador, ejecuta `localStorage.setItem('mis-tareas', 'basura')` y recarga. | La lista sale vacía, aparece "No se pudieron recuperar tus tareas guardadas." y la app no se bloquea. |
| 11 | Crea una tarea con el título `<b>hola</b>`. | Se ve el texto tal cual, sin negrita. |

## Rendimiento (SC-005)

En la consola del navegador, guarda 500 tareas de prueba con el formato de [contracts/almacenamiento.md](contracts/almacenamiento.md) y recarga. La lista debe aparecer, y completar o borrar una tarea debe responder, sin demora perceptible (menos de 1 s).

Al terminar, borra los datos de prueba con `localStorage.removeItem('mis-tareas')`.
