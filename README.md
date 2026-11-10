# CAFE — GitHub Pages: guardado incremental y reanudación (v3)

## Objetivo

Esta actualización parte exactamente del paquete **CAFE_GitHub_completo_prueba_3_items.zip**, que ya se ejecutó en GitHub Pages, y aplica las soluciones de almacenamiento y recuperación probadas en Juicios Morales. **No se modificaron las pantallas ni las variables de ExpBuilder, las imágenes, los cuestionarios SurveyJS, las ramas ni la aleatorización.** Se conserva el identificador del proyecto `17e49b08-828f-4321-b62d-c040a5c1c3ea` y los nombres de sesión de CAFE (`contador_CAFE_fecha`).

## Interruptor de prueba

La configuración sigue **en `index.html`**, sin parámetros en la dirección web:

```javascript
window.CAFE_MODO_PRUEBA = true; // 3 ítems principales, más 3 de práctica
// window.CAFE_MODO_PRUEBA = false; // 1,192 ítems principales, más 3 de práctica
```

No cambies el interruptor durante una sesión de prueba sin terminar; cambiaría el conjunto de estímulos. Si la configuración cambia, el parche obliga a iniciar una participación nueva al regresar.

## Cambios de almacenamiento

- `batchSize = 1`: cada evento de jsPsych se envía como un registro individual mediante `apiData`, sin concatenar varios ensayos en un documento.
- **IndexedDB local activado** para conservar todas las respuestas de la sesión (incluso las ya confirmadas por el servidor), y para intentar de nuevo las que quedaron sin confirmar.
- **Metadatos de Firebase: `useIndexedDB = false`**, como solución temporal para permitir que el backend de ExpBuilder consolide CSV parciales al desconectarse (comportamiento observado en Juicios Morales).
- `resumeTimeoutMinutes = 1`: valor de la sesión en Firebase. No es el límite de recuperación de IndexedDB del navegador.
- Al ingresar otra vez desde el mismo navegador, aparece una elección: **Continuar donde me quedé** o **Empezar desde el principio**. La segunda crea una identidad nueva sin borrar indiscriminadamente los registros locales de otras sesiones.
- La recuperación conserva la navegación generada por ExpBuilder, que registra la posición y el orden aleatorio del bucle. Esa navegación se probó en forma simulada con el código actual; la reproducción visual real debe probarse en el sitio publicado.
- Al finalizar, primero se confirman los envíos pendientes, luego se manda el conjunto completo mediante `apiDataComplete`, se marca `completed` en Firebase y, solo entonces, se borra de IndexedDB la sesión terminada.
- Se conservaron los tokens de nombre de CAFE y se evita renombrar con fecha nueva una sesión reanudada.

## Imagen y encuesta en un mismo ensayo

Las filas originales de `practice` y `experiment` contienen **un `ImageComponent` y un `SurveyComponent` asociados**. No se separaron ni se cambiaron su contenido, la lógica de presentación, el orden de preguntas, el número de respuestas obligatorias, el tamaño ni la posición.

En cada registro de ensayo se añade `cafe_imagen` con la ruta del estímulo cuando está disponible, además de los campos ya generados por SurveyJS. Se añaden `clientTrialKey` y `cafe_modo_prueba` para verificar duplicados y distinguir muestras de prueba de datos definitivos. La imagen es una **ruta**, no la fotografía codificada dentro del CSV.

## Instalación en GitHub

Si el proyecto CAFE ya está publicado, instala únicamente **`index.html` y `experiment.js`** del ZIP de parche, sustituyendo esos dos archivos en la raíz de `main`. Los archivos `.jpg` y `.png` se mantienen sin cambios y no necesitan subirse otra vez. **Conserva una copia del proyecto que funciona actualmente.** El código del HTML ahora importa `experiment.js?v=3` para evitar la caché anterior.

Si todavía necesitas la estructura completa, usa el ZIP completo: contiene los mismos ocho recursos de imagen disponibles originalmente; **no contiene los 1,188 estímulos que se habían omitido deliberadamente** por el tamaño de la exportación. Debes subir las imágenes restantes al repositorio antes de pasar a la prueba completa.

## Diagnóstico

En la consola de Chrome (`F12`):

```javascript
window.CAFEBatchDiagnostics
```

Valores esperados:

- `batchSize: 1`
- `useIndexedDB: true` (copia local)
- `firebaseSessionUseIndexedDB: false` (metadatos del servidor)
- `resumeTimeoutMinutes: 1`
- `apiConfirmed`: cantidad de filas confirmadas mediante `apiData` en la ejecución del navegador actual
- `pendingRemote`: filas de la sesión actual que todavía no tienen confirmación
- `lastRemoteAck`, `lastError`, `sessionId`, `resumedSession`, `freshChoice`.

## Prueba manual importante después de publicar

1. En un navegador normal (no incógnito), hacer bienvenida, consentimiento y datos demográficos.
2. Completar la primera fotografía principal, respondiendo **todas** las preguntas del mismo `SurveyComponent`. Verificar `apiConfirmed` y `pendingRemote`.
3. Cerrar la pestaña. Tras la detección de desconexión, comprobar el archivo parcial en Drive.
4. Abrir de nuevo la misma URL y pulsar **Continuar donde me quedé**. Verificar que no se mezclan la fotografía y sus respuestas, y que el siguiente estímulo corresponde al orden guardado.
5. Volver a cerrar y entrar otra vez; seleccionar **Empezar desde el principio**. Comprobar que obtiene otro `sessionId` y se conserva la sesión parcial anterior.
6. Realizar los tres ítems principales y terminar con **Finalizar**. Verificar archivo completo, identificador de imagen `cafe_imagen`, todas las respuestas `SurveyComponent_1_response`, sin duplicaciones de `clientTrialKey` ni de ensayos.
7. Repetir en celular y comprobar también los diseños de la imagen y la encuesta; **este parche no altera la presentación visual de ExpBuilder**.
8. Finalmente probar recuperación prolongada (por ejemplo, 24 horas) y luego la ejecución con los 1,192 estímulos.

## Alcance de la validación

Se verificaron la sintaxis y la identidad byte a byte de los dos conjuntos completos de estímulos y sus componentes SurveyJS con respecto al paquete anterior. Se ejecutó una prueba automatizada **con Firebase/Google Drive simulados**: fallo de red, conservación en IndexedDB, reanudación y reenvío de un ensayo completo de imagen+encuesta, comenzar desde cero sin borrar otra sesión y finalización correcta con `apiDataComplete`. 

**No se ha verificado la publicación de esta nueva versión ni la creación/actualización real del CSV en Drive.** La compatibilidad del backend con este parche debe validarse en GitHub Pages antes de utilizarlo con participantes reales. No usar los CSV de prueba como datos definitivos.
