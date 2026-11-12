# CAFE v13.7 — Configuración independiente

Esta versión extrae todas las opciones editables de `index.html` a **`cafe-config.js`**. La lógica experimental, el reconocimiento, las calibraciones y las constancias son idénticos a la v13.6.1.

## Instalación desde CAFE v13.6 / v13.6.1

1. Haz una copia de seguridad del `index.html` **actualmente publicado**, especialmente si ya agregaste grupos o metas.
2. Descarga el parche y sube **estos dos archivos a la raíz** del repositorio `cafe` (la misma carpeta donde está `experiment.js`):
   - `index.html` (modificado una sola vez para usar el archivo externo)
   - `cafe-config.js` (nuevo)
3. Si tus cursos, tamaños de bloque o parámetros actuales no coinciden con los ejemplos, **copia tus valores actuales** al nuevo `cafe-config.js` antes de publicarlo.
4. Espera a que GitHub Pages se actualice. Comprueba en `https://webexperimentsunam.github.io/cafe/cafe-config.js` que aparece el código JavaScript, sin error 404.
5. Recarga el experimento con `Ctrl + Shift + R` y prueba el enlace público y al menos un enlace de estudiante.

Después de la instalación, para modificar grupos, metas, checkpoints o calibraciones, **edita únicamente `cafe-config.js`**. No hay necesidad de editar otra vez el HTML ni la lógica del experimento.

## Variables editables

| Variable | Función | Valor incluido |
|---|---|---|
| `CAFE_MODO_PRUEBA` | `true` = 3 rostros; `false` = 1,192 | `true` |
| `CAFE_TAMANO_BLOQUE` | Frecuencia de checkpoints en la versión real | `200` |
| `CAFE_TAMANO_BLOQUE_PRUEBA` | Checkpoint de prueba | `2` |
| `CAFE_CALIBRACIONES_POR_100` | Calibraciones por ventana | `4` |
| `CAFE_VENTANA_CALIBRACION` | Tamaño de la ventana de calibración | `100` |
| `CAFE_CURSOS` | Claves de curso y metas en número de rostros | 3 ejemplos |
| `CAFE_HABILITAR_RENOMBRADO_SESION` | Solicitud remota opcional que devolvía 401 | `false` |

**Para producción:** cambia `window.CAFE_MODO_PRUEBA = false;` dentro de `cafe-config.js` (y establece las metas reales). El paquete mantiene `true` como el `index.html` original de v13.6 para no activar producción accidentalmente.

### Grupos de profesores

Por ejemplo:

```javascript
window.CAFE_CURSOS = {
  'profesora-garcia': { meta: 100, etiqueta: 'Psicología A' },
  'profesor-lopez': { meta: 250, etiqueta: 'Investigación B' }
};
```

El enlace de estudiantes usa la **clave**, no la etiqueta:

`https://webexperimentsunam.github.io/cafe/?modalidad=estudiante&curso=profesora-garcia`

El enlace del público general no cambia: `https://webexperimentsunam.github.io/cafe/`.

## Nota sobre sesiones existentes

No cambies las metas, el tamaño de bloque ni el modo de prueba en mitad de la participación de un grupo. La recuperación depende de la configuración de la sesión. Mantén las opciones estables durante la recolección; haz pruebas en un navegador independiente al que utiliza el público.

El cambio a `cafe-config.js` no corrige ni modifica el guardado remoto. El código de constancia sigue requiriendo que el servicio confirme la sesión y que el folio coincida con el CSV.

## Comprobaciones

Se comparó por ejecución JavaScript el nuevo `cafe-config.js` con el bloque de configuración original de v13.6: **todos los valores y cursos son idénticos**. Se comprobó que `index.html` carga la configuración **antes** de `cafe-acceso.js` y `experiment.js`, y que el paquete completo incluye `cafe-acceso.js`, que faltó en un parche anterior. No se realizaron pruebas de integración contra el GitHub Pages en vivo ni contra la API de guardado.
