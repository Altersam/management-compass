import {task,ageAll} from './task.js';
import {inside,admit} from './wip.js';
import {capacity,nextActive} from './stage.js';
import {policyOpen,ordered,stageQuota} from './policy.js';
import {needsRework,returnTask} from './rework.js';
import {event,demandAt,urgentShare} from './event.js';
export function step(s){
  s.tick++;s.moves=[];event(s);const demand=demandAt(s);s.arrivalCredit+=demand/4;const arriving=Math.floor(s.arrivalCredit);s.arrivalCredit-=arriving;for(let i=0;i<arriving;i++)s.outside.push(task(s.seed,s.nextId++,s.tick,{urgent:urgentShare(s),typical:s.scenario.typical}));s.arrivals+=arriving;ageAll(s);
  const record={tick:s.tick,demand,arriving,completed:[],rework:0,processed:[],queues:[],blocked:[],policy:[],starved:[]};
  // Eligibility is stamped on arrival and transfer. Even a backward return cannot run twice in one interval.
  for(let i=s.stages.length-1;i>=0;i--){const st=s.stages[i],before=st.queue.length;st.last={before,processed:0,blocked:false,policyBlocked:false};
    if(st.removed){const target=nextActive(s,i);for(const t of st.queue.splice(0)){t.latentRisk=true;t.availableAt=s.tick+1;t.lastMovedAt=s.tick;t.currentStage=target?.id||'outside';(target?target.queue:s.outside).push(t);s.moves.push({id:t.id,from:st.id,to:t.currentStage,rework:false});}continue;}
    st.credit=Math.min(1,st.credit)+capacity(s,st)/4;let quota=Math.floor(st.credit);st.credit-=quota;let eligible=ordered(s,st);quota=stageQuota(st,eligible,quota);let used=0;
    for(const t of eligible){if(used>=quota)break;if(!policyOpen(s,st,t)){t.blocked=true;st.last.policyBlocked=true;continue;}let target=nextActive(s,i);const skip=st.ruleChanged&&t.typical&&st.routeRule==='standard';if(skip){t.availableAt=s.tick+1;}if(target&&target.queue.length>=target.buffer){t.blocked=true;st.last.blocked=true;break;}
      st.queue.splice(st.queue.indexOf(t),1);used+=skip?.45:1;st.last.processed++;t.availableAt=s.tick+1;t.lastMovedAt=s.tick;
      const check=st.defectRate>0||!target;if(check&&needsRework(s,st,t)){record.rework++;returnTask(s,st,t);continue;}
      if(target){if(s.stages.some(x=>x.removed))t.latentRisk=true;t.currentStage=target.id;target.queue.push(t);s.moves.push({id:t.id,from:st.id,to:target.id,rework:false});}else{t.completed=true;t.currentStage='done';t.finishedAt=s.tick;s.done.push(t);record.completed.push({id:t.id,age:t.age,priority:t.priority});s.moves.push({id:t.id,from:st.id,to:'done',rework:false});}
    }
    st.last.starved=eligible.length===0;st.last.batchBlocked=eligible.length>0&&quota===0&&st.batchRule>1;
    record.processed[i]=st.last.processed;record.blocked[i]=st.last.blocked?1:0;record.policy[i]=st.last.policyBlocked||st.last.batchBlocked?1:0;record.starved[i]=st.last.starved?1:0;
  }
  admit(s);record.queues=s.stages.map(st=>st.queue.length);record.wip=inside(s);record.outside=s.outside.length;record.quarantine=s.quarantine.length;s.samples.push(record);return s;
}
