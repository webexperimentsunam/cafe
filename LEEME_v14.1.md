# CAFE v14.1 — Diagnóstico del inicio de sesión

Sustituir index.html, experiment.js y cafe-constancias.js juntos en la raíz de CAFE, tanto si actualmente está v13 como v14. No reemplazar imágenes, configuración de grupos ni demás archivos.

Se conserva el identificador de CAFE, el protocolo v3 (createSession, activateConnection, appendEvents, completeSession, sessionStatus, retryExport), el espacio local de v14 y todas las definiciones de ensayos.

En `?prueba=3` aparece una pantalla de diagnóstico antes de conectar. Pulsa Iniciar prueba. Si createSession falla, se muestra el HTTP y el mensaje conocido y se permite reintentar con la misma identidad de sesión, sin recargar. No se recogen respuestas sin sesión válida. En modo real no se añade la pantalla inicial de diagnóstico, pero sí el reintento ante fallo de creación.

En la consola: `window.CAFEInicioDiagnostics.snapshot()` (solo estado HTTP, acción y mensajes diagnósticos; no tokens). En Red, filtrar apiData, revisar Response. Si el error 409 Published experiment configuration unavailable persiste, se necesita registrar/reparar la publicación en el backend; este parche no puede crear dicha configuración. No se intenta el protocolo legado ni se cambia al identificador de otro experimento.

Pruebas: análisis de sintaxis, comparación de la región experimental, prueba simulada del inicio y reintento. No se ha verificado una exportación real. Mantener el estudio fuera de reclutamiento hasta verificar el protocolo y el almacenamiento.
