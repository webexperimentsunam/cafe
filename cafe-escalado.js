/* CAFE v8 — UNA sola pantalla de ExpBuilder por ensayo.
 * Nunca se duplican las pantallas informativas ni sus botones.
 * En evaluación se REUBICAN los elementos nativos: ImageComponent y SurveyJS.
 * Las definiciones, validaciones, respuestas y navegación originales se conservan.
 */
(function (global, doc) {
  'use strict';
  const FACES = new Set(['practice', 'experiment']);
  const INFOS = new Set(['Bienvenida', 'Consentimiento', 'no_consent', 'Instructions', 'preparation', 'Ending']);
  const IMAGE_RE = /^img\/[\w\-. ()]+\.(?:jpe?g|png|svg|webp)$/i;
  const diagnostics = {
    version:'8.0', strategy:'single-native-render',
    currentTrial:null, stimulus:null, surveyFound:false, surveyVisible:false,
    originalQuestions:0, originalImageFound:false, nativeOnly:true,
    originalScreensCopied:0, originalImagesDuplicated:0,
    practiceStimuli:0, experimentStimuli:0, error:null
  };
  global.CAFELayoutDiagnostics=diagnostics;
  let shell=null, observer=null, frameQueued=false, generation=0, phase='';
  let surveyNode=null, surveyMarker=null, imageNode=null, imageMarker=null;
  let sourceWrapper=null;
  let oldSurveys=new WeakSet(),oldImages=new WeakSet();

  function prepareStimuli(rows, name) {
    if(!FACES.has(name)||!Array.isArray(rows))return;
    let n=0;
    for(const row of rows){
      const image=row?.['components_'+name]?.find(x=>x?.type==='ImageComponent'&&IMAGE_RE.test(x.stimulus));
      const survey=row?.['response_components_'+name]?.find(x=>x?.type==='SurveyComponent');
      if(!image||!survey)continue;
      row.cafe_stimulus=image.stimulus;
      n++;
    }
    diagnostics[name+'Stimuli']=n;
  }

  function undoMove(node,marker){
    if(!node)return;
    node.classList.remove('cafe-moved-image','cafe-moved-survey');
    if(marker?.parentNode)marker.parentNode.insertBefore(node,marker);
    else node.remove();
    marker?.remove();
  }
  function destroy(){
    ++generation;
    observer?.disconnect();observer=null;frameQueued=false;
    if(sourceWrapper)sourceWrapper.classList.remove('cafe-native-hidden');
    sourceWrapper=null;
    // Restaurar ambos elementos ANTES de quitar la escena de la evaluación.
    undoMove(surveyNode,surveyMarker);undoMove(imageNode,imageMarker);
    surveyNode=null;surveyMarker=null;imageNode=null;imageMarker=null;
    shell?.remove();shell=null;phase='';
    doc.body.classList.remove('cafe-informacion','cafe-ensayo','cafe-formulario');
    diagnostics.surveyFound=false;diagnostics.surveyVisible=false;
    diagnostics.originalQuestions=0;diagnostics.originalImageFound=false;diagnostics.error=null;
  }

  function makeShell(isFace){
    const root=doc.createElement('section');root.id='cafe-evaluation-shell';
    root.className=isFace?'cafe-face-form':'cafe-only-form';
    root.setAttribute('aria-label',isFace?'Evaluación de rostro':'Cuestionario');
    if(isFace){
      const aside=doc.createElement('aside');aside.className='cafe-face-card';
      const imageSlot=doc.createElement('div');imageSlot.className='cafe-native-image-slot';
      aside.appendChild(imageSlot);root.appendChild(aside);
    }
    const card=doc.createElement('main');card.className='cafe-survey-card';
    const slot=doc.createElement('div');slot.id='cafe-survey-slot';
    const message=doc.createElement('p');message.className='cafe-survey-loading';
    message.textContent='Cargando preguntas…';slot.appendChild(message);
    card.appendChild(slot);root.appendChild(card);doc.body.appendChild(root);
    return root;
  }

  function nativeSurveyRoot(){
    for(const node of doc.querySelectorAll('.sd-root-modern,.sd-root-default,.sv-root-modern,.sv-root-default')){
      if(!node.closest('#cafe-evaluation-shell')&&!oldSurveys.has(node))return node;
    }
    return null;
  }
  function surveyHost(root){
    let n=root.parentElement;
    let fallback=n||root;
    for(let i=0;n&&i<7&&n!==doc.body;i++,n=n.parentElement){
      if(n.id&&/survey/i.test(n.id)&&!n.id.startsWith('cafe-'))return n;
      if(n.classList?.contains('jspsych-content-wrapper')||n.classList?.contains('jspsych-content'))break;
      if(i===0)fallback=n;
    }
    return fallback;
  }
  function nativeFaceImg(path){
    const filename=path.split('/').pop();
    if(!filename)return null;
    for(const img of doc.querySelectorAll('img[src]')){
      if(img.closest('#cafe-evaluation-shell')||oldImages.has(img))continue;
      const source=img.getAttribute('src')||'';
      // El navegador puede convertir la ruta relativa en absoluta.
      const simple=source.split(/[?#]/)[0].replace(/%20/g,' ');
      if(simple===path||simple.endsWith('/'+path)||simple.split('/').pop()===filename)return img;
    }
    return null;
  }
  function mountNative(node,slot,what){
    if(!node||!slot||!node.parentNode)return null;
    const marker=doc.createComment('CAFE v8: '+what+' origen');
    node.parentNode.insertBefore(marker,node);
    slot.appendChild(node);
    return marker;
  }
  function attachOriginals(){
    if(!shell||phase!=='form')return;
    if(!surveyNode){
      const root=nativeSurveyRoot();
      if(root){
        const native=surveyHost(root);
        const slot=shell.querySelector('#cafe-survey-slot');
        if(native&&!native.contains(shell)&&slot){
          surveyMarker=mountNative(native,slot,'SurveyJS');
          if(surveyMarker){
            surveyNode=native;native.classList.add('cafe-moved-survey');
            slot.querySelector('.cafe-survey-loading')?.remove();
          }
        }
      }
    }
    if(phase==='form'&&shell.classList.contains('cafe-face-form')&&!imageNode){
      const photo=nativeFaceImg(diagnostics.stimulus||'');
      const slot=shell.querySelector('.cafe-native-image-slot');
      if(photo&&slot){
        imageMarker=mountNative(photo,slot,'ImageComponent');
        if(imageMarker){imageNode=photo;photo.classList.add('cafe-moved-image');}
      }
    }
    // El renderer nativo se oculta solo cuando AMBOS componentes esenciales
    // han sido reubicados; así nunca existe una imagen duplicada al frente.
    const ready=!!surveyNode&&(shell.classList.contains('cafe-only-form')||!!imageNode);
    if(ready&&surveyMarker){
      sourceWrapper=surveyMarker.parentElement?.closest('.jspsych-content-wrapper')
        ||imageMarker?.parentElement?.closest('.jspsych-content-wrapper')||null;
      if(sourceWrapper)sourceWrapper.classList.add('cafe-native-hidden');
      shell.classList.add('cafe-ready');
    }
    const surveyRoot=surveyNode?.querySelector('.sd-root-modern,.sd-root-default,.sv-root-modern,.sv-root-default');
    diagnostics.surveyFound=!!surveyRoot;
    diagnostics.originalImageFound=!!imageNode;
    diagnostics.originalQuestions=surveyRoot?.querySelectorAll('.sd-question,.sv-question').length||0;
    const rect=surveyRoot?.getBoundingClientRect();
    diagnostics.surveyVisible=!!rect&&rect.width>0&&rect.height>0;
    diagnostics.originalScreensCopied=0;
    diagnostics.originalImagesDuplicated=0;
  }
  function refresh(){frameQueued=false;attachOriginals();}
  function schedule(){if(!shell||frameQueued)return;frameQueued=true;
    (global.requestAnimationFrame||((fn)=>global.setTimeout(fn,0)))(refresh);
  }
  function setTrialMode(name,imagePath){
    destroy();
    // jsPsych puede mantener el DOM del ensayo anterior unos milisegundos.
    // Ignorar nodos preexistentes, para no mostrar una cara/encuesta anterior.
    oldSurveys=new WeakSet(doc.querySelectorAll('.sd-root-modern,.sd-root-default,.sv-root-modern,.sv-root-default'));
    oldImages=new WeakSet(doc.querySelectorAll('img[src]'));
    diagnostics.currentTrial=String(name||'');
    diagnostics.stimulus=FACES.has(name)?imagePath||null:null;
    if(INFOS.has(name)){
      // NO copiamos HTML ni botones. Estilizamos el único renderer original.
      phase='info';doc.body.classList.add('cafe-informacion');return;
    }
    if(name==='Demographics'||FACES.has(name)){
      phase='form';
      const isFace=FACES.has(name);
      if(isFace&&!IMAGE_RE.test(imagePath||'')){
        diagnostics.error='Imagen de ensayo no identificada';phase='';return;
      }
      doc.body.classList.add(isFace?'cafe-ensayo':'cafe-formulario');
      shell=makeShell(isFace);
      observer=new MutationObserver(schedule);
      observer.observe(doc.body,{subtree:true,childList:true});
      schedule();
      const myGeneration=generation;
      global.setTimeout(()=>{
        if(myGeneration!==generation||!shell)return;
        if(shell.classList.contains('cafe-ready'))return;
        diagnostics.error='No se hallaron ambos componentes nativos; se restauró la vista de ExpBuilder';
        console.warn('[CAFE v8] Componentes nativos incompletos; restaura renderer original.');
        observer?.disconnect();observer=null;
        if(sourceWrapper)sourceWrapper.classList.remove('cafe-native-hidden');
        sourceWrapper=null;
        undoMove(surveyNode,surveyMarker);undoMove(imageNode,imageMarker);
        surveyNode=null;surveyMarker=null;imageNode=null;imageMarker=null;
        shell.remove();shell=null;doc.body.classList.remove('cafe-ensayo','cafe-formulario');phase='';
      },6000);
    }
  }
  global.CAFEResponsive=Object.freeze({prepareStimuli,setTrialMode,diagnostico:diagnostics});
})(window,document);
