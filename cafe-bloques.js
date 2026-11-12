/* CAFE v13.7.1 — checkpoints, 4 calibraciones por 100 y progreso global.
   Mantiene el renderizador nativo y la aleatorización estable por sesión. */
(function (win, doc) {
  'use strict';
  const EMOCIONES = ['Alegría','Tristeza','Enojo','Miedo','Sorpresa'];
  const CALIBRACIONES = Object.freeze([
    {image:'img/calibracion_alegria.svg', emotion:'Alegría'},
    {image:'img/calibracion_tristeza.svg', emotion:'Tristeza'},
    {image:'img/calibracion_enojo.svg', emotion:'Enojo'},
    {image:'img/calibracion_miedo.svg', emotion:'Miedo'},
    {image:'img/calibracion_sorpresa.svg', emotion:'Sorpresa'}
  ]);
  const diag={version:'13.7.1', totalFaces:0, checkpointSize:200, blocks:0, checks:0,
    positions:[], orderedImages:[], currentKind:null, currentBlock:null, selectedStop:false,
    calibrationWindow:100};
  win.CAFEBlocksDiagnostics=diag;

  function hash(seed) {
    let h=2166136261>>>0;
    for (const ch of String(seed)) h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
    return h>>>0;
  }
  function rng(seed){
    let s=hash(seed)||1;
    return ()=>{s+=0x6d2b79f5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  }
  function shuffle(items, random){
    const out=items.slice();
    for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }
  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function calibrationPositions(windowLength, count, random){
    if(count<=0||windowLength<2)return [];
    // Una comprobación en cada sector del tramo. Se evita agrupar cuatro
    // calibraciones y se conserva la variación aleatoria por sesión.
    const positions=[];
    for(let i=0;i<count;i++){
      const center=(i+0.5)*windowLength/count;
      const spread=Math.max(0,windowLength/count*0.23);
      const low=Math.max(i===0?1:positions[i-1]+1,Math.ceil(center-spread));
      const high=Math.min(windowLength-(count-i-1),Math.max(low,Math.floor(center+spread)));
      positions.push(Math.max(low,Math.min(high,low+Math.floor(random()*(high-low+1)))));
    }
    return positions;
  }
  function buildCalibrationPlan(totalFaces, sessionId, config){
    const windowSize=Number(config.calibrationWindowSize??100);
    const requested=Number(config.calibrationsPerWindow??4);
    if(!Number.isInteger(windowSize)||windowSize<10||windowSize>200)throw Error('CAFE v13.3: ventana de calibración inválida');
    if(!Number.isInteger(requested)||requested<0||requested>5)throw Error('CAFE v13.3: número de calibraciones por ventana inválido');
    const plan=new Map();
    let attentionId=0;
    for(let start=0,winIndex=1; start<totalFaces; start+=windowSize, winIndex++){
      const length=Math.min(windowSize,totalFaces-start);
      // En el tramo final se conserva una densidad similar al resto.
      let count=Math.min(requested,Math.round(requested*length/windowSize));
      // Tres rostros de prueba: solo un control, después del primero.
      if(config.testMode===true)count=length>=2&&requested>0?1:0;
      const offsets=config.testMode===true&&count===1?[1]:
        calibrationPositions(length,count,rng(sessionId+'|window|'+winIndex));
      const choices=shuffle(CALIBRACIONES,rng(sessionId+'|window|'+winIndex+'|choices'));
      offsets.forEach((offset,idx)=>{
        const faceIndex=start+offset;
        const choice=choices[idx % choices.length];
        attentionId++;
        if(!plan.has(faceIndex)) plan.set(faceIndex, []);
        plan.get(faceIndex).push({
          cafe_kind:'calibracion',cafe_position:faceIndex,
          cafe_calibration_id:attentionId,
          cafe_calibration_image:choice.image,
          cafe_calibration_emotion:choice.emotion,
          cafe_window:winIndex
        });
      });
    }
    return {plan, windowSize};
  }
  function prepareRows(stimuli, sessionId, config={}){
    if (!Array.isArray(stimuli)||!stimuli.length)throw Error('CAFE v13.3: no hay rostros principales');
    if (!sessionId)throw Error('CAFE v13.3: falta sessionId para preservar la aleatorización');
    const checkpointSize=Number(config.blockSize ?? (config.testMode?2:200));
    if(!Number.isInteger(checkpointSize)||checkpointSize<1||checkpointSize>200)throw Error('CAFE v13.5: tamaño de bloque inválido');
    const acceso=win.CAFEAcceso||{modalidad:'publico',curso:'',metaDocente:null};
    // El requisito por curso es independiente de la frecuencia de los checkpoints.
    // En modo prueba se simula el objetivo en 2 rostros; no se generan créditos.
    const student=acceso.modalidad==='estudiante';
    const metaReal=student?Number(acceso.metaDocente):null;
    const metaEfectiva=student?(config.testMode?Math.min(2,stimuli.length):metaReal):200;
    if(student&&(!Number.isInteger(metaReal)||metaReal<1||metaReal>1192))
      throw Error('CAFE v13.5: meta del curso inválida');
    const random=rng(sessionId+'|CAFE-v13.3-order');
    const ordered=shuffle(stimuli,random);
    if(new Set(ordered.map(x=>x.cafe_stimulus)).size!==ordered.length)
      throw Error('CAFE v13.3: hay rutas duplicadas entre los estímulos. Revisar antes de publicar.');

    const {plan:calibrationPlan, windowSize}=buildCalibrationPlan(ordered.length, sessionId, {
      testMode:Boolean(config.testMode),
      calibrationWindowSize:Number(config.calibrationWindowSize??100),
      calibrationsPerWindow:Number(config.calibrationsPerWindow??config.checksPerBlock??4)
    });

    const rows=[];
    for(let i=0;i<ordered.length;i++){
      const count=i+1;
      const block=Math.floor(i/checkpointSize)+1;
      rows.push({...ordered[i], cafe_kind:'rostro', cafe_block:block, cafe_position:count});
      const extra=calibrationPlan.get(count)||[];
      for(const check of extra){
        rows.push({
          ...check,
          cafe_block:block,
          components_experiment:[], response_components_experiment:[],
          cafe_stimulus:check.cafe_calibration_image
        });
      }
      // Checkpoint de curso siempre exactamente en la meta, incluso si ésta
      // no coincide con un múltiplo del bloque general (p. ej. 75 vs. 200).
      const metaCheckpoint=student&&count===metaEfectiva;
      const regularCheckpoint=count%checkpointSize===0;
      if(count<ordered.length && (regularCheckpoint||metaCheckpoint)){
        rows.push({cafe_kind:'pausa', cafe_block:block, cafe_position:count,
          cafe_meta_alcanzada:student && count>=metaEfectiva,
          cafe_checkpoint_meta:metaCheckpoint,
          components_experiment:[], response_components_experiment:[], cafe_stimulus:'',
          cafe_next_count:Math.min(checkpointSize, ordered.length-count)});
      }
    }

    diag.totalFaces=ordered.length;
    diag.testMode=Boolean(config.testMode);
    diag.modalidad=acceso.modalidad;
    diag.curso=student?acceso.curso:'';
    diag.metaDocente=student?metaReal:null;
    diag.metaEfectiva=metaEfectiva;
    diag.checkpointSize=checkpointSize;
    diag.blocks=Math.ceil(ordered.length/checkpointSize);
    diag.checks=rows.filter(r=>r.cafe_kind==='calibracion').length;
    diag.positions=rows.filter(r=>r.cafe_kind==='calibracion').map(r=>r.cafe_position);
    diag.orderedImages=ordered.slice(0,3).map(r=>r.cafe_stimulus);
    diag.sessionId=sessionId;
    diag.calibrationWindow=windowSize;
    return rows;
  }
  function create(tag,cls,text){const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  function progressNode(current,total,label){
    const section=create('section','cafe-progress');
    const meta=create('div','cafe-progress-meta');
    meta.append(create('span','cafe-progress-label',label), create('span','cafe-progress-count', `${current} / ${total}`));
    const bar=create('div','cafe-progress-bar');
    const fill=create('div','cafe-progress-fill');
    fill.style.width=`${Math.max(0,Math.min(100,(current/Math.max(1,total))*100))}%`;
    fill.setAttribute('aria-hidden','true');
    bar.setAttribute('role','progressbar');
    bar.setAttribute('aria-valuemin','0');
    bar.setAttribute('aria-valuemax',String(total));
    bar.setAttribute('aria-valuenow',String(current));
    bar.setAttribute('aria-label',label);
    bar.append(fill); section.append(meta,bar); return section;
  }
  function injectProgress(display, current, total, label){
    const target=display.querySelector('.cafe-native-survey-card') || display.querySelector('.cafe-block-card');
    if(!target || target.querySelector('.cafe-progress')) return;
    const node=progressNode(current,total,label||'Progreso general');
    const header=target.querySelector('.cafe-native-header');
    if(header && header.nextSibling) target.insertBefore(node, header.nextSibling);
    else target.insertBefore(node, target.firstChild);
  }
  function renderCard(display,sub,title,current,total){
    const root=create('main','cafe-native cafe-blocks');root.id='cafe-native-root';const card=create('article','cafe-native-card cafe-block-card');
    const header=create('header','cafe-native-header');
    header.append(create('span','cafe-native-brand','CAFE · Validación de expresiones faciales'),create('span','cafe-native-phase',sub));
    card.append(header);
    if(Number.isFinite(current)&&Number.isFinite(total)) card.append(progressNode(current,total,'Progreso general'));
    card.append(create('h1','cafe-block-title',title));root.append(card);display.replaceChildren(root);return card;
  }
  const choiceOrderCache=new Map();
  function choicesFor(sessionId){
    // Reutilizar exactamente el mismo orden que ya vio el participante en la tarea principal.
    const original=win.CAFENativeDiagnostics?.emotionOptions;
    if(Array.isArray(original)&&original.length===EMOCIONES.length&&
        original.every(value=>EMOCIONES.includes(value)))return original;
    if(!choiceOrderCache.has(sessionId))choiceOrderCache.set(sessionId,shuffle(EMOCIONES,rng(sessionId+'|CAFE-check-options')));
    return choiceOrderCache.get(sessionId);
  }
  function install(timeline, jsPsych){
    const candidates=[];
    function walk(nodes){for(const node of nodes||[]){if(node?.data?.trial_name==='experiment'&&node.type)candidates.push(node);if(Array.isArray(node?.timeline))walk(node.timeline);}}
    walk(timeline);
    if(candidates.length!==1)throw Error('CAFE v13.3: se esperaba un único ensayo experimental');
    const experimentTrial=candidates[0];
    const faceTrial=experimentTrial.type;
    const session=String(diag.sessionId);
    class CafeBlockTrial {
      static info={name:'cafe-blocks',version:'13.7.1',parameters:{},data:{
        rt:{type:'INT'},cafe_tipo_fila:{type:'STRING'},cafe_bloque:{type:'INT'},
        cafe_calibracion_respuesta:{type:'STRING'},cafe_calibracion_correcta:{type:'BOOL'},
        cafe_decision_bloque:{type:'STRING'},cafe_meta_alcanzada:{type:'BOOL'},
        cafe_modalidad:{type:'STRING'},cafe_curso:{type:'STRING'},cafe_meta_docente:{type:'INT'}}};
      constructor(jsp){this.jsPsych=jsp;}
      trial(display){
        const kind=this.jsPsych.evaluateTimelineVariable('cafe_kind');
        const block=this.jsPsych.evaluateTimelineVariable('cafe_block');
        const position=this.jsPsych.evaluateTimelineVariable('cafe_position');
        diag.currentKind=kind;diag.currentBlock=block;
        if(kind==='rostro'){
          const result=new faceTrial(this.jsPsych).trial(display);
          injectProgress(display, position, diag.totalFaces, 'Progreso general');
          return result;
        }
        const started=performance.now();
        if(kind==='calibracion'){
          const image=this.jsPsych.evaluateTimelineVariable('cafe_calibration_image');
          const correct=this.jsPsych.evaluateTimelineVariable('cafe_calibration_emotion');
          const id=this.jsPsych.evaluateTimelineVariable('cafe_calibration_id');
          const card=renderCard(display,'Comprobación breve','¿Qué emoción expresa este dibujo?',position,diag.totalFaces);
          card.append(create('p','cafe-block-help','Selecciona la emoción que mejor corresponde al dibujo.'));
          const img=create('img','cafe-calibration-image');img.src=image;img.alt='Ilustración esquemática de una expresión emocional';card.append(img);
          const form=create('form','cafe-calibration-form');
          const field=create('fieldset','cafe-calibration-options');field.append(create('legend','cafe-block-sr','Emoción representada'));
          for(const emotion of choicesFor(session)){
            const label=create('label','cafe-calibration-option');const input=create('input');input.type='radio';input.name='cafe-calibracion';input.value=emotion;input.required=true;
            label.append(input,create('span','',emotion));field.append(label);
          }
          const footer=create('footer','cafe-native-footer');const button=create('button','cafe-native-button','Continuar');button.type='submit';footer.append(button);form.append(field,footer);card.append(form);
          form.addEventListener('submit',ev=>{ev.preventDefault();const answer=field.querySelector('input:checked');if(!answer)return;
            button.disabled=true;
            this.jsPsych.finishTrial({rt:Math.round(performance.now()-started),cafe_tipo_fila:'calibracion',
              cafe_calibracion_id:id,cafe_imagen:image,cafe_calibracion_esperada:correct,
              cafe_calibracion_respuesta:answer.value,cafe_calibracion_correcta:answer.value===correct,
              cafe_bloque:block,cafe_posicion_global:position});
          });
          return;
        }
        if(kind==='pausa'){
          const next=this.jsPsych.evaluateTimelineVariable('cafe_next_count');
          // La modalidad y la meta se consultan directamente del acceso activo.
          // Esto evita que una propiedad de diagnostico obsoleta o una sesion
          // recuperada suprima el boton de finalizacion del curso.
          const access=win.CAFEAcceso||{};
          const student=access.modalidad==='estudiante';
          const isTest=win.CAFE_MODO_PRUEBA===true;
          const requestedMeta=Number(access.metaDocente);
          const metaEfectiva=student
            ? (isTest ? Math.min(2,diag.totalFaces||2) : requestedMeta) : 200;
          if(student && (!Number.isInteger(metaEfectiva)||metaEfectiva<1))
            throw Error('CAFE: la meta academica no esta disponible en el punto de control');
          // Explicitar la meta tambien en las herramientas de diagnostico.
          diag.modalidad=student?'estudiante':'publico';
          diag.curso=student?String(access.curso||''):'';
          diag.metaDocente=student?requestedMeta:null;
          diag.metaEfectiva=metaEfectiva;
          const eligible=position>=metaEfectiva;
          // La finalizacion se ofrece al alcanzar la meta y en cualquier
          // checkpoint posterior para no retener a quien ya la cumplio.
          // El publico general solo recibe la opcion en hitos de 200.
          const majorMilestone=position>=200 &&
            Math.floor(position/200)>Math.floor((position-diag.checkpointSize)/200);
          const offerStop=isTest || (eligible && (student || majorMilestone));
          const card=renderCard(display,'Punto de control',
            `Has completado ${position} de ${diag.totalFaces} evaluaciones`,position,diag.totalFaces);
          if(student){
            const course=win.CAFEAcceso?.etiquetaCurso||diag.curso;
            card.append(create('p','cafe-block-help',
              `${course}. Requisito del curso: ${requestedMeta} rostros.`));
            if(isTest){
              card.append(create('p','cafe-block-note',
                'Modo de prueba: este punto de control no acredita participación.'));
            }else if(eligible){
              card.append(create('p','cafe-block-help',
                'Has alcanzado la cantidad indicada por tu profesor o profesora. Puedes continuar evaluando o finalizar tu participación. La acreditación requiere la verificación posterior de los registros recibidos.'));
            }else{
              card.append(create('p','cafe-block-help',
                'Has llegado a un punto de control. Continúa hasta alcanzar el requisito de tu curso.'));
            }
          }else{
            card.append(create('p','cafe-block-help',
              'Has llegado a un punto de control. Puedes continuar con el siguiente grupo de imágenes.'));
          }
          const footer=create('footer','cafe-native-footer cafe-block-pause-actions');
          const cont=create('button','cafe-native-button','Continuar');cont.type='button';
          footer.append(cont);
          let stop;
          if(offerStop){
            stop=create('button','cafe-native-button cafe-block-stop','Finalizar mi participación');
            stop.type='button';footer.append(stop);
          }
          card.append(footer);
          let done=false;
          function finish(decision){
            if(done)return;done=true;cont.disabled=true;if(stop)stop.disabled=true;
            diag.selectedStop=decision==='finalizar';
            jsPsych.finishTrial({rt:Math.round(performance.now()-started),cafe_tipo_fila:'pausa',
              cafe_decision_bloque:decision,cafe_bloque:block,cafe_posicion_global:position,
              cafe_meta_alcanzada:eligible,cafe_modalidad:diag.modalidad,
              cafe_curso:student?String(access.curso||''):'',cafe_meta_docente:student?requestedMeta:null});
          }
          cont.addEventListener('click',()=>finish('continuar'));
          if(stop)stop.addEventListener('click',()=>finish('finalizar'));
          return;
        }
        throw Error('CAFE v13.3: fila desconocida '+kind);
      }
    }
    experimentTrial.type=CafeBlockTrial;
    diag.installed=true;
  }
  win.CAFEBlocks={prepareRows,install};
})(window,document);
