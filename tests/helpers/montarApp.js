// Ayudas para las pruebas de integración de la interfaz (entorno jsdom).
// Aquí se concentra todo lo que depende de la estructura del HTML, para que un cambio
// de diseño solo obligue a tocar este archivo y src/interfaz.js.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Se parte de import.meta.url como texto: en jsdom, `URL` es el de jsdom y fileURLToPath no lo acepta.
const rutaIndex = resolve(dirname(fileURLToPath(import.meta.url)), '../../index.html');

// Carga el contenido de index.html en el documento de jsdom.
export function montarPagina(documento = document) {
  const html = readFileSync(rutaIndex, 'utf8');
  const cuerpo = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)[1];
  documento.body.innerHTML = cuerpo.replace(/<script[\s\S]*?<\/script>/gi, '');
  return documento;
}

export function elementos(documento = document) {
  return {
    formulario: documento.querySelector('form'),
    titulo: documento.querySelector('input[name="titulo"]'),
    fecha: documento.querySelector('input[name="fechaLimite"]'),
    prioridades: [...documento.querySelectorAll('input[name="prioridad"]')],
    botonGuardar: documento.querySelector('form button[type="submit"]'),
    botonCancelar: botonPorTexto(documento, 'Cancelar'),
    lista: documento.querySelector('ul[aria-label="Tareas"]'),
    avisos: documento.querySelector('[role="status"]'),
    mensajeVacio: documento.querySelector('.vacio'),
    errorTitulo: documento.querySelector('#error-titulo'),
    errorFecha: documento.querySelector('#error-fecha'),
  };
}

// Busca un botón por su texto visible (o su nombre accesible) exacto.
export function botonPorTexto(documento, texto) {
  return (
    [...documento.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === texto || b.getAttribute('aria-label') === texto,
    ) ?? null
  );
}

export function escribir(campo, valor) {
  campo.value = valor;
  campo.dispatchEvent(new Event('input', { bubbles: true }));
}

export function rellenarFormulario(documento, { titulo, fechaLimite, prioridad } = {}) {
  const { titulo: campoTitulo, fecha, prioridades } = elementos(documento);
  if (titulo !== undefined) escribir(campoTitulo, titulo);
  if (fechaLimite !== undefined) escribir(fecha, fechaLimite ?? '');
  if (prioridad !== undefined) {
    for (const radio of prioridades) radio.checked = radio.value === prioridad;
  }
}

export function enviarFormulario(documento) {
  const { formulario } = elementos(documento);
  formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

export function crearTareaDesdeFormulario(documento, datos) {
  rellenarFormulario(documento, datos);
  enviarFormulario(documento);
}

export function pulsar(elemento) {
  elemento.click();
}

// Resumen legible de cada tarea dibujada, en el orden en que aparecen.
export function tareasVisibles(documento = document) {
  const { lista } = elementos(documento);
  return [...lista.querySelectorAll('li')].map((li) => {
    const casilla = li.querySelector('input[type="checkbox"]');
    const etiqueta = casilla.getAttribute('aria-label');
    return {
      elemento: li,
      titulo: li.querySelector('.tarea-titulo').textContent,
      prioridad: li.querySelector('.prioridad')?.textContent ?? null,
      fecha: li.querySelector('.fecha')?.textContent ?? null,
      vencida: li.querySelector('.etiqueta-vencida') !== null,
      etiquetaVencida: li.querySelector('.etiqueta-vencida')?.textContent ?? null,
      completada: casilla.checked,
      casilla,
      etiquetaCasilla: etiqueta,
      botonEditar: botonPorTexto(li, `Editar «${li.querySelector('.tarea-titulo').textContent}»`),
      botonBorrar: botonPorTexto(li, `Borrar «${li.querySelector('.tarea-titulo').textContent}»`),
    };
  });
}

export function titulosVisibles(documento = document) {
  return tareasVisibles(documento).map((t) => t.titulo);
}
