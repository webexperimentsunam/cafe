# CAFE v8 — Corrección de pantallas duplicadas

## Motivo de esta versión

En v7, las pantallas informativas se copiaban en un panel creado aparte y sus botones hacían clic en botones originales, mientras que en las evaluaciones se creaba una nueva imagen y se reubicaba el SurveyJS original. Dependiendo del momento en que ExpBuilder volvía a pintar el DOM, se podían mostrar **dos versiones de la misma pantalla** o **dos fotografías**.

## Cambios de v8

1. **Bienvenida, consentimiento, instrucciones, transición y despedida:** ya no se clona el contenido ni se crean botones sustitutos. Solo se aplican reglas CSS al DOM original de ExpBuilder; los controles originales mantienen sus eventos.
2. **Práctica y evaluación principal:** la interfaz móvil/escritorio usa el **`ImageComponent` original** y el **SurveyJS original**, moviendo sus nodos DOM al panel adaptable, y restaurándolos cuando inicia otro ensayo. No hay una segunda imagen añadida por la adaptación.
3. **Transiciones:** se ignoran los elementos preexistentes del ensayo anterior para no volver a capturar una imagen antigua mientras ExpBuilder termina el cambio de pantalla.
4. **Escala Likert:** se mantiene la regla de 7 respuestas en una sola fila, con fotografía visible durante la respuesta.
5. **El HTML usa** `cafe-escalado.css?v=8` y `cafe-escalado.js?v=8`, para evitar archivos de escalado almacenados en caché. **No se cambia `experiment.js?v=7`**, ni ningún componente de guardado.

## Instalación

Subir a la **raíz del repositorio de CAFE** y reemplazar solamente:

- `index.html`
- `cafe-escalado.js`
- `cafe-escalado.css`

**No reemplazar `experiment.js`, ni `img/`, ni ninguno de los JSON de estímulos.** La configuración de prueba continúa en `index.html` (`window.CAFE_MODO_PRUEBA = true`).

## Qué se verificó localmente

- Sintaxis JavaScript válida.
- `experiment.js` binariamente idéntico a v7. Por consiguiente no se modifica la definición del experimento ni el guardado.
- Prueba funcional con DOM simulado: en pantallas informativas no se crean copias; en la evaluación, el elemento `<img>` original y el SurveyJS con sus cinco preguntas se reubican y se restauran; se ignoran imágenes y encuestas de ensayos anteriores.

**Límite:** no fue posible ejecutar el complemento remoto real de ExpBuilder/SurveyJS en este entorno, por lo que aún se necesita comprobar el resultado publicado en GitHub Pages, especialmente el escalado de los textos informativos y el flujo completo. En caso de problemas, restaurar la copia de seguridad previa.

## Pasos para probar en GitHub Pages

1. Publicar el parche, recargar con `Ctrl+Shift+R` y abrir una **sesión de prueba nueva**. Para comprobar recuperación usar una ventana normal: el modo incógnito elimina IndexedDB al terminar la sesión privada.
2. Revisar bienvenida, consentimiento e instrucciones en computadora y celular. Debe aparecer **una sola pantalla** y funcionar un solo botón nativo por opción.
3. En práctica, confirmar **una sola fotografía y un solo cuestionario de cinco preguntas**. Deben verse la foto y las siete opciones Likert en una fila, también en móvil.
4. Pulsar «Completar» y confirmar que se presenta la **siguiente fotografía del ensayo siguiente**, no dos fotografías simultáneas ni una copia de la pantalla anterior.
5. En consola, comprobar `window.CAFELayoutDiagnostics`: `version:'8.0'`, `originalScreensCopied:0`, `originalImagesDuplicated:0`, `surveyFound:true`, `originalImageFound:true`, `originalQuestions:5` cuando ya se cargó la evaluación. Si no se consiguen estos valores, remitir la captura de consola.
6. Verificar de manera independiente el guardado en Drive. El error `POST /apiData` 500 y el 401 anterior **no quedan resueltos por este parche de presentación**.

No eliminar ni limpiar IndexedDB para actualizar la interfaz: las pruebas de reanudación dependen de esos datos locales.
