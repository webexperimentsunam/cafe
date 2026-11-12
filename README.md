# CAFE v13.6 — folio final por sesión (estudiantes)

Base: CAFE v13.5. Se mantiene la misma tarea experimental, las 1,192 fotografías esperadas en `img/stimuli/`, las cinco preguntas por rostro, los checkpoints configurables, la aleatorización entre participantes y cuatro calibraciones por cada 100 rostros.

## 1. Accesos sin pedir un código inicial al alumno

**Público general:** `https://webexperimentsunam.github.io/cafe/`

**Grupo estudiantil:** `https://webexperimentsunam.github.io/cafe/?modalidad=estudiante&curso=grupo-150`

El parámetro `curso` es el **identificador del grupo**. No se pide un segundo código antes de empezar. Configurar los grupos en `index.html`:

```js
window.CAFE_CURSOS = {
  'grupo-80': { meta:80, etiqueta:'Grupo A' },
  'grupo-150': { meta:150, etiqueta:'Grupo B' },
  'grupo-300': { meta:300, etiqueta:'Grupo C' }
};
```

## 2. Cómo funciona el código FINAL

1. El alumno realiza la misma tarea experimental. Los checkpoints siguen permitiendo finalizar al alcanzar el objetivo definido por el profesor (o continuar voluntariamente).
2. Al pulsar **Finalizar** en la pantalla final, CAFE espera a que los registros de la sesión estén confirmados por `apiData`.
3. A partir de la copia local, cuenta los **rostros principales únicos con las cinco respuestas válidas**. No cuenta ni prácticas, ni calibraciones, ni pausas.
4. Si el recuento alcanza la meta del curso, genera un código aleatorio de 16 caracteres de un alfabeto de 32 símbolos, agrupado como `CAFE-XXXX-XXXX-XXXX-XXXX`. Usa `crypto.getRandomValues` (seguro en GitHub Pages HTTPS). La misma sesión conserva el mismo código si se reintenta el cierre.
5. Coloca ese código **en la fila `Ending` del CSV final**, junto con el identificador del curso, la meta y el número real de rostros válidos. El archivo se envía a `apiDataComplete`.
6. **Solo cuando `apiDataComplete` y la actualización de sesión final en Firebase confirman éxito**, aparece la pantalla de constancia con el código y un botón **Copiar código**. El estudiante lo entrega al profesor.

Los campos nuevos en la fila `Ending` son:

- `cafe_codigo_constancia`: código que se muestra al alumno.
- `cafe_constancia_curso`: el identificador del grupo.
- `cafe_constancia_meta`: cantidad requerida por el profesor.
- `cafe_constancia_rostros_validos`: número real de rostros únicos con las cinco respuestas.
- `cafe_constancia_calibraciones`: número de controles de atención presentados y respondidos.
- `cafe_constancia_prueba`: `true` para pruebas, `false` para sesiones reales.
- `cafe_constancia_generada_en`: fecha/hora UTC de generación.

**El profesor valida el código buscando `cafe_codigo_constancia` en la fila final del CSV del grupo y comprobando que `cafe_constancia_rostros_validos` alcance la meta.** También puede volver a contar las filas `cafe_tipo_fila='rostro'` y revisar respuestas y controles de atención. Una captura sin código coincidente con un CSV final no acredita participación.

El código no constituye una firma criptográfica del servidor ni verifica la identidad del alumno: evita el problema básico de capturas de una pantalla final sin respaldo, pero la verificación sigue dependiendo de los registros reales del investigador. El enlace del curso puede ser compartido, por lo que el profesor debe asegurarse de que el código entregado corresponda a su grupo.

## 3. Público general y modo de prueba

- **Público general**: sin folio de constancia, flujo de finalización normal.
- **Estudiantes, modo de prueba** (`window.CAFE_MODO_PRUEBA=true`): se simula la meta con 2 rostros, se muestra un folio **`PRUEBA-XXXX-XXXX-XXXX-XXXX`** y en el CSV se escribe `cafe_constancia_prueba=true`. **Nunca sirve para otorgar puntos extra**.
- **Estudiantes, modo completo** (`window.CAFE_MODO_PRUEBA=false`): constancia real si se alcanzó la meta y los servidores confirmaron el guardado.

## 4. Instalación desde v13.5

En la raíz de GitHub:

- Sustituir `index.html`.
- Sustituir `experiment.js`.
- Agregar `cafe-constancias.js`.

No es necesario modificar `cafe-bloques.js`, `cafe-acceso.js`, `cafe-nativo.js`, CSS ni imágenes. El ZIP completo incluye archivos de referencia e imágenes de prueba; **conservar las 1,192 fotografías ya publicadas en `img/stimuli/`**, porque el ZIP no incluye el banco privado completo.

## 5. Verificación previa al uso con estudiantes

1. Ingresar a un enlace válido de estudiante con el modo prueba y finalizar tras dos rostros. Confirmar que aparece un código que empieza con `PRUEBA-`.
2. Revisar el archivo consolidado de esa sesión en Drive. En la fila `Ending`, deben aparecer exactamente el mismo código, el curso, `cafe_constancia_rostros_validos=2` y `cafe_constancia_prueba=true`.
3. Confirmar que el acceso público **no muestra un código**.
4. Poner `CAFE_MODO_PRUEBA=false`, utilizar una meta de curso baja para hacer una prueba de producción controlada y **comprobar el CSV final en Drive**.
5. Una vez comprobado el guardado remoto, configurar las metas reales de los profesores.

## 6. Precauciones

Esta versión **no añade un backend nuevo ni una firma digital**. La confirmación se basa en la respuesta `success:true` de `apiDataComplete` y la sesión de Firebase, igual que el cierre normal de CAFE. Si la API falla, el código no se presenta al estudiante y los datos quedan pendientes de consolidación/reintento.

Las pruebas automáticas locales verificaron la creación, persistencia, unicidad, validación de cinco respuestas, exclusión de duplicados y calibraciones, requisito académico, diferencia de modalidad y folios de prueba. No se ha hecho una prueba real contra el Drive del usuario desde este entorno.
