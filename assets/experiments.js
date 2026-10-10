(function(root){
  const labels={helped:'Помогло',partly:'Частично помогло','not-helped':'Не помогло'};
  function list(store,profile){
    const data=store.profile(profile).data,items=[...(data.experiments||[])];
    for(const [id,m] of Object.entries(data.course?.modules||{})){
      if(m.transferEntryId&&m.transfer?.reviewDate&&!items.some(e=>e.journalEntryId===m.transferEntryId)){
        items.push({id:`legacy-${id}-${m.transferEntryId}`,topic:Number(id),action:m.transfer.change||'Проверить своё изменение',place:m.transfer.situation||'',reviewDate:m.transfer.reviewDate,journalEntryId:m.transferEntryId,outcome:null,why:'',createdAt:'',updatedAt:''});
      }
    }
    return items.sort((a,b)=>a.reviewDate.localeCompare(b.reviewDate));
  }
  function save(store,profile,values){
    if(!values.action?.trim()||!values.place?.trim()||!values.reviewDate)throw new Error('Добавьте действие, место и дату.');
    let old=list(store,profile).find(e=>e.id===values.id);const now=new Date().toISOString();
    if(old?.outcome&&(old.action!==values.action.trim()||old.place!==values.place.trim()))old=null;
    const id=old?.id||root.crypto?.randomUUID?.()||`e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item={...(old||{}),...values,id,action:values.action.trim(),place:values.place.trim(),outcome:old?.outcome||null,why:old?.why||'',createdAt:old?.createdAt||now,updatedAt:now};
    if(!old)item.journalEntryId=null;
    const previous=store.profile(profile).data.journal.find(j=>j.id===item.journalEntryId);
    const entry=store.journal(profile,{...(previous||{}),type:'Эксперимент',title:item.action,situation:item.place,learning:previous?.learning||'',action:`Попробую: ${item.action}\nПроверю: ${item.reviewDate}`,updatedAt:now});
    item.journalEntryId=entry.id;
    store.update(profile,d=>{if(!Array.isArray(d.experiments))d.experiments=[];const i=d.experiments.findIndex(e=>e.id===id);if(i<0)d.experiments.push(item);else d.experiments[i]=item;
      if(item.topic){if(!d.course)d.course={};if(!d.course.modules)d.course.modules={};if(!d.course.modules[item.topic])d.course.modules[item.topic]={};d.course.modules[item.topic].experimentId=id;d.course.modules[item.topic].transferEntryId=entry.id;d.course.modules[item.topic].transfer={...(d.course.modules[item.topic].transfer||{}),situation:item.place,change:item.action,reviewDate:item.reviewDate};}
    });return item;
  }
  function review(store,profile,id,outcome,why){
    if(!labels[outcome]||!why.trim())throw new Error('Выберите итог и коротко объясните причину.');
    const item=list(store,profile).find(e=>e.id===id);if(!item)throw new Error('Действие не найдено.');
    item.outcome=outcome;item.why=why.trim();item.updatedAt=new Date().toISOString();
    store.update(profile,d=>{if(!Array.isArray(d.experiments))d.experiments=[];const i=d.experiments.findIndex(e=>e.id===id);if(i<0)d.experiments.push(item);else d.experiments[i]=item;});
    const entry=store.profile(profile).data.journal.find(j=>j.id===item.journalEntryId);
    if(entry)store.journal(profile,{...entry,learning:`${entry.learning?entry.learning+'\n\n':''}Проверка: ${labels[outcome]}. ${item.why}`,updatedAt:item.updatedAt});
    return item;
  }
  function render(container,store,profile){
    const U=WorkspaceUI,esc=U.escape,items=list(store,profile),today=U.today();
    const due=items.filter(e=>!e.outcome&&e.reviewDate<=today),later=items.filter(e=>!e.outcome&&e.reviewDate>today),done=items.filter(e=>e.outcome);
    function rows(values){return values.map(e=>`<li class="experiment-row"><div><time datetime="${esc(e.reviewDate)}">${e.reviewDate<=today&&!e.outcome?'Сегодня · проверить':new Date(e.reviewDate+'T00:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</time><h3>${esc(e.action)}</h3><p>${esc(e.place)}</p>${e.outcome?`<p class="experiment-result"><b>${labels[e.outcome]}</b> · ${esc(e.why)}</p>`:''}</div><details><summary>${e.outcome?'Уточнить вывод':'Что получилось?'}</summary><form data-experiment-review="${esc(e.id)}"><label>Итог<select name="outcome">${Object.entries(labels).map(([id,label])=>`<option value="${id}" ${id===e.outcome?'selected':''}>${label}</option>`).join('')}</select></label><label>Почему?<textarea name="why" required>${esc(e.why||'')}</textarea></label><button class="button quiet">Сохранить вывод</button></form></details></li>`).join('');}
    container.innerHTML=`<section class="experiment-list"><h2>Сегодня</h2>${due.length?`<ul>${rows(due)}</ul>`:'<p class="quiet-note">Нет действий, которые нужно проверить сегодня.</p>'}${later.length?`<h2>Дальше</h2><ul>${rows(later)}</ul>`:''}${done.length?`<details class="experiment-history"><summary>Что уже попробовали</summary><ul>${rows(done)}</ul></details>`:''}</section><details class="new-experiment"><summary>Добавить одно действие</summary><form id="newExperiment"><label>Что попробую изменить?<input name="action" required></label><label>Где?<input name="place" required></label><label>Когда проверю результат?<input name="reviewDate" type="date" required></label><button class="button primary">Запланировать</button></form></details>`;
    container.querySelectorAll('[data-experiment-review]').forEach(f=>{
      const key='experiment-review-'+f.dataset.experimentReview,draft=store.profile(profile).data.worksheets[key];
      if(draft){if(labels[draft.outcome])f.elements.outcome.value=draft.outcome;if(typeof draft.why==='string')f.elements.why.value=draft.why;}
      f.oninput=()=>store.update(profile,d=>d.worksheets[key]=Object.fromEntries(new FormData(f)));
      f.onsubmit=event=>{event.preventDefault();try{review(store,profile,f.dataset.experimentReview,f.elements.outcome.value,f.elements.why.value);store.update(profile,d=>delete d.worksheets[key]);render(container,store,profile);}catch(error){U.notify(error.message);}};
    });
    container.querySelector('#newExperiment').onsubmit=event=>{event.preventDefault();try{save(store,profile,Object.fromEntries(new FormData(event.currentTarget)));render(container,store,profile);}catch(error){U.notify(error.message);}};
  }
  root.Experiments={labels,list,save,review,render};if(typeof module!=='undefined'&&module.exports)module.exports=root.Experiments;
})(typeof globalThis!=='undefined'?globalThis:window);
