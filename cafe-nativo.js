/* CAFE v11 — Port del patron jsPsych NATIVO utilizado en Juicios Morales.
 * No interviene el DOM del plugin ExpBuilder: reemplaza el renderer de nueve
 * ensayos manteniendo el mismo timeline, fuentes de estimulos y on_finish.
 */
(function (win, doc) {
  'use strict';
  const TRIALS = new Set([
    'Bienvenida','Consentimiento','Demographics','no_consent','Instructions',
    'practice','preparation','experiment','Ending'
  ]);
  const FACE = new Set(['practice','experiment']);
  const diag = {version:'11.1',strategy:'native-jspsych',installed:[],rendered:0,
    lastTrial:null,lastImage:null,lastQuestions:0,submitted:0,errors:[],
    practiceStimuli:0,experimentStimuli:0};
  win.CAFENativeDiagnostics = diag;
  const element = (tag,cls,text) => {
    const e=doc.createElement(tag);if(cls)e.className=cls;
    if(text!==undefined)e.textContent=String(text);return e;
  };
  const values = q => (q.choices||[]).map(choice => typeof choice==='object'
    ? {value:String(choice.value ?? choice.text ?? ''),text:String(choice.text ?? choice.value ?? '')}
    : {value:String(choice),text:String(choice)});
  const allQuestions = component => {
    const survey=component?.survey_json||{};
    const pages=(survey.pages||[]).flatMap(page=>page.elements||[]);
    return pages.length ? pages : survey.elements||[];
  };
  const asPoint = e=>{const r=e.getBoundingClientRect();return {
    coordinates:JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}),
    size:JSON.stringify({width:Math.round(r.width),height:Math.round(r.height)})
  };};

  // El selector existente de 3 items depende de cafe_stimulus.
  // Anota la ruta sin borrar ImageComponent ni reescribir el SurveyComponent.
  function prepareStimuli(rows,name){
    if(!FACE.has(name)||!Array.isArray(rows))return;
    for(const row of rows){
      const components=row['components_'+name]||[];
      const responses=row['response_components_'+name]||[];
      const image=components.filter(x=>x?.type==='ImageComponent');
      const survey=responses.filter(x=>x?.type==='SurveyComponent');
      if(image.length!==1||survey.length!==1)throw Error('CAFE: estímulo sin imagen/encuesta única en '+name);
      row.cafe_stimulus=image[0].stimulus;
    }
    diag[name+'Stimuli']=rows.length;
  }
  win.CAFEResponsive={prepareStimuli}; // adaptador mínimo para los datos existentes

  function buildRoot(name){
    const root=element('main','cafe-native');root.id='cafe-native-root';root.lang='es-MX';
    root.dataset.trial=name;
    return root;
  }
  function buildCard(root,title,sub){
    const card=element('article','cafe-native-card');
    const header=element('header','cafe-native-header');
    header.append(element('span','cafe-native-brand','CAFE · Validación de expresiones faciales'),
      element('span','cafe-native-phase',sub||''));
    card.append(header);
    root.append(card);return card;
  }
  function renderInfo(card,components,name){
    const content=element('div','cafe-native-content');
    content.classList.add('cafe-native-content-'+name.toLowerCase());
    for(const c of components){
      if(c.type==='ImageComponent'){
        const img=element('img','cafe-native-logos');img.src=c.stimulus;
        img.alt='Logotipos institucionales';content.append(img);
      } else if(c.type==='TextComponent'){
        const s=element('section','cafe-native-text');
        const paragraphs=String(c.text||'').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
        for(let i=0;i<paragraphs.length;i++){
          let t=paragraphs[i];const lines=t.split(/\n+/);
          if(name==='Bienvenida'&&c.name==='TextComponent_1'){
            s.append(element(i===0?'h1':'h2','cafe-native-welcome-head',t));
          }else if(i===0&&c.name==='TextComponent_1'){
            s.append(element('h1','cafe-native-title',t));
          }else{
            const p=element('p','cafe-native-paragraph');
            lines.forEach((line,j)=>{if(j)p.append(doc.createElement('br'));p.append(doc.createTextNode(line));});
            s.append(p);
          }
        }
        content.append(s);
      }else if(c.type==='HtmlComponent'){
        const html=element('section','cafe-native-html');
        html.innerHTML=String(c.stimulus||'');
        for(const node of html.querySelectorAll('[style],[id]')){
          node.removeAttribute('style');node.removeAttribute('id');
        }
        for(const script of html.querySelectorAll('script'))script.remove();
        for(const br of Array.from(html.querySelectorAll('br')))br.replaceWith(doc.createTextNode(' '));
        content.append(html);
      }else{throw Error('CAFE: tipo de componente no soportado en '+name+': '+c.type);}
    }
    card.append(content);return content;
  }
  function infoData(components,responses,selected,button,root){
    const out={response:selected};
    for(const c of components){
      out[c.name+'_type']=c.type;
      if(c.type==='TextComponent')out[c.name+'_text']=c.text;
      else if(c.type==='ImageComponent')out[c.name+'_stimulus']=c.stimulus;
      else if(c.type==='HtmlComponent')out[c.name+'_stimulus']=c.stimulus;
    }
    for(const c of responses){
      out[c.name+'_type']=c.type;
      out[c.name+'_response']=c===button?selected:null;
    }
    return out;
  }
  function renderButtons(card,responses,components,root,finish){
    const footer=element('footer','cafe-native-footer');
    for(const comp of responses){
      if(comp.type!=='ButtonResponseComponent')throw Error('CAFE: se esperaba botón en pantalla informativa');
      for(const choice of comp.choices||[]){
        const button=element('button','cafe-native-button',choice);button.type='button';
        if(/no acepto|regresar|salir/i.test(choice))button.classList.add('cafe-native-secondary');
        button.addEventListener('click',()=>{
          footer.querySelectorAll('button').forEach(b=>b.disabled=true);
          finish(infoData(components,responses,choice,comp,root));
        });
        footer.append(button);
      }
    }
    card.append(footer);
  }

  // México: 32 entidades federativas (INEGI), no 32 estados: CDMX es entidad.
  const ENTIDADES_MX = Object.freeze([
    'Aguascalientes','Baja California','Baja California Sur','Campeche',
    'Chiapas','Chihuahua','Ciudad de México','Coahuila de Zaragoza','Colima',
    'Durango','Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco',
    'Michoacán de Ocampo','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla',
    'Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco',
    'Tamaulipas','Tlaxcala','Veracruz de Ignacio de la Llave','Yucatán','Zacatecas'
  ]);
  function normalizedSurveyQuestions(component,face){
    const source=allQuestions(component);
    if(face){
      // La primera escala de práctica venía marcada como opcional en el JSON.
      // Se requiere la respuesta igual que en los ensayos principales.
      return source.map(q=>q.name==='question1'&&q.type==='rating'?{...q,isRequired:true}:q);
    }
    // Reparar el error original: dos preguntas con nombre question8.
    // NO modificar el JSON de ExpBuilder: corregir la clave en el resultado.
    return source.map(q=>{
      const label=String(q.title||'');
      if(q.name==='question5'&&/estado naciste/i.test(label)){
        return {...q,type:'dropdown',choices:[...ENTIDADES_MX,'No nací en México']};
      }
      if(q.name==='question8'&&/mayor parte del tiempo entre los 5 y 15/i.test(label)){
        // Más usable que 33 botones; se conserva la clave original question8.
        return {...q,type:'dropdown',choices:[...ENTIDADES_MX,'Otro país']};
      }
      if(q.name==='question8'&&/lengua materna/i.test(label)){
        return {...q,name:'question8_lengua_materna'};
      }
      return q;
    });
  }
  // Orden de emociones CONTRABALANCEADO entre sesiones y estable al reanudar.
  // La semilla proviene del sessionId existente en ExpBuilder.
  const emotionOrderCache=new Map();
  function emotionOptions(q){
    const options=values(q);
    const session=String(win.CAFEBatchDiagnostics?.sessionId||win.JSPSYCH_SESSION_ID||'CAFE-sin-session-id');
    const key=session+'|'+options.map(v=>v.value).join('|');
    if(!emotionOrderCache.has(key)){
      let hash=2166136261>>>0;
      for(let i=0;i<key.length;i++)hash=Math.imul(hash^key.charCodeAt(i),16777619)>>>0;
      const ordered=options.slice();
      for(let i=ordered.length-1;i>0;i--){
        hash^=hash<<13;hash^=hash>>>17;hash^=hash<<5;
        const j=(hash>>>0)%(i+1);
        [ordered[i],ordered[j]]=[ordered[j],ordered[i]];
      }
      emotionOrderCache.set(key,ordered);
    }
    const ordered=emotionOrderCache.get(key);
    diag.emotionOptions=ordered.map(v=>v.value);
    diag.emotionSessionId=session;
    return ordered;
  }
  function todayLocalISO(){
    const now=new Date();
    const p=n=>String(n).padStart(2,'0');
    return now.getFullYear()+'-'+p(now.getMonth()+1)+'-'+p(now.getDate());
  }
  function isDemographicBirthDate(q){
    return q.type==='text'&&q.name==='question1'&&/fecha de nacimiento/i.test(String(q.title||''));
  }

  function renderQuestion(q,index,face){
    const field=element('fieldset','cafe-native-question');
    const legend=element('legend','cafe-native-label',q.title||q.name);
    if(q.isRequired){const mark=element('span','cafe-native-required',' *');legend.append(mark);}
    field.append(legend);
    const controlName='cafe-q-'+index;
    let inputs=[];
    if(q.type==='rating'){
      const min=Number(q.rateMin??1),max=Number(q.rateMax??5);
      if(!Number.isInteger(min)||!Number.isInteger(max)||max<min||max-min>20)throw Error('Escala no compatible: '+q.name);
      const legend=element('div','cafe-native-scale-ends');
      legend.append(element('span','',q.minRateDescription||''),element('span','',q.maxRateDescription||''));
      field.append(legend);
      const grid=element('div','cafe-native-scale');grid.style.setProperty('--cafe-options',String(max-min+1));
      for(let value=min;value<=max;value++){
        const label=element('label','cafe-native-value');
        const input=element('input','');input.type='radio';input.name=controlName;
        input.value=String(value);input.setAttribute('aria-label',(q.title||q.name)+': '+value);
        const text=element('span','',value);
        label.append(input,text);grid.append(label);inputs.push(input);
      }
      field.append(grid);
    }else if(q.type==='radiogroup'){
      const group=element('div','cafe-native-options');
      const ordered=face&&q.name==='question5'?emotionOptions(q):values(q);
      for(const [i,choice] of ordered.entries()){
        const label=element('label','cafe-native-radio');
        const input=element('input');input.type='radio';input.name=controlName;input.value=choice.value;
        label.append(input,element('span','',choice.text));group.append(label);inputs.push(input);
      }
      field.append(group);
    }else if(q.type==='dropdown'){
      const select=element('select','cafe-native-select');select.name=controlName;
      const blank=element('option','', 'Selecciona una opción');blank.value='';select.append(blank);
      for(const ch of values(q)){const o=element('option','',ch.text);o.value=ch.value;select.append(o);}
      field.append(select);inputs=[select];
    }else if(q.type==='text'){
      const input=element('input','cafe-native-input');
      input.type=isDemographicBirthDate(q)?'date':'text';input.name=controlName;
      if(input.type==='date'){input.max=todayLocalISO();input.setAttribute('aria-label','Fecha de nacimiento');}
      input.autocomplete='off';field.append(input);inputs=[input];
    }else{throw Error('CAFE: tipo de pregunta no soportado: '+q.type);}
    if(q.defaultValue!==undefined&&q.defaultValue!==null){
      for(const input of inputs){if(input.type==='radio')input.checked=String(input.value)===String(q.defaultValue);
        else input.value=String(q.defaultValue);}
    }
    return {field,inputs,name:q.name,question:q};
  }
  function readQuestion(info){
    const selected=info.inputs.find(el=>el.type==='radio'?el.checked:true);
    if(!selected||String(selected.value).trim()==='')return null;
    return info.question.type==='rating'?Number(selected.value):selected.value;
  }
  function renderSurvey(card,surveyComponent,finish,face){
    const questions=normalizedSurveyQuestions(surveyComponent,face);
    const form=element('form','cafe-native-form');form.noValidate=true;
    const inner=element('div','cafe-native-survey-scroll');
    if(!face)inner.append(element('h1','cafe-native-survey-title','Cuestionario sociodemográfico'));
    else{
      const intro=surveyComponent.survey_json?.title||'Observa la imagen y responde de acuerdo con tu primera impresión.';
      inner.append(element('h1','cafe-native-survey-title',intro));
    }
    const records=questions.map((q,i)=>{
      const info=renderQuestion(q,i,face);inner.append(info.field);return info;
    });
    const message=element('p','cafe-native-error');message.role='alert';message.hidden=true;
    inner.append(message);form.append(inner);
    const footer=element('footer','cafe-native-footer');
    const submit=element('button','cafe-native-button',face?'Completar':'Continuar');
    submit.type='submit';footer.append(submit);form.append(footer);card.append(form);
    diag.lastQuestions=questions.length;
    form.addEventListener('submit',ev=>{
      ev.preventDefault();const answers={};const missing=[];
      for(const record of records){const value=readQuestion(record);
        if((value===null||(record.question.type==='text'&&isDemographicBirthDate(record.question)&&record.inputs[0]&&!record.inputs[0].checkValidity()))&&record.question.isRequired){missing.push(record);record.field.classList.add('cafe-native-missing');}
        else {record.field.classList.remove('cafe-native-missing');if(value!==null)answers[record.name]=value;}
      }
      if(missing.length){message.hidden=false;message.textContent='Contesta las preguntas obligatorias antes de continuar.';
        missing[0].field.scrollIntoView({block:'center',behavior:'smooth'});
        missing[0].inputs[0]?.focus({preventScroll:true});return;}
      submit.disabled=true;message.hidden=true;
      finish({[surveyComponent.name+'_type']:surveyComponent.type,
        [surveyComponent.name+'_response']:answers,
        [surveyComponent.name+'_coordinates']:asPoint(card).coordinates,
        [surveyComponent.name+'_size']:asPoint(card).size});
    });
    return form;
  }
  function renderFace(root,components,responses,name,finish){
    const images=components.filter(c=>c.type==='ImageComponent');
    const surveys=responses.filter(c=>c.type==='SurveyComponent');
    if(images.length!==1||surveys.length!==1)throw Error('CAFE: ensayo requiere exactamente una imagen y un SurveyJS');
    const wrap=element('div','cafe-native-evaluation');
    const aside=element('aside','cafe-native-face-panel');
    const img=element('img','cafe-native-face');img.src=images[0].stimulus;img.alt='Fotografía de rostro infantil';
    aside.append(img);wrap.append(aside);
    const card=element('section','cafe-native-survey-card');
    renderSurvey(card,surveys[0],result=>{
      const out={...result,cafe_imagen:images[0].stimulus,
        cafe_orden_emociones:JSON.stringify(diag.emotionOptions||[]),
        [images[0].name+'_type']:'ImageComponent',
        [images[0].name+'_stimulus']:images[0].stimulus,
        [images[0].name+'_coordinates']:asPoint(img).coordinates,
        [images[0].name+'_size']:asPoint(img).size};
      finish(out);
    },true);
    wrap.append(card);root.append(wrap);diag.lastImage=images[0].stimulus;
  }
  function renderDemographics(root,responses,finish){
    if(responses.length!==1||responses[0].type!=='SurveyComponent')throw Error('Cuestionario sociodemográfico cambiado');
    const card=buildCard(root,'','Datos generales');
    card.classList.add('cafe-native-demographics');
    renderSurvey(card,responses[0],finish,false);
  }
  function install(timeline){
    const installed=[];
    function walk(items){
      for(const parent of items||[]){
        if(!Array.isArray(parent?.timeline))continue;
        for(const node of parent.timeline){
          const name=node?.data?.trial_name;
          if(!TRIALS.has(name))continue;
          const isFace=FACE.has(name);
          const componentVar=isFace?'components_'+name:'components';
          const responseVar=isFace?'response_components_'+name:'response_components';
          const earlier=node.on_finish;
          class CafeNativeTrial {
            // jsPsych 8 advierte si falta `data`; jsPsych 9 lo exige.
            // Es solo el esquema de metadatos, NO modifica el objeto de respuestas
            // que se entrega a finishTrial ni los nombres de las columnas.
            static info={name:'cafe-native-'+name.toLowerCase().replace(/_/g,'-'),
              version:'11.1',parameters:{},
              data: isFace ? {
                rt:{type:'INT'},
                SurveyComponent_1_response:{type:'OBJECT'},
                cafe_imagen:{type:'STRING'},
                cafe_orden_emociones:{type:'STRING'}
              } : name==='Demographics' ? {
                rt:{type:'INT'},
                SurveyComponent_1_response:{type:'OBJECT'}
              } : {
                rt:{type:'INT'},
                response:{type:'STRING'}
              }};
            constructor(jsPsych){this.jsPsych=jsPsych;}
            trial(display){
              const begin=performance.now();
              const components=this.jsPsych.evaluateTimelineVariable(componentVar);
              const responses=this.jsPsych.evaluateTimelineVariable(responseVar);
              if(!Array.isArray(components)||!Array.isArray(responses))throw Error('Variables sin resolver: '+name);
              const root=buildRoot(name);
              display.replaceChildren(root);diag.lastTrial=name;diag.rendered++;
              let completed=false;
              const finish=(payload)=>{
                if(completed)return;completed=true;diag.submitted++;
                const data={rt:Math.round(performance.now()-begin),...payload};
                this.jsPsych.finishTrial(data);
              };
              if(isFace)renderFace(root,components,responses,name,finish);
              else if(name==='Demographics')renderDemographics(root,responses,finish);
              else{const card=buildCard(root,'',name==='Bienvenida'?'Bienvenida':name==='Ending'?'Finalización':'');
                renderInfo(card,components,name);renderButtons(card,responses,components,root,finish);}
            }
          }
          node.type=CafeNativeTrial;
          // Mantener intactos los on_start y on_finish de ExpBuilder,
          // incluidos sus saltos de consentimiento y su guardado.
          node.on_finish=earlier;
          installed.push(name);
        }
        walk(parent.timeline);
      }
    }
    walk(timeline);
    if(installed.length!==9||new Set(installed).size!==9)throw Error('CAFE: se esperaban nueve tipos originales, encontrados '+installed.join(', '));
    diag.installed=installed;
  }
  win.CAFENative={install,prepareStimuli};
})(window,document);
