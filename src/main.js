// Punto de entrada: conecta la app con las piezas reales del navegador.
import { iniciarApp } from './interfaz.js';
import { generarId } from './tareas.js';

// Con el acceso bloqueado (por ejemplo, datos del sitio desactivados), leer localStorage
// puede lanzar un error; sin almacenamiento la app funciona solo en memoria y avisa.
function obtenerAlmacen() {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

iniciarApp({
  documento: document,
  almacen: obtenerAlmacen(),
  confirmar: (mensaje) => window.confirm(mensaje),
  ahora: () => new Date(),
  nuevoId: () => generarId(crypto),
});
