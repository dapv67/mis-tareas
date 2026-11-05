// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { iniciarApp } from '../../src/interfaz.js';
import {
  montarPagina,
  botonPorTexto,
  elementos,
  crearTareaDesdeFormulario,
  enviarFormulario,
  pulsar,
  rellenarFormulario,
  tareasVisibles,
  titulosVisibles,
} from '../helpers/montarApp.js';
import { crearAlmacenMemoria } from '../helpers/almacenMemoria.js';

// Monta la página y arranca la app con piezas controladas: un almacenamiento en memoria,
// un reloj fijo que avanza un segundo cada vez que se consulta (para que cada tarea tenga
// su propio momento de creación) y ids previsibles. Cada llamada empieza con ids desde 1,
// así que al "reabrir" la app con el mismo almacén se pasa un nuevoId propio.
function arrancar(opciones = {}) {
  const documento = montarPagina();
  let segundos = 0;
  let contadorId = 0;
  iniciarApp({
    documento,
    almacen: crearAlmacenMemoria(),
    confirmar: () => true,
    ahora: () => new Date(2026, 10, 5, 12, 0, segundos++),
    nuevoId: () => `id-${++contadorId}`,
    ...opciones,
  });
  return documento;
}

describe('Historia 1: crear tareas y verlas en la lista', () => {
  it('con la lista vacía invita a crear la primera tarea', () => {
    const documento = arrancar();
    const { mensajeVacio, lista } = elementos(documento);
    expect(mensajeVacio.hidden).toBe(false);
    expect(mensajeVacio.textContent).toBe('No tienes tareas. Escribe la primera arriba.');
    expect(lista.querySelectorAll('li')).toHaveLength(0);
  });

  it('crea una tarea con título, prioridad alta y fecha, y la muestra en la lista', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Comprar pan', prioridad: 'alta', fechaLimite: '2026-11-06' });

    const tareas = tareasVisibles(documento);
    expect(tareas).toHaveLength(1);
    expect(tareas[0].titulo).toBe('Comprar pan');
    expect(tareas[0].prioridad).toBe('Alta');
    expect(tareas[0].fecha).toBe('6 nov 2026');
    expect(tareas[0].completada).toBe(false);
    expect(elementos(documento).mensajeVacio.hidden).toBe(true);
  });

  it('sin tocar la prioridad ni la fecha, la tarea queda con prioridad Media y sin fecha', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Leer' });

    const [tarea] = tareasVisibles(documento);
    expect(tarea.prioridad).toBe('Media');
    expect(tarea.fecha).toBeNull();
  });

  it('rechaza un título vacío: no crea nada y avisa junto al campo con el foco en él', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: '' });

    const { titulo, errorTitulo } = elementos(documento);
    expect(tareasVisibles(documento)).toHaveLength(0);
    expect(errorTitulo.hidden).toBe(false);
    expect(errorTitulo.textContent).toBe('El título es obligatorio.');
    expect(titulo.getAttribute('aria-describedby')).toBe('error-titulo');
    expect(titulo.getAttribute('aria-invalid')).toBe('true');
    expect(documento.activeElement).toBe(titulo);
  });

  it('trata un título con solo espacios como vacío', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: '     ' });

    expect(tareasVisibles(documento)).toHaveLength(0);
    expect(elementos(documento).errorTitulo.textContent).toBe('El título es obligatorio.');
  });

  it('tras crear una tarea, vacía el formulario, vuelve a Media y devuelve el foco al título', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Comprar pan', prioridad: 'alta', fechaLimite: '2026-11-06' });

    const { titulo, fecha, prioridades, errorTitulo } = elementos(documento);
    expect(titulo.value).toBe('');
    expect(fecha.value).toBe('');
    expect(prioridades.find((r) => r.checked).value).toBe('media');
    expect(errorTitulo.hidden).toBe(true);
    expect(titulo.hasAttribute('aria-invalid')).toBe(false);
    expect(documento.activeElement).toBe(titulo);
  });

  it('muestra completo un título de 200 caracteres', () => {
    const documento = arrancar();
    const largo = 'a'.repeat(200);
    crearTareaDesdeFormulario(documento, { titulo: largo });

    expect(tareasVisibles(documento)[0].titulo).toBe(largo);
  });

  it('el campo título no deja escribir más de 200 caracteres y, si llega uno más largo, no se crea', () => {
    const documento = arrancar();
    const { titulo, errorTitulo } = elementos(documento);
    expect(titulo.getAttribute('maxlength')).toBe('200');

    // jsdom no recorta los valores asignados por código, así que se simula el envío.
    crearTareaDesdeFormulario(documento, { titulo: 'a'.repeat(201) });
    expect(tareasVisibles(documento)).toHaveLength(0);
    expect(errorTitulo.hidden).toBe(false);
    expect(errorTitulo.textContent).toBe('El título no puede superar los 200 caracteres.');
  });

  it('muestra un título con HTML como texto, sin interpretarlo', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: '<b>hola</b>' });

    const [tarea] = tareasVisibles(documento);
    expect(tarea.titulo).toBe('<b>hola</b>');
    expect(tarea.elemento.querySelector('b')).toBeNull();
  });

  it('ordena la lista: la fecha más cercana primero y las tareas sin fecha al final', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Sin fecha' });
    crearTareaDesdeFormulario(documento, { titulo: 'Lejana', fechaLimite: '2026-12-01' });
    crearTareaDesdeFormulario(documento, { titulo: 'Cercana', fechaLimite: '2026-11-06' });

    expect(titulosVisibles(documento)).toEqual(['Cercana', 'Lejana', 'Sin fecha']);
  });

  it('a igual fecha, pone primero la prioridad más alta', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Baja', prioridad: 'baja', fechaLimite: '2026-11-06' });
    crearTareaDesdeFormulario(documento, { titulo: 'Alta', prioridad: 'alta', fechaLimite: '2026-11-06' });

    expect(titulosVisibles(documento)).toEqual(['Alta', 'Baja']);
  });
});

describe('Historia 2: conservar las tareas al cerrar el navegador', () => {
  const CLAVE = 'mis-tareas';
  const AVISO_NO_SE_GUARDA = 'Tus tareas no se guardarán al cerrar el navegador.';
  const AVISO_NO_SE_RECUPERA = 'No se pudieron recuperar tus tareas guardadas.';

  it('las tareas siguen ahí, con sus datos, al volver a abrir la app', () => {
    const almacen = crearAlmacenMemoria();
    const primera = arrancar({ almacen });
    crearTareaDesdeFormulario(primera, { titulo: 'Comprar pan', prioridad: 'alta', fechaLimite: '2026-11-06' });
    crearTareaDesdeFormulario(primera, { titulo: 'Leer' });

    const segunda = arrancar({ almacen, nuevoId: () => 'id-nuevo' });
    const resumen = tareasVisibles(segunda).map((t) => [t.titulo, t.prioridad, t.fecha, t.completada]);
    expect(resumen).toEqual([
      ['Comprar pan', 'Alta', '6 nov 2026', false],
      ['Leer', 'Media', null, false],
    ]);
    expect(elementos(segunda).mensajeVacio.hidden).toBe(true);
  });

  it('guarda el documento completo tras cada cambio, sin pulsar nada más', () => {
    const almacen = crearAlmacenMemoria();
    const documento = arrancar({ almacen });
    crearTareaDesdeFormulario(documento, { titulo: 'Comprar pan', prioridad: 'alta', fechaLimite: '2026-11-06' });

    const guardado = JSON.parse(almacen.leerDirecto(CLAVE));
    expect(guardado.version).toBe(1);
    expect(guardado.tareas).toHaveLength(1);
    expect(guardado.tareas[0]).toMatchObject({
      id: 'id-1',
      titulo: 'Comprar pan',
      fechaLimite: '2026-11-06',
      prioridad: 'alta',
      completada: false,
    });
  });

  it('un título rechazado no se guarda', () => {
    const almacen = crearAlmacenMemoria();
    const documento = arrancar({ almacen });
    crearTareaDesdeFormulario(documento, { titulo: '' });

    expect(almacen.leerDirecto(CLAVE)).toBeNull();
  });

  it('no muestra ningún aviso cuando todo funciona', () => {
    const documento = arrancar();
    expect(elementos(documento).avisos.textContent).toBe('');
  });

  it('con el almacenamiento sin escritura, funciona y avisa de que no se guardará', () => {
    const documento = arrancar({ almacen: crearAlmacenMemoria({ falloAlEscribir: true }) });
    expect(elementos(documento).avisos.textContent).toBe(AVISO_NO_SE_GUARDA);

    crearTareaDesdeFormulario(documento, { titulo: 'Comprar pan' });
    expect(titulosVisibles(documento)).toEqual(['Comprar pan']);
  });

  it('con el almacenamiento sin lectura, arranca vacía, funciona y avisa', () => {
    const documento = arrancar({ almacen: crearAlmacenMemoria({ falloAlLeer: true }) });
    expect(elementos(documento).avisos.textContent).toBe(AVISO_NO_SE_GUARDA);
    expect(tareasVisibles(documento)).toHaveLength(0);

    crearTareaDesdeFormulario(documento, { titulo: 'Comprar pan' });
    expect(titulosVisibles(documento)).toEqual(['Comprar pan']);
  });

  it('con los datos guardados dañados, arranca vacía y avisa, sin borrar lo guardado hasta el primer cambio', () => {
    const almacen = crearAlmacenMemoria({ datos: { [CLAVE]: 'basura' } });
    const documento = arrancar({ almacen });

    expect(tareasVisibles(documento)).toHaveLength(0);
    expect(elementos(documento).avisos.textContent).toBe(AVISO_NO_SE_RECUPERA);
    expect(almacen.leerDirecto(CLAVE)).toBe('basura');

    crearTareaDesdeFormulario(documento, { titulo: 'Comprar pan' });
    expect(JSON.parse(almacen.leerDirecto(CLAVE)).tareas).toHaveLength(1);
  });

  it('si una escritura falla durante el uso, la tarea sigue en pantalla y se avisa', () => {
    const almacen = crearAlmacenMemoria();
    const documento = arrancar({ almacen });
    expect(elementos(documento).avisos.textContent).toBe('');

    almacen.falloAlEscribir = true;
    crearTareaDesdeFormulario(documento, { titulo: 'Comprar pan' });

    expect(titulosVisibles(documento)).toEqual(['Comprar pan']);
    expect(elementos(documento).avisos.textContent).toBe(AVISO_NO_SE_GUARDA);
  });
});

describe('Historia 3: marcar tareas como completadas', () => {
  function crearDosTareas(documento) {
    crearTareaDesdeFormulario(documento, { titulo: 'Primera', fechaLimite: '2026-11-06' });
    crearTareaDesdeFormulario(documento, { titulo: 'Segunda', fechaLimite: '2026-12-01' });
  }

  it('cada tarea tiene una casilla con el nombre accesible "Completar «título»"', () => {
    const documento = arrancar();
    crearDosTareas(documento);
    expect(tareasVisibles(documento).map((t) => t.etiquetaCasilla)).toEqual(['Completar «Primera»', 'Completar «Segunda»']);
  });

  it('al marcar una tarea se ve completada y pasa al final, debajo de las pendientes', () => {
    const documento = arrancar();
    crearDosTareas(documento);

    pulsar(tareasVisibles(documento)[0].casilla);

    const tareas = tareasVisibles(documento);
    expect(tareas.map((t) => t.titulo)).toEqual(['Segunda', 'Primera']);
    expect(tareas[1].completada).toBe(true);
    expect(tareas[1].elemento.classList.contains('completada')).toBe(true);
    expect(tareas[0].completada).toBe(false);
    expect(tareas[0].elemento.classList.contains('completada')).toBe(false);
  });

  it('al desmarcarla vuelve a pendiente y recupera su posición entre las pendientes', () => {
    const documento = arrancar();
    crearDosTareas(documento);
    pulsar(tareasVisibles(documento)[0].casilla);

    pulsar(tareasVisibles(documento)[1].casilla);

    const tareas = tareasVisibles(documento);
    expect(tareas.map((t) => t.titulo)).toEqual(['Primera', 'Segunda']);
    expect(tareas.every((t) => !t.completada)).toBe(true);
    expect(tareas[0].elemento.classList.contains('completada')).toBe(false);
  });

  it('el cambio se conserva al volver a abrir la app', () => {
    const almacen = crearAlmacenMemoria();
    const primera = arrancar({ almacen });
    crearDosTareas(primera);
    pulsar(tareasVisibles(primera)[0].casilla);

    const segunda = arrancar({ almacen });
    expect(tareasVisibles(segunda).map((t) => [t.titulo, t.completada])).toEqual([
      ['Segunda', false],
      ['Primera', true],
    ]);
  });

  it('completar una tarea la guarda en el momento', () => {
    const almacen = crearAlmacenMemoria();
    const documento = arrancar({ almacen });
    crearDosTareas(documento);
    pulsar(tareasVisibles(documento)[0].casilla);

    const guardadas = JSON.parse(almacen.leerDirecto('mis-tareas')).tareas;
    expect(guardadas.find((t) => t.titulo === 'Primera').completada).toBe(true);
    expect(guardadas.find((t) => t.titulo === 'Segunda').completada).toBe(false);
  });
});

describe('Historia 4: resaltar las tareas vencidas', () => {
  // "Hoy" es el 5 de noviembre de 2026 salvo que la prueba cambie el reloj.
  function arrancarConReloj() {
    const reloj = { ahora: new Date(2026, 10, 5, 12, 0) };
    const documento = arrancar({ ahora: () => reloj.ahora });
    return { documento, reloj };
  }

  function crearAyerHoyManana(documento) {
    crearTareaDesdeFormulario(documento, { titulo: 'Mañana', fechaLimite: '2026-11-06' });
    crearTareaDesdeFormulario(documento, { titulo: 'Hoy', fechaLimite: '2026-11-05' });
    crearTareaDesdeFormulario(documento, { titulo: 'Ayer', fechaLimite: '2026-11-04' });
  }

  it('solo la tarea con fecha de ayer aparece como vencida, y va la primera', () => {
    const { documento } = arrancarConReloj();
    crearAyerHoyManana(documento);

    expect(tareasVisibles(documento).map((t) => [t.titulo, t.vencida])).toEqual([
      ['Ayer', true],
      ['Hoy', false],
      ['Mañana', false],
    ]);
  });

  it('la marca de vencida lleva el texto "Vencida", no solo color', () => {
    const { documento } = arrancarConReloj();
    crearAyerHoyManana(documento);

    const [ayer, hoy] = tareasVisibles(documento);
    expect(ayer.etiquetaVencida).toBe('Vencida');
    expect(ayer.elemento.classList.contains('vencida')).toBe(true);
    expect(hoy.etiquetaVencida).toBeNull();
    expect(hoy.elemento.classList.contains('vencida')).toBe(false);
  });

  it('una tarea creada directamente con fecha pasada aparece como vencida', () => {
    const { documento } = arrancarConReloj();
    crearTareaDesdeFormulario(documento, { titulo: 'Antigua', fechaLimite: '2000-01-01' });

    expect(tareasVisibles(documento)[0].vencida).toBe(true);
  });

  it('una tarea sin fecha nunca aparece como vencida', () => {
    const { documento } = arrancarConReloj();
    crearTareaDesdeFormulario(documento, { titulo: 'Sin fecha' });

    expect(tareasVisibles(documento)[0].vencida).toBe(false);
  });

  it('al completar una tarea vencida deja de mostrarse como vencida', () => {
    const { documento } = arrancarConReloj();
    crearTareaDesdeFormulario(documento, { titulo: 'Ayer', fechaLimite: '2026-11-04' });

    pulsar(tareasVisibles(documento)[0].casilla);

    const [tarea] = tareasVisibles(documento);
    expect(tarea.completada).toBe(true);
    expect(tarea.vencida).toBe(false);
  });

  it('al desmarcar una tarea con fecha pasada vuelve a mostrarse como vencida', () => {
    const { documento } = arrancarConReloj();
    crearTareaDesdeFormulario(documento, { titulo: 'Ayer', fechaLimite: '2026-11-04' });
    pulsar(tareasVisibles(documento)[0].casilla);

    pulsar(tareasVisibles(documento)[0].casilla);

    expect(tareasVisibles(documento)[0].vencida).toBe(true);
  });

  it('si cambia el día con la app abierta, al volver a la pestaña se recalcula', () => {
    const { documento, reloj } = arrancarConReloj();
    crearTareaDesdeFormulario(documento, { titulo: 'Hoy', fechaLimite: '2026-11-05' });
    expect(tareasVisibles(documento)[0].vencida).toBe(false);

    reloj.ahora = new Date(2026, 10, 6, 9, 0);
    documento.dispatchEvent(new Event('visibilitychange'));

    expect(tareasVisibles(documento)[0].vencida).toBe(true);
  });

  it('al abrir la app otro día, las tareas que vencieron aparecen como vencidas', () => {
    const almacen = crearAlmacenMemoria();
    const reloj = { ahora: new Date(2026, 10, 5, 12, 0) };
    const primera = arrancar({ almacen, ahora: () => reloj.ahora });
    crearTareaDesdeFormulario(primera, { titulo: 'Hoy', fechaLimite: '2026-11-05' });

    reloj.ahora = new Date(2026, 10, 6, 8, 0);
    const segunda = arrancar({ almacen, ahora: () => reloj.ahora });

    expect(tareasVisibles(segunda)[0].vencida).toBe(true);
  });
});

describe('Historia 5: borrar tareas', () => {
  // Una función de confirmación falsa que recuerda los mensajes y responde lo que se le indique.
  function confirmacion(respuesta) {
    const mensajes = [];
    return {
      mensajes,
      confirmar: (mensaje) => {
        mensajes.push(mensaje);
        return respuesta;
      },
    };
  }

  function crearTres(documento) {
    crearTareaDesdeFormulario(documento, { titulo: 'Primera', fechaLimite: '2026-11-06' });
    crearTareaDesdeFormulario(documento, { titulo: 'Segunda', fechaLimite: '2026-11-07' });
    crearTareaDesdeFormulario(documento, { titulo: 'Tercera', fechaLimite: '2026-11-08' });
  }

  const botonCompletadas = (documento) => botonPorTexto(documento, 'Borrar completadas');

  it('cada tarea tiene un botón "Borrar «título»"', () => {
    const documento = arrancar();
    crearTres(documento);
    expect(tareasVisibles(documento).map((t) => t.botonBorrar?.getAttribute('aria-label'))).toEqual([
      'Borrar «Primera»',
      'Borrar «Segunda»',
      'Borrar «Tercera»',
    ]);
  });

  it('pide confirmación con el título y, si se acepta, la tarea desaparece', () => {
    const { mensajes, confirmar } = confirmacion(true);
    const documento = arrancar({ confirmar });
    crearTres(documento);

    pulsar(tareasVisibles(documento)[1].botonBorrar);

    expect(mensajes).toEqual(['¿Borrar la tarea «Segunda»?']);
    expect(titulosVisibles(documento)).toEqual(['Primera', 'Tercera']);
  });

  it('si se cancela la confirmación, no cambia nada', () => {
    const almacen = crearAlmacenMemoria();
    const { mensajes, confirmar } = confirmacion(false);
    const documento = arrancar({ almacen, confirmar });
    crearTres(documento);
    const guardadoAntes = almacen.leerDirecto('mis-tareas');

    pulsar(tareasVisibles(documento)[1].botonBorrar);

    expect(mensajes).toHaveLength(1);
    expect(titulosVisibles(documento)).toEqual(['Primera', 'Segunda', 'Tercera']);
    expect(almacen.leerDirecto('mis-tareas')).toBe(guardadoAntes);
  });

  it('el borrado es permanente: no vuelve al abrir de nuevo la app', () => {
    const almacen = crearAlmacenMemoria();
    const primera = arrancar({ almacen });
    crearTres(primera);
    pulsar(tareasVisibles(primera)[0].botonBorrar);

    const segunda = arrancar({ almacen });
    expect(titulosVisibles(segunda)).toEqual(['Segunda', 'Tercera']);
  });

  it('al borrar la última tarea vuelve el mensaje de lista vacía', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Única' });

    pulsar(tareasVisibles(documento)[0].botonBorrar);

    expect(tareasVisibles(documento)).toHaveLength(0);
    expect(elementos(documento).mensajeVacio.hidden).toBe(false);
  });

  it('"Borrar completadas" solo está disponible si hay al menos una completada', () => {
    const documento = arrancar();
    expect(botonCompletadas(documento).hidden).toBe(true);

    crearTres(documento);
    expect(botonCompletadas(documento).hidden).toBe(true);

    pulsar(tareasVisibles(documento)[0].casilla);
    expect(botonCompletadas(documento).hidden).toBe(false);

    pulsar(tareasVisibles(documento).find((t) => t.completada).casilla);
    expect(botonCompletadas(documento).hidden).toBe(true);
  });

  it('"Borrar completadas" confirma con el número y borra solo las completadas', () => {
    const { mensajes, confirmar } = confirmacion(true);
    const documento = arrancar({ confirmar });
    crearTres(documento);
    // Al completar "Primera" baja al final; el segundo toque completa entonces "Tercera".
    pulsar(tareasVisibles(documento)[0].casilla);
    pulsar(tareasVisibles(documento)[1].casilla);
    expect(tareasVisibles(documento).filter((t) => t.completada).map((t) => t.titulo).sort()).toEqual(['Primera', 'Tercera']);

    pulsar(botonCompletadas(documento));

    expect(mensajes).toEqual(['¿Borrar 2 tareas completadas?']);
    expect(titulosVisibles(documento)).toEqual(['Segunda']);
    expect(tareasVisibles(documento)[0].completada).toBe(false);
    expect(botonCompletadas(documento).hidden).toBe(true);
  });

  it('con una sola completada, la confirmación va en singular', () => {
    const { mensajes, confirmar } = confirmacion(true);
    const documento = arrancar({ confirmar });
    crearTres(documento);
    pulsar(tareasVisibles(documento)[0].casilla);

    pulsar(botonCompletadas(documento));

    expect(mensajes).toEqual(['¿Borrar 1 tarea completada?']);
  });

  it('si se cancela "Borrar completadas", no se borra ninguna tarea', () => {
    const { confirmar } = confirmacion(false);
    const documento = arrancar({ confirmar });
    crearTres(documento);
    pulsar(tareasVisibles(documento)[0].casilla);

    pulsar(botonCompletadas(documento));

    expect(titulosVisibles(documento)).toHaveLength(3);
    expect(botonCompletadas(documento).hidden).toBe(false);
  });

  it('"Borrar completadas" se conserva al volver a abrir la app', () => {
    const almacen = crearAlmacenMemoria();
    const primera = arrancar({ almacen });
    crearTres(primera);
    pulsar(tareasVisibles(primera)[0].casilla);
    pulsar(botonCompletadas(primera));

    const segunda = arrancar({ almacen });
    expect(titulosVisibles(segunda)).toEqual(['Segunda', 'Tercera']);
  });
});

describe('Historia 6: editar tareas', () => {
  const botonCompletadas = (documento) => botonPorTexto(documento, 'Borrar completadas');

  function crearDos(documento) {
    crearTareaDesdeFormulario(documento, { titulo: 'Leer', prioridad: 'media', fechaLimite: '2026-11-10' });
    crearTareaDesdeFormulario(documento, { titulo: 'Comprar pan', prioridad: 'alta', fechaLimite: '2026-11-20' });
  }

  const tareaPorTitulo = (documento, titulo) => tareasVisibles(documento).find((t) => t.titulo === titulo);

  function editar(documento, titulo, datos) {
    pulsar(tareaPorTitulo(documento, titulo).botonEditar);
    rellenarFormulario(documento, datos);
    enviarFormulario(documento);
  }

  it('cada tarea tiene un botón "Editar «título»"', () => {
    const documento = arrancar();
    crearDos(documento);
    expect(tareasVisibles(documento).map((t) => t.botonEditar?.getAttribute('aria-label'))).toEqual([
      'Editar «Leer»',
      'Editar «Comprar pan»',
    ]);
  });

  it('al pulsar Editar, el formulario se rellena y pasa a modo edición', () => {
    const documento = arrancar();
    crearDos(documento);

    pulsar(tareaPorTitulo(documento, 'Comprar pan').botonEditar);

    const { formulario, titulo, fecha, prioridades, botonGuardar, botonCancelar } = elementos(documento);
    expect(formulario.getAttribute('aria-label')).toBe('Editar tarea');
    expect(titulo.value).toBe('Comprar pan');
    expect(fecha.value).toBe('2026-11-20');
    expect(prioridades.find((r) => r.checked).value).toBe('alta');
    expect(botonGuardar.textContent).toBe('Guardar cambios');
    expect(botonCancelar.hidden).toBe(false);
    expect(documento.activeElement).toBe(titulo);
    expect(tareaPorTitulo(documento, 'Comprar pan').elemento.classList.contains('en-edicion')).toBe(true);
    expect(tareaPorTitulo(documento, 'Leer').elemento.classList.contains('en-edicion')).toBe(false);
  });

  it('en modo creación el formulario se llama "Nueva tarea" y no muestra Cancelar', () => {
    const documento = arrancar();
    const { formulario, botonGuardar, botonCancelar } = elementos(documento);
    expect(formulario.getAttribute('aria-label')).toBe('Nueva tarea');
    expect(botonGuardar.textContent).toBe('Añadir tarea');
    expect(botonCancelar.hidden).toBe(true);
  });

  it('guardar cambia el título, la fecha y la prioridad y vuelve al modo creación', () => {
    const documento = arrancar();
    crearDos(documento);

    editar(documento, 'Leer', { titulo: 'Leer el libro', fechaLimite: '2026-11-30', prioridad: 'baja' });

    const tarea = tareaPorTitulo(documento, 'Leer el libro');
    expect(tarea.prioridad).toBe('Baja');
    expect(tarea.fecha).toBe('30 nov 2026');
    expect(tareaPorTitulo(documento, 'Leer')).toBeUndefined();

    const { formulario, titulo, fecha, prioridades, botonGuardar, botonCancelar } = elementos(documento);
    expect(formulario.getAttribute('aria-label')).toBe('Nueva tarea');
    expect(botonGuardar.textContent).toBe('Añadir tarea');
    expect(botonCancelar.hidden).toBe(true);
    expect(titulo.value).toBe('');
    expect(fecha.value).toBe('');
    expect(prioridades.find((r) => r.checked).value).toBe('media');
  });

  it('la tarea editada se recoloca según el orden de la lista', () => {
    const documento = arrancar();
    crearDos(documento);
    expect(titulosVisibles(documento)).toEqual(['Leer', 'Comprar pan']);

    editar(documento, 'Comprar pan', { fechaLimite: '2026-11-06' });

    expect(titulosVisibles(documento)).toEqual(['Comprar pan', 'Leer']);
  });

  it('quitar la fecha deja la tarea sin fecha, al final de las pendientes y sin "Vencida"', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Con fecha pasada', fechaLimite: '2026-11-01' });
    crearTareaDesdeFormulario(documento, { titulo: 'Otra', fechaLimite: '2026-11-20' });
    expect(tareaPorTitulo(documento, 'Con fecha pasada').vencida).toBe(true);

    editar(documento, 'Con fecha pasada', { fechaLimite: '' });

    const tarea = tareaPorTitulo(documento, 'Con fecha pasada');
    expect(tarea.fecha).toBeNull();
    expect(tarea.vencida).toBe(false);
    expect(titulosVisibles(documento)).toEqual(['Otra', 'Con fecha pasada']);
  });

  it('cambiar a mañana la fecha de una tarea vencida le quita "Vencida"', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Ayer', fechaLimite: '2026-11-04' });
    expect(tareaPorTitulo(documento, 'Ayer').vencida).toBe(true);

    editar(documento, 'Ayer', { fechaLimite: '2026-11-06' });

    expect(tareaPorTitulo(documento, 'Ayer').vencida).toBe(false);
  });

  it('poner una fecha pasada a una tarea la marca como vencida', () => {
    const documento = arrancar();
    crearTareaDesdeFormulario(documento, { titulo: 'Sin fecha' });

    editar(documento, 'Sin fecha', { fechaLimite: '2026-11-04' });

    expect(tareaPorTitulo(documento, 'Sin fecha').vencida).toBe(true);
  });

  it('con el título vacío no se guarda: avisa, conserva los datos y sigue en modo edición', () => {
    const almacen = crearAlmacenMemoria();
    const documento = arrancar({ almacen });
    crearDos(documento);
    const guardadoAntes = almacen.leerDirecto('mis-tareas');

    editar(documento, 'Leer', { titulo: '   ' });

    const { formulario, errorTitulo, titulo, botonGuardar } = elementos(documento);
    expect(errorTitulo.hidden).toBe(false);
    expect(errorTitulo.textContent).toBe('El título es obligatorio.');
    expect(documento.activeElement).toBe(titulo);
    expect(formulario.getAttribute('aria-label')).toBe('Editar tarea');
    expect(botonGuardar.textContent).toBe('Guardar cambios');
    expect(tareaPorTitulo(documento, 'Leer')).toBeDefined();
    expect(almacen.leerDirecto('mis-tareas')).toBe(guardadoAntes);
  });

  it('con un título de más de 200 caracteres no se guarda y avisa', () => {
    const documento = arrancar();
    crearDos(documento);

    editar(documento, 'Leer', { titulo: 'a'.repeat(201) });

    expect(elementos(documento).errorTitulo.textContent).toBe('El título no puede superar los 200 caracteres.');
    expect(tareaPorTitulo(documento, 'Leer')).toBeDefined();
  });

  it('cancelar deja la tarea exactamente como estaba y vuelve al modo creación', () => {
    const almacen = crearAlmacenMemoria();
    const documento = arrancar({ almacen });
    crearDos(documento);
    const guardadoAntes = almacen.leerDirecto('mis-tareas');
    const antes = tareasVisibles(documento).map((t) => [t.titulo, t.prioridad, t.fecha, t.completada]);

    pulsar(tareaPorTitulo(documento, 'Leer').botonEditar);
    rellenarFormulario(documento, { titulo: 'Cambiado a medias', fechaLimite: '2026-12-31', prioridad: 'baja' });
    pulsar(elementos(documento).botonCancelar);

    expect(tareasVisibles(documento).map((t) => [t.titulo, t.prioridad, t.fecha, t.completada])).toEqual(antes);
    expect(almacen.leerDirecto('mis-tareas')).toBe(guardadoAntes);
    const { formulario, titulo, fecha, prioridades, botonCancelar } = elementos(documento);
    expect(formulario.getAttribute('aria-label')).toBe('Nueva tarea');
    expect(titulo.value).toBe('');
    expect(fecha.value).toBe('');
    expect(prioridades.find((r) => r.checked).value).toBe('media');
    expect(botonCancelar.hidden).toBe(true);
    expect(tareaPorTitulo(documento, 'Leer').elemento.classList.contains('en-edicion')).toBe(false);
  });

  it('editar una tarea completada la mantiene completada', () => {
    const documento = arrancar();
    crearDos(documento);
    pulsar(tareaPorTitulo(documento, 'Leer').casilla);

    editar(documento, 'Leer', { titulo: 'Leer otro libro', prioridad: 'alta' });

    const tarea = tareaPorTitulo(documento, 'Leer otro libro');
    expect(tarea.completada).toBe(true);
    expect(tarea.prioridad).toBe('Alta');
  });

  it('la edición se guarda en el momento, conserva id y momento de creación, y se mantiene al reabrir', () => {
    const almacen = crearAlmacenMemoria();
    const primera = arrancar({ almacen });
    crearDos(primera);
    const antes = JSON.parse(almacen.leerDirecto('mis-tareas')).tareas.find((t) => t.titulo === 'Leer');

    editar(primera, 'Leer', { titulo: 'Leer el libro', fechaLimite: '', prioridad: 'alta' });

    const despues = JSON.parse(almacen.leerDirecto('mis-tareas')).tareas.find((t) => t.titulo === 'Leer el libro');
    expect(despues).toEqual({ ...antes, titulo: 'Leer el libro', fechaLimite: null, prioridad: 'alta' });

    const segunda = arrancar({ almacen });
    expect(tareaPorTitulo(segunda, 'Leer el libro')).toMatchObject({ prioridad: 'Alta', fecha: null });
  });

  it('si se borra la tarea que se está editando, el formulario vuelve al modo creación', () => {
    const documento = arrancar();
    crearDos(documento);
    pulsar(tareaPorTitulo(documento, 'Leer').botonEditar);

    pulsar(tareaPorTitulo(documento, 'Leer').botonBorrar);

    expect(tareaPorTitulo(documento, 'Leer')).toBeUndefined();
    expect(elementos(documento).formulario.getAttribute('aria-label')).toBe('Nueva tarea');
    expect(elementos(documento).titulo.value).toBe('');
  });

  it('completar la tarea que se está editando no interrumpe la edición', () => {
    const documento = arrancar();
    crearDos(documento);
    pulsar(tareaPorTitulo(documento, 'Leer').botonEditar);

    pulsar(tareaPorTitulo(documento, 'Leer').casilla);

    expect(elementos(documento).formulario.getAttribute('aria-label')).toBe('Editar tarea');
    expect(tareaPorTitulo(documento, 'Leer').elemento.classList.contains('en-edicion')).toBe(true);
    expect(botonCompletadas(documento).hidden).toBe(false);
  });
});

describe('Volumen: 500 tareas guardadas', () => {
  // No se miden tiempos aquí (dependerían de la máquina): se comprueba que todo se dibuja y responde.
  // El límite de 1 segundo del criterio SC-005 se comprueba a mano (quickstart.md).
  function guardarQuinientas() {
    const tareas = Array.from({ length: 500 }, (_, i) => ({
      id: `id-${i}`,
      titulo: `Tarea ${i}`,
      fechaLimite: i % 2 === 0 ? `2026-12-${String((i % 28) + 1).padStart(2, '0')}` : null,
      prioridad: ['alta', 'media', 'baja'][i % 3],
      completada: i % 10 === 0,
      creadaEn: i,
    }));
    return crearAlmacenMemoria({ datos: { 'mis-tareas': JSON.stringify({ version: 1, tareas }) } });
  }

  it('dibuja las 500 tareas y sigue respondiendo a completar y borrar', () => {
    const documento = arrancar({ almacen: guardarQuinientas() });
    expect(tareasVisibles(documento)).toHaveLength(500);

    pulsar(tareasVisibles(documento).find((t) => !t.completada).casilla);
    expect(tareasVisibles(documento).filter((t) => t.completada)).toHaveLength(51);

    pulsar(tareasVisibles(documento)[0].botonBorrar);
    expect(tareasVisibles(documento)).toHaveLength(499);

    pulsar(botonPorTexto(documento, 'Borrar completadas'));
    expect(tareasVisibles(documento)).toHaveLength(448);
  });
});