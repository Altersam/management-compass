import {people} from './people.js';
import {project,tasks} from './project.js';

export const revision=1;
export const tickSize=0.25;
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
export function createState(seed='service-20'){
  const rng={rng:seedNumber(seed)};
  const externalPlan={requirementsDay:3.5+Math.floor(random(rng)*5)/4,illnessDay:7+Math.floor(random(rng)*9)/4,illPerson:people[Math.floor(random(rng)*people.length)].id,itDay:6.5+Math.floor(random(rng)*5)/4};
  return {
    revision,seed:String(seed),rng:rng.rng,externalPlan,time:0,phase:'planning',spent:0,budget:project.budget,deadline:project.deadline,
    people:people.map(p=>({...structuredClone(p),fatigue:0,overloadTime:0,absentUntil:0,trainingUntil:0})),
    tasks:tasks.map(t=>({...structuredClone(t),assigned:t.id==='requirements'?[...t.assigned]:[],effort:t.duration,progress:0,quality:0.72,qualityWeight:0,checkpoint:'none',checkpointPaid:false,autonomy:'bounded',priority:1,paused:false,awaitingDecision:false,manualReviewed:false,startedAt:null,completedAt:null,completionCount:0})),
    it:{contacted:false,ready:false,readyAt:10,riskAccepted:false},scope:'full',leaderExample:false,supportCut:false,
    adoption:0,launchedAt:null,formalLaunch:false,metricsInvestigated:false,flags:{},events:[],delayed:[],decisions:[],history:[],
    stats:{rework:0,reworkCost:0,overloadDays:0,manualDecisions:0,manualWaiting:0,checks:0,trainingDays:0},endReason:null
  };
}
export function resumeState(saved){
  // Never reinterpret a different revision as this game's state.
  if(!saved||saved.revision!==revision)return null;
  if(!Array.isArray(saved.tasks)||saved.tasks.length!==tasks.length||saved.tasks.some((t,i)=>t.id!==tasks[i].id||!Number.isFinite(t.progress)||!Number.isFinite(t.effort)||t.effort<=0||!Array.isArray(t.assigned)))return null;
  if(!Array.isArray(saved.people)||people.some(p=>!saved.people.some(x=>x.id===p.id))||!Number.isFinite(saved.time)||saved.time<0||saved.time>20||!Number.isFinite(saved.spent)||!Array.isArray(saved.events)||!Array.isArray(saved.delayed)||!saved.stats||!saved.it||!saved.flags||!saved.externalPlan)return null;
  return structuredClone(saved);
}
export const finished=state=>state.phase==='ended';
export const dayLabel=state=>Math.min(20,Math.floor(state.time)+1);
