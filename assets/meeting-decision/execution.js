import {checkConstraint,availableDay} from './constraints.js';
export function startExecution(s){s.execution={index:0,rows:[],draft:structuredClone(s.draft),revision:s.draftRevision,commitments:structuredClone(s.participants),linkedDeals:[...s.linkedDeals],support:s.scenario.participants.filter(p=>p.preferred.includes(s.draft.scope)).map(p=>p.id)};s.executionPaused=false;s.phase='execution';}
export function stepExecution(s){
  const step=s.scenario.execution[s.execution.index];if(!step)throw new Error('Исполнение завершено.');
  const p=s.scenario.participants.find(p=>p.id===step.participant),physical=checkConstraint(s.scenario,p,s.execution.draft,s.execution.linkedDeals),commitment=s.execution.commitments[p.id].commitment;
  const day=Math.max((s.execution.rows.at(-1)?.day||0)+1,availableDay(p,s.execution.draft));
  const confirmed=commitment?.revision===s.execution.revision&&commitment.accepted,inTime=day<=s.execution.draft.deadline,ok=physical.ok&&confirmed&&inTime;
  const reason=!physical.ok?physical.reason:!confirmed?'У этой части решения не было зафиксированного обязательства. Публичная поддержка не стала поручением к исполнению.':!inTime?`Последовательность исполнения довела этот шаг до дня ${day}; в решении обещан день ${s.execution.draft.deadline}. Переходы между обязательствами тоже требуют времени.`:'Обязательство выполнено под согласованный объём, срок и ресурс.';
  s.execution.rows.push({participant:p.id,day,label:p.obligation,ok,physical:physical.ok,confirmed,reason});s.execution.index++;
  if(!ok){s.participants[p.id].constraintKnown=true;s.discovered[p.id]=reason;}
  if(!ok||s.execution.index===s.scenario.execution.length){s.attempts.push({...structuredClone(s.execution),success:ok&&s.execution.rows.every(r=>r.ok)});s.phase='result';}
}
