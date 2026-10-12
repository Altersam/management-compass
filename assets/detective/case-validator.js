import {mean,runPilot} from './pilot.js';
export function validateCase(book){
  const errors=[],facts=book.sources.flatMap(s=>s.facts),keys=facts.filter(f=>f.kind==='key');
  if(book.cases.length<5||book.cases.length>8)errors.push('case-count');
  if(mean(book.cases)<book.reportedCycle*1.7)errors.push('paradox');
  if(book.cases.filter(c=>c.events.some(e=>e.cause===book.archetype.id)).length<Math.ceil(book.cases.length/2))errors.push('signal');
  if(keys.length<2||new Set(keys.map(f=>f.source)).size<2)errors.push('evidence');
  if(!facts.some(f=>f.kind==='decoy'))errors.push('decoy');
  if(!book.interventions.includes('change_metric')||!book.archetype.effectiveInterventions.some(id=>runPilot(book,id).delta>=1))errors.push('intervention');
  const total=book.sources.reduce((n,s)=>n+s.cost,0),keyCost=book.sources.filter(s=>s.facts.some(f=>f.kind==='key')).reduce((n,s)=>n+s.cost,0);
  if(total-book.budget<1||total-book.budget>3||keyCost>book.budget||book.sources.length!==6)errors.push('budget');
  if(book.sources.some(s=>s.name.includes(book.archetype.title)||s.description.includes(book.archetype.title)))errors.push('disclosure');
  if(book.cases.some(c=>c.events.some(e=>!Number.isFinite(e.duration)||e.duration<=0)))errors.push('duration');
  return {valid:!errors.length,errors};
}
