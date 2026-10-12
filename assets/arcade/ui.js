import {esc} from './common.js';
import {practiceCycle,nextStepMarkup,readNextStep} from '../practice-cycle.js';
export function mountTrainer({root,meta,game,state:initial,onSave,onRestart,link,notify,onExperiment}){
  let state=initial,timer=null,running=false,interaction=null;
  root.innerHTML=`<div class="arcade-heading"><div><span>${esc(meta.subtitle)}</span><h1>${esc(meta.title)}</h1><p>${esc(meta.mechanic)}</p></div><a href="${link('games.html')}">Все тренажёры →</a></div><p class="arcade-status" id="arcadeStatus" role="status" aria-live="polite"></p>${game.ticker?'<div class="arcade-clock"><button type="button" id="arcadeClock" class="button primary" aria-pressed="false">Запустить поток</button><p>Время движется по обычным интервалам; любое изменение ставит его на паузу.</p></div>':''}<div id="arcadeBoard" class="arcade-board"></div><section id="arcadeResult" hidden></section><details class="arcade-history"><summary>Что повлияло на попытку</summary><ol id="arcadeHistory"></ol></details>`;
  const board=root.querySelector('#arcadeBoard'),result=root.querySelector('#arcadeResult'),status=root.querySelector('#arcadeStatus');
  if(game.ui?.history===false)root.querySelector('.arcade-history').remove();
  if(game.ui?.quietStatus)status.classList.add('arcade-status-quiet');
  if(game.ui?.practiceCycle!==false)status.insertAdjacentHTML('beforebegin','<div id="arcadePracticeCycle"></div>');
  if(meta.id==='hybrid')status.insertAdjacentHTML('beforebegin','<p class="game-next-hint">Дни, стоимость и качество условны. Измените момент проверки и сравните цену переделки.</p>');
  function pause(){running=false;clearInterval(timer);timer=null;const control=root.querySelector('#arcadeClock');if(control){control.textContent=state.phase==='ended'?'Поток завершён':state.turn?'Продолжить поток':'Запустить поток';control.setAttribute('aria-pressed','false');control.disabled=state.phase==='ended';control.classList.toggle('primary',state.phase!=='ended');control.classList.toggle('quiet',state.phase==='ended');}}
  function focusDescriptor(){const active=document.activeElement;if(!board.contains(active))return null;if(active.name)return {name:active.name};if(active.dataset?.action)return {...active.dataset};return null;}
  function restoreFocus(target){if(!target)return;let el;if(target.name)el=board.querySelector(`[name="${CSS.escape(target.name)}"]`);else{let selector=`[data-action="${CSS.escape(target.action)}"]`;for(const key of ['value','index','delta'])if(target[key]!==undefined)selector+=`[data-${key}="${CSS.escape(String(target[key]))}"]`;el=board.querySelector(selector);}el?.focus({preventScroll:true});}
  function render(target=focusDescriptor()){
    const cycle=root.querySelector('#arcadePracticeCycle'),history=root.querySelector('#arcadeHistory');if(cycle)cycle.innerHTML=practiceCycle(state.phase==='ended'?3:state.turn>0?2:state.history.length?1:0);
    board.innerHTML=interaction?.render?interaction.render():game.render(state);if(history)history.innerHTML=state.history.slice(-40).map(item=>`<li>${esc(item.text)}</li>`).join('')||'<li>Здесь появятся действия и наблюдаемые результаты.</li>';
    if(state.phase==='ended'){pause();board.querySelectorAll('input,select,textarea,button').forEach(el=>{el.disabled=true;el.classList.replace('primary','quiet');});renderResult();}
    restoreFocus(target);
    if(target&&game.ui?.focus)board.querySelector(typeof game.ui.focus==='function'?game.ui.focus(state):game.ui.focus)?.focus();
    interaction?.afterRender();
  }
  function dispatch(action,{redraw=true,tick=false}={}){
    try{if(!tick)pause();const target=focusDescriptor(),oldPhase=state.phase;state=game.act(state,action);onSave(state);if(action.type==='move'&&target)target.index=Number(action.index)+Number(action.delta);if(redraw)render(target);status.textContent=state.phase==='ended'?'Попытка завершена — ниже результат и разбор.':state.history.at(-1)?.text||'Условия изменены.';if(oldPhase!=='ended'&&state.phase==='ended'){result.querySelector('h2').focus();result.scrollIntoView({block:'start',behavior:'instant'});}return true;}catch(error){notify(error.message);return false;}
  }
  function renderResult(){
    const r=game.report(state);result.hidden=false;result.innerHTML=`<span class="arcade-result-eyebrow">Разбор этой попытки</span><h2 tabindex="-1">Что получилось</h2><dl class="arcade-result-metrics">${r.metrics.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><ol class="arcade-insights">${r.insights.map(text=>`<li>${esc(text)}</li>`).join('')}</ol>${r.criteria?`<section class="self-review"><h3>Самопроверка вашего объяснения</h3><p>${esc(state.note)}</p><ul>${r.criteria.map(text=>`<li>${esc(text)}</li>`).join('')}</ul><p><b>Один возможный ответ:</b> ${esc(r.example)}</p><p>Текст не оценивался автоматически: сопоставьте собственные условия с фактами игры.</p></section>`:''}<div class="arcade-course-links">${meta.topics.map(id=>`<a href="${link(`learn.html?module=${id}`)}">Разобрать тему ${id} →</a>`).join('')}<a id="arcadeExperiment" href="${link('experiments.html?new=1')}">Одно действие в своей работе →</a></div><form id="arcadeRestart" class="arcade-restart"><label>Сценарий для следующей попытки<input name="seed" maxlength="80" value="${esc(state.seed)}" required></label><button class="button primary">Начать новую попытку</button></form>`;
    if(game.renderReport){const shared=result.querySelector('.arcade-course-links').outerHTML+result.querySelector('#arcadeRestart').outerHTML;result.innerHTML=game.renderReport(state)+shared;}
    const restartForm=result.querySelector('#arcadeRestart');restartForm.querySelector('label').hidden=true;restartForm.querySelector('button').textContent='Повторить этот случай';
    restartForm.onsubmit=e=>{e.preventDefault();onRestart(new FormData(e.currentTarget).get('seed').trim()||meta.id+'-1');};
    const transfer=nextStepMarkup({hypothesis:state.note||r.insights[0],action:r.nextAction||'Проверить одно условие из тренажёра «'+meta.title+'»',place:'Один рабочий эпизод'});
    result.querySelector('.arcade-course-links').insertAdjacentHTML('beforebegin',game.ui?.compactTransfer?'<details class="arcade-transfer"><summary>Проверка в своей работе</summary>'+transfer+'</details>':transfer);
    result.querySelector('#arcadeExperiment').onclick=()=>onExperiment(readNextStep(result));
  }
  function click(e){const b=e.target.closest('[data-action]');if(!b)return;const action={type:b.dataset.action};if(b.dataset.value!==undefined)action.value=b.dataset.value;if(b.dataset.index!==undefined)action.index=Number(b.dataset.index);if(b.dataset.delta!==undefined)action.delta=Number(b.dataset.delta);dispatch(action);}
  function change(e){const field=e.target;if(!field.name||field.name==='note')return;dispatch({type:field.name,value:field.type==='checkbox'?field.checked:field.value});}
  function input(e){if(e.target.name==='note')dispatch({type:'note',value:e.target.value},{redraw:false});}
  function submit(e){if(!e.target.matches('[data-form]'))return;e.preventDefault();dispatch({type:e.target.dataset.form});}
  function visibility(){if(document.hidden)pause();}
  function escapePause(e){if(e.key==='Escape')pause();}
  board.addEventListener('click',click);board.addEventListener('change',change);board.addEventListener('input',input);board.addEventListener('submit',submit);document.addEventListener('visibilitychange',visibility);root.addEventListener('keydown',escapePause);
  if(game.ticker){root.querySelector('#arcadeClock').onclick=()=>{if(running){pause();return;}if(state.phase==='ended')return;running=true;root.querySelector('#arcadeClock').textContent='Пауза';root.querySelector('#arcadeClock').setAttribute('aria-pressed','true');timer=setInterval(()=>{if(!dispatch({type:game.ticker.type},{tick:true}))pause();},game.ticker.ms);};}
  if(game.mountUI)interaction=game.mountUI({root,board,result,getState:()=>state,dispatch,redraw:()=>render(null),notify});
  render();pause();if(state.history.length&&state.phase!=='ended')status.textContent='Продолжить сохранённую попытку — условия восстановлены.';
  return {dispose(){interaction?.dispose();pause();board.removeEventListener('click',click);board.removeEventListener('change',change);board.removeEventListener('input',input);board.removeEventListener('submit',submit);document.removeEventListener('visibilitychange',visibility);root.removeEventListener('keydown',escapePause);},getState:()=>structuredClone(state)};
}
