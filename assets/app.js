(() => {
  'use strict';
  const S=Workspace,U=WorkspaceUI,esc=U.escape,chapters=HANDBOOK.chapters;
  const $=id=>document.getElementById(id);
  let active=S.profile(new URLSearchParams(location.search).get('user')||S.active()).id;
  let editing=null;
  const data=()=>S.profile(active).data;
  const href=p=>`${p}?user=${encodeURIComponent(active)}`;
  const modulePath=n=>`modules/module-${String(n).padStart(2,'0')}.html`;
  const modeLink=document.querySelector('.mode-link');
  function status(){const ok=S.persistent;$('saveState').textContent=ok?'● Автосохранение на этом устройстве':'● Хранилище недоступно: используйте экспорт перед закрытием';if(modeLink)modeLink.href=`index.html?user=${encodeURIComponent(active)}`;}
  function save(mutate){S.update(active,mutate);status();stats();}
  function profiles(){ $('profileSelect').innerHTML=S.profiles().map(p=>`<option value="${esc(p.id)}" ${p.id===active?'selected':''}>${esc(p.name)}</option>`).join('');$('profileNameLabel').textContent=S.profile(active).name;const url=new URL(location.href);url.searchParams.set('user',active);history.replaceState(null,'',url);$('navigatorLink').href=href('navigator.html');document.querySelectorAll('.resource-card, .faq-list a').forEach(a=>{const url=new URL(a.href);url.searchParams.set('user',active);a.href=url;});status(); }
  function stats(){const d=data();$('statModules').textContent=d.favorites.length;$('statNotes').textContent=d.journal.length;$('statCases').textContent=Object.keys(d.caseAnswers).filter(k=>HANDBOOK.cases.some(c=>c.id===k)).length;const last=[...d.journal].sort((a,b)=>b.date.localeCompare(a.date))[0];$('statDate').textContent=last?new Date(`${last.date}T00:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'Пока нет';}
  function resetDiary(){editing=null;$('diaryForm').reset();$('diaryForm').elements.date.value=U.today();$('ratingValue').value='3';$('diaryForm').querySelector('[type=submit]').textContent='Сохранить запись';$('cancelEdit')?.remove();}
  function switchTo(id){S.select(id);active=id;profiles();renderModules();route();cases();diary();resetDiary();restoreDrafts();stats();}
  $('profileSelect').onchange=e=>switchTo(e.target.value);
  $('addProfile').onclick=()=>{const name=prompt('Имя личного профиля:');if(name?.trim()){switchTo(S.add(name));U.notify('Новый профиль создан.');}};
  $('deleteProfile').onclick=()=>{if(S.profiles().length<2){U.notify('Оставьте хотя бы один профиль.');return;}if(confirm(`Удалить «${S.profile(active).name}» вместе с записями?`)){switchTo(S.remove(active));U.notify('Профиль удалён.');}};
  let libraryMode='chapters';
  function renderModules(){
    const grid=$('moduleGrid');
    grid.innerHTML=`<div class="library-controls"><div class="library-switch" aria-label="Способ просмотра"><button type="button" data-library-mode="chapters">По разделам</button><button type="button" data-library-mode="techniques">По техникам</button></div><label class="search-label">Найти объяснение или инструмент<input class="module-search" id="moduleSearch" type="search" placeholder="Например: SMART, очередь, делегирование"></label><label class="favorite-filter"><input id="favoritesOnly" type="checkbox"> Только избранное</label></div><p class="library-count" id="libraryCount" aria-live="polite"></p><div class="module-grid-inner"></div>`;
    const holder=grid.querySelector('.module-grid-inner');
    function draw(){
      const query=$('moduleSearch').value.toLowerCase().trim();
      const favoritesOnly=$('favoritesOnly').checked;
      const entries=libraryMode==='chapters'?chapters.map(c=>({chapter:c})):chapters.flatMap(c=>c.techniques.map(t=>({chapter:c,technique:t})));
      const visible=entries.filter(({chapter:c,technique:t})=>{
        if(favoritesOnly&&!data().favorites.includes(c.id))return false;
        const search=t?[c.title,t.name,t.when,t.why,Visuals.definitions[t.visual].title].join(' '):[c.title,c.short,c.intro,...c.tags,...c.theory.flat(),...c.terms.flat(),...c.techniques.map(t=>t.name)].join(' ');
        return search.toLowerCase().includes(query);
      });
      holder.innerHTML=visible.length?visible.map(({chapter:c,technique:t})=>`<article class="module-card ${t?'atlas-card':''}" style="--accent:${c.color}"><div class="module-head"><span class="module-num">${String(c.id).padStart(2,'0')}</span><div><span class="atlas-context">${t?esc(c.title):'Теория · схемы · практика'}</span><h3>${esc(t?t.name:c.title)}</h3><p>${esc(t?t.when:c.short)}</p></div></div><div class="module-meta"><span>${t?esc(Visuals.definitions[t.visual].title):'3 объяснения'}</span>${t?'':'<span>3 визуальные техники</span>'}</div><div class="module-actions"><a class="module-link" href="${href(modulePath(c.id))}${t?'#'+t.id:''}">${t?'Схема и шаги →':'Читать раздел →'}</a><button class="text-button favorite" data-id="${c.id}" aria-pressed="${data().favorites.includes(c.id)}">${data().favorites.includes(c.id)?'★':'☆'} <span>${data().favorites.includes(c.id)?'В избранном':'В избранное'}</span></button></div></article>`).join(''):'<p class="no-results">Ничего не найдено. Измените слово или выключите фильтр избранного.</p>';
      $('libraryCount').textContent=`${libraryMode==='chapters'?'Разделов':'Техник'}: ${visible.length}. ${libraryMode==='chapters'?'В каждом сохранена теория и показана логика действий.':'Откройте одну технику, чтобы увидеть схему и рабочий пример.'}`;
      grid.querySelectorAll('[data-library-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.libraryMode===libraryMode)));
      holder.querySelectorAll('.favorite').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.id);save(d=>d.favorites=d.favorites.includes(id)?d.favorites.filter(n=>n!==id):[...d.favorites,id]);draw();});
    }
    $('moduleSearch').oninput=draw;$('favoritesOnly').onchange=draw;
    grid.querySelectorAll('[data-library-mode]').forEach(b=>b.onclick=()=>{libraryMode=b.dataset.libraryMode;draw();});
    draw();
  }
  function route(){WorkingNavigator.mount({select:$('problemSelect'),result:$('routeResult'),store:S,profile:active});}
  function cases(){
    const selector=$('caseSelect'),previous=selector.value;
    selector.innerHTML=HANDBOOK.cases.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('');
    if(HANDBOOK.cases.some(c=>c.id===previous))selector.value=previous;
    CaseUI.render($('caseGrid'),HANDBOOK.cases,active,()=>{stats();diary();status();});
    function show(){document.querySelectorAll('#caseGrid [data-case]').forEach(c=>c.hidden=c.dataset.case!==selector.value);}
    selector.onchange=show;show();
  }
  function diary(){
    const experimentRoot=$('workingExperiments');if(experimentRoot)Experiments.render(experimentRoot,S,active);
    const select=$('diaryFilter'),old=select.value;
    const types=[...new Set(['Решение',...data().journal.map(e=>e.type)])];
    select.innerHTML='<option value="all">Все записи</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    if(types.includes(old))select.value=old;
    const q=$('diarySearch').value.toLowerCase().trim();
    const entries=data().journal.filter(e=>(select.value==='all'||e.type===select.value)&&[e.title,e.situation,e.learning,e.action].join(' ').toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
    $('diaryList').innerHTML=entries.length?entries.map(e=>`<article class="diary-entry"><div class="entry-meta"><span class="entry-type">${esc(e.type)}</span><span>${esc(e.date)} · самооценка ${esc(e.rating)}/5</span></div><h3>${esc(e.title)}</h3><p><b>Ситуация:</b> ${esc(e.situation)}</p>${e.learning?`<p><b>Вывод:</b> ${esc(e.learning)}</p>`:''}${e.action?`<p><b>Следующий шаг:</b> ${esc(e.action)}</p>`:''}<div class="entry-actions"><button class="text-button edit-entry" data-id="${esc(e.id)}">Редактировать</button> <button class="text-button delete-entry" data-id="${esc(e.id)}">Удалить</button></div></article>`).join(''):'<div class="empty-state">Записей не найдено. Запишите наблюдение, вывод и следующий шаг — или измените фильтр.</div>';
    $('diaryList').querySelectorAll('.delete-entry').forEach(b=>b.onclick=()=>{if(!confirm('Удалить эту запись?'))return;save(d=>d.journal=d.journal.filter(e=>e.id!==b.dataset.id));if(editing===b.dataset.id)resetDiary();diary();});
    $('diaryList').querySelectorAll('.edit-entry').forEach(b=>b.onclick=()=>{
      resetDiary();const e=data().journal.find(x=>x.id===b.dataset.id);editing=e.id;const f=$('diaryForm');
      if(![...f.elements.type.options].some(o=>o.value===e.type))f.elements.type.add(new Option(e.type,e.type));
      for(const k of ['date','type','title','situation','learning','action','rating'])f.elements[k].value=e[k];
      $('ratingValue').value=e.rating;f.querySelector('[type=submit]').textContent='Сохранить изменения';
      const cancel=document.createElement('button');cancel.type='button';cancel.id='cancelEdit';cancel.className='text-button';cancel.textContent='Отменить редактирование';cancel.onclick=()=>{save(d=>delete d.worksheets.diaryDraft);resetDiary();};f.append(cancel);f.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    });
  }
  $('diarySearch').oninput=diary;$('diaryFilter').onchange=diary;
  $('diaryForm').onsubmit=e=>{e.preventDefault();const f=e.currentTarget;const existing=data().journal.find(x=>x.id===editing);const entry={...(existing||{}),date:f.elements.date.value,type:f.elements.type.value,title:f.elements.title.value.trim(),situation:f.elements.situation.value.trim(),learning:f.elements.learning.value.trim(),action:f.elements.action.value.trim(),rating:Number(f.elements.rating.value),updatedAt:new Date().toISOString()};if(!entry.title||!entry.situation){U.notify('Добавьте заголовок и факты ситуации.');return;}S.journal(active,entry);save(d=>delete d.worksheets.diaryDraft);resetDiary();diary();stats();status();U.notify('Запись сохранена.');};
  $('diaryForm').addEventListener('input',()=>save(d=>d.worksheets.diaryDraft={...Object.fromEntries(new FormData($('diaryForm'))),editing:editing||''}));
  $('ratingRange').oninput=e=>$('ratingValue').value=e.target.value;
  $('weeklyPrompt').onclick=()=>{resetDiary();const f=$('diaryForm');f.elements.type.value='Итог недели';f.elements.title.value='Обзор недели';f.elements.situation.value='Какие результаты получены?\nГде ожидания не совпали с фактами?';f.elements.learning.value='Что повторялось и почему?\nКакая моя привычная реакция помогла / помешала?';f.elements.action.value='Одно изменение на следующую неделю:\nПо какому факту и когда оценю пользу:';f.elements.title.focus();};
  const toolForms=['taskForm','talkForm'];
  function restoreDrafts(){toolForms.forEach(id=>{const f=$(id);f.reset();const saved=data().worksheets[id]||{};for(const [k,v]of Object.entries(saved)){if(f.elements[k]&&typeof v==='string')f.elements[k].value=v;}$((id==='taskForm'?'task':'talk')+'Output').hidden=true;});const draft=data().worksheets.diaryDraft;if(draft){const f=$('diaryForm');if(typeof draft.type==='string'&&![...f.elements.type.options].some(o=>o.value===draft.type))f.elements.type.add(new Option(draft.type,draft.type));for(const k of ['date','type','title','situation','learning','action','rating'])if(typeof draft[k]==='string')f.elements[k].value=draft[k];$('ratingValue').value=f.elements.rating.value;editing=data().journal.some(e=>e.id===draft.editing)?draft.editing:null;if(editing){f.querySelector('[type=submit]').textContent='Сохранить изменения';const cancel=document.createElement('button');cancel.type='button';cancel.id='cancelEdit';cancel.className='text-button';cancel.textContent='Отменить редактирование';cancel.onclick=()=>{save(d=>delete d.worksheets.diaryDraft);resetDiary();};f.append(cancel);}}}
  toolForms.forEach(id=>$(id).addEventListener('input',()=>{const v=Object.fromEntries(new FormData($(id)));save(d=>d.worksheets[id]=v);}));
  function generated(formId,outputId,lines){const f=$(formId);f.onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(f));const output=$(outputId);output.querySelector('p').textContent=lines.map(([title,k])=>`${title}: ${values[k]?.trim()||'уточнить'}`).join('\n');output.hidden=false;};}
  generated('taskForm','taskOutput',[['Результат','result'],['Ответственный','owner'],['Срок','deadline'],['Качество / приёмка','quality'],['Ресурс / зависимость','dependency']]);generated('talkForm','talkOutput',[['Факт','fact'],['Общий результат','goal'],['Интересы и ограничения','interests'],['Варианты','options']]);
  document.querySelectorAll('.save-generated').forEach(b=>b.onclick=()=>{S.journal(active,{type:'План действия',title:b.dataset.kind,situation:b.closest('.generated').querySelector('p').textContent,action:'Согласовать следующий шаг и способ проверки результата.'});diary();stats();status();U.notify('Черновик добавлен в дневник.');});
  document.querySelectorAll('.copy-generated').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.closest('.generated').querySelector('p').textContent);U.notify('Скопировано.');}catch(_){U.notify('Выделите текст и скопируйте его вручную.');}});
  $('exportProfile').onclick=()=>U.download('management-compass-profile.json',JSON.stringify(S.export(active),null,2));
  $('exportDiary').onclick=()=>U.download('management-compass-diary.json',JSON.stringify({format:'management-compass-diary',version:1,journal:data().journal},null,2));
  $('importProfileButton').onclick=()=>$('importProfile').click();
  $('importProfile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('Размер резервной копии превышает 5 МБ.');const p=JSON.parse(await file.text());if(p.format==='management-compass-diary'){S.importDiary(active,p);diary();stats();status();}else switchTo(S.import(p));U.notify('Данные импортированы.');}catch(err){U.notify(`Импорт отменён: ${err.message}`);}finally{e.target.value='';}};
  const faq=document.querySelector('.faq-list');chapters.forEach(c=>c.faq.forEach(([q,a])=>{const el=document.createElement('details');el.innerHTML=`<summary>${esc(q)}</summary><p>${esc(a)} <a href="${href(modulePath(c.id))}">Подробнее →</a></p>`;el.dataset.extraFaq='true';faq.append(el);}));
  window.addEventListener('storage',()=>{if(!S.profiles().some(p=>p.id===active)){switchTo(S.active());return;}stats();diary();});
  profiles();renderModules();route();cases();diary();resetDiary();restoreDrafts();stats();
})();
