/* CAFE v14.3 — folio final de participación por curso.
   Un código identifica una sesión, pero la acreditación SIEMPRE depende
   de comprobar en el CSV exportado la cantidad de rostros registrados.
   El código se muestra únicamente cuando el guardado remoto final es confirmado.
*/
(function (win) {
  'use strict';
  const EXPERIMENT = '00f08bb8-86d9-424a-ab46-221104610d0c';
  const BASE = 'expbuilder:public:' + EXPERIMENT + ':cafe-v14:folio:v1:';
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

  function advanceAudit(previous, row) {
    const audit = previous || { faces: [], calibrations: 0, ended: false, receipt: null };
    const faces = new Set(audit.faces || []);
    if (validFace(row)) faces.add(row.cafe_imagen || row.ImageComponent_1_stimulus);
    const next = { ...audit, faces: [...faces], calibrations: (audit.calibrations || 0) + (row.cafe_tipo_fila === 'calibracion' ? 1 : 0) };
    if (row.trial_name === 'Ending') {
      next.ended = true;
      next.receipt = row.cafe_codigo_constancia ? {
        code: row.cafe_codigo_constancia, course: row.cafe_constancia_curso,
        courseLabel: row.cafe_etiqueta_curso || row.cafe_constancia_curso,
        meta: row.cafe_constancia_meta, validCount: row.cafe_constancia_rostros_validos,
        calibrationCount: row.cafe_constancia_calibraciones, isTest: row.cafe_constancia_prueba
      } : null;
    }
    return next;
  }
  function prepareEnding(row, audit, opts) {
    if (row.trial_name !== 'Ending' || opts.access?.modalidad !== 'estudiante') return null;
    const access = opts.access;
    const isTest = opts.testMode === true;
    const course = String(access.curso || '');
    const meta = Number(access.metaDocente);
    const validCount = new Set(audit?.faces || []).size;
    const calibrationCount = audit?.calibrations || 0;
    const needed = isTest ? Math.min(2, opts.totalFaces || 3) : meta;
    Object.assign(row, { cafe_constancia_curso: course, cafe_constancia_meta: meta,
      cafe_constancia_rostros_validos: validCount, cafe_constancia_calibraciones: calibrationCount,
      cafe_constancia_prueba: isTest, cafe_constancia_elegible: false });
    // Never block storage of answers just because academic eligibility is not met.
    if (!opts.sessionId || !course || !Number.isInteger(meta) || meta < 1 || meta > 1192 || validCount < needed) return null;
    const code = getOrCreate(String(opts.sessionId), course, isTest);
    Object.assign(row, { cafe_codigo_constancia: code, cafe_constancia_elegible: true,
      cafe_constancia_generada_en: new Date().toISOString() });
    return code;
  }

  win.CAFEConstancias = Object.freeze({
    version:'14.3', prepareEnding, advanceAudit, countFaceResponses, validFace
  });
})(window);
