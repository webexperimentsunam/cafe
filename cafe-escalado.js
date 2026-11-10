/* CAFE v4 | Presentacion adaptable: imagen + SurveyJS, sin modificar datos ni preguntas. */
(function (global) {
  'use strict';
  const modes = new Set(['practice', 'experiment']);
  const imgTag = (stimulus) => {
    // Estimulos generados por ExpBuilder: img/<filename>, sin URLs externas.
    if (typeof stimulus !== 'string' || !/^img\/[\w\-. ()]+\.(?:jpg|jpeg|png|webp)$/i.test(stimulus)) {
      throw new Error('CAFE: ruta de imagen no valida para la presentacion adaptable');
    }
    const escaped = stimulus.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return '<div class="cafe-foto-ensayo"><img src="' + escaped +
      '" alt="Fotografía del rostro que se va a evaluar" loading="eager" decoding="async" draggable="false"></div>';
  };
  function prepareStimuli(rows, phase) {
    if (!Array.isArray(rows) || !modes.has(phase)) return;
    const ckey = 'components_' + phase;
    const rkey = 'response_components_' + phase;
    let prepared = 0;
    for (const row of rows) {
      if (!row || !Array.isArray(row[ckey]) || !Array.isArray(row[rkey])) continue;
      const image = row[ckey].find(c => c?.type === 'ImageComponent' && typeof c.stimulus === 'string');
      const survey = row[rkey].find(c => c?.type === 'SurveyComponent' && c.survey_json?.pages?.[0]?.elements);
      if (!image || !survey) continue;
      if (row.cafe_stimulus === image.stimulus) continue; // idempotente
      // Incorporar como elemento HTML no interactivo en la primera pagina de SurveyJS.
      // No altera ninguno de los cinco items de respuesta ni su validacion.
      const elements = survey.survey_json.pages[0].elements;
      if (!elements.some(item => item?.name === '__cafe_foto_responsive__')) {
        elements.unshift({
          type: 'html', name: '__cafe_foto_responsive__', html: imgTag(image.stimulus)
        });
      }
      row.cafe_stimulus = image.stimulus;
      // Eliminar la copia visual absoluta que se superponia al titulo de SurveyJS.
      // El mismo archivo sigue visible dentro del cuestionario y en los CSV.
      row[ckey] = row[ckey].filter(c => c !== image);
      // La anchura se ajusta al contenedor disponible sin cambiar la escala 1-7.
      survey.survey_json.widthMode = 'responsive';
      prepared++;
    }
    global.CAFELayoutDiagnostics = global.CAFELayoutDiagnostics || {};
    global.CAFELayoutDiagnostics[phase] = { stimuliWithImageInSurvey: prepared, strategy: 'surveyjs-inline-image', version: 4 };
  }
  function setTrialMode(name) {
    document.body.classList.toggle('cafe-ensayo', modes.has(name));
  }
  global.CAFEResponsive = Object.freeze({ prepareStimuli, setTrialMode });
})(window);
