import {activeTasks,startCapacity,load,remaining} from './capacity.js';
import {applyEffects,deteriorate} from './goals.js';
import {round} from './random.js';
import {reviewSprint} from './review.js';
export function beginSprint(s){
  s.run={day:0,capacity:startCapacity(s),work:0,planned:load(s),before:[...s.values],completed:[],responses:[],pending:null,ignored:[],rows:[],cancelled:[...s.cancelled]};
  s.phase='running';s.paused=false;s.run.rows.push(snapshot(s,'План принят. Фактическая мощность уточнилась.'));return s;
}
function snapshot(s,message,event=null){return {day:s.run.day,capacity:s.run.capacity,work:round(s.run.work),active:activeTasks(s),progress:{...s.progress},completed:s.run.completed.map(t=>t.id),event,message};}
export function advanceDay(s){
  if(s.run.pending)throw new Error('Сначала решите событие.');if(s.run.day>=8)throw new Error('Спринт уже завершён.');s.run.day++;
  const active=activeTasks(s),budget=Math.max(0,s.run.capacity-s.run.work),daily=Math.min(budget,budget/Math.max(1,9-s.run.day)),share=active.length?daily/active.length:0;
  // All initially active tasks receive work. Completion effects follow the actual
  // instant within the day, so a short successor cannot use a later prerequisite.
  const finish=active.filter(id=>remaining(s,id)<=share+.000001).sort((a,b)=>remaining(s,a)-remaining(s,b));
  for(const id of active){const used=Math.min(remaining(s,id),share);s.progress[id]=(s.progress[id]||0)+used;s.run.work+=used;}
  for(const id of finish){
    const t=s.tasks.find(t=>t.id===id),ready=!t.requires||s.effectiveDone.includes(t.requires),expired=t.window&&s.sprint>t.window;
    s.done.push(id);s.progress[id]=t.size;s.run.completed.push({id,day:s.run.day,ready,expired});
    if(ready){s.effectiveDone.push(id);s.values=applyEffects(s.values,t,s.scenario,expired?.35:1);if(t.investment)s.investment+=t.investment;}
  }
  const event=s.scenario.events.find(e=>e.sprint===s.sprint&&e.day===s.run.day);
  s.run.rows.push(snapshot(s,event?event.title:finish.length?'Завершённая работа проверена по результату. Следующие задачи входят в WIP.':'Работа продвинулась. Незавершённые изменения пока не дают результата.',event?.id||null));
  if(event){s.run.pending=event.id;s.phase='event';s.paused=true;}
  else if(s.run.day>=8){for(const i of s.run.ignored)s.values=deteriorate(s.values,s.scenario,i);reviewSprint(s);}
  return s;
}
