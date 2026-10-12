import {criticalParticipant} from './constraints.js';
export function report(s){
  const last=s.attempts.at(-1);if(!last)return {grade:null};
  const critical=s.scenario.participants.filter(criticalParticipant),confirmed=critical.filter(p=>last.commitments[p.id].commitment?.accepted).length,known=critical.filter(p=>s.participants[p.id].constraintKnown).length;
  const corrected=s.attempts.length===2&&!s.attempts[0].success&&last.success;
  const linked=last.linkedDeals.includes('resource-finance')&&last.draft.staffing==='temporary'&&last.draft.budget==='reserve',points=(last.success?60:12)+confirmed/critical.length*20+known/critical.length*10+(linked?5:2)+(corrected?6:0)+Math.max(0,5-s.redundant);
  return {grade:points>=85?'A':points>=70?'B':points>=50?'C':points>=30?'D':'F',success:last.success,confirmed,known,corrected,support:last.support.length};
}
