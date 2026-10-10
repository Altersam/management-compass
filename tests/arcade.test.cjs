const {test}=require('node:test'),assert=require('node:assert/strict');
const Hybrid=require('../assets/arcade/hybrid.js'),Meeting=require('../assets/arcade/meeting.js'),Ethics=require('../assets/arcade/ethics.js'),Change=require('../assets/arcade/change.js'),Phone=require('../assets/arcade/telephone.js'),Versions=require('../assets/arcade/versions.js'),Metrics=require('../assets/arcade/metrics.js'),Flow=require('../assets/arcade/flow.js'),Sprint=require('../assets/arcade/sprint.js'),Influence=require('../assets/arcade/influence.js');
const {catalog}=require('../assets/arcade/catalog.js'),{createStore}=require('../assets/store.js');
const modules={hybrid:Hybrid,meeting:Meeting,ethics:Ethics,change:Change,telephone:Phone,versions:Versions,metrics:Metrics,flow:Flow,sprint:Sprint,influence:Influence};
test('ten independent initial states validate and import without touching other games',()=>{
  const map=new Map(),store=createStore({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}),id=store.active();store.update(id,d=>{d.course.projectGame={revision:1,time:10};d.course.detectiveGame={revision:1,spent:3};d.course.arcadeGames={};for(const meta of catalog){const game=modules[meta.id],s=game.create(meta.id+'-1');assert.ok(game.validate(s),meta.id);d.course.arcadeGames[meta.id]=s;}});
  const clone=store.import(JSON.parse(JSON.stringify(store.export(id))));assert.deepEqual(store.profile(clone).data,store.profile(id).data);assert.equal(store.profile(clone).data.course.projectGame.time,10);
});
test('Hybrid Lab ties approach to uncertainty and mandatory gate rather than a winning label',()=>{
  const linear=['plan','build','test','gate','release'],iterative=['research','prototype','build','review','test','pilot','release'];
  assert.ok(Hybrid.evaluate(iterative,'discovery').rework<Hybrid.evaluate(linear,'discovery').rework);
  assert.equal(Hybrid.evaluate(iterative,'report').viable,false);assert.equal(Hybrid.evaluate(linear,'report').viable,true);
  assert.ok(Hybrid.evaluate([...iterative.slice(0,-1),'gate','release'],'integration').viable);
  let s=Hybrid.create();const before=structuredClone(s);s=Hybrid.act(s,{type:'move',index:1,delta:1});assert.deepEqual(before,Hybrid.create());assert.notDeepEqual(s.route,before.route);s=Hybrid.act(s,{type:'run'});s=Hybrid.act(s,{type:'run'});assert.equal(s.phase,'ended');
});
test('meeting must connect facts, budget, authority and an executable scope',()=>{
  let s=Meeting.create();for(const [person,question] of [['it','constraint'],['finance','constraint'],['ops','fact'],['legal','constraint'],['owner','authority']]){s=Meeting.act(s,{type:'person',value:person});s=Meeting.act(s,{type:'ask',value:question});}
  const minutes=s.minutes;s=Meeting.act(s,{type:'ask',value:'authority'});assert.equal(s.minutes,minutes);
  assert.equal(Meeting.evaluate(s).viable,false);s=Meeting.act(s,{type:'owner',value:'owner'});assert.equal(Meeting.evaluate(s).viable,true);
  const urgent={...s,urgent:true,plan:'full'};assert.equal(Meeting.evaluate(urgent).viable,false);s=Meeting.act(s,{type:'commit'});assert.equal(s.phase,'ended');
});
test('ethical fact acquisition is limited and objective procedure is distinct from equal queue',()=>{
  let s=Ethics.create();for(const id of ['rule','deadline','connection','privacy'])s=Ethics.act(s,{type:'inspect',value:id});assert.equal(s.budget,0);assert.throws(()=>Ethics.act(s,{type:'inspect',value:'impact'}));
  s=Ethics.act(s,{type:'allocation',value:s.variant?'a':'b'});s=Ethics.act(s,{type:'criterion',value:'deadline'});s=Ethics.act(s,{type:'influence',value:'independent'});s=Ethics.act(s,{type:'disclosure',value:'criterion'});s=Ethics.act(s,{type:'note',value:'Общий критерий и независимая проверка защищают выбор.'});
  const r=Ethics.evaluate(s);assert.ok(r.fair&&r.protectedChoice&&r.privacy&&r.supported);s=Ethics.act(s,{type:'decide'});assert.equal(s.phase,'ended');
});
test('change intervention is delayed and must target the actual barrier',()=>{
  let good=Change.create(),bad=Change.create();good=Change.act(good,{type:'measure',value:'example'});bad=Change.act(bad,{type:'measure',value:'practice'});
  assert.equal(good.groups[0].adoption,20);good=Change.act(good,{type:'round'});bad=Change.act(bad,{type:'round'});assert.ok(good.groups[0].adoption>bad.groups[0].adoption);
  let ban=Change.act(Change.create(),{type:'measure',value:'ban'});assert.equal(ban.groups[0].hidden,25);assert.equal(ban.groups[0].adoption,20);ban=Change.act(Change.act(ban,{type:'round'}),{type:'round'});assert.ok(ban.groups[0].adoption<20);
});
test('telephone loses meaning on an early shortcut and later confirmation cannot recreate it',()=>{
  let lost=Phone.act(Phone.create(),{type:'send'});assert.equal(lost.message.quality,false);lost=Phone.act(lost,{type:'channel',value:'meeting'});lost=Phone.act(lost,{type:'confirm',value:true});lost=Phone.act(lost,{type:'send'});assert.equal(lost.message.quality,false);
  let safe=Phone.create();for(const channel of ['email','meeting','email','document','meeting']){safe=Phone.act(safe,{type:'channel',value:channel});safe=Phone.act(safe,{type:'send'});}assert.equal(safe.phase,'ended');assert.ok(Object.values(safe.message).every(Boolean));assert.ok(safe.formal);assert.ok(safe.budget>=0);
});
test('version investigation separates signature, effective date, delivery and understanding',()=>{
  for(const seed of ['a','b']){let s=Versions.create(seed);for(const id of ['signatures','dates','copy','receipt'])s=Versions.act(s,{type:'inspect',value:id});s=Versions.act(s,{type:'file',value:'v3'});s=Versions.act(s,{type:'breakpoint',value:s.variant?'understanding':'delivery'});s=Versions.act(s,{type:'remedy',value:s.variant?'clarify':'deliver'});s=Versions.act(s,{type:'note',value:'Рабочий ответ должен соответствовать действующему v3.'});assert.ok(Versions.evaluate(s).version&&Versions.evaluate(s).breakpoint&&Versions.evaluate(s).remedy);assert.equal(Versions.act(s,{type:'resolve'}).phase,'ended');}
});
test('dashboard calculations keep denominators and unfinished lower bound explicit',()=>{
  const narrow=Metrics.calculate(Metrics.create()),all=Metrics.calculate({...Metrics.create(),channel:'all',pending:true});assert.equal(narrow.closedCount,60);assert.equal(all.closedCount,80);assert.equal(all.count,100);assert.equal(all.unfinished,20);assert.ok(all.mean>narrow.mean);assert.ok(all.lower>all.mean);assert.equal(all.lower,53);
});
test('queue keeps every arrival and exposes throughput/quality trade-off',()=>{
  let normal=Flow.create('seed'),upgrade=Flow.act(Flow.create('seed'),{type:'upgrade'}),wrong=Flow.act(Flow.act(Flow.create('seed'),{type:'station',value:'process'}),{type:'upgrade'}),noCheck=Flow.act(Flow.create('seed'),{type:'check',value:false});
  for(let i=0;i<20;i++){if(normal.phase==='playing')normal=Flow.act(normal,{type:'tick'});if(upgrade.phase==='playing')upgrade=Flow.act(upgrade,{type:'tick'});if(wrong.phase==='playing')wrong=Flow.act(wrong,{type:'tick'});if(noCheck.phase==='playing')noCheck=Flow.act(noCheck,{type:'tick'});}
  for(const s of [normal,upgrade,wrong,noCheck])assert.equal(s.nextId-1,s.done.length+s.outside.length+Flow.inside(s));
  assert.ok(upgrade.done.length>normal.done.length);assert.ok(upgrade.done.length>wrong.done.length);assert.ok(noCheck.errors>normal.errors);assert.deepEqual(normal,Array.from({length:20}).reduce(s=>Flow.act(s,{type:'tick'}),Flow.create('seed')));
});
test('sprint respects dependency and work capacity while points and goal contribution differ',()=>{
  let blocked=Sprint.act(Sprint.create(),{type:'select',value:'task-7'});blocked=Sprint.act(blocked,{type:'sprint'});assert.equal(blocked.done.length,0);assert.deepEqual(blocked.carry,['task-7']);
  let s=Sprint.create('s');for(const id of ['task-1','task-2','task-3','task-4'])s=Sprint.act(s,{type:'select',value:id});s=Sprint.act(s,{type:'sprint'});assert.ok(s.points<=18);assert.ok(s.goalValue<s.totalValue);assert.equal(s.review.length,1);
});
test('influence distinguishes observed edges from guessed coalition labels',()=>{
  let s=Influence.create();s.coalition=['lead','it','anna','ops'];assert.equal(Influence.evaluate(s).viable,false);
  for(const id of ['resource','information','authority','application']){s=Influence.act(s,{type:'observe',value:id});const o=Influence.observations.find(o=>o.id===id);for(const field of ['from','to','kind'])s=Influence.act(s,{type:field,value:o[field]});s=Influence.act(s,{type:'edge'});}
  assert.ok(Influence.evaluate(s).viable);assert.equal(Influence.evaluate(s).correct,4);s=Influence.act(s,{type:'implement'});assert.equal(s.phase,'ended');
});
