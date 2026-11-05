import { describe, it, expect } from 'vitest';
import { almacenDisponible, cargarTareas, guardarTareas } from '../../src/almacen.js';
import { crearAlmacenMemoria } from '../helpers/almacenMemoria.js';

const CLAVE = 'mis-tareas';

function tarea(cambios = {}) {
  return {
    id: 'id-1',
    titulo: 'Comprar pan',
    fechaLimite: '2026-11-06',
    prioridad: 'alta',
    completada: false,
    creadaEn: 1000,
    ...cambios,
  };
}

function almacenCon(valor) {
  return crearAlmacenMemoria({ datos: { [CLAVE]: typeof valor === 'string' ? valor : JSON.stringify(valor) } });
}

describe('almacenDisponible', () => {
  it('es true si se puede escribir y borrar', () => {
    expect(almacenDisponible(crearAlmacenMemoria())).toBe(true);
  });

  it('es false si la escritura falla', () => {
    expect(almacenDisponible(crearAlmacenMemoria({ falloAlEscribir: true }))).toBe(false);
  });

  it('es false si no hay almacenamiento', () => {
    expect(almacenDisponible(null)).toBe(false);
    expect(almacenDisponible(undefined)).toBe(false);
  });

  it('no deja rastro en lo guardado', () => {
    const almacen = almacenCon({ version: 1, tareas: [] });
    almacenDisponible(almacen);
    expect(JSON.parse(almacen.leerDirecto(CLAVE))).toEqual({ version: 1, tareas: [] });
  });
});

describe('cargarTareas', () => {
  it('devuelve una lista vacía y sin problema si es el primer uso', () => {
    expect(cargarTareas(crearAlmacenMemoria())).toEqual({ tareas: [], problema: null });
  });

  it('carga las tareas guardadas con el formato de la versión 1', () => {
    const guardadas = [tarea(), tarea({ id: 'id-2', titulo: 'Leer', fechaLimite: null, prioridad: 'media', completada: true })];
    const resultado = cargarTareas(almacenCon({ version: 1, tareas: guardadas }));
    expect(resultado).toEqual({ tareas: guardadas, problema: null });
  });

  it('con un JSON ilegible devuelve lista vacía y datos-ilegibles, sin borrar lo guardado', () => {
    const almacen = almacenCon('esto no es json');
    expect(cargarTareas(almacen)).toEqual({ tareas: [], problema: 'datos-ilegibles' });
    expect(almacen.leerDirecto(CLAVE)).toBe('esto no es json');
  });

  it('con una versión desconocida devuelve lista vacía y datos-ilegibles', () => {
    const almacen = almacenCon({ version: 99, tareas: [tarea()] });
    expect(cargarTareas(almacen)).toEqual({ tareas: [], problema: 'datos-ilegibles' });
  });

  it('si tareas no es una lista, devuelve lista vacía y datos-ilegibles', () => {
    expect(cargarTareas(almacenCon({ version: 1, tareas: 'hola' }))).toEqual({ tareas: [], problema: 'datos-ilegibles' });
    expect(cargarTareas(almacenCon({ version: 1 }))).toEqual({ tareas: [], problema: 'datos-ilegibles' });
    expect(cargarTareas(almacenCon('null'))).toEqual({ tareas: [], problema: 'datos-ilegibles' });
  });

  it('si alguna tarea está mal formada, carga solo las válidas y avisa con datos-ilegibles', () => {
    const buena = tarea();
    const malas = [
      tarea({ id: 'x', titulo: '' }),
      tarea({ id: 'y', prioridad: 'urgente' }),
      tarea({ id: 'z', fechaLimite: '2026-02-30' }),
      tarea({ id: 'w', completada: 'si' }),
      tarea({ id: 'v', creadaEn: 'ayer' }),
      tarea({ id: '' }),
      'una cadena',
      null,
    ];
    const resultado = cargarTareas(almacenCon({ version: 1, tareas: [buena, ...malas] }));
    expect(resultado).toEqual({ tareas: [buena], problema: 'datos-ilegibles' });
  });

  it('si no se puede leer, devuelve lista vacía y no-disponible', () => {
    expect(cargarTareas(crearAlmacenMemoria({ falloAlLeer: true }))).toEqual({ tareas: [], problema: 'no-disponible' });
    expect(cargarTareas(null)).toEqual({ tareas: [], problema: 'no-disponible' });
  });

  it('si se puede leer pero no escribir, carga las tareas y avisa con no-disponible', () => {
    const almacen = almacenCon({ version: 1, tareas: [tarea()] });
    almacen.falloAlEscribir = true;
    expect(cargarTareas(almacen)).toEqual({ tareas: [tarea()], problema: 'no-disponible' });
  });
});

describe('guardarTareas', () => {
  it('escribe el documento completo bajo la clave mis-tareas y devuelve true', () => {
    const almacen = crearAlmacenMemoria();
    const tareas = [tarea(), tarea({ id: 'id-2', titulo: 'Leer' })];
    expect(guardarTareas(almacen, tareas)).toBe(true);
    expect(JSON.parse(almacen.leerDirecto(CLAVE))).toEqual({ version: 1, tareas });
  });

  it('lo guardado se puede volver a cargar igual', () => {
    const almacen = crearAlmacenMemoria();
    const tareas = [tarea({ completada: true })];
    guardarTareas(almacen, tareas);
    expect(cargarTareas(almacen)).toEqual({ tareas, problema: null });
  });

  it('devuelve false si la escritura falla', () => {
    expect(guardarTareas(crearAlmacenMemoria({ falloAlEscribir: true }), [tarea()])).toBe(false);
    expect(guardarTareas(null, [tarea()])).toBe(false);
  });
});
