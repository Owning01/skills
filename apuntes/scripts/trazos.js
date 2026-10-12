/* trazos.js — trazos a mano en SVG, sin dependencias.
 *
 * Que resuelve: los apuntes bonitos no usan bordes CSS rectos, usan lineas
 * dibujadas: cajas con temblor, flechas que se doblan, subrayados que no
 * terminan en linea recta. Con `border: 2px dashed` eso no se puede lograr.
 *
 * Como funciona: PRNG con semilla (mulberry32). La MISMA semilla da SIEMPRE el
 * mismo dibujo, asi que el HTML es estable entre corridas y se puede cachear o
 * diffear. Sin semilla, el dibujo cambia en cada generacion.
 *
 * Uso como modulo:
 *   const { caja, flecha, flechaCurva, circulo, chispa } = require('./trazos.js');
 *   caja({ x: 0, y: 0, w: 300, h: 120, semilla: 'recuadro-1' })
 *
 * Uso desde la CLI (volca SVG al stdout):
 *   node trazos.js '{"forma":"caja","w":300,"h":120,"semilla":"a"}'
 *
 * Todos devuelven markup SVG con `currentColor`, para que hereden el color del
 * texto y no haya que pasarle el color.
 */

'use strict';

/* ---------------------------------------------------------------- aleatorio */

/** Convierte cualquier cosa a una semilla entera estable. */
function hash(s) {
  const t = String(s);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: PRNG chico y rapido, suficiente para temblor. */
function prng(semilla) {
  let a = hash(semilla == null ? 'trazos' : semilla);
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Temblor centrado en 0, +-1. */
const j = (r, amp) => (r() * 2 - 1) * amp;

/* ------------------------------------------------------------------ basicos */

/**
 * Une puntos en un path, doblando cada segmento con un control point.
 * `curva` = 0 deja polyline, 1 deja una curva suave, 0.35 es el tope util.
 */
function unir(pts, r, curva = 0.35, amp = 1.2) {
  if (pts.length < 2) return '';
  let d = `M${f(pts[0][0] + j(r, amp))} ${f(pts[0][1] + j(r, amp))}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    // el control point se corre hacia el normal del segmento: eso produce el arqueo
    const nx = -(b[1] - a[1]);
    const ny = b[0] - a[0];
    const len = Math.hypot(nx, ny) || 1;
    const k = j(r, amp) * curva;
    d += `Q${f(mx + (nx / len) * k)} ${f(my + (ny / len) * k)} ` +
         `${f(b[0] + j(r, amp))} ${f(b[1] + j(r, amp))}`;
  }
  return d;
}

const f = (n) => Math.round(n * 100) / 100;

/** Reparte `n` puntos a lo largo de un segmento, con paso `paso`. */
function reparto(x1, y1, x2, y2, paso) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(2, Math.round(d / paso) + 1);
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return out;
}

/** Envuelve paths en <path>, duplicando el trazo para el efecto bocetillado. */
function svg(d, op) {
  if (!d) return '';
  const o = op || {};
  const w = o.grosor == null ? 2 : o.grosor;
  const extra = [
    'fill="none"',
    'stroke="currentColor"',
    `stroke-width="${w}"`,
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
  ];
  if (o.opacidad != null) extra.push(`opacity="${o.opacidad}"`);
  const classes = ['t-trazo', o.clase].filter(Boolean).join(' ');
  return `<path class="${classes}" d="${d}" ${extra.join(' ')}/>`;
}

/* ------------------------------------------------------------------ formas */

/** Caja de temblor. Devuelve una o dos pasadas (mas o menos segun `doble`). */
function caja({ x = 0, y = 0, w = 200, h = 80, semilla, curva = 0.35, amp = 1.6, doble = false } = {}) {
  const r = prng(semilla);
  const pts = [
    [x, y], [x + w, y], [x + w, y + h], [x, y + h],
  ];
  // el ultimo punto cierra contra el primero
  const camino = pts.concat([pts[0]]).map((p) => [p[0], p[1]]);
  let d = unir(camino, r, curva, amp);
  if (doble) d += ' ' + unir(camino, prng(semilla + '|2'), curva * 0.6, amp * 0.8);
  return svg(d, { grosor: 2 });
}

/** Circulo irregular. Sirve para numeros, sellos y "burbujas". */
function circulo({ cx = 50, cy = 50, r = 30, semilla, doble = false } = {}) {
  const rr = prng(semilla);
  const n = 10;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rad = r + j(rr, r * 0.05);
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  pts.push(pts[0]);
  let d = unir(pts, rr, 0.8, 0);
  if (doble) d += ' ' + unir(pts, prng(semilla + '|2'), 0.8, 0);
  return svg(d, { grosor: 2 });
}

/** Flecha recta con cabeza de dos trazos. */
function flecha({ x1 = 0, y1 = 40, x2 = 120, y2 = 40, semilla, cabeza = 10 } = {}) {
  const r = prng(semilla);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const abrir = 0.42;
  const p1 = [x2 - Math.cos(ang - abrir) * cabeza, y2 - Math.sin(ang - abrir) * cabeza];
  const p2 = [x2 - Math.cos(ang + abrir) * cabeza, y2 - Math.sin(ang + abrir) * cabeza];
  let d = unir(reparto(x1, y1, x2, y2, 18), r, 0.3, 1.2);
  d += ' ' + unir([p1, [x2, y2], p2], r, 0.3, 0.8);
  return svg(d, { grosor: 2 });
}

/**
 * Flecha curva. Es LA flecha de los apuntes: une dos cajas por encima o por
 * debajo, nunca en linea recta.
 */
function flechaCurva({ x1 = 0, y1 = 40, x2 = 200, y2 = 40, alto = 40, semilla, cabeza = 10, lado = 'arriba' } = {}) {
  const r = prng(semilla);
  const signo = lado === 'abajo' ? 1 : -1;
  const mx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + signo * alto;
  const puntos = [];
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // cuadratica de bezier, muestreada
    const u = 1 - t;
    puntos.push([
      u * u * x1 + 2 * u * t * mx + t * t * x2,
      u * u * y1 + 2 * u * t * cy + t * t * y2,
    ]);
  }
  let d = unir(puntos, r, 0.15, 1);
  const fin = puntos[puntos.length - 1];
  const pen = puntos[puntos.length - 2];
  const ang = Math.atan2(fin[1] - pen[1], fin[0] - pen[0]);
  const abrir = 0.45;
  const p1 = [fin[0] - Math.cos(ang - abrir) * cabeza, fin[1] - Math.sin(ang - abrir) * cabeza];
  const p2 = [fin[0] - Math.cos(ang + abrir) * cabeza, fin[1] - Math.sin(ang + abrir) * cabeza];
  d += ' ' + unir([p1, fin, p2], r, 0.3, 0.8);
  return svg(d, { grosor: 2 });
}

/** Subrayado en zigzag, como el marcador sobre una palabra. */
function subrayado({ x1 = 0, y = 30, x2 = 160, semilla, pasos = 9, alto = 4 } = {}) {
  const r = prng(semilla);
  const pts = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    pts.push([x1 + (x2 - x1) * t, y + (i % 2 ? -alto : alto) * 0.5 + j(r, 1)]);
  }
  return svg(unir(pts, r, 0.2, 1), { grosor: 3, clase: 't-subrayado-trazos' });
}

/** Tachado. */
function tachado({ x1 = 0, y = 20, x2 = 120, semilla } = {}) {
  return svg(unir(reparto(x1, y, x2, y - 3, 22), prng(semilla), 0.3, 1.2), { grosor: 2 });
}

/** Trazo grueso de marcador (el swipe del titulo). `ang` en grados. */
function marcador({ w = 200, h = 46, ang = -1.6, semilla, opacidad = 0.55 } = {}) {
  const r = prng(semilla);
  const y = h / 2;
  // una gruesa banda con extremos irregulares, girada unos grados
  const arriba = [];
  const abajo = [];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    arriba.push([t * w, j(r, h * 0.09)]);
    abajo.push([t * w, h + j(r, h * 0.09)]);
  }
  const rad = (ang * Math.PI) / 180;
  const px = (p) => [p[0] * Math.cos(rad) - p[1] * Math.sin(rad), p[0] * Math.sin(rad) + p[1] * Math.cos(rad)];
  let d = unir(arriba.map(px), r, 0.5, 0.6);
  d += ' ' + unir(abajo.reverse().map(px), r, 0.5, 0.6);
  d += ' Z';
  return `<path class="t-marcador-trazo" d="${d}" fill="currentColor" opacity="${opacidad}"/>`;
}

/* --------------------------------------------------------------- decorados */

/** Chispa de 4 puntas: la estrella chiquita de los titulos. */
function chispa({ cx = 20, cy = 20, r = 12, semilla } = {}) {
  const rr = prng(semilla);
  const p = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.32;
    p.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  p.push(p[0]);
  return svg(unir(p, rr, 0.9, 0), { grosor: 1.8 });
}

/** Estrella de 5 puntas, contorno. */
function estrella({ cx = 20, cy = 20, r = 16, semilla } = {}) {
  const rr = prng(semilla);
  const p = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    p.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return svg(unir(p, rr, 0.3, 0.5), { grosor: 2 });
}

function corazon({ cx = 20, cy = 20, s = 16, semilla } = {}) {
  const rr = prng(semilla);
  const d =
    `M${cx} ${cy + s * 0.75}` +
    `C${cx - s * 1.25} ${cy - s * 0.1} ${cx - s * 0.55} ${cy - s * 1.15} ${cx} ${cy - s * 0.35}` +
    `C${cx + s * 0.55} ${cy - s * 1.15} ${cx + s * 1.25} ${cy - s * 0.1} ${cx} ${cy + s * 0.75} Z`;
  return svg(d, { grosor: 2 });
}

/** Rayo / chispazo para marcar algo importante. */
function rayo({ x = 20, y = 4, w = 14, h = 32, semilla } = {}) {
  const rr = prng(semilla);
  const p = [
    [x + w * 0.55, y], [x, y + h * 0.42], [x + w * 0.42, y + h * 0.42],
    [x + w * 0.2, y + h], [x + w, y + h * 0.5], [x + w * 0.55, y + h * 0.5],
  ];
  return svg(unir(p.concat([p[0]]), rr, 0.15, 0.7), { grosor: 2 });
}

/** Marca de tilde / check. */
function tilde({ x = 0, y = 10, s = 14, semilla } = {}) {
  const r = prng(semilla);
  return svg(unir([[x, y], [x + s * 0.4, y + s * 0.42], [x + s, y - s * 0.4]], r, 0.5, 0.6), { grosor: 2.4 });
}

/** Globe de dialogo. */
function globo({ x = 0, y = 0, w = 120, h = 56, semilla, cola = 12 } = {}) {
  const r = prng(semilla);
  const pts = [
    [x, y + 8], [x, y + h - 8], [x + 8, y + h], [x + w - 8, y + h],
    [x + w, y + h - 8], [x + w, y + 8], [x + w - 8, y], [x + 8, y],
  ];
  let d = unir(pts.concat([[x, y + 8]]), r, 0.5, 1);
  const colaPts = [[x + 18, y + h], [x + 14, y + h + cola], [x + 30, y + h]];
  d += ' ' + unir(colaPts, r, 0.4, 0.6);
  return svg(d, { grosor: 2 });
}

/** Subrayado doble, paraDefinitiones. */
function dobleLinea({ x1 = 0, y = 20, x2 = 140, semilla, sep = 4 } = {}) {
  return (
    subrayado({ x1, y, x2, semilla, pasos: 7 }) +
    subrayado({ x1, y: y + sep, x2, semilla: semilla + '|b', pasos: 7 })
  );
}

/** Onda simple: sirve de separador de seccion. */
function onda({ x1 = 0, y = 12, x2 = 160, semilla, ciclos = 3 } = {}) {
  const r = prng(semilla);
  const p = [];
  const n = ciclos * 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    p.push([x1 + (x2 - x1) * t, y + Math.sin(t * Math.PI * 2 * ciclos) * 3 + j(r, 0.6)]);
  }
  return svg(unir(p, r, 0.1, 0.5), { grosor: 1.6 });
}

/** Recuadro con esquinas redondeadas a pulso, para cajas de contenido. */
function cajaRedondeada({ x = 0, y = 0, w = 200, h = 80, r = 12, semilla } = {}) {
  const rr = prng(semilla);
  const p = [];
  const esquina = (cx, cy, a0, a1) => {
    for (let i = 0; i <= 4; i++) {
      const a = a0 + ((a1 - a0) * i) / 4;
      p.push([cx + Math.cos(a) * (r + j(rr, 0.8)), cy + Math.sin(a) * (r + j(rr, 0.8))]);
    }
  };
  esquina(x + w - r, y + r, -Math.PI / 2, 0);
  esquina(x + w - r, y + h - r, 0, Math.PI / 2);
  esquina(x + r, y + h - r, Math.PI / 2, Math.PI);
  esquina(x + r, y + r, Math.PI, Math.PI * 1.5);
  return svg(unir(p.concat([p[0]]), rr, 0.4, 0.8), { grosor: 2 });
}

/* ------------------------------------------------------------------ indice */

const FORMAS = {
  caja, circulo, flecha, flechaCurva, subrayado, tachado, marcador,
  chispa, estrella, corazon, rayo, tilde, globo, dobleLinea, onda, cajaRedondeada,
};

/**
 * CLI: volca una forma como <svg> listo para pegar.
 *   node trazos.js '{"forma":"flechaCurva","x1":0,"y1":0,"x2":200,"y2":60,"alto":40}'
 *   node trazos.js '{"forma":"lista":["caja","circulo"],"ancho":300,"alto":120}'
 */
function desdeCli(argv) {
  const entrada = argv.join(' ').trim() || '{}';
  let spec;
  try {
    spec = JSON.parse(entrada);
  } catch (e) {
    console.error('JSON invalido: ' + e.message);
    process.exitCode = 2;
    return;
  }
  const ancho = spec.ancho || spec.w || 320;
  const alto = spec.alto || spec.h || 120;
  const pad = spec.pad == null ? 8 : spec.pad;
  const nombres = spec.forma === 'lista' ? spec.lista || [] : [spec.forma];
  const svg = nombres
    .map((n, i) => {
      const fn = FORMAS[n];
      if (!fn) return `<!-- forma desconocida: ${n} -->`;
      return fn(Object.assign({}, spec, { semilla: (spec.semilla || 't') + '#' + i }));
    })
    .join('');
  console.log(
    `<svg class="t-svg" viewBox="0 0 ${f(ancho)} ${f(alto)}" width="${f(ancho)}" height="${f(alto)}" ` +
      `xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">` +
      `<g transform="translate(${pad} ${pad})">${svg}</g></svg>`
  );
}

module.exports = Object.assign({ prng, hash, unir, f }, FORMAS);

if (require.main === module) desdeCli(process.argv.slice(2));