# Data Model: Gestión de tareas diarias

**Fecha**: 2026-11-05 | **Plan**: [plan.md](plan.md) | **Especificación**: [spec.md](spec.md)

## Entidad: Tarea

| Campo | Tipo | Obligatorio | Reglas |
|-------|------|-------------|--------|
| `id` | texto (UUID) | sí | Lo genera el sistema al crear la tarea; es único y nunca cambia. |
| `titulo` | texto | sí | Se quitan los espacios del principio y del final. Debe tener entre 1 y 200 caracteres después de quitarlos (FR-003). |
| `fechaLimite` | texto `AAAA-MM-DD` o `null` | no | Debe ser una fecha de calendario válida. Se admiten fechas pasadas. `null` significa sin fecha. |
| `prioridad` | `"alta"` \| `"media"` \| `"baja"` | sí | Por defecto `"media"` (FR-002). |
| `completada` | booleano | sí | `false` al crear la tarea. |
| `creadaEn` | número (milisegundos desde 1970) | sí | Se fija al crear la tarea. Al editarla no cambia (FR-017). Sirve para desempatar el orden. |

**Valor calculado (no se guarda)**: `vencida = !completada && fechaLimite !== null && fechaLimite < hoy`, donde `hoy` es la fecha local del dispositivo en formato `AAAA-MM-DD` (FR-008, FR-010).

### Errores de validación

| Código | Cuándo | Mensaje visible |
|--------|--------|-----------------|
| `titulo-vacio` | El título está vacío o solo tiene espacios | "El título es obligatorio." |
| `titulo-largo` | El título tiene más de 200 caracteres (el campo ya lo impide al escribir y recorta lo pegado; la regla se comprueba igualmente como salvaguarda) | "El título no puede superar los 200 caracteres." |
| `fecha-invalida` | La fecha no existe en el calendario o no tiene el formato correcto | "La fecha límite no es válida." |
| `prioridad-invalida` | La prioridad no es una de las tres permitidas | (no debería llegar a la interfaz; se trata como error de programación) |

## Estados y transiciones

```text
                crear
   (nada) ──────────────▶ PENDIENTE ◀──────────┐
                            │   ▲              │
                  completar │   │ desmarcar    │ editar (sigue pendiente)
                            ▼   │              │
                          COMPLETADA ──────────┘ editar (sigue completada)
                            │
     borrar (con confirmación), desde cualquier estado
     "Borrar completadas" (con confirmación), solo las COMPLETADAS
                            ▼
                         (borrada, de forma permanente)
```

- "Vencida" no es un estado: es una marca que se calcula para las tareas PENDIENTES (por eso editar la fecha o completar la tarea la quita o la pone al instante, FR-018).
- Editar nunca cambia `completada`, `id` ni `creadaEn`.

## Orden de la lista (FR-005)

Se ordena comparando, en este orden:

1. `completada`: primero las pendientes y después las completadas.
2. `fechaLimite`: de la más cercana a la más lejana. Las tareas sin fecha van después de las que tienen fecha.
3. `prioridad`: alta, luego media, luego baja.
4. `creadaEn`: primero las creadas antes.

El mismo criterio se aplica dentro del grupo de completadas, para que su orden sea estable y fácil de predecir.

## Colección guardada

Todas las tareas se guardan juntas en un único documento. El formato exacto está en [contracts/almacenamiento.md](contracts/almacenamiento.md).

| Campo | Tipo | Reglas |
|-------|------|--------|
| `version` | número | Hoy es `1`. Si se cambia el formato, se sube el número y se convierten los datos antiguos. |
| `tareas` | lista de Tarea | Se guardan sin un orden concreto; el orden se calcula al mostrar. |

## Volumen previsto

Uso personal: decenas de tareas a la vez y, como mucho, unos cientos. El objetivo de rendimiento se mide con 500 (SC-005); a ~200 bytes por tarea son ~100 KB, muy por debajo del límite de `localStorage`.
