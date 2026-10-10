import {complete} from './project.js';
import {reliability} from './engine.js';

export const level=value=>value>=0.8?'высокая':value>=0.65?'средняя':'низкая';
export function serviceMetrics(s){
  const repeats=Math.round((1-reliability(s))*55+(s.flags.supportEffective?10:0)+(s.formalLaunch?6:0));
  return {visibleTime:12,allTime:Math.round(12+(100-s.adoption)*0.32+repeats*0.25),repeats,adoption:Math.round(s.adoption),bypass:Math.round(100-s.adoption),resolved:Math.round(s.adoption*reliability(s)*(1-repeats/100))};
}
export function report(s){
  const metrics=serviceMetrics(s),has=type=>s.decisions.some(d=>d.type===type),quality=level(reliability(s));
  const insights=[
    s.scope==='lean'?'В этой игре вы сократили объём до пилота. Это помогло сроку, но полный набор сценариев остался за его границами.':'В этой игре вы сохранили полный объём. Проверьте, какой ресурс потребовался для этого обещания.',
    s.stats.overloadDays>1?`В этой игре вы накопили ${s.stats.overloadDays.toFixed(1)} человеко-дня перегрузки. Первоначальный темп частично оплачен переключениями и усталостью.`:'В этой игре одновременная работа не превратилась в длительную перегрузку команды.',
    s.stats.rework>0?`В этой игре ${s.stats.rework.toFixed(1)} дня работы вернулись на доработку. Сравните момент обнаружения с началом зависимого этапа.`:'В этой игре поздняя переделка не стала отдельной очередью. Эту защиту стоит сопоставить со стоимостью проверок.',
    s.it.riskAccepted?'В этой игре интеграция началась до подтверждения IT. Ранний старт перенёс неопределённость в переделку.':has('coordinateIT')||has('escalateIT')?'В этой игре вы получили ресурсный выбор от другой стороны, а не только усилили срочность.':'В этой игре команда ждала первоначальное окно IT. Это сберегло отдельную плату за ускорение, но ограничило последовательность.',
    s.launchedAt===null?'В этой игре сервис не дошёл до запуска: данные об использовании ещё нельзя трактовать как эффект.':s.metricsInvestigated?`В этой игре вы проверили границы цифры: 12 минут в системе и ${metrics.allTime} минут с обходами описывают разный опыт.`:`В этой игре запуск дал ${metrics.adoption}% применения. Среднее по новой системе не включает ${metrics.bypass}% обходов и непринятой практики.`
  ];
  return {launchDay:s.launchedAt===null?null:Math.ceil(s.launchedAt),spent:Math.round(s.spent),quality,metrics,insights,completed:s.tasks.filter(complete).length};
}
