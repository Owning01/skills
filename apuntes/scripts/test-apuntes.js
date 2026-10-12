#!/usr/bin/env node
'use strict';
/*
 * test-apuntes.js — pruebas de la skill `apuntes`. Sin red, sin navegador.
 *
 *   node test-apuntes.js
 *
 * Salida: "N pasaron, M fallaron". Codigo de salida 0 si no fallo nada.
 *
 * Los tests de aqui nacieron de bugs reales de esta skill, no de cobertura teorica.
 * Cada bloque dice el bug que prevents.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const EJEMPLO = path.join(RAIZ, 'ejemplo');
const nueva = require('./nueva-carpeta.js');
const trazos = require('./trazos.js');

let paso = 0;
let fallo = 0;
const fallos = [];

/**
 * El CSS va incrustado en el HTML, asi que sus comentarios van tambien. Y un
 * comentario puede hacer fallar un test: paso con un ejemplo de `<article ...>`
 * dentro de un comentario y el test contaba una hoja de mas; y con un comentario
 * que menciona `background:` y el test de los atajos lo tomaba por un error real.
 * Pasaron las dos veces. Para chequear CSS se comparan SIN comentarios.
 */
function sinComentarios(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function ok(nombre, cond, detalle) {
  paso++;
  if (cond) {
    console.log('  ok   ' + nombre);
  } else {
    fallo++;
    fallos.push(nombre + (detalle ? '  ->  ' + detalle : ''));
    console.log('  FALLA ' + nombre + (detalle ? '  ->  ' + detalle : ''));
  }
}

function grupo(t) {
  console.log('\n== ' + t);
}

/* =========================================================== frontmatter == */

grupo('frontmatter (regresion: `título:` con tilde se descartaba en silencio)');

{
  const conTilde = nueva.partirFm('---\ntítulo: Con tilde\ntema: Bio\n---\n\n# H1\n');
  ok('titulo: con tilde se lee como titulo',
    conTilde.fm.titulo === 'Con tilde', JSON.stringify(conTilde.fm));
  ok('tema: con tilde se lee como tema', conTilde.fm.tema === 'Bio');

  const sinTilde = nueva.partirFm('---\ntitulo: Sin tilde\n---\n\n# H1\n');
  ok('titulo: sin tilde tambien', sinTilde.fm.titulo === 'Sin tilde');

  const lista = nueva.partirFm('---\netiquetas: [a, b, c]\n---\n\nx\n');
  ok('lista [a, b, c] -> array', Array.isArray(lista.fm.etiquetas) && lista.fm.etiquetas.length === 3,
    JSON.stringify(lista.fm.etiquetas));

  const sinFm = nueva.partirFm('# Solo H1\n\ntexto\n');
  ok('sin frontmatter no rompe', sinFm.fm && Object.keys(sinFm.fm).length === 0 && /Solo H1/.test(sinFm.cuerpo));

  const conCrlf = nueva.partirFm('---\r\ntitulo: CRLF\r\n---\r\n\r\n# H1\r\n');
  ok('frontmatter con CRLF (Windows)', conCrlf.fm.titulo === 'CRLF', JSON.stringify(conCril = conCrlf.fm));
}
var conCril;

/* ============================================================== markdown == */

grupo('markdown (subconjunto a proposito)');

{
  ok('escapa < y > del texto', nueva.mdAHtml('a < b > c', false).includes('&lt;'));
  ok('escapa comillas', nueva.mdAHtml('digo "hola"', false).includes('&quot;') ||
                         nueva.mdAHtml('digo "hola"', false).includes('"hola"'));

  ok('negrita', nueva.mdAHtml('**fuerte**', false) === '<p><strong>fuerte</strong></p>',
    nueva.mdAHtml('**fuerte**', false));
  ok('cursiva', /<em>suave<\/em>/.test(nueva.mdAHtml('*suave*', false)));
  ok('tachado', /<del>no<\/del>/.test(nueva.mdAHtml('~~no~~', false)));
  ok('codigo en linea', /<code>x<\/code>/.test(nueva.mdAHtml('`x`', false)));

  ok('el enlace sobrevive al escapado de <>',
    /<a href="https:\/\/a\.com"[^>]*>t<\/a>/.test(nueva.mdAHtml('[t](https://a.com)', false)),
    nueva.mdAHtml('[t](https://a.com)', false));

  ok('el texto del enlace no se come el markdown',
    !nueva.mdAHtml('[**t**](https://a.com)', false).includes('**t**'),
    nueva.mdAHtml('[**t**](https://a.com)', false));

  ok('codigo en linea no se convierte en negrita',
    nueva.mdAHtml('`**no**`', false) === '<p><code>**no**</code></p>',
    nueva.mdAHtml('`**no**`', false));

  ok('bloque de codigo escapa su contenido',
    nueva.mdAHtml('```js\nconst a = "<b>";\n```', false).includes('&lt;b&gt;'));
}

grupo('callouts (regresion: `> definición:` caia en la rama de cita)');

{
  const d1 = nueva.mdAHtml('> definicion: X\n> cuerpo\n', false);
  const d2 = nueva.mdAHtml('> definición: X\n> cuerpo\n', false);
  ok('definicion sin tilde -> .a-definicion', d1.includes('a-definicion'), d1);
  ok('definición con tilde -> .a-definicion', d2.includes('a-definicion'), d2);

  ok('tip -> .a-tip', nueva.mdAHtml('> TIP: hola\n', false).includes('a-tip'));
  ok('ojo -> .a-cuidado', nueva.mdAHtml('> OJO: hola\n', false).includes('a-cuidado'));
  ok('resumen -> .a-resumen', nueva.mdAHtml('> RESUMEN: hola\n', false).includes('a-resumen'));
  ok('ejemplo -> .a-ejemplo', nueva.mdAHtml('> EJEMPLO: hola\n', false).includes('a-ejemplo'));
  ok('margen -> .a-al-margen', nueva.mdAHtml('> MARGEN: hola\n', false).includes('a-al-margen'));
  ok('sin palabra clave -> .a-cita', nueva.mdAHtml('> solo una cita\n', false).includes('a-cita'));
}

grupo('tablas, pasos, calculo, separadores');

{
  const t = nueva.mdAHtml('| a | b |\n| --- | ---: |\n| 1 | 2 |\n', false);
  ok('tabla envuelta en .a-tablero', t.includes('a-tablero'), t.slice(0, 90));
  ok('alineacion derecha desde :---:', t.includes('text-align:right'), t.slice(0, 160));

  const pasos = nueva.mdAHtml('1. paso: uno\n2. paso: dos\n', false);
  ok('lista "1. paso:" -> .a-pasos', pasos.includes('a-pasos'), pasos);
  ok('la palabra "paso:" se come', !pasos.includes('paso:'), pasos);

  const cal = nueva.mdAHtml('```calculo\n7 x 7 = 49\n```', false);
  ok('```calculo -> .a-ejemplo', cal.includes('a-ejemplo') && !cal.includes('<pre'), cal);
  const calTilde = nueva.mdAHtml('```c\u00e1lculo\n7 x 7 = 49\n```', false);
  ok('```c\u00e1lculo (con tilde) -> .a-ejemplo', calTilde.includes('a-ejemplo'), calTilde);
  ok('el enlace no rompe el enfasis de su texto',
    nueva.mdAHtml('[**t**](https://a.com)', false) === '<p><a href="https://a.com" target="_blank" rel="noopener"><strong>t</strong></a></p>',
    nueva.mdAHtml('[**t**](https://a.com)', false));

  const cod = nueva.mdAHtml('```js\nlet a = 1;\n```', false);
  ok('```js sigue siendo <pre>', cod.includes('<pre><code class="language-js">'), cod);

  const hr = nueva.mdAHtml('antes\n\n---\n\ndespues\n', false);
  ok('--- produce un SVG dibujado a mano',
    hr.includes('<svg') && hr.includes('d-dibujo'), hr.slice(0, 120));

  const h = nueva.mdAHtml('# Titulo\n', false);
  ok('el # del .md pasa a h2 con .s-guion', /<h2 class="s-guion">/.test(h), h);
}

/* ================================================================= anclas == */

grupo('anclas');

{
  ok('acentos no rompen el ancla', nueva.ancla('Circulación arterial') === 'circulacion-arterial',
    nueva.ancla('Circulación arterial'));
  ok('la enye no rompe el ancla', nueva.ancla('Año 2026') === 'ano-2026', nueva.ancla('Año 2026'));
  ok('simbolos se van', /^[a-z0-9-]+$/.test(nueva.ancla('¿Qué es esto? (2026)')), nueva.ancla('¿Qué es esto? (2026)'));
  ok('texto vacio da ancla usable', /^[a-z0-9-]+$/.test(nueva.ancla('***')), nueva.ancla('***'));
}

/* ================================================================ trazos == */

grupo('trazos.js');

{
  ok('la misma semilla da el mismo dibujo',
    trazos.caja({ w: 100, h: 50, semilla: 'a' }) === trazos.caja({ w: 100, h: 50, semilla: 'a' }));
  ok('semillas distintas dan dibujos distintos',
    trazos.caja({ w: 100, h: 50, semilla: 'a' }) !== trazos.caja({ w: 100, h: 50, semilla: 'b' }));
  ok('todo trazo usa currentColor (hereda el color del texto)',
    trazos.caja({ semilla: 'a' }).includes('stroke="currentColor"'));
  ok('ningun trazo trae coordenadas NaN',
    !Object.keys(trazos).some((k) => typeof trazos[k] === 'function' && k !== 'unir' &&
      k !== 'prng' && k !== 'hash' && k !== 'f' && /NaN|Infinity/.test(String(trazos[k]({ semilla: 'x' })))));

  const vacio = trazos.caja({ w: 0, h: 0, semilla: 'z' });
  ok('caja de tamano 0 no rompe', typeof vacio === 'string' && vacio.length > 0);

  const h = [];
  for (const k of ['chispa', 'estrella', 'corazon', 'rayo', 'tilde', 'flecha', 'flechaCurva',
                   'subrayado', 'tachado', 'marcador', 'globo', 'onda', 'cajaRedondeada', 'circulo']) {
    const s = trazos[k]({ semilla: 's' });
    if (typeof s !== 'string' || !s.includes('<path')) h.push(k);
  }
  ok('las 14 formas devuelven <path>', h.length === 0, 'fallaron: ' + h.join(', '));
}

/* ============================================================== generador == */

const SALIDA = path.join(os.tmpdir(), 'apuntes-test-' + process.pid + '.html');
let html = '';

grupo('generador de punta a punta (archivos reales de ejemplo/)');

{
  // se invoca como proceso aparte: es como lo usa un agente de verdad
  const { execFileSync } = require('child_process');
  let salida = '';
  try {
    salida = execFileSync(process.execPath, [
      path.join(__dirname, 'nueva-carpeta.js'), EJEMPLO,
      '--salida', SALIDA, '--titulo', 'Prueba', '--autor', 'Test',
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    salida = 'ERROR: ' + (e.stderr || e.message);
  }
  ok('el generador corre sin error', /carpeta|hojas/.test(salida), salida.slice(0, 300));

  if (fs.existsSync(SALIDA)) html = fs.readFileSync(SALIDA, 'utf8');

  ok('produce un archivo', html.length > 0);
  ok('es autocontenido (fuentes dentro)',
    html.includes('data:font/woff2;base64') && !html.includes('@import url("fuentes/'),
    'faltan las fuentes incrustadas');
  /* Se cuenta SOLO lo que esta despues de </style>. El CSS va incrustado y sus
     comentarios traen ejemplos de marcado, asi que contar sobre el HTML entero
     contaba un <article> de ejemplo que no existe: el test mentia. */
  const cuerpo = html.slice(html.indexOf('</style>') + 8);
  const hojas = (cuerpo.match(/<article class="p-hoja/g) || []).length;
  ok('tiene las 3 hojas de ejemplo', hojas === 3, String(hojas));
  ok('tiene portada', html.includes('c-portada'));
  ok('tiene indice', html.includes('c-indice'));
  ok('tiene divisorias de color', (html.match(/class="c-tab"/g) || []).length === 3);
  ok('cierra html', html.trim().endsWith('</html>'));
  ok('doctype correcto', /^<!doctype html>/i.test(html));
  ok('lang=es para lectores de pantalla', html.includes('<html lang="es">'));
  ok('no hay CJK ni cirilico escapados',
    !/[\u4e00-\u9fff\u0400-\u04ff]/.test(html),
    (html.match(/[\u4e00-\u9fff\u0400-\u04ff]{1,}/g) || []).slice(0, 3).join(' '));

  // --- regresion: la chispa se renderizaba a 750x750 y tapaba la hoja ---------
  const svgs = [...html.matchAll(/<svg class="d-dibujo([^"]*)"[^>]*width="(\d+)"/g)];
  ok('toda decoracion SVG tiene width <= 400',
    svgs.every((m) => Number(m[2]) <= 400),
    'anchos: ' + svgs.map((m) => m[2]).join(','));
  ok('la chispa lleva su clase de tamano',
    /<svg class="d-dibujo d-dibujo--chispa"[^>]*width="22"/.test(html));
  ok('el separador lleva su variante de ancho',
    html.includes('d-dibujo--linea'));
  ok('el CSS acota la altura de las decoraciones',
    /\.d-dibujo\s*\{[^}]*max-height/.test(nueva.leerCss()));

  // --- toda clase usada tiene que existir en el CSS --------------------------
  const css = nueva.leerCss();
  const declaradas = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const usadas = new Set();
  for (const m of cuerpo.matchAll(/class="([^"]+)"/g)) {
    // t-trazo / t-subrayado-trazos son hooks que pone trazos.js en el <path>:
    // no son clases de CSS y no deberian estar en el CSS.
    const HOOKS_SVG = new Set(['t-trazo', 't-subrayado-trazos']);
    for (const c of m[1].split(/\s+/)) {
      if (c && !c.startsWith('d-dibujo') && !HOOKS_SVG.has(c)) usadas.add(c);
    }
  }
  const huerfanas = [...usadas].filter((c) => !declaradas.has(c));
  ok('toda clase del HTML existe en el CSS', huerfanas.length === 0, 'huerfanas: ' + huerfanas.join(', '));

  /* --- el atajo `background:` resetea background-image ----------------------
   * Regresion real: .p-hoja usaba `background: var(--papel)` y, como
   * .p-textura (que trae --textura) se carga antes, el atajo lo pisaba con
   * `none`. Todas las hojas salian lisas y el color de papel era el correcto,
   * asi que a simple vista parecia que funcionaba. */
  const cssLimpio = sinComentarios(css);
  ok('el CSS no tiene comentarios sin cerrar', (css.match(/\/\*/g) || []).length === (css.match(/\*\//g) || []).length);
  const atajo = cssLimpio.match(/\.(p-hoja|p-textura|p-cuadros|p-rayas|p-punteado)\s*\{[^}]*?\bbackground\s*:/s);
  ok('ningun selector de superficie usa el atajo background:', !atajo,
    atajo ? atajo[0].slice(0, 80) : '');
  ok('cada papel del catalogo define --textura',
    (() => {
      const pap = fs.readFileSync(path.join(RAIZ, 'assets', 'papeles.css'), 'utf8');
      const bloques = [...pap.matchAll(/\[data-papel="([^"]+)"\]\s*\{([\s\S]*?)\n\}/g)];
      const sinTextura = bloques.filter((m) => !/--textura\s*:/.test(m[2]) &&
        !/--papel\s*:/.test(m[2]));
      return sinTextura.length === 0;
    })());
  /* Solo el bloque :root. El data-tema="noche" SI puede redefinirlos: es un
     tema completo y tiene que pisar al papel elegido. */
  const raiz = (cssLimpio.match(/:root\s*\{[\s\S]*?\n\}/) || [''])[0];
  ok('los tokens de papel NO se redefinen en el :root de apuntes.css',
    !/--(papel|papel-bravo|papel-caja|tinta|tinta-2|tinta-3|cuadricula)\s*:\s*#[0-9a-f]{3,6}/i.test(raiz),
    (raiz.match(/--(?:papel|tinta|cuadricula)[\w-]*\s*:\s*#[0-9a-f]{3,6}/i) || [''])[0]);

  /* El archivo unico tiene que traer TODO adentro. Un @import suelto es un
   * archivo que el navegador no puede resolver, y en un HTML que alguien se
   * manda por mail no hay carpeta al lado: falla en silencio y la pagina sale
   * sin tipografia ni textura. Se comparan sin comentarios, porque el CSS
   * explica en un comentario por que existio el import. */
  const cssIncrustado = (html.slice(html.indexOf('<style>'), html.indexOf('</style>')));
  const importsReales = (sinComentarios(cssIncrustado).match(/@import/g) || []).length;
  ok('el CSS incrustado no deja ningun @import', importsReales === 0, String(importsReales));
  ok('el CSS incrustado trae las 16 @font-face',
    (sinComentarios(cssIncrustado).match(/@font-face/g) || []).length === 16,
    String((sinComentarios(cssIncrustado).match(/@font-face/g) || []).length));
  /* Se mira FUERA del <style>. El encabezado de apuntes.css documenta como
     importarlo con <link rel="stylesheet">, asi que la etiqueta aparece en el
     HTML incrustado aunque no exista ninguna referencia real. */
  const fueraDelStyle = html.slice(0, html.indexOf('<style>')) +
                        html.slice(html.indexOf('</style>'));
  const linkCss = fueraDelStyle.match(/<link[^>]+stylesheet[^>]*>/gi) || [];
  ok('el archivo unico no linkea CSS externo', linkCss.length === 0,
    linkCss.slice(0, 2).join(' '));

  // --- los .woff2 referenciados existen en disco ------------------------------
  const fc = path.join(RAIZ, 'assets', 'fuentes', 'fuentes.css');
  const fuentesCss = fs.readFileSync(fc, 'utf8');
  const refs = [...fuentesCss.matchAll(/url\('([^']+\.woff2)'\)/g)].map((m) => m[1]);
  const faltan = refs.filter((f) => !fs.existsSync(path.join(RAIZ, 'assets', 'fuentes', f)));
  ok('cada @font-face apunta a un archivo que existe', faltan.length === 0, 'faltan: ' + faltan.join(', '));
  ok('los pesos variables se declaran como rango',
    /font-family:'Caveat'[^}]*font-weight:400 700/.test(fuentesCss),
    (fuentesCss.match(/font-family:'Caveat'[^}]*font-weight:[^;]+/) || [''])[0]);
}

/* -------------------------------------------------------------- limpieza -- */

if (fs.existsSync(SALIDA)) fs.unlinkSync(SALIDA);

console.log('\n== ' + (fallo === 0 ? 'todo verde' : fallo + ' FALLAS'));
if (fallo) {
  console.log('\nFallaron:');
  fallos.forEach((f) => console.log('  - ' + f));
}
console.log('\n=== ' + paso + ' pasaron, ' + fallo + ' fallaron ===');
process.exitCode = fallo ? 1 : 0;