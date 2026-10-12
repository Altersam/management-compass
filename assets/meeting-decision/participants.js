import {checkConstraint,concessionText,constraintText} from './constraints.js';
export function support(p,draft){return p.preferred.includes(draft.scope);}
export function stance(s,p){const info=s.participants[p.id];if(info.commitment?.revision===s.draftRevision)return info.commitment.accepted?'Готов выполнить':'Не подтверждает';return support(p,s.draft)?'Поддерживает':'Сомневается';}
export function askParticipant(s,id,type){
  const p=s.scenario.participants.find(p=>p.id===id),info=s.participants[id];if(!p)throw new Error('Участник не найден.');
  if(type==='constraint'){info.constraintKnown=true;return constraintText(s.scenario,p);}
  if(type==='concession'){info.concessionKnown=true;return concessionText(s.scenario,p);}
  if(type==='commitment'){
    const result=checkConstraint(s.scenario,p,s.draft,s.linkedDeals);info.commitment={revision:s.draftRevision,accepted:result.ok};
    if(!result.ok){info.constraintKnown=true;return 'Не подтверждаю: '+result.reason;}
    return `Готов выполнить: ${p.obligation}. Обязательство действует под текущий масштаб, срок и ресурс.`;
  }throw new Error('Вопрос не найден.');
}
export function linkAvailable(s){return !s.linkedDeals.includes('resource-finance')&&s.participants.resource.concessionKnown&&s.participants.finance.concessionKnown;}
export function invalidateDraft(s){s.draftRevision++;s.preview=null;for(const info of Object.values(s.participants))info.commitment=null;}
export function linkConditions(s){
  if(!linkAvailable(s))throw new Error('Сначала найдите обе совместимые уступки.');
  s.linkedDeals.push('resource-finance');s.draft={...s.draft,scope:'limited',deadline:s.scenario.deadlines[1],staffing:'temporary',budget:'reserve'};invalidateDraft(s);
  for(const id of ['resource','finance']){const p=s.scenario.participants.find(p=>p.id===id);s.participants[id].commitment={revision:s.draftRevision,accepted:checkConstraint(s.scenario,p,s.draft,s.linkedDeals).ok};}
}
