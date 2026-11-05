// Servidor estático de desarrollo: sirve los archivos del proyecto sin dependencias.
// Los módulos ES no cargan desde file://, por eso la app se abre por HTTP.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
const puerto = Number(process.env.PORT) || 8080;

const tiposDeContenido = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function rutaDelArchivo(url) {
  const { pathname } = new URL(url, 'http://localhost');
  const relativa = pathname === '/' ? 'index.html' : decodeURIComponent(pathname);
  const absoluta = normalize(join(raiz, relativa));
  const dentroDelProyecto = absoluta === raiz || absoluta.startsWith(raiz + sep);
  const esCodigoDeLaApp = /^(index\.html|styles\.css|src[\\/])/.test(absoluta.slice(raiz.length + 1));
  return dentroDelProyecto && esCodigoDeLaApp ? absoluta : null;
}

const servidor = createServer(async (peticion, respuesta) => {
  const ruta = rutaDelArchivo(peticion.url);
  if (!ruta) {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end('No encontrado');
    return;
  }
  try {
    const contenido = await readFile(ruta);
    const tipo = tiposDeContenido[extname(ruta)] ?? 'application/octet-stream';
    respuesta.writeHead(200, { 'Content-Type': tipo });
    respuesta.end(contenido);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    respuesta.end('No encontrado');
  }
});

servidor.listen(puerto, () => {
  console.log(`Mis tareas en http://localhost:${puerto}`);
});
