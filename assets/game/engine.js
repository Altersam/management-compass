import {tickSize,random,finished} from './state.js';
import {contractor,skillFit,available} from './people.js';
import {complete,blockers,taskStatus} from './project.js';
import {emit,schedule,closeEvents} from './events.js';

const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const taskById=(s,id)=>{const t=s.tasks.find(t=>t.id===id);if(!t)throw new Error('Задача не найдена.');return t;};
function pay(s,cost){if(s.spent+cost>s.budget)throw new Error('На это решение не осталось бюджета.');s.spent+=cost;}
export function workloads(s){
  const active=s.tasks.filter(t=>taskStatus(s,t)==='active');
  return Object.fromEntries(s.people.map(p=>[p.id,active.filter(t=>t.assigned.includes(p.id)).length]));
}
export function dailyCost(s){return s.people.reduce((n,p)=>n+p.cost,0)*(s.supportCut?0.85:1);}
export function rate(s,task,loads=workloads(s)){
  if(taskStatus(s,task)!=='active')return 0;
  const team=task.assigned.map(id=>s.people.find(p=>p.id===id)).filter(p=>p&&available(p,s.time));
  return team.reduce((sum,p,i)=>{
    const load=Math.max(1,loads[p.id]),burst=load>1&&p.overloadTime<1?1.18:1;
    const focus=burst/Math.pow(load,p.overloadTime<1?0.65:1.1);
    const weight=t=>t.priority===2?1.5:t.priority===0?0.6:1;
    const competing=s.tasks.filter(t=>taskStatus(s,t)==='active'&&t.assigned.includes(p.id));
    const priority=weight(task)/(competing.reduce((n,t)=>n+weight(t),0)/load||1);
    return sum+(p.speed/2)*(0.45+0.75*skillFit(p,task))*focus*Math.max(0.4,1-p.fatigue*0.65)*priority*(task.autonomy==='free'?1.08:1)/(1+i*0.65);
  },0);
}
export function reliability(s){
  const worked=s.tasks.filter(t=>t.progress>0);
  return worked.length?worked.reduce((n,t)=>n+t.quality,0)/worked.length:0.72;
}
export function risk(s){
  const load=Object.values(workloads(s)).filter(n=>n>1).length;
  return clamp((1-reliability(s))*0.65+load*0.08+(!s.it.ready&&s.time>6?0.15:0)+(s.it.riskAccepted?0.12:0)+(s.launchedAt!==null&&s.adoption<40?0.1:0));
}
function delayedEffects(s){
  const due=s.delayed.filter(e=>e.due<=s.time+0.00001);s.delayed=s.delayed.filter(e=>e.due>s.time+0.00001);
  for(const effect of due){
    if(effect.effect==='rework'){
      const t=taskById(s,effect.payload.task),amount=effect.payload.amount;
      t.effort+=amount;t.completedAt=null;t.quality=clamp(t.quality-0.08);s.stats.rework+=amount;s.stats.reworkCost+=18000*amount;s.spent+=18000*amount;
      emit(s,'rework',{key:effect.key,subject:t.id,detail:`${t.name}: ещё ${amount.toFixed(1)} рабочего дня. Причина: ${effect.payload.reason}`});
    }else if(effect.effect==='learn'){
      const p=s.people.find(p=>p.id===effect.payload.person);p.skills[effect.payload.skill]=Math.min(3,(p.skills[effect.payload.skill]||0)+1);
    }else if(effect.effect==='support'){
      if(s.supportCut){s.flags.supportEffective=true;s.adoption=Math.max(0,s.adoption-15);emit(s,'support',{key:'support-'+effect.key});}
    }else if(effect.effect==='metrics')s.metricsInvestigated=true;
  }
}
function externalEvents(s){
  if(s.time>=s.externalPlan.requirementsDay&&!s.flags.requirementsArrived){
    s.flags.requirementsArrived=true;
    if(s.scope==='full'&&!s.flags.requirementsAligned){
      s.flags.requirementsChanged=true;emit(s,'requirements');
      const proto=taskById(s,'prototype');
      if(complete(proto)&&proto.checkpoint!=='early')schedule(s,'rework',1.5,{task:proto.id,amount:1.25,reason:'изменённое условие после готового прототипа'},'requirements-return');
    }
  }
  if(s.time>=s.externalPlan.illnessDay&&!s.flags.illnessArrived){
    s.flags.illnessArrived=true;const p=s.people.find(p=>p.id===s.externalPlan.illPerson);p.absentUntil=s.time+2;
    emit(s,'illness',{subject:p.id,detail:`${p.name} вернётся к дню ${Math.ceil(p.absentUntil)+1}.`});
  }
  if(s.time>=s.externalPlan.itDay&&!s.flags.itArrived){
    s.flags.itArrived=true;if(!s.it.ready)emit(s,'it');
  }
  if(s.time>=s.it.readyAt){s.it.ready=true;closeEvents(s,'it');}
  if(s.flags.illnessArrived&&s.time>=s.people.find(p=>p.id===s.externalPlan.illPerson).absentUntil)closeEvents(s,'illness');
}
function taskCompleted(s,t){
  t.completedAt=Math.min(s.deadline,s.time+tickSize);t.completionCount++;
  closeEvents(s,'rework',t.id);
  if(t.id==='requirements'&&t.checkpoint==='early'&&t.quality>=0.65){s.flags.requirementsAligned=true;closeEvents(s,'requirements');}
  if(t.completionCount===1){
    if(t.id==='prototype'&&t.checkpoint!=='early'&&s.flags.requirementsChanged&&!s.flags.requirementsAligned)schedule(s,'rework',1.5,{task:t.id,amount:1.25,reason:'несверенные требования'},'requirements-return');
    else if(t.id!=='launch'&&t.quality<0.75&&t.checkpoint!=='early'&&random(s)<clamp(t.risk+(0.75-t.quality)*3.5,0.15,0.95))schedule(s,'rework',1.5,{task:t.id,amount:0.75,reason:'ошибка обнаружена на следующем этапе'},'quality-return-'+t.id);
    if(t.id==='integration'&&s.it.riskAccepted)schedule(s,'rework',1.25,{task:t.id,amount:1.5,reason:'интеграция без подтверждённого доступа'},'it-return');
  }
  if(t.id==='launch'&&s.launchedAt===null){s.launchedAt=t.completedAt;s.phase='observing';}
}
function causalEvents(s,loads){
  for(const p of s.people){
    if(loads[p.id]>1&&p.overloadTime>=1)emit(s,'overload',{key:'overload-'+p.id,subject:p.id,detail:`${p.name}: ${loads[p.id]} активных задачи одновременно.`});
    if(loads[p.id]<=1)closeEvents(s,'overload',p.id);
  }
  for(const t of s.tasks){
    if(t.awaitingDecision)emit(s,'authority',{key:'authority-'+t.id,subject:t.id,detail:t.name});
    if(taskStatus(s,t)==='active'&&t.autonomy==='free'&&t.assigned.some(id=>skillFit(s.people.find(p=>p.id===id),t)<0.5))emit(s,'unsafe',{key:'unsafe-'+t.id,subject:t.id,detail:t.name});
    const waiting=s.tasks.filter(other=>other.dependencies.includes(t.id)&&!complete(other));
    if(!complete(t)&&waiting.length&&s.time>=t.start+1&&rate(s,t)<0.5)emit(s,'bottleneck',{key:'bottleneck-'+t.id,subject:t.id,detail:`${t.name} удерживает следующий этап.`});
    if(complete(t))closeEvents(s,'bottleneck',t.id);
  }
  if(s.launchedAt!==null&&s.time>=s.launchedAt+0.75){
    if(!complete(taskById(s,'training')))emit(s,'training');else closeEvents(s,'training');
    if(!s.leaderExample)emit(s,'oldChannel');
  }
  if(s.launchedAt!==null&&s.time>=Math.max(17,s.launchedAt+1))emit(s,'metrics');
}
export function advance(state,dt=tickSize){
  if(finished(state))return structuredClone(state);
  if(!Number.isFinite(dt)||dt<=0||dt>tickSize)throw new Error('Недопустимый интервал времени.');
  const s=structuredClone(state);s.phase=s.launchedAt===null?'running':'observing';
  const step=Math.min(dt,s.deadline-s.time),loads=workloads(s);
  s.spent+=dailyCost(s)*step;
  for(const p of s.people){
    const load=loads[p.id];
    if(load>1){p.overloadTime+=step;p.fatigue=clamp(p.fatigue+0.18*step*(load-1));s.stats.overloadDays+=step;}
    else {p.overloadTime=Math.max(0,p.overloadTime-step*0.5);p.fatigue=clamp(p.fatigue-(load===0?0.14:0.04)*step);}
    if(s.time<p.trainingUntil)s.stats.trainingDays+=step;
  }
  // Snapshot eligible tasks: completing a dependency opens its successor on the next tick.
  const eligible=s.tasks.filter(t=>taskStatus(s,t)==='active');
  for(const t of eligible){
    if(t.autonomy==='manual'&&!t.manualReviewed&&t.progress>=t.effort*0.5){t.awaitingDecision=true;continue;}
    if(t.checkpoint!=='none'&&!t.checkpointPaid){t.effort+=t.checkpoint==='early'?0.35:0.15;t.checkpointPaid=true;s.stats.checks++;s.spent+=6000;}
    const amount=Math.min(t.effort-t.progress,rate(s,t,loads)*step);
    if(amount>0&&t.startedAt===null)t.startedAt=s.time;
    const team=t.assigned.map(id=>s.people.find(p=>p.id===id)).filter(p=>available(p,s.time));
    const quality=clamp(team.reduce((sum,p)=>sum+0.35+0.13*p.quality+0.16*skillFit(p,t)-0.18*p.fatigue-0.07*Math.max(0,loads[p.id]-1),0)/team.length+(t.checkpoint==='early'?0.1:0)+(t.checkpoint==='final'?0.03:0)-(t.autonomy==='free'?0.07:0)-(t.priority===2?0.025:0));
    t.quality=(t.quality*t.qualityWeight+quality*amount)/(t.qualityWeight+amount||1);t.qualityWeight+=amount;t.progress+=amount;
    if(complete(t))taskCompleted(s,t);
  }
  s.stats.manualWaiting+=s.tasks.filter(t=>t.awaitingDecision).length*step;
  s.time=Math.round((s.time+step)*10000)/10000;
  externalEvents(s);delayedEffects(s);causalEvents(s,workloads(s));
  if(s.launchedAt!==null){
    const training=taskById(s,'training'),trained=complete(training),trainingQuality=trained?(training.quality-0.7)*30:0;
    const target=(trained?78:32)+trainingQuality+(s.leaderExample?12:-15)-(s.flags.supportEffective?25:0);
    s.adoption=clamp(s.adoption+(target-s.adoption)*step*0.45,0,100);
  }
  s.history.push({time:s.time,spent:s.spent,adoption:s.adoption,quality:reliability(s),completed:s.tasks.filter(complete).length});
  if(s.time>=s.deadline||s.spent>=s.budget){s.phase='ended';s.endReason=s.spent>=s.budget?'budget':'deadline';}
  return s;
}
export function act(state,command){
  if(finished(state))throw new Error('Этот проект уже завершён. Можно начать новый.');
  const s=structuredClone(state),t=command.task?taskById(s,command.task):null;
  const type=command.type;
  if(type==='assign'){
    if(complete(t))throw new Error('Задача уже готова.');
    if(!Array.isArray(command.people)||new Set(command.people).size!==command.people.length||command.people.some(id=>!s.people.some(p=>p.id===id)))throw new Error('Неверное назначение.');
    t.assigned=[...command.people];
  }else if(type==='priority'){
    if(![0,1,2].includes(command.value))throw new Error('Неверный приоритет.');t.priority=command.value;
  }else if(type==='pauseTask')t.paused=Boolean(command.value);
  else if(type==='checkpoint'){
    if(!['none','early','final'].includes(command.value)||complete(t))throw new Error('Проверку нужно запланировать до завершения.');
    if(t.checkpointPaid&&t.progress<t.effort*0.5){
      const extra=kind=>kind==='early'?0.35:kind==='final'?0.15:0;
      t.effort=Math.max(t.progress+0.1,t.effort+extra(command.value)-extra(t.checkpoint));
    }
    t.checkpoint=command.value;
  }else if(type==='autonomy'){
    if(!['bounded','manual','free'].includes(command.value))throw new Error('Неверная граница решения.');
    t.autonomy=command.value;if(t.autonomy!=='manual'){t.awaitingDecision=false;closeEvents(s,'authority',t.id);}
  }else if(type==='clarify'){
    if(s.flags.requirementsAligned)throw new Error('Требования уже сверены.');pay(s,12000);s.flags.requirementsAligned=true;closeEvents(s,'requirements');
    const req=taskById(s,'requirements');if(!complete(req))req.effort+=0.5;
  }else if(type==='coordinateIT'){
    if(s.it.contacted||s.it.ready)throw new Error('Окно IT уже согласовано.');pay(s,15000);s.it.contacted=true;s.it.readyAt=Math.max(6,s.time+1.5);
  }else if(type==='escalateIT'){
    if(s.it.ready)throw new Error('Ответ IT уже получен.');pay(s,30000);s.stats.manualDecisions++;s.it.contacted=true;s.it.readyAt=Math.min(s.it.readyAt,s.time+0.75);
  }else if(type==='acceptIT'){
    if(s.it.riskAccepted||s.it.ready)throw new Error('Это решение уже не требуется.');s.it.riskAccepted=true;closeEvents(s,'it');
  }else if(type==='approve'){
    if(!t?.awaitingDecision)throw new Error('Задача не ждёт решения.');t.manualReviewed=true;t.awaitingDecision=false;s.stats.manualDecisions++;closeEvents(s,'authority',t.id);
  }else if(type==='hire'){
    if(s.people.some(p=>p.id===contractor.id))throw new Error('Эксперт уже в проекте.');pay(s,20000);s.people.push({...structuredClone(contractor),fatigue:0,overloadTime:0,absentUntil:0,trainingUntil:0});
  }else if(type==='coach'){
    const p=s.people.find(p=>p.id===command.person);if(!p||!available(p,s.time)||!Object.hasOwn(p.skills,command.skill)||p.skills[command.skill]>=3)throw new Error('Этот навык сейчас нельзя развить.');
    pay(s,15000);p.trainingUntil=s.time+1;schedule(s,'learn',1,{person:p.id,skill:command.skill},`learn-${p.id}-${command.skill}-${s.time}`);
  }else if(type==='scope'){
    if(s.scope==='lean')throw new Error('Пилот уже сокращён.');s.scope='lean';
    for(const id of ['prototype','integration']){const task=taskById(s,id);if(!complete(task))task.effort=Math.max(task.progress+0.25,task.effort*0.75);}
    s.flags.requirementsAligned=true;closeEvents(s,'requirements');
  }else if(type==='formalLaunch'){
    if(s.time<12||s.launchedAt!==null||!complete(taskById(s,'integration')))throw new Error('Для формального запуска нужна готовая интеграция и день 13.');
    const launch=taskById(s,'launch');launch.progress=launch.effort;launch.startedAt=s.time;launch.completedAt=s.time;launch.quality=reliability(s);s.formalLaunch=true;s.launchedAt=s.time;s.phase='observing';
  }else if(type==='alignLeaders'){
    if(s.leaderExample)throw new Error('Единый канал уже согласован.');pay(s,10000);s.leaderExample=true;
    const coordinator=s.people.find(p=>p.id==='irina');coordinator.trainingUntil=Math.max(coordinator.trainingUntil,s.time+0.5);
    closeEvents(s,'oldChannel');
  }else if(type==='inspectMetrics'){
    if(s.flags.metricsRequested)throw new Error('Проверка уже запрошена.');pay(s,12000);s.flags.metricsRequested=true;schedule(s,'metrics',1);closeEvents(s,'metrics');
  }else if(type==='cutSupport'){
    if(s.supportCut||s.launchedAt===null)throw new Error('Поддержка сейчас не может быть сокращена.');s.supportCut=true;schedule(s,'support',2,{},'support-'+s.time);closeEvents(s,'metrics');
  }else if(type==='restoreSupport'){s.supportCut=false;s.flags.supportEffective=false;closeEvents(s,'support');}
  else throw new Error('Неизвестное решение.');
  s.decisions.push({...structuredClone(command),at:s.time});return s;
}
export function forecast(state){
  // Run current allocations on a clone. This is a conditional forecast, not an oracle.
  const s=structuredClone(state);s.externalPlan={...s.externalPlan,requirementsDay:99,illnessDay:99,itDay:99};
  let probe=s;
  for(let i=0;i<Math.ceil((20-s.time)/tickSize);i++){if(probe.launchedAt!==null)break;if(finished(probe))break;probe=advance(probe);}
  if(probe.launchedAt!==null)return {day:Math.ceil(probe.launchedAt),uncertain:true};
  return {day:null,uncertain:true};
}
export {blockers,taskStatus};
