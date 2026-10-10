import {sources,stages,interventions} from './data.js';
import {createCasebook,compare,metrics} from './model.js';
import {evidence} from './evidence.js';
export const revision=1,budget=12,maxPilots=2;
export function createState(seed='case-01'){return {revision,seed:String(seed).slice(0,80)||'case-01',phase:'investigating',spent:0,inspected:[],pinned:[],hypothesis:{stage:null,note:''},pilots:[],view:{tab:'project',selectedCase:'case-1',source:null,intervention:null}};}
export function inspectionCost(key){const id=key.startsWith('case:')?'case':key;const source=sources.find(s=>s.id===id);if(!source)throw new Error('Источник не найден.');return source.cost;}
export function act(state,command){
  if(state.phase==='ended'&&!(command.type==='inspect'&&state.inspected.includes(command.key)))throw new Error('Расследование уже завершено. Можно открыть новое дело.');
  const s=structuredClone(state),book=createCasebook(s.seed);
  if(command.type==='inspect'){
    evidence(book,command.key);const cost=s.inspected.includes(command.key)?0:inspectionCost(command.key);
    if(s.spent+cost>budget)throw new Error('Бюджет проверок исчерпан. Используйте уже открытые факты.');
    if(cost){s.spent+=cost;s.inspected.push(command.key);}s.view.source=command.key;
  }else if(command.type==='pin'){
    if(!s.inspected.includes(command.key))throw new Error('Сначала откройте этот источник.');
    if(command.value){if(!s.pinned.includes(command.key))s.pinned.push(command.key);}else s.pinned=s.pinned.filter(id=>id!==command.key);
  }else if(command.type==='hypothesis'){
    if(command.stage!==undefined&&!stages.some(stage=>stage.id===command.stage))throw new Error('Этап не найден.');
    if(command.stage!==undefined)s.hypothesis.stage=command.stage;
    if(command.note!==undefined)s.hypothesis.note=String(command.note).slice(0,3000);
  }else if(command.type==='pilot'){
    if(s.pilots.length>=maxPilots)throw new Error('Два пилота уже проведены. Завершите разбор.');
    if(!s.hypothesis.stage||s.hypothesis.note.trim().length<10||s.pinned.length<2)throw new Error('Отметьте этап, объясните гипотезу и прикрепите два открытых источника.');
    if(!interventions.some(i=>i.id===command.intervention))throw new Error('Изменение не найдено.');
    if(s.pilots.some(p=>p.intervention===command.intervention))throw new Error('Это изменение уже проверено на этих случаях. Выберите другую меру.');
    const result=compare(book,command.intervention);
    s.pilots.push({hypothesis:structuredClone(s.hypothesis),evidence:[...s.pinned],intervention:command.intervention,result});
    s.view.intervention=command.intervention;
  }else if(command.type==='finish'){
    if(!s.pilots.length)throw new Error('Сначала проведите один пилот.');s.phase='ended';
  }else throw new Error('Неизвестное действие расследования.');
  return s;
}
export function resumeState(saved){
  if(!saved||saved.revision!==revision||typeof saved.seed!=='string'||!['investigating','ended'].includes(saved.phase)||!Array.isArray(saved.inspected)||!Array.isArray(saved.pinned)||!Array.isArray(saved.pilots)||saved.pilots.length>maxPilots||!saved.hypothesis||!Number.isFinite(saved.spent)||saved.spent<0||saved.spent>budget)return null;
  try{
    const book=createCasebook(saved.seed);
    if(new Set(saved.inspected).size!==saved.inspected.length||new Set(saved.pinned).size!==saved.pinned.length||saved.pinned.some(id=>!saved.inspected.includes(id)))return null;
    for(const key of saved.inspected)evidence(book,key);
    if(saved.spent!==saved.inspected.reduce((n,key)=>n+inspectionCost(key),0))return null;
    if(saved.hypothesis.stage!==null&&!stages.some(s=>s.id===saved.hypothesis.stage)||typeof saved.hypothesis.note!=='string')return null;
    if(saved.phase==='ended'&&!saved.pilots.length)return null;
    const copy=structuredClone(saved);copy.view={tab:'project',selectedCase:'case-1',source:null,intervention:null,...copy.view};
    if(!interventions.some(i=>i.id===copy.view.intervention))copy.view.intervention=null;
    copy.pilots=copy.pilots.map(p=>{
      if(!interventions.some(i=>i.id===p.intervention)||!p.hypothesis||!stages.some(s=>s.id===p.hypothesis.stage)||typeof p.hypothesis.note!=='string'||p.hypothesis.note.trim().length<10||!Array.isArray(p.evidence)||p.evidence.length<2||new Set(p.evidence).size!==p.evidence.length||p.evidence.some(id=>!copy.inspected.includes(id)))throw new Error('Invalid pilot');
      return {...p,result:compare(book,p.intervention)};
    });if(new Set(copy.pilots.map(p=>p.intervention)).size!==copy.pilots.length)return null;return copy;
  }catch(_){return null;}
}
export function finalReport(state){
  const book=createCasebook(state.seed),baseline=metrics(book.cases),pilots=state.pilots.map(p=>({...p,result:compare(book,p.intervention)})),last=pilots.at(-1);
  const facts=(last?.evidence||[]).map(key=>evidence(book,key));
  const supports=facts.filter(f=>f.signals.includes(book.scenario.stage)).length;
  return {scenario:book.scenario,baseline,last,supports,sourceCount:state.inspected.length,spent:state.spent,stageMatched:last?.hypothesis.stage===book.scenario.stage,measureMatched:last?.intervention===book.scenario.intervention,insights:[
    `В этом расследовании вы открыли ${state.inspected.length} источников, потратив ${state.spent} из ${budget} единиц бюджета.`,
    `Первый отчёт описывал ${baseline.included} из ${baseline.total} случаев и заканчивался отправкой, а не проверкой пригодного результата.`,
    supports?`${supports} из приложенных фактов прямо связаны с обнаруженным ограничением. Сопоставьте их с альтернативными объяснениями.`:'В приложенных фактах нет прямого подтверждения найденного ограничения. Результат пилота полезен, но исходное объяснение нужно уточнить.',
    last?.result.daysSaved>0.5?`Последний пилот сократил полный срок на ${last.result.daysSaved.toFixed(2)} дня; дополнительная сверка тоже заняла время.`:'Последний пилот не снял основную потерю. Улучшение удобного участка не гарантирует эффекта всей цепочки.'
  ]};
}
