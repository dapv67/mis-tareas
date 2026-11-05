// Fechas como texto AAAA-MM-DD. No se usa new Date("AAAA-MM-DD") porque interpreta el
// texto en UTC y puede desplazar el día según la zona horaria.

const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

const formateadorEnEspanol = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function dosDigitos(numero) {
  return String(numero).padStart(2, '0');
}

export function hoyLocal(ahora) {
  return `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`;
}

export function esFechaValida(texto) {
  if (typeof texto !== 'string') return false;
  const partes = FORMATO_FECHA.exec(texto);
  if (!partes) return false;
  const [, anio, mes, dia] = partes.map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

export function formatearFecha(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return formateadorEnEspanol.format(new Date(anio, mes - 1, dia)).replace(/\./g, '');
}
