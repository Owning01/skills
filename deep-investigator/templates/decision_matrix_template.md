# Plantilla: Matriz de Decisión Técnica Ponderada

Usa este formato al comparar alternativas tecnológicas, bibliotecas o enfoques arquitectónicos:

```markdown
## ⚖️ Matriz de Decisión Comparativa

| Criterio de Evaluación | Ponderación | [Opción A: Nombre] | [Opción B: Nombre] | [Opción C: Custom / Alternativa] |
| :--------------------- | :---------: | :----------------: | :----------------: | :------------------------------: |
| **Rendimiento / Latencia** | Alta | ⭐⭐⭐⭐ (X ms) | ⭐⭐⭐ (Y ms) | ⭐⭐⭐⭐⭐ (Optimizado) |
| **Facilidad de Adopción** | Media | ⭐⭐⭐⭐⭐ (Plug & play) | ⭐⭐⭐ (Curva media) | ⭐ (Desarrollo propio) |
| **Madurez & Mantenimiento** | Alta | ⭐⭐⭐⭐⭐ (Activo, v5+) | ⭐⭐ (Poco activo) | ⭐⭐⭐ (Depende del equipo) |
| **Compatibilidad Multiplataforma** | Crítica | ✅ Win / Linux / Mac | ⚠️ Limitado en Windows | ✅ Control total |
| **Riesgo de Ruptura (Breaking)** | Media | Bajo (SemVer estricto) | Alto (Inestable) | Cero externo |
| **Puntaje Ponderado Total** | -- | **8.8 / 10** (Recomendado) | 6.2 / 10 | 7.0 / 10 |

### 🏆 Veredicto de la Matriz:
- **Opción elegida:** [Opción A]
- **Justificación técnica:** Equilibrio óptimo entre madurez de ecosistema y bajo costo de mantenimiento.
- **Condición de revocación:** Si el caso de uso requiere latencia sub-milisegundo estricta, pivotar hacia [Opción C].
```
