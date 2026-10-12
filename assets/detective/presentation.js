import {generateCasebook} from './generator.js';
import {createCasebook,metrics,pilotCases} from './model.js';
import {evidence} from './evidence.js';
import {sources,interventions} from './data.js';
import {round,cycle} from './pilot.js';

// Legacy attempts retain their authored cases, costs, interventions and earned pilots.
export function presentationBook(state){
  if(state.generatorVersion===2)return generateCasebook(state.seed);
  const old=createCasebook(state.seed),m=metrics(old.cases),scenario=old.scenario;
  const cases=convertCases(old.cases);
  const keys=[...old.cases.map(c=>'case:'+c.id),...sources.filter(s=>s.id!=='case').map(s=>s.id)];
  return {seed:state.seed,legacy:old,cases,realCycle:m.days,reportedCycle:m.reportedDays,budget:12,
    archetype:{...scenario,trueStage:scenario.stage,effectiveInterventions:[scenario.intervention],partialInterventions:[],trapInterventions:[]},
    interventions:interventions.map(i=>i.id),
    sources:keys.map(id=>{
      const fact=evidence(old,id),source=sources.find(s=>s.id===(id.startsWith('case:')?'case':id));
      const refCase=id.startsWith('case:')?id.slice(5):fact.signals.includes(scenario.stage)?'case-2':null;
      const refEvent=cases.find(c=>c.id===refCase)?.events.find(e=>fact.signals.includes(e.stage)&&e.type==='wait')?.id;
      return {id,name:id.startsWith('case:')?'Хронология '+id.slice(5).toUpperCase():source.name,description:source.description,cost:source.cost,
        facts:[{id,source:id,text:fact.text,kind:fact.signals.includes(scenario.stage)?'key':'neutral',refCase,refEvent}],document:fact};
    })};
}
function convertCases(cases){return cases.map(c=>({id:c.id,name:c.name,events:c.flow.flatMap((s,i)=>[
  ...(s.wait>0?[{id:i+'-wait',stage:s.stage,type:'wait',duration:round(s.wait/8)}]:[]),
  ...(s.work>0?[{id:i+'-work',stage:s.stage,type:s.stage==='execute'?'work':'admin',duration:round(s.work/8)}]:[]),
  ...(s.rework>0?[{id:i+'-rework',stage:s.stage,type:'rework',duration:round(s.rework/8)}]:[])
])}));}
export function displayedPilot(state,book,p){
  if(!book.legacy)return p;
  const afterCases=convertCases(pilotCases(book.legacy,p.intervention)).map((c,i)=>({...c,events:c.events.map(e=>{
    const before=book.cases[i].events.find(b=>b.id===e.id),delta=round((before?.duration||0)-e.duration);
    return {...e,delta,changed:Math.abs(delta)>=.01};
  })}));
  return {...p,result:{before:p.result.before.days,after:p.result.after.days,delta:p.result.daysSaved,
    reportedBefore:p.result.before.reportedDays,reportedAfter:p.result.after.reportedDays,afterCases}};
}
export const selectedFacts=s=>s.selectedEvidence||s.pinned||[];
export const measureInfo=(id,library)=>library[id]||interventions.find(i=>i.id===id)||{name:id,description:''};
export const caseTotal=cycle;
