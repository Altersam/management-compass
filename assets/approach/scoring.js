import {clamp,round} from './generator.js';
export function runReport(run,c){
  const delay=Math.max(0,run.week-c.weeks),overBudget=Math.max(0,run.cost/c.budget-1),p=run.parameters,lateShare=run.rework?run.lateRework/run.rework:0;
  let fit=1;
  const insights=[];
  if((c.volatility>.6||c.unknowns>.6)&&p.interval>=6){fit-=.25;insights.push('Условия были изменчивыми, а между проверками успевал накопиться непроверенный результат.');}
  if(c.regulation>.65&&p.upfront<.2){fit-=.25;insights.push('Формальные требования были высоки. Недостаточная проработка оставила больше несоответствий для позднего контроля.');}
  if(c.volatility>.6&&p.upfront>.35){fit-=.2;insights.push('Большая проработка задержала рабочий образец; при изменчивых условиях часть снятой неизвестности возвращалась.');}
  if(c.maturity<.55&&p.interval<=2){fit-=.2;insights.push('Для этой команды частые проверки создавали заметные накладные расходы.');}
  if(c.feedbackAccess<.5&&p.feedback>.7)insights.push('Участники редко были доступны: высокая интенсивность обсуждений не дала столь же сильной обратной связи.');
  if(c.volatility<.4&&p.interval<=2)insights.push('Условия были сравнительно стабильны. Короткие циклы расходовали ресурс на дополнительные проверки.');
  if(!insights.length)insights.push('Профиль сочетал подготовку и проверки. Сопоставьте цену контроля с моментом обнаружения отклонений.');
  insights.push(lateShare>.55?'Большая часть передела обнаружилась ближе к сроку. Исправление затронуло больше уже выполненного.':'Проверки распределили обнаружение отклонений по ходу работы. Это не отменило стоимость исправления.');
  const reaction=run.responses.length?run.responses.filter(e=>!['defer','freeze'].includes(e.choice)).length/run.responses.length:1;
  const costEfficiency=clamp(1-Math.max(0,run.cost/c.budget-.75)*1.2);
  const score=run.accepted*.4+clamp(1-delay/(c.weeks*.5))*20+costEfficiency*15+(1-clamp(run.lateRework/15))*12+clamp(fit)*8+reaction*5;
  return {score:round(score),delay,overBudget:round(overBudget),rework:round(run.rework),lateShare:round(lateShare),accepted:round(run.accepted),cost:round(run.cost),weeks:run.week,insights};
}
export function finalReport(state){
  const reports=state.attempts.map(run=>runReport(run,state.project)),first=reports[0],last=reports.at(-1);
  if(!last)return {grade:null,reports,improved:false};
  const improved=reports.length===2&&last.score>first.score+5;
  const points=last.score+(improved?6:0);
  return {grade:points>=85?'A':points>=70?'B':points>=50?'C':'D',reports,improved,insights:[...last.insights,...(improved?['Во второй попытке вы пересмотрели организацию работы и улучшили результат на тех же исходных условиях.']:[])]};
}
