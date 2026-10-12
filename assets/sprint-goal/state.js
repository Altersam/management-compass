import {generateScenario} from './generator.js';
import {newSeed} from './random.js';
import {beginSprint,advanceDay} from './simulation.js';
import {resolveEvent} from './events.js';
export function create(seed=newSeed()){
  seed=String(seed).slice(0,80);const scenario=generateScenario(seed);
  return {revision:1,modelVersion:2,seed,scenario,tasks:structuredClone(scenario.tasks),values:scenario.criteria.map(c=>c.initial),progress:Object.fromEntries(scenario.tasks.map(t=>[t.id,0])),selected:[],done:[],effectiveDone:[],tail:[],cancelled:[],cancellationCost:0,investment:0,sprint:1,wip:scenario.initialWip,phase:'planning',run:null,reviews:[],speed:1,paused:true,history:[],commands:[],turn:0};
}
export function act(state,a){
  const s=structuredClone(state);if(s.phase==='ended')throw new Error('Два спринта завершены.');
  const task=id=>s.tasks.find(t=>t.id===id);
  if(['add','remove','move','wip','cancel'].includes(a.type)&&s.phase!=='planning')throw new Error('План меняется между спринтами.');
  if(a.type==='add'){
    const t=task(a.id);if(!t||s.done.includes(a.id)||s.cancelled.includes(a.id)||s.selected.includes(a.id)||t.availableSprint>s.sprint)throw new Error('Задача недоступна.');s.selected.push(a.id);
  }else if(a.type==='remove'){
    if(s.tail.includes(a.id))throw new Error('Хвост нужно достроить или осознанно отменить.');s.selected=s.selected.filter(id=>id!==a.id);
  }else if(a.type==='cancel'){
    if(!s.tail.includes(a.id))throw new Error('Это не хвост из прошлого спринта.');s.cancelled.push(a.id);s.tail=s.tail.filter(id=>id!==a.id);s.selected=s.selected.filter(id=>id!==a.id);s.cancellationCost+=1;
  }else if(a.type==='move'){
    const index=s.selected.indexOf(a.id),to=index+Number(a.delta);if(index<0||![-1,1].includes(a.delta)||to<0||to>=s.selected.length)throw new Error('Нельзя изменить порядок.');[s.selected[index],s.selected[to]]=[s.selected[to],s.selected[index]];
  }else if(a.type==='wip'){if(![1,2,3,4].includes(Number(a.value)))throw new Error('WIP недопустим.');s.wip=Number(a.value);}
  else if(a.type==='run'){if(s.phase!=='planning'||!s.selected.length)throw new Error('Выберите задачи под цель.');beginSprint(s);}
  else if(a.type==='tick'){if(s.phase!=='running'||s.paused)throw new Error('Спринт на паузе.');advanceDay(s);}
  else if(a.type==='pause'){if(s.phase!=='running')throw new Error('Выполнение не идёт.');s.paused=true;}
  else if(a.type==='resume'){if(s.phase!=='running')throw new Error('Сначала выберите действие по событию.');s.paused=false;}
  else if(a.type==='speed'){if(![1,2,3].includes(Number(a.value)))throw new Error('Скорость недопустима.');s.speed=Number(a.value);}
  else if(a.type==='decision'){
    if(s.phase!=='event')throw new Error('Нет события для решения.');const event=s.scenario.events.find(e=>e.id===s.run.pending);resolveEvent(s,event,a.choice);s.phase='running';s.paused=false;
  }else if(a.type==='next'){
    if(s.phase!=='review'||s.sprint!==1)throw new Error('Сначала завершите первый спринт.');s.sprint=2;s.selected=[...s.tail];s.phase='planning';s.run=null;s.wip=2;s.paused=true;s.turn=1;
  }else if(a.type==='finish'){
    if(s.phase!=='review'||s.sprint!==2)throw new Error('Сначала проведите второй спринт.');s.phase='ended';s.turn=2;
  }else throw new Error('Действие не найдено.');
  s.commands.push(structuredClone(a));if(!['tick','pause','resume','speed'].includes(a.type))s.history.push({text:({run:'Спринт запущен',next:'Хвост занял ёмкость второго спринта',decision:'Реакция на событие выбрана',cancel:'Хвост отменён; начатая работа потеряна'}[a.type]||'План спринта изменён')});return s;
}
export function validate(saved){
  try{
    if(!saved||saved.revision!==1||saved.modelVersion!==2||typeof saved.seed!=='string'||!Array.isArray(saved.commands)||saved.commands.length>600)return false;
    let expected=create(saved.seed);for(const command of saved.commands)expected=act(expected,command);
    return Object.keys(expected).every(key=>JSON.stringify(saved[key])===JSON.stringify(expected[key]));
  }catch(_){return false;}
}
