/* Shared, versioned local storage. Pure factory is also exercised by Node tests. */
const root=globalThis;
  'use strict';
  const KEY = 'management-compass:v1';
  const uid = () => root.crypto?.randomUUID?.() || `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const date = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const DATA_VERSION=3;
  const blank = () => ({dataVersion:DATA_VERSION,favorites:[],journal:[],caseAnswers:{},caseReflections:{},worksheets:{},assessments:{},course:{},experiments:[]});
  function plain(value) { return !!value && typeof value==='object' && !Array.isArray(value); }
  function assertSafe(value){
    if(!value||typeof value!=='object')return;
    for(const key of Object.keys(value)){
      if(['__proto__','prototype','constructor'].includes(key))throw new Error('Недопустимое имя поля.');
      assertSafe(value[key]);
    }
  }
  function migrateProfile(data){
    if(!plain(data))throw new Error('Неверные данные профиля.');
    assertSafe(data);
    if(data.dataVersion!==undefined&&(!Number.isInteger(data.dataVersion)||data.dataVersion<1||data.dataVersion>DATA_VERSION))throw new Error('Неподдерживаемая версия данных профиля.');
    const copy=JSON.parse(JSON.stringify(data));
    return {...blank(),...copy,dataVersion:DATA_VERSION};
  }
  function validateData(d) {
    if (!plain(d) || !Array.isArray(d.journal) || !Array.isArray(d.favorites)) throw new Error('Неполные данные профиля.');
    const migrated=migrateProfile(d);
    if (d.journal.length>10000 || d.favorites.some(x=>!Number.isInteger(x)||x<1||x>10)) throw new Error('Неверный список данных.');
    const entries = d.journal.map(e => {
      if (!plain(e)||!['id','date','type','title','situation','learning','action'].every(k=>typeof e[k]==='string')) throw new Error('Неверный формат записи дневника.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||Number.isNaN(Date.parse(e.date))) throw new Error('Неверная дата записи.');
      if ([e.title,e.situation,e.learning,e.action].some(s=>s.length>100000)) throw new Error('Слишком длинная запись.');
      return {...JSON.parse(JSON.stringify(e)),id:e.id,date:e.date,type:e.type,title:e.title,situation:e.situation,learning:e.learning,action:e.action,rating:Math.min(5,Math.max(1,Number(e.rating)||3)),createdAt:typeof e.createdAt==='string'?e.createdAt:'',updatedAt:typeof e.updatedAt==='string'?e.updatedAt:''};
    });
    const result={...migrated,favorites:[...new Set(d.favorites)],journal:entries};
    for (const key of ['caseAnswers','caseReflections','worksheets','assessments']) {
      if (!plain(migrated[key])) throw new Error(`Неверный раздел ${key}.`);
      result[key]=migrated[key];
    }
    for (const v of Object.values(result.caseReflections)) if(typeof v!=='string')throw new Error('Неверная рефлексия.');
    for (const v of Object.values(result.caseAnswers)) if(!plain(v)||!Number.isInteger(v.choice)||v.choice<0||v.choice>10||typeof v.correct!=='boolean')throw new Error('Неверный ответ.');
    if(d.course!==undefined){
      if(!plain(d.course))throw new Error('Неверный учебный прогресс.');
      const copy=JSON.parse(JSON.stringify(d.course));
      const inspect=value=>{if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){if(['__proto__','prototype','constructor'].includes(key))throw new Error('Недопустимое поле прогресса.');inspect(value[key]);}};
      inspect(copy);result.course=copy;
    }
    if(d.experiments!==undefined){
      if(!Array.isArray(d.experiments))throw new Error('Неверный список действий.');
      result.experiments=d.experiments.map(e=>{
        if(!plain(e)||!['id','action','place','reviewDate'].every(k=>typeof e[k]==='string'))throw new Error('Неверное действие.');
        if(!/^\d{4}-\d{2}-\d{2}$/.test(e.reviewDate)||Number.isNaN(Date.parse(e.reviewDate)))throw new Error('Неверная дата проверки.');
        if(e.outcome&&!['helped','partly','not-helped'].includes(e.outcome))throw new Error('Неверный итог действия.');
        return {...JSON.parse(JSON.stringify(e)),id:e.id,action:e.action,place:e.place,reviewDate:e.reviewDate,topic:Number(e.topic)||null,outcome:e.outcome||null,why:typeof e.why==='string'?e.why:'',journalEntryId:typeof e.journalEntryId==='string'?e.journalEntryId:null,createdAt:typeof e.createdAt==='string'?e.createdAt:'',updatedAt:typeof e.updatedAt==='string'?e.updatedAt:''};
      });
    }
    return result;
  }
  function createStore(adapter) {
    let cache; let persistent=true;
    function load() {
      if(!persistent&&cache)return cache;
      try { const raw=adapter.getItem(KEY);if(raw){const doc=JSON.parse(raw);if(doc.version!==1||!Array.isArray(doc.profiles)||!doc.profiles.length||doc.profiles.some(p=>typeof p.id!=='string'||typeof p.name!=='string'||!plain(p.data)||!Array.isArray(p.data.journal)||!Array.isArray(p.data.favorites)))throw new Error('Неверное хранилище');cache={...doc,profiles:doc.profiles.map(p=>({...p,data:migrateProfile(p.data)}))};} }
      catch (_) { persistent=false; }
      if(!cache)cache={version:1,active:'personal',profiles:[{id:'personal',name:'Мои записи',createdAt:new Date().toISOString(),data:blank()}]};
      return cache;
    }
    function persist(doc) { cache=doc;try{adapter.setItem(KEY,JSON.stringify(doc));persistent=true;}catch(_){persistent=false;}return persistent; }
    function profile(id) { const doc=load();return doc.profiles.find(p=>p.id===id)||doc.profiles.find(p=>p.id===doc.active)||doc.profiles[0]; }
    const api = {
      get persistent(){return persistent;},
      profiles:()=>load().profiles.map(({data,...p})=>p),
      profile:id=>profile(id),
      active:()=>load().active,
      select(id){const doc=load();if(!doc.profiles.some(p=>p.id===id))throw new Error('Профиль не найден');doc.active=id;persist(doc);},
      add(name){if(!String(name).trim())throw new Error('Укажите имя');const doc=load();const p={id:uid(),name:String(name).trim().slice(0,80),createdAt:new Date().toISOString(),data:blank()};doc.profiles.push(p);doc.active=p.id;persist(doc);return p.id;},
      remove(id){const doc=load();if(doc.profiles.length<=1)throw new Error('Оставьте хотя бы один профиль');doc.profiles=doc.profiles.filter(p=>p.id!==id);if(doc.active===id)doc.active=doc.profiles[0].id;persist(doc);return doc.active;},
      update(id, mutate){const doc=load();const p=doc.profiles.find(x=>x.id===id);if(!p)throw new Error('Этот профиль удалён. Откройте справочник заново.');mutate(p.data);return persist(doc);},
      journal(id,entry){const now=new Date().toISOString();const e={id:uid(),date:date(),type:'Рефлексия',title:'Заметка',situation:'',learning:'',action:'',rating:3,createdAt:now,updatedAt:now,...entry};api.update(id,d=>{const i=d.journal.findIndex(x=>x.id===e.id);if(i<0)d.journal.unshift(e);else d.journal[i]=e;});return e;},
      export(id){const p=profile(id);return {format:'management-compass-profile',version:1,exportedAt:new Date().toISOString(),profile:{name:p.name},data:p.data};},
      import(payload){if(!plain(payload)||payload.format!=='management-compass-profile'||payload.version!==1||!plain(payload.profile)||typeof payload.profile.name!=='string')throw new Error('Неверный формат резервной копии');const d=validateData(payload.data);const id=api.add(`${payload.profile.name.slice(0,65)} · импорт`);api.update(id,p=>Object.assign(p,d));return id;},
      importDiary(id,payload){if(payload.format!=='management-compass-diary'||payload.version!==1)throw new Error('Неверный формат дневника');const incoming=validateData({...blank(),journal:payload.journal}).journal;api.update(id,d=>{const ids=new Set(d.journal.map(e=>e.id));d.journal.push(...incoming.filter(e=>{if(ids.has(e.id))return false;ids.add(e.id);return true;}));});},
      validateData,migrateProfile
    };
    load();return api;
  }
  const helpers = {
    escape:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    today:date,
    download(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},
    notify(message){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.append(el);}el.textContent=message;el.classList.add('show');clearTimeout(helpers.timer);helpers.timer=setTimeout(()=>el.classList.remove('show'),3500);}
  };
export {createStore,validateData,blank,migrateProfile,DATA_VERSION,helpers as WorkspaceUI};
