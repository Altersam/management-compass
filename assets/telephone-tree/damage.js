import {round} from '../sprint-goal/random.js';
export function accumulateDamage(s){
  for(const id of Object.keys(s.scenario.original)){
    const cell=s.packet[id],critical=s.scenario.critical.includes(id),weight=critical?2:1;
    const multiplier=['lost','replaced'].includes(cell.state)?1:cell.state==='blurry'?.12:0;
    s.damageDebt[id]=round((s.damageDebt[id]||0)+weight*multiplier*Math.max(1,s.step-1));
  }
  if(s.packet.phantom?.state==='phantom')s.phantomDebt++;
  const damaged=s.scenario.critical.filter(id=>['lost','replaced'].includes(s.packet[id].state));
  if(s.step>=2&&damaged.length)s.messages.push('Получатель уже планирует зависимую работу по неполной версии. Поздняя правда потребует пересмотра.');
}
