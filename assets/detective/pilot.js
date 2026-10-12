import {measures} from './archetypes.js';
export const round=n=>Math.round(n*100)/100;
export const cycle=c=>round(c.events.reduce((n,e)=>n+e.duration,0));
export const mean=cases=>round(cases.reduce((n,c)=>n+cycle(c),0)/cases.length);
export function runPilot(book,id){
  if(!book.interventions.includes(id)||!measures[id])throw new Error('Изменение не найдено.');
  const effective=book.archetype.effectiveInterventions.includes(id),partial=book.archetype.partialInterventions.includes(id);
  const afterCases=book.cases.map(c=>({...c,events:c.events.map(e=>{
    let factor=1;
    if(e.cause===book.archetype.id&&(effective||partial))factor=effective?.3:.8;
    if(id==='automate_registration'&&e.stage==='register'&&e.type==='admin')factor=.45;
    if(id==='faster_work'&&e.type==='work')factor=.85;
    const duration=round(e.duration*factor);
    return {...e,duration,delta:round(e.duration-duration),changed:Math.abs(e.duration-duration)>=.01};
  })}));
  const before=mean(book.cases),after=mean(afterCases);
  return {before,after,delta:round(before-after),reportedBefore:book.reportedCycle,reportedAfter:id==='change_metric'?after:round(afterCases.reduce((n,c)=>n+c.events.filter(e=>e.type==='work').reduce((v,e)=>v+e.duration,0),0)/afterCases.length),afterCases};
}
