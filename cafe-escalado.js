/* CAFE v9 — presentación sin renderes duplicados.
 * Informativas: texto desde definiciones ExpBuilder y BOTONES NATIVOS movidos,
 * una sola pantalla visible, con restauración segura si el plugin no termina de cargar.
 * Encuestas: se mueven el SurveyJS y la imagen NATIVOS, sin replicarlos.
 * La navegación, las respuestas y Firebase permanecen idénticos.
 */
(function (global, doc) {
  'use strict';
  const FACES = new Set(['practice', 'experiment']);
  const INFOS = new Set(['Bienvenida', 'Consentimiento', 'no_consent', 'Instructions', 'preparation', 'Ending']);
  const IMAGE_RE = /^img\/[\w\-. ()]+\.(?:jpe?g|png|svg|webp)$/i;
  const diagnostics = {
    version:'9.0', strategy:'one-visible-screen-native-buttons',
    currentTrial:null, stimulus:null, surveyFound:false, surveyVisible:false,
    originalQuestions:0, originalImageFound:false, nativeOnly:true,
    originalScreensCopied:0, originalImagesDuplicated:0, infoReady:false, informationControls:0,
    practiceStimuli:0, experimentStimuli:0, error:null
  };
  global.CAFELayoutDiagnostics=diagnostics;
  let shell=null, observer=null, frameQueued=false, generation=0, phase='';
  let surveyNode=null, surveyMarker=null, imageNode=null, imageMarker=null;
  let sourceWrapper=null;
  let oldSurveys=new WeakSet(),oldImages=new WeakSet(),oldButtons=new WeakSet();
  let infoButtonMoves=[];

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
  function infoContentFrom(components) {
    const content=doc.createElement('div');content.className='cafe-info-body';
    for(const component of (Array.isArray(components)?components:[])){
      if(component.type==='HtmlComponent'){
        const panel=doc.createElement('div');panel.className='cafe-info-html';
        panel.innerHTML=String(component.stimulus||'');
        // Los estilos incrustados del lienzo de ExpBuilder no son adaptables.
        for(const el of panel.querySelectorAll('[style],[id]')){el.removeAttribute('style');el.removeAttribute('id');}
        for(const script of panel.querySelectorAll('script'))script.remove();
        for(const br of panel.querySelectorAll('br'))br.replaceWith(doc.createTextNode(' '));
        content.appendChild(panel);
      }else if(component.type==='TextComponent'){
        const block=doc.createElement('section');block.className='cafe-info-text';
        const parts=String(component.text||'').split(/\n\s*\n/).map(t=>t.trim()).filter(Boolean);
        for(const [i,part] of parts.entries()){
          const el=doc.createElement(i===0&&component.name==='TextComponent_1'?'h1':'p');
          el.textContent=part;block.appendChild(el);
        }
        content.appendChild(block);
      }else if(component.type==='ImageComponent'&&IMAGE_RE.test(component.stimulus||'')){
        const img=doc.createElement('img');img.src=component.stimulus;
        img.className='cafe-info-logo';img.alt='Imagen del estudio';content.appendChild(img);
      }
    }
    return content;
  }
  function nativeButtons(){
    return Array.from(doc.querySelectorAll('button,input[type=button],input[type=submit],[role=button]'))
      .filter(el=>!el.closest('#cafe-info-shell,#cafe-evaluation-shell,#jspsych-loading-overlay,#jspsych-captcha-overlay,.cafe-recovery-dialog')&&!oldButtons.has(el));
  }
  function normalized(text){return String(text||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('es');}
  function createInfoShell(trial){
    const root=doc.createElement('section');root.id='cafe-info-shell';
    const card=doc.createElement('main');card.className='cafe-info-card';
    card.appendChild(infoContentFrom(trial?.components));
    const controls=doc.createElement('footer');controls.className='cafe-info-controls';
    const buttons=(Array.isArray(trial?.response_components)?trial.response_components:[])
      .filter(c=>c?.type==='ButtonResponseComponent').flatMap(c=>c.choices||[]);
    for(const text of buttons){
      const cell=doc.createElement('div');cell.className='cafe-info-control-cell';
      cell.dataset.choice=String(text);controls.appendChild(cell);
    }
    card.appendChild(controls);root.appendChild(card);doc.body.appendChild(root);
    return root;
  }
  function attachInfo(){
    if(!shell||phase!=='info'||shell.classList.contains('cafe-ready'))return;
    const cells=Array.from(shell.querySelectorAll('.cafe-info-control-cell'));
    if(!cells.length)return;
    const candidates=nativeButtons(),used=new Set(),matches=[];
    for(const cell of cells){
      const name=normalized(cell.dataset.choice);
      const button=candidates.find(x=>!used.has(x)&&normalized(x.tagName==='INPUT'?x.value:(x.textContent||x.getAttribute('aria-label')) )===name);
      if(!button)return;
      used.add(button);matches.push([cell,button]);
    }
    const owner=matches[0][1].closest('.jspsych-content-wrapper');
    // No ocultar ni quitar nada hasta que TODOS los botones se hayan encontrado.
    for(const [cell,button] of matches){
      const marker=doc.createComment('CAFE v9 botón nativo');
      button.parentNode.insertBefore(marker,button);cell.appendChild(button);
      button.classList.add('cafe-native-info-button');
      infoButtonMoves.push([button,marker]);
    }
    sourceWrapper=owner;
    if(sourceWrapper)sourceWrapper.classList.add('cafe-native-hidden');
    shell.classList.add('cafe-ready');
    diagnostics.infoReady=true;diagnostics.informationControls=matches.length;
  }
  function destroy(){
    ++generation;
    observer?.disconnect();observer=null;frameQueued=false;
    if(sourceWrapper)sourceWrapper.classList.remove('cafe-native-hidden');
    sourceWrapper=null;
    for(const [button,marker] of infoButtonMoves){
      button.classList.remove('cafe-native-info-button');
      if(marker.parentNode)marker.parentNode.insertBefore(button,marker);
      else button.remove();
      marker.remove();
    }
    infoButtonMoves=[];
    // Restaurar ambos elementos ANTES de quitar la escena de la evaluación.
    undoMove(surveyNode,surveyMarker);undoMove(imageNode,imageMarker);
    surveyNode=null;surveyMarker=null;imageNode=null;imageMarker=null;
    shell?.remove();shell=null;phase='';
    doc.body.classList.remove('cafe-informacion','cafe-ensayo','cafe-formulario');
    diagnostics.surveyFound=false;diagnostics.surveyVisible=false;
    diagnostics.originalQuestions=0;diagnostics.originalImageFound=false;diagnostics.error=null;
    diagnostics.infoReady=false;diagnostics.informationControls=0;
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
    if(!shell)return;
    if(phase==='info'){attachInfo();return;}
    if(phase!=='form')return;
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
  function setTrialMode(name,imagePath,trial){
    destroy();
    // jsPsych puede mantener el DOM del ensayo anterior unos milisegundos.
    // Ignorar nodos preexistentes, para no mostrar una cara/encuesta anterior.
    oldSurveys=new WeakSet(doc.querySelectorAll('.sd-root-modern,.sd-root-default,.sv-root-modern,.sv-root-default'));
    oldImages=new WeakSet(doc.querySelectorAll('img[src]'));
    oldButtons=new WeakSet(doc.querySelectorAll('button,input[type=button],input[type=submit],[role=button]'));
    diagnostics.currentTrial=String(name||'');
    diagnostics.stimulus=FACES.has(name)?imagePath||null:null;
    if(INFOS.has(name)){
      phase='info';doc.body.classList.add('cafe-informacion');
      shell=createInfoShell(trial||{});
      observer=new MutationObserver(schedule);
      observer.observe(doc.body,{subtree:true,childList:true});
      schedule();
      const myGeneration=generation;
      global.setTimeout(()=>{
        if(myGeneration!==generation||!shell||shell.classList.contains('cafe-ready'))return;
        diagnostics.error='Controles originales no encontrados; se conserva la pantalla de ExpBuilder';
        console.warn('[CAFE v9] No se encontraron los botones nativos. Se conserva la vista original.');
        observer?.disconnect();observer=null;
        shell.remove();shell=null;doc.body.classList.remove('cafe-informacion');phase='';
      },5000);
      return;
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
