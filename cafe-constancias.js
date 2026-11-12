/* CAFE v13.6 — folio final de participación por curso.
   Un código identifica una sesión, pero la acreditación SIEMPRE depende
   de comprobar en el CSV exportado la cantidad de rostros registrados.
   El código se muestra únicamente cuando el guardado remoto final es confirmado.
*/
(function (win) {
  'use strict';
  const EXPERIMENT = '17e49b08-828f-4321-b62d-c040a5c1c3ea';
  const BASE = 'expbuilder:public:' + EXPERIMENT + ':folio:v1:';
  const EMOTIONS = new Set(['Alegría','Tristeza','Enojo','Miedo','Asco','Sorpresa','Neutral']);
  const REQUIRED = ['question1','question2','question3','question4','question5'];
  const CODE_RE = /^(?:CAFE|PRUEBA)-[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/;
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function newCode(isTest) {
    if (!win.crypto || typeof win.crypto.getRandomValues !== 'function') {
      throw new Error('No se puede generar un folio seguro en este navegador. Usa HTTPS.');
    }
    const bytes = new Uint8Array(16);
    win.crypto.getRandomValues(bytes);
    const token = Array.from(bytes, n => ALPHABET[n & 31]).join('');
    return (isTest ? 'PRUEBA-' : 'CAFE-') +
      token.match(/.{1,4}/g).join('-');
  }
  function getOrCreate(sessionId, course, isTest) {
    const key = BASE + sessionId;
    let previous = null;
    try { previous = JSON.parse(win.localStorage.getItem(key) || 'null'); } catch (_) {}
    if (previous && previous.course === course && previous.isTest === isTest &&
        CODE_RE.test(String(previous.code || ''))) {
      return previous.code;
    }
    const code = newCode(isTest);
    win.localStorage.setItem(key, JSON.stringify({code,course,isTest}));
    return code;
  }
  function readAnswers(data) {
    const v = data?.SurveyComponent_1_response;
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try { const parsed = JSON.parse(v); return parsed && typeof parsed === 'object' ? parsed : null; }
      catch (_) {return null;}
    }
    return null;
  }
  function validFace(row) {
    if (row?.trial_name !== 'experiment' || row.cafe_tipo_fila !== 'rostro') return false;
    const image = String(row.cafe_imagen || row.ImageComponent_1_stimulus || '');
    if (!/^img\/stimuli\/.+\.(?:jpg|jpeg|png|webp)$/i.test(image)) return false;
    const a = readAnswers(row);
    if (!a || !REQUIRED.every(q => Object.prototype.hasOwnProperty.call(a,q))) return false;
    if (!['question1','question2','question3','question4'].every(q =>
      Number.isInteger(Number(a[q])) && Number(a[q]) >= 1 && Number(a[q]) <= 7)) return false;
    return EMOTIONS.has(String(a.question5));
  }
  function countFaceResponses(rows) {
    const unique = new Set();
    for (const row of rows) {
      if (validFace(row)) unique.add(row.cafe_imagen || row.ImageComponent_1_stimulus);
    }
    return unique.size;
  }

  function prepareForExport(trials, opts) {
    const access = opts.access || {};
    if (access.modalidad !== 'estudiante') return null;
    if (!Array.isArray(trials) || !opts.sessionId) throw new Error('Faltan datos para la constancia.');
    const isTest = opts.testMode === true;
    const course = String(access.curso || '');
    const meta = Number(access.metaDocente);
    if (!course || !Number.isInteger(meta) || meta < 1 || meta > 1192)
      throw new Error('La configuración del curso no es válida.');

    const validCount = countFaceResponses(trials);
    // En modo de prueba el requisito se simula con dos rostros. El folio PRUEBA
    // nunca acredita puntos y está marcado de forma explícita en el CSV.
    const needed = isTest ? Math.min(2, opts.totalFaces || 3) : meta;
    if (validCount < needed)
      throw new Error(`Aún faltan respuestas válidas para concluir: ${validCount} de ${needed}.`);

    const finalRow = [...trials].reverse().find(row => row.trial_name === 'Ending');
    if (!finalRow) throw new Error('Falta el registro de finalización para emitir el folio.');
    const code = getOrCreate(String(opts.sessionId), course, isTest);
    const calibrationCount = trials.filter(row => row.cafe_tipo_fila === 'calibracion').length;
    const receipt = Object.freeze({
      code, course, courseLabel: String(access.etiquetaCurso || course), meta,
      validCount, calibrationCount, isTest
    });
    // Los campos viven en la fila Ending del CSV FINAL; no se agrega un ensayo
    // ficticio ni se altera el total de rostros reales. Si la exportación falla,
    // la constancia NO se muestra aunque exista el código local provisional.
    Object.assign(finalRow, {
      cafe_codigo_constancia:code,
      cafe_constancia_curso:course,
      cafe_constancia_meta:meta,
      cafe_constancia_rostros_validos:validCount,
      cafe_constancia_calibraciones:calibrationCount,
      cafe_constancia_prueba:isTest,
      cafe_constancia_generada_en:new Date().toISOString()
    });
    return receipt;
  }

  win.CAFEConstancias = Object.freeze({
    version:'13.6', prepareForExport, countFaceResponses, validFace
  });
})(window);
