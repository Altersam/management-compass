import {act,workloads,forecast} from './engine.js';
import {actionLabels} from './events.js';
import {skillFit} from './people.js';

export const gameDay=time=>Math.min(20,Math.floor(Math.max(0,time))+1);
const labels={assign:'Изменили назначение',priority:'Перераспределили внимание',checkpoint:'Изменили момент сверки',autonomy:'Изменили границы решений',pauseTask:'Изменили ход задачи',hire:'Привлекли временного эксперта',coach:'Выделили время на развитие',scope:'Выбрали ограниченный пилот',formalLaunch:'Зафиксировали ранний запуск',coordinateIT:'Согласовали окно IT',escalateIT:'Ускорили ресурсный выбор',acceptIT:'Приняли риск интеграции',approve:'Приняли личное решение',alignLeaders:'Согласовали пример руководителей',inspectMetrics:'Проверили состав показателя',cutSupport:'Сократили поддержку',restoreSupport:'Вернули поддержку',itBurst:'Выбрали два дня помощи сейчас',itWindow:'Выбрали позднее полное окно',sponsorTransfer:'Передали ресурс обучения интеграции'};
export function decisionLabel(d,state){
  const source=d.before||state,task=source?.tasks?.find(t=>t.id===d.task),person=source?.people?.find(p=>p.id===d.person);
  if(d.type==='assign'&&task)return d.people.length?`${task.name}: назначили ${d.people.map(id=>source.people.find(p=>p.id===id)?.name||'участника').join(', ')}`:`${task.name}: сняли исполнителей`;
  if(d.type==='checkpoint'&&task)return `${task.name}: ${d.value==='early'?'ранняя сверка':d.value==='final'?'сверка в конце':'без отдельной сверки'}`;
  if(d.type==='autonomy'&&task)return `${task.name}: ${d.value==='manual'?'через разрешение':d.value==='free'?'полная самостоятельность':'самостоятельность в границах'}`;
  if(d.type==='coach'&&person)return `${person.name}: выделили день на развитие`;
  return labels[d.type]||actionLabels[d.type]||'Изменили план';
}
export function causeReview(state,event){
  const task=state.tasks.find(t=>t.id===event.subject),origin=event.origin,chain=[];
  let lesson='Сопоставьте изменение условий с тем, что стало возможно для следующей работы.',next='В следующей попытке измените одно условие и сравните результат.';
  if(event.definition==='rework'){
    if(origin){
      if(origin.startedAt!==null)chain.push({at:origin.startedAt,text:`${task?.name||'Работа'} началась; назначены ${origin.assigned.map(id=>state.people.find(p=>p.id===id)?.name||id).join(', ')}.`});
      chain.push({at:origin.completedAt,text:`Этап завершён ${origin.checkpoint==='early'?'с ранней сверкой':origin.checkpoint==='final'?'со сверкой только в конце':'без отдельной ранней сверки'}.`});
    }else if(Number.isFinite(event.relatedAt))chain.push({at:event.relatedAt,text:'Связанная работа уже выглядела готовой.'});
    chain.push({at:event.day,text:event.impact?`Обнаружен возврат: +${event.impact.work.toFixed(2)} дня работы и ${event.impact.cost.toLocaleString('ru-RU')} ₽ отдельного расхода.`:event.detail||'Обнаружилась дополнительная работа.'});
    lesson=event.id==='it-return'?'Ранний старт не устранил условие доступа IT — оно осталось внутри результата.':'Стоимость отдельной сверки и стоимость позднего возврата относятся к разным моментам. В этой истории проверка после готовности уже не защитила зависимую работу.';
    next=event.id==='it-return'?'Сравнить подтверждённое окно IT с началом на принятом риске.':'Попробовать раннюю сверку на этой задаче и сравнить срок, бюджет и возвраты.';
  }else if(event.definition==='overload'){
    const assignments=state.decisions.filter(d=>d.type==='assign'&&d.people?.includes(event.subject)&&d.at<=event.day);
    if(assignments.length){const last=assignments.at(-1);chain.push({at:last.at,text:`${state.people.find(p=>p.id===event.subject)?.name} получил назначение на «${state.tasks.find(t=>t.id===last.task)?.name}».`});}
    chain.push({at:event.day,text:event.detail||'Несколько активных задач начали конкурировать за время человека.'});
    lesson='Ранний темп распределился между несколькими начатыми работами. Усталость и переключения накопились позже.';next='Оставить один фокус, передать другую задачу или использовать резерв; проверить завершённый поток.';
  }else if(event.definition==='support'){
    const decision=state.decisions.findLast(d=>d.type==='cutSupport'&&d.at<=event.day);
    if(decision)chain.push({at:decision.at,text:'Дневные расходы уменьшены на 15%; поддержка нового сценария сокращена.'});
    chain.push({at:event.day,text:'Через два дня стала заметна потеря использования и появились обходы.'});lesson='Экономия была видна сразу, а изменение поведения — позже.';next='Сначала проверить незавершённые и обходные обращения, затем выбирать объём поддержки.';
  }else if(['training','oldChannel','metrics'].includes(event.definition)){
    if(state.launchedAt!==null)chain.push({at:state.launchedAt,text:'Сервис запущен: продукт доступен, но применение ещё нужно наблюдать.'});
    chain.push({at:event.day,text:event.detail||({training:'Обычная операция ещё не освоена.',oldChannel:'Руководители продолжили поддерживать старый канал.',metrics:'Показатель описывает только закрытые запросы новой системы.'}[event.definition])});
    lesson=event.definition==='metrics'?'Состав выборки меняет смысл улучшившегося среднего.':event.definition==='oldChannel'?'Поведение руководителя делает старый путь выгодным даже после инструкции.':'Дата запуска и способность использовать сервис — разные результаты.';
    next=event.definition==='metrics'?'Проверить обходы, незавершённые и повторные обращения.':'Связать поддержку с конкретным барьером рабочего сценария.';
  }else{
    if(Number.isFinite(event.relatedAt))chain.push({at:event.relatedAt,text:'Изменилось связанное условие работы.'});
    chain.push({at:event.day,text:event.detail||'Обнаружено ограничение исполнения.'});
  }
  return {chain,lesson,next,task:task?.id||null};
}
export function decisionEffects(state,decision,index){
  if(!decision.before)return null;
  const {before,at,...command}=decision;
  let after;try{after=act(before,command);}catch(_){return null;}
  const from=forecast(before).day,to=forecast(after).day,cost=after.spent-before.spent;
  const oldLoads=workloads(before),newLoads=workloads(after);
  const loads=Object.entries(newLoads).filter(([id,n])=>oldLoads[id]!==n).map(([id,n])=>({name:state.people.find(p=>p.id===id)?.name||id,from:oldLoads[id]||0,to:n}));
  const consequences=state.events.filter(e=>{
    if(e.day<at)return false;
    if(decision.type==='acceptIT')return e.id==='it-return';
    if(decision.type==='cutSupport')return e.definition==='support'&&e.relatedAt===at;
    if(decision.type==='formalLaunch')return ['training','oldChannel'].includes(e.definition)&&state.launchedAt===at;
    if(decision.type==='assign')return e.definition==='overload'&&decision.people?.includes(e.subject)&&loads.some(l=>l.to>1&&l.name===(state.people.find(p=>p.id===e.subject)?.name));
    if(decision.type==='checkpoint')return e.definition==='rework'&&e.subject===decision.task&&at<=(e.relatedAt??e.day);
    return false;
  });
  const score=Math.abs((from||21)-(to||21))*30000+cost+consequences.length*40000+loads.reduce((n,l)=>n+Math.abs(l.to-l.from)*4000,0);
  return {index,at,label:decisionLabel(decision),cost,forecast:{from,to},loads,consequences,score};
}
export function influentialDecisions(state){return state.decisions.map((d,i)=>decisionEffects(state,d,i)).filter(Boolean).sort((a,b)=>b.score-a.score||a.at-b.at).slice(0,3);}
export function alternateCommand(decision){
  if(['coordinateIT','itBurst','itWindow','sponsorTransfer','acceptIT','escalateIT'].includes(decision.type)){
    if(decision.before.it.contacted||decision.before.it.ready)return null;
    return {type:decision.type==='itWindow'?'itBurst':'itWindow'};
  }
  if(decision.type==='checkpoint')return {type:'checkpoint',task:decision.task,value:decision.value==='early'?'none':'early'};
  if(decision.type==='cutSupport')return {type:'inspectMetrics'};
  if(decision.type==='assign'){
    const task=decision.before.tasks.find(t=>t.id===decision.task);
    const candidate=decision.before.people.filter(p=>!decision.people.includes(p.id)).sort((a,b)=>skillFit(b,task)-skillFit(a,task)||a.cost-b.cost)[0];
    return candidate?{type:'assign',task:decision.task,people:[candidate.id]}:{type:'assign',task:decision.task,people:decision.people.slice(0,1)};
  }
  if(decision.type==='priority')return {type:'priority',task:decision.task,value:decision.value===2?1:2};
  if(decision.type==='autonomy')return {type:'autonomy',task:decision.task,value:decision.value==='bounded'?'manual':'bounded'};
  if(decision.type==='pauseTask')return {type:'pauseTask',task:decision.task,value:!decision.value};
  // Omitting an action is a real alternative: no pretend task toggle stands in for it.
  return null;
}
export function causeJournal(state){
  const result=state.decisions.filter(d=>!['priority','pauseTask'].includes(d.type)).map(d=>({at:d.at,label:decisionLabel(d,state),task:d.task||null,person:d.person||null,kind:'decision'}));
  for(const e of state.events.filter(e=>['rework','overload','support','authority','training'].includes(e.definition)))result.push({at:e.day,label:e.detail||{rework:'Возврат работы',overload:'Переключения и усталость',support:'Поддержка не охватывает сценарий',authority:'Работа ждёт разрешения',training:'Запуск опередил обучение'}[e.definition],event:e.id,task:state.tasks.some(t=>t.id===e.subject)?e.subject:null,kind:'consequence'});
  return result.sort((a,b)=>a.at-b.at);
}
