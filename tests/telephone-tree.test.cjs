const {test}=require('node:test'),assert=require('node:assert/strict');
const {templates}=require('../assets/telephone-tree/templates.js'),{generateScenario}=require('../assets/telephone-tree/generator.js'),{validateScenario}=require('../assets/telephone-tree/validator.js');
const {create,act,validate}=require('../assets/telephone-tree/state.js'),{slotLabels,snapshot}=require('../assets/telephone-tree/semantics.js'),{channels}=require('../assets/telephone-tree/channels.js');
const {transmissionPlan}=require('../assets/telephone-tree/distortion.js'),{recover}=require('../assets/telephone-tree/recovery.js'),{accumulateDamage}=require('../assets/telephone-tree/damage.js'),{executionPlan}=require('../assets/telephone-tree/execution.js'),{score}=require('../assets/telephone-tree/scoring.js');
const {historyView,meaningTree,historyTable}=require('../assets/telephone-tree/tree.js'),{createStore}=require('../assets/store.js');
function animate(s){while(['transfer','execution'].includes(s.phase))s=act(s,{type:'tick'});return s;}
function resolve(s){if(s.phase!=='event')return s;const def=require('../assets/telephone-tree/events.js').eventDefinitions.find(e=>e.id===s.pendingEvent.id),safe=def.options.find(o=>['handoff','verify','wait'].includes(o[0])&&o[3]<=s.resource)||def.options.find(o=>o[3]===0);return act(s,{type:'decision',choice:safe[0]});}
function play(seed,mode='email'){
  let s=act(create(seed),{type:'open'});for(let step=0;step<4;step++){
    s=resolve(s);const damaged=s.scenario.critical.filter(id=>['lost','replaced','blurry'].includes(s.packet[id].state)).sort((a,b)=>(a==='constraint'?-1:b==='constraint'?1:0));if(damaged.length&&s.clarifications)s=act(s,{type:'recover',id:damaged[0]});
    const preferred=mode==='mixed'?['sync','tracker','email','talk'][step]:mode,id=s.resource>=channels[preferred].cost&&!s.eventEffect?.disabled.includes(preferred)?preferred:'tracker';s=act(s,{type:'channel',id});s=animate(act(s,{type:'send'}));
  }
  while(s.clarifications){const id=s.scenario.critical.find(id=>['lost','replaced','blurry'].includes(s.packet[id].state));if(!id)break;s=act(s,{type:'recover',id});}return animate(act(s,{type:'execute'}));
}
test('24 templates and 72 variants generate coherent seven-slot tasks, roles, channels and rare phantom events',()=>{
  assert.equal(templates.length,24);assert.ok(templates.every(t=>t.variations.length===3&&t.critical.length>=2));const variants=new Set(),types=new Set();let phantom=0;
  for(let i=0;i<1800;i++){const s=generateScenario('semantic-'+i);assert.deepEqual(validateScenario(s),{valid:true,errors:[]});variants.add(s.templateId+':'+s.variationId);types.add(s.archetype);assert.equal(Object.keys(s.original).length,7);assert.equal(s.roles.length,5);if(s.events.some(e=>e.id==='chat'))phantom++;if(i<50)assert.deepEqual(generateScenario('semantic-'+i),s);}
  assert.equal(variants.size,72);assert.equal(types.size,12);assert.ok(phantom/1800>.1&&phantom/1800<.2);
});
test('channels protect different branches and deterministic role filters do not mutate the input packet',()=>{
  let s=act(create('filters'),{type:'open'}),copy=structuredClone(s);assert.deepEqual(transmissionPlan(s),transmissionPlan(s));assert.deepEqual(s,copy);assert.ok(channels.tracker.noise.owner<channels.email.noise.owner);assert.ok(channels.email.noise.constraint<channels.sync.noise.constraint);assert.ok(channels.talk.noise.context<channels.tracker.noise.context);
  const fingerprints=new Set();for(const id of Object.keys(channels)){s.channel=id;fingerprints.add(JSON.stringify(transmissionPlan(s).map(f=>f.after.state)));}assert.ok(fingerprints.size>1);
});
test('incremental transmission keeps tree and table aligned and does not reveal all branch changes at once',()=>{
  let s=act(act(create('animation'),{type:'open'}),{type:'send'});assert.equal(s.animation.index,0);assert.ok(Object.values(historyView(s).at(-1).cells).every(c=>c.state==='pending'));s=act(s,{type:'tick'});assert.equal(s.animation.index,1);assert.equal(historyView(s).at(-1).cells.goal.state,s.packet.goal.state);assert.equal(historyView(s).at(-1).cells.deadline.state,'pending');assert.match(meaningTree(s),/Ещё передаётся/);assert.match(historyTable(s),/Ещё передаётся/);assert.ok(validate(s));
});
test('restoration preserves the received history and early truth carries less debt than late truth',()=>{
  function brokenAt(recoveryStep){const s=create('recovery');s.phase='planning';s.packet.criteria.state='lost';s.packet.criteria.current='Условие не передано.';for(let step=1;step<=4;step++){s.step=step;accumulateDamage(s);s.history.push(snapshot(s,s.scenario.roles[step].name));if(step===recoveryStep)recover(s,'criteria');}s.execution=executionPlan(s);return s;}
  const early=brokenAt(1),late=brokenAt(4);assert.ok(late.damageDebt.criteria>early.damageDebt.criteria);assert.ok(score(early).quality>score(late).quality);assert.equal(late.history[4].cells.criteria.state,'restored');assert.equal(late.history[4].received.criteria.state,'lost');assert.equal(late.recoveries[0].step,4);assert.ok(executionPlan(late).at(-1).late.includes('criteria'));
});
test('organisational events are reproducible, cost resources and alter availability, risk or phantom scope',()=>{
  let found;
  for(let i=0;i<100;i++){const s=create('event-'+i);if(s.scenario.events.some(e=>e.id==='cancel')){found=s;break;}}
  assert.ok(found);const event=found.scenario.events.find(e=>e.id==='cancel');found.phase='event';found.pendingEvent=event;found.step=event.step;found=act(found,{type:'decision',choice:'email'});assert.ok(found.eventEffect.disabled.includes('sync'));assert.throws(()=>act(found,{type:'channel',id:'sync'}));
  let phantom;for(let i=0;i<100;i++){const s=create('phantom-'+i);if(s.scenario.events.some(e=>e.id==='chat')){phantom=s;break;}}
  const chat=phantom.scenario.events.find(e=>e.id==='chat');phantom.phase='event';phantom.pendingEvent=chat;phantom.step=chat.step;phantom=act(phantom,{type:'decision',choice:'accept'});assert.ok(transmissionPlan(phantom).some(f=>f.slot==='phantom'));phantom=animate(act(phantom,{type:'send'}));assert.equal(phantom.packet.phantom.state,'phantom');phantom.phase='planning';const left=phantom.clarifications;recover(phantom,'phantom');assert.equal(phantom.packet.phantom.state,'rejected');assert.equal(phantom.clarifications,left-1);
});
test('execution and scoring distinguish missing limits, interpreted scope and semantic rather than literal equality',()=>{
  const s=create('literal'),same=structuredClone(s);same.packet.goal.current='Равносильная формулировка другими словами.';assert.equal(score(s).quality,score(same).quality);const broken=structuredClone(s);broken.packet.constraint.state='lost';broken.execution=executionPlan(broken);assert.equal(broken.execution.at(-1).violation,true);assert.ok(score(broken).quality<score(s).quality);const scope=structuredClone(s);scope.packet.goal.state='replaced';scope.packet.goal.current=scope.scenario.replacements.goal;assert.match(executionPlan(scope).at(-1).text,/иной тип работы/);
});
test('distinct resource-aware strategies can earn high grades; recovery is finite and final replay remains deterministic',()=>{
  let goodEmail=0,goodMixed=0;
  for(let i=0;i<40;i++){for(const mode of ['email','mixed']){const s=play('strategy-'+i,mode);assert.equal(s.step,4);assert.equal(s.execution.length,3);assert.ok(s.resource>=0);assert.ok(s.clarifications>=0);assert.ok(validate(s));if(['A','B'].includes(s.result.grade)){if(mode==='email')goodEmail++;else goodMixed++;}assert.deepEqual(play('strategy-'+i,mode),s);}}
  assert.ok(goodEmail>=20);assert.ok(goodMixed>=20);
});
test('backup retains partial meaning, events and restoration ledger while fabricated fields are rejected',()=>{
  let s=act(act(create('backup-tree'),{type:'open'}),{type:'send'});s=act(s,{type:'tick'});s=act(s,{type:'pause'});s.custom='keep';assert.ok(validate(JSON.parse(JSON.stringify(s))));const bad=structuredClone(s);bad.resource=999;assert.equal(validate(bad),false);assert.deepEqual(create(s.seed).scenario,s.scenario);
  const values=new Map(),store=createStore({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),id=store.active();store.update(id,d=>{d.course.arcadeGames={telephone:s,change:{keep:true}};d.course.arcadeArchives={telephone:[create('archive')]};});const copy=store.import(JSON.parse(JSON.stringify(store.export(id)))),c=store.profile(copy).data.course;assert.deepEqual(c.arcadeGames.telephone,s);assert.ok(validate(c.arcadeGames.telephone));assert.ok(c.arcadeGames.change.keep);
});
