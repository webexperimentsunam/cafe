# CAFE v9 — Restaurar pantallas visibles y evitar duplicaciones

Este parche corrige la regresión de v8 en la que la primera pantalla quedaba vacía. No cambia la definición del experimento ni el sistema de guardado.

## Qué se corrigió

- **Información (Bienvenida, Consentimiento, no_consent, Instructions, preparation y Ending).** Se eliminan las reglas generales de v8 que forzaban `position: static` y `height: auto` sobre todos los elementos internos del lienzo ExpBuilder. Esas reglas dañaban el renderizado original y podían dejar el contenedor vacío.
- Se compone una presentación adaptable del texto y las imágenes desde las definiciones de los componentes de ExpBuilder, **pero se mueven los botones originales** del plugin al pie del panel. No se crean botones sustitutos ni se activan clics programáticos sobre los controles ocultos.
- El renderer de origen solo se oculta cuando se encontraron y trasladaron todos los botones nativos; hasta entonces sigue visible el original. Si no se encuentran tras cinco segundos, se quita el panel y queda el renderer original (modo de respaldo, no responsive).
- Los ensayos de evaluación siguen utilizando el **ImageComponent y SurveyComponent originales** y conservan las cinco preguntas en un único ensayo, con cara visible y los siete valores Likert en una fila.
- Se retiró el CSS de v8 que ocultaba incondicionalmente el renderer original de los ensayos antes de verificar que el SurveyJS y la imagen estuviesen montados.
- No se vuelve a añadir «Rostro a evaluar».

## Instalación

Desde la versión v8, sustituir solo en la raíz del repositorio GitHub:

- `index.html`
- `cafe-escalado.js`
- `cafe-escalado.css`

El archivo HTML apunta a `cafe-escalado.js?v=9` y `cafe-escalado.css?v=9` para evitar usar la versión anterior de la caché. No modificar `experiment.js` (continúa con la referencia `?v=7`), las fotos ni los archivos de estímulos. El modo de tres ítems sigue controlado desde `window.CAFE_MODO_PRUEBA = true` en `index.html`.

## Verificación local

- `node --check` confirma sintaxis válida.
- Prueba lógica con DOM simulado: bienvenida con botón original; transición a consentimiento y a instrucciones sin otra pantalla visible; un solo ImageComponent y el SurveyJS original con cinco preguntas; restauración al cambiar de ensayo.
- No se pudo realizar prueba visual con el plugin real: el navegador del entorno bloquea incluso las páginas locales (`ERR_BLOCKED_BY_ADMINISTRATOR`). Es imprescindible revisar la versión publicada en GitHub Pages en computadora y celular.
- `experiment.js`, imágenes y contenidos del ensayo son **binariamente idénticos** a la v8.

## Comprobación al publicar

1. Abrir el experimento y confirmar que se ve la bienvenida con el botón «Comenzar».
2. Revisar el consentimiento y las instrucciones, en computadora y en una simulación móvil de 320-390 px, verificando que no aparezcan dos versiones de cada pantalla y que los botones funcionen.
3. Revisar una práctica: cara visible y las cinco preguntas, sin imagen duplicada ni recarga de la pantalla previa.
4. Comprobar `window.CAFELayoutDiagnostics` en consola: debe aparecer `version: '9.0'`; en informativas `infoReady: true`, y en una evaluación `surveyFound: true`, `originalImageFound: true` y `originalQuestions: 5`.
5. Comprobar **por separado** el envío a Google Drive. Los HTTP 401 y 500 previos de `apiData` no se corrigen con un parche visual.

No limpiar IndexedDB al actualizar la interfaz: pueden existir respuestas locales pendientes de sincronización.
