import {people,contractor} from './people.js';
import {project,tasks} from './project.js';
import {eventDefinitions} from './events.js';
import {createScenarioEvents} from './scenario-events.js';

export const revision=1;
export const tickSize=0.25;
export function snapshot(state){
  return structuredClone({...state,decisions:[],history:[],reviewPoints:{}});
}
export function seedNumber(seed){
  let value=2166136261;
  for(const char of String(seed))value=Math.imul(value^char.charCodeAt(0),16777619);
  return value>>>0;
}
export function random(state){
  state.rng=(state.rng+0x6D2B79F5)>>>0;
  let t=state.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
}
export function createState(seed='service-20',{balanceVersion=2,scenarioVersion}={}){
  const rng={rng:seedNumber(seed)};
  const externalPlan={requirementsDay:3.5+Math.floor(random(rng)*5)/4,illnessDay:7+Math.floor(random(rng)*9)/4,illPerson:people[Math.floor(random(rng)*people.length)].id,itDay:6.5+Math.floor(random(rng)*5)/4};
  const state={
    revision,balanceVersion,preferences:{autoPause:true},seed:String(seed),rng:rng.rng,externalPlan,time:0,phase:'planning',spent:0,budget:project.budget,deadline:project.deadline,
    people:people.map(p=>({...structuredClone(p),capacity:balanceVersion===2?0.82:1,fatigue:0,overloadTime:0,absentUntil:0,trainingUntil:0})),
    tasks:tasks.map(t=>({...structuredClone(t),assigned:t.id==='requirements'?[...t.assigned]:[],effort:t.duration,progress:0,quality:0.72,qualityWeight:0,checkpoint:'none',checkpointPaid:false,autonomy:'bounded',priority:1,paused:false,awaitingDecision:false,manualReviewed:false,startedAt:null,completedAt:null,completionCount:0})),
    it:{contacted:false,ready:false,readyAt:10,riskAccepted:false},scope:'full',leaderExample:false,supportCut:false,
    adoption:0,launchedAt:null,formalLaunch:false,metricsInvestigated:false,flags:{},events:[],delayed:[],decisions:[],history:[],reviewPoints:{},
    stats:{rework:0,reworkCost:0,overloadDays:0,manualDecisions:0,manualWaiting:0,checks:0,trainingDays:0},endReason:null
  };
  if(scenarioVersion===3){state.scenarioVersion=3;state.scenarioEvents=createScenarioEvents(rng);state.rng=rng.rng;for(const p of state.people){p.life={remote:random(rng)>.25,children:Math.floor(random(rng)*3),care:random(rng)>.7};if(seed!=='service-20'){p.cost=Math.round(p.cost*(.9+random(rng)*.2)/500)*500;p.speed=Math.max(1,Math.min(3,p.speed+(random(rng)>.65?1:0)));const skill=Object.keys(p.skills)[Math.floor(random(rng)*Object.keys(p.skills).length)];p.skills[skill]=Math.max(0,Math.min(3,p.skills[skill]+(random(rng)>.5?1:-1)));}}if(seed!=='service-20')for(const t of state.tasks)t.effort=Math.round(t.effort*(.85+random(rng)*.3)*4)/4;state.rng=rng.rng;}
   if(scenarioVersion===3){for(const p of state.people)if(random(rng)>.75)p.life.leave={start:Math.round((8+random(rng)*7)*4)/4,days:2,started:false};state.rng=rng.rng;}
   return state;
}
export function resumeState(saved){
  // Never reinterpret a different revision as this game's state.
  if(!saved||saved.revision!==revision)return null;
  if(!Array.isArray(saved.tasks)||saved.tasks.length!==tasks.length||saved.tasks.some((t,i)=>t.id!==tasks[i].id||!Number.isFinite(t.progress)||!Number.isFinite(t.effort)||t.effort<=0||!Array.isArray(t.assigned)))return null;
  if(!Array.isArray(saved.people)||people.some(p=>!saved.people.some(x=>x.id===p.id))||!Number.isFinite(saved.time)||saved.time<0||saved.time>20||!Number.isFinite(saved.spent)||!Array.isArray(saved.events)||!Array.isArray(saved.delayed)||!saved.stats||!saved.it||!saved.flags||!saved.externalPlan)return null;
  if(!['planning','running','observing','ended'].includes(saved.phase)||saved.deadline!==20||saved.budget!==1200000||!Number.isInteger(saved.rng)||!Array.isArray(saved.history)||!Array.isArray(saved.decisions))return null;
  if(saved.people.some(p=>![...people,contractor].some(def=>def.id===p.id)||!p.skills||!Number.isFinite(p.fatigue)||!Number.isFinite(p.absentUntil)||!Number.isFinite(p.trainingUntil)||!Number.isFinite(p.cost)))return null;
  if(saved.tasks.some(t=>t.assigned.some(id=>!saved.people.some(p=>p.id===id))||!Number.isFinite(t.quality)||!Array.isArray(t.dependencies)||t.dependencies.some(id=>!saved.tasks.some(x=>x.id===id))))return null;
   if(saved.events.some(e=>!eventDefinitions[e.definition])||saved.delayed.some(e=>!['rework','learn','support','metrics'].includes(e.effect)))return null;
   if(saved.scenarioVersion!==undefined&&saved.scenarioVersion!==3)return null;
   if(saved.scenarioVersion===3&&(!saved.scenarioEvents||saved.scenarioEvents.version!==1||!Number.isFinite(saved.scenarioEvents.nextAt)||!Array.isArray(saved.scenarioEvents.seen)||saved.scenarioEvents.seen.some(id=>!eventDefinitions[id]?.domain)))return null;
   if(saved.people.some(p=>p.life?.leave&&(!Number.isFinite(p.life.leave.start)||p.life.leave.start<0||p.life.leave.start>20||p.life.leave.days!==2)))return null;
  if(!saved.people.some(p=>p.id===saved.externalPlan.illPerson))return null;
  const copy=structuredClone(saved);
  copy.balanceVersion=copy.balanceVersion||1;
  copy.preferences={autoPause:true,...copy.preferences};
  copy.reviewPoints=copy.reviewPoints||{};
  // Descriptions/identities come from authored data, while developed skills and history are retained.
   copy.people=copy.people.map(p=>{const def=[...people,contractor].find(d=>d.id===p.id);return {...p,...structuredClone(def),...(copy.scenarioVersion===3?{cost:p.cost,speed:p.speed,quality:p.quality,communication:p.communication}:{}),capacity:p.capacity??1,skills:p.skills};});
  copy.tasks=copy.tasks.map((t,i)=>{
    const task={...t,name:tasks[i].name,skills:[...tasks[i].skills],dependencies:[...tasks[i].dependencies]};
    if(tasks[i].external)task.external=tasks[i].external;else delete task.external;
    return task;
  });
  return copy;
}
export const finished=state=>state.phase==='ended';
export const dayLabel=state=>Math.min(20,Math.floor(state.time)+1);
