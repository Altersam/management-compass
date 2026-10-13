import {clamp as limit,round} from '../sprint-goal/random.js';
const clamp=(n,a=0,b=100)=>limit(n,a,b);
export function influenceFrames(s,{withdrawn=false}={}){
  const before=structuredClone(s.nodes),frames=[];
  for(const n of before){
    const next=structuredClone(n),incoming=s.edges.filter(e=>e.to===n.id),transmissions=[];let net=0,positive=0,skill=0,process=false,riskProof=false;
    for(const e of incoming){
      const source=before.find(x=>x.id===e.from),weight=e.weight*(source.champion?1.65:1)*source.influence/5;
      const direction=e.type==='conflict'?-.4:1,signal=(source.commitment-45)/35+(source.trust-50)/80-source.latentResistance/130;
      net+=signal*weight*direction;if(signal>.25&&direction>0){positive+=weight;skill+=source.capability>=65?weight:0;process=process||source.processModel;riskProof=riskProof||source.pilot||source.processModel;}
      if(Math.abs(signal*weight)>.2)transmissions.push({edge:e.id,from:e.from,to:e.to,positive:signal*direction>0});
    }
    net=clamp(net,-2.2,3);next.support=clamp(n.support+net*7-(n.fatigue>65?5:0));next.trust=clamp(n.trust+net*3+(n.resolved?3:-1));next.commitment=clamp(n.commitment+net*6+(n.resolved?4:-2));next.latentResistance=clamp(n.latentResistance-net*4+(n.fatigue>65?4:0)-(n.resolved?3:0));
    next.capability=clamp(n.capability+Math.min(9,skill*5));next.capacity=clamp(n.capacity-(n.pilot?3:1));next.fatigue=clamp(n.fatigue-5+(n.capacity<35?8:0));
    if(['process','incentives'].includes(n.barrier)&&process&&positive>1)next.resolved=true;
    if(['meaning','trust','status','experience','skill'].includes(n.barrier)&&positive>1&&next.trust>=48&&next.capability>=55)next.resolved=true;
    if(n.barrier==='risk'&&riskProof&&positive>1&&next.trust>=48)next.resolved=true;
    const readiness=Math.min(next.trust,next.capability,next.capacity)/100;
    let delta=(next.commitment-35)*.14+positive*6+(next.resolved?7:-4)+readiness*4-next.latentResistance*.07-next.fatigue*.04;
    if(['process','incentives','capacity'].includes(next.barrier)&&!next.resolved)delta=Math.min(delta,3);
    if(next.compliance>55&&!withdrawn)delta+=5;
    if(withdrawn){next.compliance=clamp(next.compliance-24);if(next.commitment<55||next.latentResistance>45)delta-=14;}
    next.adoption=clamp(n.adoption+clamp(delta,-22,25));next.compliance=clamp(next.compliance+(next.adoption>50?6:0));
    for(const key of ['support','adoption','commitment','trust','capability','capacity','fatigue','latentResistance','compliance'])next[key]=round(next[key]);
    frames.push({id:n.id,after:next,transmissions});
  }return frames;
}
