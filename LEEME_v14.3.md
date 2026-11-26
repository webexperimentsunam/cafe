# CAFE 14.3 — configuración de guardado de la nueva publicación

Base: CAFE 14.2 y `index (1).html` de ExpBuilder, cuyo guardado fue comprobado por el usuario. El identificador sigue siendo `00f08bb8-86d9-424a-ab46-221104610d0c`.

## Qué cambia
- Comparación exacta de los scripts generados de los dos HTML de control: única diferencia en el script principal, eliminación del ensayo de entrada en pantalla completa. También se elimina la dependencia del plugin fullscreen en el encabezado. CAFE 14.2 ya no usaba ese ensayo.
- El batch y el resume timeout no están escritos como valores fijos en el HTML. El backend los devuelve en `configuration.batchConfig` al crear una sesión v3. CAFE mantiene esa lectura y requiere IndexedDB. No se inventan los valores de tu configuración.
- Se actualiza el HTML de control con una copia exacta del último archivo y se añaden diagnósticos de configuración pública de las solicitudes de sesión aceptadas, sin registrar tokens ni respuestas.
- No se cambia el algoritmo de lotes, el protocolo de sesión, el hash, la lógica de folios, el espacio de almacenamiento local ni el diseño experimental. Se actualizan las marcas de versión y referencias de caché.

## Instalación (no necesitas instalar 14.2 antes)
Sube juntos `index.html`, `experiment.js`, `cafe-constancias.js` y, como control opcional, `control-expbuilder-cafe-nuevo.html` a la raíz del repositorio. Conserva `cafe-config.js`, demás JS/CSS e imágenes del repositorio original. Mantén un respaldo del último index de ExpBuilder. No borres datos ni sesiones anteriores. Verifica en un perfil independiente tras el despliegue.

## Pruebas y diagnóstico
- Control: https://webexperimentsunam.github.io/cafe/control-expbuilder-cafe-nuevo.html
- Pública: https://webexperimentsunam.github.io/cafe/?prueba=3
- Estudiante: https://webexperimentsunam.github.io/cafe/?modalidad=estudiante&curso=grupo-50&prueba=3

Tras crear la sesión, ejecuta en consola `window.CAFEBatchDiagnostics.snapshot()` para ver los parámetros usados por CAFE; `window.CAFEInicioDiagnostics.snapshot()` muestra también la configuración de cada solicitud de sesión aceptada. En Red, comprueba `configuration.batchConfig` de `createSession` y `activateConnection`, sin compartir tokens. Un batch de 0 conserva respuestas localmente hasta el cierre; un batch positivo envía periódicamente al alcanzar ese número de registros, no necesariamente rostros. El cierre vacía los pendientes incluso si no alcanzan el tamaño configurado. El límite técnico por solicitud es 100 eventos y aproximadamente 900000 bytes estimados; el plazo de consulta de exportación sigue en 600000 ms (10 min), distinto del plazo de reanudación de sesión. No es un timeout de red ni de OAuth.

Comprobaciones: igualdad del bloque de lotes y validador con el HTML original; sintaxis JS, comparación de cambios con 14.2, copia exacta del control y pruebas simuladas de división y confirmación de lotes. No se ha accedido al backend ni probado la exportación real de CAFE. El control de un ensayo no demuestra que CAFE completo funcione. No se garantiza la resolución de la renovación de credenciales.
