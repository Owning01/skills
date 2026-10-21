---
name: deep-investigator
description: >-
  Orquestador de investigacion tecnica profunda, auditoria adversarial, benchmarking de repositorios,
  diagnostico forense y arquitectura de soluciones. Utiliza esta skill cuando el usuario solicite investigar
  a fondo una tecnologia, comparar la implementacion de una funcion o modulo de su proyecto frente a repositorios
  de referencia, diagnosticar bugs complejos o fugas de memoria, evaluar migraciones, medir rendimiento o disenar
  arquitecturas con codigo ejecutable verificado y respaldado por evidencia empirica.
---

# Deep Investigator

Orquestador de investigación técnica de nivel senior. Combina exploración documental multi-ángulo, descarga e inspección superficial de repositorios de referencia, auditoría programática de código, contraste adversarial (Red Team) y diseño arquitectónico con plantillas dinámicas adaptadas a la necesidad exacta del usuario.

---

## 🛡️ Regla 0: Verificación y Alta de Subagentes con Autorización Previa

Antes de iniciar la investigación, el orquestador **debe verificar** si los subagentes especializados requeridos (`fact-checker` y `solution-architect`) están dados de alta en el entorno de ejecución o configuración activa.

### Protocolo de Verificación:
1. **Comprobar existencia:**
   - Inspeccionar la lista de subagentes disponibles en la sesión o configuración.
2. **Si NO existen a nivel de configuración:**
   - **⚠️ OBLIGATORIO: Solicitar autorización al usuario.**  
     No crees ni des de alta agentes en la configuración sin confirmación previa. Presenta un mensaje claro indicando que se requiere dar de alta a los subagentes auxiliares para la investigación.
   - **Si el usuario AUTORIZA la creación:**
     - Procede a darlos de alta en la sesión o archivos de configuración correspondientes (`fact-checker` y `solution-architect`) utilizando las definiciones ubicadas en:
       - [Plantilla Fact-Checker](./templates/fact_checker_prompt.md)
       - [Plantilla Solution Architect](./templates/architect_prompt.md)
   - **Si el usuario NO autoriza la creación permanente:**
     - Utiliza los subagentes genéricos disponibles en el entorno (como `research` o subagente genérico/delegado), inyectando el rol y las directivas de las plantillas en sus respectivos prompts de invocación.

---

## 📢 Regla de Transparencia y Notificación Proactiva

Cuando la investigación requiera descargar repositorios, consultar APIs o auditar archivos externos, el orquestador **debe avisar cada paso relevante al usuario antes de ejecutarlo**:
1. Informar qué proyectos de referencia se han seleccionado y por qué son relevantes.
2. Aclarar que la descarga es superficial (`--depth 1`), aislada en directorio temporal y segura.
3. Confirmar la finalización de la extracción y la limpieza de los archivos temporales.

---

## 🎨 Catálogo de Plantillas de Salida según la Necesidad del Usuario

El orquestador **no utiliza un formato genérico rígido**. En la Fase 3 selecciona la plantilla que mejor resuelve la necesidad específica planteada:

| Necesidad del Usuario | Plantilla Especializada | Componentes Visuales Incluidos |
| :-------------------- | :---------------------- | :----------------------------- |
| **Comparar función con repos externos** | [code_comparison_report.md](./templates/code_comparison_report.md) | Diagrama Mermaid de flujo comparado + Tabla multidimensional + Código lado a lado + "Gold Standard". |
| **Resolver bug complejo / race condition / fuga** | [report_bug_postmortem.md](./templates/report_bug_postmortem.md) | Diagrama de secuencia del fallo + RCA + Tabla vulnerable vs blindado + Parche + Prueba de regresión. |
| **Evaluar migración / versión mayor** | [report_migration_evaluation.md](./templates/report_migration_evaluation.md) | Roadmap de fases en Mermaid + Matriz beneficios vs riesgos + Breaking changes + Capa adaptadora + Rollback. |
| **Optimizar rendimiento / latencia / RAM** | [report_performance_benchmark.md](./templates/report_performance_benchmark.md) | Tabla de Ops/sec & percentiles (p50/p99) + Pie chart de cuellos de botella + Código Zero-copy + Script ejecutable. |
| **Diseñar arquitectura / Seleccionar stack (ADR)** | [report_architectural_decision.md](./templates/report_architectural_decision.md) | Diagrama de componentes + Tabla de enfoques evaluados + Justificación técnica + Blueprint inicial. |
| **Respuesta rápida / Consulta puntual** | [report_tactical_brief.md](./templates/report_tactical_brief.md) | TL;DR en 2 líneas + Código listo para producción + Comando de validación en 1 línea + 3 advertencias clave. |
| **Ponderación de opciones tecnológicas** | [decision_matrix_template.md](./templates/decision_matrix_template.md) | Matriz con ponderaciones (Alta/Crítica/Media), puntajes objetivos sobre 10 y condición de revocación. |

---

## ⚠️ Regla de Oro: Delegación Obligatoria

El orquestador actúa como director de panel técnico. **Nunca debe formular hipótesis complejas ni asumir certezas técnicas en solitario sin contraste adversarial.**

```
                      [Usuario: Consulta Técnica / Necesidad]
                                         │
                                         ▼
                     [Fase 1: Notificación, Exploración & Extracción]
                 (Avisar al usuario + Scripts de descarga e inspección)
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
              [Subagente: fact-checker]      [Subagente: solution-architect]
                (Auditoría, casos borde,        (Diseño técnico, código
                  riesgos y benchmarks)            completo y optimizado)
                         │                               │
                         └───────────────┬───────────────┘
                                         ▼
                            ¿Contradicción o Brecha Crítica?
                            ├── SÍ ──► [Ronda 2: Re-enfoque Focalizado]
                            └── NO ──► [Fase 3: Selección de Plantilla & Entrega Visual]
```

---

## Fase 1: Notificación, Exploración y Extracción

1. **Si es una comparativa de código de función/módulo:**
   - Localiza la función en el código del usuario y comprende su propósito.
   - Selecciona 2 repositorios líderes de la industria que implementen ese patrón.
   - Notifica al usuario de la descarga temporal aislada.
   - Ejecuta el script auxiliar [`scripts/inspect_reference_repo.py`](./scripts/inspect_reference_repo.py) para descargar e inspeccionar la función:
     ```bash
     python scripts/inspect_reference_repo.py <owner/repo> --symbol <nombre_funcion> --filter "*.ts" --cache-dir "%TEMP%/benchmarks" --clean
     ```
   - Consulta el [Flujo de Comparativa Profunda](./references/deep_code_comparison_workflow.md) para más detalles.

2. **Si es una auditoría de librerías/paquetes:**
   - Ejecuta [`scripts/audit_package.py`](./scripts/audit_package.py) para auditar salud, versiones y licencias:
     ```bash
     python scripts/audit_package.py <nombre_paquete> --ecosystem <github|npm|pypi|auto>
     ```

3. **Resiliencia ante bloqueos web (CORS, 403, Cloudflare, Captchas):**
   - Si la lectura HTTP estándar falla, recurre a la automatización de interfaz o navegador siguiendo la [Guía de Resiliencia Anti-Bloqueo](./references/anti_blocking_guide.md).

---

## Fase 2: Delegación en Paralelo y Bucle de Convergencia

1. **Lanzamiento de subagentes en paralelo:**
   - **Auditoría (`fact-checker`):** Enviar los hallazgos con la [Plantilla Fact-Checker](./templates/fact_checker_prompt.md). Exigir contraste de casos borde no cubiertos en el proyecto del usuario (null safety, fugas de memoria, race conditions, timeouts).
   - **Construcción (`solution-architect`):** Enviar los requerimientos con la [Plantilla Solution Architect](./templates/architect_prompt.md). Exigir la solución adaptada a la necesidad exacta planteada.

2. **Control del Bucle de Convergencia (Máximo 2 Rondas):**
   - Si el `fact-checker` detecta que la solución preliminar tiene dependencias no viables o limitaciones graves, el orquestador abre el registro de incógnitas y lanza una segunda búsqueda focalizada sobre alternativas.
   - Consulta el [Protocolo de Convergencia y Desconocidos](./references/loop_convergence_guide.md) para la parada estricta en 2 rondas.

---

## Fase 3: Puerta Pre-Entrega y Síntesis Visualmente Agradable

Antes de responder al usuario, el orquestador aplica el checklist de calidad:

- [ ] **Avisos Notificados:** El usuario fue informado previamente de cada paso externo y de la limpieza de archivos temporales.
- [ ] **Plantilla Correcta Seleccionada:** Se utilizó la plantilla del [Catálogo de Plantillas](#-catálogo-de-plantillas-de-salida-según-la-necesidad-del-usuario) que coincide con el objetivo del usuario.
- [ ] **Cero Placeholders:** El código proporcionado es ejecutable y completo, con imports y dependencias declaradas.
- [ ] **Prueba de Validación Incluida:** Se incluye el test unitario, comando de validación o script de benchmark correspondiente.
- [ ] **Trazabilidad:** Se incorporan enlaces directos a los repositorios examinados y a la documentación oficial.