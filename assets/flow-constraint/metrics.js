import {inside} from './wip.js';
export const mean=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:0;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const round=(x,d=1)=>Math.round(x*10**d)/10**d;
export function metrics(s,from=Math.max(0,s.tick-20)){
  const rows=s.samples.filter(r=>r.tick>from),completed=rows.flatMap(r=>r.completed),days=rows.length/4,returns=rows.reduce((n,r)=>n+r.rework,0),active=[...s.outside,...s.stages.flatMap(st=>st.queue)],ordinary=active.filter(t=>t.priority==='normal'),urgent=active.filter(t=>t.priority==='urgent');
  return {demand:round(mean(rows.map(r=>r.demand))||s.scenario.demand),throughput:round(completed.length/Math.max(.25,days)),cycle:round(mean(completed.map(t=>t.age))),pendingAge:round(mean(active.map(t=>t.age))),ordinaryAge:round(mean(ordinary.map(t=>t.age))),urgentAge:round(mean(urgent.map(t=>t.age))),wip:inside(s),outside:s.outside.length,rework:round(returns/Math.max(1,returns+completed.length),3),quarantine:s.quarantine.length,processed:s.stages.map((_,i)=>round(rows.reduce((n,r)=>n+(r.processed[i]||0),0)/Math.max(.25,days))),queueMean:s.stages.map((_,i)=>round(mean(rows.map(r=>r.queues[i]||0)))),growth:s.stages.map((st,i)=>st.queue.length-(rows[0]?.queues[i]||0)),blocked:s.stages.map((_,i)=>mean(rows.map(r=>r.blocked[i]||0))),policy:s.stages.map((_,i)=>mean(rows.map(r=>r.policy[i]||0))),starved:s.stages.map((_,i)=>mean(rows.map(r=>r.starved[i]||0))),day:round(s.tick/4),completed:completed.length};
}
