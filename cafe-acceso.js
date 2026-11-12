/* CAFE 13.5 — acceso público y metas por curso; ninguna acreditación automática.
   Esta configuración de frontend NO es un mecanismo de autenticación. */
(function(win,doc){
  'use strict';
  const query = new URLSearchParams(win.location.search);
  const modalidad = query.get('modalidad') || 'publico';
  const curso = query.get('curso') || '';
  const cursos = win.CAFE_CURSOS || {};
  const has = Object.prototype.hasOwnProperty;
  let error='';
  let metaDocente=null;
  let etiquetaCurso='';
  if(modalidad!=='publico' && modalidad!=='estudiante'){
    error='La modalidad de participación no es válida.';
  }else if(modalidad==='estudiante'){
    if(!curso || !has.call(cursos,curso)){
      error='El enlace del curso no está configurado. Solicita el enlace correcto a tu profesor o profesora.';
    }else{
      const config=cursos[curso];
      metaDocente=Number(config?.meta);
      etiquetaCurso=String(config?.etiqueta||curso);
      if(!Number.isInteger(metaDocente)||metaDocente<1||metaDocente>1192){
        error='La cantidad de evaluaciones configurada para este curso no es válida.';
      }
    }
  }
  // Asegurar que una URL pública con parámetros adicionales no tome por error
  // metas académicas. El identificador del curso se ignora para público general.
  const access=Object.freeze({
    version:'13.5', modalidad:modalidad==='estudiante'?'estudiante':'publico',
    curso:modalidad==='estudiante'?curso:'',
    etiquetaCurso:modalidad==='estudiante'?etiquetaCurso:'',
    metaDocente:modalidad==='estudiante'&&!error?metaDocente:null,
    invalid:Boolean(error), error
  });
  win.CAFEAcceso=access;
  if(error){
    const show=()=>{
      const existing=doc.getElementById('cafe-acceso-error');if(existing)existing.remove();
      const main=doc.createElement('main');main.id='cafe-acceso-error';main.setAttribute('role','alert');
      main.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;background:#edf3f5;font:16px/1.5 system-ui,sans-serif;color:#20343f;';
      const article=doc.createElement('article');article.style.cssText='max-width:560px;padding:28px;background:white;border:1px solid #d9e4e9;border-radius:12px;box-shadow:0 8px 20px #0001;';
      const title=doc.createElement('h1');title.textContent='Enlace de participación no disponible';title.style.cssText='font-size:1.4rem;margin:0 0 12px';
      const paragraph=doc.createElement('p');paragraph.textContent=error;
      const anchor=doc.createElement('a');anchor.href=win.location.pathname;anchor.textContent='Ir a participación general';anchor.style.cssText='color:#155c75';
      article.append(title,paragraph,anchor);main.append(article);doc.body.append(main);
    };
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',show,{once:true});else show();
  }
})(window,document);
