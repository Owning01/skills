# Guía de Resiliencia y Fallback Anti-Bloqueo

Al realizar búsquedas o extraer contenido web durante la fase de exploración técnica, es común encontrar barreras de acceso:
- Códigos HTTP 403 Forbidden o 429 Too Many Requests.
- Desafíos Cloudflare / Turnstile / Captchas.
- Single Page Applications (SPA) con renderizado exclusivo en cliente que devuelven HTML vacío al cliente HTTP estándar.
- Restricciones CORS en llamadas desde scripts.

---

## Árbol de Decisión de Extracción

```
Intento 1: HTTP directo (read_url_content / curl)
  ├── ¿Respuesta 200 OK con texto útil? ──► Continuar análisis
  └── ¿Error 403, 429, Captcha o HTML vacío?
        └── Intento 2: Acceso vía Navegador / Automatización de Entorno
```

---

## Procedimiento de Fallback en el Navegador

1. **Apertura de la URL en navegador:**
   - Si se dispone de herramientas de navegador o automatización de interfaz (`computer-use` / herramientas de browser), navegar a la URL objetivo en una ventana de navegador real.

2. **Resolución de barreras:**
   - Si se detecta un desafío de interacción o verificación de bot:
     - Realizar captura de pantalla para inspeccionar el estado actual (`computer_screenshot`).
     - Interactuar con los controles visuales correspondientes (`computer_click`, `computer_key`).
     - Aguardar a que el DOM o la página se estabilicen tras el desafío.

3. **Extracción del contenido:**
   - Seleccionar y copiar el contenido textual al portapapeles o extraerlo desde la consola/DOM.
   - Devolver el contenido limpio a la fase de análisis sin bloquear el flujo global.
