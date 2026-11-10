# CAFE v4.1 — corrección del selector de tres ítems

Esta actualización **no modifica** la estructura ni el aspecto de la v4, el diseño de SurveyJS, la selección de tres fotografías, el guardado de Firebase/Drive, IndexedDB, ni la reanudación.

## Qué fallaba
`CAFEResponsive.prepareStimuli()` toma la ruta de `ImageComponent`, añade la fotografía al SurveyJS de la misma fila, guarda esa ruta en `cafe_stimulus` y elimina el `ImageComponent` para evitar solapamientos. Más adelante, el selector del modo de prueba seguía buscando exclusivamente un `ImageComponent`. Por tanto, no encontraba las rutas `img/surprise_M-LA-07.jpg`, `img/surprise_M-LA-08.jpg` y `img/surprise_M-LA-09.jpg`, aunque los archivos existieran.

## Solución
El selector ahora busca primero `item.cafe_stimulus === ruta`, con un fallback a `ImageComponent` si aún existe. El HTML referencia `experiment.js?v=4.1` para invalidar caché. No se hicieron otras modificaciones funcionales.

## Qué subir
Reemplazar **únicamente** `index.html` y `experiment.js` en la raíz del repositorio de GitHub. Mantener intactos `cafe-escalado.js`, `cafe-escalado.css` y `img/` de v4.

## Prueba
- `window.CAFE_MODO_PRUEBA = true`: práctica de tres ensayos y tres ensayos principales con las imágenes 07, 08 y 09 (orden aleatorio).
- `window.CAFE_MODO_PRUEBA = false`: mantiene los 1,192 estímulos principales originales.
- Verificar título, imagen, cinco preguntas y avance al siguiente ensayo.
- La respuesta HTTP 401 mostrada en consola puede pertenecer a otra solicitud; revisar su **Request URL** si persiste. Este parche corrige el error JavaScript de selección de estímulos, no credenciales de servicios externos.

## Advertencia
Si existen sesiones incompletas de una versión anterior, conservar el almacenamiento del navegador. No limpiar IndexedDB/localStorage sin respaldo. Confirmar el guardado real en Drive tras desplegar.
