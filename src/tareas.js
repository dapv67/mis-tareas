// Lógica pura de las tareas: no toca el DOM ni el almacenamiento, no lee el reloj
// y no modifica sus argumentos (devuelve listas y objetos nuevos).
import { esFechaValida } from './fechas.js';

export const LIMITE_TITULO = 200;
const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 };
export const PRIORIDADES = Object.keys(ORDEN_PRIORIDAD);
const PRIORIDAD_POR_DEFECTO = 'media';

// Valida y normaliza lo escrito en el formulario.
// Título: sin espacios al principio ni al final, entre 1 y 200 caracteres.
// Fecha límite: texto AAAA-MM-DD de un día real, o null si se deja vacía (se admiten fechas pasadas).
// Prioridad: "alta", "media" o "baja"; si no se indica ninguna, "media".
export function validarDatos({ titulo, fechaLimite, prioridad }) {
  const errores = [];

  const tituloLimpio = String(titulo ?? '').trim();
  if (tituloLimpio === '') {
    errores.push({ campo: 'titulo', codigo: 'titulo-vacio' });
  } else if (tituloLimpio.length > LIMITE_TITULO) {
    errores.push({ campo: 'titulo', codigo: 'titulo-largo' });
  }

  const fecha = fechaLimite ? fechaLimite : null;
  if (fecha !== null && !esFechaValida(fecha)) {
    errores.push({ campo: 'fechaLimite', codigo: 'fecha-invalida' });
  }

  const prioridadFinal = prioridad || PRIORIDAD_POR_DEFECTO;
  if (!Object.hasOwn(ORDEN_PRIORIDAD, prioridadFinal)) {
    errores.push({ campo: 'prioridad', codigo: 'prioridad-invalida' });
  }

  if (errores.length > 0) return { ok: false, errores };
  return { ok: true, datos: { titulo: tituloLimpio, fechaLimite: fecha, prioridad: prioridadFinal } };
}

export function crearTarea({ titulo, fechaLimite, prioridad }, { id, creadaEn }) {
  return { id, titulo, fechaLimite, prioridad, completada: false, creadaEn };
}

// Primero las pendientes; luego fecha límite más cercana (sin fecha al final);
// a igual fecha, prioridad alta, media, baja; y por último, orden de creación.
function compararTareas(a, b) {
  if (a.completada !== b.completada) return a.completada ? 1 : -1;
  if (a.fechaLimite !== b.fechaLimite) {
    if (a.fechaLimite === null) return 1;
    if (b.fechaLimite === null) return -1;
    return a.fechaLimite < b.fechaLimite ? -1 : 1;
  }
  const porPrioridad = ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad];
  if (porPrioridad !== 0) return porPrioridad;
  return a.creadaEn - b.creadaEn;
}

export function ordenarTareas(tareas) {
  return [...tareas].sort(compararTareas);
}

// "Vencida" no se guarda: se deduce. Una tarea con fecha de hoy todavía no está vencida;
// comparar los textos AAAA-MM-DD equivale a comparar las fechas.
export function estaVencida(tarea, hoy) {
  return !tarea.completada && tarea.fechaLimite !== null && tarea.fechaLimite < hoy;
}

export function alternarCompletada(tareas, id) {
  return tareas.map((tarea) => (tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea));
}

// Recibe datos ya validados (con validarDatos). El id, el estado y el momento de creación no cambian.
export function editarTarea(tareas, id, { titulo, fechaLimite, prioridad }) {
  return tareas.map((tarea) => (tarea.id === id ? { ...tarea, titulo, fechaLimite, prioridad } : tarea));
}

export function borrarTarea(tareas, id) {
  return tareas.filter((tarea) => tarea.id !== id);
}

export function borrarCompletadas(tareas) {
  return tareas.filter((tarea) => !tarea.completada);
}

export function contarCompletadas(tareas) {
  return tareas.filter((tarea) => tarea.completada).length;
}

// randomUUID solo existe en contextos seguros (HTTPS o localhost); getRandomValues está en todos.
export function generarId(cripto) {
  if (typeof cripto.randomUUID === 'function') return cripto.randomUUID();
  const bytes = cripto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
