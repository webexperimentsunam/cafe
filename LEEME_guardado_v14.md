# CAFE v14.0 — Migración al protocolo público de guardado por eventos de ExpBuilder

## Instalación

Este parche corresponde al repositorio CAFE v13.7.1 proporcionado (`cafe-main (1).zip`). Sustituir juntos, en la raíz del repositorio de CAFE, únicamente:

1. `index.html`
2. `experiment.js`
3. `cafe-constancias.js`

No sustituir `cafe-config.js`, `cafe-acceso.js`, `cafe-bloques.js`, `cafe-nativo.js`, CSS ni la carpeta `img`. La configuración del ZIP tiene modo real, checkpoints de 25, cinco calibraciones por cada 100 rostros y `grupo-50` con meta real de 1192 (no 50). Se conservan los ajustes reales que ya tengas en GitHub. El nuevo `index.html` actualiza la versión de caché de los scripts modificados. Realizar el cambio solo antes de reclutar o en un repositorio de prueba: las sesiones locales del protocolo anterior no se migran automáticamente ni se borran. Conserva una copia de la versión anterior para recuperarlas.

## Configuración en ExpBuilder

El identificador de CAFE se conserva: `17e49b08-828f-4321-b62d-c040a5c1c3ea`. No utiliza el identificador de Juicios Morales. El backend debe aceptar el protocolo público de sesiones versión 3 para CAFE. Activa IndexedDB en la configuración de guardado de este experimento en ExpBuilder y conserva Google Drive como destino. Se recomienda un lote pequeño (por ejemplo, 1 o 5 eventos) durante las pruebas; el parche respeta el tamaño y el tiempo de reanudación que devuelve el servidor. Si el servidor no admite el protocolo o devuelve IndexedDB desactivado, la tarea se detiene antes de mostrar ensayos. Si necesitas republicar CAFE desde ExpBuilder para registrar la configuración, verifica después que los tres archivos del parche siguen publicados; no sobrescribas el CAFE completo con el HTML original de otro experimento. La renovación de credenciales de Drive es responsabilidad del backend.

## Cambios

- Se reemplaza el envío anterior por el protocolo del HTML original utilizado en Validación de juicios morales: `createSession`, `activateConnection`, `appendEvents`, `completeSession`, `sessionStatus`, `retryExport`, además de las operaciones de reanudación y recuperación. Se valida la identidad, secuencia, hash y revisión de exportación. Los registros locales pendientes permanecen en IndexedDB hasta que se confirma su recepción. Las sesiones nuevas de CAFE usan un espacio local separado del anterior.
- La constancia se genera en la fila `Ending`, antes de calcular el hash. Un resumen de rostros válidos únicos, calibraciones y folio queda en la misma transacción de IndexedDB que el manifiesto; permite recuperar el folio en la misma sesión y navegador. Si no cumple la meta, se guardan las respuestas sin emitir constancia. En sesión expirada solo se recuperan los registros disponibles; no se muestra un folio de finalización. La acreditación requiere comprobar el CSV.
- Un fallo esperado del exportador muestra el botón «Reintentar guardado» sin activar el mensaje fatal del runtime. Al confirmar el guardado se retira el panel y se muestra la pantalla final. El reintento consulta el estado de la sesión antes de repetir el cierre.
- Añadido `?prueba=3` para activar el piloto sin modificar el modo real global. Mantiene el comportamiento anterior: el estudiante puede terminar a partir de dos rostros en el piloto y recibe un código PRUEBA no acreditable. Para probar los tres, pulsa Continuar en el checkpoint de dos.

## Pruebas en GitHub Pages (pendientes)

Añadir a la URL real de CAFE:

- `?prueba=3` para público general.
- `?modalidad=estudiante&curso=grupo-50&prueba=3` para estudiantes, si el grupo existe en la configuración publicada.

Completar primero las pruebas cortas. En DevTools > Red filtrar `apiData`. Debe verse `createSession`, `activateConnection`, `appendEvents`, `completeSession` y, según el estado, `sessionStatus`. Confirmar `completion.confirmed: true`, `export.confirmed: true`, recuento esperado y hash coincidente. En el CSV verificar `cafe_version_guardado: 14.0-eventos`, modalidad, grupo, rostros, calibraciones, checkpoints y respuestas. El folio de estudiante debe coincidir exactamente con `cafe_codigo_constancia` de Ending. No debe aparecer folio académico en modo público. No iniciar recolección real hasta probar reanudación, interrupción de red, reintento de exportación y una sesión de longitud real. Usar perfiles de navegador separados al alternar configuraciones.

Diagnóstico no destructivo en consola:

```js
window.CAFEBatchDiagnostics
await window.CAFEBatchDiagnostics.localState()
window.CAFELastSaveError
```

## Verificaciones realizadas localmente

- `node --check` correcto para los archivos JS del repositorio.
- Bloque de definiciones de ensayos, estímulos y manifiesto de navegación de CAFE idéntico al del ZIP de origen.
- 1192 rutas principales únicas y todos sus archivos de imagen presentes (la tarea original remapea las rutas a `img/stimuli/`).
- Generación simulada de filas para modo de prueba y completo en ambas modalidades; orden determinista por sesión.
- Pruebas unitarias Node del cómputo de rostros válidos, deduplicación, folio estable, modo prueba, no emisión en público o con meta incumplida, y rechazo de confirmaciones con hash o identidad incorrectos. Simulación de fallo de exportación y reintento confirmado.

Limitaciones: las verificaciones unitarias simulan las respuestas remotas. El entorno local bloqueó la navegación de Chromium, de modo que no se realizó una prueba integral de navegador con jsPsych/IndexedDB real ni se escribió en Firebase o Google Drive. La configuración real y el comportamiento de reanudación y cierre con CAFE aún requieren las pruebas de GitHub Pages.
