import {guardDetection} from './measurement.js';
import {clamp} from './metric.js';
export function adaptGaming(sc,metric,guard,previous,period){
  if(metric.removed)return {modeId:null,detection:0,value:Math.max(0,previous.gaming-4),text:'Числовую цель сняли. Обход уменьшился, но измерительный сигнал исчез.'};
  const candidates=metric.possibleGamingModes.map(id=>sc.gamingModes.find(m=>m.id===id));const modes=candidates.map(mode=>{const detection=guardDetection(sc,guard,mode);return {mode,detection,appeal:mode.ease*(1-detection)*(1+metric.gameability)+mode.payoff*.2};}).sort((a,b)=>b.appeal-a.appeal),chosen=modes[0];
  const growth=metric.gameability*14+sc.distortion.pressure*5+chosen.mode.ease*5+period*.8,decline=chosen.detection*26,value=clamp(previous.gaming+growth-decline);
  return {modeId:chosen.mode.id,detection:chosen.detection,value,text:chosen.detection>.7?'Защитная проверка обнаруживает обход: '+chosen.mode.detected:chosen.mode.text};
}
