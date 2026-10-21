# Rúbrica de Verificación Técnica (Anti-Alucinación y Calidad de Fuentes)

Esta rúbrica establece los estándares de calidad que deben regir la auditoría del `fact-checker` y la síntesis final del orquestador.

---

## 1. Jerarquía de Confiabilidad de Fuentes

1. **Nivel A (Máxima prioridad):**
   - Repositorio oficial de código fuente (commits recientes, issues activos, pull requests, releases oficiales).
   - Documentación canónica de la versión actual de la tecnología.
2. **Nivel B (Alta prioridad):**
   - Benchmarks reproducibles con metodología pública y código fuente auditable.
   - Especificaciones RFC, estándares W3C/ECMA y whitepapers técnicos.
3. **Nivel C (Informativo / Contraste):**
   - Hilos de discusión técnica de ingenieros en foros especializados, comunidades técnicas y StackOverflow.
4. **Nivel D (Baja confiabilidad / Requiere auditoría estricta):**
   - Artículos de marketing, posts promocionales de los creadores de una herramienta y notas de prensa.

---

## 2. Puntos de Auditoría Obligatorios

- **Frescura de la información:** Verificar si la solución hace referencia a APIs obsoletas o discontinuadas en las versiones vigentes.
- **Soporte de plataforma:** Verificar compatibilidad explícita con el sistema operativo objetivo, arquitecturas de CPU y runtimes requeridos.
- **Salud del ecosistema:** Número de mantenedores activos, tiempo promedio de respuesta a fallas de seguridad y dependencias críticas sin actualizar.
- **Evidencia empírica vs Suposición:** Toda afirmación de "10x más rápido" o "soporte ilimitado" debe estar respaldada por datos medibles y reproducibles.
