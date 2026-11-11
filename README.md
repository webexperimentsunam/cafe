# CAFE v10 — Escalado integral mediante plugins jsPsych nativos

**Cambio de enfoque:** igual que en Juicios Morales, las pantallas de CAFE se construyen una sola vez mediante plugins nativos de jsPsych, usando las definiciones originales de ExpBuilder. Ya no se intentan mover o copiar elementos que ExpBuilder ha colocado con coordenadas fijas en el DOM.

## Archivos que se actualizan en GitHub

1. `index.html` — carga los dos módulos v10 y conserva el interruptor de prueba de tres imágenes.
2. `experiment.js` — **única línea nueva** antes de `ExpBuilderNavigation.attach(jsPsych, timeline)` para instalar el renderizador nativo. No se modificaron los estímulos, saltos, orden, backend, Firebase, IndexedDB ni la lógica de recuperación.
3. `cafe-nativo.js` — renderizador único para nueve tipos de ensayo, con formularios HTML nativos generados a partir del JSON de SurveyJS.
4. `cafe-nativo.css` — estilos adaptables para toda la tarea.

Se pueden dejar `cafe-escalado.js` y `cafe-escalado.css` en el repositorio: esta versión ya **no los carga**. No es necesario volver a subir las imágenes.

## Estructura de las pantallas

- Bienvenida, consentimiento, instrucciones, transición y final: tarjetas con dimensiones fluidas, texto legible, desplazamiento vertical y botones originales en contenido y respuesta (mismas etiquetas y variables del JSON de ExpBuilder).
- Sociodemográficos: 14 preguntas de la exportación, usando sus mismos tipos (texto, selección simple y desplegable) y opciones.
- Práctica y tarea principal: **un ensayo = una imagen original + las cinco preguntas originales**. No se crea ninguna segunda imagen, no se trasladan ni clonan nodos de ExpBuilder.
- Las cuatro escalas de siete valores aparecen en **una sola fila horizontal**, sin saltos de línea. Se exige contestar todas las preguntas obligatorias para avanzar.
- En escritorio, fotografía a la izquierda con posición `sticky` y cuestionario compacto a la derecha. En móvil, fotografía arriba con `sticky` y preguntas debajo. Se eliminó la leyenda “Rostro a evaluar”.
- Se conserva `cafe_imagen`, `ImageComponent_1_stimulus`, `SurveyComponent_1_response`, `SurveyComponent_1_type` y nombres de preguntas como `question1`…`question5`.
- El diseño se reconstruye una sola vez por ensayo y no crea pantallas adicionales ni botones repetidos.

## Configuración de pruebas

En `index.html`:

```js
window.CAFE_MODO_PRUEBA = true; // Tres imágenes principales + tres de práctica
// false para el experimento completo con los 1,192 estímulos principales.
```

## Alcance de la verificación

- `node --check` para ambos archivos JavaScript: correcto.
- Pruebas con DOM simulado sobre los **nueve tipos** de pantalla: campos de consentimiento, 14 preguntas demográficas, cuatro escalas de siete opciones, quinto reactivo de emoción, identificación de imagen y esquema de respuestas.
- Comparación byte a byte: todas las imágenes del ZIP v9 son idénticas.
- Comparación de `experiment.js` respecto de v9: **se añadió una sola línea** para instalar el plugin, sin modificar la lógica de guardado, reanudación ni las 1,192 filas del experimento.
- Limitación: en esta sesión el navegador automatizado bloqueó las páginas locales. Estas son verificaciones de código/DOM simulado, **no** una prueba visual de ejecución con el plugin real de GitHub Pages.

## Comprobaciones al publicar

1. Recargar con Ctrl+Shift+R; confirmar que `window.CAFENativeDiagnostics.version` sea `"10.0"`.
2. Comprobar bienvenida, consentimiento e instrucciones en ancho de 320 px; solo una pantalla y controles legibles.
3. Completar demográficos; comprobar que ninguna pregunta se recorte.
4. En práctica, verificar **una** foto con **cinco** preguntas, las cuatro filas de 1 a 7, una única foto visible mientras se desplaza el cuestionario. Repetir en escritorio.
5. Contestar las 3 imágenes principales del modo prueba; comprobar que `cafe_imagen` corresponda a la foto presentada, sin ensayos duplicados.
6. Revisar consola: `window.CAFENativeDiagnostics` y `window.CAFEBatchDiagnostics`.

**Advertencia de guardado:** el servidor `apiData` devolvía HTTP 401/500 en versiones anteriores. La v10 **no altera ni resuelve** la API. No considerar confirmado el guardado remoto ni utilizar con participantes mientras la API siga fallando; IndexedDB local no equivale a Google Drive.

**Observación preexistente:** la definición demográfica exportada tiene dos preguntas distintas llamadas `question8`. La v10 mantiene la definición y las presenta, pero como ambas comparten clave, las exportaciones pueden contener una única respuesta `question8`. Conviene revisar por separado antes del estudio definitivo.
