/* CAFE — Configuración del experimento, versión 13.7

   Este es el ÚNICO archivo que necesitas editar para cambiar:
   - modo de prueba / modo real
   - checkpoints
   - controles de atención
   - grupos de profesores y metas de participación

   NO borres ni renombres las variables window.CAFE_... .
   Guarda el archivo en la misma carpeta que index.html.
*/

// ===== 1. MODO DE EJECUCIÓN =====
// true: prueba de 3 rostros; false: tarea completa (1,192 rostros).
// Para iniciar la recolección real, cambia true por false.
window.CAFE_MODO_PRUEBA = true;

// ===== 2. CHECKPOINTS =====
// Cantidad de rostros antes de cada punto de control: de 1 a 200.
// La meta de un profesor activa un punto de control adicional justo al alcanzarse.
window.CAFE_TAMANO_BLOQUE = 200;
// Solo para probar la navegación entre checkpoints con 3 rostros.
window.CAFE_TAMANO_BLOQUE_PRUEBA = 2;

// ===== 3. CALIBRACIONES =====
// Por defecto: cuatro comprobaciones de atención por cada 100 rostros.
// La distribución es independiente de la frecuencia de checkpoints.
window.CAFE_CALIBRACIONES_POR_100 = 4;
window.CAFE_VENTANA_CALIBRACION = 100;

// ===== 4. GRUPOS PARA PUNTOS EXTRA =====
// 'meta' = número de rostros principales que debe evaluar el estudiante.
// 'etiqueta' = nombre legible del grupo. El enlace contiene solo su clave.
// A continuación hay ejemplos; reemplázalos por tus cursos reales.
window.CAFE_CURSOS = {
  'grupo-80':  { meta: 80,  etiqueta: 'Grupo A (ejemplo)' },
  'grupo-150': { meta: 150, etiqueta: 'Grupo B (ejemplo)' },
  'grupo-300': { meta: 300, etiqueta: 'Grupo C (ejemplo)' }
};

// ===== 5. GUARDADO / NOMBRE DE SESIÓN =====
// Mantener en false: el backend devolvió HTTP 401 al renombrar la sesión.
// Esta opción NO desactiva el envío de respuestas.
window.CAFE_HABILITAR_RENOMBRADO_SESION = false;
