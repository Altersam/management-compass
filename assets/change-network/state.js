import {generateScenario} from './generator.js';
import {newSeed} from '../sprint-goal/random.js';
import {applyIntervention} from './interventions.js';
import {influenceFrames} from './influence.js';
import {metrics} from './adoption.js';
import {selectEvent,resolveEvent} from './events.js';
import {report} from './scoring.js';
export function create(seed=newSeed()){
  seed=String(seed).slice(0,80);const scenario=generateScenario(seed);
  return {revision:1,modelVersion:2,seed,scenarioId:scenario.templateId,variantId:scenario.variantId,scenario,nodes:structuredClone(scenario.nodes),edges:scenario.edges.map(e=>({...e,revealed:!e.hidden})),phase:'intro',wave:1,actionsLeft:scenario.actionsPerWave,selected:scenario.nodes[0].id,pilotNode:null,interventions:[],pendingEvent:null,events:[],history:[],messages:[],animation:null,followup:[],paused:false,result:null,commands:[],turn:0};
}
function beginAnimation(s,withdrawn=false){s.animation={frames:influenceFrames(s,{withdrawn}),index:0,withdrawn};s.phase=withdrawn?'consolidation':'wave';s.paused=false;}
function nextWave(s){if(s.wave<4){s.wave++;s.actionsLeft=s.scenario.actionsPerWave;s.phase='planning';}else{s.phase='followup';s.paused=true;}}
export function act(state,a){
  const s=structuredClone(state);if(s.phase==='ended')throw new Error('Четыре волны завершены.');
  if(a.type==='open'){if(s.phase!=='intro')throw new Error('Карта уже открыта.');s.phase='planning';}
  else if(a.type==='select'){if(!s.nodes.some(n=>n.id===a.id))throw new Error('Группа не найдена.');s.selected=a.id;}
  else if(a.type==='intervene'){if(s.phase!=='planning')throw new Error('Сначала дождитесь реакции сети.');applyIntervention(s,a.id);}
  else if(a.type==='run'){if(s.phase!=='planning')throw new Error('Волна уже идёт.');beginAnimation(s);}
  else if(a.type==='tick'){
    if(!['wave','consolidation'].includes(s.phase)||s.paused)throw new Error('Распространение не идёт.');const frame=s.animation.frames[s.animation.index];s.nodes[s.nodes.findIndex(n=>n.id===frame.id)]=structuredClone(frame.after);s.animation.index++;
    if(s.animation.index===s.animation.frames.length){
      if(s.animation.withdrawn){s.followup.push({time:s.followup.length?'Через 6 месяцев':'Через 2 месяца',metrics:metrics(s.nodes,s.scenario.threshold)});s.animation=null;s.phase=s.followup.length===2?'report':'followup';if(s.phase==='report')s.result=report(s);}
      else {s.history.push({wave:s.wave,metrics:metrics(s.nodes,s.scenario.threshold),nodes:structuredClone(s.nodes)});s.turn=s.history.length;s.messages.push(`Волна ${s.wave}: видимое использование ${s.history.at(-1).metrics.use}%; устойчиво приняли ${s.history.at(-1).metrics.accepted}/${s.nodes.length}.`);s.animation=null;s.pendingEvent=selectEvent(s);if(s.pendingEvent){s.phase='event';s.paused=true;}else nextWave(s);}
    }
  }else if(a.type==='decision'){if(s.phase!=='event')throw new Error('Нет события для решения.');resolveEvent(s,a.choice);nextWave(s);}
  else if(a.type==='pause'||a.type==='resume'){if(!['wave','consolidation'].includes(s.phase))throw new Error('Распространение не идёт.');s.paused=a.type==='pause';}
  else if(a.type==='observe'){if(s.phase!=='followup')throw new Error('Сначала проведите четыре волны.');beginAnimation(s,true);}
  else if(a.type==='finish'){if(s.phase!=='report')throw new Error('Сначала проверьте закрепление.');s.phase='ended';}
  else throw new Error('Действие не найдено.');
  s.commands.push(structuredClone(a));return s;
}
export function validate(saved){try{if(!saved||saved.revision!==1||saved.modelVersion!==2||typeof saved.seed!=='string'||!Array.isArray(saved.commands)||saved.commands.length>500)return false;let expected=create(saved.seed);for(const a of saved.commands)expected=act(expected,a);return Object.keys(expected).every(k=>JSON.stringify(expected[k])===JSON.stringify(saved[k]));}catch(_){return false;}}
