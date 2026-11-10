/* CAFE v5: interfaz adaptable con fotografía visible durante toda la evaluación.
 * Conserva SurveyJS, sus preguntas y valores; solo cambia la presentación visual.
 */
(function (global) {
  'use strict';
  const phases = new Set(['practice', 'experiment']);
  const imagePattern = /^img\/[\w\-. ()]+\.(?:jpg|jpeg|png|webp)$/i;
  const htmlImageName = '__cafe_foto_responsive__';
  let currentStimulus = '';
  let observerInstalled = false;
  let pendingFrame = false;

  function validateImage(src) {
    return typeof src === 'string' && imagePattern.test(src);
  }
  function imageMarkup(src) {
    if (!validateImage(src)) throw new Error('CAFE: imagen fuera de la carpeta de estímulos');
    const escaped = src.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    // La fotografía sigue siendo parte de la definición de ese mismo ensayo.
    return '<div class="cafe-foto-ensayo"><img src="' + escaped +
      '" alt="Rostro que se va a evaluar" loading="eager" draggable="false"></div>';
  }
  function prepareStimuli(rows, phase) {
    if (!Array.isArray(rows) || !phases.has(phase)) return;
    const ckey = 'components_' + phase;
    const rkey = 'response_components_' + phase;
    let prepared = 0;
    for (const row of rows) {
      if (!row || !Array.isArray(row[ckey]) || !Array.isArray(row[rkey])) continue;
      const image = row[ckey].find(c => c?.type === 'ImageComponent' && validateImage(c.stimulus));
      const survey = row[rkey].find(c => c?.type === 'SurveyComponent' && Array.isArray(c.survey_json?.pages?.[0]?.elements));
      if (!survey) continue;
      const stimulus = image?.stimulus || row.cafe_stimulus;
      if (!validateImage(stimulus)) continue;
      const elems = survey.survey_json.pages[0].elements;
      // No insertar una segunda imagen si la función se ejecuta otra vez.
      if (!elems.some(item => item?.name === htmlImageName)) {
        elems.unshift({type: 'html', name: htmlImageName, html: imageMarkup(stimulus)});
      }
      row.cafe_stimulus = stimulus;
      // Quitar únicamente la copia absolutamente posicionada de ExpBuilder.
      if (image) row[ckey] = row[ckey].filter(c => c !== image);
      survey.survey_json.widthMode = 'responsive';
      prepared++;
    }
    global.CAFELayoutDiagnostics = global.CAFELayoutDiagnostics || {};
    global.CAFELayoutDiagnostics[phase] = {
      stimuliWithImageInSurvey: prepared, strategy: 'fixed-face-and-scrollable-survey', version: 5
    };
  }

  function renderDock(src) {
    let dock = document.getElementById('cafe-image-dock');
    if (!validateImage(src)) {
      if (dock) dock.remove();
      return;
    }
    if (!dock) {
      dock = document.createElement('aside');
      dock.id = 'cafe-image-dock';
      dock.setAttribute('aria-label', 'Fotografía que estás evaluando');
      const label = document.createElement('div');
      label.className = 'cafe-image-dock-caption';
      label.textContent = 'ROSTRO A EVALUAR';
      const img = document.createElement('img');
      img.alt = 'Rostro que estás evaluando';
      img.draggable = false;
      dock.append(label, img);
      document.body.appendChild(dock);
    }
    const img = dock.querySelector('img');
    if (img && img.getAttribute('src') !== src) img.setAttribute('src', src);
    dock.hidden = false;
  }

  function adaptSurveyDOM() {
    if (!document.body.classList.contains('cafe-ensayo')) return;
    const survey = document.querySelector('.sd-root-modern, .sd-root-default');
    if (!survey) return;
    // El motor original introduce capas absolutas y anchuras fijas. Marcar SOLO
    // la cadena de ancestros del SurveyJS actual para corregirla con CSS.
    let ancestor = survey;
    for (let n = 0; ancestor && ancestor !== document.body && n < 16; n++, ancestor = ancestor.parentElement) {
      ancestor.classList?.add('cafe-survey-layer');
    }
    const photo = document.querySelector('.cafe-foto-ensayo');
    if (photo) {
      const original = photo.closest('.sd-question');
      (original || photo).classList.add('cafe-inline-photo-hidden');
      if (!validateImage(currentStimulus)) {
        const src = photo.querySelector('img')?.getAttribute('src');
        if (validateImage(src)) {
          currentStimulus = src;
          renderDock(src);
        }
      }
    }
  }
  function scheduleAdapt() {
    if (pendingFrame) return;
    pendingFrame = true;
    // No reestructuramos el DOM de SurveyJS: los manejadores de respuesta quedan intactos.
    const schedule = global.requestAnimationFrame || (fn => Promise.resolve().then(fn));
    schedule(() => {pendingFrame = false; adaptSurveyDOM();});
  }
  function installObserver() {
    if (observerInstalled || typeof MutationObserver === 'undefined') return;
    observerInstalled = true;
    // Solo cambios de nodos; añadir clases no vuelve a disparar el observador.
    new MutationObserver(scheduleAdapt).observe(document.body, {subtree:true, childList:true});
  }
  function setTrialMode(name, stimulus) {
    const active = phases.has(name);
    document.body.classList.toggle('cafe-ensayo', active);
    currentStimulus = active && validateImage(stimulus) ? stimulus : '';
    renderDock(currentStimulus);
    if (active) {installObserver();scheduleAdapt();}
  }

  global.CAFEResponsive = Object.freeze({prepareStimuli, setTrialMode});
})(window);
