import {advance,act,workloads,dailyCost,forecast,taskStatus,blockers,reliability,risk} from './engine.js';
import {dayLabel,finished} from './state.js';
import {complete,project} from './project.js';
import {level,serviceMetrics,report} from './scoring.js';
import {eventDefinitions,actionLabels} from './events.js';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
const skillNames={analysis:'Аналитика',design:'Прототипирование',testing:'Проверки',engineering:'Интеграция',coordination:'Координация',teaching:'Обучение'};
const statusNames={done:'Готово',active:'В работе',blocked:'Ожидание',unassigned:'Нужен исполнитель',paused:'Приостановлено'};
const percent=t=>Math.min(100,Math.round(t.progress/t.effort*100));

export function mountGame({container,state:initial,onSave,onRestart,link,notify}){
  let state=initial,selected=initial.view?.selected||'requirements',tab=initial.view?.tab||'project',running=false,period=8000,timer=null,latestEventCount=state.events.length,resultShown=false;
  if(!state.tasks.some(t=>t.id===selected))selected='requirements';
  if(!['project','team','events'].includes(tab))tab='project';
  const persist=()=>{state.view={selected,tab};onSave(state);};
  const focusMemory={selectedTaskHeading:'selectedTaskHeading'};
  container.innerHTML=`<div class="game-title"><div><span class="game-eyebrow">20 рабочих дней · управленческая игра</span><h1>Проект под давлением</h1><p>${project.title}</p></div><div class="game-time-controls"><button type="button" class="button primary" id="gameClock" data-focus="clock">Запустить время</button><label>Темп<select id="gameSpeed" data-focus="speed"><option value="8000">Обычный</option><option value="4000">×2</option><option value="2000">×4</option></select></label></div></div>
    <div class="game-brief" id="gameBrief">Срок и бюджет уже обещаны. Исследование начала Анна; остальные назначения — ваш выбор. Выберите задачу на плане, назначьте людей и запустите время. Пауза доступна в любой момент.</div>
    <div class="game-metrics" id="gameMetrics"></div><p class="game-status" id="gameStatus" role="status" aria-live="polite"></p>
    <div class="game-mobile-tabs" role="tablist" aria-label="Области проекта">${[['project','Проект'],['team','Команда'],['events','События']].map(([id,label])=>`<button id="tab-${id}" role="tab" aria-controls="panel-${id}" data-tab="${id}" data-focus="tab-${id}">${label}</button>`).join('')}</div>
    <div class="game-layout"><section id="panel-team" data-game-panel="team" aria-labelledby="teamHeading"><h2 id="teamHeading">Команда</h2><div id="gamePeople"></div></section>
    <section id="panel-project" data-game-panel="project" aria-labelledby="projectHeading"><h2 id="projectHeading">План и ход работ</h2><div class="gantt-legend"><span>Контур — исходный план</span><span>Цвет — фактический ход</span></div><div id="gameGantt"></div><div id="gameTask"></div><div id="gameLevers"></div><div id="gameService"></div></section>
    <section id="panel-events" data-game-panel="events" aria-labelledby="eventsHeading"><h2 id="eventsHeading">События <span id="eventCount"></span></h2><div id="gameEvents"></div></section></div>
    <section id="gameResult" hidden></section><dialog id="gameExplanation" aria-labelledby="explanationHeading"><h2 id="explanationHeading"></h2><p id="explanationText"></p><div class="game-dialog-actions"><button type="button" class="button primary" id="returnToGame">Вернуться в игру</button><a id="explanationCourse" target="_blank" rel="noopener">Разобрать тему подробнее →</a></div></dialog>`;
  const $=id=>container.querySelector('#'+id);
  function pause(){running=false;clearInterval(timer);timer=null;$('gameClock').textContent=finished(state)?'Проект завершён':state.time>0?'Продолжить время':'Запустить время';$('gameClock').setAttribute('aria-pressed','false');}
  function play(){
    if(finished(state))return;
    running=true;$('gameClock').textContent='Пауза';$('gameClock').setAttribute('aria-pressed','true');clearInterval(timer);
    timer=setInterval(()=>{state=advance(state);persist();if(finished(state))pause();render();},period);
    $('gameBrief').hidden=true;
  }
  function decide(command){
    try{state=act(state,command);persist();render();$('gameStatus').textContent=decisionMessage(command);}
    catch(error){notify(error.message);}
  }
  function decisionMessage(command){
    return {assign:'Назначение изменено. Темп будет зависеть от навыка и одновременной нагрузки.',priority:'Приоритет изменён: ускорение этой задачи занимает внимание команды.',checkpoint:'Момент проверки изменён. Сверка требует времени и бюджета.',autonomy:'Границы решения изменены.',pauseTask:command.value?'Задача приостановлена.':'Задача снова может двигаться.',hire:'Лев доступен для назначений. Стоимость команды за день выросла.',coach:'Один день выделен на развитие навыка. Его эффект появится после практики.',scope:'Согласован пилот: дополнительные сценарии остаются за его границами.',formalLaunch:'Формальный запуск состоялся. Теперь наблюдаем использование.',coordinateIT:'Окно IT согласовано. До получения доступа интеграция ждёт.',escalateIT:'Спонсор ускорил ресурсный выбор.',acceptIT:'Интеграция может начаться без подтверждения. Неопределённость остаётся.',clarify:'Сценарии двух подразделений сверены.',alignLeaders:'Руководители поддерживают единый канал.',inspectMetrics:'Проверка обходов займёт день.',cutSupport:'Расходы уменьшились сейчас. Использование продолжим наблюдать.',restoreSupport:'Поддержка возвращена.'}[command.type]||'План изменён.';
  }
  function render(){
    const focus=document.activeElement?.dataset.focus||focusMemory[document.activeElement?.id],task=state.tasks.find(t=>t.id===selected),loads=workloads(state),prediction=forecast(state);
    const timelineScroll=container.querySelector('.gantt-scroll')?.scrollLeft||0,levers=container.querySelector('.game-levers');
    const leversOpen=levers?levers.open:state.time===0;
    const expandedPeople=new Set([...container.querySelectorAll('[data-person-details][open]')].map(el=>el.dataset.personDetails));
    $('gameMetrics').innerHTML=`<div><span>День</span><b>${dayLabel(state)} <small>/ 20</small></b><i class="game-day-track"><i style="width:${state.time/20*100}%"></i></i></div><div><span>Осталось бюджета</span><b class="${state.budget-state.spent<200000?'game-pressure':''}">${money(Math.max(0,state.budget-state.spent))}</b><small>Из ${money(state.budget)}</small></div><div><span>Прогноз запуска</span><b>${prediction.day===null?'За пределами срока':'День '+prediction.day}</b><small>При текущих назначениях</small></div><div><span>Надёжность</span><b>${level(reliability(state))}</b><small>Навык · нагрузка · проверка</small></div><div><span>Общий риск</span><b class="${risk(state)>0.35?'game-pressure':''}">${risk(state)>0.35?'высокий':risk(state)>0.2?'средний':'низкий'}</b><small>${state.launchedAt!==null?'Наблюдаем применение':'До запуска'}</small></div>`;
    $('gamePeople').innerHTML=state.people.map(p=>{
      const unavailable=state.time<p.absentUntil||state.time<p.trainingUntil,load=loads[p.id],trainSkill=task.skills.find(skill=>p.skills[skill]<3);
      return `<article class="game-person ${load>1?'is-overloaded':''}"><div class="person-heading"><span class="person-avatar" aria-hidden="true">${p.name[0]}</span><div><h3>${p.name}</h3><span>${p.role}</span></div></div><p class="selected-skill">${task.skills.map(skill=>`${skillNames[skill]} ${p.skills[skill]}/3`).join(' · ')}</p><div class="person-load"><b>${unavailable?'Недоступен':load===0?'Есть резерв':load+' активн. задач'}</b><span>${p.fatigue>0.6?'Истощение':p.fatigue>0.25?'Усталость':'Есть силы'}</span><meter min="0" max="3" value="${Math.min(3,load)}" aria-label="Нагрузка ${p.name}: ${load} задач"></meter></div><small>${money(p.cost)}/день${p.temporary?' · временно':''}${state.time<p.absentUntil?' · возвращение к дню '+(Math.ceil(p.absentUntil)+1):''}${state.time<p.trainingUntil?' · занят развитием или координацией':''}</small><details data-person-details="${p.id}" ${expandedPeople.has(p.id)?'open':''}><summary data-focus="person-${p.id}">Способ работы и развитие</summary><p>${p.behavior}</p><dl class="person-stats"><div><dt>Скорость</dt><dd>${p.speed}/3</dd></div><div><dt>Качество</dt><dd>${p.quality}/3</dd></div><div><dt>Диалог</dt><dd>${p.communication}/3</dd></div></dl><button type="button" class="game-text-button" data-coach="${p.id}" data-skill="${trainSkill||''}" data-focus="coach-${p.id}" ${!trainSkill||unavailable||finished(state)?'disabled':''}>Развить ${escape(skillNames[trainSkill]||'навык')} · день + 15 000 ₽</button></details></article>`;
    }).join('');
    $('gameGantt').innerHTML=`<div class="gantt-scroll" tabindex="0" role="region" data-focus="timeline" aria-label="План на 20 дней; можно прокручивать"><div class="gantt"><div class="gantt-head"><span>Задача</span><div>${Array.from({length:20},(_,i)=>`<span>${i+1}</span>`).join('')}</div></div><div class="gantt-today" style="left:calc(var(--gantt-label) + (100% - var(--gantt-label)) * ${Math.min(0.99,state.time/20)})" aria-hidden="true"><span>Сегодня</span></div>${state.tasks.map(t=>{
      const start=t.startedAt===null?t.start-1:t.startedAt,width=t.startedAt===null?t.duration:Math.max(0.45,(t.completedAt??state.time)-t.startedAt),status=taskStatus(state,t);
      return `<div class="gantt-row ${selected===t.id?'is-selected':''}"><button type="button" class="gantt-task-name" data-task="${t.id}" data-focus="task-${t.id}" aria-pressed="${selected===t.id}"><b>${t.name}</b><span>${statusNames[status]} · ${percent(t)}%</span></button><div class="gantt-lane"><span class="gantt-plan" style="left:${(t.start-1)/20*100}%;width:${t.duration/20*100}%"></span><button type="button" class="gantt-bar ${status}" data-task="${t.id}" data-focus="bar-${t.id}" style="left:${Math.min(97,start/20*100)}%;width:${Math.min(100-start/20*100,width/20*100)}%" aria-label="${t.name}: ${percent(t)}%, ${statusNames[status]}"><i style="width:${percent(t)}%"></i><span>${percent(t)}%</span></button></div></div>`;
    }).join('')}</div></div><div class="gantt-navigation"><span>Перемещайте шкалу ↔; подписи остаются на месте.</span><button type="button" class="game-text-button" id="ganttToday" data-focus="gantt-today">К сегодняшнему дню</button></div>`;
    container.querySelector('.gantt-scroll').scrollLeft=timelineScroll;
    $('ganttToday').onclick=()=>{const holder=container.querySelector('.gantt-scroll'),chart=container.querySelector('.gantt'),label=parseFloat(getComputedStyle(chart).getPropertyValue('--gantt-label'));holder.scrollLeft=Math.max(0,(chart.scrollWidth-label)*state.time/20-(holder.clientWidth-label)/2);};
    const blocked=blockers(state,task),done=complete(task),disabled=done||finished(state);
    $('gameTask').innerHTML=`<section class="game-task-editor" aria-labelledby="selectedTaskHeading"><div class="task-editor-heading"><h3 id="selectedTaskHeading" tabindex="-1">${task.name}</h3><span>${percent(task)}% · ${statusNames[taskStatus(state,task)]}</span></div><p class="task-facts">${task.duration} дня в исходном плане · Осталось ${Math.max(0,task.effort-task.progress).toFixed(1)} дня работы · Навыки: ${task.skills.map(k=>skillNames[k]).join(', ')}</p>${blocked.length&&!done?`<p class="task-blocker">Ждёт: ${blocked.join(' → ')}</p>`:''}<fieldset class="task-assignees" ${disabled?'disabled':''}><legend>Кто работает над этой задачей?</legend>${state.people.map(p=>`<label><input type="checkbox" data-assign="${p.id}" data-focus="assign-${p.id}" ${task.assigned.includes(p.id)?'checked':''}><span>${p.name}</span></label>`).join('')}</fieldset><div class="task-options"><label>Приоритет<select data-setting="priority" data-focus="priority" ${disabled?'disabled':''}>${[[0,'Второй план'],[1,'Обычный'],[2,'В первую очередь']].map(([id,text])=>`<option value="${id}" ${task.priority===id?'selected':''}>${text}</option>`).join('')}</select></label><label>Контрольная точка<select data-setting="checkpoint" data-focus="checkpoint" ${disabled?'disabled':''}>${[['none','Без отдельной сверки'],['early','Ранняя: +0,35 дня, 6 000 ₽'],['final','В конце: +0,15 дня, 6 000 ₽']].map(([id,text])=>`<option value="${id}" ${task.checkpoint===id?'selected':''}>${text}</option>`).join('')}</select></label><label>Право на решение<select data-setting="autonomy" data-focus="autonomy" ${disabled?'disabled':''}>${[['bounded','Сам в оговорённых границах'],['manual','Через моё разрешение'],['free','Полная самостоятельность']].map(([id,text])=>`<option value="${id}" ${task.autonomy===id?'selected':''}>${text}</option>`).join('')}</select></label></div><div class="task-bottom"><span>Надёжность: ${level(task.quality)} · Возврат: ${task.quality<0.65?'повышенный риск':task.risk>=0.15?'возможен':'умеренный риск'}</span><button class="game-text-button" data-command="pauseTask" data-value="${!task.paused}" data-task-id="${task.id}" data-focus="pause-task" ${disabled?'disabled':''}>${task.paused?'Возобновить задачу':'Приостановить задачу'}</button>${task.awaitingDecision?`<button class="button quiet" data-command="approve" data-task-id="${task.id}" data-focus="approve">Принять решение</button>`:''}</div></section>`;
    $('gameLevers').innerHTML=`<details class="game-levers" ${leversOpen?'open':''}><summary>Ресурс и границы проекта</summary><p>Команда: ${money(dailyCost(state))}/день, включая резерв. Сокращённый пилот не включает дополнительные сценарии.</p><div class="game-lever-buttons"><button data-command="scope" data-focus="scope" ${state.scope==='lean'||finished(state)?'disabled':''}>Сократить объём до пилота</button><button data-command="hire" data-focus="hire" ${state.people.some(p=>p.id==='expert')||finished(state)?'disabled':''}>Эксперт IT · 20 000 ₽ + 22 000 ₽/день</button><button data-command="coordinateIT" data-focus="it" ${state.it.contacted||state.it.ready||finished(state)?'disabled':''}>Согласовать окно IT · 15 000 ₽</button><button data-command="clarify" data-focus="clarify" ${state.flags.requirementsAligned||finished(state)?'disabled':''}>Сверить требования · 12 000 ₽</button><button data-command="formalLaunch" data-focus="formal-launch" ${state.time<12||state.launchedAt!==null||!complete(state.tasks.find(t=>t.id==='integration'))||finished(state)?'disabled':''}>Формально запустить без готового обучения</button></div></details>`;
    const metrics=serviceMetrics(state);
    $('gameService').innerHTML=state.launchedAt===null?'':`<section class="game-service"><h3>После запуска</h3><div class="service-numbers"><div><b>${metrics.adoption}%</b><span>Используют сервис</span></div><div><b>${metrics.visibleTime} мин.</b><span>Среднее в новой системе</span></div><div><b>${metrics.repeats}%</b><span>Повторные обращения</span></div>${state.metricsInvestigated?`<div><b>${metrics.allTime} мин.</b><span>С обходами и ожиданием</span></div><div><b>${metrics.resolved}/100</b><span>Решённые потребности</span></div>`:''}</div><p>${state.metricsInvestigated?'Проверка включает людей за пределами новой системы.':'Среднее учитывает только закрытые заявки новой системы.'}</p><button data-command="alignLeaders" data-focus="align" ${state.leaderExample||finished(state)?'disabled':''}>${state.leaderExample?'Руководители поддерживают единый канал':'Согласовать единый канал · 10 000 ₽'}</button></section>`;
    const open=state.events.filter(e=>e.status==='open');$('eventCount').textContent=open.length||'';
    $('gameEvents').innerHTML=state.events.length?[...state.events].reverse().map(e=>{
      const def=eventDefinitions[e.definition];
      return `<article class="game-event ${e.status==='resolved'?'is-resolved':''}"><div class="event-meta"><span>День ${Math.floor(e.day)+1}</span><span>${e.status==='resolved'?'Учтено':def.kind==='external'?'Внешнее':'Последствие'}</span></div><h3>${def.title}</h3><p>${e.detail||def.text}</p>${e.detail?`<p>${def.text}</p>`:''}<div class="event-actions">${e.status==='open'&&!finished(state)?def.actions.map(type=>`<button data-command="${type}" ${e.subject?`data-task-id="${e.subject}"`:''} data-focus="event-${e.id}-${type}" ${type==='coordinateIT'&&state.it.contacted||type==='inspectMetrics'&&state.flags.metricsRequested?'disabled':''}>${actionLabels[type]}</button>`).join(''):''}<button class="game-text-button" data-explain="${e.definition}" data-focus="explain-${e.id}">Почему это произошло?</button></div></article>`;
    }).join(''):'<div class="game-empty-events"><b>Пока тихо</b><p>Распределите будущие задачи. Время не идёт, пока вы его не запустите.</p><p>События останутся здесь; можно менять план, не закрывая карточку.</p></div>';
    if(state.events.length>latestEventCount){const e=state.events.at(-1);$('gameStatus').textContent='Новое событие: '+eventDefinitions[e.definition].title;latestEventCount=state.events.length;}
    $('gameClock').disabled=finished(state);
    container.querySelectorAll('[data-game-panel]').forEach(panel=>panel.classList.toggle('is-active',panel.dataset.gamePanel===tab));
    container.querySelectorAll('[data-tab]').forEach(button=>{button.setAttribute('aria-selected',String(button.dataset.tab===tab));button.tabIndex=button.dataset.tab===tab?0:-1;});
    if(finished(state)&&!resultShown){resultShown=true;renderResult();if(state.time>initial.time)$('gameResult').scrollIntoView({behavior:'instant',block:'start'});}
    if(focus==='selectedTaskHeading')$('selectedTaskHeading').focus({preventScroll:true});
    else if(focus)container.querySelector(`[data-focus="${focus}"]`)?.focus({preventScroll:true});
  }
  function renderResult(){
    const result=report(state);$('gameResult').hidden=false;
    $('gameResult').innerHTML=`<div class="result-heading"><span>Проект завершён · ${state.endReason==='budget'?'бюджет исчерпан':'20 рабочих дней'}</span><h2>Что получилось в этой игре</h2></div><dl class="game-result-grid"><div><dt>Срок запуска</dt><dd>${result.launchDay===null?'Не запущен':result.launchDay+' / 20 дней'}</dd></div><div><dt>Бюджет</dt><dd>${money(result.spent)} / ${money(state.budget)}</dd></div><div><dt>Переделка</dt><dd>${state.stats.rework.toFixed(1)} дня · ${money(state.stats.reworkCost)}</dd></div><div><dt>Перегрузка</dt><dd>${state.stats.overloadDays.toFixed(1)} человеко-дня</dd></div><div><dt>Использование сервиса</dt><dd>${result.metrics.adoption}% · ${result.metrics.resolved}/100 потребностей решено</dd></div><div><dt>Ручные решения</dt><dd>${state.stats.manualDecisions} · ${state.stats.manualWaiting.toFixed(1)} дня ожидания</dd></div></dl><ol class="game-insights">${result.insights.map(text=>`<li>${text}</li>`).join('')}</ol><p>${state.scope==='lean'?'Выпущен ограниченный пилот. Полный объём ещё требует отдельного решения.':'Полный объём: '+result.completed+' из 7 задач готовы.'} Надёжность: ${result.quality}.</p><form id="newProjectForm"><label>Сценарий для повторной игры<input name="seed" value="${escape(state.seed)}" maxlength="80" required></label><button class="button primary">Попробовать другой план</button></form><div class="result-links"><a href="${link('experiments.html')}">Выбрать одно действие в своей работе →</a><a href="${link('index.html#courseMapTitle')}">Курс по темам →</a></div>`;
    $('newProjectForm').onsubmit=e=>{e.preventDefault();onRestart(new FormData(e.currentTarget).get('seed').trim()||'service-20');};
  }
  function explanation(id){
    const def=eventDefinitions[id];if(!def)return;pause();
    $('explanationHeading').textContent=def.title;$('explanationText').textContent=def.explanation;
    $('explanationCourse').href=link(`learn.html?module=${def.topic}#${def.step}`);$('gameExplanation').showModal();$('returnToGame').focus();
  }
  function click(event){
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.task){selected=button.dataset.task;persist();render();$('selectedTaskHeading').focus({preventScroll:true});}
    else if(button.dataset.command){decide({type:button.dataset.command,...(button.dataset.taskId?{task:button.dataset.taskId}:{}),...(button.dataset.command==='pauseTask'?{value:button.dataset.value==='true'}:{})});}
    else if(button.dataset.coach)decide({type:'coach',person:button.dataset.coach,skill:button.dataset.skill});
    else if(button.dataset.explain)explanation(button.dataset.explain);
    else if(button.dataset.tab){tab=button.dataset.tab;persist();render();}
  }
  function change(event){
    const field=event.target;
    if(field.dataset.assign){const people=[...$('gameTask').querySelectorAll('[data-assign]:checked')].map(i=>i.dataset.assign);decide({type:'assign',task:selected,people});}
    else if(field.dataset.setting)decide({type:field.dataset.setting,task:selected,value:field.dataset.setting==='priority'?Number(field.value):field.value});
  }
  function visibility(){if(document.hidden)pause();}
  container.addEventListener('click',click);container.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);
  $('gameClock').onclick=()=>running?pause():play();$('gameSpeed').onchange=e=>{period=Number(e.target.value);if(running)play();};
  $('returnToGame').onclick=()=>$('gameExplanation').close();
  container.querySelector('.game-mobile-tabs').onkeydown=e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
    const tabs=['project','team','events'];tab=e.key==='Home'?'project':e.key==='End'?'events':tabs[(tabs.indexOf(tab)+(e.key==='ArrowRight'?1:2))%3];persist();render();container.querySelector(`[data-tab="${tab}"]`).focus();
  };
  if(state.time>0)$('gameBrief').textContent=`Продолжить проект — день ${dayLabel(state)}. Время на паузе: можно осмотреть план и события.`;
  pause();render();
  return {dispose(){pause();container.removeEventListener('click',click);container.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);},getState:()=>structuredClone(state)};
}
