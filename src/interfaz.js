// Dibuja la página y conecta los eventos. Cada función hace una sola cosa;
// iniciarApp solo reúne las piezas y conecta los eventos.
import {
  alternarCompletada,
  borrarCompletadas,
  borrarTarea,
  contarCompletadas,
  crearTarea,
  editarTarea,
  estaVencida,
  ordenarTareas,
  validarDatos,
} from './tareas.js';
import { cargarTareas, guardarTareas } from './almacen.js';
import { formatearFecha, hoyLocal } from './fechas.js';

const MENSAJES_DE_ERROR = {
  'titulo-vacio': 'El título es obligatorio.',
  'titulo-largo': 'El título no puede superar los 200 caracteres.',
  'fecha-invalida': 'La fecha límite no es válida.',
};

const MENSAJES_DE_AVISO = {
  'no-disponible': 'Tus tareas no se guardarán al cerrar el navegador.',
  'datos-ilegibles': 'No se pudieron recuperar tus tareas guardadas.',
};

const NOMBRE_DE_PRIORIDAD = { alta: 'Alta', media: 'Media', baja: 'Baja' };

function buscarPiezas(documento) {
  return {
    formulario: documento.getElementById('formulario-tarea'),
    campos: {
      titulo: documento.getElementById('titulo'),
      fechaLimite: documento.getElementById('fecha-limite'),
    },
    errores: {
      titulo: documento.getElementById('error-titulo'),
      fechaLimite: documento.getElementById('error-fecha'),
    },
    botonGuardar: documento.getElementById('boton-guardar'),
    botonCancelar: documento.getElementById('boton-cancelar'),
    lista: documento.getElementById('lista-tareas'),
    mensajeVacio: documento.getElementById('mensaje-vacio'),
    avisos: documento.getElementById('avisos'),
    botonBorrarCompletadas: documento.getElementById('boton-borrar-completadas'),
  };
}

function crearElemento(documento, etiqueta, clase, texto) {
  const elemento = documento.createElement(etiqueta);
  if (clase) elemento.className = clase;
  // textContent, nunca innerHTML: un título con HTML se muestra como texto.
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// Botón de una tarea; su nombre accesible incluye el título para distinguirlos entre sí.
function crearBotonDeTarea(documento, accion, texto, tarea) {
  const boton = crearElemento(documento, 'button', undefined, texto);
  boton.type = 'button';
  boton.dataset.accion = accion;
  boton.setAttribute('aria-label', `${texto} «${tarea.titulo}»`);
  return boton;
}

function dibujarTarea(documento, tarea, { hoy, idEnEdicion }) {
  const vencida = estaVencida(tarea, hoy);
  const clases = [
    'tarea',
    tarea.completada && 'completada',
    vencida && 'vencida',
    tarea.id === idEnEdicion && 'en-edicion',
  ].filter(Boolean);
  const item = crearElemento(documento, 'li', clases.join(' '));
  item.dataset.id = tarea.id;

  // Un label hace pulsable toda el área táctil de 44×44 px, no solo la casilla.
  const contenedorCasilla = crearElemento(documento, 'label', 'tarea-casilla');
  const casilla = documento.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = tarea.completada;
  casilla.setAttribute('aria-label', `Completar «${tarea.titulo}»`);
  contenedorCasilla.append(casilla);

  const cuerpo = crearElemento(documento, 'div', 'tarea-cuerpo');
  const datos = crearElemento(documento, 'p', 'tarea-datos');
  datos.append(crearElemento(documento, 'span', 'prioridad', NOMBRE_DE_PRIORIDAD[tarea.prioridad]));
  if (tarea.fechaLimite !== null) {
    datos.append(crearElemento(documento, 'span', 'fecha', formatearFecha(tarea.fechaLimite)));
  }
  // El texto "Vencida" evita depender solo del color para distinguirla.
  if (vencida) datos.append(crearElemento(documento, 'span', 'etiqueta-vencida', 'Vencida'));
  const acciones = crearElemento(documento, 'div', 'tarea-acciones');
  acciones.append(
    crearBotonDeTarea(documento, 'editar', 'Editar', tarea),
    crearBotonDeTarea(documento, 'borrar', 'Borrar', tarea),
  );
  cuerpo.append(crearElemento(documento, 'p', 'tarea-titulo', tarea.titulo), datos, acciones);

  item.append(contenedorCasilla, cuerpo);
  return item;
}

function dibujarLista(documento, piezas, tareas, contexto) {
  const elementos = ordenarTareas(tareas).map((tarea) => dibujarTarea(documento, tarea, contexto));
  piezas.lista.replaceChildren(...elementos);
  piezas.mensajeVacio.hidden = tareas.length > 0;
  piezas.botonBorrarCompletadas.hidden = contarCompletadas(tareas) === 0;
}

function mensajeBorrarCompletadas(cantidad) {
  return `¿Borrar ${cantidad} ${cantidad === 1 ? 'tarea completada' : 'tareas completadas'}?`;
}

function leerFormulario(piezas) {
  const prioridad = piezas.formulario.querySelector('input[name="prioridad"]:checked');
  return {
    titulo: piezas.campos.titulo.value,
    fechaLimite: piezas.campos.fechaLimite.value,
    prioridad: prioridad ? prioridad.value : '',
  };
}

function rellenarFormulario(piezas, tarea) {
  piezas.campos.titulo.value = tarea.titulo;
  piezas.campos.fechaLimite.value = tarea.fechaLimite ?? '';
  piezas.formulario.querySelector(`input[name="prioridad"][value="${tarea.prioridad}"]`).checked = true;
}

function limpiarErrores(piezas) {
  for (const campo of Object.keys(piezas.errores)) {
    piezas.errores[campo].hidden = true;
    piezas.errores[campo].textContent = '';
    piezas.campos[campo].removeAttribute('aria-invalid');
    piezas.campos[campo].removeAttribute('aria-describedby');
  }
}

function mostrarErrores(piezas, errores) {
  limpiarErrores(piezas);
  for (const { campo, codigo } of errores) {
    const mensaje = piezas.errores[campo];
    if (!mensaje) continue;
    mensaje.textContent = MENSAJES_DE_ERROR[codigo];
    mensaje.hidden = false;
    piezas.campos[campo].setAttribute('aria-invalid', 'true');
    piezas.campos[campo].setAttribute('aria-describedby', mensaje.id);
  }
  const primerCampoConError = errores.map(({ campo }) => piezas.campos[campo]).find(Boolean);
  if (primerCampoConError) primerCampoConError.focus();
}

// El mismo formulario sirve para crear y para editar; estas dos funciones cambian su aspecto.
function mostrarModoCreacion(piezas) {
  piezas.formulario.reset();
  limpiarErrores(piezas);
  piezas.formulario.setAttribute('aria-label', 'Nueva tarea');
  piezas.formulario.classList.remove('editando');
  piezas.botonGuardar.textContent = 'Añadir tarea';
  piezas.botonCancelar.hidden = true;
}

function mostrarModoEdicion(piezas, tarea) {
  limpiarErrores(piezas);
  rellenarFormulario(piezas, tarea);
  piezas.formulario.setAttribute('aria-label', 'Editar tarea');
  piezas.formulario.classList.add('editando');
  piezas.botonGuardar.textContent = 'Guardar cambios';
  piezas.botonCancelar.hidden = false;
  piezas.campos.titulo.focus();
}

function mostrarAviso(piezas, problema) {
  piezas.avisos.textContent = MENSAJES_DE_AVISO[problema];
}

// Los controles de cada tarea comparten un único oyente en la lista; este dato dice de qué tarea vienen.
function idDeLaTarea(elemento) {
  return elemento.closest('li')?.dataset.id;
}

export function iniciarApp({ documento, almacen, confirmar, ahora, nuevoId }) {
  const piezas = buscarPiezas(documento);
  const { tareas: tareasGuardadas, problema } = cargarTareas(almacen);
  let tareas = tareasGuardadas;
  let idEnEdicion = null;
  if (problema) mostrarAviso(piezas, problema);

  // "Hoy" se calcula en cada dibujado, así que "vencida" siempre se evalúa con el día actual.
  function redibujar() {
    dibujarLista(documento, piezas, tareas, { hoy: hoyLocal(ahora()), idEnEdicion });
  }

  function salirDeEdicion() {
    idEnEdicion = null;
    mostrarModoCreacion(piezas);
  }

  // Todo cambio confirmado pasa por aquí: se guarda en el momento y se vuelve a dibujar.
  function aplicarCambio(tareasNuevas) {
    tareas = tareasNuevas;
    if (idEnEdicion !== null && !tareas.some((tarea) => tarea.id === idEnEdicion)) salirDeEdicion();
    if (!guardarTareas(almacen, tareas)) mostrarAviso(piezas, 'no-disponible');
    redibujar();
  }

  function guardarFormulario(datos) {
    const tareasNuevas =
      idEnEdicion === null
        ? [...tareas, crearTarea(datos, { id: nuevoId(), creadaEn: ahora().getTime() })]
        : editarTarea(tareas, idEnEdicion, datos);
    salirDeEdicion();
    piezas.campos.titulo.focus();
    aplicarCambio(tareasNuevas);
  }

  function entrarEnEdicion(tarea) {
    idEnEdicion = tarea.id;
    mostrarModoEdicion(piezas, tarea);
    redibujar();
  }

  function cancelarEdicion() {
    salirDeEdicion();
    piezas.campos.titulo.focus();
    redibujar();
  }

  function pedirBorrado(tarea) {
    if (confirmar(`¿Borrar la tarea «${tarea.titulo}»?`)) aplicarCambio(borrarTarea(tareas, tarea.id));
  }

  function pedirBorradoDeCompletadas() {
    if (confirmar(mensajeBorrarCompletadas(contarCompletadas(tareas)))) aplicarCambio(borrarCompletadas(tareas));
  }

  const accionesDeTarea = { editar: entrarEnEdicion, borrar: pedirBorrado };

  piezas.formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const resultado = validarDatos(leerFormulario(piezas));
    if (resultado.ok) guardarFormulario(resultado.datos);
    else mostrarErrores(piezas, resultado.errores);
  });

  piezas.botonCancelar.addEventListener('click', cancelarEdicion);

  piezas.lista.addEventListener('change', (evento) => {
    const id = idDeLaTarea(evento.target);
    if (id) aplicarCambio(alternarCompletada(tareas, id));
  });

  piezas.lista.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    const tarea = boton && tareas.find((candidata) => candidata.id === idDeLaTarea(boton));
    if (tarea) accionesDeTarea[boton.dataset.accion]?.(tarea);
  });

  piezas.botonBorrarCompletadas.addEventListener('click', pedirBorradoDeCompletadas);

  // Si la pestaña estuvo abierta durante el cambio de día, al volver se recalcula "vencida".
  documento.addEventListener('visibilitychange', redibujar);

  redibujar();
}
