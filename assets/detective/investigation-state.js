import {generateCasebook,newSeed} from './generator.js';
import {runPilot} from './pilot.js';
import {stages} from './data.js';
export function createInvestigation(seed=newSeed()){return {revision:1,generatorVersion:2,seed:String(seed).slice(0,80),phase:'intro',spent:0,inspected:[],selectedEvidence:[],hypothesis:{stage:null,note:''},pilots:[],view:{intervention:null}};}
export const availableFacts=(s,book)=>book.sources.filter(source=>s.inspected.includes(source.id)).flatMap(source=>source.facts);
export function investigationAct(state,command){
  const s=structuredClone(state),book=generateCasebook(s.seed),facts=()=>availableFacts(s,book);
  if(s.phase==='ended')throw new Error('Расследование завершено.');
  if(command.type==='start'){if(s.phase==='intro')s.phase='investigating';}
  else if(command.type==='inspect'){
    const source=book.sources.find(source=>source.id===command.key);if(!source)throw new Error('Источник не найден.');
    if(!s.inspected.includes(source.id)){if(s.spent+source.cost>book.budget)throw new Error('Бюджет проверок исчерпан.');s.spent+=source.cost;s.inspected.push(source.id);}
  }else if(command.type==='evidence'){
    if(!facts().some(f=>f.id===command.id))throw new Error('Сначала откройте источник.');
    if(s.selectedEvidence.includes(command.id))s.selectedEvidence=s.selectedEvidence.filter(id=>id!==command.id);
    else {if(s.selectedEvidence.length>=3)throw new Error('Можно выбрать не более трёх улик.');s.selectedEvidence.push(command.id);}
    if(s.selectedEvidence.length<2){s.hypothesis.stage=null;s.view.intervention=null;}
  }else if(command.type==='hypothesis'){
    if(s.selectedEvidence.length<2)throw new Error('Выберите минимум две улики.');if(!stages.some(stage=>stage.id===command.stage))throw new Error('Этап не найден.');s.hypothesis.stage=command.stage;
  }else if(command.type==='measure'){
    if(!s.hypothesis.stage||!book.interventions.includes(command.id))throw new Error('Сначала выберите этап.');s.view.intervention=command.id;
  }else if(command.type==='pilot'){
    const id=command.intervention||s.view.intervention;
    if(s.pilots.length>=2||s.phase==='pilot')throw new Error('Уточните версию или завершите расследование.');
    if(s.selectedEvidence.length<2||!s.hypothesis.stage)throw new Error('Соберите версию из улик и этапа.');
    s.pilots.push({hypothesis:structuredClone(s.hypothesis),evidence:[...s.selectedEvidence],intervention:id,result:runPilot(book,id)});s.phase='pilot';
  }else if(command.type==='refine'){
    if(s.pilots.length>=2)throw new Error('Оба пилота уже использованы.');s.phase='investigating';s.view.intervention=null;
  }else if(command.type==='finish'){s.phase='ended';}
  else throw new Error('Неизвестное действие.');
  return s;
}
export function resumeInvestigation(saved){
  try{
    if(saved.revision!==1||saved.generatorVersion!==2||typeof saved.seed!=='string'||!['intro','investigating','pilot','ended'].includes(saved.phase))return null;
    const book=generateCasebook(saved.seed),copy=structuredClone(saved),sourceIds=book.sources.map(s=>s.id);
    if(!Array.isArray(copy.inspected)||new Set(copy.inspected).size!==copy.inspected.length||copy.inspected.some(id=>!sourceIds.includes(id)))return null;
    if(copy.spent!==book.sources.filter(s=>copy.inspected.includes(s.id)).reduce((v,s)=>v+s.cost,0)||copy.spent>book.budget)return null;
    const ids=availableFacts(copy,book).map(f=>f.id),validEvidence=list=>Array.isArray(list)&&list.length<=3&&new Set(list).size===list.length&&list.every(id=>ids.includes(id));
    if(!validEvidence(copy.selectedEvidence)||!copy.hypothesis||copy.hypothesis.stage!==null&&!stages.some(s=>s.id===copy.hypothesis.stage)||!copy.view)return null;
    if(copy.view.intervention!==null&&!book.interventions.includes(copy.view.intervention))return null;
    if(!Array.isArray(copy.pilots)||copy.pilots.length>2)return null;
    for(const p of copy.pilots){if(!validEvidence(p.evidence)||p.evidence.length<2||!p.hypothesis||!stages.some(s=>s.id===p.hypothesis.stage))return null;p.result=runPilot(book,p.intervention);}
    if(copy.phase==='pilot'&&!copy.pilots.length)return null;
    return copy;
  }catch(_){return null;}
}
