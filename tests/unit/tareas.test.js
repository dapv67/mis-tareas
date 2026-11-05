import { describe, it, expect } from 'vitest';
import {
  validarDatos,
  crearTarea,
  ordenarTareas,
  generarId,
  alternarCompletada,
  estaVencida,
  borrarTarea,
  borrarCompletadas,
  contarCompletadas,
  editarTarea,
} from '../../src/tareas.js';

function tarea(cambios = {}) {
  return {
    id: 'id-1',
    titulo: 'Tarea',
    fechaLimite: null,
    prioridad: 'media',
    completada: false,
    creadaEn: 1000,
    ...cambios,
  };
}

describe('validarDatos', () => {
  it('acepta datos correctos y los devuelve normalizados', () => {
    const resultado = validarDatos({ titulo: 'Comprar pan', fechaLimite: '2026-11-06', prioridad: 'alta' });
    expect(resultado).toEqual({
      ok: true,
      datos: { titulo: 'Comprar pan', fechaLimite: '2026-11-06', prioridad: 'alta' },
    });
  });

  it('rechaza un título vacío con titulo-vacio', () => {
    const resultado = validarDatos({ titulo: '', fechaLimite: '', prioridad: 'media' });
    expect(resultado.ok).toBe(false);
    expect(resultado.errores).toEqual([{ campo: 'titulo', codigo: 'titulo-vacio' }]);
  });

  it('rechaza un título con solo espacios con titulo-vacio', () => {
    const resultado = validarDatos({ titulo: '    ', fechaLimite: '', prioridad: 'media' });
    expect(resultado.ok).toBe(false);
    expect(resultado.errores).toEqual([{ campo: 'titulo', codigo: 'titulo-vacio' }]);
  });

  it('quita los espacios del principio y del final del título', () => {
    const resultado = validarDatos({ titulo: '  Llamar al dentista  ', fechaLimite: '', prioridad: 'baja' });
    expect(resultado.ok).toBe(true);
    expect(resultado.datos.titulo).toBe('Llamar al dentista');
  });

  it('acepta 200 caracteres y rechaza 201 con titulo-largo', () => {
    const justo = validarDatos({ titulo: 'a'.repeat(200), fechaLimite: '', prioridad: 'media' });
    expect(justo.ok).toBe(true);
    const largo = validarDatos({ titulo: 'a'.repeat(201), fechaLimite: '', prioridad: 'media' });
    expect(largo.ok).toBe(false);
    expect(largo.errores).toEqual([{ campo: 'titulo', codigo: 'titulo-largo' }]);
  });

  it('cuenta los 200 caracteres después de quitar los espacios', () => {
    const resultado = validarDatos({ titulo: `  ${'a'.repeat(200)}  `, fechaLimite: '', prioridad: 'media' });
    expect(resultado.ok).toBe(true);
  });

  it('rechaza una fecha que no existe con fecha-invalida', () => {
    const resultado = validarDatos({ titulo: 'Algo', fechaLimite: '2026-02-30', prioridad: 'media' });
    expect(resultado.ok).toBe(false);
    expect(resultado.errores).toEqual([{ campo: 'fechaLimite', codigo: 'fecha-invalida' }]);
  });

  it('convierte una fecha vacía en null', () => {
    expect(validarDatos({ titulo: 'Algo', fechaLimite: '', prioridad: 'media' }).datos.fechaLimite).toBeNull();
    expect(validarDatos({ titulo: 'Algo', fechaLimite: null, prioridad: 'media' }).datos.fechaLimite).toBeNull();
    expect(validarDatos({ titulo: 'Algo', prioridad: 'media' }).datos.fechaLimite).toBeNull();
  });

  it('admite fechas pasadas', () => {
    const resultado = validarDatos({ titulo: 'Algo', fechaLimite: '2000-01-01', prioridad: 'media' });
    expect(resultado.ok).toBe(true);
  });

  it('asigna prioridad media cuando no se indica ninguna', () => {
    expect(validarDatos({ titulo: 'Algo', fechaLimite: '' }).datos.prioridad).toBe('media');
    expect(validarDatos({ titulo: 'Algo', fechaLimite: '', prioridad: '' }).datos.prioridad).toBe('media');
  });

  it('rechaza una prioridad desconocida con prioridad-invalida', () => {
    const resultado = validarDatos({ titulo: 'Algo', fechaLimite: '', prioridad: 'urgente' });
    expect(resultado.ok).toBe(false);
    expect(resultado.errores).toEqual([{ campo: 'prioridad', codigo: 'prioridad-invalida' }]);
  });

  it('informa de varios errores a la vez', () => {
    const resultado = validarDatos({ titulo: '', fechaLimite: 'mañana', prioridad: 'media' });
    expect(resultado.ok).toBe(false);
    expect(resultado.errores.map((e) => e.codigo)).toEqual(['titulo-vacio', 'fecha-invalida']);
  });
});

describe('crearTarea', () => {
  it('crea una tarea pendiente con el id y el momento recibidos', () => {
    const datos = { titulo: 'Comprar pan', fechaLimite: '2026-11-06', prioridad: 'alta' };
    expect(crearTarea(datos, { id: 'abc', creadaEn: 123 })).toEqual({
      id: 'abc',
      titulo: 'Comprar pan',
      fechaLimite: '2026-11-06',
      prioridad: 'alta',
      completada: false,
      creadaEn: 123,
    });
  });
});

describe('ordenarTareas', () => {
  it('pone las pendientes antes que las completadas', () => {
    const lista = [tarea({ id: 'a', completada: true }), tarea({ id: 'b' })];
    expect(ordenarTareas(lista).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('ordena por fecha límite, de la más cercana a la más lejana', () => {
    const lista = [
      tarea({ id: 'lejana', fechaLimite: '2026-12-01' }),
      tarea({ id: 'cercana', fechaLimite: '2026-11-06' }),
    ];
    expect(ordenarTareas(lista).map((t) => t.id)).toEqual(['cercana', 'lejana']);
  });

  it('deja las tareas sin fecha después de las que tienen fecha', () => {
    const lista = [tarea({ id: 'sin' }), tarea({ id: 'con', fechaLimite: '2030-01-01' })];
    expect(ordenarTareas(lista).map((t) => t.id)).toEqual(['con', 'sin']);
  });

  it('a igual fecha, ordena por prioridad: alta, media y baja', () => {
    const lista = [
      tarea({ id: 'baja', prioridad: 'baja', fechaLimite: '2026-11-06' }),
      tarea({ id: 'alta', prioridad: 'alta', fechaLimite: '2026-11-06' }),
      tarea({ id: 'media', prioridad: 'media', fechaLimite: '2026-11-06' }),
    ];
    expect(ordenarTareas(lista).map((t) => t.id)).toEqual(['alta', 'media', 'baja']);
  });

  it('a igualdad de todo lo anterior, ordena por orden de creación', () => {
    const lista = [tarea({ id: 'segunda', creadaEn: 2000 }), tarea({ id: 'primera', creadaEn: 1000 })];
    expect(ordenarTareas(lista).map((t) => t.id)).toEqual(['primera', 'segunda']);
  });

  it('aplica el mismo criterio dentro de las completadas', () => {
    const lista = [
      tarea({ id: 'c2', completada: true, fechaLimite: '2026-12-01' }),
      tarea({ id: 'c1', completada: true, fechaLimite: '2026-11-06' }),
    ];
    expect(ordenarTareas(lista).map((t) => t.id)).toEqual(['c1', 'c2']);
  });

  it('no modifica la lista original', () => {
    const lista = [tarea({ id: 'b', fechaLimite: '2026-12-01' }), tarea({ id: 'a', fechaLimite: '2026-11-06' })];
    const copia = structuredClone(lista);
    ordenarTareas(lista);
    expect(lista).toEqual(copia);
  });
});

describe('generarId', () => {
  it('usa randomUUID cuando existe', () => {
    const cripto = { randomUUID: () => 'uuid-de-prueba' };
    expect(generarId(cripto)).toBe('uuid-de-prueba');
  });

  it('sin randomUUID, construye un id aleatorio con getRandomValues', () => {
    let contador = 0;
    const cripto = {
      getRandomValues(bytes) {
        for (let i = 0; i < bytes.length; i += 1) bytes[i] = ++contador;
        return bytes;
      },
    };
    const primero = generarId(cripto);
    const segundo = generarId(cripto);
    expect(primero).toMatch(/^[0-9a-f]{32}$/);
    expect(segundo).toMatch(/^[0-9a-f]{32}$/);
    expect(primero).not.toBe(segundo);
  });
});

describe('alternarCompletada', () => {
  it('marca como completada una tarea pendiente', () => {
    const resultado = alternarCompletada([tarea({ id: 'a' })], 'a');
    expect(resultado[0].completada).toBe(true);
  });

  it('desmarca una tarea completada', () => {
    const resultado = alternarCompletada([tarea({ id: 'a', completada: true })], 'a');
    expect(resultado[0].completada).toBe(false);
  });

  it('solo cambia la tarea indicada', () => {
    const lista = [tarea({ id: 'a' }), tarea({ id: 'b' })];
    const resultado = alternarCompletada(lista, 'b');
    expect(resultado.map((t) => t.completada)).toEqual([false, true]);
  });

  it('conserva el resto de los datos de la tarea', () => {
    const original = tarea({ id: 'a', titulo: 'Comprar pan', fechaLimite: '2026-11-06', prioridad: 'alta', creadaEn: 5 });
    const [cambiada] = alternarCompletada([original], 'a');
    expect(cambiada).toEqual({ ...original, completada: true });
  });

  it('no modifica la lista original ni sus tareas', () => {
    const lista = [tarea({ id: 'a' })];
    const copia = structuredClone(lista);
    alternarCompletada(lista, 'a');
    expect(lista).toEqual(copia);
  });

  it('con un id que no existe devuelve la lista sin cambios', () => {
    const lista = [tarea({ id: 'a' })];
    expect(alternarCompletada(lista, 'no-existe')).toEqual(lista);
  });
});

describe('estaVencida', () => {
  const HOY = '2026-11-05';

  it('una tarea pendiente con fecha anterior a hoy está vencida', () => {
    expect(estaVencida(tarea({ fechaLimite: '2026-11-04' }), HOY)).toBe(true);
    expect(estaVencida(tarea({ fechaLimite: '2025-12-31' }), HOY)).toBe(true);
  });

  it('una tarea con fecha de hoy no está vencida', () => {
    expect(estaVencida(tarea({ fechaLimite: '2026-11-05' }), HOY)).toBe(false);
  });

  it('una tarea con fecha futura no está vencida', () => {
    expect(estaVencida(tarea({ fechaLimite: '2026-11-06' }), HOY)).toBe(false);
  });

  it('una tarea completada con fecha pasada no está vencida', () => {
    expect(estaVencida(tarea({ fechaLimite: '2026-11-04', completada: true }), HOY)).toBe(false);
  });

  it('una tarea sin fecha nunca está vencida', () => {
    expect(estaVencida(tarea({ fechaLimite: null }), HOY)).toBe(false);
  });

  it('el resultado depende solo de la fecha que se le pasa como hoy', () => {
    const conFecha = tarea({ fechaLimite: '2026-11-05' });
    expect(estaVencida(conFecha, '2026-11-05')).toBe(false);
    expect(estaVencida(conFecha, '2026-11-06')).toBe(true);
  });
});

describe('borrarTarea', () => {
  it('quita solo la tarea indicada', () => {
    const lista = [tarea({ id: 'a' }), tarea({ id: 'b' }), tarea({ id: 'c' })];
    expect(borrarTarea(lista, 'b').map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('con un id que no existe devuelve la lista sin cambios', () => {
    const lista = [tarea({ id: 'a' })];
    expect(borrarTarea(lista, 'no-existe')).toEqual(lista);
  });

  it('no modifica la lista original', () => {
    const lista = [tarea({ id: 'a' }), tarea({ id: 'b' })];
    const copia = structuredClone(lista);
    borrarTarea(lista, 'a');
    expect(lista).toEqual(copia);
  });
});

describe('borrarCompletadas', () => {
  it('deja solo las pendientes', () => {
    const lista = [
      tarea({ id: 'a', completada: true }),
      tarea({ id: 'b' }),
      tarea({ id: 'c', completada: true }),
      tarea({ id: 'd' }),
    ];
    expect(borrarCompletadas(lista).map((t) => t.id)).toEqual(['b', 'd']);
  });

  it('sin completadas devuelve la misma lista', () => {
    const lista = [tarea({ id: 'a' })];
    expect(borrarCompletadas(lista)).toEqual(lista);
  });

  it('no modifica la lista original', () => {
    const lista = [tarea({ id: 'a', completada: true }), tarea({ id: 'b' })];
    const copia = structuredClone(lista);
    borrarCompletadas(lista);
    expect(lista).toEqual(copia);
  });
});

describe('contarCompletadas', () => {
  it('cuenta las tareas completadas', () => {
    const lista = [tarea({ id: 'a', completada: true }), tarea({ id: 'b' }), tarea({ id: 'c', completada: true })];
    expect(contarCompletadas(lista)).toBe(2);
  });

  it('con una lista vacía o sin completadas es 0', () => {
    expect(contarCompletadas([])).toBe(0);
    expect(contarCompletadas([tarea()])).toBe(0);
  });
});

describe('editarTarea', () => {
  const nuevosDatos = { titulo: 'Título nuevo', fechaLimite: '2026-12-24', prioridad: 'alta' };

  it('cambia el título, la fecha límite y la prioridad', () => {
    const [editada] = editarTarea([tarea({ id: 'a' })], 'a', nuevosDatos);
    expect(editada).toMatchObject(nuevosDatos);
  });

  it('permite quitar la fecha límite', () => {
    const lista = [tarea({ id: 'a', fechaLimite: '2026-11-06' })];
    const [editada] = editarTarea(lista, 'a', { ...nuevosDatos, fechaLimite: null });
    expect(editada.fechaLimite).toBeNull();
  });

  it('permite poner una fecha límite a una tarea que no la tenía', () => {
    const [editada] = editarTarea([tarea({ id: 'a', fechaLimite: null })], 'a', nuevosDatos);
    expect(editada.fechaLimite).toBe('2026-12-24');
  });

  it('conserva el id, el estado y el momento de creación', () => {
    const original = tarea({ id: 'a', completada: true, creadaEn: 555 });
    const [editada] = editarTarea([original], 'a', nuevosDatos);
    expect(editada.id).toBe('a');
    expect(editada.completada).toBe(true);
    expect(editada.creadaEn).toBe(555);
  });

  it('solo cambia la tarea indicada', () => {
    const lista = [tarea({ id: 'a', titulo: 'A' }), tarea({ id: 'b', titulo: 'B' })];
    const resultado = editarTarea(lista, 'b', nuevosDatos);
    expect(resultado[0]).toEqual(lista[0]);
    expect(resultado[1].titulo).toBe('Título nuevo');
  });

  it('no modifica la lista original ni sus tareas', () => {
    const lista = [tarea({ id: 'a' })];
    const copia = structuredClone(lista);
    editarTarea(lista, 'a', nuevosDatos);
    expect(lista).toEqual(copia);
  });

  it('con un id que no existe devuelve la lista sin cambios', () => {
    const lista = [tarea({ id: 'a' })];
    expect(editarTarea(lista, 'no-existe', nuevosDatos)).toEqual(lista);
  });
});
