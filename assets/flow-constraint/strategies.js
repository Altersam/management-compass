// Feasibility witnesses only. The renderer never imports this policy or marks its recommendation.
import {detectConstraint} from './constraint.js';
import {donors} from './intervention.js';
import {metrics} from './metrics.js';
export function witnessAction(s,strategy='capacity'){
  const c=detectConstraint(s),st=s.stages.find(st=>st.id===c.stageId),object=c.id;
  if(c.type==='quality'||st&&s.stages.some(x=>x.reworkTarget===st.id&&x.qualityFactor>.5)&&metrics(s).rework>.11)return {guess:object,action:{type:'quality',target:st.id,object}};
  if(['policy','batch','priority'].includes(c.type))return {guess:object,action:{type:'rule',target:st?.id,object}};
  if(c.type==='wip')return {guess:object,action:{type:'wip',limit:s.scenario.healthyWip,object}};
  if(st.routeRule&&!st.ruleChanged&&strategy==='capacity')return {guess:object,action:{type:'rule',target:st.id,object}};
  if(strategy==='transfer'){const donor=donors(s,st).sort((a,b)=>b.currentCapacity-a.currentCapacity)[0];if(donor)return {guess:object,action:{type:'reallocate',target:st.id,from:donor.id,object}};}
  return {guess:object,action:{type:'capacity',target:st.id,object}};
}
