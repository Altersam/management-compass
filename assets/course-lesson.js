(() => {
  'use strict';
  const C=CourseUI,{M,esc}=C;
  const requested=Number(new URLSearchParams(location.search).get('module'))||1;
  const module=COURSE.modules.find(m=>m.id===requested)||COURSE.modules[0];
  const reference=HANDBOOK.chapters[module.id-1];
  const chapter={...reference,theory:reference.theory.map(([,text],i)=>[module.blockTitles[i],text])},questions=COURSE.questions[module.id];
  const root=document.getElementById('lessonRoot');
  const legacyCase=HANDBOOK.cases.find(c=>c.chapter===module.id);
  const entryAppeals={
    1:['Сохраняет все обещания за счёт личного усилия.','Делает столкнувшиеся обязательства явными.','Быстро освобождает место в календаре.'],
    2:['Связывает наблюдение с моментом критической зависимости.','Использует привычную регулярную сверку.','Подтверждает, что запрос действительно отправлен.'],
    3:['Подчёркивает ожидание инициативы.','Снимает нагрузку согласований.','Передаёт право действовать вместе с понятными границами.'],
    4:['Избегает обвинения без установленного нарушения.','Предупреждает возможное влияние до выбора.','Показывает серьёзность требования объективности.'],
    5:['Сразу делает нужный выбор и срок понятными.','Сохраняет подробный контекст переписки.','Повышает видимость проблемы для участников.'],
    7:['Использует проверяемый факт из журнала.','Подтверждает пригодный продукт и его приёмку.','Показывает активность исполнителя.'],
    8:['Исследует основное время ожидания.','Даёт небольшую, но конкретную экономию операции.','Подчёркивает общий приоритет скорости.'],
    9:['Обучение выглядит привычной поддержкой нового порядка.','Строгость требования кажется способом закрепления.','Устраняет противоречие между объявленным правилом и повседневной практикой.'],
    10:['Опирается на улучшившуюся цифру.','Рассматривает показатель вместе с контекстом и доступностью.','Учитывает возможность ухудшения работы.']
  };
  const entrance=module.id===6?{
    id:'entry-6',title:'Нужный эксперт — в другом подразделении',scenario:'Ваш результат зависит от эксперта другого подразделения. У него есть обязательство того же срока, а вашу задачу его команда не считает приоритетной. Вы не можете дать эксперту прямое поручение или изменить его ресурс.',prompt:'Что сделаете сначала?',answer:2,options:[
      {text:'Повторно провести совещание с тем же составом, чтобы ещё раз договориться.',appeal:'Совещание кажется безопасным способом сохранить диалог и добиться согласия.',analysis:'Оно может прояснить позиции, но не создаёт отсутствующих полномочий изменить приоритет и ресурс. После выяснения ограничения нужен подготовленный выбор.'},
      {text:'Направить эксперту ещё один срочный запрос и подчеркнуть важность срока.',appeal:'Ясное сообщение может улучшить понимание важности вашей задачи.',analysis:'Это воздействие на коммуникацию; оно не снимает конкурирующее обязательство эксперта и не даёт ему новый ресурс.'},
      {text:'Уточнить общий результат и ограничение, подготовить варианты с последствиями и запросить выбор у владельца приоритета.',appeal:'Связывает рабочий анализ с тем, кто вправе принять необходимое решение.',analysis:'Эскалация должна передавать не сырую жалобу, а варианты и цену выбора. После решения обновляют роли, сроки и контроль передачи.'}
    ]
  }:{id:`entry-${module.id}`,title:legacyCase.title,scenario:legacyCase.text,prompt:legacyCase.question,answer:legacyCase.answer,options:legacyCase.options.map((text,i)=>({text,appeal:entryAppeals[module.id][i],analysis:legacyCase.feedback[i]}))};
  C.mount();
  document.querySelector('[data-course-nav="course"]').classList.add('active');
  const state=()=>M.moduleState(C.data(),module.id);
  function refreshProgress(){const r=M.report(C.data(),module.id,questions);const percent=document.getElementById('modulePercent');if(!percent)return;percent.textContent=`${r.progress}%`;const box=percent.closest('.module-progress');box.querySelector('span').textContent=r.mastered?'Модуль освоен':'Личный учебный путь';box.querySelector('i').style.width=`${r.progress}%`;}
  const mutate=fn=>{const saved=C.save(d=>fn(M.ensure(d,module.id),d));refreshProgress();return saved;};
  function go(step){location.hash=step;}
  function acknowledge(step,next){mutate(m=>{if(!m.visited.includes(step))m.visited.push(step);});go(next);}
  function phase(){const hash=location.hash.slice(1)||'intro';if(/^theory-[0-2]$/.test(hash))return {step:'theory',block:Number(hash.slice(-1)),hash};return {step:COURSE.steps.some(([s])=>s===hash)?hash:'intro',block:0,hash:hash==='theory'?'theory-0':hash};}
  function render(){
    const current=phase();
    C.save(d=>{M.ensure(d).last={module:module.id,step:current.hash};if(current.step==='connections')M.mark(d,module.id,'connections');});
    const report=M.report(C.data(),module.id,questions),m=state();
    document.title=`Тема ${module.id}. ${module.title} — Практика управления`;
    root.innerHTML=`<div class="lesson-breadcrumb"><a href="${C.link('index.html#course')}">← Карта курса</a><span>Тема ${module.id}/10 · ${esc(module.lens)}</span><a href="${C.link(`modules/module-${String(module.id).padStart(2,'0')}.html`)}">Рабочий справочник ↗</a></div><div class="lesson-title"><div><span class="eyebrow">Учебный модуль</span><h1>${esc(module.title)}</h1><p>${esc(module.why)}</p></div><div class="module-progress" aria-label="Прогресс модуля"><b id="modulePercent">${report.progress}%</b><span>${report.mastered?'Модуль освоен':'Личный учебный путь'}</span><div class="progress-track"><i style="width:${report.progress}%"></i></div></div></div><div class="lesson-layout"><aside class="lesson-outline"><nav aria-label="Учебные шаги">${COURSE.steps.map(([key,title],i)=>`<a href="#${key==='theory'?'theory-0':key}" class="${key===current.step?'active':''}" ${key===current.step?'aria-current="step"':''}><span>${i+1}</span>${title}</a>`).join('')}</nav><p class="small">Освоение: учебные шаги + план в дневнике + мини-тест не ниже 4/5.</p><a class="text-button" href="${C.link('workspace.html#diary')}">Мой управленческий дневник →</a></aside><section id="lessonContent" class="lesson-content"></section></div>`;
    ({intro:renderIntro,theory:()=>renderTheory(current.block),technique:renderTechnique,practice:renderPractice,transfer:renderTransfer,check:renderCheck,connections:renderConnections}[current.step])();
    Visuals.bind(root);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function content(markup){document.getElementById('lessonContent').innerHTML=markup;}
  function renderIntro(){
    const m=state();
    content(`<span class="eyebrow">1 · проблема и первая попытка</span><h2>Зачем мне эта тема?</h2><div class="panel entry-situation"><h3>${esc(entrance.title)}</h3><p>${esc(entrance.scenario)}</p><button type="button" id="tryEntry" class="button primary">Попробовать решить до изучения</button></div><div id="entryAttempt" ${m.diagnostic?'':'hidden'}>${C.question(entrance,m.diagnostic?.choice??m.diagnosticDraft,'entry')}<button type="button" id="saveEntry" class="button quiet">Разобрать мой первый выбор</button><div id="entryFeedback">${m.diagnostic?C.feedback(entrance,m.diagnostic.choice):''}</div></div><section class="learning-goals"><h2>Что я научусь делать</h2><ul>${module.goals.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></section><div class="topic-map"><h3>Карта темы</h3>${chapter.theory.map(([title],i)=>`<a href="#theory-${i}">${module.id}.${i+1} · ${esc(title)} →</a>`).join('')}<a href="#technique">Модель → техника → собственный следующий шаг</a><a href="#check">Мини-тест → адресное повторение</a></div><div class="lesson-actions"><button type="button" id="startTheory" class="button primary">К первому объяснению →</button></div>`);
    document.getElementById('tryEntry').onclick=()=>{document.getElementById('entryAttempt').hidden=false;document.getElementById('entryAttempt').scrollIntoView({behavior:'smooth'});};
    document.querySelectorAll('#entryAttempt input').forEach(i=>i.onchange=()=>mutate(m=>m.diagnosticDraft=Number(i.value)));
    document.getElementById('saveEntry').onclick=()=>{const chosen=document.querySelector('#entryAttempt input:checked');if(!chosen){C.U.notify('Выберите свой первый ход.');return;}const choice=Number(chosen.value);mutate(m=>m.diagnostic={choice,at:new Date().toISOString()});document.getElementById('entryFeedback').innerHTML=C.feedback(entrance,choice)+`<p class="learning-transition">Это точка входа, не экзамен. Теперь исследуйте, какое ограничение должен снять ваш ход.</p>`;};
    document.getElementById('startTheory').onclick=()=>go('theory-0');
  }
  function renderTheory(block){
    const title=module.blockTitles[block],text=chapter.theory[block][1];
    content(`<span class="eyebrow">2 · понять и увидеть · блок ${block+1}/3</span><div class="theory-block-tabs" aria-label="Учебные блоки">${chapter.theory.map(([name],i)=>`<a href="#theory-${i}" class="${i===block?'active':''}">${module.id}.${i+1} · ${esc(name)}</a>`).join('')}</div><article class="lesson-thought"><h2>${esc(title)}</h2><p class="one-thought">${esc(module.thoughts[block])}</p><p>${esc(text)}</p>${Visuals.render(module.visuals[block])}<div class="example-box"><b>Один рабочий пример</b><p>${esc(module.examples[block])}</p></div><details class="reference-details"><summary>Разобрать подробнее</summary><p>${esc(chapter.theoryDetails[block])}</p><dl class="term-list">${chapter.terms.map(([term,meaning])=>`<div><dt>${esc(term)}</dt><dd>${esc(meaning)}</dd></div>`).join('')}</dl></details></article>${C.adizes(module.adizes)}<div class="lesson-actions"><a href="#${block?'theory-'+(block-1):'intro'}">← Назад</a><button type="button" id="ackTheory" class="button primary">Понял(а) блок — ${block<2?'дальше':'к технике'} →</button></div>`);
    document.getElementById('ackTheory').onclick=()=>acknowledge(`theory-${block}`,block<2?`theory-${block+1}`:'technique');
  }
  function renderTechnique(){
    const m=state(),t=chapter.techniques.find(t=>t.id===m.selectedTechnique)||chapter.techniques[0];
    content(`<span class="eyebrow">3 · от понимания к инструменту</span><h2>Техника: ${esc(t.name)}</h2><label class="case-chooser">Выбрать другую технику этой темы<select id="courseTechnique">${chapter.techniques.map(x=>`<option value="${x.id}" ${x.id===t.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><p>${esc(t.when)}</p>${Visuals.render(t.visual)}<ol class="step-list">${t.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="example-box"><b>Как это выглядит</b><p>${esc(t.example)}</p></div><div class="mistake-box"><b>Граница применимости</b><p>${esc(t.mistake)}</p></div><details class="worksheet"><summary>Заполнить для собственной ситуации</summary><form id="courseWorksheet" class="form-grid">${t.fields.map((field,i)=>`<label>${esc(field)}<textarea name="field${i}"></textarea></label>`).join('')}<button class="button quiet">Записать рабочий шаблон в дневник</button><span class="draft-status">Черновик сохраняется при вводе</span></form></details><p><b>Проверка пользы:</b> ${esc(t.check)}</p><div class="lesson-actions"><a href="#theory-2">← К объяснению</a><button type="button" id="ackTechnique" class="button primary">Разобрал(а) шаги — к практике →</button></div>`);
    document.getElementById('courseTechnique').onchange=e=>{mutate(m=>m.selectedTechnique=e.target.value);render();};
    const form=document.getElementById('courseWorksheet'),key=`chapter-${module.id}-${t.id}`,saved=C.data().worksheets[key]||{};
    for(const[k,v]of Object.entries(saved))if(form.elements[k]&&typeof v==='string')form.elements[k].value=v;
    form.oninput=()=>C.save(d=>d.worksheets[key]=Object.fromEntries(new FormData(form)));
    form.onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(form));if(!Object.values(values).some(v=>v.trim())){C.U.notify('Добавьте факты своей ситуации.');return;}C.S.journal(C.active,{type:'План действия',title:t.name,situation:t.fields.map((field,i)=>`${field}: ${values[`field${i}`]||'уточнить'}`).join('\n'),learning:`Проверка пользы: ${t.check}`,action:'Первый шаг и срок:'});C.U.notify('Шаблон записан в дневник.');};
    document.getElementById('ackTechnique').onclick=()=>acknowledge('technique','practice');
  }
  function renderPractice(){
    const m=state(),practice=m.practice||{response:'',checks:[]};
    content(`<span class="eyebrow">4 · управляемая практика</span><h2>Соберите решение и проверьте его логику</h2><p class="practice-task">${esc(module.exercise)}</p><form id="guidedPractice" class="panel practice-form"><label>Мой рабочий ход<textarea name="response" placeholder="Опишите продукт, ограничение и следующий шаг">${esc(practice.response||'')}</textarea></label><h3>Сопоставьте свой ответ с критериями</h3><p class="small">Это самостоятельная проверка свободного ответа: отметьте только то, что действительно присутствует в вашем решении.</p>${module.rubric.map((rule,i)=>`<label class="rubric-check"><input type="checkbox" name="criterion${i}" ${practice.checks?.includes(i)?'checked':''}><span>${esc(rule)}</span></label>`).join('')}<button class="button primary">Критерии проверены — к применению →</button></form><details class="reference-details"><summary>Если не удаётся выбрать следующий шаг</summary><p>Вернитесь к наблюдаемому факту, ожидаемому результату, полномочию и зависимости. Не пытайтесь одновременно решить всё. Сформулируйте одно действие, которое создаст основание для следующего выбора.</p><a href="#technique">Ещё раз разобрать технику →</a></details>`);
    const f=document.getElementById('guidedPractice');
    const read=()=>({response:f.elements.response.value,checks:module.rubric.map((_,i)=>i).filter(i=>f.elements[`criterion${i}`].checked)});
    f.oninput=()=>mutate(m=>m.practice=read());
    f.onsubmit=e=>{e.preventDefault();const p=read();if(!p.response.trim()||p.checks.length!==module.rubric.length){C.U.notify('Добавьте свой ход и проверьте все три критерия.');return;}mutate(m=>m.practice=p);acknowledge('practice','transfer');};
  }
  function renderTransfer(){
    const t=state().transfer||{};
    content(`<span class="eyebrow">5 · перенос в свою работу</span><h2>Теперь примените к своей ситуации</h2><p>Запись связывает учебную модель с реальным действием. Её можно уточнить позже; повторное сохранение обновит ту же запись.</p><form id="moduleTransfer" class="panel practice-form"><label>Где у меня сейчас есть подобная ситуация?<textarea name="situation" required>${esc(t.situation||'')}</textarea></label><label>Что я раньше делал(а) автоматически?<textarea name="automatic" required>${esc(t.automatic||'')}</textarea></label><label>Что попробую изменить?<textarea name="change" required>${esc(t.change||'')}</textarea></label><label>Когда проверю результат?<input type="date" name="reviewDate" required value="${esc(t.reviewDate||'')}"></label><button class="button primary">Сохранить в мой управленческий дневник</button></form><div id="transferSaved"></div><div class="lesson-actions"><a href="#practice">← К практике</a><a class="button quiet" href="#check">К проверке освоения →</a></div>`);
    const f=document.getElementById('moduleTransfer');
    f.oninput=()=>mutate(m=>m.transfer=Object.fromEntries(new FormData(f)));
    f.onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(f));if(['situation','automatic','change','reviewDate'].some(k=>!values[k]?.trim())){C.U.notify('Заполните ситуацию, привычную реакцию, изменение и дату.');return;}const m=state(),existing=C.data().journal.find(j=>j.id===m.transferEntryId);const entry=C.S.journal(C.active,{...(existing||{}),type:'План применения',title:`Тема ${module.id} · ${module.title}`,situation:values.situation,learning:`Раньше автоматически: ${values.automatic}`,action:`Изменю: ${values.change}\nПроверю результат: ${values.reviewDate}`,updatedAt:new Date().toISOString()});mutate(m=>{m.transfer=values;m.transferEntryId=entry.id;});document.getElementById('transferSaved').innerHTML=`<p class="saved-message" role="status">План сохранён. Проверка результата: ${esc(values.reviewDate)}.</p><a href="${C.link('workspace.html#diary')}">Открыть мой дневник →</a>`;C.U.notify('План применения сохранён.');};
  }
  function renderCheck(){
    const m=state(),last=m.attempts[m.attempts.length-1];
    content(`<span class="eyebrow">6 · контроль понимания</span><h2>Проверьте себя: пять решений</h2><p>Порог — 4/5. Объяснения после проверки покажут, почему ход привлекателен и где его ограничение. Ошибки ведут к нужному блоку.</p><form id="moduleQuiz">${questions.map(q=>C.question(q,m.answers[q.id])).join('')}<div class="quiz-submit"><span id="quizAnswerCount">${questions.filter(q=>Number.isInteger(m.answers[q.id])).length}/5 ответов выбрано</span><button class="button primary">Проверить пять решений</button></div></form><div id="quizResult">${m.submitted&&last?C.resultSummary(last,questions,last.answers):''}</div><div id="masteryResult"></div><a class="button quiet" href="#connections">Связи и следующий модуль →</a>`);
    const f=document.getElementById('moduleQuiz');
    f.querySelectorAll('input').forEach(i=>i.onchange=()=>{const q=i.closest('[data-question]').dataset.question;mutate(m=>{m.answers[q]=Number(i.value);m.submitted=false;});document.getElementById('quizAnswerCount').textContent=`${questions.filter(q=>Number.isInteger(state().answers[q.id])).length}/5 ответов выбрано`;document.getElementById('quizResult').innerHTML='';document.getElementById('masteryResult').innerHTML='';});
    f.onsubmit=e=>{
      e.preventDefault();let result;C.save(d=>result=M.submit(d,module.id,questions));
      if(!result.complete){C.U.notify('Для проверки выберите действие во всех пяти ситуациях.');return;}
      refreshProgress();const m=state();document.getElementById('quizResult').innerHTML=C.resultSummary(result,questions,m.answers);
      Visuals.bind(document.getElementById('quizResult'));
      const report=M.report(C.data(),module.id,questions);
      document.getElementById('masteryResult').innerHTML=report.mastered?
        `<p class="mastered-message">${result.score>=4?'Модуль освоен: учебные шаги и перенос выполнены, проверочный порог достигнут.':'Модуль освоен по предыдущей успешной попытке. Эта проверка выявила зоны для повторения — вернитесь к указанным блокам.'}</p>`:
        `<p class="learning-transition">${result.score>=4?'Порог мини-теста достигнут. Для освоения осталось: ':'Для освоения повторите указанные блоки и завершите: '}${esc(report.missing.join(' · '))}</p>`;
      document.getElementById('quizResult').scrollIntoView({behavior:'smooth'});
    };
  }
  function renderConnections(){
    content(`<span class="eyebrow">7 · от темы к системе</span><h2>Как это связано с другими темами?</h2><div class="cross-course-links">${module.connections.map(({id,reason})=>`<a class="panel" href="${C.lesson(id)}"><span class="eyebrow">Тема ${id} · ${esc(COURSE.modules[id-1].lens)}</span><h3>${esc(COURSE.modules[id-1].title)}</h3><p>${esc(reason)}</p></a>`).join('')}</div><div class="panel next-course-module"><h2>${module.id<10?'Что добавит следующая тема':'Управленческий цикл замыкается'}</h2><p>${esc(module.next)}</p><a class="button primary" href="${module.id<10?C.lesson(module.id+1):C.link('index.html#final')}">${module.id<10?'Открыть тему '+(module.id+1):'Итоговый сквозной тренажёр'} →</a><a class="text-button" href="${C.link('index.html#trajectory')}">Моя траектория и пропущенные шаги →</a></div>${C.adizes(module.adizes)}`);
  }
  window.addEventListener('hashchange',render);
  render();
})();
