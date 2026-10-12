import {stages} from './data.js';
import {act} from './engine.js';
import {measures} from './archetypes.js';
import {caseIdentifier,newSeed} from './generator.js';
import {presentationBook,displayedPilot,selectedFacts,measureInfo,caseTotal} from './presentation.js';
import {scoreInvestigation} from './investigation-scoring.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1});
const stageName=id=>stages.find(s=>s.id===id)?.name||'Не выбран';
const label=e=>e.type==='wait'?'Ожидание':e.type==='rework'?'Возврат':e.type==='work'?'Работа':stageName(e.stage);

export function mountDetective({container,state:initial,onSave,onRestart,link,notify,onExperiment=()=>{}}){
  let state=initial,book=presentationBook(state),hovered=null;
  const legacy=Boolean(book.legacy);
  const save=()=>onSave(state);
  const focusHeading=id=>{const el=container.querySelector('#'+id);el?.focus();el?.scrollIntoView({block:'start',behavior:'instant'});};
  function perform(command){try{state=act(state,command);save();render();return true;}catch(e){notify(e.message);return false;}}
  function hero(){return `<header class="gap-goal"><div><span class="gap-case-id">ДЕЛО #${caseIdentifier(state.seed)}</span><h1>Найди разрыв</h1><p>Найдите потерю времени и проверьте изменение.</p><div class="gap-resources"><span role="img" aria-label="Осталось ${book.budget-state.spent} из ${book.budget} проверок">Проверки <span class="gap-dots" aria-hidden="true">${Array.from({length:book.budget},(_,i)=>`<i class="${i>=book.budget-state.spent?'used':''}"></i>`).join('')}</span></span><span role="img" aria-label="Осталось ${2-state.pilots.length} из 2 пилотов">Пилоты <span class="gap-pilot-dots" aria-hidden="true">${[0,1].map(i=>`<i class="${i<state.pilots.length?'used':''}"></i>`).join('')}</span></span></div></div>${paradox()}</header>`;}
  function paradox(){return `<div class="gap-paradox"><div><span>По отчёту</span><b>${fmt(book.reportedCycle)} дня</b></div><strong aria-label="не равно">≠</strong><div><span>Реальный цикл</span><b>${fmt(book.realCycle)} дня</b></div></div>`;}
  function steps(){const step=selectedFacts(state).length<2?1:!state.hypothesis.stage?2:3;
    const pilotScreen=state.phase==='pilot'||state.view.gapScreen==='pilot';
    const message=pilotScreen?'Сравните последствия. Можно уточнить версию или завершить расследование.':step===1?(state.inspected.length?'Новые улики появились ниже. Выберите 2–3 факта, которые могут объяснить задержку.':'Откройте 2–3 источника и выберите факты, которые объясняют задержку.'):step===2?'Выберите этап на карте, где, по вашей версии, возникает основная потеря.':state.view.intervention?'Версия собрана. Проверьте изменение на этих же делах.':'Выберите изменение и проверьте его на тех же случаях.';
    return `<ol class="gap-steps" aria-label="Шаги расследования">${['Найдите улики','Укажите разрыв','Проверьте решение'].map((text,i)=>`<li class="${i+1===step?'active':i+1<step?'done':''}" ${i+1===step?'aria-current="step"':''}><span>${i+1}</span>${text}</li>`).join('')}</ol><p class="gap-now" role="status"><b>Сейчас:</b> ${message}</p>`;
  }
  function map(){const enabled=selectedFacts(state).length>=2;return `<section class="gap-surface gap-map"><h2 id="gapMapHeading" tabindex="-1">Схема процесса</h2><div class="detective-chain" role="group" aria-label="Выберите предполагаемый этап">${stages.map((s,i)=>`${i?'<span class="gap-arrow" aria-hidden="true">→</span>':''}<button type="button" data-stage="${s.id}" data-focus="stage-${s.id}" aria-pressed="${state.hypothesis.stage===s.id}" ${!enabled?'disabled':''}><b>${s.name}</b><small>${state.hypothesis.stage===s.id?'Ваша версия':enabled?'Выбрать этап':'Сначала две улики'}</small></button>`).join('')}</div></section>`;}
  function chains(cases,baseline=null){return `<div class="gap-cases">${cases.map(c=>{
    const old=baseline?.find(b=>b.id===c.id);
    return `<article class="gap-case" data-case-id="${c.id}"><div class="gap-case-heading"><h3>Дело ${c.id.slice(5).padStart(2,'0')} · ${esc(c.name)}</h3><b>${old?fmt(caseTotal(old))+' → ':''}${fmt(caseTotal(c))} дня</b></div><div class="gap-events" tabindex="0" role="region" aria-label="События дела ${c.id.slice(5)}">${c.events.map((e,i)=>`${i?'<span class="gap-arrow" aria-hidden="true">→</span>':''}<div class="gap-event ${e.type} ${e.changed?'changed':''}" data-event-id="${e.id}"><b>${label(e)}</b><span>${fmt(e.duration)} дня</span>${e.changed?`<small>${e.delta>0?'−':'+'}${fmt(Math.abs(e.delta))} дня</small>`:''}</div>`).join('')}</div></article>`;
  }).join('')}</div>`;}
  function legend(){return `<div class="gap-legend" aria-label="Значение цветов"><span class="admin">Регистрация / передача</span><span class="work">Полезная работа</span><span class="wait">Ожидание / очередь</span><span class="rework">Возврат / переделка</span></div>`;}
  function sources(){return `<section class="gap-surface" aria-labelledby="gapSourcesHeading"><h2 id="gapSourcesHeading" tabindex="-1">Источники</h2><p class="gap-caption">Повторное чтение бесплатно. Выберите, что проверить.</p><div class="gap-source-list">${book.sources.map(s=>{
    const opened=state.inspected.includes(s.id);return `<button type="button" class="gap-source ${opened?'opened':''}" data-inspect="${s.id}" data-focus="source-${s.id}" ${!opened&&state.spent+s.cost>book.budget?'disabled':''}><b>${esc(s.name)}</b><span>${esc(s.description)}</span><strong>${opened?'Открыто ✓':'−'+s.cost}</strong></button>`;
  }).join('')}</div></section>`;}
  function facts(){const facts=book.sources.filter(s=>state.inspected.includes(s.id)).flatMap(s=>s.facts),selected=selectedFacts(state);
    return `<section class="gap-surface" aria-labelledby="gapFactsHeading"><h2 id="gapFactsHeading" tabindex="-1">Улики · ${selected.length} из 3</h2><p class="gap-caption">Выберите факты для своей версии.</p><div class="gap-facts">${facts.length?facts.map(f=>`<button type="button" class="gap-fact" data-fact="${esc(f.id)}" data-focus="fact-${esc(f.id)}" aria-pressed="${selected.includes(f.id)}" ${selected.length>=3&&!selected.includes(f.id)?'disabled':''}><span class="gap-fact-check" aria-hidden="true">${selected.includes(f.id)?'✓':'+'}</span><b>${esc(f.text)}</b><small>${esc(book.sources.find(s=>s.id===f.source)?.name)}${f.refCase?' · Дело '+f.refCase.slice(5).padStart(2,'0'):''}</small></button>`).join(''):'<p class="gap-empty">Откройте источник — найденные факты появятся здесь.</p>'}</div>${selected.length>=2&&!state.hypothesis.stage?'<button type="button" class="button primary" data-locate-map>Указать разрыв на карте →</button>':''}</section>`;
  }
  function decision(){if(selectedFacts(state).length<2||!state.hypothesis.stage)return '';
    const chosen=state.view.intervention;
    return `<section class="gap-surface gap-decision"><h2 id="gapDecisionHeading" tabindex="-1">Что изменить?</h2><p class="gap-caption">Ваша версия: ${stageName(state.hypothesis.stage)} · ${selectedFacts(state).length} улики.</p><div class="gap-measures">${book.interventions.map(id=>{const i=measureInfo(id,measures);return `<button type="button" data-measure="${id}" data-focus="measure-${id}" aria-pressed="${chosen===id}"><b>${esc(i.name)}</b><span>${esc(i.description)}</span></button>`;}).join('')}</div>${chosen?'<button type="button" class="button primary" id="runPilot" data-run-pilot>Проверить на этих делах</button>':''}</section>`;
  }
  function pilot(){const index=state.pilots.length-1,p=displayedPilot(state,book,state.pilots[index]),r=p.result,i=measureInfo(p.intervention,measures);
    return `<section class="gap-surface gap-pilot"><span class="gap-caption">ПИЛОТ №${index+1}</span><h2 id="latestPilotHeading" tabindex="-1">${esc(i.name)}</h2><div class="gap-pilot-summary"><div><span>Было</span><b>${fmt(r.before)} дня</b></div><span aria-hidden="true">→</span><div><span>Стало</span><b>${fmt(r.after)} дня</b></div><strong>${r.delta>0?'−':'+'}${fmt(Math.abs(r.delta))} дня</strong></div>${p.intervention==='change_metric'?`<p class="gap-pilot-response">Отчёт: ${fmt(r.reportedBefore)} → ${fmt(r.reportedAfter)} дня. Измерение стало честнее, но сам процесс не ускорился.</p>`:`<p class="gap-pilot-response">${r.delta>=1?'Реальный цикл заметно сократился.':r.delta>.3?'Получен небольшой эффект.':'Реальный цикл почти не изменился.'} Сравните, какие события изменила мера.</p>`}<div class="gap-pilot-cases">${chains(r.afterCases,book.cases)}</div><p class="gap-caption">Те же дела. Каждый пилот сравнивается с исходным процессом; эффекты не складываются. Рамка и подпись отмечают только изменённые события.</p><div class="gap-actions">${state.pilots.length<2?'<button type="button" class="button primary" data-refine>Уточнить версию</button>':''}<button type="button" class="button ${state.pilots.length>=2?'primary':'quiet'}" id="finishInvestigation" data-finish>Завершить расследование</button></div></section>`;
  }
  function final(){
    const pilots=state.pilots.map(p=>displayedPilot(state,book,p)),scoringState={...state,pilots,selectedEvidence:selectedFacts(state)},report=scoreInvestigation(scoringState,book),last=pilots.at(-1);
    return `<section class="gap-surface gap-report" id="investigationResult"><span class="gap-caption">${last?'РАССЛЕДОВАНИЕ ЗАВЕРШЕНО':'РАССЛЕДОВАНИЕ НЕ ЗАВЕРШЕНО'}</span><h2 id="investigationResultHeading" tabindex="-1">${last?'Что объясняют найденные факты':'Нужен пилот для проверки версии'}</h2>${last?`<div class="gap-grade" aria-label="Оценка ${report.grade}">${report.grade}</div><h3>Реальная причина: ${esc(book.archetype.title)}</h3><p>${esc(book.archetype.explanation)}</p><h3>Ваша проверенная версия</h3><p>${stageName(last.hypothesis.stage)} · ${report.stageMatched?'✓ этап найден':'Основная причина связана с этапом «'+stageName(book.archetype.trueStage)+'».'}</p><h3>Использованные улики</h3><ul>${report.selected.map(f=>`<li>${f.kind==='key'?'✓':'○'} ${esc(f.text)}</li>`).join('')}</ul><h3>Пилоты</h3><div class="gap-report-pilots">${pilots.map((p,i)=>`<article><h4>Пилот ${i+1} · ${esc(measureInfo(p.intervention,measures).name)}</h4><p>${fmt(p.result.before)} → ${fmt(p.result.after)} дня · ${p.result.delta>=1?'Сильный эффект':p.result.delta>.3?'Небольшой эффект':'Эффект слабый'}</p>${p.intervention==='change_metric'?'<p>Измерение стало честнее, но сам процесс не ускорился. Починить линейку ≠ починить процесс.</p>':''}</article>`).join('')}</div>${report.corrected?'<p class="gap-learning">Вы пересмотрели версию после первой проверки и получили больший эффект. Это хороший цикл расследования.</p>':''}<p>Проверок использовано: ${state.spent} из ${book.budget}. Прямых подтверждений в версии: ${report.supports}.</p>`:'<p>Откройте источники, выберите факты и испытайте меру. Одной версии недостаточно, чтобы установить причину.</p>'}<div class="gap-actions"><button type="button" class="button quiet" id="retryInvestigation" data-repeat>Повторить это дело</button><button type="button" class="button primary" data-new>Новое дело</button></div>${last?`<a class="gap-theory" href="${link('learn.html?module=8#theory-1')}">Разобрать управление процессом →</a>`:''}</section>`;
  }
  function render(){const focus=document.activeElement?.dataset.focus;
    container.classList.add('gap-game');
    if(state.phase==='intro')container.innerHTML=`<section class="gap-surface gap-intro"><span class="gap-case-id">ДЕЛО #${caseIdentifier(state.seed)}</span><h1>Найди разрыв</h1><p>По отчёту сервис работает быстро. Получатели ждут значительно дольше.</p>${paradox()}<p>Найдите, где теряется время, и проверьте изменение.</p><button type="button" class="button primary" data-start>Начать расследование</button></section>`;
    else if(state.phase==='ended')container.innerHTML=hero()+final();
    else if(state.phase==='pilot'||legacy&&state.view.gapScreen==='pilot')container.innerHTML=hero()+steps()+pilot();
    else container.innerHTML=hero()+steps()+map()+`<section class="gap-surface"><h2>Реальные дела</h2><p class="gap-caption">События слева направо. Прокрутите цепочку, чтобы увидеть весь путь.</p>${legend()}${chains(book.cases)}</section><div class="gap-investigation">${sources()}${facts()}</div>`+decision()+`<button type="button" class="gap-early-finish" data-finish ${legacy&&!state.pilots.length?'disabled':''}>Завершить расследование сейчас</button>`;
    if(state.phase==='ended'&&state.pilots.length){
      const report=container.querySelector('#investigationResult');
      report.insertAdjacentHTML('beforeend',`<a id="detectiveExperiment" class="gap-theory" href="${link('experiments.html?new=1')}">Перенести проверенное изменение в рабочий план →</a><details class="gap-read-evidence"><summary>Перечитать открытые источники</summary>${book.sources.filter(s=>state.inspected.includes(s.id)).map(s=>`<article><h3>${esc(s.name)}</h3>${s.facts.map(f=>`<p>${esc(f.text)}</p>`).join('')}</article>`).join('')}</details>`);
      report.querySelector('#detectiveExperiment').onclick=()=>{const last=state.pilots.at(-1);onExperiment({hypothesis:'Потеря времени связана с этапом «'+stageName(last.hypothesis.stage)+'».',action:measureInfo(last.intervention,measures).name,place:'Один процесс в моей работе'});};
    }
    highlight();if(focus)container.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({preventScroll:true});
  }
  function highlight(){if(state.phase==='pilot'||state.phase==='ended'||state.view.gapScreen==='pilot')return;const facts=book.sources.flatMap(s=>s.facts).filter(f=>selectedFacts(state).includes(f.id)||f.id===hovered);
    container.querySelectorAll('[data-case-id]').forEach(c=>{const relevant=facts.filter(f=>f.refCase===c.dataset.caseId);c.classList.toggle('evidence-linked',Boolean(relevant.length));c.querySelectorAll('[data-event-id]').forEach(e=>{
      const hit=relevant.some(f=>f.refEvent===e.dataset.eventId);e.classList.toggle('evidence-linked',hit);e.querySelector('.gap-pin')?.remove();if(hit)e.insertAdjacentHTML('beforeend','<small class="gap-pin">📌 Улика относится сюда</small>');
    });const ref=relevant.find(f=>f.id===hovered)||relevant[0],target=ref&&c.querySelector(`[data-event-id="${CSS.escape(ref.refEvent||'')}"]`),holder=c.querySelector('.gap-events');if(target&&holder){const t=target.getBoundingClientRect(),h=holder.getBoundingClientRect();holder.scrollLeft+=t.left-h.left-holder.clientWidth/2+t.width/2;}});
  }
  function click(e){const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-start'))perform({type:'start'});
    else if(b.dataset.inspect){if(perform({type:'inspect',key:b.dataset.inspect}))focusHeading('gapFactsHeading');}
    else if(b.dataset.fact){if(legacy){const selected=state.pinned.includes(b.dataset.fact);if(!selected&&state.pinned.length>=3){notify('Можно выбрать не более трёх улик.');return;}perform({type:'pin',key:b.dataset.fact,value:!selected});}else perform({type:'evidence',id:b.dataset.fact});}
    else if(b.dataset.stage){if(perform({type:'hypothesis',stage:b.dataset.stage}))focusHeading('gapDecisionHeading');}
    else if(b.dataset.measure){if(legacy){state.view.intervention=b.dataset.measure;save();render();}else perform({type:'measure',id:b.dataset.measure});}
    else if(b.hasAttribute('data-run-pilot')){
      if(legacy){if(state.hypothesis.note.trim().length<10)state=act(state,{type:'hypothesis',note:(state.hypothesis.note+' Версия собрана из выбранных источников и этапа процесса.').trim()});state.view.gapScreen='pilot';}
      if(perform({type:'pilot',intervention:state.view.intervention}))focusHeading('latestPilotHeading');
    }else if(b.hasAttribute('data-refine')){if(legacy){state.view.gapScreen='board';state.view.intervention=null;save();render();}else perform({type:'refine'});focusHeading('gapFactsHeading');}
    else if(b.hasAttribute('data-finish')){if(perform({type:'finish'}))focusHeading('investigationResultHeading');}
    else if(b.hasAttribute('data-locate-map'))focusHeading('gapMapHeading');
    else if(b.hasAttribute('data-repeat'))onRestart(state.seed,{same:true});
    else if(b.hasAttribute('data-new'))onRestart(newSeed());
  }
  function hover(e){const id=e.target.closest('[data-fact]')?.dataset.fact||null;if(hovered!==id){hovered=id;highlight();}}
  container.addEventListener('click',click);container.addEventListener('mouseover',hover);container.addEventListener('focusin',hover);
  render();
  return {getState:()=>structuredClone(state),dispose(){container.removeEventListener('click',click);container.removeEventListener('mouseover',hover);container.removeEventListener('focusin',hover);}};
}
