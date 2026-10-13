import {protectionFor} from './mitigations.js';
export function consequencePlan(scenario,decisionId,mitigationId){
  const option=scenario.options.find(o=>o.id===decisionId),mitigation=scenario.mitigations.find(m=>m.id===mitigationId);if(!option||!mitigation)throw new Error('Решение и защита не выбраны.');
  const protection=protectionFor(option,mitigation);
  return [
    {time:'Сейчас',dimension:'result',sign:'plus',text:option.plus},
    {time:'Через 2 недели',dimension:option.risk,sign:'minus',text:option.minus},
    {time:'Через 2 месяца',dimension:'protection',sign:protection.primaryCovered?'plus':'mixed',text:protection.primaryCovered?`Защитная мера ограничила основной риск: ${mitigation.name.toLowerCase()}. Проверка потребовала дополнительной работы; первоначальная цена выбора не исчезла.`:`Мера «${mitigation.name}» защитила отдельную часть решения, но основной риск выбранного варианта сохранился.`},
    {time:'Через 6 месяцев',dimension:'longTerm',sign:'mixed',text:option.longTerm}
  ];
}
export function futureOutcome(scenario,decisionId,mitigationId){
  const option=scenario.options.find(o=>o.id===decisionId),mitigation=scenario.mitigations.find(m=>m.id===mitigationId),protection=protectionFor(option,mitigation),future=scenario.future;
  const protectedFuture=protection.uncertaintyCovered||protection.primaryCovered;
  return {time:'После основной истории',title:'Новая информация',text:future.text,unavailableAtDecision:true,favourable:future.favourable,
    robustness:protectedFuture?'protected':'exposed',result:future.favourable?'Внешнее изменение открыло дополнительную возможность. Это не доказывает качества исходного процесса.':future.impact==='mixed'?(protectedFuture?'Новые условия потребовали адаптации. Подготовленная защита оставила возможность пересмотра.':'Новые условия потребовали адаптации. Под выбранный риск не был подготовлен достаточный путь пересмотра.'):protectedFuture?'Внешнее изменение ухудшило условия. Подготовленная защита позволила ограничить ущерб, но не отменить событие.':'Внешнее изменение ухудшило условия. Для пересмотра не был подготовлен достаточный резерв.',
    explanation:'Это событие возникло после решения и не было доступно в досье. За его угадывание или неугадывание оценка не меняется.'};
}
