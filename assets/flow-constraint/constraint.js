import {metrics,clamp,mean} from './metrics.js';
import {inside} from './wip.js';
export function constraints(s){const m=metrics(s),list=[];
  for(const [i,st] of s.stages.entries()){if(st.removed)continue;const rate=st.currentCapacity,util=clamp(m.processed[i]/rate),growth=clamp(m.growth[i]/Math.max(1,s.scenario.demand*3)),wait=clamp(st.queue.length/Math.max(1,rate*2)),down=i+1<s.stages.length?m.starved[i+1]:0,calendar=st.policy&&!st.ruleChanged?rate/5:rate,effective=calendar*(1-st.defectRate*s.qualityFactor);
    list.push({id:st.id,type:'capacity',stageId:st.id,pressure:.25*util+.2*growth+.15*down+.1*wait+.3*clamp((s.scenario.demand-effective)/s.scenario.demand),facts:{util,growth,down,wait}});
    if((st.policy||st.batchRule>1)&&!st.ruleChanged)list.push({id:'policy:'+st.id,type:st.policy?'policy':'batch',stageId:st.id,pressure:.35+.55*m.policy[i]+.15*wait,facts:{blocked:m.policy[i],wait}});
    if(st.defectRate>0)list.push({id:'quality:'+st.id,type:'quality',stageId:st.id,pressure:clamp(st.defectRate*s.qualityFactor/.4)*.65+m.rework*.8,facts:{rework:m.rework}});
  }
  if(s.scenario.crowding)list.push({id:'wip',type:'wip',stageId:null,pressure:clamp((inside(s)-s.scenario.healthyWip)/s.scenario.healthyWip)*.7+mean(m.blocked)*.2,facts:{wip:m.wip}});
  if(s.expedite&&!s.fairPriority)list.push({id:'priority',type:'priority',stageId:null,pressure:.35+clamp((m.ordinaryAge-m.urgentAge)/5)*.65,facts:{normal:m.ordinaryAge,urgent:m.urgentAge}});
  return list.sort((a,b)=>b.pressure-a.pressure);
}
export function detectConstraint(s){return constraints(s)[0];}
export function objectName(s,id){if(id==='wip')return 'Шлюз запуска / WIP';if(id==='priority')return 'Правило срочности';const [kind,stageId]=id.includes(':')?id.split(':'):['stage',id],st=s.stages.find(st=>st.id===stageId);return (kind==='policy'?'Правило · ':kind==='quality'?'Возвраты · ':'')+(st?.title||id);}
export function sameDiagnosis(guess,actual){return guess===actual.id||guess===actual.stageId&&['quality','policy','batch'].includes(actual.type);}
