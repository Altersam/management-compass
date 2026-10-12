import {act} from './state.js';
import {identifier,newSeed} from './generator.js';
import {signalLabels,category} from './contexts.js';
import {presets,parameterLabels,explanation} from './parameters.js';
import {forecast} from './simulation.js';
import {eventChoices} from './events.js';
import {runReport,finalReport} from './scoring.js';
import {trajectory} from './trajectory.js';
import {animationController} from './animation.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:1});
const stages={
  design:['Проработка','Уточнение цели, требований, рисков и зависимостей до основной работы.','Снимает часть неизвестности заранее. При высокой изменчивости подготовленные сведения могут устареть.'],
  execute:['Выполнение','Основная работа по созданию результата.','Переводит план в результат. Чем больше непроверенного сделано, тем шире возможный передел.'],
  control:['Контроль','Проверка сделанного относительно ожиданий, требований и ограничений.','Раннее обнаружение обычно дешевле. Очень частые проверки сами расходуют мощность и деньги.'],
  correction:['Корректировка','Изменение уже выполненной работы после обнаруженного отклонения.','Возвращает проект к актуальным условиям. Поздняя ошибка затрагивает больше созданного.']
};
export function mountApproach({root,state:initial,onSave,onRestart,link,notify,onExperiment=()=>{}}){
  let state=structuredClone(initial),shownEvent=null,clock=null;
  if(state.phase==='running')state.paused=true;
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  function send(a){try{state=act(state,a);onSave(state);render();return true;}catch(e){notify(e.message);return false;}}
  function heading(id){const el=root.querySelector('#'+id);el?.focus();el?.scrollIntoView({block:'start',behavior:'instant'});}
  function goal(){const c=state.project;return `<header class="approach-goal"><div><h1>Проектный подход</h1><p>${esc(c.domainName)} · ${esc(c.title)} · Дело #${identifier(state.seed)}</p></div><dl><div><dt>Срок</dt><dd>${c.weeks} недель</dd></div><div><dt>Бюджет</dt><dd>${c.budget} у.е.</dd></div><div><dt>Попытка</dt><dd>${Math.min(2,state.attempts.length+1)}/2</dd></div></dl></header>`;}
  function context(){return `<section class="approach-surface approach-context"><h2>Контекст проекта</h2><p>${esc(state.project.description)}</p><dl>${Object.entries(signalLabels).map(([key,title])=>`<div><dt>${title}</dt><dd>${category(state.project[key])}</dd></div>`).join('')}</dl></section>`;}
  function phaseStrip(){const r=state.current||state.attempts.at(-1),stage=r?.rows.at(-1)?.stage||'design';return `<div class="approach-stages" aria-label="Что происходит в проекте">${Object.entries(stages).map(([id,[title,what,why]],i)=>`<details class="${stage===id?'active':''}"><summary ${stage===id?'aria-current="step"':''}>${i+1}. ${title}</summary><p><b>Что это:</b> ${what}</p><p><b>Зачем и к чему ведёт:</b> ${why}</p></details>`).join('')}</div>`;}
  function controls(){if(!state.current)return '';return `<div class="approach-live-controls"><button type="button" class="button quiet" data-approach="${state.paused?'resume':'pause'}" ${state.phase==='event'?'disabled':''}>${state.paused?'Продолжить':'Пауза'}</button><span>Скорость</span>${[1,2,3].map(n=>`<button type="button" data-approach="speed" data-value="${n}" aria-pressed="${state.speed===n}" aria-label="Скорость ${n}">×${n}</button>`).join('')}<b>${state.phase==='event'?'Требуется решение':state.paused?'Время на паузе':'Неделя '+state.currentWeek}</b></div>`;}
  function board(prediction){const run=state.current||state.attempts.at(-1),r=run?.rows.at(-1);return `<section class="approach-surface approach-board"><div class="approach-board-heading"><h2 id="approachBoardHeading" tabindex="-1">${state.phase==='ended'?'Две траектории одного проекта':state.phase==='planning'?'Прогноз до запуска':'Живая траектория проекта'}</h2>${controls()}</div>${trajectory(state,prediction,{reduced:reduced?.matches})}${r&&state.phase!=='planning'?`<div class="approach-moment" role="status"><b>Неделя ${r.week} · ${stages[r.stage][0]}</b><p>${esc(r.message)}${r.detected>.4?' Найденный передел: '+fmt(r.detected)+' единиц. Принятая ценность после сверки: '+fmt(r.accepted)+'%.':''}</p></div><dl class="approach-current"><div><dt>Принятая ценность</dt><dd>${fmt(r.accepted)}%</dd></div><div><dt>Неизвестность сейчас</dt><dd>${category(r.unknowns)}</dd></div><div><dt>Обнаруженный передел</dt><dd>${fmt(r.rework)} ед.</dd></div><div><dt>Стоимость сейчас</dt><dd>${fmt(run.cost)} / ${state.project.budget}</dd></div></dl>`:''}${phaseStrip()}${state.phase==='event'?'<button type="button" class="button primary" data-approach="openEvent">Выбрать действие по событию</button>':''}</section>`;}
  function settings(){
    const disabled=Boolean(state.current&&!state.paused),running=Boolean(state.current);
    return `<section class="approach-surface approach-settings"><h2 id="approachSettingsHeading" tabindex="-1">Настройте способ работы</h2><p>Пресет задаёт стартовый профиль. Каждый рычаг можно изменить.</p><div class="approach-presets">${Object.entries(presets).map(([id,p])=>`<button type="button" data-approach="preset" data-value="${id}" aria-pressed="${state.preset===id}" ${running?'disabled':''}>${p.name}</button>`).join('')}</div><details class="approach-help"><summary>Чем отличаются подходы?</summary><div class="approach-help-grid">${Object.values(presets).map(p=>`<article><h3>${p.name}</h3><p><b>Что:</b> ${p.what}</p><p><b>Подходит:</b> ${p.when}</p><p><b>Риск:</b> ${p.risk}</p></article>`).join('')}</div></details>${Object.entries(parameterLabels).map(([key,title])=>{
      const p=state.parameters,value=p[key],text=key==='interval'?value+' нед.':key==='upfront'?Math.ceil(value*state.project.weeks)+' нед. подготовки':key==='buffer'?fmt(value*state.project.weeks*.6)+' нед. защиты':category(value);
      return `<div class="approach-lever"><label for="approach-${key}">${title}<output id="output-${key}">${text}</output></label><input type="range" id="approach-${key}" data-parameter="${key}" min="${key==='interval'?1:0}" max="${key==='interval'?8:key==='upfront'?.5:key==='buffer'?.6:1}" step="${key==='interval'?1:.05}" value="${value}" aria-valuetext="${esc(text)}" ${disabled||running&&key==='upfront'?'disabled':''}><details data-help="${key}"><summary>Что это меняет?</summary><p>${explanation(key,p,state.project)}</p></details></div>`;
    }).join('')}${running?'<p class="approach-small">На паузе можно изменить проверки, обратную связь и резерв. Начальную проработку можно пересмотреть во второй попытке.</p>':''}</section>`;
  }
  function forecastBar(prediction){return `<section class="approach-surface approach-forecast"><div><b>Текущий прогноз без новых событий</b><p>Срок: ${Math.max(state.currentWeek, prediction.weeks-1)}–${prediction.weeks+2} нед. · расход ≈ ${fmt(prediction.cost*.95)}–${fmt(prediction.cost*1.1)} у.е.</p><small>Пунктир меняется после настройки и известных последствий. Будущие события сюда не включены.</small></div>${state.phase==='planning'?'<button type="button" class="button primary" data-approach="run">Запустить проект</button>':''}</section>`;}
  function result(){const report=finalReport(state),reports=report.reports,last=reports.at(-1);return `<section class="approach-surface approach-report" id="approachReport"><h2 tabindex="-1" id="approachResultHeading">${state.phase==='review'?'Попытка 1 · что произошло':'Что изменил ваш подход'}</h2>${state.phase==='ended'?`<div class="approach-grade">${report.grade}</div><p>Один проект и те же исходные события. Реакции и настройки могли различаться.</p>`:''}<div class="approach-comparison">${reports.map((r,i)=>`<article><h3>Попытка ${i+1}</h3><dl><div><dt>Срок</dt><dd>${r.delay?'+'+r.delay+' нед.':'В срок'}</dd></div><div><dt>Бюджет</dt><dd>${r.overBudget?'+'+fmt(r.overBudget*100)+'%':'В пределах'}</dd></div><div><dt>Передел</dt><dd>${fmt(r.rework)} ед.</dd></div><div><dt>Принятая ценность</dt><dd>${fmt(r.accepted)}%</dd></div></dl></article>`).join('')}</div><h3>Почему получился такой ход</h3><ul>${(state.phase==='review'?last.insights:report.insights).map(text=>`<li>${esc(text)}</li>`).join('')}</ul>${state.attempts.map((run,i)=>`<details><summary>Решения и контрольные точки · попытка ${i+1}</summary><ul>${run.responses.map(e=>`<li>Неделя ${e.week}: ${esc(e.title)} → ${esc(eventChoices[state.events.find(event=>event.id===e.id).kind].find(([id])=>id===e.choice)[1])}</li>`).join('')}${run.rows.filter(r=>r.checkpoint).map(r=>`<li>◆ Неделя ${r.week}: обнаружено ${fmt(r.detected)} ед. передела; стоимость к этому моменту ${fmt(r.cost)}.</li>`).join('')}</ul></details>`).join('')}<div class="approach-actions">${state.phase==='review'?'<button type="button" class="button primary" data-approach="adjust">Изменить подход</button>':'<button type="button" class="button quiet" data-approach="repeat">Повторить дело</button><button type="button" class="button primary" data-approach="new">Новое дело</button>'}</div>${state.phase==='ended'?`<a id="approachExperiment" href="${link('experiments.html?new=1')}">Перенести одну проверку в свою работу →</a>`:''}</section>`;}
  function eventDialog(){const event=state.events.find(e=>e.id===state.current?.pending);return `<dialog id="approachEventDialog" aria-labelledby="approachEventTitle"><span>Неделя ${state.currentWeek} · ${esc(state.project.domainName)}</span><h2 id="approachEventTitle">${esc(event?.title||'Событие')}</h2><p>${esc(event?.text||'')}</p>${event?eventChoices[event.kind].map(([id,title,description])=>`<button type="button" class="approach-event-option" data-approach="decision" data-choice="${id}"><b>${esc(title)}</b><span>${esc(description)}</span></button>`).join(''):''}<button type="button" class="button quiet" data-approach="eventSettings">Посмотреть настройки</button></dialog>`;}
  function render(){const focused=document.activeElement?.id,focusData=document.activeElement?.dataset;
    const open=new Set([...root.querySelectorAll('details[open]')].map(d=>d.dataset.help||d.querySelector('summary')?.textContent));
    root.classList.add('approach-game');
    if(state.phase==='intro')root.innerHTML=`<section class="approach-surface approach-intro" id="arcadeBoard"><h1>Проектный подход</h1><p>Перед вами управленческий проект: ${esc(state.project.title)}.</p><p>Настройте способ работы под его условия. Во время проекта условия могут измениться.</p><button type="button" class="button primary" data-approach="start">Начать</button></section>`;
    else {
      const active=['planning','running','event'].includes(state.phase),prediction=active?forecast(state.project,state.parameters,state.current):null;
      root.innerHTML=goal()+(state.phase==='planning'?'<p class="approach-instruction">Изучите контекст → настройте четыре рычага → посмотрите прогноз → запустите проект.</p>':'')+`<div class="approach-layout">${context()}${board(prediction)}${active?settings():''}</div>`+(active?forecastBar(prediction):result())+eventDialog();
    }
    root.querySelectorAll('details').forEach(d=>{if(open.has(d.dataset.help||d.querySelector('summary')?.textContent))d.open=true;});
    if(focused)root.querySelector('#'+CSS.escape(focused))?.focus({preventScroll:true});
    else if(focusData?.approach)root.querySelector(`[data-approach="${focusData.approach}"]${focusData.value?`[data-value="${focusData.value}"]`:''}`)?.focus({preventScroll:true});
    if(state.phase==='event'&&shownEvent!==state.current.pending){shownEvent=state.current.pending;showEvent();}
    const transfer=root.querySelector('#approachExperiment');if(transfer)transfer.onclick=()=>onExperiment({hypothesis:'Момент проверки влияет на объём позднего исправления.',action:'Проверить рабочий образец до дорогостоящего следующего этапа',place:state.project.title});
    clock?.sync();
  }
  function showEvent(){const dialog=root.querySelector('#approachEventDialog');if(dialog&&!dialog.open)dialog.showModal();dialog?.querySelector('[data-choice]')?.focus();}
  function click(e){const b=e.target.closest('[data-approach]');if(!b)return;const type=b.dataset.approach;
    if(type==='repeat')onRestart(state.seed);
    else if(type==='new')onRestart(newSeed());
    else if(type==='openEvent')showEvent();
    else if(type==='eventSettings'){root.querySelector('#approachEventDialog').close();heading('approachSettingsHeading');}
    else {const before=state.phase;if(send({type,value:b.dataset.value,choice:b.dataset.choice})){if(type==='start'||type==='run')heading('approachBoardHeading');if(type==='adjust')heading('approachSettingsHeading');if(before==='event'&&type==='decision')heading('approachBoardHeading');}}
  }
  function input(e){
    const key=e.target.dataset.parameter;if(!key)return;
    try{
      state=act(state,{type:'parameter',key,value:e.target.value});onSave(state);
      const value=state.parameters[key],text=key==='interval'?value+' нед.':key==='upfront'?Math.ceil(value*state.project.weeks)+' нед. подготовки':key==='buffer'?fmt(value*state.project.weeks*.6)+' нед. защиты':category(value);
      root.querySelector('#output-'+key).textContent=text;e.target.setAttribute('aria-valuetext',text);
      root.querySelectorAll('[data-approach=preset]').forEach(b=>b.setAttribute('aria-pressed','false'));
      const prediction=forecast(state.project,state.parameters,state.current);
      root.querySelector('.approach-board').outerHTML=board(prediction);root.querySelector('.approach-forecast').outerHTML=forecastBar(prediction);clock.sync();
    }catch(error){notify(error.message);}
  }
  function key(e){if(e.key==='Escape'&&state.phase==='running'&&!state.paused)send({type:'pause'});}
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('keydown',key);
  clock=animationController({getState:()=>state,tick:()=>{const before=state.phase;send({type:'tick'});if(before==='running'&&['review','ended'].includes(state.phase))heading('approachResultHeading');},pause:()=>send({type:'pause'})});
  render();return {getState:()=>structuredClone(state),dispose(){clock.dispose();root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('keydown',key);}};
}
