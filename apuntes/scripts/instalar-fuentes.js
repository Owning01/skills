#!/usr/bin/env node
'use strict';
/*
 * instalar-fuentes.js — baja las tipografias de lettering y las deja LOCALES.
 *
 * Por que existe: una "carpeta de apuntes" que se ve bien necesita esta tipografia.
 * Si el HTML referencia fonts.googleapis.com, se ve bien en linea y se rompe sin
 * internet. Las bajamos una vez y el HTML apunta a archivos propios.
 *
 * Solo se baja el subset `latin`: alcanza para espanol (acentos y enye estan en
 * U+00C0-00FF, que cae en latin). latin-ext se descarta salvo que se pida --ext.
 *
 * Uso:
 *   node instalar-fuentes.js            # baja lo que falte
 *   node instalar-fuentes.js --ext      # ademas baja latin-ext
 *   node instalar-fuentes.js --force    # vuelve a bajar todo
 *
 * Idempotente: si el .woff2 ya esta y no cambio el peso, no vuelve a pegarle.
 * No pide credenciales ni login. No hay nada sensible en este archivo.
 */

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Cada familia existe para replicar un trazo concreto del cuaderno de referencia.
// ver RECETARIO.md -> "De donde sale cada trazo".
const FAMILIAS = [
  { fam: 'Caveat',            pesos: [400, 600, 700], rol: 'cursiva principal' },
  { fam: 'Yellowtail',        pesos: [400],           rol: 'brush (pincel)' },
  { fam: 'Kalam',             pesos: [400, 700],      rol: 'manuscrita' },
  { fam: 'Patrick Hand',      pesos: [400],           rol: 'manuscrita mayuscula' },
  { fam: 'Architects Daughter', pesos: [400],        rol: 'manuscrita infantil' },
  { fam: 'Indie Flower',      pesos: [400],           rol: 'manuscrita redondita' },
  { fam: 'Shadows Into Light', pesos: [400],          rol: 'cursiva fina' },
  { fam: 'Oswald',            pesos: [200, 300, 500], rol: 'condensada alta y fina' },
  { fam: 'Playfair Display',  pesos: [700, 900],      rol: 'Didone inline' },
  { fam: 'Amatic SC',         pesos: [400, 700],      rol: 'caps angostas a mano' },
  { fam: 'Six Caps',          pesos: [400],           rol: 'caps bocetilladas' },
  { fam: 'Permanent Marker',  pesos: [400],           rol: 'marcador' },
  { fam: 'Space Mono',        pesos: [400, 700],      rol: 'typewriter' },
];

const DIR = path.join(__dirname, '..', 'assets', 'fuentes');
const CSS = path.join(DIR, 'fuentes.css');
const WANT_EXT = process.argv.includes('--ext');
const FORCE = process.argv.includes('--force');

function get(url, destino,ua) {
  return new Promise((res, rej) => {
    const r = https.get(
      url,
      { headers: { 'User-Agent': ua || UA }, timeout: 30000 },
      (res_) => {
        if (res_.statusCode >= 300 && res_.statusCode < 400 && res_.headers.location) {
          res_.discard();
          return get(res_.headers.location, destino, ua).then(res, rej);
        }
        if (res_.statusCode !== 200) {
          res_.resume();
          return rej(new Error('HTTP ' + res_.statusCode + ' en ' + url.slice(0, 90)));
        }
        const trozos = [];
        res_.on('data', (d) => trozos.push(d));
        res_.on('end', () => {
          const buf = Buffer.concat(trozos);
          fs.writeFileSync(destino, buf);
          // resuelve con el BUFFER, no con el largo: el llamador necesita el CSS
          res(buf);
        });
        res_.on('error', rej);
      }
    );
    r.on('timeout', () => { r.destroy(new Error('timeout')); });
    r.on('error', rej);
  });
}

function famAE(fam, pesos) {
  return pesos.map((p) => p).join(';');
}

/** Parte el CSS de Google en bloques @font-face y devuelve los que nos sirven. */
function bloques(css, ext) {
  const out = [];
  const re = /@font-face\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const b = m[1];
    const url = (b.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/) || [])[1];
    const rango = (b.match(/unicode-range:\s*([^;]+);/) || [])[1] || '';
    const peso = (b.match(/font-weight:\s*(\d+)/) || [])[1] || '400';
    const estilo = (b.match(/font-style:\s*(\w+)/) || [])[1] || 'normal';
    if (!url) continue;
    const esLatin = /U\+0000-00FF/.test(rango);
    const esExt = /U\+0100-02(AF|BA)/.test(rango);
    if (esLatin || (ext && esExt)) out.push({ url, rango: rango.trim(), peso, estilo });
  }
  return out;
}

async function main() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  const reglas = [];
  let bajados = 0;
  let yaEstaban = 0;
  let bytes = 0;

  for (const { fam, pesos } of FAMILIAS) {
    const url =
      'https://fonts.googleapis.com/css2?family=' +
      encodeURIComponent(fam).replace(/%20/g, '+') +
      ':wght@' + famAE(fam, pesos) +
      '&display=swap';

    process.stdout.write(`  ${fam.padEnd(22)} `);
    let css;
    try {
      css = (await get(url, path.join(os.tmpdir(), `gf-${Date.now()}.css`))).toString();
    } catch (e) {
      console.log('FALLO ' + e.message);
      continue;
    }

    /* Dedupe por URL, no por contenido.
     * Google sirve una variable font cuando se pide `wght@400;600;700`: los tres
     * @font-face apuntan al MISMO archivo y a la MISMA url. Dedupear por hash
     * obligaba a bajar los tres y borrar dos en cada corrida (medido: 5 descargas
     * de mas). Con la url no hace falta ni descargar el duplicado.
     * El nombre del archivo sale del id de Google (ultimo segmento de la url):
     * es estable entre corridas y cambia solo si Google actualiza la fuente.
     * Medido: Caveat 400/600/700, Oswald 200/300/500 y Playfair 700/900.
     */
    const porUrl = new Map();   // url -> { archivo, pesos:Set, rango, estilo }

    for (const b of bloques(css, WANT_EXT)) {
      const ya = porUrl.get(b.url);
      if (ya) { ya.pesos.add(Number(b.peso)); continue; }

      const archivo = fam.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" +
                      b.url.slice(b.url.lastIndexOf("/") + 1);
      const destino = path.join(DIR, archivo);
      try {
        if (fs.existsSync(destino) && fs.statSync(destino).size > 500 && !FORCE) {
          yaEstaban++;
        } else {
          const buf = await get(b.url, destino);
          bajados++;
          bytes += buf.length;
        }
      } catch (e) {
        console.log(`\n    ${archivo}: ${e.message}`);
        continue;
      }
      porUrl.set(b.url, {
        archivo,
        pesos: new Set([Number(b.peso)]),
        rango: b.rango,
        estilo: b.estilo,
      });
    }

    for (const v of porUrl.values()) {
      const ps = [...v.pesos].sort((a, z) => a - z);
      // un peso solo va como numero; varios como rango (variable font)
      const peso = ps.length > 1 ? `${ps[0]} ${ps[ps.length - 1]}` : String(ps[0]);
      reglas.push(
        `@font-face{font-family:'${fam}';font-style:${v.estilo};` +
          `font-weight:${peso};font-display:swap;` +
          `src:url('${v.archivo}') format('woff2');` +
          `unicode-range:${v.rango};}`
      );
    }
    console.log(`${porUrl.size} archivo(s) para ${pesos.length} peso(s)`);
  }

  const cabecera = [
    '/* fuentes.css — GENERADO por scripts/instalar-fuentes.js. No editar a mano.',
    ' * Son los .woff2 de esta misma carpeta: el HTML funciona sin internet.',
    ' * Regenerar:  node ../scripts/instalar-fuentes.js --force',
    ' *',
    ' * Los pesos estan declarados como rango cuando el archivo es variable:',
    ' * Caveat 400-700 es un solo .woff2 con el eje wght adentro.',
    ' */',
    '',
  ].join('\n');

  fs.writeFileSync(CSS, cabecera + reglas.join('\n') + '\n', 'utf8');

  console.log('');
  console.log(`  @font-face escritas : ${reglas.length}`);
  console.log(`  archivos nuevos     : ${bajados}  (${(bytes / 1024).toFixed(0)} KB)`);
  console.log(`  ya estaban          : ${yaEstaban}`);
  console.log(`  -> ${CSS}`);
}

main().catch((e) => {
  console.error('FALLO GENERAL:', e.message);
  process.exitCode = 1;
});