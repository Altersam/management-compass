import {achieved,distanceProgress} from './goals.js';
import {remaining} from './capacity.js';
import {round} from './random.js';
export function reviewSprint(s){
  const done=s.run.completed.map(x=>x.id),tail=s.selected.filter(id=>!s.done.includes(id)),tailUnits=round(tail.reduce((n,id)=>n+remaining(s,id),0));
  s.tail=tail;
  const r={sprint:s.sprint,before:[...s.run.before],after:[...s.values],work:round(s.run.work),completed:done,tail:[...tail],tailUnits,wip:s.wip,capacity:s.run.capacity,planned:s.run.planned,reached:achieved(s.scenario,s.values),dependencyMisses:s.run.completed.filter(t=>!t.ready).map(t=>t.id),expired:s.run.completed.filter(t=>t.expired).map(t=>t.id),investment:done.filter(id=>s.tasks.find(t=>t.id===id).investment).length,responses:[...s.run.responses],cancelled:[...s.run.cancelled],rows:structuredClone(s.run.rows)};
  r.goalProgress=round(s.scenario.criteria.reduce((n,c,i)=>n+distanceProgress(c,s.values[i]),0)/3);
  s.reviews.push(r);s.phase='review';s.paused=true;return s;
}
export function score(s){
  const [first,last]=s.reviews;if(!last)return {grade:null,improved:false};
  const corrected=last.reached>first.reached&&last.goalProgress>first.goalProgress;
  const acceptedTempt=s.reviews.flatMap(r=>r.responses).filter(e=>e.kind==='tempt'&&e.choice==='take').length;
  const misses=s.reviews.reduce((n,r)=>n+r.dependencyMisses.length,0);
  const efficiency=Math.min(1,last.goalProgress/Math.max(.5,(s.reviews.reduce((n,r)=>n+r.work,0)/(s.scenario.capacity*2))));
  const points=last.reached*18+last.goalProgress*8+Math.max(0,12-last.tailUnits)+efficiency*8+(last.wip<=2?5:2)+(misses?0:5)+(acceptedTempt?0:5)+(corrected?10:3);
  return {grade:points>=83?'A':points>=68?'B':points>=46?'C':'D',improved:corrected,slowerBetter:last.work<first.work&&last.reached>first.reached};
}
