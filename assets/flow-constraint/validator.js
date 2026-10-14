import {step} from './flow.js';
import {metrics} from './metrics.js';
import {detectConstraint} from './constraint.js';
import {apply} from './intervention.js';
import {witnessAction} from './strategies.js';
import {score} from './scoring.js';
const checked=new Map();
export function validateScenario(initial,{witness=true}={}){const sc=initial.scenario,errors=[];if(sc.stages.length<4||sc.stages.length>6||!sc.stages.some(st=>st.id===sc.falseLead))errors.push('structure');if(sc.stages.some(st=>st.baseCapacity<1||st.defectRate<0||st.defectRate>.65||st.reworkTarget&&!sc.stages.some(x=>x.id===st.reworkTarget)))errors.push('stages');if(sc.wipLimit>400||sc.wipLimit<sc.stages.length||sc.budget<6)errors.push('resource');
  const key=initial.seed+'#'+JSON.stringify(sc);if(witness&&!errors.length&&checked.has(key))return checked.get(key);
  const routes=[];if(witness&&!errors.length)for(const strategy of ['capacity','transfer']){const s=structuredClone(initial);for(let i=0;i<20;i++)step(s);s.baseline={metrics:metrics(s),constraint:detectConstraint(s)};s.rounds=[];s.migration=[s.baseline.constraint];try{for(let r=0;r<3;r++){const actual=detectConstraint(s),{guess,action}=witnessAction(s,strategy),before=metrics(s),control=structuredClone(s);s.guess=guess;const local=apply(s,action);for(let i=0;i<20;i++){step(s);step(control);}const after=metrics(s),constraintAfter=detectConstraint(s);s.rounds.push({guess,actual,action,local,before,after,control:metrics(control),systemDelta:metrics(control).throughput?(after.throughput/metrics(control).throughput-1)*100:0});s.migration.push(constraintAfter);}const result=score(s);routes.push({strategy,grade:result.grade,quality:result.quality,actions:s.rounds.map(r=>r.action),migration:s.migration.map(c=>c.id)});if(!['A','B'].includes(result.grade))errors.push('feasibility-'+strategy);if(s.tick!==80||s.done.some(t=>t.reworkCount>2))errors.push('termination');}catch(_){errors.push('route-'+strategy);}}
  const result={valid:!errors.length,errors,routes};if(witness){if(checked.size>200)checked.clear();checked.set(key,result);}return result;
}
