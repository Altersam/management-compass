import {generateScenario} from './generator.js';
import {principles} from './principles.js';
import {consequencePlan,futureOutcome} from './consequences.js';
import {scoreDecision} from './scoring.js';
import {newSeed} from '../sprint-goal/random.js';
export function create(seed=newSeed()){
  seed=String(seed).slice(0,80);const scenario=generateScenario(seed);
  return {revision:1,modelVersion:2,seed,scenarioId:scenario.templateId,scenario,phase:'intro',checksLeft:scenario.checks,documents:Object.fromEntries(scenario.documents.map(d=>[d.id,{read:false,checked:false,selectedAsBasis:false}])),basis:[],principles:[],decision:null,mitigation:null,consequences:[],futureReveal:null,result:null,paused:false,commands:[],history:[],turn:0};
}
export function act(state,a){
  const s=structuredClone(state),editing=s.phase==='dossier';if(s.phase==='ended')throw new Error('Решение уже разобрано.');
  const doc=id=>s.scenario.documents.find(d=>d.id===id);
  if(a.type==='open'){if(s.phase!=='intro')throw new Error('Досье уже открыто.');s.phase='dossier';}
  else if(['read','check','basis','principle','decision'].includes(a.type)){
    if(!editing)throw new Error('Основания зафиксированы.');
    if(['read','check','basis'].includes(a.type)&&!doc(a.id))throw new Error('Документ не найден.');
    if(a.type==='read')s.documents[a.id].read=true;
    else if(a.type==='check'){
      if(!s.documents[a.id].read)throw new Error('Сначала прочитайте документ.');
      if(!s.documents[a.id].checked){if(s.checksLeft<=0)throw new Error('Проверки исчерпаны.');s.checksLeft--;s.documents[a.id].checked=true;}
    }else if(a.type==='basis'){
      if(!s.documents[a.id].read)throw new Error('Сначала прочитайте документ.');
      if(s.basis.includes(a.id))s.basis=s.basis.filter(id=>id!==a.id);else{if(s.basis.length>=3)throw new Error('Выберите не более трёх оснований.');s.basis.push(a.id);}s.documents[a.id].selectedAsBasis=s.basis.includes(a.id);
    }else if(a.type==='principle'){
      if(!principles[a.id])throw new Error('Принцип не найден.');if(s.principles.includes(a.id))s.principles=s.principles.filter(id=>id!==a.id);else{if(s.principles.length>=2)throw new Error('Выберите не более двух принципов.');s.principles.push(a.id);}
    }else {if(!s.scenario.options.some(o=>o.id===a.id))throw new Error('Решение не найдено.');if(s.basis.length<2||!s.principles.length)throw new Error('Нужны два основания и хотя бы один принцип.');s.decision=a.id;s.phase='protection';}
  }else if(a.type==='back'){if(s.phase!=='protection')throw new Error('Вернуться к основанию сейчас нельзя.');s.phase='dossier';s.mitigation=null;}
  else if(a.type==='mitigation'){if(s.phase!=='protection'||!s.scenario.mitigations.some(m=>m.id===a.id))throw new Error('Защита недоступна.');s.mitigation=a.id;}
  else if(a.type==='commit'){
    if(s.phase!=='protection'||!s.mitigation)throw new Error('Выберите защитную меру.');s.result=scoreDecision(s);s.phase='consequences';s.paused=false;
  }else if(a.type==='tick'){
    if(s.phase!=='consequences'||s.paused)throw new Error('История не идёт.');const events=consequencePlan(s.scenario,s.decision,s.mitigation);s.consequences.push(events[s.consequences.length]);if(s.consequences.length===events.length){s.phase='future';s.paused=true;}
  }else if(a.type==='pause'||a.type==='resume'){if(s.phase!=='consequences')throw new Error('История не идёт.');s.paused=a.type==='pause';}
  else if(a.type==='reveal'){if(s.phase!=='future')throw new Error('Новая информация появится после основной истории.');s.futureReveal=futureOutcome(s.scenario,s.decision,s.mitigation);s.phase='report';}
  else if(a.type==='finish'){if(s.phase!=='report')throw new Error('Сначала прочитайте новую информацию.');s.phase='ended';s.turn=1;}
  else throw new Error('Действие не найдено.');
  s.commands.push(structuredClone(a));if(!['read','tick','pause','resume'].includes(a.type))s.history.push({text:a.type==='check'?'Источник проверен':a.type==='commit'?'Решение зафиксировано с защитой':'Конструкция решения изменена'});return s;
}
export function validate(saved){try{if(!saved||saved.revision!==1||saved.modelVersion!==2||typeof saved.seed!=='string'||!Array.isArray(saved.commands)||saved.commands.length>400)return false;let expected=create(saved.seed);for(const a of saved.commands)expected=act(expected,a);return Object.keys(expected).every(k=>JSON.stringify(expected[k])===JSON.stringify(saved[k]));}catch(_){return false;}}
