import {CourseUI} from './course-ui.js';
import * as Activities from './activities.js';
import * as Experiments from './experiments.js';
import {productive,scheduleReviews,reviewFor,contextualQuestion} from './learning-practice.js';
export function mountLesson({topic:currentTopic}) {
  const C=CourseUI,{M,esc}=C;
  const topic=currentTopic.id,module=currentTopic.course,p={scene:currentTopic.scene.title,lead:currentTopic.scene.lead,blocks:currentTopic.explanations,bridge:currentTopic.bridge},reference=currentTopic.reference,questions=currentTopic.questions;
  const root=document.getElementById('lessonRoot');
  let mountedActivity=null;
  C.mount();
  C.save(d=>{const old=M.report(d,topic,questions).mastered,m=M.ensure(d,topic);if(m.pedagogy!==2){m.legacyCompleted=old;m.pedagogy=2;}if(!m.microAnswers)m.microAnswers={};if(!m.activities)m.activities={};});
  const state=()=>M.moduleState(C.data(),topic);
  const mutate=fn=>{C.save(d=>fn(M.ensure(d,topic),d));progress();};
  const nav=[['intro','Ситуация'],['theory-0','Почему так'],['practice','Другое условие'],['technique','Инструмент'],['transfer','Своя работа'],['check','Несколько решений'],['connections','Продолжение']];
  function progress(){const bar=document.getElementById('topicProgress');if(!bar)return;const r=M.report(C.data(),topic,questions);bar.style.width=r.progress+'%';bar.parentElement.setAttribute('aria-valuenow',r.progress);}
  function go(hash){location.hash=hash;}
  function phase(){const hash=location.hash.slice(1)||'intro';if(/^theory-[0-2]$/.test(hash))return {step:'theory',block:Number(hash.slice(-1)),hash};return {step:['intro','practice','technique','transfer','check','connections'].includes(hash)?hash:'intro',block:0,hash};}
  function render(){
    mountedActivity?.unmount();mountedActivity=null;
    const current=phase();C.save(d=>{const c=M.ensure(d);c.last={module:topic,step:current.hash};c.resume={kind:'lesson'};});
    document.title=`${module.title} — Практика управления`;
    root.innerHTML=`<div class="topic-top"><a href="${C.link('index.html')}">← Курс</a><span>${esc(module.title)}</span><details class="compact-topic-nav"><summary>В этой теме</summary><nav>${nav.map(([key,label])=>`<a href="#${key}" ${key===current.hash?'aria-current="location"':''}>${label}</a>`).join('')}</nav></details></div><div class="subtle-progress" role="progressbar" aria-label="Место в теме" aria-valuemin="0" aria-valuemax="100"><i id="topicProgress"></i></div><section id="lessonContent" class="lesson-body"></section>`;
    ({intro:()=>activity(false),practice:()=>activity(true),theory:()=>theory(current.block),technique,transfer,check,connections}[current.step])();
    Visuals.bind(root);progress();
  }
  function content(html){document.getElementById('lessonContent').innerHTML=html;}
  function activity(practice){
    const mode=practice?'practice':'intro',saved=state().activities?.[mode];
    content(`<h1>${practice?'А теперь изменим одно условие':esc(p.scene)}</h1><p class="story-lead">${practice?esc(practicePrompt(topic)):esc(p.lead)}</p><div id="topicActivity"></div><div class="natural-next" id="activityNext" ${saved?.done?'':'hidden'}><a class="button primary" href="#${practice?'technique':'theory-0'}">${practice?'Взять инструмент':'Разобраться, почему так'} →</a></div>`);
    mountedActivity=Activities.mount(document.getElementById('topicActivity'),topic,saved,{practice,onChange:s=>mutate(m=>m.activities[mode]=s),onDecide:s=>{mutate(m=>m.activities[mode]=s);document.getElementById('activityNext').hidden=false;}});
  }
  function practicePrompt(n){return {
    1:'Добавьте внезапный запрос. Что он вытеснит и что произойдёт с важной несрочной работой?',
    2:'Данные понадобились раньше. Прежняя точка проверки всё ещё полезна?',
    3:'Тот же сотрудник получил новую задачу с большей ценой ошибки. Измените границы, а не оценку человека.',
    4:'Вернитесь к развилке и выберите другой ход. Как новая информация меняет ваше первое впечатление?',
    5:'Стороны по-разному понимают требования. Того же письма достаточно или понадобится другой канал?',
    6:'У IT появилось ещё одно внешнее обязательство. Где возникнет реальное решение, а где — только обсуждение?',
    7:'Исполнитель получил старую копию. Поменяйте версию и проследите, что ещё должно подтвердиться.',
    8:'Добавьте ещё одну проверку и увеличьте входящий поток. Станет ли сервис надёжнее или просто медленнее?',
    9:'Теперь человек всё знает, но не имеет доступа. Поможет ли то же обучение?',
    10:'Включите обходные каналы и незакрытые обращения. Сохранилось ли первое впечатление от улучшения?'
  }[n];}
  function theory(block){
    const b=p.blocks[block],answer=state().microAnswers?.[block];
    if(block===1&&productive[topic]){productiveAction(b,block,answer);return;}
    content(`<article class="teacher-explanation"><h1>${esc(b.title)}</h1><p class="story-lead">${esc(b.story)}</p><p>${esc(b.explain)}</p><p class="name-the-principle">${esc(b.term)}</p>${Visuals.render(module.visuals[block])}</article><form id="microAction" class="micro-action">${C.question(b.micro,answer?.choice,'micro')}<button class="button primary">Что произойдёт?</button></form><div id="microFeedback" aria-live="polite">${answer?C.feedback(b.micro,answer.choice):''}</div><div class="natural-next" id="microNext" ${answer?'':'hidden'}><a class="button primary" href="#${block<2?'theory-'+(block+1):'practice'}">${block<2?'Дальше':'Попробовать на другом условии'} →</a></div>`);
    document.getElementById('microAction').onsubmit=e=>{e.preventDefault();const chosen=e.currentTarget.querySelector('input:checked');if(!chosen){C.U.notify('Выберите вариант.');return;}const choice=Number(chosen.value);mutate(m=>m.microAnswers[block]={choice,at:new Date().toISOString()});document.getElementById('microFeedback').innerHTML=C.feedback(b.micro,choice);document.getElementById('microNext').hidden=false;};
  }
  function productiveAction(b,block,saved){
    const exercise=productive[topic];
    content(`<article class="teacher-explanation"><h1>${esc(b.title)}</h1><p class="story-lead">${esc(b.story)}</p><p>${esc(b.explain)}</p><p class="name-the-principle">${esc(b.term)}</p>${Visuals.render(module.visuals[block])}</article><form id="productiveAction" class="compact-application"><label>${esc(exercise.prompt)}<textarea name="response" required>${esc(saved?.response||'')}</textarea></label><button class="button primary">Сопоставить с условиями</button></form><div id="productiveCriteria" ${saved?.selfChecked?'':'hidden'}><h2>Самопроверка</h2><ul>${exercise.criteria.map(c=>`<li>${esc(c)}</li>`).join('')}</ul><p><b>Один возможный ответ:</b> ${esc(exercise.example)}</p><p>Сравните с собственным текстом: какие условия вы учли, какие стоит добавить?</p><button id="confirmProductive" class="button quiet">Сопоставил с условиями</button></div><div class="natural-next" id="microNext" ${saved?.selfChecked||Number.isInteger(saved?.choice)?'':'hidden'}><a class="button primary" href="#theory-2">Дальше →</a></div>`);
    const form=document.getElementById('productiveAction');form.oninput=()=>mutate(m=>m.microAnswers[block]={...m.microAnswers[block],response:form.elements.response.value});
    form.onsubmit=e=>{e.preventDefault();if(!form.elements.response.value.trim())return;document.getElementById('productiveCriteria').hidden=false;};
    document.getElementById('confirmProductive').onclick=()=>{mutate(m=>m.microAnswers[block]={...m.microAnswers[block],response:form.elements.response.value,selfChecked:true,at:new Date().toISOString()});document.getElementById('microNext').hidden=false;};
  }
  function technique(){
    const t=reference.techniques.find(t=>t.id===state().selectedTechnique)||reference.techniques[0];
    content(`<h1>${esc(t.name)}</h1><p class="story-lead">${esc(t.when)}</p><ol class="step-list">${t.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><div class="example-box"><b>Как это выглядит в работе</b><p>${esc(t.example)}</p></div><details class="reference-details"><summary>Другие инструменты этой темы</summary>${reference.techniques.map(x=>`<a href="${C.link(`modules/module-${String(topic).padStart(2,'0')}.html#${x.id}`)}">${esc(x.name)} →</a>`).join('<br>')}</details>${[2,3,6,8,9].includes(topic)?C.adizes(module.adizes):''}<div class="natural-next"><a class="button primary" href="#transfer">Попробовать в своей работе →</a></div>`);
    if([7,8,10].includes(topic))document.getElementById('lessonContent').insertAdjacentHTML('beforeend',`<p><a href="${C.link('detective.html')}">Попробовать в детективе «Найди разрыв» →</a></p>`);
  }
  function transfer(){
    const m=state(),old=Experiments.list(C.S,C.active).find(e=>e.id===m.experimentId||e.journalEntryId===m.transferEntryId);
    const draft=m.applicationDraft||old||{action:m.transfer?.change||'',place:m.transfer?.situation||'',reviewDate:m.transfer?.reviewDate||''};
    content(`<h1>Одно действие в вашей работе</h1><p class="story-lead">${esc(applicationPrompt(topic))}</p><form id="moduleTransfer" class="compact-application"><label>Что попробую изменить?<textarea name="action" required>${esc(draft.action||'')}</textarea></label><label>Где?<input name="place" required value="${esc(draft.place||'')}"></label><label>Когда проверю результат?<input name="reviewDate" type="date" required value="${esc(draft.reviewDate||'')}"></label><button class="button primary">Запланировать</button></form><div id="applicationReply"></div><div class="natural-next"><a href="#check">Ещё несколько решений →</a><a href="${C.link('experiments.html')}">Мои действия →</a></div>`);
    const f=document.getElementById('moduleTransfer');f.oninput=()=>mutate(m=>m.applicationDraft=Object.fromEntries(new FormData(f)));
    f.onsubmit=e=>{e.preventDefault();try{const values=Object.fromEntries(new FormData(f)),current=state(),existing=Experiments.list(C.S,C.active).find(e=>e.id===current.experimentId||e.journalEntryId===current.transferEntryId);const item=Experiments.save(C.S,C.active,{...values,id:existing?.id,topic});mutate(m=>m.experimentId=item.id);document.getElementById('applicationReply').innerHTML=`<p class="quiet-note">${new Date(item.reviewDate+'T00:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'})} · ${esc(item.action)}</p>`;f.querySelector('button').textContent='Запланировано';}catch(error){C.U.notify(error.message);}};
  }
  function applicationPrompt(n){return {1:'Что перестанет вытесняться из вашего рабочего дня?',2:'Где проверка поможет увидеть задержку раньше?',3:'Какое типовое решение человек сможет принимать без вас?',4:'Какой критерий своего решения стоит сделать понятнее?',5:'Какое сообщение вы перепишете для конкретного адресата?',6:'На каком стыке нужен понятный вопрос человеку с правом выбора?',7:'Где стоит проверить не отправку, а реальное применение?',8:'Какую потерю в одном процессе вы проверите?',9:'Какой группе нужна другая поддержка перехода?',10:'Какое альтернативное объяснение показателя вы проверите?'}[n];}
  function check(){
    const m=state(),i=Math.min(1,Math.max(0,Number(m.shortQuestionCursor)||0)),q=questions[i];
    content(`<h1>${esc(q.title)}</h1><form id="singleDecision">${C.question(q,m.answers[q.id])}<button class="button primary">Посмотреть последствия</button></form><div id="decisionFeedback"></div><div class="natural-next" id="decisionNext" hidden><button id="nextQuestion" class="button quiet">${i<1?'Другая ситуация':'Что взять в работу'} →</button></div><div id="quizResult"></div>`);
    const f=document.getElementById('singleDecision');f.onsubmit=e=>{e.preventDefault();const selected=f.querySelector('input:checked');if(!selected){C.U.notify('Выберите действие.');return;}const choice=Number(selected.value);mutate(m=>m.answers[q.id]=choice);document.getElementById('decisionFeedback').innerHTML=C.feedback(q,choice);document.getElementById('decisionNext').hidden=false;};
    document.getElementById('nextQuestion').onclick=()=>{if(i<1){mutate(m=>m.shortQuestionCursor=i+1);check();}else{let result;C.save(d=>{result=M.submit(d,topic,questions.slice(0,2));scheduleReviews(d,topic,C.U.today());});if(result.complete){document.getElementById('quizResult').innerHTML=C.resultSummary(result,questions.slice(0,2),state().answers)+`<a class="button primary" href="#connections">Продолжить →</a>`;}}};
  }
  function connections(){
    const review=reviewFor(C.data(),topic,C.U.today());
    content(`<h1>Что меняется дальше</h1><p class="story-lead">${esc(p.bridge)}</p><a class="button primary" href="${topic<10?C.lesson(topic+1):C.link('game.html')}">${topic<10?'Продолжить':'Попробовать проект под давлением'} →</a><details class="reference-details"><summary>Если нужна другая сторона этой ситуации</summary>${module.connections.map(({id,reason})=>`<p><a href="${C.lesson(id)}">${esc(COURSE.modules[id-1].title)}</a><br>${esc(reason)}</p>`).join('')}</details><a href="${C.link('experiments.html')}">Вернуться к своему действию →</a>`);
    if(review){const original=COURSE.questions[review.topic][review.index],q=contextualQuestion(original,topic);document.getElementById('lessonContent').insertAdjacentHTML('beforeend',`<section class="mixed-practice"><h2>Ещё одна рабочая ситуация</h2><form id="mixedDecision">${C.question(q,undefined,'mixed')}<button class="button quiet">Разобрать последствия</button></form><div id="mixedFeedback" aria-live="polite"></div></section>`);document.getElementById('mixedDecision').onsubmit=e=>{e.preventDefault();const selected=e.currentTarget.querySelector('input:checked');if(!selected){C.U.notify('Выберите действие.');return;}const choice=Number(selected.value);C.save(d=>{if(!d.learning)d.learning={revision:1,reviews:[],responses:{}};if(!d.learning.responses)d.learning.responses={};d.learning.responses[q.id]={choice,context:topic,at:new Date().toISOString()};M.ensure(d,topic).mixedDone=true;const item=d.learning.reviews.find(r=>r.id===review.id);if(item)item.done=true;});document.getElementById('mixedFeedback').innerHTML=C.feedback(q,choice);};}
  }
  window.addEventListener('hashchange',()=>{render();C.scrollToTop();});render();
}
