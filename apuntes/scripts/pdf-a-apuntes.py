#!/usr/bin/env python3
"""
pdf-a-apuntes.py — convierte un PDF de apuntes en una carpeta de .md para
nueva-carpeta.js.

QUE RESUELVE
Los apuntes de la facultad vienen en PDF y hay que pasarlos a la carpeta de
apuntes. Volcar el texto a mano no escala (363 paginas en el caso con el que se
desarrollo esto). Y el texto crudo que sale de un PDF pierde casi toda la
estructura: sin margenes, sin vinetas, con las lineas cortadas y el pie metido en
cada pagina.

LA IDEA: NO ADIVINAR, LEER LOS METADATOS
Un PDF guarda, por fragmento de texto, la fuente, el tamano y la posicion. En un
libro maquetado eso alcanza para reconstruir la estructura sin heuristicas:

  | que es               | como se detecta                                        |
  |----------------------|--------------------------------------------------------|
  | cuerpo de texto      | DejaVuSerif 10.5 pt, x de margen (57)                  |
  | vineta de lista      | DejaVuSerif 10.5 pt, x indentada (~74)                 |
  | item numerado        | idem, y el texto arranca con "1. "                      |
  | titulo de seccion    | DejaVuSans-Bold 13 pt                                  |
  | titulo menor         | DejaVuSans-Bold 11 pt                                  |
  | bloque de codigo     | todos sus fragmentos en fuente monoespaciada           |
  | codigo en linea      | fragmento monoespaciado dentro de un parrafo           |
  | enfasis              | DejaVuSerif-Bold o DejaVuSerif-Italic dentro del texto |
  | pie de pagina        | esta al fondo de la pagina, fuera del area de texto    |

Con esto la conversion es casi fiel. Solo se pierde lo que el PDF no guarda:
imagenes (se marcan con un texto), y el caracter de la vineta (esta en una fuente
que no extrae; se reconstruye como "-").

POR QUE NO SE USA pdf_extract
extract.py sirve para LEER un PDF. Este script lo TRANSFORMA: necesita la fuente
de cada fragmento, que la salida de texto plano no trae. Usa pymupdf, que ya es
una dependencia del motor.

Uso:
    python pdf-a-apuntes.py apunte.pdf --salida notas/
    python pdf-a-apuntes.py apunte.pdf --salida notas/ --solo 5
    python pdf-a-apuntes.py apunte.pdf --salida notas/ --resumen-de 3

Opciones:
    --solo N        solo ese capitulo (numero, o letra de apendice)
    --sin-imagenes  no deja marcas [imagen] donde habia una figura
    --debug-cap 1   vuelca los bloques crudos de un capitulo, para ajustar reglas

Salidas: 0 ok · 1 error de uso · 2 no se pudo leer el PDF
"""

import argparse
import io
import os
import re
import sys
import unicodedata

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        print("  falta pymupdf: pip install pymupdf", file=sys.stderr)
        sys.exit(2)


# ============================================================ clasificacion ==

MONO = ("mono", "cour", "consol", "code", "menlo", "courier")
SERIF = ("serif",)
SANS = ("sans",)


def es_mono(font):
    f = font.lower()
    return any(m in f for m in MONO)


def es_sans(font):
    f = font.lower()
    return any(m in f for m in SANS) and not es_mono(font)


def es_bold(font):
    return "bold" in font.lower() or "black" in font.lower() or "heavy" in font.lower()


def es_italic(font):
    return "italic" in font.lower() or "oblique" in font.lower()


# Geometria del libro, medida sobre el PDF real (A4, margenes de 57 pt).
X_MARGEN = 60.0        # cuerpo de texto
X_LISTA = 71.0         # vineta / item de lista
X_NUM = 57.0           # item numerado (el "1." arranca en el margen)
# Medido en el PDF: dos lineas del mismo parrafo quedan a 3.5-4.3 pt de
# separacion; dos parrafos distintos, a mas de 50. El corte va en 10.
HUECO_PARRAFO = 10.0
HUECO_BLOQUE = 30.0    # mas que esto: es otro parrafo

CAPITULO = re.compile(r"^(Cap[ií]tulo\s+(\d+)|Ap[eé]ndice\s+([A-Z]))\.\s*(.*)$")
SECCION = re.compile(r"^(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\s+(\S.*)$")
# Los titulos del libro se parten en varias lineas y el corte no es detectable
# por el texto. Se reconstruyen con una lista corta de conectores.
NO_TITULO = {
    "idea central", "para recordar", "en resumen", "errores frecuentes",
    "resumen", "ejercicio", "ejercicios", "actividad",
}
# Cada rotulo del libro se emite como un CALLOUT DE MARKDOWN, no como HTML crudo.
# Antes se emitia <div class="a-resumen"> y el generador, que escapa HTML a
# proposito, lo dejaba como texto: se veia un "</div>" suelto en la pagina y el
# bloque no_existia. Con "> resumen: ..." el .md sigue siendo markdown valido y
# se ve bien en cualquier otro visor, no solo en esta skill.
CALLOUT_DE = {
    "idea central": "resumen",
    "para recordar": "resumen",
    "en resumen": "resumen",
    "resumen": "resumen",
    "errores frecuentes": "ojo",
    "ejercicio": "ejemplo",
    "ejercicios": "ejemplo",
    "actividad": "ejemplo",
}


def plano(s):
    s = unicodedata.normalize("NFD", s)
    s = s.encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s).strip().lower()


def limpia(txt):
    return txt.replace("­", "").replace("ﬁ", "fi").replace("ﬂ", "fl")


# ============================================================ extraccion ====


def bloques_de(pagina, alto, con_imagenes):
    """Devuelve una lista de bloques ya clasificados, de arriba abajo."""
    salida = []
    d = pagina.get_text("dict")
    for b in d["blocks"]:
        x0, y0, x1, y1 = b["bbox"]

        if b.get("type") == 1:            # imagen
            if con_imagenes:
                salida.append({"tipo": "imagen", "y0": y0, "y1": y1, "x0": x0})
            continue

        # pie de pagina: fuera del area de texto, pegado al borde
        if y0 > alto - 45 or y1 < 40:
            continue
        if y1 - y0 < 4:                  # regla decorativa
            continue

        # PASADA 1: que tipo de bloque es. Hay que saberlo ANTES de unir las
        # lineas, porque el separador entre lineas depende: en codigo es un
        # salto, en prosa es un espacio.
        todos_los_spans = [s for linea in b["lines"] for s in linea["spans"]
                           if limpia(s["text"]).strip()]
        solo_mono = bool(todos_los_spans) and all(
            es_mono(s["font"]) for s in todos_los_spans)
        tam_max = max((s["size"] for s in todos_los_spans), default=0.0)
        hay_sans = any(es_sans(s["font"]) for s in todos_los_spans)

        # PASADA 2: armar el texto, fragmento por fragmento.
        trozos = []
        for li, linea in enumerate(b["lines"]):
            if li > 0 and trozos:
                # En un bloque de codigo cada linea del PDF es una linea real:
                # sin este salto dos sentencias quedan pegadas ("};const").
                # En la prosa el corte es a medio frase: va un espacio. Sin esto,
                # un titulo partido daba "la ausencia dedatos".
                trozos.append(("n", "\n" if solo_mono else " "))
            for s in linea["spans"]:
                tx = limpia(s["text"])
                if not tx.strip():
                    if trozos:
                        k0, t0 = trozos[-1]
                        trozos[-1] = (k0, t0 + " ")
                    continue
                if es_mono(s["font"]):
                    trozos.append(("code", tx))
                elif es_bold(s["font"]):
                    trozos.append(("b", tx))
                elif es_italic(s["font"]):
                    trozos.append(("i", tx))
                else:
                    trozos.append(("n", tx))

        if not trozos:
            continue
        texto = "".join(x for _, x in trozos).strip()
        if not texto:
            continue

        if not trozos:
            continue
        texto = "".join(t for _, t in trozos).strip()
        if not texto:
            continue

        # NO se recalcula solo_mono desde los fragmentos: un parrafo normal con UNA
        # palabra en monoespaciado tendria un fragmento 'code' y pasaria a ser un
        # bloque entero. La decision se tomo en la pasada 1, sobre las fuentes.
        # Los titulos son DejaVuSans-Bold; el tamano separa h2 de h3.

        # Los titulos son DejaVuSans-Bold. El cuerpo nunca es sans-bold, asi que
        # la combinacion fuente+peso alcanza; el tamano separa h2 de h3.
        if solo_mono and len(texto) > 1:
            tipo = "codigo"
        elif hay_sans and tam_max >= 12.5:
            tipo = "h2"
        elif hay_sans and tam_max >= 10.6:
            tipo = "h3"
        elif x0 >= X_LISTA - 4:
            tipo = "lista"
        elif re.match(r"^\d{1,2}[.)]\s", texto):
            tipo = "num"
        else:
            tipo = "parrafo"

        salida.append({
            "tipo": tipo, "y0": y0, "y1": y1, "x0": x0,
            "texto": texto, "trozos": trozos, "tam": tam_max,
        })

    salida.sort(key=lambda b: (round(b["y0"], 1), b["x0"]))
    return salida


def md_en_linea(trozos):
    """Convierte los fragmentos de un parrafo a markdown.

    El PDF parte una frase en varios fragmentos (cambio de fuente, corte de
    linea) y no siempre deja el espacio entre ellos: "necesita un motor" + "que
    lo ejecute" salia como "un motorque lo ejecute". El espacio se decide aqui,
    en un solo lugar, mirando que caracter queda antes y cual viene despues.
    """
    limpio = []
    for k, txt in trozos:
        txt = txt.replace("`", "'")
        limpio.append((k, txt))

    out = []
    for i, (k, txt) in enumerate(limpio):
        if i:
            prev = limpio[i - 1][1]
            fin = prev[-1] if prev else ""
            ini = txt[0] if txt else ""
            # Espacio solo si HAY dos caracteres de palabra pegados. Si cualquiera
            # de los dos lados es puntuacion no se agrega nada: "herramientas." +
            # "Comprender" es el fin de una frase, no una palabra partida.
            if fin.isalnum() and ini.isalnum():
                out.append(("n", " "))

        def envolver(texto, izq, der):
            # los espacios que rodean al fragmento van FUERA de las marcas: si se
            # pusieran adentro, el .strip() los perderia y dos frases enlazadas
            # quedaban pegadas ("un motor**que lo ejecute**")
            lead = texto[:len(texto) - len(texto.lstrip())]
            trail = texto[len(texto.rstrip()):]
            return lead + izq + texto.strip() + der + trail

        if k == "code":
            out.append(("n", envolver(txt, "`", "`")))
        elif k == "b":
            out.append(("n", envolver(txt, "**", "**")))
        elif k == "i":
            out.append(("n", envolver(txt, "*", "*")))
        else:
            out.append(("n", txt))

    s = "".join(t for _, t in out)
    # una llamada pegada al codigo: `document.querySelector()` con el parentesis
    # adentro, no `document`.`querySelector`()
    s = re.sub(r"`([^`]+)`\s*\(", lambda m: "`" + m.group(1) + "`(", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def une_parrafos(bloques):
    """Junta en uno los bloques de prosa que son la misma linea partida.

    Solo se unen bloques `parrafo`. El codigo NO: cada linea de un bloque de
    codigo viene en su propio bloque y, al unirlas, se partia el programa en una
    sola linea larguisima. Las listas tampoco: se agrupan despues con
    `es_item_nuevo`, que si sabe distinguir un item de su continuacion.
    """
    out = []
    for b in bloques:
        if b["tipo"] == "imagen":
            out.append(dict(b, lineas=[]))   # una figura es un corte
            continue
        if b["tipo"] != "parrafo" or not out or out[-1]["tipo"] != "parrafo":
            out.append(dict(b, lineas=[b["texto"]]))
            continue
        hueco = b["y0"] - out[-1]["y1"]
        if -2 <= hueco <= HUECO_PARRAFO and abs(out[-1]["x0"] - b["x0"]) < 6:
            # el PDF no siempre deja el espacio al final de la linea: se agrega
            # a mano o las palabras quedan pegadas ("necesita un motorque")
            ultimo = out[-1]["trozos"][-1]
            if ultimo[1] and not ultimo[1].endswith(" "):
                out[-1]["trozos"][-1] = (ultimo[0], ultimo[1] + " ")
            out[-1]["lineas"].append(b["texto"])
            out[-1]["y1"] = b["y1"]
            out[-1]["trozos"] = out[-1]["trozos"] + b["trozos"]
        else:
            out.append(dict(b, lineas=[b["texto"]]))
    return out


def es_item_nuevo(b, previo):
    """¿Este bloque arranca un item de lista o es la continuacion del anterior?"""
    if previo is None:
        return True
    t = b["texto"].strip()
    # un item numerado siempre arranca uno nuevo
    if re.match(r"^\d{1,2}[.)]\s", t):
        return True
    # una linea de tiempo (1995: ...) siempre arranca uno nuevo
    if re.match(r"^\d{3,4}\s*:", t):
        return True
    if previo["tipo"] == "num" and not re.match(r"^\d{1,2}[.)]\s", previo["texto"].strip()):
        return False   # la continuacion de un item numerado nunca es item
    if previo["tipo"] == "parrafo" and b["tipo"] in ("lista", "num") and b["x0"] >= X_LISTA - 4:
        return False   # la primera linea de un item cuelga de un parrafo
    # el item cierra con puntuacion: si no cierra, es que sigue
    return previo["texto"].rstrip().endswith((";", ".", ":", "!", "?"))


def agrupa_lista(bloques, i):
    """Agrupa desde i el tramo de items de lista. Devuelve (items, sigue)."""
    items = [[bloques[i]]]
    j = i + 1
    while j < len(bloques) and bloques[j]["tipo"] in ("lista", "num", "parrafo"):
        b = bloques[j]
        previo = items[-1][-1]
        if b["tipo"] == "parrafo" and b["x0"] < X_LISTA - 4:
            break
        if es_item_nuevo(b, previo):
            if b["tipo"] == "parrafo":
                break
            items.append([b])
        else:
            items[-1].append(b)
        j += 1
    return items, j


def a_markdown(bloques, con_imagenes, nivel_cap=2):
    md = []
    i = 0
    n = len(bloques)

    while i < n:
        b = bloques[i]
        t = b["tipo"]

        if t == "imagen":
            md.append("")
            md.append("* [imagen en el PDF original] *")
            md.append("")
            i += 1
            continue

        if t == "codigo":
            # El codigo tiene mas interlineado que la prosa: con el margen de
            # parrafo el bloque se partia en varios cercados y el programa
            # quedaba ilegible. Medido: hasta 24 pt entre lineas de codigo.
            buf = [b["texto"]]
            j = i + 1
            while j < n and bloques[j]["tipo"] == "codigo" and \
                    bloques[j]["y0"] - bloques[j - 1]["y1"] < 26:
                buf.append(bloques[j]["texto"])
                j += 1
            md.append("")
            md.append("```js")
            md.extend(x.rstrip() for x in buf)
            md.append("```")
            md.append("")
            i = j
            continue

        if t in ("h2", "h3"):
            txt = " ".join(b["lineas"]).strip()
            # el titulo puede seguir partido en la linea siguiente
            j = i + 1
            while j < n and bloques[j]["tipo"] == t and \
                    bloques[j]["y0"] - bloques[j - 1]["y1"] < HUECO_PARRAFO and \
                    plano(bloques[j]["texto"]) not in NO_TITULO:
                txt += " " + bloques[j]["texto"]
                j += 1
            txt = re.sub(r"\s+", " ", txt).strip()
            clave = plano(txt)
            m = SECCION.match(txt)
            if clave in NO_TITULO:
                cuerpo = []
                k = j
                while k < n and bloques[k]["tipo"] in ("parrafo", "lista", "num"):
                    cuerpo.append(bloques[k])
                    k += 1
                md.append("")
                md.append("> %s: %s" % (CALLOUT_DE.get(clave, "nota"), txt))
                for c in cuerpo:
                    linea = md_en_linea(c["trozos"]).strip()
                    if linea.startswith("- "):
                        # una lista dentro de la cita necesita el guion pegado
                        md.append(">")
                        md.append("> " + linea)
                    else:
                        md.append("> " + linea)
                md.append("")
                i = k
                continue
            md.append("")
            if m:
                md.append("%s %s %s" % ("#" * nivel_cap, m.group(1), m.group(2).strip()))
            else:
                md.append("%s %s" % ("#" * (nivel_cap if t == "h2" else nivel_cap + 1), txt))
            md.append("")
            i = j
            continue

        if t in ("lista", "num"):
            items, j = agrupa_lista(bloques, i)
            md.append("")
            for k, partes in enumerate(items):
                primero = partes[0]
                trozos = []
                for m, parte in enumerate(partes):
                    if m:
                        u = parte["trozos"][0]
                        if u[1] and not u[1].startswith(" "):
                            trozos.append(("n", " "))
                    trozos.extend(parte["trozos"])
                txt = md_en_linea(trozos).strip()
                # el numero sale del propio texto, y se saca del cuerpo para no
                # dejar "1. 1. El lenguaje..."
                mt = re.match(r"^(\d{1,2})[.)]\s*", partes[0]["texto"].strip())
                if mt:
                    txt = re.sub(r"^\d{1,2}[.)]\s*", "", txt).strip()
                    md.append("%s. %s" % (mt.group(1), txt))
                else:
                    md.append("- %s" % txt)
            md.append("")
            i = j
            continue

        # parrafo
        md.append("")
        md.append(md_en_linea(b["trozos"]))
        md.append("")
        i += 1

    limpio = []
    for x in md:
        if x == "" and limpio and limpio[-1] == "":
            continue
        limpio.append(x)
    while limpio and limpio[0] == "":
        limpio.pop(0)
    while limpio and limpio[-1] == "":
        limpio.pop()
    return limpio


# ============================================================ capitulos =====


def partir(doc, con_imagenes):
    bloques = []
    clave = None
    titulo = None
    acum = []

    for n in range(doc.page_count):
        pg = doc[n]
        bs = une_parrafos(bloques_de(pg, pg.rect.height, con_imagenes))
        if not bs:
            continue
        # un capitulo arranca con texto, no con una figura
        while bs and bs[0]["tipo"] == "imagen":
            bs = bs[1:]
        if not bs:
            continue
        primero = bs[0]["texto"].strip()
        m = CAPITULO.match(primero)
        if m:
            if clave is not None:
                bloques.append({"clave": clave, "titulo": titulo, "bs": acum})
            clave = ("cap", m.group(2)) if m.group(2) else ("ape", m.group(3))
            t = m.group(4).strip()
            # el titulo sigue partido en lineas de cuerpo o h3
            k = 1
            while k < len(bs):
                bb = bs[k]
                if bb["tipo"] == "imagen":
                    break
                if bb["tipo"] == "h2" and bb.get("tam", 0) >= 16 and len(bb["texto"].strip()) < 40:
                    # el capitulo 17 es "Programacion asincronica con" + una linea
                    # a 19 pt con "async y await". Es la cola del titulo, no un
                    # encabezado: se come antes de romper.
                    t += " " + bb["texto"].strip()
                    k += 1
                    continue
                if bb["tipo"] in ("h2", "h3"):
                    break
                if bb["tipo"] == "codigo":
                    # "Programacion asincronica con async y await": la cola del
                    # titulo viene en monoespaciado porque son identificadores.
                    # Se absorbe si es corta; si no, es codigo de verdad.
                    if len(bb["texto"].strip()) > 25:
                        break
                    t += " " + bb["texto"].strip()
                    k += 1
                    continue
                frag = bb["texto"].strip()
                if not frag or len(frag) > 60 or frag.endswith((".", ":", ";")):
                    break
                if SECCION.match(frag) or CAPITULO.match(frag):
                    break
                if plano(frag) in NO_TITULO:
                    break
                t += " " + frag
                k += 1
            titulo = re.sub(r"\s+", " ", t).strip()
            acum = bs[k:]
            continue
        if clave is None:
            continue
        acum.extend(bs)

    if clave is not None:
        bloques.append({"clave": clave, "titulo": titulo, "bs": acum})
    return bloques


def resumen_de(md, maximo=155):
    for x in md:
        t = x.strip()
        if not t or t.startswith("#") or t.startswith("```") or t.startswith("<div"):
            continue
        t = re.sub(r"^[-*>0-9.\s]+", "", t)
        t = re.sub(r"`([^`]*)`", r"\1", t)
        t = re.sub(r"[*_]", "", t)
        t = t.strip()
        if len(t) < 55:
            continue
        c = t.find(". ")
        if c > 70:
            t = t[:c + 1]
        return (t[:maximo - 1].rstrip() + "…") if len(t) > maximo else t
    return ""


def nombre(clave, titulo):
    base = re.sub(r"[^a-z0-9]+", "-", plano(titulo)).strip("-")
    pre = ("%02d-" % int(clave[1])) if clave[0] == "cap" else (str(clave[1]).lower() + "-")
    return pre + base[:58] + ".md"


def main():
    ap = argparse.ArgumentParser(description="PDF de apuntes -> carpeta de .md")
    ap.add_argument("pdf")
    ap.add_argument("--salida", required=True)
    ap.add_argument("--solo", help="solo ese capitulo (numero o letra de apendice)")
    ap.add_argument("--sin-imagenes", action="store_true")
    ap.add_argument("--debug-cap", help="vuelca los bloques crudos de ese capitulo y sale")
    args = ap.parse_args()

    if not os.path.exists(args.pdf):
        print("  no existe el PDF: %s" % args.pdf, file=sys.stderr)
        return 2
    try:
        doc = pymupdf.open(args.pdf)
    except Exception as e:
        print("  no se pudo abrir el PDF: %s" % e, file=sys.stderr)
        return 2

    capitulos = partir(doc, not args.sin_imagenes)

    if args.debug_cap:
        for c in capitulos:
            if str(c["clave"][1]).upper() != args.debug_cap.upper():
                continue
            print("  %s %s" % (c["clave"], c["titulo"]))
            for b in c["bs"]:
                print("    %-9s x=%5.1f tam=%4.1f %r" % (
                    b["tipo"], b["x0"], b.get("tam", 0), b["texto"][:66]))
            return 0
        print("  no encontre ese capitulo", file=sys.stderr)
        return 2

    if not capitulos:
        print("  no encontre ningun capitulo. El PDF tendria que empezar cada", file=sys.stderr)
        print("  capitulo con 'Capitulo N.' al principio de una pagina.", file=sys.stderr)
        return 2

    os.makedirs(args.salida, exist_ok=True)
    total_pal = 0
    hechos = 0
    for c in capitulos:
        if args.solo and str(c["clave"][1]).upper() != args.solo.upper():
            continue
        cuerpo = a_markdown(c["bs"], not args.sin_imagenes)
        resumen = resumen_de(cuerpo)
        palabras = sum(len(x.split()) for x in cuerpo)
        total_pal += palabras
        cab = [
            "---",
            "titulo: %s" % c["titulo"],
            "tab: %s" % (("CAP %s" % c["clave"][1]) if c["clave"][0] == "cap" else c["clave"][1]),
        ]
        if resumen:
            cab.append("resumen: %s" % resumen)
        cab.append("---")
        cab.append("")
        ruta = os.path.join(args.salida, nombre(c["clave"], c["titulo"]))
        io.open(ruta, "w", encoding="utf-8", newline="\n").write("\n".join(cab + cuerpo) + "\n")
        hechos += 1
        print("  %-52s %5d palabras" % (nombre(c["clave"], c["titulo"]), palabras))

    print("")
    print("  %d capitulos · %s palabras · -> %s" % (hechos, "{:,}".format(total_pal), args.salida))
    print("  Las imagenes del PDF no se extraen: quedan marcadas como [imagen].")
    return 0


if __name__ == "__main__":
    sys.exit(main())