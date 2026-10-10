const {test}=require('node:test'),assert=require('node:assert/strict');
const {createState,resumeState,random}=require('../assets/game/state.js');
const {advance,act,rate,workloads,dailyCost,forecast}=require('../assets/game/engine.js');
const {tasks,complete,taskStatus}=require('../assets/game/project.js');
const {eventDefinitions}=require('../assets/game/events.js');
const {report}=require('../assets/game/scoring.js');
const {createStore}=require('../assets/store.js');
const step=(s,n)=>{for(let i=0;i<n;i++)s=advance(s);return s;};
const task=(s,id)=>s.tasks.find(t=>t.id===id);
function allocated(seed='service-20'){
  let s=createState(seed,{balanceVersion:1});for(const t of tasks)s=act(s,{type:'assign',task:t.id,people:t.assigned});return s;
}
test('dependencies gate progress; a finished dependency opens its successor on a later tick',()=>{
  let s=allocated();const before=structuredClone(s);s=advance(s);
  assert.deepEqual(before,allocated());assert.ok(task(s,'requirements').progress>0);assert.equal(task(s,'prototype').progress,0);
  while(!complete(task(s,'requirements')))s=advance(s);
  assert.equal(task(s,'prototype').progress,0);s=advance(s);assert.ok(task(s,'prototype').progress>0);
});
test('project needs assignments, charges reserved team daily and ends at day 20',()=>{
  let s=createState();s=advance(s);assert.equal(s.spent,dailyCost(s)*0.25);
  s=step(s,79);assert.equal(s.time,20);assert.equal(s.phase,'ended');assert.equal(task(s,'prototype').progress,0);assert.equal(s.spent,960000);
  assert.deepEqual(advance(s),s);assert.throws(()=>act(s,{type:'hire'}),/завершён/);
});
test('reassignment preserves completed work and changes the next rate',()=>{
  let s=step(allocated(),4),progress=task(s,'requirements').progress,before=rate(s,task(s,'requirements'));
  s=act(s,{type:'assign',task:'requirements',people:['maxim']});assert.equal(task(s,'requirements').progress,progress);assert.notEqual(rate(s,task(s,'requirements')),before);
  s=act(s,{type:'assign',task:'requirements',people:[]});assert.equal(taskStatus(s,task(s,'requirements')),'unassigned');assert.equal(task(step(s,2),'requirements').progress,progress);
  assert.throws(()=>act(s,{type:'assign',task:'requirements',people:['ghost']}));
});
test('concurrent overload gives an early burst then fatigue, slower work and a subject-specific event',()=>{
  let s=createState();s.tasks=s.tasks.map(t=>({...t,dependencies:[],external:null,effort:30,assigned:['maxim']}));
  const early=rate(s,s.tasks[0]);s=step(s,12);
  const person=s.people.find(p=>p.id==='maxim');assert.ok(person.fatigue>0.5);assert.ok(rate(s,s.tasks[0])<early);
  assert.ok(s.events.some(e=>e.definition==='overload'&&e.subject==='maxim'));assert.ok(s.stats.overloadDays>0);
  for(const t of s.tasks.slice(1))s=act(s,{type:'assign',task:t.id,people:[]});
  const tired=person.fatigue;s=step(s,4);assert.ok(s.people.find(p=>p.id==='maxim').fatigue<tired);assert.equal(workloads(s).maxim,1);
});
test('priority reallocates the same person between active tasks instead of creating capacity',()=>{
  let s=createState();s.tasks.forEach(t=>{t.dependencies=[];t.external=null;t.assigned=[];t.effort=30;});
  for(const id of ['requirements','prototype'])s=act(s,{type:'assign',task:id,people:['anna']});
  const before=rate(s,task(s,'requirements')),other=rate(s,task(s,'prototype'));
  s=act(s,{type:'priority',task:'requirements',value:2});assert.ok(rate(s,task(s,'requirements'))>before);assert.ok(rate(s,task(s,'prototype'))<other);
});
test('missed requirement check produces a delayed return and its cost, early alignment avoids it',()=>{
  let s=allocated();s.externalPlan.requirementsDay=3.5;
  while(!complete(task(s,'prototype')))s=advance(s);
  assert.equal(s.stats.rework,0);assert.ok(s.delayed.some(e=>e.effect==='rework'));const originalEffort=task(s,'prototype').effort;
  s=step(s,7);assert.ok(task(s,'prototype').effort>originalEffort);assert.equal(s.stats.reworkCost,22500);assert.ok(s.events.some(e=>e.definition==='rework'));
  let protectedPath=act(allocated(),{type:'checkpoint',task:'requirements',value:'early'});protectedPath.externalPlan.requirementsDay=3.5;protectedPath=step(protectedPath,60);
  assert.equal(protectedPath.flags.requirementsAligned,true);assert.equal(protectedPath.stats.rework,0);assert.ok(protectedPath.stats.checks>0);
});
test('earlier IT coordination suppresses external blockage; accepting risk schedules later work',()=>{
  let early=act(allocated(),{type:'coordinateIT'});early.externalPlan.itDay=7;early=step(early,29);
  assert.equal(early.it.ready,true);assert.equal(early.events.some(e=>e.definition==='it'),false);
  let risky=act(allocated(),{type:'acceptIT'});risky=act(risky,{type:'clarify'});
  while(!complete(task(risky,'integration')))risky=advance(risky);
  assert.ok(risky.delayed.some(e=>e.key==='it-return'));risky=step(risky,6);assert.ok(risky.stats.rework>=1.5);
});
test('manual control queues a decision; changing boundaries releases the task',()=>{
  let s=act(allocated(),{type:'autonomy',task:'requirements',value:'manual'});
  while(!task(s,'requirements').awaitingDecision)s=advance(s);
  const progress=task(s,'requirements').progress;s=step(s,2);assert.equal(task(s,'requirements').progress,progress);assert.ok(s.stats.manualWaiting>0);
  s=act(s,{type:'approve',task:'requirements'});assert.equal(s.stats.manualDecisions,1);assert.ok(task(advance(s),'requirements').progress>progress);
  assert.ok(s.events.some(e=>e.definition==='authority'&&e.status==='resolved'));
});
test('seed fixes the baseline external sequence; causal events depend on decisions',()=>{
  const a=allocated('same'),b=allocated('same');assert.deepEqual(a.externalPlan,b.externalPlan);assert.deepEqual(step(a,50),step(b,50));
  assert.notDeepEqual(createState('another').externalPlan,a.externalPlan);
  let c=act(allocated('same'),{type:'clarify'});c=step(c,50);assert.deepEqual(c.externalPlan,a.externalPlan);assert.notEqual(c.stats.rework,step(a,50).stats.rework);
  const rng=createState('same'),copy=structuredClone(rng);assert.equal(random(rng),random(copy));
});
test('training takes capacity now and improves a named skill one day later; extra resource costs more',()=>{
  let s=createState(),before=s.people.find(p=>p.id==='maxim').skills.testing;s=act(s,{type:'coach',person:'maxim',skill:'testing'});
  assert.equal(s.people.find(p=>p.id==='maxim').skills.testing,before);s=step(s,4);assert.equal(s.people.find(p=>p.id==='maxim').skills.testing,before+1);
  const cost=dailyCost(s);s=act(s,{type:'hire'});assert.equal(dailyCost(s),cost+22000);assert.throws(()=>act(s,{type:'hire'}));
});
test('support cuts save immediately and harm later; formal launch does not prove adoption',()=>{
  let s=act(allocated(),{type:'clarify'});s=act(s,{type:'coordinateIT'});s=act(s,{type:'pauseTask',task:'training',value:true});
  while(s.time<12||!complete(task(s,'integration')))s=advance(s);
  assert.ok(complete(task(s,'integration')));s=act(s,{type:'formalLaunch'});assert.equal(s.adoption,0);s=step(s,4);
  assert.ok(s.events.some(e=>e.definition==='training'));assert.ok(s.events.some(e=>e.definition==='oldChannel'));assert.ok(s.adoption<40);
  const cost=dailyCost(s);s=act(s,{type:'cutSupport'});assert.equal(dailyCost(s),cost*0.85);assert.equal(s.events.some(e=>e.definition==='support'),false);
  s=step(s,9);assert.ok(s.events.some(e=>e.definition==='support'));s=act(s,{type:'inspectMetrics'});assert.equal(s.metricsInvestigated,false);s=step(s,4);assert.equal(s.metricsInvestigated,true);
});
test('forecast does not mutate saved RNG and report describes this run without a personality grade',()=>{
  const s=allocated(),before=JSON.stringify(s);assert.ok(forecast(s).day);assert.equal(JSON.stringify(s),before);
  const result=report(step(s,80));assert.equal(result.insights.length,5);assert.ok(result.insights.every(text=>text.startsWith('В этой игре')));
  assert.ok(Object.values(eventDefinitions).filter(e=>e.kind==='causal').length>Object.values(eventDefinitions).filter(e=>e.kind==='external').length);
});
test('game resume/export is isolated from existing simulation, archives and experiments',()=>{
  const map=new Map(),store=createStore({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}),id=store.active(),s=step(allocated(),16);
  store.update(id,d=>{d.course.simulation={revision:2,decisions:['tight-check']};d.course.simulationArchive=[{reflection:'Старый путь'}];d.course.projectGame=s;d.experiments=[];});
  const clone=store.import(JSON.parse(JSON.stringify(store.export(id))));assert.deepEqual(resumeState(store.profile(clone).data.course.projectGame),s);
  assert.deepEqual(store.profile(clone).data.course.simulation,{revision:2,decisions:['tight-check']});assert.equal(store.profile(clone).data.course.simulationArchive[0].reflection,'Старый путь');
  assert.equal(resumeState({...s,revision:2}),null);assert.equal(resumeState({revision:1}),null);
  assert.equal(resumeState({...s,events:[{definition:'unknown'}]}),null);
});
test('badly allocated expensive resource can exhaust budget before deadline',()=>{
  let s=act(allocated(),{type:'hire'});s=step(s,80);
  assert.equal(s.endReason,'budget');assert.ok(s.time<20);assert.ok(s.spent>=s.budget);
});
test('many seeds and allocations keep time, quality, capacity and costs finite',()=>{
  for(let seed=0;seed<20;seed++){
    let s=seed%2?allocated('seed-'+seed):createState('seed-'+seed);
    if(seed%3===0){for(const t of tasks)s=act(s,{type:'assign',task:t.id,people:['maxim']});}
    s=step(s,80);
    assert.ok(s.time<=20&&s.spent>=0&&Number.isFinite(s.spent));
    assert.ok(s.tasks.every(t=>t.progress>=0&&t.progress<=t.effort+0.00001&&t.quality>=0&&t.quality<=1));
    assert.ok(s.people.every(p=>p.fatigue>=0&&p.fatigue<=1));assert.ok(resumeState(s));
  }
});
