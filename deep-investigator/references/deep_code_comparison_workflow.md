# Flujo de Trabajo: Comparativa Profunda de Código entre Repositorios

Este protocolo guía al orquestador cuando el usuario desea auditar una función o módulo de su proyecto contrastándolo contra implementaciones de referencia de la industria.

---

## 📢 Regla de Transparencia Total: Avisar Cada Paso al Usuario

Al realizar descargas o inspecciones externas, el agente debe **comunicar proactivamente sus acciones de forma clara y concisa**:

1. **Antes de descargar:**  
   > *"He identificado 2 proyectos de referencia líderes para contrastar tu función `[nombre]`: `[repo1]` y `[repo2]`. Voy a realizar una clonación superficial (depth 1) en un directorio temporal aislado para analizar su implementación sin alterar tu proyecto."*
2. **Durante la extracción:**  
   > *"Extrayendo la definición, manejo de concurrencia y pruebas unitarias de `[nombre]` en los repositorios de referencia..."*
3. **Al finalizar la auditoría:**  
   > *"Limpiando los archivos temporales y generando el informe comparativo visual..."*

---

## 🛠️ Herramienta de Inspección Rápida

Utiliza el script auxiliar [`scripts/inspect_reference_repo.py`](../scripts/inspect_reference_repo.py) para clonar de forma superficial e inspeccionar funciones sin saturar el entorno:

```bash
# Ejemplo: Clonar superficialmente e inspeccionar el símbolo 'debounce'
python scripts/inspect_reference_repo.py lodash/lodash --symbol debounce --filter "*.js" --cache-dir "%TEMP%/benchmarks" --clean
```

### Parámetros clave:
- `--symbol <nombre>`: Símbolo, método o función exacta a rastrear.
- `--filter <patrón>`: Limitar la búsqueda a extensiones relevantes (ej. `*.ts`, `*.py`, `*.dart`).
- `--cache-dir <ruta>`: Carpeta temporal aislada (preferiblemente en directorio temporal del sistema).
- `--clean`: Borra automáticamente el repositorio descargado al concluir la inspección.

---

## 🔬 Dimensiones de Evaluación Exhaustiva

Al analizar el código de los repositorios externos frente al del usuario, el panel debe auditar:

1. **Ergonomía de la Firma y Tipado:**  
   ¿Acepta genéricos? ¿Los parámetros opcionales tienen valores por defecto seguros? ¿Se tipan los errores de retorno?
2. **Ciclo de Vida de Recursos y Memoria:**  
   ¿Crea objetos en cada ejecución o reutiliza buffers? ¿Libera suscripciones, sockets o temporizadores?
3. **Manejo de Casos Borde (Edge Cases):**  
   ¿Qué ocurre ante entradas vacías, strings corruptos, valores negativos o desbordamientos?
4. **Seguridad Concurrente y Asincronía:**  
   ¿Es susceptible a condiciones de carrera (*race conditions*)? ¿Implementa cancelación cooperativa (`AbortSignal` / tokens de cancelación)?
5. **Estrategia de Pruebas Unitarias:**  
   ¿Cómo estructuran las aserciones y pruebas en el repositorio de referencia? ¿Qué casos límite testean?

---

## 🎨 Entrega Visual del Resultado

Presentar siempre los hallazgos utilizando la [Plantilla de Informe Comparativo](../templates/code_comparison_report.md), incluyendo:
- Diagrama Mermaid de flujo comparativo.
- Tabla comparativa multidimensional con puntajes objetivos.
- Diffs y fragmentos lado a lado.
- La versión definitiva adaptada al proyecto del usuario ("Gold Standard"), con código limpio y test unitario listo para ejecutar.
