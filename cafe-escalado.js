/* CAFE v6 — Presentación adaptable sin alterar el experimento.
 * ExpBuilder conserva ImageComponent y SurveyComponent en el MISMO ensayo.
 * Únicamente se muestra la interfaz de SurveyJS existente dentro de un panel
 * adaptable. No se crean cuestionarios ni se sustituyen sus respuestas.
 */
(function (global) {
  'use strict';
  const PHASES = new Set(['practice', 'experiment']);
  const IMAGE_RE = /^img\/[\w\-. ()]+\.(?:jpe?g|png|webp)$/i;
  let active = false;
  let stimulus = '';
  let generation = 0;
  let observer = null;
  let refreshQueued = false;
  let currentShell = null;
  let transplanted = null;
  let transplantMarker = null;
  let hostScroll = null;
  let nativeSource = null;
  const diagnostics = {
    version: '6.0', strategy: 'native-surveyjs-visual-portal',
    currentTrial: null, stimulus: null, surveyFound: false,
    surveyVisible: false, originalQuestions: 0, error: null,
    practiceStimuli: 0, experimentStimuli: 0
  };
  global.CAFELayoutDiagnostics = diagnostics;

  // La exportación se decora con su ruta original sin tocar las 5 preguntas.
  function prepareStimuli(rows, phase) {
    if (!PHASES.has(phase) || !Array.isArray(rows)) return;
    let count = 0;
    const ckey = 'components_' + phase;
    const rkey = 'response_components_' + phase;
    for (const row of rows) {
      const image = row?.[ckey]?.find(c => c?.type === 'ImageComponent' && IMAGE_RE.test(c.stimulus));
      const survey = row?.[rkey]?.find(c => c?.type === 'SurveyComponent');
      if (!image || !survey) continue;
      row.cafe_stimulus = image.stimulus;
      count++;
      // IMPORTANTE: no insertar preguntas HTML, no borrar ImageComponent.
      // SurveyJS y ExpBuilder recibirán la definición original íntegra.
    }
    diagnostics[phase + 'Stimuli'] = count;
  }

  function destroyShell() {
    if (observer) { observer.disconnect(); observer = null; }
    // Si la pantalla de ExpBuilder sigue conectada, devolver el host original
    // antes de desmontar; el plugin sigue controlando su encuesta y sus datos.
    if (nativeSource) {nativeSource.classList.remove('cafe-native-hidden'); nativeSource = null;}
    if (transplanted) {
      if (transplantMarker?.parentNode) {
        transplantMarker.parentNode.insertBefore(transplanted, transplantMarker);
        transplantMarker.remove();
      } else {
        transplanted.remove();
      }
    }
    transplanted = null;
    transplantMarker = null;
    hostScroll = null;
    currentShell?.remove();
    currentShell = null;
    document.body.classList.remove('cafe-ensayo');
    diagnostics.surveyFound = false;
    diagnostics.surveyVisible = false;
    diagnostics.originalQuestions = 0;
    diagnostics.error = null;
  }

  function makeShell(imagePath) {
    const root = document.createElement('section');
    root.id = 'cafe-evaluation-shell';
    root.setAttribute('aria-label', 'Evaluación de expresión facial');
    root.innerHTML = `
      <aside class="cafe-face-card" aria-label="Rostro a evaluar">
        <div class="cafe-face-caption">ROSTRO A EVALUAR</div>
        <img class="cafe-face-image" draggable="false" alt="Fotografía a evaluar">
      </aside>
      <main class="cafe-survey-card" aria-label="Cuestionario de evaluación">
        <div id="cafe-survey-slot" aria-live="off">
          <p class="cafe-survey-loading" role="status">Cargando preguntas…</p>
        </div>
      </main>`;
    root.querySelector('.cafe-face-image').setAttribute('src', imagePath);
    document.body.appendChild(root);
    return root;
  }

  function findSurvey() {
    // Excluir el contenedor adaptado y cualquier UI previa.
    const nodes = document.querySelectorAll('.sd-root-modern, .sd-root-default, .sv-root-modern, .sv-root-default');
    for (const node of nodes) {
      if (!node.closest('#cafe-evaluation-shell')) return node;
    }
    return null;
  }

  function findSurveyHost(root) {
    // Conservamos el elemento donde SurveyJS está renderizado, sus event
    // listeners y las referencias que mantiene la integración con jsPsych.
    // Priorizar el host con id de survey y, si no existe, su padre inmediato.
    let node = root.parentElement;
    let fallback = node || root;
    for (let depth = 0; node && depth < 6 && node !== document.body; depth++, node = node.parentElement) {
      if (node.id && /survey/i.test(node.id) && !node.id.startsWith('cafe-')) return node;
      if (node.classList?.contains('jspsych-content') ||
          node.classList?.contains('jspsych-content-wrapper') ||
          node.classList?.contains('jspsych-display-element')) break;
      // Mantener el primer contenedor que encapsula un SurveyJS completo,
      // sin sacar las imágenes ni otros componentes del ensayo.
      if (depth === 0) fallback = node;
    }
    return fallback;
  }

  function attachExistingSurvey(root) {
    if (!active || !currentShell || transplanted) return;
    const slot = currentShell.querySelector('#cafe-survey-slot');
    const host = findSurveyHost(root);
    if (!host || !slot || host.contains(currentShell)) return;
    const marker = document.createComment('CAFE v6: posición original de SurveyJS');
    host.parentNode?.insertBefore(marker, host);
    transplantMarker = marker;
    transplanted = host;
    const loading = slot.querySelector('.cafe-survey-loading');
    loading?.remove();
    slot.appendChild(host);
    // El renderer original mantiene en pantalla el ImageComponent a escala
    // absoluta. Ocultar su lienzo SOLO después de recuperar SurveyJS.
    nativeSource = marker.parentElement?.closest('.jspsych-content-wrapper') || null;
    if (nativeSource) nativeSource.classList.add('cafe-native-hidden');
    host.classList.add('cafe-survey-native-host');
    hostScroll = slot;
    diagnostics.surveyFound = true;
    diagnostics.originalQuestions = root.querySelectorAll('.sd-question, .sv-question').length;
    const box = root.getBoundingClientRect();
    diagnostics.surveyVisible = box.width > 0 && box.height > 0;
    diagnostics.error = null;
  }

  function refresh() {
    refreshQueued = false;
    if (!active || !currentShell) return;
    if (transplanted) {
      const r = transplanted.querySelector('.sd-root-modern, .sd-root-default, .sv-root-modern, .sv-root-default');
      if (r) {
        diagnostics.originalQuestions = r.querySelectorAll('.sd-question, .sv-question').length;
        diagnostics.surveyVisible = r.getBoundingClientRect().width > 0 && r.getBoundingClientRect().height > 0;
      }
      return;
    }
    const root = findSurvey();
    if (root) attachExistingSurvey(root);
  }

  function schedule() {
    if (!active || refreshQueued) return;
    refreshQueued = true;
    (global.requestAnimationFrame || (f => Promise.resolve().then(f)))(refresh);
  }

  function setTrialMode(name, imagePath) {
    // Se invoca en on_trial_start antes del render de ExpBuilder.
    destroyShell();
    generation++;
    active = PHASES.has(name);
    const validPath = typeof imagePath === 'string' && IMAGE_RE.test(imagePath);
    stimulus = active && validPath ? imagePath : '';
    diagnostics.currentTrial = active ? name : null;
    diagnostics.stimulus = stimulus || null;
    if (!active) return;
    document.body.classList.add('cafe-ensayo');
    if (!stimulus) {
      diagnostics.error = 'No se recibió ruta de imagen para el ensayo';
      return;
    }
    currentShell = makeShell(stimulus);
    observer = new MutationObserver(schedule);
    observer.observe(document.body, {childList:true, subtree:true});
    schedule();
    // Falla segura: si SurveyJS no aparece (carga fallida o cambio de API),
    // devolver el control al renderizador original en vez de mostrar solo la cara.
    const token = generation;
    global.setTimeout(() => {
      if (token !== generation || !active || diagnostics.surveyFound) return;
      diagnostics.error = 'SurveyJS no se detectó: se restaura la interfaz original';
      console.warn('[CAFE responsive] No se detectó SurveyJS; se usa la presentación original.');
      if (observer) {observer.disconnect(); observer = null;}
      currentShell?.remove(); currentShell = null;
      document.body.classList.remove('cafe-ensayo');
      active = false;
    }, 6000);
  }

  global.CAFEResponsive = Object.freeze({prepareStimuli, setTrialMode, diagnostico: diagnostics});
})(window);
