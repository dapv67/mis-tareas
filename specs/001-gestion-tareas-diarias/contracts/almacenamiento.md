# Contrato: formato guardado en el navegador

**Plan**: [../plan.md](../plan.md) | **Modelo de datos**: [../data-model.md](../data-model.md)

Este es el único dato que sobrevive al cerrar el navegador. Cualquier cambio en el formato debe subir `version` e incluir una conversión desde la versión anterior.

## Ubicación

- **Mecanismo**: `localStorage` del origen donde se sirve la app.
- **Clave**: `mis-tareas`
- **Valor**: texto JSON con la forma siguiente.

## Formato (versión 1)

```json
{
  "version": 1,
  "tareas": [
    {
      "id": "3f2b8c1e-7d4a-4c2e-9b1f-6a5d4e3c2b1a",
      "titulo": "Comprar pan",
      "fechaLimite": "2026-11-06",
      "prioridad": "alta",
      "completada": false,
      "creadaEn": 1793952000000
    },
    {
      "id": "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
      "titulo": "Llamar al dentista",
      "fechaLimite": null,
      "prioridad": "media",
      "completada": true,
      "creadaEn": 1793955600000
    }
  ]
}
```

Las reglas de cada campo están en [data-model.md](../data-model.md).

## Reglas de lectura

| Situación | Resultado |
|-----------|-----------|
| No existe la clave | Lista vacía, sin aviso (primer uso). |
| JSON válido, `version` 1 y todas las tareas válidas | Se cargan todas las tareas. |
| El JSON no se puede leer, `version` es desconocida o `tareas` no es una lista | Lista vacía y aviso "No se pudieron recuperar tus tareas guardadas." El valor guardado **no se borra** hasta el siguiente cambio del usuario. |
| Lista válida pero con alguna tarea mal formada | Se cargan solo las válidas y se muestra el mismo aviso. |
| `localStorage` no está disponible o no deja escribir | La app funciona solo en memoria y avisa: "Tus tareas no se guardarán al cerrar el navegador." |

## Reglas de escritura

- Se escribe el documento completo tras cada cambio confirmado: crear, editar, completar, desmarcar, borrar o borrar completadas (FR-013).
- Si una escritura falla, el cambio se mantiene en pantalla y se muestra el aviso de que no se guardará.
