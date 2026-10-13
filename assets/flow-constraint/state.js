import {generateScenario,initialFlow} from './generator.js';
import {task} from './task.js';
import {newSeed} from '../sprint-goal/random.js';
import {step} from './flow.js';
import {metrics} from './metrics.js';
import {detectConstraint} from './constraint.js';
import {apply,validAction} from './intervention.js';
import {score} from './scoring.js';
export function create(seed=newSeed()){seed=String(seed).slice(0,80);const scenario=generateScenario(seed),s={...initialFlow(seed,scenario),revision:1,modelVersion:2,scenarioId:scenario.id,phase:'intro',round:0,budget:scenario.budget,spent:0,selected:null,guess:null,planned:null,baseline:null,rounds:[],migration:[],periodEnd:0,paused:false,animation:null,result:null,commands:[]};
  for(const [i,st] of s.stages.entries()){const count=scenario.crowding?Math.round(scenario.healthyWip/s.stages.length*1.8):i===0?scenario.demand*2:i===1?scenario.demand:Math.max(3,Math.round(st.baseCapacity/2));for(let k=0;k<count;k++){const t=task(seed,s.nextId++,-(scenario.kind==='batch'?2:12+k%8),{stage:st.id,urgent:scenario.urgent,typical:scenario.typical});st.queue.push(t);s.arrivals++;}}
  for(let i=0;i<scenario.initialOutside;i++){s.outside.push(task(seed,s.nextId++,-8,{urgent:scenario.urgent,typical:scenario.typical}));s.arrivals++;}return s;
}
function finishPeriod(s){const m=metrics(s,s.periodEnd-20),constraint=detectConstraint(s);if(s.phase==='observe'){s.baseline={metrics:m,constraint};s.migration=[constraint];s.phase='planning';}else{const r=s.pendingRound;r.after=m;r.constraintAfter=constraint;r.daily=s.samples.filter(x=>x.tick>r.start);r.systemDelta=r.before.throughput?(m.throughput-r.before.throughput)/r.before.throughput*100:null;
    s.rounds.push(r);s.migration.push(constraint);delete s.pendingRound;s.round++;s.phase='review';if(s.round===3)s.result=score(s);}}
export function act(state,a){const s=structuredClone(state);if(s.phase==='ended')throw new Error('Поток уже разобран.');
  if(a.type==='open'){if(s.phase!=='intro')throw new Error('Поток уже запущен.');s.phase='observe';s.periodEnd=20;s.paused=false;}
  else if(a.type==='select'){if(!s.stages.some(st=>st.id===a.id)&&!['wip','priority'].includes(a.id)&&!s.stages.some(st=>['policy:'+st.id,'quality:'+st.id].includes(a.id)))throw new Error('Объект не найден.');s.selected=a.id;}
  else if(a.type==='guess'){if(s.phase!=='planning')throw new Error('Сначала завершите наблюдение.');s.guess=a.id||s.selected;if(!s.guess)throw new Error('Выберите объект.');s.planned=null;}
  else if(a.type==='plan'){if(s.phase!=='planning'||!s.guess||!validAction(s,a.action))throw new Error('Сначала поставьте гипотезу и выберите доступное вмешательство.');s.planned=structuredClone(a.action);}
  else if(a.type==='run'){if(s.phase!=='planning'||!s.guess||!s.planned)throw new Error('Нужны гипотеза и вмешательство.');const before=metrics(s),actual=detectConstraint(s),action=structuredClone(s.planned),local=apply(s,action);s.pendingRound={round:s.round+1,guess:s.guess,actual,action,local,before,start:s.tick};s.phase='running';s.periodEnd=s.tick+20;s.paused=false;s.animation=null;}
  else if(a.type==='tick'){if(s.paused||!['observe','running'].includes(s.phase))throw new Error('Поток не идёт.');if(!s.animation){step(s);s.animation={index:0,frames:3,moves:structuredClone(s.moves)};}else{s.animation.index++;if(s.animation.index===s.animation.frames){s.animation=null;if(s.tick>=s.periodEnd)finishPeriod(s);}}}
  else if(a.type==='pause'||a.type==='resume'){if(!['observe','running'].includes(s.phase))throw new Error('Поток не идёт.');s.paused=a.type==='pause';}
  else if(a.type==='next'){if(s.phase!=='review')throw new Error('Сначала сравните эффект.');if(s.round===3)s.phase='report';else{s.phase='planning';s.guess=null;s.planned=null;s.selected=null;}}
  else if(a.type==='finish'){if(s.phase!=='report')throw new Error('Сначала завершите три раунда.');s.phase='ended';}
  else throw new Error('Действие не найдено.');s.commands.push(structuredClone(Object.fromEntries(Object.entries(a).filter(([,v])=>v!==undefined))));return s;
}
export function validate(saved){try{if(!saved||saved.revision!==1||saved.modelVersion!==2||typeof saved.seed!=='string'||!Array.isArray(saved.commands)||saved.commands.length>650)return false;let expected=create(saved.seed);for(const a of saved.commands)expected=act(expected,a);return Object.keys(expected).every(k=>JSON.stringify(expected[k])===JSON.stringify(saved[k]));}catch(_){return false;}}
