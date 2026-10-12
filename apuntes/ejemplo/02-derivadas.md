---
titulo: Derivadas y la regla de la cadena
tab: MAT
tema: Matemáticas
resumen: Derivar una compuesta es derivar por partes y multiplicar. No hay misterio.
bajada: Por qué √(x²) no es x.
---

Derivar es medir **cuánto responde una cosa cuando la otra se mueve**. Todo lo
demás son problemas de encadenar esos movimientos.

## La regla, en una linea

```cálculo
d/dx [ f(g(x)) ]  =  f'(g(x)) · g'(x)

  √( x² )          =  ( x² )^(1/2)
  d/dx ( x² )^(1/2) =  (1/2) · (x²)^(-1/2) · 2x
                    =  x / √(x²)
```

> OJO: el ultimo paso vale **solo para x ≥ 0**. Para x negativo, √(x²) = |x| y
> la derivada es -1, no +1. Por eso √(x²) **no** simplifica a x: por eso
> escribir x es una perdida de informacion, no una simplificacion.

## Los atajos que hay que saber

| Atajo | Se usa cuando | Ejemplo |
| :--- | :--- | :--- |
| Constante | el factor no depende de x | d/dx (5x³) = 5 · 3x² |
| Potencia | x^n con n entero | d/dx x⁵ = 5x⁴ |
| Cadena | hay una compuesta | d/dx sin(3x) = 3cos(3x) |
| Producto | dos cosas variables | d/dx (x·sin x) = sin x + x·cos x |

> TIP: Antes de derivar, preguntate **de que variable** estas derivenando. El 90%
> de los errores no son de álgebra, son de haber derivado respecto de la variable
> equivocada en un enunciado que tiene tres letras.

## La trampa del valor absoluto

1. paso: Escribi la potencia: `|x| = (x²)^(1/2)` solo para x ≥ 0.
2. paso: Para x < 0, `|x| = -x`, así que la misma potencia necesita el signo cambiado.
3. paso: Comprobá en un punto: `d/dx|x|` en `x = -3` da **-1**.

```cálculo
f(x) = |x|

  x > 0:  f = x      →  f' = 1
  x < 0:  f = -x     →  f' = -1
  x = 0:  no existe derivada (es un pico)
```

> resumen: Si te piden la derivada en el punto de quiebre, no existe. Si no lo
> piden, esperate que alguien lo pregunte.

---

El mismo tema en [_3Blue1Brown — cadena de derivación_](https://www.youtube.com/watch?v=R_5g6nTlrE0),
que explica el por que de la regla con el teorema de la cadena.