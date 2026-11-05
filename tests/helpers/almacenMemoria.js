// Almacenamiento falso con la misma interfaz que localStorage, para pruebas deterministas.
// Opciones para simular fallos: { falloAlLeer, falloAlEscribir }.
export function crearAlmacenMemoria({ falloAlLeer = false, falloAlEscribir = false, datos = {} } = {}) {
  const guardado = new Map(Object.entries(datos));
  const almacen = {
    falloAlLeer,
    falloAlEscribir,
    getItem(clave) {
      if (almacen.falloAlLeer) throw new Error('lectura no disponible');
      return guardado.has(clave) ? guardado.get(clave) : null;
    },
    setItem(clave, valor) {
      if (almacen.falloAlEscribir) throw new Error('escritura no disponible');
      guardado.set(clave, String(valor));
    },
    removeItem(clave) {
      if (almacen.falloAlEscribir) throw new Error('escritura no disponible');
      guardado.delete(clave);
    },
    // Ayuda de prueba: lo que hay guardado sin pasar por los fallos simulados.
    leerDirecto(clave) {
      return guardado.has(clave) ? guardado.get(clave) : null;
    },
  };
  return almacen;
}
