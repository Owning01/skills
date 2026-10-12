#!/usr/bin/env node
'use strict';
/*
 * nueva-carpeta.js — arma una "carpeta de apuntes" en HTML.
 *
 * Que resuelve: los apuntes bonitos de referencia son HOJAS dentro de una CARPETA
 * con divisorias de color, no paginas sueltas. Este script genera esa estructura
 * completa a partir de archivos .md: portada, divisorias, indice y una hoja por
 * apunte, con los componentes del catalogo (assets/apuntes.css).
 *
 * Que NO hace: no interpreta markdown completo ni deja escapar HTML. Es un
 * subconjunto deliberado y documentado en SKILL.md. Si necesitas tablas anidadas
 * o HTML crudo, pasa `--html` y se respeta lo que escribas.
 *
 * Uso:
 *   node nueva-carpeta.js notas/*.md --salida carpeta.html
 *   node nueva-carpeta.js notas/ --salida carpeta/ --paginas   # una hoja por archivo
 *   node nueva-carpeta.js notas/ --salida c.html --enlazar     # sin incrustar fuentes
 *   node nueva-carpeta.js notas/ --salida c.html --indice      # ademas imprime el indice
 *
 * Flags:
 *   --salida <ruta>   archivo (modo libro) o carpeta (con --paginas)
 *   --titulo <txt>    titulo de la carpeta; si no, sale del primer apunte
 *   --autor  <txt>    nombre que va en la portada
 *   --paginas          un .html por apunte + indice.html, en vez de un libro unico
 *   --enlazar          linkea assets/ en vez de incrustar el CSS y las fuentes
 *   --indice           imprime el indice por stdout y exit
 *   --estilo <clase>  forzar el estilo del titulo de todas las hojas
 *   --html             no escapar el HTML del .md (confia en el archivo)
 *
 * Salidas: 0 ok · 1 error de uso · 2 no encontro notas · 3 fallo al escribir
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const trazos = require('./trazos.js');

const RAIZ = path.join(__dirname, '..');
const ASSETS = path.join(RAIZ, 'assets');

/* ------------------------------------------------------------------- utils */

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Escapa solo para dentro de un atributo entre comillas dobles. */
const attr = (s) => esc(s).replace(/'/g, '&#39;');

/** Titulo -> id de ancla estable. */
function ancla(txt) {
  const base = String(txt)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'apunte';
}

function numDos(n) {
  return String(n).padStart(2, '0');
}

/** Levanta un error con codigo de salida, sin stack si es de uso. */
function muere(msg, codigo) {
  console.error('  ' + msg);
  process.exit(codigo == null ? 1 : codigo);
}

/* ------------------------------------------------------- frontmatter (fm) */

/**
 * Separa el frontmatter YAML (delimitado por ---) del cuerpo.
 * Solo escalares y listas de una linea: no hace falta mas para esto y no
 * queremos una dependencia de YAML.
 *   titulo: circulation animal
 *   tema: biologia
 *   resumen: Una linea para el indice
 *   etiquetas: [a, b]
 */
/** Quita tildes y pasa a minusculas: `título` y `Titulo` son el mismo identificador.
 *  Se usa en las tres partes donde el usuario escribe palabras: claves del
 *  frontmatter, palabra clave del callout y lenguaje del bloque cercado. */
function plano(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function partirFm(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, cuerpo: texto };
  const fm = {};
  for (const linea of m[1].split(/\r?\n/)) {
    // La clave acepta cualquier letra, no solo [a-zA-Z]: con el rango ASCII,
    // `título:` no matcheaba y se descartaba en silencio (el apunte salia con el
    // nombre de archivo en vez del titulo). Despues se le quitan las tildes,
    // así que `título:` y `titulo:` terminan en la misma clave.
    const mm = linea.match(/^(\p{L}[\p{L}\p{N}_-]*):\s*(.*)$/u);
    if (!mm) continue;
    const clave = plano(mm[1]);
    let v = mm[2].trim();
    if (/^\[.*\]$/.test(v)) {
      fm[clave] = v.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean);
    } else {
      fm[clave] = v.replace(/^["']|["']$/g, '');
    }
  }
  return { fm, cuerpo: texto.slice(m[0].length) };
}

/* ------------------------------------------------------- markdown -> html */

const CALLOUTS = {
  tip: ['a-tip', ''], ojo: ['a-cuidado', ''], cuidado: ['a-cuidado', ''],
  nota: ['a-definicion', ''], resumen: ['a-resumen', ''],
  ejemplo: ['a-ejemplo', ''], fuente: ['a-fuente', ''],
  margen: ['a-al-margen', ''], definicion: ['a-definicion', ''],
  definiciones: ['a-definicion', ''],
};

/**
 * Subconjunto de markdown. Devuelve HTML.
 * `permitirHtml` deja pasar el HTML crudo del archivo (flag --html).
 */
function mdAHtml(src, permitirHtml) {
  const lineas = String(src).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let p = [];

  const cerrarP = () => {
    if (!p.length) return;
    out.push('<p>' + inline(p.join('\n'), permitirHtml) + '</p>');
    p = [];
  };

  while (i < lineas.length) {
    const l = lineas[i];

    // --- bloque de codigo -------------------------------------------------
    if (/^```/.test(l)) {
      cerrarP();
      const lengua = l.slice(3).trim();
      const buf = [];
      i++;
      while (i < lineas.length && !/^```/.test(lineas[i])) { buf.push(lineas[i]); i++; }
      i++;
      // ```calculo (o ```cálculo: escribirlo con tilde es lo natural) abre la caja
      // rayada de los apuntes, no un bloque de codigo gris.
      const esCalculo = plano(lengua) === 'calculo';
      if (esCalculo) {
        out.push('<div class="a-ejemplo">' + esc(buf.join('\n')).replace(/\n/g, '<br>') + '</div>');
      } else {
        out.push(
          '<pre><code' + (lengua ? ` class="language-${attr(lengua)}"` : '') + '>' +
          esc(buf.join('\n')) + '</code></pre>'
        );
      }
      continue;
    }

    // --- linea en blanco --------------------------------------------------
    if (!l.trim()) { cerrarP(); i++; continue; }

    // --- regla horizontal: separador dibujado a mano ----------------------
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(l.trim())) {
      cerrarP();
      out.push(decor('linea'));
      i++;
      continue;
    }

    // --- cita / callout ----------------------------------------------------
    if (/^>\s?/.test(l)) {
      cerrarP();
      const buf = [];
      while (i < lineas.length && (/^>\s?/.test(lineas[i]) || (buf.length && lineas[i].trim()))) {
        buf.push(lineas[i].replace(/^>\s?/, ''));
        i++;
      }
      const primero = (buf[0] || '').trim();
      // Se quitan tildes y acentos de la palabra clave: escribir `definición:` es lo
      // natural en español y debe funcionar igual que `definicion:`. Sin esto el
      // callout caia en la rama de cita y se perdia el formato sin avisar.
      const clave = plano(primero)
        .replace(/[a-z]+$/, '')
        .replace(/[:\u2014\-–].*$/, '')
        .trim();
      if (CALLOUTS[clave]) {
        const [clase] = CALLOUTS[clave];
        // si la primera linea es solo la palabra clave, es un titulo del bloque
        const resto = buf.slice(1);
        const titulo = primero.replace(/^[A-Za-zÁ-úá-úñ ]+\s*[:—-]\s*/, '').trim();
        const cabeza = titulo && titulo !== primero
          ? `<strong>${inline(titulo, permitirHtml)}</strong>`
          : '';
        out.push(
          `<div class="${clase}">` + cabeza +
          mdAHtml(resto.join('\n'), permitirHtml) + '</div>'
        );
      } else {
        out.push('<blockquote class="a-cita">' + mdAHtml(buf.join('\n'), permitirHtml) + '</blockquote>');
      }
      continue;
    }

    // --- tabla -------------------------------------------------------------
    if (/^\|/.test(l) && i + 1 < lineas.length && /^\|[\s:|-]+\|?\s*$/.test(lineas[i + 1])) {
      cerrarP();
      const cab = splitFila(lineas[i]);
      const aline = splitFila(lineas[i + 1]).map((c) =>
        /^:.*:$/.test(c.trim()) ? 'center' : /:$/.test(c.trim()) ? 'right' : 'left');
      i += 2;
      const cuerpoFilas = [];
      while (i < lineas.length && /^\|/.test(lineas[i])) {
        cuerpoFilas.push(splitFila(lineas[i]));
        i++;
      }
      let t = '<div class="a-tablero"><table><thead><tr>';
      cab.forEach((c, k) => {
        t += `<th style="text-align:${aline[k] || 'left'}">${inline(c.trim(), permitirHtml)}</th>`;
      });
      t += '</tr></thead><tbody>';
      for (const fila of cuerpoFilas) {
        t += '<tr>';
        cab.forEach((_, k) => {
          t += `<td style="text-align:${aline[k] || 'left'}">${inline((fila[k] || '').trim(), permitirHtml)}</td>`;
        });
        t += '</tr>';
      }
      t += '</tbody></table></div>';
      out.push(t);
      continue;
    }

    // --- listas -------------------------------------------------------------
    if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
      cerrarP();
      const ordenada = /^\s*\d+[.)]\s+/.test(l);
      const tag = ordenada ? 'ol' : 'ul';
      // pasos: lista ordenada cuya primer linea dice "paso:"
      const esPasos = ordenada && /^\s*\d+[.)]\s+(paso|steps?)\s*:/i.test(l);
      const clase = esPasos ? ' class="a-pasos"' : '';
      const buf = [];
      while (i < lineas.length && /^\s*([-*+]|\d+[.)])\s+/.test(lineas[i])) {
        let t = lineas[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
        if (esPasos) t = t.replace(/^(paso|steps?)\s*:\s*/i, '');
        // continuaciones colgadas
        while (i + 1 < lineas.length && /^\s{2,}\S/.test(lineas[i + 1]) &&
               !/^\s*([-*+]|\d+[.)])\s+/.test(lineas[i + 1])) {
          i++;
          t += ' ' + lineas[i].trim();
        }
        buf.push(t);
        i++;
      }
      out.push(`<${tag}${clase}>` + buf.map((t2) => '<li>' + inline(t2, permitirHtml) + '</li>').join('') +
               `</${tag}>`);
      continue;
    }

    // --- encabezado ---------------------------------------------------------
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      cerrarP();
      const n = Math.min(h[1].length + 1, 5);   // # del .md pasa a h2 de la hoja
      out.push(`<h${n} class="s-guion">${inline(h[2].trim(), permitirHtml)}</h${n}>`);
      i++;
      continue;
    }

    p.push(l);
    i++;
  }
  cerrarP();
  return out.join('\n');
}

function splitFila(l) {
  return l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/**
 * Enfasis de una sola pasada, reutilizable.
 * Se aplica aparte al texto de los enlaces porque el enlace se aparta a un
 * marcador ANTES de que corran las reglas de enfasis: sin esto, `[**t**](url)`
 * dejaba los asteriscos visibles dentro del <a>.
 */
function enfasis(txt) {
  return txt
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
}

/** Markdown en linea. */
function inline(txt, permitirHtml) {
  let s = esc(txt);
  if (permitirHtml) {
    // seDesescapa lo que venia de HTML crudo del archivo, menos el < y >
    s = txt;
  }
  const guardados = [];
  const guardar = (html) => { guardados.push(html); return `\u0000${guardados.length - 1}\u0000`; };

  s = s.replace(/`([^`]+)`/g, (_, c) => guardar(`<code>${c}</code>`));
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g,
    (_, alt, src) => guardar(`<img src="${attr(src)}" alt="${attr(alt)}" loading="lazy">`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g,
    (_, txt2, href) => guardar(`<a href="${attr(href)}" target="_blank" rel="noopener">${enfasis(txt2)}</a>`));
  s = enfasis(s);
  s = s.replace(/\u0000(\d+)\u0000/g, (_, k) => guardados[Number(k)]);
  return s;
}

/* ------------------------------------------------------------ decoraciones */

/** SVG de trazos a mano, para las separaciones y adornos. */
function decor(tipo, semilla, w, h) {
  const ancho = w || 240;
  const alto = h || 16;
  let svg = '';
  if (tipo === 'linea') svg = trazos.onda({ x1: 2, y: 8, x2: ancho - 2, y: 8, semilla: semilla, ciclos: 5 });
  else if (tipo === 'chispa') svg = trazos.chispa({ cx: 10, cy: 10, r: 9, semilla: semilla });
  else if (tipo === 'subrayado') svg = trazos.subrayado({ x1: 2, y: 6, x2: ancho - 2, y: 6, semilla: semilla });
  else if (tipo === 'circulo') svg = trazos.circulo({ cx: 20, cy: 20, r: 18, semilla: semilla });
  else if (tipo === 'flecha') svg = trazos.flecha({ x1: 2, y1: 10, x2: ancho - 14, y2: 10, semilla: semilla });
  else if (tipo === 'rayo') svg = trazos.rayo({ x: 6, y: 0, w: 16, h: 32, semilla: semilla });
  else if (tipo === 'tilde') svg = trazos.tilde({ x: 2, y: 10, s: 16, semilla: semilla });
  else if (tipo === 'estrella') svg = trazos.estrella({ cx: 18, cy: 18, r: 16, semilla: semilla });
  // La clase de tamano importa: sin ella el CSS aplica width:100% y un viewBox
  // cuadrado se estira al ancho del contenedor (la chispa ocupaba media pagina).
  const CLASES_TAMANO = {
    linea: 'd-dibujo--linea', subrayado: 'd-dibujo--subrayado',
    chispa: 'd-dibujo--chispa', circulo: '', flecha: '',
    rayo: '', tilde: '', estrella: '',
  };
  return (
    `<svg class="d-dibujo ${CLASES_TAMANO[tipo] || ''}" viewBox="0 0 ${ancho} ${alto}" ` +
    `width="${ancho}" height="${alto}" ` +
    `xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false">` +
    svg + '</svg>'
  );
}

/* ------------------------------------------------------------- CSS y fuentes */

function leerCss() {
  return fs.readFileSync(path.join(ASSETS, 'apuntes.css'), 'utf8');
}

/** Los nombres de papel que existen de verdad en assets/papeles.css.
 *  Se leen del CSS para que un typo no quede en silencio renderizando un papel
 *  liso sin avisar: es exactamente el fallo que da el atributo equivocado. */
function papelesDisponibles() {
  const css = fs.readFileSync(path.join(ASSETS, 'papeles.css'), 'utf8');
  return [...new Set([...css.matchAll(/\[data-papel="([^"]+)"\]/g)].map((m) => m[1]))];
}

/**
 * Incrusta el CSS y los .woff2 como data URI. Ahi queda el HTML en UN archivo
 * que se puede mandar por mail o abrir desde un pendrive sin la carpeta al lado.
 */
function incrustar() {
  let css = leerCss();
  let fuentesCss = '';
  const dirFuentes = path.join(ASSETS, 'fuentes');
  const fc = path.join(dirFuentes, 'fuentes.css');
  if (fs.existsSync(fc)) {
    fuentesCss = fs.readFileSync(fc, 'utf8');
    let embebidas = 0;
    let peso = 0;
    fuentesCss = fuentesCss.replace(/url\('([^']+\.woff2)'\)/g, (_, rel) => {
      const w = path.join(dirFuentes, rel);
      if (!fs.existsSync(w)) return `url('${rel}')`;
      const buf = fs.readFileSync(w);
      embebidas++;
      peso += buf.length;
      return `url('data:font/woff2;base64,${buf.toString('base64')}')`;
    });
    css = css.replace(`@import url("fuentes/fuentes.css");`, fuentesCss);
  }

  /* Los @import locales se resuelven en cascada, no todos al mismo nivel: se
   * reintenta hasta que no quede ninguno. Con una sola pasada, papers.css
   * importaria a su vez algo que ya quedo debajo.
   * Medido: con una sola pasada el papel no aparecia en el HTML incrustado. */
  let vueltas = 0;
  for (;;) {
    const imports = [...css.matchAll(/@import url\("([^"]+)"\);/g)];
    const locales = imports.filter((m) => !/^https?:/.test(m[1]));
    if (!locales.length || vueltas++ > 8) break;
    for (const m of locales) {
      const destino = path.join(ASSETS, m[1]);
      if (!fs.existsSync(destino)) {
        console.error('  aviso: @import sin archivo: ' + m[1]);
        continue;
      }
      css = css.replace(m[0], fs.readFileSync(destino, 'utf8'));
    }
  }
  return { css, vueltas };
}

/* ------------------------------------------------------------------- HTML */

const PAGINAS = {
  base: (titulo, attrs) =>
`<!doctype html>
<html lang="es"${attrs || ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<style>
__CSS__
</style>
</head>
<body class="apuntes">
__CUERPO__
</body>
</html>
`,
};

function hojaInterior(notas, opts, actual) {
  const total = notas.length;
  const n = actual;
  const prev = total > 1 ? notas[(n - 2 + total) % total] : null;
  const sig = total > 1 ? notas[n % total] : null;
  if (!prev && !sig) return '';
  const enlace = (nota, clase) => {
    const href = opts.paginas ? nota.archivo : '#' + nota.ancla;
    return `<a class="${clase}" href="${href}">${esc(nota.titulo)}</a>`;
  };
  return (
    '<nav class="c-navegacion">' +
    (prev ? enlace(prev, 'ant') : '<span></span>') +
    (sig ? enlace(sig, 'sig') : '<span></span>') +
    '</nav>'
  );
}

function portada(opts, notas) {
  const total = notas.length;
  const t = esc(opts.titulo);
  const tabs = notas
    .map((nota, k) =>
      `<a class="c-tab" href="${opts.paginas ? nota.archivo : '#' + nota.ancla}"` +
      `${k === 0 ? ' aria-current="page"' : ''} title="${attr(nota.titulo)}">` +
      esc(nota.tab || ancla(nota.titulo).slice(0, 8)) + '</a>')
    .join('');
  return `
<section class="p-carpeta">
  <div class="c-portada">
    <span class="s-etiqueta" style="--acento-fondo:var(--manteca)">carpeta de apuntes</span>
    <h1 class="t-cursiva t-barrido" style="margin-top:.5em">${t}</h1>
    ${decor('subrayado', 'portada-sub', 300, 14)}
    ${opts.subtitulo ? `<p class="t-manuscrita">${esc(opts.subtitulo)}</p>` : ''}
    <div class="c-portada__meta">
      ${opts.autor ? `<span>${esc(opts.autor)}</span>` : ''}
      <span>${esc(opts.fecha || hoy())}</span>
      <span>${total} ${total === 1 ? 'hoja' : 'hojas'}</span>
    </div>
  </div>
  <nav class="c-divisorias" aria-label="Divisorias de la carpeta">${tabs}</nav>
</section>
`;
}

function hoy() {
  const d = new Date();
  return `${numDos(d.getDate())}/${numDos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Tarjeta del indice. */
function tarjeta(nota, k, opts) {
  const href = opts.paginas ? nota.archivo : '#' + nota.ancla;
  const color = `var(--${nota.color})`;
  return `
<a class="c-hoja-enlace" href="${href}" style="--tilt:${((k % 5) - 2) * 0.55}deg">
  <span class="c-hoja-enlace__num">${numDos(k + 1)}</span>
  <span class="c-hoja-enlace__t">${esc(nota.titulo)}</span>
  ${nota.resumen ? `<span class="c-hoja-enlace__d">${esc(nota.resumen)}</span>` : ''}
  <span class="c-hoja-enlace__tema" style="background:${color}"></span>
</a>`;
}

function indice(notas, opts) {
  return `
<section class="p-hoja p-textura d-margen" id="indice">
  <h2 class="t-angosta">indice</h2>
  ${decor('chispa', 'indice-chispa', 22, 22)}
  <div class="c-indice">
    ${notas.map((nota, k) => tarjeta(nota, k, opts)).join('')}
  </div>
</section>`;
}

function hoja(nota, k, opts) {
  const id = nota.ancla;
  const color = `var(--${nota.color})`;
  const cinta = nota.color === 'menta' ? 'd-cinta-izq' : 'd-cinta-der';
  const folios = `<span class="d-folio">${String(k + 1).padStart(2, '0')} / ${String(opts.total).padStart(2, '0')}</span>`;
  // Con 28 hojas en un archivo el scroll es largo: cada hoja deja un link al
  // indice arriba, que es la unica salida rapida sin usar tabs.
  const alIndice = opts.paginas ? '' :
    `<a class="d-arriba" href="#indice" title="Ir al indice">&uarr; indice</a>`;

  return `
<article class="p-hoja p-textura d-agujeros d-margen" id="${id}">
  <span class="${cinta} d-cinta" aria-hidden="true"></span>
  <span class="s-etiqueta" style="--acento-fondo:${color}">${esc(nota.tab || '')}</span>
  <h2 class="t-cursiva" style="margin-top:.45em">${esc(nota.titulo)}</h2>
  ${decor('subrayado', id + '-sub', 260, 14)}
  ${nota.bajada ? `<p class="t-manuscrita">${esc(nota.bajada)}</p>` : ''}
  ${nota.cuerpo}
  ${hojaInterior(opts.notas, opts, k)}
  ${folios}
  ${alIndice}
</article>`;
}

/* ------------------------------------------------------------------- main */

function leerNotas(entradas, opts) {
  const archivos = [];
  for (const e of entradas) {
    if (!fs.existsSync(e)) muere('no existe: ' + e, 2);
    const st = fs.statSync(e);
    if (st.isDirectory()) {
      for (const f of fs.readdirSync(e).sort()) {
        if (/\.mdx?$/i.test(f)) archivos.push(path.join(e, f));
      }
    } else {
      archivos.push(e);
    }
  }
  if (!archivos.length) {
    muere('no encontre archivos .md. Revisa la ruta o la extension.', 2);
  }

  const COLORES = ['rosa', 'menta', 'manteca', 'lila', 'celeste', 'coral'];
  const ESTILOS = ['t-cursiva', 't-lapiz', 't-bocetillo', 't-angosta', 't-marcador', 't-pincel'];

  const notas = archivos.map((f, k) => {
    const bruto = fs.readFileSync(f, 'utf8');
    const { fm, cuerpo } = partirFm(bruto);
    // titulo: frontmatter, o primer # del archivo, o el nombre del archivo
    const primerH = cuerpo.match(/^#\s+(.+)$/m);
    const nombre = path.basename(f).replace(/\.mdx?$/i, '');
    const titulo = fm.titulo || (primerH && primerH[1].trim()) ||
                   nombre.replace(/^\d+[-_ ]*/, '').replace(/[-_]+/g, ' ');
    // el H1 del .md pasa a ser el h2 de la hoja: si esta, se usa y no se duplica
    const cuerpoSinH1 = primerH
      ? cuerpo.replace(new RegExp('^#\\s+' + primerH[1].trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm'), '')
      : cuerpo;
    return {
      archivo: f,
      nombre,
      titulo: titulo.trim(),
      tab: fm.tab || fm.tema || null,
      resumen: fm.resumen || null,
      bajada: fm.bajada || fm.subtitulo || null,
      color: COLORES[k % COLORES.length],
      estilo: fm.estilo || ESTILOS[k % ESTILOS.length],
      ancla: ancla(titulo),
      cuerpo: mdAHtml(cuerpoSinH1, opts.html),
    };
  });

  /* Anclas unicas. En el modo de un solo archivo la navegacion es por ancla, y
     dos capitulos con el mismo titulo (o que al normalizar quedan iguales:
     "Nodo 1" y "nodo-1") dejarian dos id iguales y el link saltaria siempre al
     primero. En este PDF no paso, pero no es una garantia: depende del libro. */
  const vistos = new Map();
  for (const nota of notas) {
    const base = nota.ancla;
    const n = (vistos.get(base) || 0) + 1;
    vistos.set(base, n);
    if (n > 1) {
      nota.ancla = base + '-' + n;
      console.error('  aviso: dos apuntes comparten el ancla "' + base +
        '"; el segundo quedo en #' + nota.ancla);
    }
  }
  return notas;
}

/**
 * Devuelve SIEMPRE el CSS como string. Antes devolvia un objeto en un rama y un
 * string en la otra, y el llamador lo pasaba a .replace(): fallaba solo en el
 * camino incrustado, que es el que se usa.
 * El detalle: en modo --enlazar el @import apunta a "fuentes/fuentes.css" porque
 * el CSS vive en assets/. Al copiarlo a una carpeta de salida hay que fixearlo.
 */
function construirCss(opts) {
  if (!opts.enlazar) return incrustar().css;
  // en modo enlazar el HTML vive en otra carpeta: hay que apuntar los imports a
  // la ruta real del CSS (assets/papeles.css y assets/fuentes/fuentes.css).
  return leerCss()
    .replace('@import url("papeles.css");', '@import url("papeles.css");')
    .replace('@import url("fuentes/fuentes.css");', '@import url("fuentes/fuentes.css");');
}

function main() {
  const argv = process.argv.slice(2);
  const opts = { paginas: false, enlazar: false, indice: false, html: false };
  const entradas = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--salida') opts.salida = argv[++i];
    else if (a === '--titulo') opts.titulo = argv[++i];
    else if (a === '--autor') opts.autor = argv[++i];
    else if (a === '--subtitulo') opts.subtitulo = argv[++i];
    else if (a === '--estilo') opts.estilo = argv[++i];
    else if (a === '--papel') opts.papel = argv[++i];
    else if (a === '--tema') opts.tema = argv[++i];
    else if (a === '--papeles') opts.papeles = true;
    else if (a === '--paginas') opts.paginas = true;
    else if (a === '--enlazar') opts.enlazar = true;
    else if (a === '--indice') opts.indice = true;
    else if (a === '--html') opts.html = true;
    else if (a === '-h' || a === '--help') opts.ayuda = true;
    else if (a.startsWith('--')) muere('flag desconocido: ' + a + '\n  ' + ayuda(), 1);
    else entradas.push(a);
  }

  if (opts.ayuda || !entradas.length) {
    console.log(ayuda());
    process.exit(entradas.length ? 0 : 1);
  }
  if (!opts.salida) muere('falta --salida\n  ' + ayuda(), 1);

  if (opts.papeles) {
    console.log('  papeles disponibles (--papel <nombre>):');
    for (const q of papelesDisponibles()) console.log('    ' + q);
    process.exit(0);
  }
  if (opts.papel) {
    const hay = papelesDisponibles();
    if (!hay.includes(opts.papel)) {
      console.error('  papel desconocido: ' + opts.papel);
      console.error('  disponibles: ' + hay.join(', '));
      console.error('  --papeles los lista.');
      process.exit(1);
    }
  }
  if (opts.tema && !['claro', 'noche'].includes(opts.tema)) {
    console.error('  tema desconocido: ' + opts.tema + ' (claro o noche)');
    process.exit(1);
  }

  const notas = leerNotas(entradas, opts);
  if (!opts.titulo) opts.titulo = notas[0].titulo;
  opts.total = notas.length;
  opts.notas = notas;

  if (opts.indice) {
    console.log(notas.map((n, k) => `  ${numDos(k + 1)}  ${n.titulo}`).join('\n'));
    process.exit(0);
  }

  const css = construirCss(opts);
  let attrs = '';
  if (opts.papel) attrs += ' data-papel="' + attr(opts.papel) + '"';
  if (opts.tema === 'noche') attrs += ' data-tema="noche"';

  // salida: un libro, o una carpeta de paginas
  if (!opts.paginas) {
    const cuerpo = portada(opts, notas) + indice(notas, opts) +
      notas.map((n, k) => hoja(n, k, opts)).join('\n');
    escribir(opts.salida,
      PAGINAS.base(opts.titulo, attrs).replace('__CSS__', css).replace('__CUERPO__', cuerpo));
    console.log(`  ${opts.salida}`);
    console.log(`  ${notas.length} hojas · ${(fs.statSync(opts.salida).size / 1024).toFixed(0)} KB` +
      (opts.enlazar ? ' · enlazado' : ' · autocontenido (fuentes dentro)'));
  } else {
    fs.mkdirSync(opts.salida, { recursive: true });
    // las fuentes y el css al lado, para que las paginas los usen
    if (opts.enlazar) {
      // Se copia TODO lo que el CSS referencie, no una lista a mano: cuando se
      // agrego papeles.css al @import, esta copia se quedo con apuntes.css solo y
      // las hojas salian lisas sin ningun aviso.
      for (const f of fs.readdirSync(ASSETS)) {
        if (f.endsWith('.css')) fs.copyFileSync(path.join(ASSETS, f), path.join(opts.salida, f));
      }
      const dirF = path.join(opts.salida, 'fuentes');
      fs.mkdirSync(dirF, { recursive: true });
      for (const f of fs.readdirSync(path.join(ASSETS, 'fuentes'))) {
        fs.copyFileSync(path.join(ASSETS, 'fuentes', f), path.join(dirF, f));
      }
    }
    notas.forEach((nota, k) => {
      nota.archivo = 'hoja-' + numDos(k + 1) + '.html';
    });
    notas.forEach((nota, k) => {
      const cuerpo = hoja(nota, k, opts);
      escribir(
        path.join(opts.salida, nota.archivo),
        PAGINAS.base(nota.titulo, attrs).replace('__CSS__', css).replace('__CUERPO__', cuerpo)
      );
    });
    const cuerpoIndice = portada(opts, notas) + indice(notas, opts);
    escribir(path.join(opts.salida, 'index.html'),
      PAGINAS.base(opts.titulo, attrs).replace('__CSS__', css).replace('__CUERPO__', cuerpoIndice));
    console.log(`  ${opts.salida}\\`);
    console.log(`  index.html + ${notas.length} hojas` +
      (opts.enlazar ? ' · enlazado' : ' · autocontenido'));
  }
}

function escribir(destino, contenido) {
  try {
    fs.mkdirSync(path.dirname(path.resolve(destino)), { recursive: true });
    fs.writeFileSync(destino, contenido, 'utf8');
  } catch (e) {
    muere('no pude escribir ' + destino + ': ' + e.message, 3);
  }
}

function ayuda() {
  return [
    'nueva-carpeta.js — arma una carpeta de apuntes en HTML',
    '',
    '  node nueva-carpeta.js notas/*.md --salida carpeta.html',
    '  node nueva-carpeta.js notas/ --salida salida/ --paginas',
    '',
    'Flags: --salida --titulo --subtitulo --autor --estilo',
    '        --paginas --enlazar --indice --html',
    '        --papel <nombre>  --tema claro|noche  --papeles  (lista los papeles)',
    '',
    'Markdown admitido (subconjunto a proposito):',
    '  #..#####   encabezados  (el # pasa a ser el titulo de la hoja)',
    '  > TIP:     callout: tip ojo cuidado nota definicion resumen',
    '              ejemplo fuente margen  cita',
    '  | a | b |  tabla  -> .a-tablero',
    '  1. paso:    lista ordenada que se vuelve .a-pasos',
    '  ---        separador dibujado a mano (SVG)',
    '  ```        bloque de codigo',
    '  **f** *i* `c` [t](u) ~~t~~ ![a](src)',
    '',
    'Frontmatter: titulo, tab|tema, resumen, bajada|subtitulo, estilo',
    '',
    'Salidas: 0 ok · 1 uso · 2 sin notas · 3 no se pudo escribir',
  ].join('\n');
}

if (require.main === module) main();
module.exports = { mdAHtml, ancla, partirFm, incrustar, leerCss, plano, papelesDisponibles };