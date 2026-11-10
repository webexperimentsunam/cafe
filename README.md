# CAFE v5 — Cara visible + SurveyJS compacto y adaptable

## Origen
Partiendo de CAFE v4.1. Como referencia de escalado se revisó el experimento de Juicios Morales suministrado por el investigador. La adaptación para CAFE **no sustituye** SurveyJS: conserva sus cinco preguntas y sus eventos originales.

## Qué se corrigió
- **Todos los dispositivos:** evitar capas absolutas, anchuras fijas y desbordamiento horizontal del ensayo `practice` / `experiment`.
- **Computadora (>850px):** cara fija en un panel a la izquierda; cuestionario más estrecho a la derecha, con scroll independiente.
- **Móvil/tableta (<=850px):** cara fija arriba; cuestionario en un panel desplazable debajo. La cara no desaparece al avanzar por las cinco preguntas.
- Se conserva el formato de los botones de respuesta de SurveyJS y sus cinco preguntas originales.
- La cara sigue proveniendo de `cafe_stimulus`, que se guarda como `cafe_imagen` en el registro del ensayo.
- Los demás tipos de ensayo conservan su lógica original y solo reciben límites generales de anchura y ajustes de texto en móvil.

## Qué NO se cambió
- Orden de estímulos ni bucles, los 1,192 estímulos principales y tres de práctica, sus preguntas, escalas, condiciones y validaciones.
- `window.CAFE_MODO_PRUEBA = true` en index.html (3 principales + 3 de práctica). Cambiar a false cuando se autorice la recolección completa.
- Identificador del experimento, Firebase, IndexedDB local, `batchSize = 1`, configuración de guardado remoto (`useIndexedDB = false` en Firebase), reanudación y `apiDataComplete`.
- Las llamadas remotas `apiData` mantienen el mismo JSON. **No se corrigió un error de backend con modificaciones hipotéticas del payload.**

## Error 500 de apiData: importante
Se ha reportado HTTP 500 (Internal Server Error) de `https://us-central1-test-e4cf9.cloudfunctions.net/apiData`.
Este error indica fallo de la función remota: no es una confirmación de guardado en Drive. La v5 conserva los datos locales sin marcar ACK, permite reintento y expone información diagnóstica no sensible.

En consola:
```js
window.CAFEBatchDiagnostics
```
Campos relevantes: `lastHttpStatus`, `lastError`, `pendingRemote`, `apiConfirmed`, `lastRequestBytesApprox` y `lastAttemptedTrial`.

Para reintentar manualmente (cuando el servidor se haya reparado):
```js
await window.CAFEBatchDiagnostics.reintentar()
```

Para descargar un respaldo JSON de **la sesión activa**, sin borrar su copia local:
```js
await window.CAFEBatchDiagnostics.exportarRespaldoLocal()
```
**Atención:** contiene respuestas de participantes: protegerlo y no compartirlo en canales públicos.

Solicitar al desarrollador de ExpBuilder los logs de Cloud Functions de `apiData` para el experimento `17e49b08-828f-4321-b62d-c040a5c1c3ea`. Verificar permisos, destino Drive y manejo de los campos SurveyJS. El error 401 es una solicitud distinta: identificar primero su URL en Network. No borrar IndexedDB ni usar datos reales hasta recibir ACK del servidor.

## Instalación en GitHub Pages
Subir al repositorio cuatro archivos de la raíz:
- `index.html`
- `experiment.js`
- `cafe-escalado.js`
- `cafe-escalado.css`

No hace falta volver a subir `img/` si ya está disponible. Los nombres del script y CSS usan `?v=5` para evitar caché.

## Pruebas
1. Iniciar en dispositivo de 320, 375 o 390 px. Verificar que la cara permanezca visible mientras se desplazan las cinco preguntas; completar el cuestionario y avanzar.
2. Repetir en escritorio de 1024 px o más. Ver cara a la izquierda, cuestionario más estrecho a la derecha.
3. Confirmar fotografía correcta para cada ensayo y columnas de respuesta `question1` a `question5`.
4. Verificar que `CAFEBatchDiagnostics.apiConfirmed` aumente y `pendingRemote` baje a cero. Si vuelve HTTP 500, no asumir guardado remoto.
5. Probar abandono, reanudación y finalización únicamente después de confirmar el backend.

## Validación local realizada
- `node --check` de ambos JS.
- Pruebas VM simulando IndexedDB, Firebase y apiData: guardado por ensayo, reintento tras falla, asociación imagen + SurveyJS, reanudación y sesión nueva.
- Pruebas DOM y CSS en Chromium a 320, 375, 390, 768, 851, 1024 y 1366 px sin desbordamiento horizontal; imagen fija fuera del panel desplazable.
- El proyecto requiere prueba final en GitHub Pages con el componente real de ExpBuilder + SurveyJS y conexión remota.
