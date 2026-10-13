import {principles,ethicalArchetypes} from './principles.js';
import {issues} from './documents.js';
export function validateScenario(s){
  const errors=[],keys=Object.keys(principles),ids=new Set(s.documents.map(d=>d.id));
  if(s.options.length<3||s.options.length>4||s.documents.length<5||s.documents.length>7)errors.push('content-count');
  if(new Set(s.archetypes).size<2||s.archetypes.some(a=>!ethicalArchetypes.includes(a)))errors.push('archetypes');
  if(s.options.some(a=>s.options.some(b=>a.id!==b.id&&keys.every(k=>b.profile[k]>=a.profile[k])&&keys.some(k=>b.profile[k]>a.profile[k]))))errors.push('dominance');
  if(!s.documents.some(d=>d.issue==='NONE')||!s.documents.some(d=>d.issue==='BIAS')||!s.documents.some(d=>d.conflictsWith.length)||!s.documents.some(d=>d.issue!=='NONE'))errors.push('evidence');
  if(s.checks<2||s.checks>4||s.checks>=s.documents.length)errors.push('check-budget');
  if(s.documents.some(d=>!issues.includes(d.issue)||!d.text||!d.authorRole||!d.checkResult.text||d.conflictsWith.some(id=>!ids.has(id))))errors.push('document-schema');
  if(s.options.some(o=>!o.plus||!o.minus||o.plus===o.minus||!o.longTerm))errors.push('trade-offs');
  if(s.options.filter(o=>s.documents.some(d=>d.issue==='NONE'&&d.supports.includes(o.id))&&s.mitigations.some(m=>m.covers.includes(o.risk))).length<2)errors.push('strategies');
  if(!s.mitigations.some(m=>s.options.some(o=>m.covers.includes(o.risk)))||!s.mitigations.some(m=>m.covers.includes('uncertainty')))errors.push('protection');
  if(!s.future.unavailableAtDecision||!s.future.text||s.documents.some(d=>d.text.includes(s.future.text)))errors.push('future');
  if(s.documents.find(d=>d.id==='rule')?.issue!=='NONE')errors.push('invariant-rule');
  return {valid:!errors.length,errors};
}
