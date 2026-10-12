const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,act,validate}=require('../assets/sprint-goal/state.js');
const {generateScenario}=require('../assets/sprint-goal/generator.js');
const {estimatedCapacity,tailLoad,remaining}=require('../assets/sprint-goal/capacity.js');
const {achieved}=require('../assets/sprint-goal/goals.js');
const {score}=require('../assets/sprint-goal/review.js');
const {createStore}=require('../assets/store.js');
function plan(s,ids,wip=2){s=act(s,{type:'wip',value:wip});for(const id of ids)if(!s.done.includes(id)&&!s.selected.includes(id))s=act(s,{type:'add',id});return s;}
function finish(s){let count=0;while(['running','event'].includes(s.phase)){assert.ok(count++<20);s=act(s,s.phase==='event'?{type:'decision',choice:({capacity:'replan',urgent:'fix',tempt:'decline'})[s.scenario.events.find(e=>e.id===s.run.pending).kind]}:{type:'tick'});}return s;}
test('seed generates eight domains, varying thresholds, backlog, event days and bounded actual capacity',()=>{
  const domains=new Set(),counts=new Set(),sizes=new Set();
  for(let i=0;i<150;i++){const b=generateScenario('seed-'+i);assert.deepEqual(generateScenario('seed-'+i),b);domains.add(b.domain);sizes.add(b.tasks.map(t=>t.size).join());for(let sprint=1;sprint<=2;sprint++){const ev=b.events.filter(e=>e.sprint===sprint);counts.add(ev.length);assert.equal(new Set(ev.map(e=>e.day)).size,ev.length);}assert.ok(b.actualFactors.every(v=>v>=.9&&v<=1.1));assert.equal(b.criteria.length,3);assert.equal(b.tasks.filter(t=>t.kind==='investment').length,2);assert.equal(b.tasks.filter(t=>t.visible).length,2);assert.ok(b.tasks.some(t=>t.window));assert.ok(b.tasks.some(t=>t.requires));}
  assert.equal(domains.size,8);assert.equal(counts.size,2);assert.ok(sizes.size>10);
});
test('unfinished work has zero effect and becomes unavoidable physical debt, including work not started',()=>{
  let partial=act(plan(create('partial-only'),['task-1']),{type:'run'});partial=act(partial,{type:'tick'});assert.ok(partial.progress['task-1']>0);assert.ok(partial.progress['task-1']<partial.tasks.find(t=>t.id==='task-1').size);assert.deepEqual(partial.values,partial.scenario.criteria.map(c=>c.initial));
  let s=plan(create('tail'),['task-2','task-4','task-1','task-5','task-6','task-7'],4);s=finish(act(s,{type:'run'}));const review=s.reviews[0];assert.ok(s.tail.length>0);
  const effectIds=s.effectiveDone;for(const id of s.tail)assert.ok(!effectIds.includes(id));
  const before=[...s.values],progress=structuredClone(s.progress);s=act(s,{type:'next'});assert.deepEqual(s.values,before);assert.deepEqual(s.progress,progress);assert.deepEqual(s.selected,s.tail);assert.equal(tailLoad(s),review.tailUnits);assert.throws(()=>act(s,{type:'remove',id:s.tail[0]}),/Хвост/);
  const id=s.tail[0],cap=estimatedCapacity(s);s=act(s,{type:'cancel',id});assert.equal(estimatedCapacity(s),cap-1);assert.ok(s.cancelled.includes(id));assert.ok(!s.selected.includes(id));assert.ok(validate(s));
});
test('a high WIP changes daily capacity and produces more tail with the same ordered commitments',()=>{
  const run=wip=>finish(act(plan(create('wip'),['task-1','task-4','task-2','task-5','task-6','task-7'],wip),{type:'run'}));
  const focus=run(2),overloaded=run(4);assert.ok(overloaded.reviews[0].capacity<focus.reviews[0].capacity);assert.ok(overloaded.reviews[0].tailUnits>focus.reviews[0].tailUnits);assert.ok(overloaded.reviews[0].completed.length<focus.reviews[0].completed.length);
});
test('dependency is checked at actual completion, not by a future same-sprint list',()=>{
  let s=plan(create('dependency'),['task-2','task-1'],1);s=finish(act(s,{type:'run'}));assert.ok(s.done.includes('task-2'));assert.ok(!s.effectiveDone.includes('task-2'));assert.ok(s.reviews[0].dependencyMisses.includes('task-2'));
  const ordered=finish(act(plan(create('dependency'),['task-1','task-2'],1),{type:'run'}));assert.ok(ordered.effectiveDone.includes('task-2'));assert.ok(ordered.values.some((v,i)=>v!==s.values[i]));
});
test('two connected sprints preserve goals, completed work and investments; slower second sprint can succeed',()=>{
  for(let i=0;i<60;i++){
    let s=plan(create('sprint-'+i),['task-1','task-4','task-2','task-5','task-7']);s=finish(act(s,{type:'run'}));const first=structuredClone(s.reviews[0]),done=[...s.done],values=[...s.values];assert.ok(first.reached<3);
    s=act(s,{type:'next'});assert.deepEqual(s.values,values);assert.deepEqual(s.done,done);assert.ok(estimatedCapacity(s)>=s.scenario.capacity-1);s=plan(s,['task-3','task-5','task-6']);s=finish(act(s,{type:'run'}));assert.deepEqual(s.reviews[0],first);assert.equal(s.reviews[1].reached,3);s=act(s,{type:'finish'});assert.ok(validate(s));assert.ok(['A','B'].includes(score(s).grade));assert.equal(score(s).slowerBetter,true);
  }
});
test('temptation adds work without goal effects and real disruption changes observed capacity',()=>{
  let s=act(plan(create('events'),['task-1','task-4','task-2']),{type:'run'});while(s.phase!=='event')s=act(s,{type:'tick'});const ev=s.scenario.events.find(e=>e.id===s.run.pending),cap=s.run.capacity;
  s=act(s,{type:'decision',choice:ev.kind==='capacity'?'accept':'fix'});assert.ok(s.run.capacity<cap);assert.ok(s.run.rows.at(-1).capacity===s.run.capacity);
  s=finish(s);s=act(s,{type:'next'});s=plan(s,['task-3','task-5']);s=act(s,{type:'run'});while(s.phase!=='event'||s.scenario.events.find(e=>e.id===s.run.pending).kind!=='tempt'){if(s.phase==='event')s=act(s,{type:'decision',choice:s.scenario.events.find(e=>e.id===s.run.pending).kind==='capacity'?'replan':'fix'});else s=act(s,{type:'tick'});}
  const before=[...s.values];s=act(s,{type:'decision',choice:'take'});const added=s.tasks.at(-1);assert.deepEqual(added.effects,[0,0,0]);assert.ok(s.selected.includes(added.id));assert.deepEqual(s.values,before);assert.ok(validate(s));
});
test('one sprint cannot attain all three thresholds even with every eligible task completed',()=>{
  for(let i=0;i<80;i++){const b=generateScenario('first-'+i),firstSum=b.tasks.filter(t=>t.availableSprint===1).reduce((n,t)=>n+t.effects[0],0);assert.ok(firstSum<1);}
});
test('save replay rejects fabricated goal, progress and review but retains profile unknown fields',()=>{
  let s=act(plan(create('save'),['task-1','task-4']),{type:'run'});s=act(s,{type:'tick'});s.custom='keep';assert.ok(validate(JSON.parse(JSON.stringify(s))));
  const broken=structuredClone(s);broken.values[0]=100;assert.equal(validate(broken),false);const bad=structuredClone(s);bad.progress['task-1']=999;assert.equal(validate(bad),false);
  const values=new Map(),store=createStore({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),id=store.active();store.update(id,d=>{d.course.arcadeGames={sprint:s,hybrid:{keep:true}};d.course.arcadeArchives={sprint:[create('archive')]};});const imported=store.import(JSON.parse(JSON.stringify(store.export(id)))),c=store.profile(imported).data.course;assert.deepEqual(c.arcadeGames.sprint,s);assert.ok(validate(c.arcadeGames.sprint));assert.ok(c.arcadeGames.hybrid.keep);
});
