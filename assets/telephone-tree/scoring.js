import {stateMeta,slotLabels} from './semantics.js';
import {channels} from './channels.js';
export function score(s){
  const critical=s.scenario.critical,other=Object.keys(slotLabels).filter(id=>!critical.includes(id)),mean=ids=>ids.reduce((n,id)=>n+stateMeta[s.packet[id].state].value,0)/ids.length;
  const debt=Object.keys(slotLabels).reduce((n,id)=>n+(s.damageDebt[id]||0)*(critical.includes(id)?1:.5),0),recoveryQuality=Math.max(0,1-debt/35);
  const strategy=s.transfers.length?s.transfers.reduce((n,t)=>n+(1-s.scenario.critical.reduce((v,id)=>v+channels[t.channel].noise[id],0)/critical.length),0)/s.transfers.length:0;
  const reaction=s.eventHistory.length?s.eventHistory.filter(e=>['handoff','verify','wait'].includes(e.choice)).length/s.eventHistory.length:1;
  let points=mean(critical)*35+mean(other)*20+recoveryQuality*20+strategy*15+(.5+reaction*.5)*10;
  if(s.packet.phantom?.state==='phantom')points-=12;points-=Math.min(8,s.phantomDebt*2);
  points-=Math.min(6,s.delay*(s.execution.at(-1)?.deadlineMissed?4:1));
  const violation=s.execution.at(-1)?.violation;if(violation&&s.scenario.lethalConstraint)points=Math.min(points,35);
  points=Math.max(0,Math.min(100,points));
  const traces=Object.keys(slotLabels).map(id=>{
    const first=s.history.find(h=>h.step>0&&['blurry','lost','replaced'].includes(h.received[id]?.state)),restores=s.recoveries.filter(r=>r.slot===id);
    return {id,first:first?.label||null,restores:restores.map(r=>({label:s.history[r.step]?.label||s.scenario.roles[r.step].name,step:r.step,late:r.debtBefore>=4})),final:s.packet[id].state,debt:s.damageDebt[id]||0};
  });
  return {grade:points>=86?'A':points>=72?'B':points>=56?'C':points>=40?'D':'F',quality:Math.round(points),traces,violation,criticalPreserved:critical.filter(id=>['intact','restored'].includes(s.packet[id].state)).length,lateRecovery:s.recoveries.some(r=>r.debtBefore>=4),phantom:s.packet.phantom?.state==='phantom'};
}
