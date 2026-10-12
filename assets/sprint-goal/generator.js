import {domains} from './domains.js';
import {randomFrom,round} from './random.js';
import {generateBacklog} from './backlog.js';
export function generateScenario(seed){
  const r=randomFrom(seed),d=domains[Math.floor(r()*domains.length)],capacity=23+Math.floor(r()*5);
  const criteria=d.criteria.map(([name,unit,initial,target,higher],i)=>{
    const gap=Math.abs(initial-target),base=round(initial+(r()-.5)*gap*.12),threshold=round(target+(r()-.5)*gap*.08);
    const count=['ошибки','вопроса'].includes(unit);
    return {id:'criterion-'+i,name,unit:count?'шт.':unit,initial:count?Math.round(base):base,target:count?Math.round(threshold):threshold,higher};
  });
  const tasks=generateBacklog(d,r),events=[];
  tasks.find(t=>t.id==='task-3').requires=r()>.5?'task-2':'task-1';
  for(let sprint=1;sprint<=2;sprint++){
    const count=r()>.45?2:1,first=Math.floor(r()*2),indexes=count===2?[first,2]:[sprint===2?2:first];
    const days=[];for(const index of indexes){let day;do{day=2+Math.floor(r()*5);}while(days.includes(day));days.push(day);const [title,text,kind]=d.events[index];events.push({id:d.id+'-'+sprint+'-'+index,sprint,day,title,text,kind,units:3+Math.floor(r()*3),criterion:Math.floor(r()*3)});}
  }
  events.sort((a,b)=>a.sprint-b.sprint||a.day-b.day);
  return {domain:d.id,domainName:d.name,title:d.titles[Math.floor(r()*d.titles.length)],goal:d.goal,capacity,criteria,tasks,events,actualFactors:[round(.9+r()*.2),round(.9+r()*.2)],initialWip:1+Math.floor(r()*3),transition:{capacityDelta:Math.floor(r()*3)-1,priority:Math.floor(r()*3)}};
}
