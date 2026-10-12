---
titulo: Cómo leer un paper sin perder el día
tab: MÉTODO
tema: Método
resumen: Abstract, figura 1, y buscar el error. En ese orden, y no de otra manera.
bajada: El orden importa: leer en crudo cuesta el quadruple de tiempo.
---

Un paper son 8 páginas de las cuales 1 es el abstract y 2 son figuras. Leerlas en
el orden del documento es la forma más lenta de entenderlo.

## El orden que funciona

1. paso: **Título y abstract.** 90 segundos. ¿Qué afirma? ¿Con qué método? Si el
   abstract no alcanza para eso, el paper es dudoso y no sigas todavia.
2. paso: **Figura 1 y la figura de resultados.** A veces el abstract no dice
   nada, pero el eje vertical del grafico lo dice todo.
3. paso: **Buscar el error.** Buscate en el texto: *limitation*, *we assume*,
   *future work*. El párrafo más útil del paper es el que el autor quiere que
   no leas.
4. paso: **Solo ahora, el cuerpo.** Leyendolo con la pregunta del paso 3 ya
   sabés que mirar.

> TIP: Si el abstract y la figura 1 no coinciden entre si, hay una de dos: el
> abstract esta exagerado (comun en workshop papers) o la figura es una figura
> decorativa que no representa el resultado principal. En los dos casos, desconfía.

> OJO: "State of the art" en el abstract no significa que lo sea. Buscá si el
> baselines es de 2023 o de la semana pasada. Comparar contra un método viejo
> es la forma más común de inflar un resultado.

## Las cinco preguntas

> definición: Las cinco preguntas
> Si después de leer el abstract no podes contestar esto, no entendiste el paper:
>
> 1. ¿Qué problema resuelve?
> 2. ¿Qué es nuevo **exactamente**? (no "aplicamos X a Y")
> 3. ¿Como lo evaluaron?
> 4. ¿Contra que lo compararon?
> 5. ¿Donde falla?

> MARGEN: Pregunta 4 es la qué se saltea todo el mundo. Si el paper no nombra
> un baseline, no hay comparación, solo una afirmación.

```cálculo
tiempo de leer en crudo    ≈  3 h 20 min
tiempo de leer con orden   ≈  45 min

  diferencia ≈ 4,4 veces
```

> resumen: No leas un paper de punta a punta salvo que sea la referencia. Y si es
> el reference, después releelo buscando el error.

---

Base: [_How to read a paper_](https://www.cs.cmu.edu/~sweiss/HowToReadAPaper.pdf),
de Steven Weiss. Sigue vigente: las comunidades cambiaron, el método no.