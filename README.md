# CAFE v13.3 — cuatro calibraciones por 100 rostros y fotos en `img/stimuli/`

Base: CAFE v13.2, que a su vez incluye el renderizador jsPsych nativo, cuestionario sociodemográfico adaptable, recuperación local y checkpoints. **Este paquete es compatible con la instalación directa sobre la versión 13.2.**

## Configuración en `index.html`

```javascript
window.CAFE_MODO_PRUEBA = true;
window.CAFE_TAMANO_BLOQUE = 200;         // frecuencia de checkpoints reales
window.CAFE_TAMANO_BLOQUE_PRUEBA = 2;    // permite probar la pausa con 3 fotos
window.CAFE_CALIBRACIONES_POR_100 = 4;  // controles breves de atención
window.CAFE_VENTANA_CALIBRACION = 100;  // tramo usado para repartir controles
```

Con `CAFE_MODO_PRUEBA = false` se usa todo el banco de **1,192 rostros actualmente definido en `experiment.js`**. Con `true` se usan solo tres fotografías principales y una calibración, para comprobar el flujo. La práctica original permanece intacta.

**Atención a la cantidad:** el usuario menciona 1,092 fotografías subidas a GitHub, pero el código exportado de ExpBuilder contiene 1,192 fotografías principales **distintas**, todas con su Survey de cinco preguntas. No se eliminó ninguna definición porque no hay información para identificar qué 100 deberían excluirse. El inventario exacto se incluye en `diagnostico/estimulos_esperados_1192.txt`. **Antes de activar el modo completo, comprobar que las 1,192 rutas existen en `img/stimuli/`, o proporcionar un listado de las 1,092 imágenes para seleccionar solo las disponibles sin introducir sesgos.**

## Cambios

1. **Imágenes principales en carpeta separada.** La ruta de cada `ImageComponent` de `experiment` y la metadata `cafe_stimulus` pasan a `img/stimuli/<nombreoriginal.jpg>`. Se conserva `cafe_stimulus_original` para trazabilidad. Los tres estímulos de prueba apuntan también a `img/stimuli/`. Las imágenes del ensayo de práctica, logos e ilustraciones de calibración permanecen en `img/`.
2. **Calibraciones: 4 por cada 100 rostros.** Las comprobaciones se distribuyen en cuatro sectores de cada tramo de 100, con posición semi-aleatoria distinta por sesión y sin agruparse. Dentro de cada tramo se escogen cuatro emociones **diferentes** entre alegría, tristeza, enojo, miedo y sorpresa. No se utiliza neutra como estímulo de calibración. Se siguen guardando por separado, sin incluirlas en el cómputo de rostros principales.
3. **Checkpoints y calibraciones independientes.** Cambiar el tamaño del checkpoint a 10 no incrementa la frecuencia de las calibraciones. El flujo principal y los registros conservan su orden reproducible al reanudar.
4. **Checkpoints de progreso.** Los pequeños invitan únicamente a continuar. Cuando se alcanza o cruza un múltiplo de 200 rostros, aparece discretamente la alternativa de finalizar la participación y consolidar la sesión; en modo de prueba está disponible tras el segundo rostro. La barra de progreso continúa referida al total completo de rostros.
5. **Opciones de reconocimiento emocional:** se mantienen aleatorizadas una sola vez por participante, y no en cada ensayo. Esto facilita la tarea repetitiva y mantiene el orden al reanudar. Se sigue guardando `cafe_orden_emociones`.
6. **Cambio de versión de navegación**: `currentMode` actualizado a v13.3 porque cambian los índices, las rutas y la cantidad de calibraciones. Una recuperación pendiente de versiones anteriores deberá comenzar nueva sesión; no se eliminan automáticamente respuestas locales históricas de IndexedDB.

## Recuento esperado

- 1,192 rostros: 12 ventanas (11 de 100 y una de 92), **48 controles** y cinco checkpoints cuando `CAFE_TAMANO_BLOQUE=200`.
- 1,092 rostros (si posteriormente se realiza una selección explícita de archivos): 11 ventanas (10 de 100 y una de 92), **44 controles**.
- Prueba de 3 rostros: 1 control de atención y pausa después del segundo rostro.

Los controles incrementan la duración aproximadamente un 4 % en número de pantallas de estímulo, pero cada uno requiere solo una respuesta en lugar de cinco.

## Instalación

**Si ya está instalada v13.2:** utilizar el parche y reemplazar en la raíz `index.html`, `experiment.js`, `cafe-bloques.js`, `cafe-bloques.css`. Agregar, si faltan, las tres fotografías de prueba en `img/stimuli/` y conservar el resto de imágenes que ya están en GitHub.

**Si aún no se instaló v13.2:** utilizar el proyecto completo como base, sin borrar los archivos de rostros ya subidos. La copia completa de este paquete incluye código, cinco SVG y las tres fotografías de prueba, **no** el banco completo de imágenes.

El ZIP de actualización también contiene `diagnostico/estimulos_esperados_1192.txt` para reconciliar las rutas antes de recolectar datos.

## Pruebas locales realizadas

- Sintaxis JavaScript con `node --check` para los tres scripts.
- Lectura estructural de la exportación de 1,192 rostros: cada estímulo presenta un `ImageComponent` y un `SurveyComponent` de cinco reactivos.
- Simulación determinista con 1,192 y 1,092 rostros, tamaños de checkpoint 200 y 10, sin estímulos duplicados y con 48 y 44 calibraciones, respectivamente.
- Comprobación de que cada ventana tiene cuatro calibraciones de cuatro emociones distintas y posiciones diferenciadas.
- Simulación de los botones de pausa: solo `Continuar` en checkpoints pequeños; `Finalizar mi participación` disponible cuando se alcanza la meta de 200, y en modo de prueba.

## Pendiente antes de recolectar datos

1. Conciliar el banco de imágenes disponible frente al listado de 1,192 referencias; probar especialmente los tres archivos de test en `img/stimuli/`.
2. Probar dos sesiones desde GitHub Pages: continuar después del checkpoint y finalizar voluntariamente, verificando el CSV final.
3. Probar reanudación desde un navegador normal después de interrumpir entre controles o checkpoints.
4. **HTTP 401/500 pendiente en ExpBuilder.** Este parche no corrige el servidor. Los registros locales en IndexedDB no demuestran escritura en Google Drive. Confirmar recepción remota de `apiData` y `apiDataComplete` antes de iniciar reclutamiento.
