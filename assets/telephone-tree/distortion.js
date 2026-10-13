import {channels} from './channels.js';
import {semanticText,slotLabels} from './semantics.js';
import {randomFrom,clamp} from '../sprint-goal/random.js';
export function transmissionPlan(s){
  const receiver=s.scenario.roles[s.step+1],channel=channels[s.channel],frames=[];let criticalSevere=0;
  for(const id of Object.keys(slotLabels)){
    const current=s.packet[id],after=structuredClone(current),r=randomFrom(s.seed+'|'+(s.step+1)+'|'+id)();delete after.fromState;
    let noise=clamp(channel.noise[id]+(s.eventEffect?.receiverBias?.[id]??receiver.bias[id])+s.scenario.noise+(s.eventEffect?.noise[id]||0),.01,.75);
    if(current.state==='restored')noise*=.55;
    if(current.state!=='lost'){
      let next=null;if(r<noise*.2)next='lost';else if(r<noise*.43)next='replaced';else if(r<noise)next='blurry';
      if(s.eventEffect?.replace===id)next='replaced';
      if(s.scenario.critical.includes(id)&&['lost','replaced'].includes(next)){if(criticalSevere>=1)next='blurry';else criticalSevere++;}
      if(next){const severity={intact:0,restored:0,blurry:1,replaced:2,lost:3};if(severity[next]>=severity[current.state]){after.state=next;after.current=semanticText(id,next,s.scenario);}}
      else if(current.state==='restored')after.state='intact';
      if(after.state==='intact'&&r>.8){if(id==='deadline')after.current=s.scenario.original[id].replace(/^До /,'Не позднее ');if(id==='owner')after.current='Результат принимает '+s.scenario.original[id].replace(' принимает результат','');if(id==='goal')after.current=s.scenario.original[id].replace(/^Проверить /,'Провести проверку ');}
    }
    frames.push({slot:id,before:structuredClone(current),after});
  }
  if(s.eventEffect?.phantom)frames.push({slot:'phantom',before:{original:'',current:'',state:'absent'},after:{original:'',current:'Подготовить дополнительный презентационный отчёт',state:'phantom'}});
  return frames;
}
