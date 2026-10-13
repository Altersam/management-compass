import {headline} from './metric.js';
import {simulatePeriod,firstRow,periodStatus} from './period.js';
import {evidenceQuality} from './evidence.js';
import {distortionTypes} from './distortion.js';
export function validateScenario(sc,{witness=true}={}){
  const errors=[];if(!headline(sc).positive)errors.push('headline');if(sc.outcome.before===sc.outcome.now)errors.push('outcome');if(!sc.root||!sc.patterns.length||sc.patterns.some(p=>!distortionTypes.includes(p)))errors.push('distortion');
  if(sc.probes.length<6||sc.probes.filter(p=>p.role==='key').length<2||!sc.probes.some(p=>p.role==='support')||!sc.probes.some(p=>p.role==='decoy')||sc.probes.some(p=>p.cost!==1))errors.push('probes');
  if(sc.metrics.filter(m=>!m.removed).length<3||sc.metrics.some(m=>!m.removed&&(!m.possibleGamingModes.length||m.gameability===0)))errors.push('metrics');if(sc.guards.length<3)errors.push('guards');if(sc.cardPool.length<5||sc.caseCards.length<2||sc.caseCards.some(c=>!sc.cardPool.some(p=>p.id===c.id)||!Number.isFinite(sc.process[c.group])||sc.process[c.group]<1))errors.push('cards');
  if(sc.process.counted+sc.process.excluded!==sc.process.total||sc.process.pending>sc.process.excluded)errors.push('counts');
  if(witness&&!errors.length){
    const routes=[];for(let i=0;i<sc.probes.length;i++)for(let j=i+1;j<sc.probes.length;j++)for(let k=j+1;k<sc.probes.length;k++){const opened=[sc.probes[i].id,sc.probes[j].id,sc.probes[k].id];if(evidenceQuality({scenario:sc,opened}).value>.85)routes.push(opened);}if(routes.length<2)errors.push('investigative-routes');
    const statuses=new Set();let improvement=false;for(const m of sc.metrics)for(const g of sc.guards){const s={scenario:sc,metricId:m.id,guardId:g.id,diagnosis:sc.diagnoses.filter(d=>['root','secondary'].includes(d.kind)).map(d=>d.id),rows:[]};s.rows.push(firstRow(s));for(let p=0;p<3;p++)s.rows.push(simulatePeriod(s));statuses.add(periodStatus(s));if(s.rows[3].real-s.rows[0].real>10)improvement=true;}if(!statuses.has('migrated'))errors.push('migration');if(!improvement||!statuses.has('restored'))errors.push('feasible-design');
  }return {valid:!errors.length,errors};
}
