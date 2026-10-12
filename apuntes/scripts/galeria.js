#!/usr/bin/env node
'use strict';
/*
 * galeria.js — genera una pagina con TODOS los componentes del catalogo.
 *
 * Para que es: el catalogo de apuntes.css son ~40 clases. Nadie recuerda 40
 * clases. Esta pagina las muestra todas, una vez, con su nombre: es la
 * documentacion que se lee de verdad y el test de que ninguna este rota.
 *
 *   node galeria.js --salida ../ejemplo/componentes.html
 *   node galeria.js --salida c.html --oscuro
 *
 * Sale distinto de EXIT: 0 si ninguna componente quedo vacia (es decir, si el
 * selector existe en el CSS). Si una clase no esta, avisa y sale 1.
 */

const fs = require('fs');
const path = require('path');
const nueva = require('./nueva-carpeta.js');
const trazos = require('./trazos.js');

const RAIZ = path.join(__dirname, '..');
const CSS = nueva.leerCss();

function svg(tipo, semilla, w, h) {
  const ancho = w || 240;
  const alto = h || 16;
  const map = {
    linea: () => trazos.onda({ x1: 2, y: 8, x2: ancho - 2, y: 8, semilla, ciclos: 5 }),
    subrayado: () => trazos.subrayado({ x1: 2, y: 6, x2: ancho - 2, y: 6, semilla }),
    chispa: () => trazos.chispa({ cx: 10, cy: 10, r: 9, semilla }),
    circulo: () => trazos.circulo({ cx: 20, cy: 20, r: 18, semilla }),
    flecha: () => trazos.flecha({ x1: 2, y1: 10, x2: ancho - 16, y2: 10, semilla }),
    flechaCurva: () => trazos.flechaCurva({ x1: 4, y1: 44, x2: ancho - 8, y2: 44, alto: 26, semilla }),
    rayo: () => trazos.rayo({ x: 6, y: 0, w: 16, h: 32, semilla }),
    tilde: () => trazos.tilde({ x: 2, y: 10, s: 16, semilla }),
    estrella: () => trazos.estrella({ cx: 18, cy: 18, r: 16, semilla }),
    corazon: () => trazos.corazon({ cx: 20, cy: 18, s: 14, semilla }),
    globo: () => trazos.globo({ x: 2, y: 2, w: 150, h: 46, semilla }),
    caja: () => trazos.caja({ x: 2, y: 2, w: ancho - 4, h: alto - 4, semilla, doble: true }),
    cajaRedondeada: () => trazos.cajaRedondeada({ x: 2, y: 2, w: ancho - 4, h: alto - 4, semilla }),
    tachado: () => trazos.tachado({ x1: 2, y: 10, x2: ancho - 4, y: 10, semilla }),
  };
  const CLASES = { linea: 'd-dibujo--linea', subrayado: 'd-dibujo--subrayado', chispa: 'd-dibujo--chispa' };
  const dentro = (map[tipo] || (() => ''))();
  return (
    `<svg class="d-dibujo ${CLASES[tipo] || ''}" viewBox="0 0 ${ancho} ${alto}" ` +
    `width="${ancho}" height="${alto}" xmlns="http://www.w3.org/2000/svg" ` +
    `role="img" aria-hidden="true" focusable="false">${dentro}</svg>`
  );
}

/** Cada entrada: [clase, etiqueta, html interior, css extra opcional] */
const TITULOS = [
  ['t-cursiva', 'cursiva', '<span class="t-cursiva">Título</span>'],
  ['t-cursiva-con-luz', 'cursiva con luz de color',
    '<span class="t-cursiva-con-luz" data-eco="Título">Título</span>'],
  ['t-lapiz', 'lápiz (condensada, tracking amplio)',
    '<span class="t-lapiz">Título</span>'],
  ['t-espaciada', 'espaciada (T I T L U L O)',
    '<span class="t-espaciada">Título</span>'],
  ['t-angosta', 'angosta a mano (caps)', '<span class="t-angosta">Título</span>'],
  ['t-bocetillo', 'bocetillada (marcador grueso)',
    '<span class="t-bocetillo">Título</span>'],
  ['t-marcador', 'marcador permanente', '<span class="t-marcador">Título</span>'],
  ['t-pincel', 'pincel (brush)', '<span class="t-pincel">Título</span>'],
  ['t-manuscrita', 'manuscrita legible', '<span class="t-manuscrita">Título</span>'],
  ['t-infantil', 'infantil', '<span class="t-infantil">Título</span>'],
  ['t-redonda', 'redondita', '<span class="t-redonda">Título</span>'],
  ['t-fina', 'fina (anotacion al margen)', '<span class="t-fina">Título</span>'],
  ['t-didone', 'Didone con doble trazo', '<span class="t-didone">Título</span>'],
  ['t-tinta', 'relleno con degradado', '<span class="t-tinta">Título</span>'],
  ['t-bloque', 'bloque 3D', '<span class="t-bloque">Título</span>'],
  ['t-barrido', 'con barrido de resaltador detras',
    '<span class="t-cursiva t-barrido">Título</span>'],
  ['t-subrayado-al-borrador', 'con subrayado de resaltador',
    '<span class="t-subrayado-al-borrador">Título</span>'],
  ['t-rayado', 'relleno rayado',
    '<span class="t-rayado" style="padding:.2em .5em">Título</span>'],
];

const EN_CAJA = [
  ['t-en-caja', 'caja doble dibujada', '<span class="t-en-caja"><b>Título</b></span>'],
  ['t-en-cinta', 'cinta de puntas en V', '<span class="t-en-cinta">Título</span>'],
  ['t-en-ticket', 'ticket con muescas', '<span class="t-en-ticket">Título</span>'],
  ['t-en-calendario', 'etiqueta colgante',
    '<span class="t-en-calendario">Día<b>01</b></span>'],
  ['t-en-globo', 'globo de dialogo', '<span class="t-en-globo">Título</span>'],
  ['t-en-galeria', 'banderines',
    '<span class="t-en-galeria"><span>tema</span><span>tema</span></span>'],
  ['t-en-sello', 'sello circular', '<span class="t-en-sello">Urge</span>'],
];

const SUBTITULOS = [
  ['s-guion', 'subtitulo con filete', '<h3 class="s-guion">Subsección</h3>'],
  ['s-marcador', 'subtitulo con marquito de color', '<h3 class="s-marcador">Subsección</h3>'],
  ['s-manuscrita', 'subtitulo escrito a mano', '<h3 class="s-manuscrita">Subsección</h3>'],
  ['s-etiqueta', 'etiqueta de categoría', '<span class="s-etiqueta">Definición</span>'],
];

const BLOQUES = [
  ['a-definicion', 'definición',
    '<div class="a-definicion"><strong>Término.</strong><p>Lo que significa, en una o dos frases.</p></div>'],
  ['a-tip', 'tip', '<div class="a-tip"><p>El consejo que se lee primero.</p></div>'],
  ['a-cuidado', 'ojo / cuidado', '<div class="a-cuidado"><p>Lo que no hay que hacer.</p></div>'],
  ['a-resumen', 'resumen', '<div class="a-resumen"><h3>Resumen</h3><p>Las tres ideas, en corto.</p></div>'],
  ['a-ejemplo', 'ejemplo o cálculo',
    '<div class="a-ejemplo">7 x 7 = 49<br>una persona de 70 kg ~ 5 L/min</div>'],
  ['a-al-margen', 'anotación al margen',
    '<div class="a-al-margen">Ojo con esta confusión: es al revés de lo que parece.</div>'],
  ['a-cita', 'cita de otro', '<blockquote class="a-cita">Lo que dijo el otro, textual.</blockquote>'],
  ['a-fuente', 'fuente', '<p class="a-fuente">Fuente: <a href="#">el paper</a>, cap. 19.</p>'],
  ['a-pasos', 'pasos numerados',
    '<ol class="a-pasos"><li>El primer paso.</li><li>El segundo.</li><li>El tercero.</li></ol>'],
  ['a-tablero', 'tabla comparativa',
    '<div class="a-tablero"><table><thead><tr><th>A</th><th>B</th></tr></thead>' +
    '<tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table></div>'],
];

const DECOR = [
  ['d-cinta', 'cinta washi', '<span class="d-cinta d-cinta-izq" style="position:static;display:inline-block"></span>'],
  ['d-chispa', 'chispa', svg('chispa', 'g-chispa', 22, 22)],
  ['d-linea', 'separador ondulado', svg('linea', 'g-linea', 240, 16)],
  ['d-nota', 'post-it', '<span class="d-nota">nota al pie</span>'],
  ['d-sello', 'sello', '<span class="d-sello">Revisado</span>'],
  ['d-folio', 'folio', '<span class="d-folio">03 / 12</span>'],
  ['d-pin', 'chincheta', svg('rayo', 'g-rayo', 20, 34)],
];

const TRAZOS_LISTA = [
  ['chispa', svg('chispa', 't-chispa', 22, 22)],
  ['estrella', svg('estrella', 't-estrella', 24, 24)],
  ['corazon', svg('corazon', 't-corazon', 24, 24)],
  ['rayo', svg('rayo', 't-rayo', 20, 34)],
  ['tilde', svg('tilde', 't-tilde', 20, 20)],
  ['flecha', svg('flecha', 't-flecha', 120, 16)],
  ['flechaCurva', svg('flechaCurva', 't-flechac', 140, 72)],
  ['subrayado', svg('subrayado', 't-sub', 140, 14)],
  ['tachado', svg('tachado', 't-tacha', 140, 14)],
  ['caja', svg('caja', 't-caja', 140, 56)],
  ['cajaRedondeada', svg('cajaRedondeada', 't-cajar', 140, 56)],
  ['circulo', svg('circulo', 't-circ', 40, 40)],
  ['globo', svg('globo', 't-globo', 160, 64)],
  ['onda', svg('linea', 't-onda', 140, 16)],
  ['marcador', `<span style="position:relative;display:inline-block;isolation:isolate;padding:0 .2em">
      <span style="position:absolute;inset:.1em -.1em;background:var(--manteca);opacity:.6;
        transform:rotate(-1.4deg);border-radius:4px 12px 4px 14px;z-index:-1"></span>
      <b>resaltador</b></span>`],
];

/* Los 22 papeles se leen del CSS: si se agrega uno, la galeria lo toma sola. */
function papeles() {
  const css = fs.readFileSync(path.join(RAIZ, 'assets', 'papeles.css'), 'utf8');
  return [...new Set([...css.matchAll(/\[data-papel="([^"]+)"\]/g)].map((m) => m[1]))];
}

const ARQ = [
  ['c-portada', 'portada', null],
  ['c-divisorias', 'divisorias', null],
  ['c-indice', 'índice', null],
  ['c-navegacion', 'navegación', null],
  ['p-hoja', 'hoja cuadriculada', null],
  ['p-rayas', 'hoja rayada', null],
  ['p-punteado', 'hoja punteada', null],
  ['d-agujeros', 'agujeros del cuaderno', null],
  ['d-margen', 'línea de margen', null],
];

/* --------------------------------------------------------------- render -- */

function celda(clase, rotulo, html, extraCss) {
  return `
<figure class="celda" style="${extraCss || ''}">
  <div class="celda__demo">${html}</div>
  <figcaption><code>.${clase}</code> <span>${rotulo}</span></figcaption>
</figure>`;
}

function seccion(titulo, nota, items) {
  return `
<section class="p-hoja p-cuadros d-agujeros d-margen">
  <h2 class="t-angosta">${titulo}</h2>
  ${svg('subrayado', 'g-' + titulo, 260, 14)}
  ${nota ? `<p class="t-manuscrita">${nota}</p>` : ''}
  <div class="rejilla">
    ${items.join('')}
  </div>
</section>`;
}

function construir(oscuro) {
  const ausente = [];
  for (const grupo of [TITULOS, EN_CAJA, SUBTITULOS, BLOQUES, DECOR]) {
    for (const [clase] of grupo) {
      if (!new RegExp('\\.' + clase + '\\b').test(CSS)) ausente.push(clase);
    }
  }

  const arqDemo = ARQ.map(([clase, rotulo]) => {
    let demo = '';
    if (clase === 'c-portada') {
      demo = `<div class="c-portada" style="padding:26px 18px 22px">
        <span class="s-etiqueta">carpeta</span>
        <h1 class="t-cursiva t-barrido" style="font-size:2.4rem">Título</h1></div>`;
    } else if (clase === 'c-divisorias') {
      demo = `<div class="p-carpeta" style="padding:14px 12px 16px">
        <nav class="c-divisorias" style="margin-bottom:-16px">
        <a class="c-tab" href="#">BIO</a><a class="c-tab" href="#">MAT</a></nav></div>`;
    } else if (clase === 'c-indice') {
      demo = `<div class="c-indice" style="grid-template-columns:1fr 1fr">
        <a class="c-hoja-enlace" href="#"><span class="c-hoja-enlace__num">01</span>
        <span class="c-hoja-enlace__t">Tema</span>
        <span class="c-hoja-enlace__d">Una linea.</span>
        <span class="c-hoja-enlace__tema"></span></a>
        <a class="c-hoja-enlace" href="#"><span class="c-hoja-enlace__num">02</span>
        <span class="c-hoja-enlace__t">Otro</span>
        <span class="c-hoja-enlace__d">Una linea.</span>
        <span class="c-hoja-enlace__tema" style="background:var(--menta)"></span></a></div>`;
    } else if (clase === 'c-navegacion') {
      demo = `<nav class="c-navegacion" style="border-top:0">
        <a class="ant" href="#">← Anterior</a><a class="sig" href="#">Siguiente →</a></nav>`;
    } else if (clase === 'p-hoja') {
      demo = '<div class="p-hoja" style="width:auto;margin:0;padding:16px 18px">Hoja cuadriculada</div>';
    } else if (clase === 'p-rayas') {
      demo = '<div class="p-rayas" style="width:auto;padding:8px 12px 22px;margin:0">Hoja rayada</div>';
    } else if (clase === 'p-punteado') {
      demo = '<div class="p-punteado" style="width:auto;padding:14px;margin:0">Hoja punteada</div>';
    } else if (clase === 'd-agujeros') {
      demo = '<div class="p-hoja d-agujeros" style="width:auto;height:96px;padding:8px 8px 8px 62px;margin:0">agujeros</div>';
    } else {
      demo = '<div class="p-hoja d-margen" style="width:auto;height:96px;padding:8px 8px 8px 62px;margin:0">margen</div>';
    }
    return celda(clase, rotulo, demo);
  });

  return {
    ausente,
    html: `<!doctype html>
<html lang="es"${oscuro ? ' data-tema="noche"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Galería de componentes — apuntes</title>
<style>
${nueva.incrustar().css}

/* --- andamiaje de la galeria (no forma parte del sistema) --- */
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  margin: 1.2em 0 .4em;
}
.celda { margin: 0; }
.celda__demo {
  display: grid; place-items: center;
  min-height: 108px; padding: 14px;
  background: var(--papel-caja);
  border: 1.5px dashed color-mix(in srgb, var(--tinta) 30%, transparent);
  border-radius: 10px;
  overflow: auto;
}
.celda figcaption {
  margin-top: 7px; font-size: .82rem; line-height: 1.35; color: var(--tinta-2);
}
.celda figcaption code {
  font-family: var(--f-mono); font-size: .95em; color: var(--tinta);
  background: none; border: 0; padding: 0;
}
.celda figcaption span { display: block; opacity: .8; }
.aviso {
  padding: 12px 16px; margin: 0 0 20px;
  background: color-mix(in srgb, var(--coral) 22%, var(--papel-caja));
  border: 2px solid var(--coral-fuerte); border-radius: 10px;
}
</style>
</head>
<body class="apuntes">
<div style="max-width:980px;margin:0 auto;padding:0 16px 60px">
${ausente.length ? `<p class="aviso"><strong>Faltan en el CSS:</strong> ${ausente.map((c) => '<code>.' + c + '</code>').join(', ')}</p>` : ''}

<section class="p-carpeta" style="margin-top:24px">
  <div class="c-portada" style="padding:38px 24px 30px">
    <span class="s-etiqueta" style="--acento-fondo:var(--menta)">galería</span>
    <h1 class="t-cursiva t-barrido">Componentes</h1>
    ${svg('subrayado', 'g-portada', 300, 14)}
    <p class="t-manuscrita">Todos los títulos, bloques y decoraciones, con su nombre.</p>
    <div class="c-portada__meta"><span>${TITULOS.length} títulos</span>
      <span>${BLOQUES.length} bloques</span><span>${TRAZOS_LISTA.length} trazos</span></div>
  </div>
  <nav class="c-divisorias" style="margin-bottom:-30px">
    <a class="c-tab" href="#titulos">Títulos</a>
    <a class="c-tab" href="#marcos">Marcos</a>
    <a class="c-tab" href="#bloques">Bloques</a>
    <a class="c-tab" href="#decoracion">Decoración</a>
    <a class="c-tab" href="#trazos">Trazos</a>
    <a class="c-tab" href="#arquitectura">Carpeta</a>
  </nav>
</section>

${seccion('Títulos', 'Uno por nivel de jerarquía. Un cuaderno con quince estilos de título es ruido.', TITULOS.map(([c, r, h]) => celda(c, r, h)))}
${seccion('Marcos', 'El título dentro de una forma dibujada.', EN_CAJA.map(([c, r, h]) => celda(c, r, h)))}
${seccion('Subtítulos', 'La jerarquía que se repite 40 veces por apunte. Uno solo.', SUBTITULOS.map(([c, r, h]) => celda(c, r, h)))}
${seccion('Bloques de apunte', 'Máximo dos o tres por hoja: si hay ocho, no se lee ninguno.', BLOQUES.map(([c, r, h]) => celda(c, r, h)))}
${seccion('Decoración', 'Para separar, no para llenar.', DECOR.map(([c, r, h]) => celda(c, r, h)))}
${seccion('Trazos a mano', 'SVG generados por trazos.js. Todos usan currentColor.', TRAZOS_LISTA.map(([n, h]) => celda('trazos.' + n, 'trazos.js', h)))}
${seccion('Arquitectura de carpeta', 'Portada, divisorias, índice, hoja y navegación.', arqDemo)}

<section class="p-hoja p-textura d-margen">
  <h2 class="t-angosta">papeles</h2>
  ${svg('subrayado', 'g-papeles', 260, 14)}
  <p class="t-manuscrita">Cada celda es un <code>data-papel</code>. En la carpeta entera se
     cambia con <code>&lt;html data-papel="kraft"&gt;</code>.</p>
  <div class="rejilla">
    ${papeles().map((q) => celda('data-papel="' + q + '"', q,
      `<div class="p-textura" data-papel="${q}" style="width:100%;min-height:96px;
        padding:10px 12px;border-radius:8px;border:1.5px dashed rgba(0,0,0,.18)">
        ${q}</div>`)).join('')}
  </div>
</section>

</div>
</body>
</html>
`,
  };
}

function main() {
  const argv = process.argv.slice(2);
  let salida = null;
  let oscuro = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--salida') salida = argv[++i];
    else if (argv[i] === '--oscuro') oscuro = true;
    else if (argv[i] === '-h' || argv[i] === '--help') {
      console.log('galeria.js --salida <archivo.html> [--oscuro]');
      process.exit(0);
    } else {
      console.error('  flag desconocido: ' + argv[i]);
      process.exit(1);
    }
  }
  if (!salida) {
    console.error('  falta --salida');
    process.exit(1);
  }
  const { ausente, html } = construir(oscuro);
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  fs.writeFileSync(salida, html, 'utf8');
  console.log('  ' + salida);
  console.log('  ' + (fs.statSync(salida).size / 1024).toFixed(0) + ' KB' +
    (oscuro ? ' · tema noche' : ''));
  if (ausente.length) {
    console.error('  FALTAN en el CSS: ' + ausente.join(', '));
    process.exitCode = 1;
  } else {
    console.log('  todas las clases del catálogo existen en el CSS');
  }
}

if (require.main === module) main();
module.exports = { construir };