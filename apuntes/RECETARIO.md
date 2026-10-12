# Recetario — el catálogo de componentes

Qué se extrajo de los dos cuadernos de referencia y cómo se traduce a una clase.

**Verlos todos, con nombre:** `scripts/galeria.js` genera
`ejemplo/componentes.html`, que es la versión que se lee de verdad. Este archivo
es el mismo catálogo en texto, para cuando estés greppeando.

## De dónde viene cada cosa

Los dos cuadernos de referencia usan las mismas cuatro herramientas y solo cambian
la proporción:

| | Cuaderno 1 (lettering) | Cuaderno 2 (apuntes) |
| :--- | :--- | :--- |
| Qué muestra | ~40 tratamientos del mismo texto "title" | ~25 cuadernos completos con su carpeta |
| Papel | cuadriculado, con perforados | cuadriculado, puntos, rayas |
| Acento | un solo rosa | seis pasteles (rosa, durazno, menta, lila, manteca, celeste, coral) |
| Grosor de línea | 2 px, siempre | 2 px, siempre |
| Girado | 0,5° a 2° por elemento | 0,5° a 2° por elemento |

Lo que se conserva de los dos: la línea fina de tinta, el girado leve, los
pasteles como relleno, y el papel como superficie con textura.

Lo que **no** se conserva: los adornos que no cumplen una función. En el cuaderno
1 hay titles con asteriscos y ondas porque es una hoja de lettering, donde el
adorno es el tema. En un apunte de Biología, eso es ruido.

---

# Títulos — `.t-*`

18 tratamientos. **Elegí uno para el título de la hoja y uno para los
subtítulos.** No uses todos.

## De trazo (la letra)

| Clase | Trazo | Tipografía | Para |
| :--- | :--- | :--- | :--- |
| `.t-cursiva` | cursiva con bucle | Caveat | **el default del título de la hoja** |
| `.t-cursiva-con-luz` | cursiva con eco de color | Caveat | cuando el título necesita más presencia |
| `.t-pincel` | brush, entrada y salida marcadas | Yellowtail | títulos de carácter |
| `.t-manuscrita` | escritura a mano legible | Kalam | **subtítulos**; en cuerpo chico también |
| `.t-infantil` | redondita infantil | Architects Daughter | apunte liviano, guías de estudio |
| `.t-redonda` | redondeada de libreta | Indie Flower | títulos de lista o índice |
| `.t-fina` | cursiva fina | Shadows Into Light | **anotaciones al margen** |
| `.t-marcador` | rotulado a marcador | Permanent Marker | portada de carpeta |

## De consola (las mayúsculas)

| Clase | Trazo | Tipografía | Para |
| :--- | :--- | :--- | :--- |
| `.t-lapiz` | condensada alta y finita, tracking amplio | Oswald 200 | títulos de índice, muy altos |
| `.t-espaciada` | caps con tracking enorme (`T I T L E`) | Oswald 300 | títulos de sección separadores |
| `.t-angosta` | caps angostas a mano | Amatic SC | títulos de hoja de estudio |
| `.t-bocetillo` | caps bocetilladas | Six Caps | títulos rotulados, look de cartulina |

## Con tratamiento

| Clase | Qué le pasa | Para |
| :--- | :--- | :--- |
| `.t-barrido` | swipe de resaltador rosa detrás | el gesto más usado en la referencia** |
| `.t-subrayado-al-borrador` | subrayado de resaltador | cuando el título ya tiene peso |
| `.t-didone` | Didone con doble trazo y sombra de color | títulos con aire editorial |
| `.t-tinta` | relleno con degradado (tinta y acento) | títulos de portada |
| `.t-bloque` | 3D: extrusionado con 8 sombras | sólo portada. En el interior es demasiado |
| `.t-rayado` | relleno rayado (hatch) | etiquetas y sellos, **nunca** un título de hoja |

`.t-barrido` y `.t-cursiva` se combinan:
`<h1 class="t-cursiva t-barrido">Título</h1>`. Eso es lo que usa la portada.

## Dentro de un marco

| Clase | Forma | Referencia en el cuaderno |
| :--- | :--- | :--- |
| `.t-en-caja` | caja doble dibujada, girada 0,7° | el recuadro clásico de la 1ª fila |
| `.t-en-cinta` | cinta con puntas en V | las dos cintas de la 3ª fila |
| `.t-en-galeria` | banderines colgando de una cuerda | la guirnalda de la 6ª fila |
| `.t-en-ticket` | boleto con muescas laterales | etiqueta de fecha |
| `.t-en-calendario` | etiqueta colgante con cuerda (`DÍA 01`) | la etiqueta del centro |
| `.t-en-globo` | globo de diálogo con cola | para **voz del autor**, no para el título |
| `.t-en-sello` | sello circular, girado 11° | "URGE", "REVISADO" |

**No pongas el título dentro de un marco y el título de la hoja a la vez.** El
título de la hoja ya lleva su barrido; el marco es para títulos **secundarios**
dentro de la hoja.

---

# Subtítulos — `.s-*`

La jerarquía que se repite 40 veces por apunte. **Elegí una y usala siempre.**

| Clase | Aspecto |
| :--- | :--- |
| `.s-guion` | sans bold con filete abajo. El default: limpio, no compite |
| `.s-marcador` | sans bold con marquito de color a la izquierda |
| `.s-manuscrita` | escrito a mano, aireado. Para apunte tranquilo |
| `.s-etiqueta` | micro caps sobre caja de color. Etiquetas de categoría |

---

# Bloques de apunte — `.a-*`

## Los que llevan borde

| Clase | Qué es | Color |
| :--- | :--- | :--- |
| `.a-definicion` | término + definición, borde punteado | pastel suave |
| `.a-tip` | el consejo que se lee primero | manteca |
| `.a-cuidado` | lo que no hay que hacer | coral |
| `.a-resumen` | el cierre, borde interior punteado | lila |
| `.a-ejemplo` | bloque rayado en diagonal | celeste |
| `.a-fuente` | el pie de fuente, chico y con filete | tinta al 60% |
| `.a-cita` | voz de otro, cursiva con barra lateral | rosa |
| `.a-al-margen` | anotación que viaja al margen | durazno |

## Los que no

| Clase | Qué es |
| :--- | :--- |
| `.a-pasos` | lista numerada con el número circulado y girado |
| `.a-tablero` | tabla con cabecera de color y separadores punteados |

## Cuál usar cuándo

```
¿es un término?          → .a-definicion
¿es el consejo central?  → .a-tip        (UNO por hoja)
¿es un error frecuente?  → .a-cuidado    (UNO por hoja)
¿es un número o cálculo? → .a-ejemplo
¿es el cierre?           → .a-resumen    (UNO por hoja, el último)
```

Una hoja con ocho cajas de definición no tiene ninguna destacada. **Tres
bloques es un buen número; cinco ya es decoración.**

---

# Superficies — `.p-*` y `.d-*`

El papel no es una clase: es el atributo `data-papel`, que además lleva la paleta.
Se pone en el `<html>` (toda la carpeta) o en una hoja sola.

```html
<html data-papel="kraft">                          <!-- toda la carpeta -->
<article class="p-hoja p-textura" data-papel="isometrica">   <!-- una hoja -->
```

## Los 22 papeles

| Nombre | Trama | Para |
| :--- | :--- | :--- |
| `cuadros` | doble rejilla, suave cada 10 y marcada cada 50 | el de las fotos de referencia |
| `cuadros-finos` | 2 mm | cuadernos chicos, escritura apretada |
| `cuadros-gruesos` | 1 cm, sin rejilla suave | cálculos grandes |
| `rayas` | líneas cada 30 px, interlineado acoplado | escribir corrido |
| `rayas-finas` | línea fina cada 8 px y guía marcada cada 4 | regla tipo Séyès |
| `punteada` | puntos cada 22 px | bullet journal |
| `cornell` | columna de palabras clave + banda de resumen | taking notes de método |
| `casillero` | cuadrícula con guía en cruz | escritura, cuadra china |
| `caligrafia` | bandas regladas con guía a 55° | lettering |
| `musical` | grupos de 5 líneas | pentagrama |
| `vinetas` | panos con medianil grueso | historieta |
| `isometrica` | triángulos de 30° + vertical | 3D, axonometría |
| `triangular` | equiláteros | teselación, quilt |
| `hexagonal` | panal de punta arriba | química, juegos, mapas |
| `ladrillo` | aparejo a medio asta | maquetas, patrones |
| `ingenieria` | rejilla con regla cada 5 | trabajo técnico |
| `coordenadas` | ejes X e Y cruzados | gráficos de funciones |
| `polar` | circunferencias y radios | coordenadas polares |
| `periodico` | columnas | texto corrido |
| `kraft` | grano diagonal | papel reciclado, tono cálido |
| `azul` | rejilla clara sobre azul | plano técnico |
| `pizarron` | sin trama, verde | tema de pizarrón |

`node nueva-carpeta.js --papeles` los lista y **valida**: un nombre mal escrito
falla con error en vez de salir liso.

## Las demás superficies

| Clase | Qué es |
| :--- | :--- |
| `.p-hoja` | la hoja. Padding izquierdo generoso para el margen y los agujeros |
| `.p-textura` | aplica lo que diga `data-papel` |
| `.p-desgarrado` | borde rasgado arriba y abajo |
| `.p-carpeta` | la carpeta, color durazno, con lomo |
| `.d-agujeros` | los cinco perforados del cuaderno |
| `.d-margen` | la línea vertical de margen, en rosa |
| `.d-cinta` + `.d-cinta-izq` / `.d-cinta-der` | cinta washi, girada |
| `.d-chispa` | la estrella chiquita |
| `.d-linea` | separador ondulado dibujado a mano |
| `.d-nota` | post-it |
| `.d-sello` | sello circular |
| `.d-folio` | número de página con guiones |
| `.d-dibujo` | cualquier SVG de `trazos.js` |
| `.d-dibujo--linea` `--subrayado` `--chispa` | variantes con tamaño fijo |

Los `.p-cuadros`, `.p-rayas` y `.p-punteado` de la v1 siguen funcionando: son
alias de textura.

## Tonos propios

Cuatro papeles cambian la paleta, no solo la trama:

| Papel | Fondo | Tinta |
| :--- | :--- | :--- |
| `kraft` | `#e8dcc6` con grano | `#3a2c1c` |
| `azul` | `#16375e` | `#eaf2fc` (clara) |
| `pizarron` | `#22483c` | `#eef6f0` (clara) |
| `periodico` | `#f2efe7` | tinta normal |

`data-tema="noche"` es un tema aparte y pisa al papel elegido.

# El contenedor de la carpeta

| Clase | Qué es |
| :--- | :--- |
| `.c-portada` | la tapa. Título grande + metadatos en caps |
| `.c-divisorias` + `.c-tab` | las pestañas de colores. El color rota solo por posición |
| `.c-indice` + `.c-hoja-enlace` | grilla de tarjetas, cada una girada un poco |
| `.c-navegacion` + `.ant` / `.sig` | anterior y siguiente al pie de la hoja |
| `.c-rejilla` | dos columnas para parte densa y parte suelta |

Las pestañas arman su color con `:nth-child(4n+1..4)` sobre rosa, menta, manteca y
lila. Si querés otro orden, poné `--tab` en la `.c-tab`.

---

# Los colores

| Token | Claro | Uso |
| :--- | :--- | :--- |
| `--rosa` | `#ffb3c9` | acento por defecto: títulos, margen |
| `--menta` | `#a8e3cb` | tablas, positivos |
| `--manteca` | `#ffe79b` | tips, portada |
| `--lila` | `#d7c9f7` | resúmenes |
| `--celeste` | `#b3dcf7` | ejemplos |
| `--coral` | `#ff9f8f` | errores, "ojo" |
| `--durazno` | `#ffd0b3` | la carpeta, anotaciones al margen |

Cada pastel tiene su par "fuerte" (`--rosa-fuerte` = `#ef5f8c`) para texto o
bordes. **El pastel va de fondo; el fuerte va en el texto.** Poner texto oscuro
sobre pastel fuerte es la única combinación que no funciona.

El tema noche existe (`data-tema="noche"` en el `<html>`): es papel oscuro con
pasteles apagados, no una inversión.

---

# Qué NO hacer

- **No uses la letra manuscrita en el cuerpo del texto.** Un párrafo en Caveat no
  se lee. La letra a mano es para títulos, etiquetas y el margen.
- **No uses `.t-bloque` (3D) más de una vez por documento.** Es un efecto de
  portada.
- **No pongas pastel fuerte de fondo con pastel fuerte de texto.** Falta
  contraste.
- **No uses los dos marcos a la vez** (`.t-en-cinta` con `.t-barrido`): el
  barrido queda cortado por el clip-path.
- **No decorés el margen con dos cosas.** Una anotación al margen, con su
  filete. Si va algo más, es ruido.
- **No uses `<h1>` para los subtítulos.** El `#` del markdown se convierte
  automáticamente en el título de la hoja; los `##` en `.s-guion`.

---

# Dónde está cada cosa

```
assets/apuntes.css      el sistema: tokens, 18 títulos, 10 bloques, arquitectura
assets/papeles.css      los 22 papeles: textura y paleta de cada uno
assets/fuentes/         13 familias locales + fuentes.css (generado)
scripts/nueva-carpeta.js  generador de la carpeta
scripts/trazos.js        trazos a mano en SVG (módulo + CLI)
scripts/galeria.js       genera la galería de componentes
scripts/instalar-fuentes.js  baja y deduplica las tipografías
scripts/pdf-a-apuntes.py   PDF -> .md, leyendo las fuentes del PDF
scripts/test-apuntes.js  66 tests, sin red ni navegador
ejemplo/*.md             3 apuntes de ejemplo que ejercitan todo
ejemplo/carpeta.html     la carpeta generada
ejemplo/componentes.html la galería
```