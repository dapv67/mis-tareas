// Lectura y escritura de las tareas en el almacenamiento del navegador (localStorage).
// Recibe el almacenamiento como parámetro para poder probarlo con uno falso en memoria.
// Formato guardado y reglas: specs/001-gestion-tareas-diarias/contracts/almacenamiento.md
import { esFechaValida } from './fechas.js';
import { LIMITE_TITULO, PRIORIDADES } from './tareas.js';

const CLAVE = 'mis-tareas';
const CLAVE_DE_PRUEBA = 'mis-tareas-prueba';
const VERSION = 1;

export function almacenDisponible(almacen) {
  try {
    almacen.setItem(CLAVE_DE_PRUEBA, '1');
    almacen.removeItem(CLAVE_DE_PRUEBA);
    return true;
  } catch {
    return false;
  }
}

function esTareaValida(tarea) {
  return (
    tarea !== null &&
    typeof tarea === 'object' &&
    typeof tarea.id === 'string' &&
    tarea.id !== '' &&
    typeof tarea.titulo === 'string' &&
    tarea.titulo.trim() !== '' &&
    tarea.titulo.length <= LIMITE_TITULO &&
    (tarea.fechaLimite === null || esFechaValida(tarea.fechaLimite)) &&
    PRIORIDADES.includes(tarea.prioridad) &&
    typeof tarea.completada === 'boolean' &&
    Number.isFinite(tarea.creadaEn)
  );
}

function leerDocumento(almacen) {
  const sinDatos = (problema) => ({ tareas: [], problema });

  let texto;
  try {
    texto = almacen.getItem(CLAVE);
  } catch {
    return sinDatos('no-disponible');
  }
  if (texto === null) return sinDatos(null);

  let documento;
  try {
    documento = JSON.parse(texto);
  } catch {
    return sinDatos('datos-ilegibles');
  }
  const tieneElFormatoEsperado =
    documento !== null &&
    typeof documento === 'object' &&
    documento.version === VERSION &&
    Array.isArray(documento.tareas);
  if (!tieneElFormatoEsperado) return sinDatos('datos-ilegibles');

  const tareas = documento.tareas.filter(esTareaValida);
  return { tareas, problema: tareas.length === documento.tareas.length ? null : 'datos-ilegibles' };
}

// No borra nunca lo guardado: si está dañado, se conserva hasta que el usuario haga un cambio.
export function cargarTareas(almacen) {
  const resultado = leerDocumento(almacen);
  if (resultado.problema !== 'no-disponible' && !almacenDisponible(almacen)) {
    return { ...resultado, problema: 'no-disponible' };
  }
  return resultado;
}

export function guardarTareas(almacen, tareas) {
  try {
    almacen.setItem(CLAVE, JSON.stringify({ version: VERSION, tareas }));
    return true;
  } catch {
    return false;
  }
}
