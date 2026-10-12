import {generateProject,newSeed} from './generator.js';
import {presets,validParameters} from './parameters.js';
import {startRun,stepWeek,configureRun,decideRun,replayRun} from './simulation.js';
export function create(seed=newSeed()){
  seed=String(seed).slice(0,80);const {project,events}=generateProject(seed);
  return {revision:1,modelVersion:3,seed,project,events,parameters:structuredClone(presets.hybrid.parameters),preset:'hybrid',attempts:[],current:null,currentWeek:0,phase:'intro',speed:1,paused:true,history:[],turn:0};
}
export function act(state,a){
  const s=structuredClone(state),c=s.project;
  if(s.phase==='ended')throw new Error('Две попытки завершены.');
  if(a.type==='start'){if(s.phase!=='intro')throw new Error('Проект уже открыт.');s.phase='planning';}
  else if(a.type==='parameter'||a.type==='preset'){
    if(a.type==='parameter'&&!['upfront','interval','feedback','buffer'].includes(a.key))throw new Error('Рычаг не найден.');
    if(!['planning','running','event'].includes(s.phase)||s.current&&!s.paused)throw new Error('Сначала поставьте проект на паузу.');
    if(a.type==='preset'&&s.current)throw new Error('Стартовый профиль меняется между попытками.');
    const p=a.type==='preset'?structuredClone(presets[a.value]?.parameters):{...s.parameters,[a.key]:Number(a.value)};
    if(!validParameters(p))throw new Error('Настройки подхода недопустимы.');
    if(s.current){const changes=Object.fromEntries(Object.entries(p).filter(([key,value])=>value!==s.parameters[key]));configureRun(s.current,changes,c);s.current.commands.push({type:'configure',week:s.current.week,changes});}
    s.parameters=p;s.preset=a.type==='preset'?a.value:null;
  }else if(a.type==='run'){
    if(s.phase!=='planning'||s.attempts.length>=2)throw new Error('Сначала настройте подход.');s.current=startRun(c,s.parameters);s.currentWeek=0;s.phase='running';s.paused=false;
  }else if(a.type==='tick'){
    if(s.phase!=='running'||s.paused||!s.current)throw new Error('Время на паузе.');
    s.current=stepWeek(s.current,c,s.events);s.currentWeek=s.current.week;
    if(s.current.pending){s.phase='event';s.paused=true;}
    else if(s.current.complete){s.attempts.push(s.current);s.current=null;s.phase=s.attempts.length===2?'ended':'review';s.turn=s.attempts.length;s.paused=true;}
  }else if(a.type==='pause'){s.paused=true;}
  else if(a.type==='resume'){if(s.phase!=='running')throw new Error('Сначала решите событие.');s.paused=false;}
  else if(a.type==='speed'){if(![1,2,3].includes(Number(a.value)))throw new Error('Скорость недопустима.');s.speed=Number(a.value);}
  else if(a.type==='decision'){
    if(s.phase!=='event')throw new Error('Нет события для решения.');const event=s.events.find(e=>e.id===s.current.pending);decideRun(s.current,event,a.choice,c);
    s.current.commands.push({type:'decision',week:s.current.week,event:event.id,choice:a.choice});s.phase='running';s.paused=false;
  }else if(a.type==='adjust'){
    if(s.phase!=='review'||s.attempts.length!==1)throw new Error('Первая попытка ещё не завершена.');s.phase='planning';s.currentWeek=0;s.paused=true;
  }else throw new Error('Действие не найдено.');
  if(a.type!=='tick')s.history.push({text:({start:'Проект открыт',run:'Попытка запущена',decision:'Выбрана реакция на событие',adjust:'Подход пересматривается'}[a.type]||'Условия управления изменены')});return s;
}
export function validate(s){
  try{
    if(!s||s.revision!==1||s.modelVersion!==3||typeof s.seed!=='string'||!['intro','planning','running','event','review','ended'].includes(s.phase)||!validParameters(s.parameters)||!Array.isArray(s.attempts)||s.attempts.length>2||!Array.isArray(s.history)||![1,2,3].includes(s.speed)||typeof s.paused!=='boolean')return false;
    const generated=generateProject(s.seed);if(JSON.stringify(s.project)!==JSON.stringify(generated.project)||JSON.stringify(s.events)!==JSON.stringify(generated.events))return false;
    const check=r=>JSON.stringify(replayRun(s.project,s.events,r.startParameters,r.commands,r.week))===JSON.stringify(r);
    if(s.attempts.some(r=>!r.complete||!check(r))||s.turn!==s.attempts.length)return false;
    if(Boolean(s.current)!==['running','event'].includes(s.phase)||s.current&&!check(s.current))return false;
    if(s.current&&JSON.stringify(s.parameters)!==JSON.stringify(s.current.parameters))return false;
    if(s.currentWeek!==(s.current?.week||(['review','ended'].includes(s.phase)?s.attempts.at(-1)?.week:0)))return false;
    if(s.phase==='event'&&!s.current?.pending||s.phase==='running'&&s.current?.pending)return false;
    if(s.phase==='event'&&!s.paused||s.phase==='intro'&&(s.attempts.length||s.current)||s.current?.complete)return false;
    if(s.phase==='ended'&&s.attempts.length!==2||s.phase==='review'&&s.attempts.length!==1||s.phase==='planning'&&s.attempts.length>=2)return false;
    return true;
  }catch(_){return false;}
}
