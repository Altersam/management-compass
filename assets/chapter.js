(() => {
  'use strict';
  const S=Workspace,U=WorkspaceUI,esc=U.escape;
  const profile=S.profile(new URLSearchParams(location.search).get('user')||S.active());
<<<<<<< HEAD
  const active=profile.id;
  const chapter=HANDBOOK.chapters.find(c=>c.id===Number(document.body.dataset.chapter));
  const home=`../index.html?user=${encodeURIComponent(active)}`;
  const link=n=>`module-${String(n).padStart(2,'0')}.html?user=${encodeURIComponent(active)}`;
  const root=document.getElementById('chapterRoot');
  root.innerHTML=`
    <div class="reading-bar"><a href="${home}#modules">← Все разделы</a><span>Профиль: ${esc(profile.name)}</span><a href="${home}#diary">Дневник</a></div>
    <span class="eyebrow">Административная практика · ${chapter.id}</span>
    <h1>${esc(chapter.title)}</h1><p class="lead">${esc(chapter.short)}</p>
    <nav class="reading-nav chapter-tabs" aria-label="Содержание раздела"><a href="#theory">Теория</a><a href="#techniques">Техники</a><a href="#case">Кейс и рефлексия</a></nav>
    <section id="theory" class="chapter-pane">
      <div class="theory-introduction"><h2>Как устроена эта работа</h2><p>${esc(chapter.intro)}</p></div>
      ${Visuals.render(chapter.overviewVisual)}
      <div class="chapter-theory-grid">${chapter.theory.map(([title,text],i)=>`<article class="theory-article"><span class="eyebrow">${i+1} / 3 · основание действий</span><h2>${esc(title)}</h2><p>${esc(text)}</p><p>${esc(chapter.theoryDetails[i])}</p>${i===chapter.coreVisual[1]?Visuals.render(chapter.coreVisual[0]):''}</article>`).join('')}</div>
      <section class="section-block"><h2>Понятия простыми словами</h2><dl class="term-list">${chapter.terms.map(([term,meaning])=>`<div><dt>${esc(term)}</dt><dd>${esc(meaning)}</dd></div>`).join('')}</dl></section>
      <div class="next-action panel"><div><h3>Перейти от объяснения к действию</h3><p>Выберите одну технику под вашу ситуацию, разберите схему и заполните свой рабочий шаблон.</p></div><a class="button primary" href="#techniques">Выбрать технику →</a></div>
      <details class="reference-details"><summary>Частые вопросы по разделу</summary><div class="faq-list">${chapter.faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></details>
    </section>
    <section id="techniques" class="chapter-pane" hidden>
      <div class="section-heading"><h2>Что применить в вашей ситуации?</h2><p>Одна выбранная техника: схема, объяснение шагов, пример и собственный план.</p></div>
      <div class="technique-picker" aria-label="Выбор техники">${chapter.techniques.map(t=>`<a href="#${t.id}" data-technique="${t.id}"><b>${esc(t.name)}</b><span>${esc(t.when)}</span></a>`).join('')}</div>
      <div id="techniquePanel"></div>
      ${chapter.id===8?'<details class="reference-details" id="capacityDetails"><summary>Дополнительно: проверить мощность этапа</summary><div id="calculatorSlot"></div></details>':''}
    </section>
    <section id="case" class="chapter-pane" hidden><div class="section-heading"><h2>Разобрать решение и собственную практику</h2><p>Выберите первый ход, прочитайте последствия и запишите, что это меняет в вашей работе.</p></div><div class="case-grid"></div></section>
    <details class="reference-details related-details"><summary>Связанные ракурсы и дальнейшее чтение</summary><div class="route-steps">${chapter.related.map(n=>`<a href="${link(n)}">${esc(HANDBOOK.chapters[n-1].title)}</a>`).join('')}</div><a href="../sources.html?user=${encodeURIComponent(active)}">Модели и литература →</a></details>
    <footer class="footer"><a href="${home}#modules">← Каталог справочника</a><a href="${home}#diary">Личные записи</a><button class="text-button" id="printPage">Печать открытого раздела</button></footer>`;

  function renderTechnique(t) {
    const holder=document.getElementById('techniquePanel');
    holder.innerHTML=`<article class="panel technique-detail" data-current-technique="${t.id}">
      <span class="eyebrow">Рабочая техника</span><h2>${esc(t.name)}</h2>
      <div class="technique-purpose"><p><b>Когда использовать</b><br>${esc(t.when)}</p><p><b>Почему работает</b><br>${esc(t.why)}</p></div>
      ${Visuals.render(t.visual)}
      <h3>Как выполнить — по шагам</h3><ol class="step-list">${t.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>
      <div class="example-box"><b>Рабочий пример</b><p>${esc(t.example)}</p></div>
      <div class="mistake-box"><b>Не перепутайте</b><p>${esc(t.mistake)}</p></div>
      <p class="technique-check"><b>Проверка результата:</b> ${esc(t.check)}</p>
      <details class="worksheet"><summary>Применить к своей ситуации — открыть рабочий шаблон</summary><form data-tool="${t.id}" class="form-grid">${t.fields.map((f,i)=>`<label>${esc(f)}<textarea name="field${i}" placeholder="Ваши факты и договорённости"></textarea></label>`).join('')}<div class="inline-actions"><button type="submit" class="button primary">Записать результат в дневник</button><span class="draft-status" role="status">Черновик сохраняется при вводе</span></div></form></details>
      <a class="text-button case-link" href="#case">Проверить себя на кейсе →</a>
    </article>`;
    const form=holder.querySelector('form');
    const key=`chapter-${chapter.id}-${t.id}`;
    const draft=S.profile(active).data.worksheets[key]||{};
    for(const [k,v] of Object.entries(draft))if(form.elements[k]&&typeof v==='string')form.elements[k].value=v;
    form.oninput=()=>{const ok=S.update(active,d=>d.worksheets[key]=Object.fromEntries(new FormData(form)));form.querySelector('.draft-status').textContent=ok?'Черновик сохранён в вашем профиле':'Хранилище недоступно: экспортируйте данные на главной';};
    form.onsubmit=e=>{e.preventDefault();const fields=Object.fromEntries(new FormData(form));if(!Object.values(fields).some(v=>v.trim())){U.notify('Добавьте факты своей ситуации.');return;}S.journal(active,{type:'План действия',title:t.name,situation:t.fields.map((f,i)=>`${f}: ${fields[`field${i}`].trim()||'уточнить'}`).join('\n'),learning:`Проверка пользы: ${t.check}`,action:'Первый шаг, ответственный и срок:'});U.notify('Рабочая запись добавлена в дневник.');};
    Visuals.bind(holder);
  }
  let selected=null;
  function navigate(){
    const hash=location.hash.slice(1)||'theory';
    const technique=chapter.techniques.find(t=>t.id===hash);
    const pane=technique||hash==='techniques'?'techniques':hash==='case'?'case':'theory';
    root.querySelectorAll('.chapter-pane').forEach(p=>p.hidden=p.id!==pane);
    root.querySelectorAll('.chapter-tabs a').forEach(a=>{const on=a.hash===`#${pane}`;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(pane==='techniques'){
      const current=technique||chapter.techniques.find(t=>t.id===selected)||chapter.techniques[0];
      if(selected!==current.id){selected=current.id;renderTechnique(current);}
      root.querySelectorAll('[data-technique]').forEach(a=>{const on=a.dataset.technique===selected;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
    }
  }
  window.addEventListener('hashchange',()=>{navigate();document.querySelector('.chapter-tabs').scrollIntoView({block:'start'});});
  CaseUI.render(root.querySelector('.case-grid'),HANDBOOK.cases.filter(c=>c.chapter===chapter.id),active);
  Visuals.bind(root);
  document.getElementById('printPage').onclick=()=>window.print();
  if(chapter.id===8)calculator();
  navigate();

  function calculator(){
    const slot=document.getElementById('calculatorSlot');
    slot.innerHTML=`<section class="calculator"><h3>Хватает ли мощности этапа?</h3><p>Приближённая оценка для однотипных запросов, без колебаний, перерывов и возвратов. Используйте как начало исследования очереди.</p><form class="form-grid" id="capacityForm"><label>Входящих запросов в день<input name="flow" type="number" min="0" step="1" value="40" required></label><label>Людей на этапе<input name="people" type="number" min="1" step="1" value="2" required></label><label>Доступных часов в день на человека<input name="hours" type="number" min="0.1" max="24" step="0.1" value="4" required></label><label>Минут на запрос<input name="minutes" type="number" min="0.1" step="0.1" value="15" required></label><button class="button quiet">Рассчитать</button></form><div class="generated" id="capacityResult" aria-live="polite"></div></section>`;
    const form=document.getElementById('capacityForm'),saved=S.profile(active).data.worksheets.capacity||{};
    for(const [k,v] of Object.entries(saved))if(form.elements[k])form.elements[k].value=v;
    function calculate(){const v=Object.fromEntries(new FormData(form));const capacity=Number(v.people)*Number(v.hours)*60/Number(v.minutes);const flow=Number(v.flow);if(!Number.isFinite(capacity)||capacity<=0)return;const difference=flow-capacity;document.getElementById('capacityResult').textContent=`Теоретическая мощность: ${capacity.toFixed(1)} запросов/день. ${difference>0?`Поток превышает мощность на ${difference.toFixed(1)}: очередь будет расти при этих допущениях.`:difference===0?'Нет резерва на колебания и возвраты.':'Запас мощности есть. Проверьте вариативность, ожидание и переделки.'}`;}
    form.onsubmit=e=>{e.preventDefault();S.update(active,d=>d.worksheets.capacity=Object.fromEntries(new FormData(form)));calculate();};
    calculate();
  }
=======
  const active=profile.id,c=HANDBOOK.chapters.find(c=>c.id===Number(document.body.dataset.chapter));
  const home=`../index.html?user=${encodeURIComponent(active)}`;
  const link=n=>`module-${String(n).padStart(2,'0')}.html?user=${encodeURIComponent(active)}`;
  const root=document.getElementById('chapterRoot');
  root.innerHTML=`<div class="reading-bar"><a href="${home}">← Справочник</a><span>${esc(profile.name)}</span><a href="${home}#diary">Мой дневник</a></div><span class="eyebrow">Административная практика · ${c.id}</span><h1>${esc(c.title)}</h1><p class="lead">${esc(c.short)}</p><nav class="reading-nav" aria-label="Содержание"><a href="#theory">Понять логику</a><a href="#techniques">Что делать</a><a href="#case">Разобрать кейс</a><a href="#questions">Частые вопросы</a></nav><section class="section-block" id="theory"><h2>Понять логику</h2><div class="theory-grid">${c.theory.map(([title,text])=>`<article class="panel theory-card"><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join('')}</div></section><section class="section-block" id="techniques"><h2>Что и как делать</h2>${c.techniques.map(t=>`<article class="panel technique-detail" id="${t.id}"><span class="eyebrow">Пошаговая техника</span><h3>${esc(t.name)}</h3><p><b>Когда:</b> ${esc(t.when)}</p><p><b>Почему работает:</b> ${esc(t.why)}</p><ol class="step-list">${t.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><div class="example-box"><b>Пример</b><p>${esc(t.example)}</p></div><div class="mistake-box"><b>Типичная ошибка</b><p>${esc(t.mistake)}</p></div><p><b>Как проверить пользу:</b> ${esc(t.check)}</p><details class="worksheet" open><summary>Применить к собственной ситуации</summary><form data-tool="${t.id}" class="form-grid">${t.fields.map((f,i)=>`<label>${esc(f)}<textarea name="field${i}" placeholder="Ваши рабочие факты и договорённости"></textarea></label>`).join('')}<div class="inline-actions"><button type="submit" class="button primary">Сохранить результат в дневник</button><span class="draft-status" role="status">Черновик сохраняется автоматически</span></div></form></details></article>`).join('')}</section><div id="calculatorSlot"></div><section class="section-block" id="case"><h2>Кейс и саморефлексия</h2><div class="case-grid"></div></section><section class="section-block" id="questions"><h2>Частые вопросы</h2><div class="faq-list">${c.faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section><section class="section-block"><h2>Связанные ракурсы</h2><div class="route-steps">${c.related.map(n=>`<a href="${link(n)}">${esc(HANDBOOK.chapters[n-1].title)}</a>`).join('')}</div><p class="small">Рабочие формы и полномочия определяются действующими правилами вашей организации.</p></section><footer class="footer"><a href="${home}">← Вернуться к справочнику</a><a href="${home}#diary">Открыть личные записи</a><button class="text-button" id="printPage">Печать</button></footer>`;
  root.querySelectorAll('form[data-tool]').forEach(form=>{const t=c.techniques.find(t=>t.id===form.dataset.tool);const key=`chapter-${c.id}-${t.id}`;const draft=S.profile(active).data.worksheets[key]||{};for(const[k,v]of Object.entries(draft))if(form.elements[k]&&typeof v==='string')form.elements[k].value=v;form.oninput=()=>{const ok=S.update(active,d=>d.worksheets[key]=Object.fromEntries(new FormData(form)));form.querySelector('.draft-status').textContent=ok?'Черновик сохранён в вашем профиле':'Хранилище недоступно: экспортируйте данные на главной';};form.onsubmit=e=>{e.preventDefault();const fields=Object.fromEntries(new FormData(form));if(!Object.values(fields).some(v=>v.trim())){U.notify('Добавьте факты своей ситуации.');return;}S.journal(active,{type:'План действия',title:t.name,situation:t.fields.map((f,i)=>`${f}: ${fields[`field${i}`].trim()||'уточнить'}`).join('\n'),learning:`Проверка пользы: ${t.check}`,action:'Первый шаг, ответственный и срок:'});U.notify('Рабочая запись добавлена в дневник.');};});
  CaseUI.render(root.querySelector('.case-grid'),HANDBOOK.cases.filter(k=>k.chapter===c.id),active);
  document.getElementById('printPage').onclick=()=>window.print();
  if(c.id===8)calculator();
  function calculator(){const slot=document.getElementById('calculatorSlot');slot.innerHTML='<section class="section-block panel calculator"><span class="eyebrow">Модель очереди</span><h2>Хватает ли мощности этапа?</h2><p>Приближённая оценка для однотипных запросов. Не учитывает вариативность, перерывы и возвраты; не является нормой выработки.</p><form class="form-grid" id="capacityForm"><label>Входящих запросов в день<input name="flow" type="number" min="0" step="1" value="40" required></label><label>Людей на этапе<input name="people" type="number" min="1" step="1" value="2" required></label><label>Доступных часов в день на человека<input name="hours" type="number" min="0.1" max="24" step="0.1" value="4" required></label><label>Минут обработки одного запроса<input name="minutes" type="number" min="0.1" step="0.1" value="15" required></label><button class="button quiet">Рассчитать</button></form><div class="generated" id="capacityResult" aria-live="polite"></div></section>';const form=document.getElementById('capacityForm');const key='capacity';const saved=S.profile(active).data.worksheets[key]||{};for(const[k,v]of Object.entries(saved))if(form.elements[k])form.elements[k].value=v;function calculate(){const v=Object.fromEntries(new FormData(form));const capacity=Number(v.people)*Number(v.hours)*60/Number(v.minutes);const flow=Number(v.flow);if(!Number.isFinite(capacity)||capacity<=0)return;const difference=flow-capacity;document.getElementById('capacityResult').textContent=`Теоретическая мощность: ${capacity.toFixed(1)} запросов/день. ${difference>0?`Поток превышает мощность на ${difference.toFixed(1)}: очередь будет расти при этих допущениях.`:difference===0?'Поток равен мощности: нет резерва на колебания и возвраты.':'Теоретический запас есть. Проверьте колебания потока, ожидание и переделки.'}`;}form.onsubmit=e=>{e.preventDefault();S.update(active,d=>d.worksheets[key]=Object.fromEntries(new FormData(form)));calculate();};calculate();}
>>>>>>> fe405c0604a0b1ab41d3f43b71d6a8b379703d35
})();
