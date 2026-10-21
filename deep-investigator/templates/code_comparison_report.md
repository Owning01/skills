# Plantilla de Informe: Comparativa Profunda de Implementación de Código

Usa esta estructura para entregar el reporte comparativo más visual, claro y exhaustivo posible:

```markdown
# 🔬 Auditoría Comparativa de Implementación: `{{FUNCTION_OR_MODULE_NAME}}`

> **Resumen Ejecutivo:** Se ha comparado la implementación de `{{FUNCTION_OR_MODULE_NAME}}` de tu proyecto frente a repositorios de referencia de la industria (`{{REPO_REF_1}}` y `{{REPO_REF_2}}`).
> **Veredicto Rápido:** {{ONE_LINE_VERDICT}}

---

## 🗺️ Flujo de Ejecución Comparado

```mermaid
flowchart TD
    subgraph Tu Proyecto
        A1["Entrada de Datos"] --> B1["Procesamiento Actual"]
        B1 --> C1["Retorno (Sin reintentos / Sin validación estricta)"]
    end

    subgraph Referencia 1: {{REPO_REF_1}}
        A2["Entrada de Datos"] --> B2["Sanitización & Validación de Tipos"]
        B2 --> C2["Manejo Concurrente / Cola"]
        C2 --> D2["Retorno Blindado + Telemetría"]
    end
```

---

## 📊 Matriz Comparativa Exhaustiva

| Dimensión Técnica | Tu Implementación Actual | Referencia 1: `{{REPO_REF_1}}` | Referencia 2: `{{REPO_REF_2}}` |
| :---------------- | :----------------------- | :----------------------------- | :----------------------------- |
| **Firma & Tipado** | `{{SIGNATURE_USER}}` | `{{SIGNATURE_REF_1}}` | `{{SIGNATURE_REF_2}}` |
| **Complejidad Temporal** | $O(n)$ | $O(1)$ amortizado | $O(\log n)$ |
| **Consumo de Memoria** | Reasigna buffers en cada llamada | Reutiliza pool de objetos | Sin asignación extra |
| **Manejo de Errores** | Excepción no controlada | Fallback con error tipado | Estrategia de reintentos |
| **Casos Borde Cubiertos**| 2 de 5 detectados | 5 de 5 (Null, Timeout, Concurrencia)| 4 de 5 |
| **Dependencias Externas**| Ninguna | 1 micro-librería | 0 dependencias |
| **Score Global** | 🟡 **6.0 / 10** | 🟢 **9.5 / 10** (Líder) | 🟢 **8.8 / 10** |

---

## 🔍 Análisis de Código Lado a Lado

### 1. Tu Implementación Actual
```{{LANG}}
{{USER_CODE_SNIPPET}}
```

### 2. Cómo lo resuelve `{{REPO_REF_1}}` (Patrón de Excelencia)
```{{LANG}}
{{REF_1_CODE_SNIPPET}}
```
* **Por qué es superior:** {{KEY_LESSONS_FROM_REF_1}}

---

## ⚠️ Casos Borde y Puntos Ciegos Detectados
1. **Fuga de Memoria / Limpieza de Recursos:** En tu proyecto no se liberan los listeners/handles al cancelar.
2. **Concurrencia descontrolada:** Si se invocan 100 llamadas simultáneas, la función satura el pool.
3. **Manejo de Timeouts:** No existe interrupción por señal (AbortController / CancellationToken).

---

## 🚀 Implementación Definitiva ("Gold Standard" para tu Proyecto)

Esta versión integra lo mejor de los proyectos de referencia, adaptada a la estructura de tu proyecto:

```{{LANG}}
{{REFINED_GOLD_STANDARD_CODE}}
```

### 🧪 Prueba Unitaria Recomendada
```{{LANG}}
{{UNIT_TEST_EXAMPLE}}
```
```
