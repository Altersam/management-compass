import {cases,names,conflictArchetypes} from './cases.js';
import {randomFrom,shuffle} from './random.js';
import {physicallyViable} from './constraints.js';
export function validateScenario(scenario){
  const d=scenario.defaultDraft,limits=scenario.participants.filter(p=>p.kind!=='owner');
  const possible=[];for(const scope of ['full','limited','pilot','defer'])for(const deadline of scenario.deadlines)for(const staffing of ['current','temporary','contract','hire'])for(const budget of ['current','reserve','next']){
    const draft={scope,deadline,staffing,budget,conditions:['basis']};if(physicallyViable(scenario,draft,[]))possible.push(draft);
  }
  const linked={scope:'limited',deadline:scenario.deadlines[1],staffing:'temporary',budget:'reserve',conditions:['basis']};
  return {valid:possible.length>0&&!physicallyViable(scenario,d,[])&&limits.length>=2&&physicallyViable(scenario,linked,['resource-finance']),solutions:possible};
}
export function generateScenario(seed){
  const pick=randomFrom(seed),base=cases[Math.floor(pick()*cases.length)],archetype=conflictArchetypes[Math.floor(pick()*conflictArchetypes.length)];
  for(let attempt=0;attempt<20;attempt++){
    const r=randomFrom(seed+'#'+attempt),fast=3+Math.floor(r()*3),normal=9+Math.floor(r()*3),late=17+Math.floor(r()*3),full=4+Math.floor(r()*3),small=2,costSmall=16+Math.floor(r()*4),costFull=30+Math.floor(r()*6);
    const pickedNames=shuffle(names,r).slice(0,5),kinds=['resource','finance','formal','operations','owner'];
    const constraints=[{available:2,currentAt:2,temporaryAt:4+Math.floor(r()*3),contractAt:5+Math.floor(r()*3),hireAt:11+Math.floor(r()*3)},{current:costSmall+1,reserve:costSmall+7,next:costFull+8,nextAt:10+Math.floor(r()*3)},{fullDays:6+Math.floor(r()*3),smallDays:2+Math.floor(r()*3)},{fullAt:9+Math.floor(r()*4),smallAt:4+Math.floor(r()*3)},{}];
    if(archetype==='resource_shortage')constraints[0].available=1;
    if(archetype==='deadline_vs_quality'||archetype==='formal_blocker')constraints[2].fullDays=10+Math.floor(r()*3);
    if(archetype==='budget_timing')constraints[1].nextAt=13;
    if(archetype==='handoff_gap')constraints[3].fullAt=13;
    if(archetype==='people_conflict')constraints[0].hireAt=14;
    const positions=[['Полный объём поддерживаем, ресурс найдём.','Идея хорошая. Постараемся выделить нужных людей.'],['Лимит в целом предусмотрен.','Финансирование поддерживаем в рамках договорённостей.'],['Проверку организуем к заявленной дате.','Документы подготовим; коллеги могут рассчитывать на поддержку.'],['Подготовим контур к запуску.','Наш участок тоже поддерживает общий план.'],['Важно сохранить полный масштаб и заметный результат.','Предпочитаю полный охват к заявленной дате.']];
    const participants=shuffle(kinds.map((kind,i)=>({id:kind,kind,name:pickedNames[i],role:base.roles[i],obligation:base.nouns[i],publicPosition:positions[i][Math.floor(r()*2)],constraint:constraints[i],preferred:kind==='owner'?['full','defer']:['full','limited','pilot','defer']})),r);
    const order=shuffle(['resource','finance','formal','operations'],r);
    const scenario={id:base.id,domain:base.domain,title:base.titles[Math.floor(r()*base.titles.length)],brief:base.brief,archetype,requiresAuthorization:archetype==='authority_gap',deadlines:[fast,normal,late],requiredFull:full,requiredSmall:small,costFull,costSmall,participants,execution:order.map((id,i)=>({participant:id,day:1+i*2})),actions:9+Math.floor(r()*2),defaultDraft:{scope:'full',deadline:fast,staffing:'current',budget:'current',conditions:[]}};
    if(validateScenario(scenario).valid)return scenario;
  }throw new Error('Не удалось собрать исполнимый кейс.');
}
