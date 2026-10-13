import {templates} from './templates.js';
import {generateNetwork} from './network.js';
import {randomFrom,round} from '../sprint-goal/random.js';
import {validateScenario} from './validator.js';
export function generateScenario(seed){
  const choose=randomFrom(seed),t=templates[Math.floor(choose()*templates.length)],variant=Math.floor(choose()*3);
  for(let attempt=0;attempt<20;attempt++){
    const r=randomFrom(seed+'#'+attempt),count=6+Math.floor(r()*3),topology=t.topologies[variant],net=generateNetwork(count,topology,r,variant),nodeNames=t.groups.slice(0,count);
    if(net.hub===count-1)nodeNames[net.hub]=t.groups[7];
    const nodes=nodeNames.map((name,i)=>{
      const barrier=t.barriers[(i+variant)%t.barriers.length],base={id:'node-'+i,name,role:i===0?'Спонсор изменения':i===net.hub?'Центр профессионального / неформального влияния':'Рабочая группа',...net.positions[i],influence:i===net.hub?5:i===0?4:2+Math.floor(r()*3),barrier,barrierKnown:false,support:35+r()*20,adoption:18+r()*18,commitment:30+r()*20,trust:45+r()*18,capability:55+r()*15,capacity:55+r()*15,fatigue:12+r()*12,latentResistance:18+r()*12,compliance:20+r()*15,champion:false,resolved:false,uses:{},touched:false,pilot:false};
      if(barrier==='skill')base.capability=28+r()*12;
      if(barrier==='capacity'){base.capacity=28+r()*10;base.fatigue=48+r()*12;}
      if(barrier==='trust'||barrier==='experience'){base.trust=28+r()*10;base.latentResistance=43+r()*8;}
      if(barrier==='status'){base.support=22+r()*10;base.latentResistance=45+r()*8;}
      if(barrier==='incentives'||barrier==='process')base.commitment=25+r()*10;
      if(i===0){Object.assign(base,{support:74,adoption:62,commitment:70,trust:72,capability:76,capacity:70,latentResistance:16,resolved:true});}
      if(i===net.hub&&i!==0){base.support=38;base.trust=49;base.capability=75;base.capacity=65;base.commitment=43;base.latentResistance=36;}
      for(const key of ['support','adoption','commitment','trust','capability','capacity','fatigue','latentResistance','compliance'])base[key]=round(base[key]);return base;
    });
    const s={templateId:t.id,title:t.title,domain:t.domain,context:t.context,variantId:variant,variationText:t.variations[variant],topology,nodes,edges:net.edges,hub:'node-'+net.hub,actionsPerWave:4+Math.floor(r()*2),waves:4,threshold:58+Math.floor(r()*5),eventOrder:variant===0?['sabotage','overload','envy','rumor']:variant===1?['rumor','envy','overload','sabotage']:['overload','sabotage','rumor','envy'],generationAttempt:attempt};
    if(validateScenario(s).valid)return s;
  }throw new Error('Не удалось собрать связанную сеть изменения.');
}
