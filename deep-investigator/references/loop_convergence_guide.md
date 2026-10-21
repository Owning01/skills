# Protocolo de Convergencia, Desconocidos y Tolerancia a Fallos

Esta guía define las reglas de control para investigaciones complejas, asegurando que el proceso converja rápidamente sin bucles infinitos y manteniendo la máxima calidad técnica.

---

## 1. El Libro de Incógnitas (Unknowns Ledger)

Durante la fase de exploración o la primera pasada del `fact-checker`, surgirán preguntas no resueltas. El orquestador debe llevar internamente un registro estructurado:

```markdown
- [ ] [INCÓGNITA 1]: ¿Soporta la versión v3.x ejecución nativa en Windows sin WSL?
  - Estado: Pendiente de verificación en issues de GitHub.
  - Resolución: Verificado en commit #abc12 - Se agregó soporte nativo en v3.2.0.
```

Una investigación no se considera terminada hasta que las incógnitas críticas estén resueltas o marcadas explícitamente como limitaciones no documentadas.

---

## 2. Bucle Adversarial de Convergencia (Máximo 2 Rondas)

```
[Ronda 1]
  Exploración ──► fact-checker + solution-architect
       │
       ▼
  ¿El fact-checker refutó la premisa principal o detectó un blocker crítico?
       ├── NO (Válido) ──► Finalizar y redactar informe con solución.
       └── SÍ (Bloqueante detectado)
             ▼
[Ronda 2: Re-enfoque Focalizado]
  Búsqueda correctiva de alternativas ──► Re-evaluación rápida ──► Convergencia forzada.
```

> **Regla de Parada:** El ciclo de investigación nunca debe superar 2 rondas de consulta para evitar latencia excesiva y saturación de contexto. En la segunda ronda, si persiste la ambigüedad, se expone con transparencia el dilema al usuario.

---

## 3. Protocolo de Degradación Elegante (Fault Tolerance)

Si ocurre un fallo en una herramienta o subagente:
1. **Fallo en invocación de subagente:**
   - Si la llamada remota/asíncrona devuelve error o agota el tiempo, el orquestador asume temporalmente la perspectiva de ese rol usando la plantilla correspondiente y registra: `[Aviso: Análisis de auditoría ejecutado directamente por degradación de servicio]`.
2. **Bloqueo irreversible de página web:**
   - Si tras el intento HTTP y el fallback de interfaz la página sigue inaccesible, buscar la información en repositorios espejo, cachés públicas o issues relacionados en lugar de insistir en la misma URL.

---

## 4. Puerta de Calidad Pre-Entrega (Pre-Flight Gate)

Antes de presentar la respuesta al usuario, el orquestador debe verificar internamente:

- [ ] **Cero código incompleto:** No hay comentarios de relleno (`// TODO: implementar lógica aquí`), imports faltantes o funciones a medio escribir.
- [ ] **Comandos probados:** Las instrucciones de instalación y ejecución especifican paquetes y comandos reales.
- [ ] **Evidencia contrastada:** Los pros y contras están fundamentados en métricas reales o documentación técnica verificada, no en suposiciones.
- [ ] **Enlaces canónicos:** Se proveen enlaces directos a los repositorios o especificaciones oficiales.
