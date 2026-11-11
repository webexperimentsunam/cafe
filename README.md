# CAFE v11.1 — aviso de metadatos jsPsych

Este parche se aplica sobre **CAFE v11**. Corrige la advertencia de consola `cafe-native-bienvenida is missing the data field`.

## Cambios

- `cafe-nativo.js`: añade `data` a `static info` para los nueve plugins nativos de CAFE, describiendo `rt` y, según el ensayo, `response`, `SurveyComponent_1_response`, `cafe_imagen` y `cafe_orden_emociones`.
- `index.html`: actualiza únicamente la referencia de `cafe-nativo.js?v=11.1` para evitar la caché.
- `CAFENativeDiagnostics.version` y metadatos de plugin pasan a 11.1.

## Instalación

Sube únicamente `index.html` y `cafe-nativo.js` a la raíz del repositorio GitHub, sustituyendo los existentes. **No reemplaces `experiment.js`, `cafe-nativo.css` ni las fotografías.**

## Alcance

No se alteran ninguna pregunta, respuestas, escalas, estímulos, orden de emociones, ensayos, aleatorización, controles del formulario, IndexedDB, Firebase, API ni Google Drive. `data` es la declaración de los tipos de campos que produce el plugin; el registro efectivo enviado mediante `finishTrial` queda intacto.

## Pendiente: 401 / 500

El servidor `https://us-central1-test-e4cf9.cloudfunctions.net/apiData` ha respondido con errores HTTP 401 y 500. Este parche **no corrige** esos errores. En DevTools, pestaña Network, selecciona el registro fallido para verificar el método (POST), la URL, y `Response` (sin compartir nombres, datos del participante, tokens, cookies ni información privada). `CAFEBatchDiagnostics` permite inspeccionar `lastHttpStatus` y `pendingRemote`. No se debe dar por confirmado el guardado remoto sin un `apiConfirmed` mayor que cero y el CSV comprobado en Drive.
