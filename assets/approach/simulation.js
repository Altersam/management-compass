import {clamp,round} from './generator.js';
import {validParameters} from './parameters.js';
import {chooseEvent} from './events.js';
export function startRun(project,parameters){
  if(!validParameters(parameters))throw new Error('Настройки подхода недопустимы.');
  const run={startParameters:structuredClone(parameters),parameters:structuredClone(parameters),week:0,progress:0,work:0,accepted:0,unknowns:project.unknowns,cost:round(project.budget*.055*parameters.buffer),rework:0,lateRework:0,pendingError:project.regulation*Math.max(0,.35-parameters.upfront)*60,correction:0,reserve:parameters.buffer*project.weeks*.6,wait:0,target:100,valueCap:100,lastCheck:0,forceCheck:false,pending:null,responses:[],commands:[],rows:[],complete:false};
  run.rows.push(row(run,'design',{message:'Условия и первоначальный профиль зафиксированы.'}));return run;
}
function row(r,stage,extra={}){return {week:r.week,stage,progress:round(r.progress),work:round(r.work),accepted:round(r.accepted),unknowns:round(r.unknowns),cost:round(r.cost),rework:round(r.rework),reserve:round(r.reserve),checkpoint:false,detected:0,...extra};}
export function configureRun(r,changes,c){
  const p={...r.parameters,...changes};if(!validParameters(p))throw new Error('Настройки подхода недопустимы.');
  if(p.upfront!==r.startParameters.upfront)throw new Error('Предварительная проработка уже началась; её можно изменить в следующей попытке.');
  if(p.buffer>r.parameters.buffer){r.reserve+=(p.buffer-r.parameters.buffer)*c.weeks*.6;r.cost+=c.budget*.055*(p.buffer-r.parameters.buffer);}
  if(p.buffer<r.parameters.buffer)r.reserve=Math.min(r.reserve,p.buffer*c.weeks*.6);
  r.parameters=p;
}
export function stepWeek(input,c,events=[]){
  if(input.pending)throw new Error('Сначала выберите действие по событию.');if(input.complete)return structuredClone(input);
  const r=structuredClone(input),p=r.parameters;r.week++;
  const designWeeks=Math.ceil(r.startParameters.upfront*c.weeks),design=r.week<=designWeeks;
  const baseCost=c.budget/(c.weeks*1.15),baseCapacity=100/(c.weeks*.6)*(.7+.3*c.maturity)*(1+1.25*p.upfront*(1-c.volatility)),overhead=p.feedback*(.045+.13*(1-c.maturity))+(p.interval<=2?.075*(1.5-c.maturity):.025);
  let stage=design?'design':'execute',message=design?'Уточняем критичные условия до основной работы.':'Создаём результат; новые части ещё нужно подтвердить.',detected=0,checkpoint=false;
  if(design){
    const removed=r.unknowns*(.18+.3*p.upfront);r.unknowns=clamp(r.unknowns-removed+removed*c.volatility*.75);
    r.cost+=baseCost*(.6+.12*p.buffer);
  }else{
    const stopped=Math.min(1,r.wait);r.wait=Math.max(0,r.wait-stopped);
    let capacity=baseCapacity*(1-overhead)*(1-.12*p.buffer)*(1-stopped);
    r.cost+=baseCost*(.75+overhead+.12*p.buffer);
    if(r.correction>.01){
      stage='correction';const used=Math.min(r.reserve,.45);r.reserve-=used;capacity+=baseCapacity*used;r.cost+=baseCost*.25*used;
      const repaired=Math.min(capacity,r.correction);r.correction-=repaired;r.progress+=repaired;capacity-=repaired;message='Исправляем ранее выполненное; новая работа получает меньше мощности.';
    }
    const created=Math.max(0,Math.min(capacity,r.target-r.progress));r.progress+=created;r.work+=created;
    r.pendingError+=created*r.unknowns*(.11+.12*c.regulation*(1-p.upfront));
    r.unknowns=clamp(r.unknowns+c.volatility*.012);
    if(stopped>.01)message='Часть мощности потеряна на ожидание внешнего условия.';
    const scheduled=r.week-r.lastCheck>=p.interval,finalCheck=r.week===c.weeks,reached=r.progress>=r.target-.01&&r.week>=c.weeks;
    if(scheduled||finalCheck||r.forceCheck||reached){
      checkpoint=true;stage='control';r.lastCheck=r.week;r.forceCheck=false;
      const strength=.35+.58*p.feedback*c.feedbackAccess;
      const exposed=r.pendingError*strength;r.pendingError-=exposed;
      const lateFactor=.7+1.2*c.defectCost*r.week/c.weeks;
      detected=Math.min(r.progress*.65,exposed*lateFactor);r.progress=Math.max(0,r.progress-detected);r.correction+=detected;r.rework+=detected;
      if(r.week>c.weeks*.6)r.lateRework+=detected;
      r.unknowns=clamp(r.unknowns*(1-strength*.7));r.cost+=c.budget*.011*(.6+p.feedback*(1.4-c.maturity))+detected*c.budget/100*.35;
      r.accepted=Math.min(r.valueCap,r.progress/r.target*100*(1-r.unknowns*.2)-r.pendingError*(.5+c.defectCost));
      message=detected>.4?'Контроль обнаружил отклонение. Часть готового нужно пересмотреть.':'Контроль подтвердил рабочую часть и снял часть неизвестности.';
    }
  }
  r.progress=clamp(r.progress,0,r.target);r.accepted=clamp(r.accepted,0,r.valueCap);r.cost=round(r.cost);
  const event=events.find(e=>e.week===r.week);if(event){r.pending=event.id;message=event.title+' — требуется управленческий выбор.';}
  // Small unresolved corrections remain visible in accepted value, rather than
  // forcing an artificial sequence of tiny repair weeks to reach exactly 100.
  r.complete=!r.pending&&r.week>=c.weeks&&r.progress>=r.target-2&&r.correction<2&&r.wait<.1;
  if(r.week>=c.weeks*2+8&&!r.pending)r.complete=true;
  r.rows.push(row(r,stage,{checkpoint,detected:round(detected),event:event?.id||null,message}));return r;
}
export function decideRun(run,event,id,c){chooseEvent(run,event,id,c);const latest=run.rows.at(-1);latest.cost=round(run.cost);latest.reserve=round(run.reserve);latest.message='Решение принято. Последствия проявятся в следующих неделях и проверках.';}
export function forecast(project,parameters,current=null){
  let r=current?structuredClone(current):startRun(project,parameters);r.pending=null;
  const visibleWeek=r.week;
  while(!r.complete)r=stepWeek(r,project,[]);
  return {weeks:r.week,cost:r.cost,accepted:round(r.accepted),rows:r.rows.filter(row=>row.week>=visibleWeek)};
}
export function replayRun(project,events,startParameters,commands,week){
  if(!Number.isInteger(week)||week<0||week>project.weeks*2+8||!Array.isArray(commands)||commands.length>200)throw new Error('История попытки недопустима.');
  let r=startRun(project,startParameters);r.initialForecast=forecast(project,startParameters);let last=-1;
  for(const cmd of commands){if(!Number.isInteger(cmd.week)||cmd.week<last||cmd.week>week)throw new Error('Недопустимый момент решения.');last=cmd.week;}
  for(let w=0;w<=week;w++){
    for(const cmd of commands.filter(cmd=>cmd.week===w)){
      if(cmd.type==='configure')configureRun(r,cmd.changes,project);
      else if(cmd.type==='decision'){const event=events.find(e=>e.id===r.pending);if(!event||event.id!==cmd.event)throw new Error('Недопустимое решение события.');decideRun(r,event,cmd.choice,project);}
      else throw new Error('Неизвестное решение.');
      r.commands.push(structuredClone(cmd));
    }
    if(w<week)r=stepWeek(r,project,events);
  }
  return r;
}
