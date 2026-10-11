import {misconceptions} from './misconceptions.js';

export const schemaVersion=3;
const listFields=['concepts','misconceptions','explanations','techniques','cases','questions','retrievalQuestions','navigatorSignals','requiredBehavior','incentives','informalActors','functionNeeds','simulationHooks','references'];
const text=value=>typeof value==='string'&&value.trim().length>0;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

// Validation reports paths, rather than silently fixing authoring mistakes.
export function validateTopics(topics,{requireMisconceptions=false}={}){
  const errors=[],ids=new Set(),questionIds=new Set(),caseIds=new Set();
  const issue=(path,message)=>errors.push(`${path}: ${message}`);
  if(!Array.isArray(topics))return ['topics: expected array'];
  for(const topic of topics){
    const p=`topic ${topic?.id}`;
    if(!object(topic)){issue(p,'expected object');continue;}
    if(!Number.isInteger(topic.id)||topic.id<1||topic.id>10||ids.has(topic.id))issue(p,'invalid or duplicate ID');
    ids.add(topic.id);
    if(topic.schemaVersion!==schemaVersion)issue(p,'unsupported schemaVersion');
    for(const field of ['title','bridge'])if(!text(topic[field]))issue(`${p}.${field}`,'missing text');
    for(const field of listFields)if(!Array.isArray(topic[field]))issue(`${p}.${field}`,'expected array');
    if(!object(topic.scene)||!text(topic.scene.title)||!text(topic.scene.lead))issue(`${p}.scene`,'missing scene title/lead');
    if(!object(topic.activity)||!text(topic.activity.kind))issue(`${p}.activity`,'missing activity kind');
    for(const code of topic.misconceptions||[])if(!Object.hasOwn(misconceptions,code))issue(`${p}.misconceptions`, `unknown ${code}`);
    const techniqueIds=new Set();
    for(const t of topic.techniques||[]){
      if(!text(t.id)||techniqueIds.has(t.id))issue(`${p}.techniques`,'invalid or duplicate ID');
      techniqueIds.add(t.id);
      for(const field of ['name','when','why','example','mistake','check'])if(!text(t[field]))issue(`${p}.${t.id}.${field}`,'missing text');
      if(!Array.isArray(t.steps)||!t.steps.length||t.steps.some(step=>!text(step)))issue(`${p}.${t.id}.steps`,'missing steps');
    }
    for(const [i,b] of (topic.explanations||[]).entries()){
      for(const field of ['title','story','explain','term'])if(!text(b[field]))issue(`${p}.explanations.${i}.${field}`,'missing explanation');
    }
    for(const q of [...(topic.questions||[]),...(topic.retrievalQuestions||[]),...(topic.explanations||[]).map(b=>b.micro).filter(Boolean)]){
      validateQuestion(q,p,questionIds,issue,requireMisconceptions);
      if(q.module!==topic.id&&!(topic.retrievalQuestions||[]).includes(q))issue(`${p}.${q.id}`,'wrong topic reference');
      if(!Number.isInteger(q.block)||q.block<0||q.block>=(topic.explanations||[]).length)issue(`${p}.${q.id}`,'invalid explanation reference');
    }
    for(const c of topic.cases||[]){
      if(!text(c.id)||caseIds.has(c.id))issue(`${p}.cases`,'invalid or duplicate ID');
      caseIds.add(c.id);
      if(c.chapter!==topic.id)issue(`${p}.${c.id}`,'wrong case topic');
      validateQuestion(c,p,new Set(),issue,requireMisconceptions);
    }
  }
  for(const topic of topics){
    for(const connection of topic.course?.connections||[])if(!ids.has(connection.id))issue(`topic ${topic.id}.connections`,'missing target '+connection.id);
    for(const signal of topic.navigatorSignals||[]){
      if(!text(signal.id)||!(topic.techniques||[]).some(t=>t.id===signal.technique))issue(`topic ${topic.id}.navigatorSignals`,'invalid signal or technique');
    }
  }
  return errors;
}

function validateQuestion(q,p,ids,issue,required){
  const path=`${p}.${q?.id}`;
  if(!object(q)){issue(path,'expected question');return;}
  if(!text(q.id)||ids.has(q.id))issue(path,'invalid or duplicate question ID');
  ids.add(q.id);
  if(!text(q.title||q.prompt))issue(path,'missing question text');
  if(q.kind==='productive'){
    if(!Array.isArray(q.criteria)||!q.criteria.length||q.criteria.some(c=>!text(c))||!text(q.example))issue(path,'productive answer needs criteria and example');
    return;
  }
  if(!Array.isArray(q.options)||q.options.length<2){issue(path,'not enough alternatives');return;}
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length)issue(path,'invalid canonical answer');
  for(const [i,option] of q.options.entries()){
    for(const field of ['text','appeal','analysis'])if(!text(option[field]))issue(`${path}.options.${i}.${field}`,'missing feedback');
    if(option.misconception!==undefined&&option.misconception!==null&&!Object.hasOwn(misconceptions,option.misconception))issue(`${path}.options.${i}`,'unknown misconception');
    if(required&&i!==q.answer&&!text(option.misconception))issue(`${path}.options.${i}`,'missing misconception');
  }
}
