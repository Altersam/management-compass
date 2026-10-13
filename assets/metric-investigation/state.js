import {generateScenario} from './generator.js';
import {validateScenario} from './validator.js';
import {newSeed} from '../sprint-goal/random.js';
import {beginProbe,advanceProbe} from './probe.js';
import {toggleDiagnosis} from './diagnosis.js';
import {firstRow,simulatePeriod} from './period.js';
import {score} from './scoring.js';
export function create(seed=newSeed()){
  seed=String(seed).slice(0,80);const scenario=generateScenario(seed),check=validateScenario(scenario);if(!check.valid)throw new Error('Некорректное дело: '+check.errors.join(', '));
  return {revision:1,modelVersion:2,seed,scenarioId:scenario.templateId,scenario,phase:'intro',checksLeft:3,opened:[],revealed:[],exhibits:[],evidence:[],diagnosis:[],metricId:null,guardId:null,rows:[],animation:null,paused:false,result:null,commands:[],turn:0};
}
export function act(state,a){
  const s=structuredClone(state);if(s.phase==='ended')throw new Error('Расследование завершено.');
  if(a.type==='open'){if(s.phase!=='intro')throw new Error('Отчёт уже открыт.');s.phase='investigate';}
  else if(a.type==='probe'){if(s.phase!=='investigate')throw new Error('Дождитесь раскрытия проверки.');beginProbe(s,a.id);}
  else if(a.type==='tick'){
    if(s.paused)throw new Error('Проигрывание на паузе.');if(s.phase==='reveal')advanceProbe(s);else if(s.phase==='simulate'){s.rows.push(simulatePeriod(s));s.turn++;if(s.rows.length===4){s.result=score(s);s.phase='report';}}else throw new Error('Проигрывание не идёт.');
  }else if(a.type==='pause'||a.type==='resume'){if(!['reveal','simulate'].includes(s.phase))throw new Error('Проигрывание не идёт.');s.paused=a.type==='pause';}
  else if(a.type==='diagnosis'){if(s.phase!=='diagnosis'||s.opened.length!==3)throw new Error('Сначала используйте ровно три проверки.');toggleDiagnosis(s,a.id);}
  else if(a.type==='design'){if(s.phase!=='diagnosis'||!s.diagnosis.length)throw new Error('Выберите диагноз.');s.phase='designMain';}
  else if(a.type==='metric'){if(!['designMain','designGuard'].includes(s.phase)||!s.scenario.metrics.some(m=>m.id===a.id))throw new Error('Показатель не найден.');s.metricId=a.id;}
  else if(a.type==='guards'){if(s.phase!=='designMain'||!s.metricId)throw new Error('Выберите основной показатель.');s.phase='designGuard';}
  else if(a.type==='back'){if(s.phase!=='designGuard')throw new Error('Вернуться можно к выбору основной метрики.');s.phase='designMain';}
  else if(a.type==='guard'){if(s.phase!=='designGuard'||!s.scenario.guards.some(g=>g.id===a.id))throw new Error('Защитный показатель не найден.');s.guardId=a.id;}
  else if(a.type==='run'){if(s.phase!=='designGuard'||!s.metricId||!s.guardId||s.opened.length!==3)throw new Error('Нужны три проверки, основная и защитная метрики.');s.rows=[firstRow(s)];s.phase='simulate';s.paused=false;}
  else if(a.type==='finish'){if(s.phase!=='report')throw new Error('Сначала проживите все три периода.');s.phase='ended';}
  else throw new Error('Действие не найдено.');
  s.commands.push(structuredClone(Object.fromEntries(Object.entries(a).filter(([,v])=>v!==undefined))));return s;
}
export function validate(saved){try{if(!saved||saved.modelVersion!==2||saved.revision!==1||typeof saved.seed!=='string'||!Array.isArray(saved.commands)||saved.commands.length>250)return false;let expected=create(saved.seed);for(const a of saved.commands)expected=act(expected,a);return Object.keys(expected).every(k=>JSON.stringify(expected[k])===JSON.stringify(saved[k]));}catch(_){return false;}}
