# CAFE — GitHub Pages con interruptor de prueba de 3 ítems

## Activar/desactivar el modo de prueba

Abre **`index.html`** en el repositorio y busca el bloque `cafe-configuracion` situado justo antes de la carga de `experiment.js`:

```html
<script id="cafe-configuracion">
  window.CAFE_MODO_PRUEBA = true;
</script>
```

- **`true`**: ejecutar la tarea original, pero con **solo 3 estímulos principales**. Los **3 ensayos de práctica** se mantienen, por lo que se muestran **6 imágenes evaluables en total** (3 práctica + 3 principal).
- **`false`**: ejecutar **los 1,192 estímulos originales del bloque principal**, además de los 3 de práctica.

No se modifica la URL, no se añade un parámetro de consulta y no es necesario ajustar el JavaScript al alternar los modos. Tras cambiar el valor, guarda el archivo mediante un commit en `main`, comprueba el despliegue de Pages y recarga el sitio (Ctrl+Shift+R).

La prueba usa las fotografías **surprise_M-LA-07.jpg, surprise_M-LA-08.jpg y surprise_M-LA-09.jpg**, que ya están incluidas en el ZIP. El orden de estas tres fotos **se aleatoriza**, usando el mismo muestreador original del bucle de ExpBuilder. La selección es deliberadamente fija para que los índices de estímulos sean estables entre cargas y al reanudar una sesión. Las imágenes de prueba pertenecen a la misma categoría emocional; esta selección es **solo para pruebas técnicas**, no para una evaluación psicométrica.

Cada registro incluye el nuevo campo `cafe_modo_prueba` (`true` o `false`) para distinguir datos de prueba y datos reales en los CSV. **Se usa el mismo identificador de experimento y el mismo destino de Google Drive en ambos modos**; no mezclar las sesiones de prueba con la base definitiva.

No cambies de `true` a `false` mientras haya una sesión incompleta que necesites reanudar en ese navegador: la longitud del bucle cambia y el punto de recuperación de esa sesión podría quedar incompatible. Termina las pruebas pendientes antes de cambiar de modo.

## Instalación del parche

Si ya subiste a GitHub el paquete `CAFE_GitHub_publicable_pendiente_imagenes.zip`, reemplaza **solo los dos archivos** `index.html` y `experiment.js` que vienen en `CAFE_GitHub_parche_prueba_3_items.zip`. No hay que modificar ni volver a subir las imágenes.

Si todavía no subiste el proyecto, utiliza el paquete completo de esta versión.

## Qué permanece igual

Se conservan todas las pantallas, instrucciones, tres ensayos de práctica, 1,192 ensayos principales de la configuración completa, preguntas, estímulos, escala, dos bucles, muestreo aleatorizado, condiciones de salida y comportamiento de guardado original (`batchSize=0`, `useIndexedDB=true`, `resumeTimeoutMinutes=30`). No se incorpora aún la modificación de Firebase/IndexedDB usada en Juicios Morales.

**Limitación de recursos:** la versión completa seguirá necesitando las 1,188 imágenes enumeradas en `diagnostico/imagenes_faltantes.txt`. El modo de prueba de tres ítems principales usa únicamente imágenes que ya están presentes.

---

## Documentación de la adaptación original


Esta carpeta permite **subir a GitHub el código generado por ExpBuilder**, utilizando como base la versión de `index.html` existente en el repositorio `cafe`.

## Qué contiene
- `index.html`: conserva librerías, guardia de errores, estilos y bootstrap del antiguo GitHub. Carga `experiment.js` en vez de incrustar 5 MB en HTML.
- `experiment.js`: bootstrap del index original **más los 5,148,447 caracteres exactos de `config.data.generatedCode`** contenidos en la exportación y el cierre correspondiente del inicializador de ExpBuilder. El bloque generado no se alteró: preserva las nueve tareas, los dos bucles y las condiciones.
- `img/`: todos los archivos de imagen presentes en la exportación, más un alias técnico `sorprendida.png` (copia de `soprendida.png`, porque el código hace referencia a ambos nombres).
- `diagnostico/`: lista de imágenes pendientes y resumen técnico. Esta carpeta no es necesaria para que la página cargue; facilita completar los materiales.

## Problema pendiente — imágenes
El código generado requiere **1,197 archivos de imagen únicos**. Solo **9** están en este paquete. Faltan **1,188** imágenes, en su mayoría fotografías de expresiones faciales.

La exportación `CAFE-EXPBUILDER.zip` no incluye las imágenes faltantes. El ZIP `cafe-github.zip` tampoco las contiene. No sustituimos imágenes por otras ni cambiamos el número de ensayos. **El código está listo para colocar en GitHub, pero el experimento completo aún NO está listo para tomar datos.**

Consulta `diagnostico/imagenes_faltantes.txt` y coloca los archivos originales en la carpeta `img/`, respetando exactamente nombres, mayúsculas y extensiones.

## Cómo publicar
1. Conserva una copia del repositorio anterior.
2. Descomprime este ZIP. **Sube el contenido de la carpeta**, no la carpeta contenedora: `index.html`, `experiment.js`, `img/` y opcionalmente `diagnostico/` deben estar en la raíz de `main`.
3. En GitHub, `Settings > Pages > Source: Deploy from a branch`, `main`, `/(root)`.
4. URL configurada en la exportación: `https://webexperimentsunam.github.io/cafe/`.
5. Cuando tengas las imágenes completas, comprueba que ya no queda ninguna línea en `diagnostico/imagenes_faltantes.txt` al regenerar el listado, y realiza una prueba completa antes de usarlo con participantes.

## Configuración original conservada
- ID de experimento: `17e49b08-828f-4321-b62d-c040a5c1c3ea`.
- Guardado configurado: `googledrive`.
- `fullScreen = false`, `progressBar = false`.
- 9 tipos de ensayo: Bienvenida, Consentimiento, Demographics, no_consent, Instructions, practice, preparation, experiment, Ending.
- Dos bucles, ambos aleatorios, sin cambios de estímulos.
- Sesiones de prueba en `sessionResults` **no se incluyeron** en el sitio público para evitar publicar respuestas de participantes.

**Nota sobre la persistencia:** el código anterior de GitHub usa el guardado original de ExpBuilder (`batchSize=0`, `useIndexedDB=true`, `resumeTimeoutMinutes=30`), que se preservó tal cual para esta primera adaptación. No se aplicó todavía el parche usado en Juicios Morales; habrá que probar el destino de Google Drive y el registro de sesiones, sin asumir equivalencia entre experimentos.

## Verificaciones realizadas
- `node --check experiment.js`.
- Script generado por ExpBuilder idéntico al de la exportación.
- Rutas de todos los archivos disponibles verificadas; inventario completo generado.
- Los 9 tipos y los 2 bucles conservados.

## Pendiente antes de recolectar datos
- Agregar **1,188** imágenes que faltan.
- Abrir las 9 pantallas y comprobar escalas, preguntas, aleatorización y apariencia en escritorio/celular.
- Verificar persistencia de respuestas con Google Drive, sesiones interrumpidas y posible reanudación.
- Revisar consentimiento/uso de imágenes con el equipo investigador.
