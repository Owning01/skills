---
name: apuntes
description: >-
  Crea "apuntes bonitos" en HTML: una carpeta con portada, divisorias de color,
  índice y una hoja por apunte, con títulos dibujados a mano sobre papel
  cuadriculado, cajas de definición, tips, tablas rayadas y doodles SVG. Usala
  cuando el usuario pida "armar unos apuntes", "una carpeta de apuntes", "un
  cuaderno visual", "pasar esto a apuntes lindos", "apuntes en HTML", "hoja de
  estudio", "resumen visual de un tema", o quiera convertir notas .md en un
  documento que se vea como los apuntes de Pinterest. También para usar sueltas
  las clases de título manuscrito, cinta washi, sello o calendario en cualquier
  HTML que estes armando. Trae 18 estilos de título, 10 bloques de apunte y un
  generador de trazos a mano en SVG sin dependencias.
argument-hint: "[carpeta|apunte|notas|componentes] <carpeta-de-markdown-o-descripcion>"
version: "1.0.0"
license: MIT
---

# Apuntes — carpeta de apuntes a mano, en HTML

Convierte archivos `.md` en una **carpeta de apuntes**: tapa con título, pestañas
de colores, índice de hojas, y cada apunte sobre papel cuadriculado con
perforados y margen.

Todo es **HTML autocontenido**: un solo archivo que se abre sin internet, con las
13 tipografías incrustadas.

## Qué produce

```
portada            .c-portada    título con barrido de resaltador + divisorias de colores
índice             .c-indice     tarjetas con número, título y una línea de resumen
hoja por apunte    .p-hoja       papel cuadriculado, perforados, margen, folio
```

Y dentro de cada hoja, los bloques del catálogo: definiciones, tips, ojos,
resúmenes, tablas, pasos numerados y anotaciones al margen.

## Uso

```powershell
$s = "$HOME\.agents\skills\apuntes\scripts"

# Ver el catálogo completo: los 70 componentes, con nombre (abrir en el navegador)
node "$s\galeria.js" --salida "$env:TEMP\componentes.html"

# Armar la carpeta desde una carpeta de .md
node "$s\nueva-carpeta.js" notas\ --salida salida\carpeta.html --titulo "Genética"

# Cambiar el papel de toda la carpeta (22 disponibles; --papeles los lista)
node "$s\nueva-carpeta.js" notas\ --salida salida\ --papel kraft --paginas --enlazar

# Convertir un PDF de apuntes (363 páginas entran en una pasada)
python "$s\pdf-a-apuntes.py" apunte.pdf --salida notas\
node "$s\nueva-carpeta.js" notas\ --salida salida\ --papel kraft --paginas --enlazar

# Una hoja por archivo, con links reales entre ellas
node "$s\nueva-carpeta.js" notas\ --salida salida\ --paginas --enlazar

# Solo el índice, por stdout (para revisar antes de generar)
node "$s\nueva-carpeta.js" notas\ --salida x.html --indice

# Tests (sin red, sin navegador)
node "$s\test-apuntes.js"
```

## El formato de entrada

Markdown corriente, con frontmatter opcional:

```markdown
---
titulo: Circulación arterial
tab: BIO                 # texto corto de la pestaña
resumen: Una línea para el índice
bajada: El subtítulo bajo el título
---

El cuerpo en markdown normal.

## Los dos circuitos

> definicion: Sistémica
> Alimenta los órganos por encima del diafragma.

> TIP: Si solo te queda una idea, que sea esta.

> OJO: El 20% del gasto cardíaco va al riñón.

1. paso: La aurícula izquierda se llena.
2. paso: El ventrículo expulsa por la aorta.

| Circuito | Sale de | Llega a |
| --- | --- | --- |
| Sistémica | Ventrículo izquierdo | Todo el cuerpo |

```calculo
Volumen minuto = frecuencia × volumen sistólico
  70 × 70 mL = 4,9 L/min
```
```

**Markdown admitido** (subconjunto deliberado, sin dependencias):

| Escribes | Sale |
| :--- | :--- |
| `# Título` | pasa a ser el título de la hoja, no un encabezado suelto |
| `## Sub` | `.s-guion` |
| `> TIP:` `> OJO:` `> RESUMEN:` `> definicion:` `> margen:` `> ejemplo:` | el bloque que corresponda |
| `> cita sin palabra clave` | `.a-cita` |
| `1. paso: ...` | `.a-pasos` con el número circulado |
| `\| a \| b \|` + `\| --- \|` | `.a-tablero` |
| ` ```calculo ` | caja rayada de cálculo |
| ` ```js ` | bloque de código normal |
| `---` | separador ondulado dibujado a mano (SVG) |
| `**f**` `*i*` `` `c` `` `[t](u)` `~~t~~` `![a](src)` | igual que en cualquier markdown |

Las palabras clave aceptan o no la tilde: `> definición:` y `> definicion:` dan lo
mismo. Igual en el frontmatter (`título:` / `titulo:`) y en ```` ```cálculo ````.

## Los papeles

El papel se elige con un atributo, no con una clase. Se pone en el `<html>` para
toda la carpeta, o en una hoja sola:

```html
<html data-papel="kraft">
<article class="p-hoja p-textura" data-papel="isometrica">
```

`node nueva-carpeta.js --papeles` lista los 22. Un nombre mal escrito **falla con
un error**, no sale liso: el nombre se valida contra el CSS.

| Para apuntes | | Para cálculo y técnica | | Tonos | |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cuadros` | la clásica | `isometrica` | 3D y axonometría | `kraft` | reciclado, con grano |
| `cuadros-finos` | 2 mm | `triangular` | triángulos equiláteros | `azul` | plano técnico |
| `cuadros-gruesos` | 1 cm | `hexagonal` | panal, química, juegos | `pizarron` | verde de pizarrón |
| `rayas` | escribir corrido | `ingenieria` | regla marcada cada 5 | `periodico` | columnas |
| `rayas-finas` | tipo Séyès | `coordenadas` | ejes por el centro | | |
| `punteada` | bullet journal | `polar` | coordenadas polares | | |
| `cornell` | palabras clave + resumen | `ladrillo` | aparejo | | |
| `casillero` | escritura, cuadra china | `caligrafia` | bandas con guía a 55° | | |
| `musical` | pentagrama | `vinetas` | panos de historieta | | |

Cada papel define su propia paleta: `azul` invierte la tinta, `kraft` lleva tinta
marrón, `pizarron` pone texto claro sobre verde. `data-tema="noche"` es un tema
aparte y pisa al papel.

## Convertir un PDF de apuntes

`pdf-a-apuntes.py` (Python, necesita `pymupdf`) convierte un PDF de apuntes en
una carpeta de `.md`. **No adivina la estructura: la lee de los metadatos.**

Un PDF guarda, por fragmento de texto, la fuente y la posición. Eso alcanza:

| Qué es | Cómo se detecta |
| :--- | :--- |
| cuerpo de texto | serif regular en el margen |
| viñeta de lista | serif regular, pero indentada |
| ítem numerado | indentado y empieza con "1. " |
| título de sección | sans **negrita** |
| bloque de código | **todos** sus fragmentos en monoespaciada |
| código en línea | fragmento monoespaciada dentro de un párrafo |
| énfasis | negrita o cursiva dentro del texto |
| pie de página | está al fondo de la página |

```powershell
python "$s\pdf-a-apuntes.py" apunte.pdf --salida notaspython "$s\pdf-a-apuntes.py" apunte.pdf --salida notas\ --solo 5      # un capítulo
python "$s\pdf-a-apuntes.py" apunte.pdf --salida x --debug-cap 5     # ver los bloques
```

`--debug-cap` vuelca los bloques ya clasificados de un capítulo. Es la forma de
ajustar las reglas sin adivinar: si algo sale mal, se mira qué tipo tiene.

**Lo que no se recupera** (saberlo antes de mirar el resultado):
- Las imágenes: quedan marcadas como `* [imagen en el PDF original] *`.
- El carácter de la viñeta: no está en una fuente que extraiga. Se reconstruye
  como `-`.
- El orden lógico: manda el del PDF. Un bloque de código puede caer después del
  párrafo que lo explica, que es como está en el original.
- Las tablas: el PDF las entrega como celdas sueltas y quedan como prosa.

## Los tres modos de salida

| Flag | Resultado | Cuándo |
| :--- | :--- | :--- |
| (ninguno) | **un `.html` con todo adentro**: portada, índice y las 28 hojas, con las 16 tipografías en base64 y todo el CSS incrustado | **el default.** Se manda por mail, se abre de un pendrive, se sube a cualquier lado. Sin carpetas al lado y sin internet. |
| `--paginas` | `index.html` + un `.html` por apunte, con el CSS y las fuentes en carpetas | cuando son muchas hojas y se va a leer por partes, o para publicar en la web |
| `--paginas` | `index.html` + una hoja por apunte | cuando son muchos apuntes y se van a leer por partes |
| `--paginas --enlazar` | idem, con `apuntes.css` y `fuentes/` al lado | para publicar en la web o versionar en git |

`--enlazar` en modo libro deja el CSS en la misma carpeta, así que necesita que
los `.css` y `fuentes/` viajen junto al `.html`.

**El archivo único no puede tener ningún `@import` suelto**: el navegador no
tiene carpeta de la que resolverlo y falla en silencio. Hay un test que lo
comprueba mirando el CSS incrustado **sin comentarios**, porque el encabezado de
`apuntes.css` documenta el `<link>` de uso externo.

Cuando todo va en un archivo, la navegación es por ancla y cada hoja lleva un
`↑ indice` arriba a la derecha. Las anclas se numeran si dos apuntes comparten
título: en un archivo único, dos `id` iguales romperían el link para siempre.

## Usar los componentes sueltos

No hace falta el generador. El CSS es una biblioteca de clases:

```html
<link rel="stylesheet" href="ruta/a/apuntes.css">
```

```html
<article class="p-hoja p-cuadros d-agujeros d-margen">
  <span class="d-cinta d-cinta-izq"></span>
  <span class="s-etiqueta" style="--acento-fondo:var(--menta)">DEFINICIÓN</span>
  <h1 class="t-cursiva">Título con resaltador</h1>
  <h2 class="s-guion">Subsección</h2>
  <div class="a-definicion"><strong>Término.</strong><p>Lo que significa.</p></div>
  <div class="a-tip"><p>El consejo.</p></div>
  <span class="d-folio">03 / 12</span>
</article>
```

**Prefijos:** `.t-*` títulos · `.a-*` bloques de apunte · `.p-*` superficies ·
`.d-*` decoración · `.c-*` arquitectura de carpeta · `.s-*` subtítulos.

`RECETARIO.md` tiene la lista completa con "cuándo usarla y cuándo no".

## Trazos a mano (SVG)

`trazos.js` genera líneas temblorosas como de lápiz, sin dependencias ni
librerías. Todo usa `currentColor`.

```js
const { caja, flechaCurva, chispa, circulo, marcador } = require('./trazos.js');
flechaCurva({ x1: 0, y1: 40, x2: 200, y2: 40, alto: 30, semilla: 'conecta-1' })
```

14 formas: `caja` `cajaRedondeada` `circulo` `flecha` `flechaCurva` `subrayado`
`tachado` `marcador` `chispa` `estrella` `corazon` `rayo` `tilde` `globo` `onda`.

**La semilla importa.** Con la misma semilla el dibujo es idéntico siempre: el
HTML es estable entre corridas y se puede cachear. Sin semilla cambia cada vez.

Desde la terminal:

```powershell
node trazos.js '{"forma":"flechaCurva","x1":0,"y1":40,"x2":200,"y2":40,"alto":30}'
```

## Reglas de diseño (estas son las que importan)

1. **Un estilo de título por nivel de jerarquía.** Hay 18 títulos y son para
   elegir *uno* para h1 y *otro* para los subtítulos, no para usar todos.
2. **Máximo dos o tres bloques por hoja.** Una hoja con ocho cajas de definición
   no tiene ninguna destacada.
3. **El cuerpo va en tipografía de sistema, no manuscrita.** La letra a mano es
   para títulos y etiquetas. Un párrafo entero en Caveat no se lee.
4. **El color pastel es de fondo, nunca de texto.** El texto va en `--tinta`.
5. **El resumo va al final**, y es lo último que se lee. Si algo no entra en el
   resumen, probablemente no debería estar.

## Las tipografías

13 familias, 401 KB, **locales** (`assets/fuentes/`). Se Bajan desde Google Fonts
y quedan en la skill, así que el HTML funciona sin internet.

```powershell
node "$s\instalar-fuentes.js"          # baja lo que falte
node "$s\instalar-fuentes.js" --force  # vuelve a bajarlo todo
node "$s\instalar-fuentes.js" --ext    # suma el subset latin-ext
```

Caveat, Yellowtail, Kalam, Patrick Hand, Architects Daughter, Indie Flower,
Shadows Into Light, Oswald, Playfair Display, Amatic SC, Six Caps, Permanent
Marker, Space Mono.

Las que son variable font (Caveat, Oswald, Playfair Display) se guardan **una
sola vez** y se declaran con un rango de pesos: `font-weight: 400 700`. Sin eso,
Google devuelve el mismo archivo tres veces y la skill pesa 240 KB más.

## Trampas (todas son reales)

- **No pongas `width:100%` en un SVG con viewBox cuadrado.** `height:auto` lo
  escala al ancho del contenedor. La chispa (22×22) llegó a renderizarse a
  750×750 y tapó media hoja. Por eso `.d-dibujo` está acotado y cada
  decoración lleva su clase de tamaño.
- **La veta de la cinta washi va como `background-image`, no como segunda capa de
  máscara.** Donde `mask-composite` no está soportado, las rayas se invierten en
  agujeros y la cinta parece un código de barras.
- **Nunca uses el atajo `background:` en un selector de superficie.** El atajo
  también resetea `background-image` a `none`. Como `.p-textura` (que trae la
  textura) está en `papeles.css`, que se carga antes, un `background:` en
  `.p-hoja` lo pisaba: **el color del papel salía bien y la textura no se veía
  nunca.** No es un error visible a simple vista. Hay un test que lo cubre.
- **Los comentarios del CSS se cuelan en los tests.** El CSS va incrustado en el
  HTML, así que sus comentarios van también. Pasó dos veces: un comentario con un
  ejemplo de `<article ...>` hizo contar una hoja de más, y un comentario que
  mencionaba `background:` hizo fallar el test de los atajos. Para chequear CSS,
  compará **sin comentarios**.
- **`node --check` no alcanza.** No detecta TDZ ni orden de declaración, y no
  detecta un `require` que falta hasta que la línea se ejecuta. Corré
  `test-apuntes.js` y, si tocaste el CSS, mirá `componentes.html` en el
  navegador. Tres bugs de esta skill no se veían leyendo el código.
- **El parser normaliza palabras, no bytes.** Cualquier cosa que el usuario
  escriba con tilde (`título:`, `> definición:`, ```` ```cálculo ````) tiene que
  cair en la misma rama que la versión sin tilde, o el bloque se pierde **en
  silencio** y sale como texto normal. Si tocás esa normalización, hay tests.