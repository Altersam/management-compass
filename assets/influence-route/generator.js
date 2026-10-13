import {scenarios} from './scenarios.js';
import {randomFrom} from '../sprint-goal/random.js';
export function generateScenario(seed){
  const r=randomFrom(seed),s=structuredClone(scenarios[Math.floor(r()*scenarios.length)]);
  s.nodes.forEach(n=>{if(!n.decider&&!n.opponent&&n.id!=='you')n.attitude+= (r()-.5)*.06;});
  s.edges.filter(e=>['trust','expert'].includes(e.type)).forEach(e=>e.strength=Math.min(1,e.strength+(r()-.5)*.04));
  s.thresholds=[7+Math.floor(r()*2),13+Math.floor(r()*2)];s.capital=5;s.topicRelevant=true;
  if(s.id==='appoint'&&r()>.5){s.mainRoute=['you','hr','mentor','ceo'];s.edges.find(e=>e.id==='you-hr-access').known=true;s.bridge='hr';}else s.bridge=s.id==='appoint'?'cand':s.id==='close'?'analyst':'expert';
  const secondary=s.edges.filter(e=>!e.known&&e.from==='you');if(secondary.length&&r()>.5)secondary[Math.floor(r()*secondary.length)].known=true;
  const roll=r();s.event=roll<.35?{id:'travel',turn:6,edge:s.edges.find(e=>e.from===(s.id==='regl'?'adv':s.id==='close'?'coo':'mentor')&&e.type==='access').id,title:'Носитель в командировке',text:'Личная встреча недоступна один ход. Контакт остаётся в карте; можно взять паузу или использовать разведанную альтернативу.'}:roll<.65?{id:'meeting',turn:3,title:'Внеплановое заседание',text:'Следующий ход: эскалация стоит один жетон, но привлекает больше внимания.'}:{id:'leave',turn:3,title:'Оппонент занят вне офиса',text:'На следующий ход пороги его вмешательства временно выше.'};
  return s;
}
