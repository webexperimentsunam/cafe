# CAFE v13.7.1 — Corregir finalización académica por curso

## Contexto

En una sesión que entra mediante `?modalidad=estudiante&curso=grupo-50`, la consola reconoce correctamente `modalidad: estudiante`, `curso: grupo-50` y `meta: 50`, pero la pantalla de checkpoint no ofrece "Finalizar mi participación". La variable diagnóstica `CAFEBlocksDiagnostics.metaEfectiva` apareció como `undefined` en la captura. Eso puede indicar una versión anterior de `cafe-bloques.js` o una consulta hecha antes de que se preparen los ensayos; por sí solo no demuestra cuál fue el caso.

## Qué cambia

- `index.html` ahora solicita `cafe-bloques.js?v=13.7.1`, para no reutilizar una copia anterior en caché.
- `cafe-bloques.js` informa versión `13.7.1` y **lee la modalidad y meta directamente de `window.CAFEAcceso` al dibujar un checkpoint**, no solo de un campo de diagnóstico.
- Un estudiante con meta de 50 podrá pulsar **Finalizar mi participación** al llegar a 50 y también en los checkpoints siguientes (100, 150, ...), siempre que ya haya alcanzado su meta. Antes de la meta, los checkpoints siguen mostrando solo "Continuar".
- El público general conserva las decisiones de finalizar únicamente en los hitos habilitados de 200 rostros.
- No se modifica ninguna pregunta, rostro, calibración, sistema de guardado, código de constancia ni grupo.

## Instalación — IMPORTANTE

Subir a la **raíz de GitHub** estos dos archivos del parche:
1. `index.html` (sustituye el anterior)
2. `cafe-bloques.js` (sustituye el anterior)

**NO reemplazar `cafe-config.js`:** se conservan tus ajustes reales de grupo-50 y 50 rostros, checkpoints de 50, modo real y calibraciones.

Es importante sustituir ambos archivos. Después, actualizar en el navegador con Ctrl+Shift+R.

## Diagnóstico en consola

En cualquier pantalla, ejecutar:

```javascript
console.table({
  versionBloques: window.CAFEBlocksDiagnostics?.version,
  modalidad: window.CAFEAcceso?.modalidad,
  curso: window.CAFEAcceso?.curso,
  metaDocente: window.CAFEAcceso?.metaDocente,
  metaEfectiva: window.CAFEBlocksDiagnostics?.metaEfectiva,
  rostrosPreparados: window.CAFEBlocksDiagnostics?.totalFaces
});
```

La versión debe ser **13.7.1**. Antes de iniciar el bucle experimental, `metaEfectiva` puede estar todavía indefinida. En una pantalla de reconocimiento o checkpoint debe ser **50** para `grupo-50`.

En el checkpoint de las 50, deben mostrarse los botones "Continuar" y "Finalizar mi participación". Si el participante ya siguió avanzando, el siguiente checkpoint también debe mostrar los dos botones.

**La constancia aparece después de elegir finalizar y completar el cierre remoto**, no al alcanzar por sí sola la meta.

## Pruebas realizadas

- Comprobación `node --check`.
- Ejecución simulada de 1,192 rostros y 48 calibraciones.
- Render de checkpoint en la posición 50 con los dos botones.
- Render de checkpoint en la posición 100 después de superar una meta de 50, también con los dos botones.
- Pulsación simulada de finalizar, verificando los campos `cafe_decision_bloque: 'finalizar'` y `cafe_meta_docente: 50`.

Queda pendiente la prueba integral de GitHub Pages, jsPsych y exportación CSV/Drive para esta revisión.
