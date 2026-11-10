# CAFE v4 — escalado adaptable para imagen y SurveyJS

**Base:** CAFE v3 (parche de guardado incremental + reanudación). No se reemplaza la lógica del servidor ni el experimento exportado.

## Diagnóstico

Los ensayos `practice` y `experiment` exportados de ExpBuilder ubican la fotografía mediante un `ImageComponent` con coordenadas absolutas y el cuestionario mediante `SurveyComponent` con otra posición. Como sus cajas no se redimensionan juntas, la fotografía se superpone al título del cuestionario en determinados tamaños de ventana (captura del investigador en escritorio).

## Solución implementada

- En el momento de construir el experimento, `CAFEResponsive.prepareStimuli()` toma la **misma ruta de imagen** de la fila de estímulos y la representa como un bloque HTML sin respuesta dentro de la **primera página del mismo SurveyJS**, justo después del título de la encuesta y antes de sus cinco preguntas.
- Se omite visualmente el `ImageComponent` absoluto anterior, para evitar dos imágenes o un solapamiento. El archivo original se preserva como `cafe_stimulus` en la fila y se copia al CSV como `cafe_imagen`.
- No se alteran las preguntas `question1` a `question5`, escalas de 1 a 7, categorías, respuestas obligatorias, variable `SurveyComponent_1_response`, orden de ítems, ramificación ni aleatorización.
- El CSS `cafe-escalado.css` fija un tamaño fluido de la imagen (máximo 245 px en escritorio y ~150-210 px en móvil), evita desbordamientos y limita el ancho de las tarjetas SurveyJS.
- La actualización solo afecta el **diseño de las pantallas de fotografía + encuesta**. No rediseña consentimiento, introducción o datos demográficos. El interruptor `window.CAFE_MODO_PRUEBA` sigue en `index.html`.
- La lógica de guardado de la v3 no cambia: `batchSize=1`, IndexedDB local activado, `useIndexedDB=false` informado a Firebase, `resumeTimeoutMinutes=1`, elección reanudar/reiniciar, `apiDataComplete` al finalizar.

## Archivos

El parche para GitHub contiene `index.html`, `experiment.js`, `cafe-escalado.js`, `cafe-escalado.css`, `README.md`. **Sube los cuatro archivos de ejecución a la raíz** del repositorio `cafe`, reemplazando los dos originales. Los archivos `.jpg`, `.png` y `img/` no se modifican.

`index.html` carga `cafe-escalado.css?v=4`, `cafe-escalado.js?v=4` y `experiment.js?v=4` para evitar usar las copias de caché de la v3.

**Importante:** si la versión v3 ya tiene sesiones incompletas, conserva una copia antes de actualizar y prueba el mecanismo de reanudación con una sesión de prueba. No borres los datos locales de los participantes.

## Diagnóstico en la consola

```js
window.CAFELayoutDiagnostics
window.CAFEBatchDiagnostics
```

Al iniciar los bucles, `CAFELayoutDiagnostics` mostrará la cantidad de estímulos preparados en cada etapa: práctica (3), principal (1192). Estos números indican las filas configuradas, no necesariamente las que se muestran durante el modo de prueba.

## Pruebas realizadas

1. Sintaxis JavaScript de las dos bibliotecas y del `experiment.js` generado.
2. Comparación de los **1195 estímulos originales** (3 de práctica + 1192 principales): todas las rutas de imagen correctas, una imagen en el cuestionario, y las cinco preguntas originales, sus valores y configuraciones sin cambios.
3. Pruebas de integración simuladas de la v3: envíos por ensayo, fallos de red, IndexedDB, reanudación, sesión nueva y `apiDataComplete`; incluye `cafe_imagen` en el formato anterior y en el formato visual adaptado.

**No se pudo comprobar en este contenedor la presentación real del plugin visual ExpBuilder** ni Firebase/Drive reales. Validar en GitHub Pages a 320, 390, 768 y 1366 px antes de usar con participantes.

## Prueba después de publicar

1. Con `window.CAFE_MODO_PRUEBA = true`, abrir `https://webexperimentsunam.github.io/cafe/` con recarga fuerte.
2. En práctica y tarea principal, comprobar que aparece **título → imagen → cinco preguntas**, sin fotografía sobre texto, y que no hay desplazamiento horizontal.
3. Contestar las preguntas, verificar que la variable `SurveyComponent_1_response` conserva `question1`…`question5` y que `cafe_imagen` contiene la ruta correcta.
4. Probar en celular y luego cerrar, reanudar y finalizar: el CSV debe corresponder a la misma imagen y los mismos cinco valores.
5. Si alguna pantalla presenta desplazamientos o la encuesta no se puede enviar, revertir los cuatro archivos del parche y conservar la v3 hasta revisar la captura del navegador.
