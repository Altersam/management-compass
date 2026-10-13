import {metrics,stable} from './adoption.js';
export function report(s){
  const m=metrics(s.nodes,s.scenario.threshold),diagnostics=s.nodes.filter(n=>n.barrierKnown),actions=s.interventions.filter(a=>a.action!=='diagnose'),fit=actions.length?actions.filter(a=>a.fit).length/actions.length:0,centres=s.nodes.filter(n=>n.influence>=4),centreWork=centres.filter(n=>n.barrierKnown&&n.commitment>=55).length/centres.length;
  const indirect=s.nodes.filter(n=>!n.touched&&stable(n,s.scenario.threshold)&&!stable(s.scenario.nodes.find(initial=>initial.id===n.id),s.scenario.threshold));
  const pressure=actions.filter(a=>a.action==='pressure'&&!a.fit).length,efficiency=indirect.length?1:.5;
  const before=s.history[3]?.metrics.accepted||0,corrected=s.history.length>=4&&s.history[3].metrics.accepted>s.history[0].metrics.accepted;
  const points=m.accepted/s.nodes.length*30+Math.min(1,diagnostics.length/3)*20+fit*20+centreWork*15+Math.max(0,10-pressure*2)+efficiency*5+(corrected?4:0);
  const diagnoses=[];
  if(actions.some(a=>a.action==='train'&&!a.fit))diagnoses.push('Часть обучения не соответствовала барьеру: навык не заменил ресурс или признание роли.');
  if(centres.some(n=>n.commitment<50))diagnoses.push('Не все центры влияния приняли конструкцию; их связи продолжали распространять сомнение.');
  if(s.nodes.some(n=>!n.resolved&&['process','incentives'].includes(n.barrier)))diagnoses.push('Часть групп поддержала идею, но правила или стимулы не изменились. Коммуникация не сделала новую практику исполнимой.');
  if(pressure>1)diagnoses.push('Контроль создал видимое выполнение. После снятия давления проверялась отдельная устойчивость.');
  if(indirect.length&&m.accepted>=Math.ceil(s.nodes.length/2))diagnoses.push('Часть групп изменилась через сеть без прямого вмешательства.');
  if(!diagnoses.length)diagnoses.push('Сопоставьте диагноз, выбранный инструмент и распространение практики, а не только долю использующих.');
  return {grade:points>=85?'A':points>=70?'B':points>=52?'C':points>=35?'D':'F',metrics:m,corrected,status:m.accepted>=Math.ceil(s.nodes.length*.6)?'Изменение прижилось':m.use>=50?'Формально внедрено, но хрупко':'Сеть откатила изменение',diagnoses,retained:m.accepted>=before};
}
