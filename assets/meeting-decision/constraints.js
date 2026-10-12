import {scopeLabels,resourceLabels,budgetLabels} from './cases.js';
export function checkConstraint(scenario,participant,draft,linkedDeals=[]){
  const c=participant.constraint,full=['full','defer'].includes(draft.scope),need=full?scenario.requiredFull:scenario.requiredSmall,deadline=Number(draft.deadline),hasDeal=linkedDeals.includes('resource-finance');
  if(participant.kind==='resource'){
    if(draft.staffing==='current'&&c.available<need)return {ok:false,reason:`Нужно ${need} ресурсных единиц, в текущей команде доступно ${c.available}. Формальное согласие не добавило ресурс.`};
    if(draft.staffing==='temporary'&&!hasDeal)return {ok:false,reason:'Временное перераспределение возможно только при оплате замены на прежнем участке. Эти условия не связаны.'};
    const availableAt=draft.staffing==='hire'?c.hireAt:draft.staffing==='contract'?c.contractAt:draft.staffing==='temporary'?c.temporaryAt:c.currentAt;
    if(deadline<availableAt)return {ok:false,reason:`${resourceLabels[draft.staffing]} реально доступны с дня ${availableAt}; в решении указан день ${deadline}.`};
  }else if(participant.kind==='finance'){
    const cost=full?scenario.costFull:scenario.costSmall,limit=draft.budget==='current'?c.current:draft.budget==='reserve'?c.reserve:c.next;
    if(cost>limit)return {ok:false,reason:`Для выбранного объёма нужно ${cost} единиц, доступный лимит — ${limit}.`};
    if(draft.budget==='next'&&deadline<c.nextAt)return {ok:false,reason:`Финансирование следующего периода доступно с дня ${c.nextAt}; обещан день ${deadline}.`};
    if(draft.staffing==='temporary'&&draft.budget!=='reserve')return {ok:false,reason:'В текущем выборе не предусмотрена оплата временной замены. Перевод людей создаст разрыв на прежнем участке.'};
  }else if(participant.kind==='formal'){
    const minimum=full?c.fullDays:c.smallDays;
    if(deadline<minimum)return {ok:false,reason:`Обязательная проверка занимает минимум ${minimum} дней. В решении заложено ${deadline}. Этот срок нельзя снять согласием.`};
    if((draft.staffing==='contract'||scenario.requiresAuthorization&&draft.staffing!=='current')&&!draft.conditions.includes('basis'))return {ok:false,reason:'Привлечение ресурса не имеет зафиксированного основания. Нужно оформить границы и право на ресурсный выбор.'};
  }else if(participant.kind==='operations'){
    const ready=full?c.fullAt:c.smallAt;
    if(deadline<ready)return {ok:false,reason:`${participant.obligation} готовы с дня ${ready}; в решении указан день ${deadline}.`};
  }else if(participant.kind==='owner'){
    if((draft.staffing==='contract'||scenario.requiresAuthorization&&draft.staffing!=='current')&&!draft.conditions.includes('basis'))return {ok:false,reason:'Право привлечь ресурс не оформлено в черновике.'};
  }
  return {ok:true,reason:'Условия этой части решения физически и организационно совместимы.'};
}
export function constraintText(scenario,p){const c=p.constraint;
  if(p.kind==='resource')return `Текущий ресурс — ${c.available} ед.; полный объём требует ${scenario.requiredFull}. Плановый набор доступен с дня ${c.hireAt}.`;
  if(p.kind==='finance')return `Сейчас доступно ${c.current} ед.; полный объём стоит ${scenario.costFull}. Следующий лимит — с дня ${c.nextAt}.`;
  if(p.kind==='formal')return `Обязательная проверка полного объёма — ${c.fullDays} дней; ограниченного — ${c.smallDays}. ${scenario.requiresAuthorization?'Любое перераспределение':'Внешний ресурс'} требует оформленного основания.`;
  if(p.kind==='operations')return `Полный рабочий контур готов с дня ${c.fullAt}; ограниченный — с дня ${c.smallAt}. Раньше его физически нельзя выдать.`;
  return 'Ресурсные обещания должны иметь владельца. Привлечение подрядчика требует зафиксированных границ полномочий.';
}
export function concessionText(scenario,p){const c=p.constraint;
  if(p.kind==='resource')return `Для ограниченного объёма можно временно выделить ${scenario.requiredSmall} ед. с дня ${c.temporaryAt}, если прежнему участку оплатят замену.`;
  if(p.kind==='finance')return `Резерв ${c.reserve} ед. можно направить на ограниченный объём и временную замену. Нужны связанные обязательства.`;
  if(p.kind==='formal')return `Ограниченный контур проверяем за ${c.smallDays} дней. Для подрядчика можно заранее оформить основание и границы.`;
  if(p.kind==='operations')return `Первый рабочий контур можно подготовить с дня ${c.smallAt}. Остальное потребует отдельного этапа.`;
  return 'Готов зафиксировать ограниченный первый этап, хотя предпочитаю полный охват. Поддержка идеи не заменяет подтверждений исполнителей.';
}
export const criticalParticipant=p=>p.kind!=='owner';
export function availableDay(p,draft){const c=p.constraint,full=['full','defer'].includes(draft.scope);
  if(p.kind==='resource')return draft.staffing==='hire'?c.hireAt:draft.staffing==='contract'?c.contractAt:draft.staffing==='temporary'?c.temporaryAt:c.currentAt;
  if(p.kind==='finance')return draft.budget==='next'?c.nextAt:1;
  if(p.kind==='formal')return full?c.fullDays:c.smallDays;
  if(p.kind==='operations')return full?c.fullAt:c.smallAt;
  return 1;
}
export function executionEnd(scenario,draft){let day=0;for(const step of scenario.execution){const p=scenario.participants.find(p=>p.id===step.participant);day=Math.max(day+1,availableDay(p,draft));}return day;}
export function physicallyViable(scenario,draft,linked=[]){return scenario.participants.every(p=>checkConstraint(scenario,p,draft,linked).ok)&&executionEnd(scenario,draft)<=draft.deadline;}
export function knownRisks(state){return state.scenario.participants.map(p=>{
  if(!state.participants[p.id].constraintKnown)return {id:p.id,state:'unknown',text:'Реальное ограничение ещё не выяснено.'};
  const check=checkConstraint(state.scenario,p,state.draft,state.linkedDeals);
  return {id:p.id,state:check.ok?'ok':'risk',text:check.ok?'Известное ограничение не конфликтует с черновиком.':check.reason};
});}
