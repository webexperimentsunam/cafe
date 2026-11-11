# CAFE v13 — checkpoints, progreso global y calibración de 5 emociones

**Base:** CAFE v12. Esta versión conserva el renderizador nativo, la aleatorización estable por sesión y el guardado local incremental. Está pensada para instalarse como **paquete completo**, especialmente si todavía no se instaló v12.

## Cambios principales

1. **Checkpoints sin invitar a salir.**
   - La pantalla intermedia ahora se presenta como **Punto de control**.
   - Muestra: **"Has completado X de Y evaluaciones"**.
   - Tiene solo un botón principal: **Continuar**.
   - Ya no aparece la formulación de "evaluaciones sugeridas" ni un botón destacado para terminar.

2. **Barra de progreso basada en el conjunto completo.**
   - Se añade una barra de progreso en:
     - los ensayos principales de reconocimiento,
     - las pantallas de calibración,
     - los checkpoints.
   - La referencia es el **total completo de rostros del set**, no el tamaño del bloque.

3. **Calibración con 5 emociones y tamaño uniforme.**
   - Se sustituyen los controles previos por cinco dibujos del mismo tamaño:
     - Alegría
     - Tristeza
     - Enojo
     - Miedo
     - Sorpresa
   - Se excluye la emoción neutra.
   - Los archivos nuevos son SVG para asegurar el mismo tamaño visual y buena nitidez.

4. **Calibraciones distribuidas a lo largo de la tarea, no por checkpoint pequeño.**
   - Las calibraciones siguen distribuyéndose en **ventanas de 200 rostros**.
   - Por defecto se mantienen **2 calibraciones por cada 200 rostros**.
   - Esto es **independiente** del tamaño del checkpoint.
   - Ejemplo: si se usa `window.CAFE_TAMANO_BLOQUE = 10`, seguirá habiendo checkpoints cada 10 rostros, **pero no** 2 calibraciones por cada 10; las calibraciones continúan dosificadas a lo largo de 200 rostros.

5. **Aleatorización de emociones en cada ensayo.**
   - La pregunta de emoción en la tarea principal **sí se aleatoriza**.
   - El orden se contrabalancea por participante usando la sesión como semilla.
   - Ese orden se conserva al reanudar la sesión.
   - Los ensayos de calibración reutilizan el mismo orden de respuesta.

6. **Cuestionario sociodemográfico.**
   - Se conserva la barra de desplazamiento interna.
   - La fecha de nacimiento sigue usando selector de calendario.
   - La pregunta de estado mantiene la lista de entidades federativas de México.

## Configuración relevante en `index.html`

```javascript
window.CAFE_MODO_PRUEBA = true;
window.CAFE_TAMANO_BLOQUE = 200;
window.CAFE_TAMANO_BLOQUE_PRUEBA = 2;
window.CAFE_CALIBRACIONES_POR_BLOQUE = 2;
```

### Importante
- `CAFE_TAMANO_BLOQUE` controla la frecuencia de los **checkpoints**.
- `CAFE_CALIBRACIONES_POR_BLOQUE` ahora se interpreta como el número de calibraciones por **ventana estándar de 200 rostros**.
- Si se quiere probar checkpoints pequeños, por ejemplo 10, basta con cambiar:

```javascript
window.CAFE_TAMANO_BLOQUE = 10;
```

## Sobre el error HTTP 401

Esta versión **no elimina** el `401` observado en consola. Ese error parece provenir del flujo remoto de autenticación o guardado del backend (`apiData` / `updateSessionName`) y no del renderizado local de la tarea.

## Archivos principales incluidos

- `index.html`
- `experiment.js`
- `cafe-nativo.js`
- `cafe-nativo.css`
- `cafe-bloques.js`
- `cafe-bloques.css`
- `img/calibracion_alegria.svg`
- `img/calibracion_tristeza.svg`
- `img/calibracion_enojo.svg`
- `img/calibracion_miedo.svg`
- `img/calibracion_sorpresa.svg`

## Recomendación de instalación

Como aún no se instaló v12, usar directamente el **paquete completo v13**.
