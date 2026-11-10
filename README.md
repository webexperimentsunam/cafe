# CAFE v7 — Escalado integral y Likert de una fila

## Qué corrige
- **Todas las pantallas del experimento**, no solo las escalas: bienvenida, consentimiento, datos sociodemográficos, instrucciones, práctica, transición, evaluación principal y despedida.
- Las pantallas informativas conservan el contenido literal de ExpBuilder, pero lo presentan en un contenedor adaptable, sin coordenadas absolutas y sin los tamaños inline de 35–50 px que desbordaban el celular. Sus botones visuales invocan los **botones nativos** de ExpBuilder: no se modifican las decisiones ni los datos.
- Demográficos, práctica y evaluación principal reubican el **SurveyJS original** con sus validaciones y manejadores; no se crea ni se modifica ninguna pregunta.
- En computadora, fotografía fija a la izquierda y cuestionario a la derecha. En teléfono, fotografía fija arriba y preguntas debajo con desplazamiento independiente.
- Cada escala Likert con 7 valores se presenta en **una única fila horizontal**; los textos de anclaje quedan encima de los valores.
- Se eliminó «Rostro a evaluar». La fotografía mantiene su proporción sin recortarse.
- En pantallas informativas, los botones quedan en un pie estable, separado del texto desplazable.

## Qué permanece idéntico
- La exportación de ExpBuilder conserva sus 1192 estímulos principales, las tres prácticas, las cinco preguntas por rostro, las respuestas originales, validaciones, aleatorización, condiciones y tiempos.
- Interruptor `window.CAFE_MODO_PRUEBA = true` en `index.html` (3 rostros principales más las tres prácticas).
- El guardado, la recuperación, IndexedDB, Firebase, la API, `batchSize = 1`, y el campo `cafe_imagen` no se han modificado.
- La única modificación de `experiment.js` es pasar el objeto de ensayo a la función visual y, en caso necesario, consultar los componentes de la fila del timeline. La preparación y almacenamiento de datos son idénticos.

## Instalación en GitHub
1. Hacer copia de seguridad de los archivos de CAFE v6.
2. Sustituir **solo** `index.html`, `experiment.js`, `cafe-escalado.js` y `cafe-escalado.css` en la raíz del repositorio `webexperimentsunam/cafe`.
3. No reemplazar las imágenes ni los demás recursos. Las rutas son las mismas.
4. Esperar despliegue verde de GitHub Pages y recargar con `Ctrl+Shift+R` (no borrar IndexedDB ni datos del sitio).
5. En consola, `window.CAFELayoutDiagnostics` debe mostrar `version: "7.0"`; en consentimiento `infoReady: true`, en evaluación `surveyFound: true`, `surveyVisible: true` y `originalQuestions: 5`.

## Pruebas locales completadas
- `node --check` de JavaScript.
- VM del experimento: 3 estímulos originales con 5 preguntas, `batchSize=1`, IndexedDB, `useIndexedDB=false` para Firebase, recuperación, nueva sesión, envío y finalización con fallos simulados.
- 42 pruebas de Chromium de la interfaz (**6 tamaños: 320, 375, 390, 768, 1024, 1366 px** por **7 pantallas**): sin desbordamientos, botones nativos accionables, SurveyJS nativo conservado, Likert de una fila y fotografía visible durante scroll.
- Las pruebas visuales simularon el DOM de ExpBuilder/SurveyJS porque el complemento real depende de scripts externos no accesibles en este entorno. Se requiere confirmar la integración real desde GitHub Pages antes de recolectar respuestas.

## Problema de servidor independiente y pendiente
- Las solicitudes `POST https://us-central1-test-e4cf9.cloudfunctions.net/apiData` devolvieron **HTTP 500** y se observó también HTTP 401. El presente parche **no modifica ni corrige** esa función del servidor. Aunque el navegador conserve la cola en IndexedDB, **no equivale a guardado confirmado en Drive**.
- En modo normal (no incógnito), comprobar `window.CAFEBatchDiagnostics` y asegurar que `apiConfirmed` aumente y `pendingRemote` disminuya. Si se requiere, revisar logs de la Cloud Function `apiData` con el desarrollador antes de recolección.
- No borrar los datos del sitio para hacer pruebas de recuperación: se perdería el progreso local.
