# CAFE v6 — Corrección de escala y recuperación de SurveyJS

## Problema observado en GitHub Pages con la v5
Al mostrar la evaluación, aparecía la fotografía a la izquierda pero no las cinco preguntas de SurveyJS. Las versiones v4 y v5 alteraban el contenido de `survey_json`, agregando una sexta pregunta HTML para la fotografía y retirando el `ImageComponent` original. En v5 además se aplicaban reglas CSS amplias a la cadena de ancestros de SurveyJS. Con el complemento real de ExpBuilder estas modificaciones no produjeron el resultado previsto.

## Estrategia v6 (cambios de presentación únicamente)
- `prepareStimuli` **no elimina ImageComponent, no altera `survey_json` y no agrega preguntas**. Solo conserva la ruta original en `row.cafe_stimulus`, utilizada por el interruptor de tres ítems y el campo `cafe_imagen` existente en el JS.
- Cuando se presenta `practice` o `experiment`, se crea un panel fijo de fotografía + cuestionario. El **SurveyJS original, con sus propios controles y manejadores**, se reubica visualmente dentro de la columna compacta. No se crea una encuesta independiente.
- La interfaz de ExpBuilder queda ocultada únicamente después de detectar y reubicar el cuestionario. Si SurveyJS no llega a renderizar, se restaura automáticamente la vista original después de 6 segundos en vez de dejar un panel vacío.
- En computador (>750 px): rostro a la izquierda, cuestionario a la derecha con desplazamiento. En móvil (<=750 px): rostro fijo arriba, cuestionario desplazable debajo. La fotografía conserva su proporción y no se recorta.
- `CAFE_MODO_PRUEBA = true` permanece en `index.html` (tres caras principales + tres ensayos originales de práctica).

## Qué NO cambia
- `experiment.js` **idéntico bit por bit a la v5**. No hace falta reemplazarlo en GitHub si ya publicaste la v5.
- Los 1192 estímulos principales, la práctica, las 5 preguntas originales, orden y valores de sus opciones y validaciones, aleatorización, ramificaciones, datos y tiempos.
- Firebase, IndexedDB, recuperación, guardado con `batchSize=1`, uso de `useIndexedDB=false` en Firebase, `apiData` y `apiDataComplete`.

## Archivos para instalar
El **parche** incluye tres archivos para reemplazar en la raíz de GitHub: `index.html`, `cafe-escalado.js` y `cafe-escalado.css`. `index.html` carga `cafe-escalado.js?v=6` y `cafe-escalado.css?v=6` para evitar caché. Conservar `experiment.js` y `img/` sin cambios.

## Diagnóstico en la consola de Chrome
Al llegar a una fotografía, ejecutar:

```js
window.CAFELayoutDiagnostics
```

Esperado: `version:"6.0"`, `currentTrial:"practice"` o `"experiment"`, `surveyFound:true`, `surveyVisible:true` y `originalQuestions` igual o superior a 5. En una sesión real pueden existir también elementos HTML internos en el DOM del formulario; comprobar que sean cinco preguntas respondibles.

## Pruebas locales efectuadas
- `node --check` y prueba VM del flujo con tres caras originales y cinco preguntas, guardado local, subida, fallo de red simulado, reanudación y nueva sesión.
- Chromium con estructura DOM que reproduce una pantalla ExpBuilder/SurveyJS: tamaños de 320, 375, 390, 768, 851, 1024 y 1366 px; cinco preguntas visibles; cara real con proporción correcta; sin desbordamiento horizontal; control de radio funcional; limpieza al avanzar de pantalla.
- **Pendiente**: probar con el complemento real de ExpBuilder + SurveyJS en GitHub Pages. No se ha podido descargar aquí esa dependencia externa, de modo que estas pruebas no equivalen a un ensayo de extremo a extremo.

## Problema independiente de guardado
En la v5 el servidor de ExpBuilder respondió `POST /apiData → HTTP 500` y también se observó una solicitud HTTP 401 de URL aún no confirmada. La v6 no modifica la API ni resuelve esos errores. `IndexedDB` conserva los ensayos sin confirmación remota, pero **Google Drive no debe considerarse actualizado**.

Pedir al desarrollador revisar los logs de la Cloud Function `apiData` para el experimento `17e49b08-828f-4321-b62d-c040a5c1c3ea`. Antes de recolectar datos, verificar `window.CAFEBatchDiagnostics.apiConfirmed` y que `pendingRemote` se reduzca, además de revisar el CSV de Drive.

No borrar datos de IndexedDB ni los datos de navegación con sesiones incompletas; una copia privada se obtiene con `await window.CAFEBatchDiagnostics.exportarRespaldoLocal()`.

**Observación**: la captura de la incidencia muestra Chrome en modo incógnito. IndexedDB en una sesión de incógnito no ofrece recuperación una vez cerradas todas las ventanas de incógnito. Usar una ventana normal del mismo navegador al probar el regreso a la sesión.
