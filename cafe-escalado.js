/* CAFE v7. Diseño adaptable integral, sin reemplazar respuestas de ExpBuilder.
 * - Formularios: reubicar el SurveyJS NATIVO, con sus listeners y validación.
 * - Pantallas informativas: copiar SOLO el contenido visual y enlazar sus
 *   botones a los controles nativos de ExpBuilder.
 * - Ensayos de caras: conservar ImageComponent y SurveyComponent originales.
 */
(function (global, doc) {
  'use strict';
  const FACE_PHASES = new Set(['practice','experiment']);
  const INFO_PHASES = new Set(['Bienvenida','Consentimiento','no_consent','Instructions','preparation','Ending']);
  const IMAGE_RE = /^img\/[\w\-. ()]+\.(?:jpe?g|png|svg|webp)$/i;
  const diag = {
    version:'7.0', strategy:'native-controls-responsive-portal',
    currentTrial:null, stimulus:null, surveyFound:false, surveyVisible:false,
    originalQuestions:0, informationControls:0, infoReady:false,
    practiceStimuli:0, experimentStimuli:0, error:null
  };
  global.CAFELayoutDiagnostics=diag;
  let phase='', generation=0, shell=null, observer=null, scheduled=false;
  let host=null, marker=null, source=null, nativeButtons=[];

  function prepareStimuli(rows,phaseName) {
    if (!FACE_PHASES.has(phaseName) || !Array.isArray(rows)) return;
    const ckey='components_'+phaseName;
    const rkey='response_components_'+phaseName;
    let count=0;
    for (const row of rows) {
      const image=row?.[ckey]?.find(x=>x?.type==='ImageComponent' && IMAGE_RE.test(x.stimulus));
      const survey=row?.[rkey]?.find(x=>x?.type==='SurveyComponent');
      if (!image || !survey) continue;
      row.cafe_stimulus=image.stimulus;
      count++;
    }
    diag[phaseName+'Stimuli']=count;
  }

  function destroyShell() {
    ++generation;
    if (observer) { observer.disconnect(); observer=null; }
    if (source) { source.classList.remove('cafe-native-hidden'); source=null; }
    if (host) {
      host.classList.remove('cafe-survey-native-host');
      if (marker?.parentNode) marker.parentNode.insertBefore(host,marker);
    }
    marker?.remove(); host=null; marker=null;
    shell?.remove();shell=null;nativeButtons=[];
    doc.body.classList.remove('cafe-ensayo','cafe-formulario','cafe-informacion');
    diag.surveyFound=false;diag.surveyVisible=false;diag.originalQuestions=0;
    diag.informationControls=0;diag.infoReady=false;diag.error=null;
  }

  function infoContentFrom(components) {
    const content=doc.createElement('div');content.className='cafe-info-body';
    const input=Array.isArray(components)?components:[];
    for (const component of input) {
      if (component.type==='HtmlComponent') {
        const panel=doc.createElement('div');panel.className='cafe-info-html';
        // Las pantallas se copiaron del HTML original, pero sus medidas
        // absolutas y estilos en línea NO deben imponerse al móvil.
        panel.innerHTML=String(component.stimulus||'');
        for (const el of panel.querySelectorAll('[style],[id]')) {
          el.removeAttribute('style');el.removeAttribute('id');
        }
        for(const br of panel.querySelectorAll('br'))br.replaceWith(doc.createTextNode(' '));
        for (const script of panel.querySelectorAll('script'))script.remove();
        content.appendChild(panel);
      } else if (component.type==='TextComponent') {
        const block=doc.createElement('section');block.className='cafe-info-text';
        const parts=String(component.text||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
        parts.forEach((part,i)=>{
          const element=doc.createElement(i===0 && component.name==='TextComponent_1'?'h1':'p');
          element.textContent=part;block.appendChild(element);
        });
        content.appendChild(block);
      } else if (component.type==='ImageComponent' && IMAGE_RE.test(component.stimulus)) {
        const image=doc.createElement('img');image.src=component.stimulus;
        image.className='cafe-info-logo';image.alt='Identidad gráfica del estudio';
        content.appendChild(image);
      }
    }
    return content;
  }

  function infoShell(components, responses) {
    const root=doc.createElement('section');root.id='cafe-info-shell';
    const card=doc.createElement('main');card.className='cafe-info-card';
    card.appendChild(infoContentFrom(components));
    const controls=doc.createElement('footer');controls.className='cafe-info-controls';
    const buttonDefs=(responses||[]).filter(x=>x.type==='ButtonResponseComponent');
    for (const [index,def] of buttonDefs.entries()) {
      for(const text of def.choices||[]) {
        const button=doc.createElement('button');button.type='button';
        button.className='cafe-info-button'+(/no acepto|salir/i.test(text)?' cafe-secondary':'');
        button.textContent=String(text);
        button.dataset.cafeButtonIndex=String(index);
        button.disabled=true;button.title='Cargando control…';
        controls.appendChild(button);
      }
    }
    card.appendChild(controls);root.appendChild(card);
    doc.body.appendChild(root);
    return root;
  }

  function normalize(s) {return String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('es');}
  function nativeCandidates() {
    // Buscar los controles DOM del plugin, nunca los botones de la copia visual.
    return Array.from(doc.querySelectorAll('button, input[type=button], input[type=submit], [role=button]')).filter(el=>
      !el.closest('#cafe-info-shell, #cafe-evaluation-shell, #jspsych-loading-overlay, #jspsych-captcha-overlay') &&
      !el.closest('.cafe-recovery-dialog')
    );
  }
  function matchNativeButtons() {
    if(phase!=='info' || !shell) return;
    const clones=Array.from(shell.querySelectorAll('.cafe-info-button'));
    if (!clones.length) return;
    const candidates=nativeCandidates();
    const used=new Set();const matches=[];
    for (const clone of clones) {
      const name=normalize(clone.textContent);
      const actual=candidates.find(el=>{
        if(used.has(el))return false;
        const label=el.tagName==='INPUT'?el.value:(el.textContent||el.getAttribute('aria-label'));
        return normalize(label)===name;
      });
      if(!actual)return;
      used.add(actual);matches.push([clone,actual]);
    }
    // Solo ocultar el renderizador original cuando todos los botones existan.
    for(const [clone,actual] of matches) {
      clone.disabled=Boolean(actual.disabled);clone.title='';
      clone.addEventListener('click',()=>{
        if(clone.disabled||actual.disabled)return;
        actual.click();
      });
    }
    nativeButtons=matches;
    source=candidates[0]?.closest('.jspsych-content-wrapper')||doc.querySelector('.jspsych-content-wrapper');
    if(source)source.classList.add('cafe-native-hidden');
    diag.informationControls=matches.length;diag.infoReady=true;diag.error=null;
  }

  function buildSurveyShell(imagePath,isFace) {
    const root=doc.createElement('section');root.id='cafe-evaluation-shell';
    root.className=isFace?'cafe-face-form':'cafe-only-form';
    root.setAttribute('aria-label',isFace?'Evaluación de expresión facial':'Cuestionario');
    if(isFace) {
      const aside=doc.createElement('aside');aside.className='cafe-face-card';
      const image=doc.createElement('img');image.className='cafe-face-image';
      image.setAttribute('draggable','false');image.alt='Fotografía a evaluar';image.src=imagePath;
      aside.appendChild(image);root.appendChild(aside);
    }
    const main=doc.createElement('main');main.className='cafe-survey-card';
    const slot=doc.createElement('div');slot.id='cafe-survey-slot';
    const loading=doc.createElement('p');loading.className='cafe-survey-loading';loading.textContent='Cargando preguntas…';
    slot.appendChild(loading);main.appendChild(slot);root.appendChild(main);doc.body.appendChild(root);
    return root;
  }
  function findSurvey() {
    for (const node of doc.querySelectorAll('.sd-root-modern,.sd-root-default,.sv-root-modern,.sv-root-default')) {
      if(!node.closest('#cafe-evaluation-shell'))return node;
    }
    return null;
  }
  function findSurveyHost(root) {
    let node=root.parentElement;
    let fallback=node||root;
    for (let depth=0;node&&depth<6&&node!==doc.body;depth++,node=node.parentElement) {
      if(node.id && /survey/i.test(node.id) && !node.id.startsWith('cafe-'))return node;
      if(node.classList?.contains('jspsych-content')||node.classList?.contains('jspsych-content-wrapper'))break;
      if(depth===0)fallback=node;
    }
    return fallback;
  }
  function attachSurvey(root) {
    if(!shell || host)return;
    const slot=shell.querySelector('#cafe-survey-slot');
    const native=findSurveyHost(root);
    if(!native||!slot||native.contains(shell)||!native.parentNode)return;
    marker=doc.createComment('CAFE: posición original SurveyJS');
    native.parentNode.insertBefore(marker,native);
    host=native;
    slot.querySelector('.cafe-survey-loading')?.remove();
    slot.appendChild(native);
    host.classList.add('cafe-survey-native-host');
    // Proteger la instancia y los listeners del SurveyJS original.
    source=marker.parentElement?.closest('.jspsych-content-wrapper')||null;
    if(source)source.classList.add('cafe-native-hidden');
    diag.surveyFound=true;
    diag.originalQuestions=root.querySelectorAll('.sd-question,.sv-question').length;
    const rect=root.getBoundingClientRect();
    diag.surveyVisible=rect.width>0&&rect.height>0;
    diag.error=null;
  }
  function refresh() {
    scheduled=false;
    if(!shell)return;
    if(phase==='info') {if(!diag.infoReady)matchNativeButtons();return;}
    if(phase==='form') {
      const root=host?.querySelector('.sd-root-modern,.sd-root-default,.sv-root-modern,.sv-root-default');
      if(root){
        diag.originalQuestions=root.querySelectorAll('.sd-question,.sv-question').length;
        const b=root.getBoundingClientRect();diag.surveyVisible=b.width>0&&b.height>0;
      } else {const fresh=findSurvey();if(fresh)attachSurvey(fresh);}
    }
  }
  function schedule(){if(!shell||scheduled)return;scheduled=true;(global.requestAnimationFrame||function(fn){return global.setTimeout(fn,0);})(refresh);}
  function setTrialMode(name,imagePath,trial) {
    destroyShell();
    diag.currentTrial=String(name||'');
    diag.stimulus=typeof imagePath==='string'?imagePath:null;
    const gen=generation;
    if(FACE_PHASES.has(name)) {
      phase='form';
      if(!IMAGE_RE.test(imagePath||'')) {diag.error='No se recibió imagen válida';return;}
      doc.body.classList.add('cafe-ensayo');
      shell=buildSurveyShell(imagePath,true);
    } else if(name==='Demographics') {
      phase='form';
      doc.body.classList.add('cafe-formulario');
      shell=buildSurveyShell(null,false);
    } else if(INFO_PHASES.has(name)) {
      phase='info';
      const components=Array.isArray(trial?.components)?trial.components:[];
      const responses=Array.isArray(trial?.response_components)?trial.response_components:[];
      doc.body.classList.add('cafe-informacion');
      shell=infoShell(components,responses);
    } else {phase='';return;}
    observer=new MutationObserver(schedule);observer.observe(doc.body,{childList:true,subtree:true});schedule();
    // Ante cambio de estructura en ExpBuilder, no dejar al participante
    // frente a una pantalla sin controles; restaurar la vista original.
    global.setTimeout(()=>{
      if(gen!==generation||!shell)return;
      if((phase==='info' && diag.infoReady)||(phase==='form' && diag.surveyFound))return;
      diag.error='No se detectó el control nativo de ExpBuilder; se recuperó la vista original';
      console.warn('[CAFE adaptable] El control nativo no apareció: restaurando la vista original.');
      if(observer){observer.disconnect();observer=null;}
      shell.remove();shell=null;doc.body.classList.remove('cafe-informacion','cafe-formulario','cafe-ensayo');phase='';
    },6000);
  }
  global.CAFEResponsive=Object.freeze({prepareStimuli,setTrialMode,diagnostico:diag});
})(window,document);
