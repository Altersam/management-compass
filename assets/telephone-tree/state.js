import {generateScenario} from './generator.js';
import {newSeed} from '../sprint-goal/random.js';
import {snapshot,slotLabels} from './semantics.js';
import {channels} from './channels.js';
import {resolveEvent} from './events.js';
import {transmissionPlan} from './distortion.js';
import {recover} from './recovery.js';
import {accumulateDamage} from './damage.js';
import {executionPlan} from './execution.js';
import {score} from './scoring.js';
export function create(seed=newSeed()){
  seed=String(seed).slice(0,80);const scenario=generateScenario(seed),packet=Object.fromEntries(Object.keys(slotLabels).map(id=>[id,{original:scenario.original[id],current:scenario.original[id],state:'intact'}]));
  const s={revision:1,modelVersion:2,seed,scenarioId:scenario.templateId,scenario,phase:'intro',step:0,resource:scenario.resource,clarifications:scenario.clarifications,channel:'talk',selected:'constraint',packet,history:[],transfers:[],recoveries:[],damageDebt:Object.fromEntries(Object.keys(slotLabels).map(id=>[id,0])),phantomDebt:0,delay:0,pendingEvent:null,eventEffect:null,eventHistory:[],animation:null,execution:[],result:null,paused:false,messages:[],commands:[],turn:0};s.history.push(snapshot(s,'Источник'));return s;
}
function nextPhase(s){const ev=s.scenario.events.find(e=>e.step===s.step&&!s.eventHistory.some(h=>h.step===e.step));if(ev){s.pendingEvent=structuredClone(ev);s.phase='event';}else s.phase='planning';}
export function act(state,a){
  const s=structuredClone(state);if(s.phase==='ended')throw new Error('Передача разобрана.');
  if(a.type==='open'){if(s.phase!=='intro')throw new Error('Дерево уже открыто.');s.phase='planning';}
  else if(a.type==='select'){if(!s.packet[a.id])throw new Error('Ветка не найдена.');s.selected=a.id;}
  else if(a.type==='channel'){if(s.phase!=='planning'||!channels[a.id]||s.eventEffect?.disabled.includes(a.id))throw new Error('Канал недоступен.');s.channel=a.id;}
  else if(a.type==='recover'){if(s.phase!=='planning')throw new Error('Дождитесь завершения передачи.');recover(s,a.id||s.selected);}
  else if(a.type==='send'){
    if(s.phase!=='planning'||s.step>=4)throw new Error('Передачи завершены или ожидают события.');const channel=channels[s.channel];if(s.resource<channel.cost||s.eventEffect?.disabled.includes(s.channel))throw new Error('Канал недоступен по ресурсу или событию.');s.resource-=channel.cost;
    s.animation={frames:transmissionPlan(s),index:0,before:structuredClone(s.packet),channel:s.channel};s.phase='transfer';s.paused=false;
  }else if(a.type==='tick'){
    if(s.paused)throw new Error('Проигрывание на паузе.');
    if(s.phase==='transfer'){
      const frame=s.animation.frames[s.animation.index];s.packet[frame.slot]=structuredClone(frame.after);s.animation.index++;
      if(s.animation.index===s.animation.frames.length){const before=s.animation.before,channel=s.animation.channel;s.step++;s.turn=s.step;accumulateDamage(s);s.transfers.push({step:s.step,channel,before,after:structuredClone(s.packet)});s.history.push(snapshot(s,s.scenario.roles[s.step].name));s.animation=null;s.eventEffect=null;s.messages.push('Передача '+s.step+': проверьте, какие части конструкции изменились.');nextPhase(s);}
    }else if(s.phase==='execution'){
      s.execution.push(executionPlan(s)[s.execution.length]);if(s.execution.length===3){s.result=score(s);s.phase='report';}
    }else throw new Error('Проигрывание не идёт.');
  }else if(a.type==='decision'){if(s.phase!=='event')throw new Error('Нет события для решения.');resolveEvent(s,a.choice);}
  else if(a.type==='execute'){if(s.phase!=='planning'||s.step!==4)throw new Error('Сначала пройдите четыре передачи.');s.phase='execution';s.paused=false;}
  else if(a.type==='pause'||a.type==='resume'){if(!['transfer','execution'].includes(s.phase))throw new Error('Проигрывание не идёт.');s.paused=a.type==='pause';}
  else if(a.type==='finish'){if(s.phase!=='report')throw new Error('Сначала посмотрите исполнение.');s.phase='ended';}
  else throw new Error('Действие не найдено.');
  s.commands.push(structuredClone(a));return s;
}
export function validate(saved){try{if(!saved||saved.revision!==1||saved.modelVersion!==2||typeof saved.seed!=='string'||!Array.isArray(saved.commands)||saved.commands.length>400)return false;let expected=create(saved.seed);for(const a of saved.commands)expected=act(expected,a);return Object.keys(expected).every(k=>JSON.stringify(expected[k])===JSON.stringify(saved[k]));}catch(_){return false;}}
