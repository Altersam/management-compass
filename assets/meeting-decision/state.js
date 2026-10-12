import {generateScenario} from './generator.js';
import {newSeed} from './random.js';
import {scopeLabels,resourceLabels,budgetLabels} from './cases.js';
import {askParticipant,invalidateDraft,linkConditions} from './participants.js';
import {knownRisks} from './constraints.js';
import {startExecution,stepExecution} from './execution.js';
export function create(seed=newSeed()){
  seed=String(seed).slice(0,80);const scenario=generateScenario(seed);
  return {revision:1,modelVersion:2,seed,scenario,phase:'intro',actionsLeft:scenario.actions,actionBudget:scenario.actions,participants:Object.fromEntries(scenario.participants.map(p=>[p.id,{constraintKnown:false,concessionKnown:false,commitment:null}])),draft:structuredClone(scenario.defaultDraft),draftRevision:0,linkedDeals:[],selected:scenario.participants[0].id,preview:null,reply:null,discovered:{},attempts:[],execution:null,executionPaused:false,redundant:0,history:[],commands:[],turn:0};
}
export function act(state,a){
  const s=structuredClone(state);if(s.phase==='ended')throw new Error('Встреча завершена.');
  const spend=()=>{if(s.actionsLeft<=0)throw new Error('Ходы встречи закончились. Зафиксируйте имеющийся черновик.');s.actionsLeft--;};
  if(a.type==='start'){if(s.phase!=='intro')throw new Error('Встреча уже открыта.');s.phase='meeting';}
  else if(['select','ask','draft','link','check','fix'].includes(a.type)){
    if(s.phase!=='meeting')throw new Error('Сейчас идёт исполнение или разбор.');
    if(a.type==='select'){if(!s.participants[a.id])throw new Error('Участник не найден.');s.selected=a.id;s.reply=null;}
    else if(a.type==='ask'){
      spend();const info=s.participants[s.selected];if(a.question==='constraint'&&info.constraintKnown||a.question==='concession'&&info.concessionKnown||a.question==='commitment'&&info.commitment?.revision===s.draftRevision)s.redundant++;
      s.reply={participant:s.selected,text:askParticipant(s,s.selected,a.question)};
    }else if(a.type==='draft'){
      const valid=a.key==='scope'?Object.hasOwn(scopeLabels,a.value):a.key==='deadline'?s.scenario.deadlines.includes(Number(a.value)):a.key==='staffing'?Object.hasOwn(resourceLabels,a.value):a.key==='budget'?Object.hasOwn(budgetLabels,a.value):a.key==='conditions'&&a.value==='basis';
      if(!valid)throw new Error('Параметр черновика не найден.');
      if(a.key!=='conditions'&&String(s.draft[a.key])===String(a.value))return s;
      if(a.key==='conditions')s.draft.conditions=s.draft.conditions.includes('basis')?[]:['basis'];else s.draft[a.key]=a.key==='deadline'?Number(a.value):a.value;
      invalidateDraft(s);s.reply=null;
    }else if(a.type==='link'){spend();linkConditions(s);s.reply={participant:'resource',text:'Временный ресурс и оплата замены связаны в одном ограниченном запуске. Обе стороны подтвердили условия.'};}
    else if(a.type==='check'){spend();s.preview=knownRisks(s);}
    else startExecution(s);
  }else if(a.type==='tick'){if(s.phase!=='execution'||s.executionPaused)throw new Error('Исполнение ещё не запущено или на паузе.');stepExecution(s);}
  else if(a.type==='pause'||a.type==='resume'){if(s.phase!=='execution')throw new Error('Исполнение не идёт.');s.executionPaused=a.type==='pause';}
  else if(a.type==='retry'){
    if(s.phase!=='result'||s.attempts.length!==1||s.attempts[0].success)throw new Error('Корректирующая попытка недоступна.');s.actionsLeft+=4;s.actionBudget+=4;s.phase='meeting';s.execution=null;invalidateDraft(s);s.reply=null;s.turn=1;
  }else if(a.type==='finish'){
    if(s.phase!=='result')throw new Error('Сначала проверьте решение исполнением.');s.phase='ended';s.turn=s.attempts.length;
  }else throw new Error('Действие не найдено.');
  s.commands.push(structuredClone(a));if(!['select','tick'].includes(a.type))s.history.push({text:a.type==='fix'?'Черновик зафиксирован, начинается исполнение':'Встреча изменилась'});return s;
}
export function validate(saved){try{if(!saved||saved.revision!==1||saved.modelVersion!==2||typeof saved.seed!=='string'||!Array.isArray(saved.commands)||saved.commands.length>300)return false;let expected=create(saved.seed);for(const cmd of saved.commands)expected=act(expected,cmd);return Object.keys(expected).every(k=>JSON.stringify(expected[k])===JSON.stringify(saved[k]));}catch(_){return false;}}
