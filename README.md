# CAFE v11 — Demográficos y contrabalanceo de emociones

Base exacta: CAFE v10 (renderizador nativo de jsPsych). Esta versión no modifica `experiment.js`, imágenes, número de ensayos, prácticas, presentación de caras ni sistema Firebase/IndexedDB.

## Instalación en GitHub Pages

En el repositorio `webexperimentsunam/cafe`, reemplazar **SOLO**:

- `index.html`
- `cafe-nativo.js`
- `cafe-nativo.css`

**NO reemplazar `experiment.js`**, ni las imágenes. `index.html` carga ahora `cafe-nativo.js?v=11` y `cafe-nativo.css?v=11`; sigue cargando exactamente el mismo `experiment.js?v=10` (no modificado).

El interruptor sigue ubicado en `index.html`:

```js
window.CAFE_MODO_PRUEBA = true;  // tres ensayos principales + tres de práctica
```

## Cambios implementados

1. Cuestionario de datos generales: área de preguntas con su propio desplazamiento vertical. El encabezado y el botón **Continuar** permanecen visibles.
2. `question1`: selector nativo `type=date` con calendario; rechaza fechas posteriores al día actual. Mantiene la respuesta ISO `AAAA-MM-DD`.
3. `question5` — estado de nacimiento: desplegable con las **32 entidades federativas** (incluida Ciudad de México) y «No nací en México».
4. `question8` — entidad o país vivido entre 5 y 15 años: desplegable con las 32 entidades federativas y «Otro país». Conserva la clave `question8`, en vez de un radiogroup con 33 botones.
5. Lengua materna: la exportación de ExpBuilder trae por equivocación dos preguntas llamadas `question8`. Para evitar sobrescribir respuestas, la lengua materna ahora se guarda en `question8_lengua_materna`. Estado/país de infancia conserva `question8`. La definición original de ExpBuilder permanece sin alterar; la corrección se aplica al renderizado y al registro del cuestionario.
6. Reconocimiento de emociones: las **siete etiquetas originales** se presentan en orden diferente según el `sessionId`, pero *estable durante todos los ensayos de la misma sesión y al reanudarla*. La respuesta sigue siendo **una sola emoción**, con los valores originales. Cada registro de fotografía ahora incluye `cafe_orden_emociones` (arreglo serializado de etiquetas en el orden mostrado).
7. Primera escala de claridad en **práctica**: ahora es obligatoria, como las demás escalas. Su configuración original venía marcada como opcional.

**No se modifican** valores, textos ni claves de las preguntas de reconocimiento de las cinco respuestas `question1`…`question5`, ni la correspondencia foto-respuesta, ni la selección de tres estímulos de prueba. La pregunta emocional sigue siendo **selección única** deliberadamente, por validez de la clasificación de emoción dominante.

## Pruebas

- `node --check cafe-nativo.js`: correcto.
- Test DOM simulado de los 9 tipos de ensayo: correcto.
- Test Chromium **local** usando estilos y JS reales y los JSON de práctica y evaluación: seis resoluciones de datos generales (320, 375, 390, 768, 1024 y 1366 px) y cuatro resoluciones de reconocimiento (320, 390, 768 y 1366 px). Diez configuraciones verificadas: sin desbordamiento, cuestionario desplazable, botón accesible, fecha, 32 entidades, claves separadas y estabilidad de orden por sesión. Se usó un `sessionId` de prueba; no hubo conexión a Firebase en estas pruebas.
- Comparación SHA-256 de `experiment.js`: **idéntico a v10**.

## Pendientes externos

- **Guardar en Google Drive:** el `401/500` observado previamente en `apiData` NO ha sido corregido por este parche. IndexedDB no garantiza que la información haya llegado a Drive. Comprobar y resolver antes de reclutar participantes.
- **Texto del consentimiento:** la versión exportada contiene referencias a «palabras» y «evaluación afectiva de palabras», aunque CAFE muestra rostros. No se modificó automáticamente para no alterar unilateralmente el consentimiento; revisar y corregir según el protocolo aprobado.
- **Pregunta `question8` de infancia:** si se elige «Otro país», actualmente no se especifica el país. Agregar campo condicional si es relevante para el estudio.
- **Formato de respuesta emocional:** se conserva la selección única. Alternativa a discutir antes de recolectar: ofrecer «No logro identificar la emoción» como octava categoría para evitar asignaciones forzadas; cambiaría las distribuciones de reconocimiento, por lo que no se aplicó sin decisión metodológica.

## Consola

```js
window.CAFENativeDiagnostics
```

Debe indicar `version: "11.0"`. Durante una prueba de reconocimiento mostrará `emotionOptions` y `emotionSessionId`.
