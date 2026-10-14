import {inside} from './wip.js';
export const actionLabels={capacity:'Добавить мощность',reallocate:'Перераспределить ресурс',wip:'Ограничить запуск / WIP',quality:'Убрать причину возврата',rule:'Изменить правило',remove:'Убрать этап',priority:'Пропускать срочные вперёд',hold:'Сохранить условия и наблюдать'};
export const cost=a=>({capacity:2,reallocate:1,wip:1,quality:2,rule:2,remove:2,priority:1,hold:0}[a.type]);
export function actionOptions(s,id){const stageId=id?.includes(':')?id.split(':')[1]:id,st=s.stages.find(st=>st.id===stageId);if(id==='wip')return ['wip','hold'];if(id==='priority')return ['rule','priority','wip','hold'];if(!st)return ['hold'];const actions=['capacity','reallocate'];if(st.defectRate||s.stages.some(x=>x.reworkTarget===st.id))actions.push('quality');if(st.routeRule||st.policy||st.batchRule>1)actions.push('rule');if(st.canRemove)actions.push('remove');return actions.slice(0,5);}
export function donors(s,target){return s.stages.filter(st=>st.id!==target.id&&!st.removed&&st.resourceGroup===target.resourceGroup&&st.currentCapacity>=5);}
export function validAction(s,a){const st=s.stages.find(st=>st.id===a.target),object=a.object||s.guess;if(!Number.isFinite(cost(a))||cost(a)>s.budget)return false;if(!actionOptions(s,object).includes(a.type)&&!['wip','hold'].includes(a.type))return false;
  if(!['wip','hold'].includes(a.type)&&object!=='priority'&&a.target!==(object?.includes(':')?object.split(':')[1]:object))return false;
  if(a.type==='capacity')return Boolean(st&&!st.removed&&st.currentCapacity<st.baseCapacity*1.9);
  if(a.type==='reallocate')return Boolean(st&&donors(s,st).some(d=>d.id===a.from));
  if(a.type==='wip')return Number.isInteger(a.limit)&&a.limit>=4&&a.limit<=s.scenario.wipLimit;
  if(a.type==='quality')return Boolean(st);
  if(a.type==='rule')return object==='priority'||Boolean(st&&(st.routeRule||st.policy||st.batchRule>1)&&!st.ruleChanged);
  if(a.type==='remove')return Boolean(st&&st.canRemove&&!st.removed);
  return a.type==='hold'||a.type==='priority';
}
export function apply(s,a){if(!validAction(s,a))throw new Error('Вмешательство недоступно по объекту, ресурсу или параметрам.');const st=s.stages.find(st=>st.id===a.target),before=st?.currentCapacity||s.wipLimit;let localBefore=before,localAfter=before,unit='задач/день';s.budget-=cost(a);s.spent+=cost(a);
  if(a.type==='capacity'){st.currentCapacity+=Math.max(2,Math.round(st.baseCapacity*.4));localAfter=st.currentCapacity;}
  if(a.type==='reallocate'){const from=s.stages.find(st=>st.id===a.from),delta=3;from.currentCapacity-=delta;st.currentCapacity+=delta;localAfter=st.currentCapacity;}
  if(a.type==='wip'){localBefore=s.wipLimit;s.wipLimit=a.limit;localAfter=s.wipLimit;unit='одновременно';}
  if(a.type==='quality'){const affected=st.defectRate?[st]:s.stages.filter(x=>x.reworkTarget===st.id);localBefore=affected[0]?.qualityFactor||1;affected.forEach(x=>x.qualityFactor*=.35);localAfter=affected[0]?.qualityFactor||1;unit='доля исходных причин возврата';}
  if(a.type==='rule'){
    if(a.object==='priority'){s.fairPriority=true;localBefore=0;localAfter=1;unit='защита обычной очереди';}
    else{st.ruleChanged=true;localAfter=st.currentCapacity;
      if(st.policy){localBefore=1;localAfter=5;unit='дней типовых решений за рабочую неделю';}
      else if(st.routeRule==='regression'){st.currentCapacity+=2;st.qualityFactor*=.5;localAfter=st.currentCapacity;}
      else if(st.routeRule==='classification'){const affected=s.stages.filter(x=>x.reworkTarget===st.id);localBefore=affected[0]?.qualityFactor||1;affected.forEach(x=>x.qualityFactor*=.3);localAfter=affected[0]?.qualityFactor||1;unit='доля исходных причин ошибочной классификации';}
      else if(st.routeRule==='smallBatch'){localBefore=st.batchRule;st.batchRule=1;st.currentCapacity=Math.max(1,st.currentCapacity-1);localAfter=1;unit='размер партии';}
      else if(st.routeRule==='standard'){localBefore=1;localAfter=.45;unit='работа этапа на типовой случай';}
    }
  }
  if(a.type==='remove'){st.removed=true;s.unsafeAt=s.tick;localAfter=0;unit='этап пропущен';}
  if(a.type==='priority')s.expedite=true;
  return {before:localBefore,after:localAfter,unit,delta:localBefore?(localAfter-localBefore)/localBefore*100:null,wipAtDecision:inside(s)};
}
