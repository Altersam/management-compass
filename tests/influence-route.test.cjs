const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,act,validate}=require('../assets/influence-route/state.js'),{road,endorsers,shortest}=require('../assets/influence-route/navigation.js'),{play}=require('./helpers/influence-route-runs.cjs');
function action(s,type,id){s=act(s,{type,id});while(s.phase==='motion')s=act(s,{type:'tick'});return s;}
function caseSeed(id,bridge){return Array.from({length:100},(_,i)=>'route-case-'+i).find(seed=>{const s=create(seed);return s.scenarioId===id&&(!bridge||s.scenario.bridge===bridge);});}
test('three recognizable architectures vary by seed and have a resource-feasible endorsed route',()=>{
  const cases=new Set(),bridges=new Set(),events=new Set();for(let i=0;i<900;i++){const s=play('route-'+i);cases.add(s.scenarioId);bridges.add(s.scenario.bridge);events.add(s.scenario.event.id);assert.equal(s.result?.kind,'success',s.seed+' '+s.scenarioId);assert.ok(s.turnsLeft>=0);assert.ok(s.politicalCapital>=0);if(i<15)assert.ok(validate(s));}assert.equal(cases.size,3);assert.equal(bridges.size,4);assert.equal(events.size,3);
});
test('access and recommendation are directed separate relations; a marker cannot travel a trust edge',()=>{
  let s=act(create('route-0'),{type:'open'});const e=s.scenario.edges.find(e=>e.type==='trust');assert.equal(road(s,e.to,e.from),undefined);assert.ok(shortest(s,{initial:true}));assert.ok(s.scenario.edges.filter(e=>['trust','expert'].includes(e.type)).every(e=>!['access','formal'].includes(e.type)));
  const before=structuredClone(s);s=act(s,{type:'move',id:s.scenario.decider});assert.equal(s.markerNode,'you');assert.equal(s.ghostAttempts,1);assert.equal(s.turnsLeft,before.turnsLeft-1);assert.equal(before.ghostAttempts,0);
});
test('recon discovers at most two facts and briefing creates a carrier rather than raising attitude',()=>{
  let s=Array.from({length:20},(_,i)=>create('route-'+i)).find(s=>s.scenarioId==='regl');s=act(s,{type:'open'});const id=s.scenario.bridge,before=s.knownEdges.length;s=action(s,'probe',id);assert.ok(s.knownEdges.length-before<=2);const attitude=s.attitudes[id];s=action(s,'brief',id);assert.equal(s.attitudes[id],attitude);assert.equal(s.carriers[id],true);assert.ok(s.knownEdges.length<s.scenario.edges.length);
});
test('three ghost roads fail, single ghosts do not end play and cannot teleport',()=>{
  let s=act(create('ghost-route'),{type:'open'});for(let i=1;i<=3;i++){s=action(s,'move',s.scenario.decider);assert.equal(s.markerNode,'you');assert.equal(s.ghostAttempts,i);assert.equal(s.phase,i<3?'play':'report');}assert.equal(s.result.kind,'ghost');
});
test('formal authority reaches the desk but does not provide trust or endorsement',()=>{
  let s=create('formal-route');s=act(s,{type:'open'});for(const id of s.scenario.orgRoute.slice(1)){if(id==='ceo'){s=action(s,'gate','hr');}s=action(s,'move',id);}assert.equal(s.phase,'decision');assert.equal(endorsers(s).length,0);s=act(s,{type:'resolve'});while(s.phase==='resolving')s=act(s,{type:'tick'});assert.equal(s.result.kind,'formal');assert.equal(s.result.grade,'F');
});
test('movement is incremental, pending travel reloads exactly and replay rejects invented resources',()=>{
  let s=act(create('incremental-route'),{type:'open'});const to=s.scenario.bridge;s=act(s,{type:'move',id:to});assert.equal(s.markerNode,'you');s=act(s,{type:'tick'});assert.equal(s.animation.index,1);assert.ok(validate(s));assert.equal(validate({...s,politicalCapital:99}),false);s=act(s,{type:'pauseAnimation'});assert.throws(()=>act(s,{type:'tick'}));s=act(s,{type:'resume'});while(s.phase==='motion')s=act(s,{type:'tick'});assert.equal(s.markerNode,to);assert.ok(validate(s));
});
test('all three cases admit another sensible route, not a single mandatory shortest path',()=>{
  for(let i=0;i<300;i++){const a=play('alternative-'+i),b=play('alternative-'+i,{alternate:true});assert.equal(b.result?.kind,'success',b.seed);assert.notDeepEqual(a.routeHistory.filter(h=>h.kind==='move').map(h=>h.to),b.routeHistory.filter(h=>h.kind==='move').map(h=>h.to));}
});
test('opponent first neutralizes a real endorser then closes a known road; quiet does not repeat or undo attacks',()=>{
  let s=act(create(caseSeed('regl')),{type:'open'});s=action(s,'probe','expert');s=action(s,'brief','expert');s=action(s,'official');if(s.opponent.alertStage===0)s=action(s,'official');assert.equal(s.carriers.expert,false);assert.deepEqual(s.opponent.neutralized,['expert']);assert.equal(s.knownEdges.includes('expert-dir-expert'),true);if(s.opponent.alertStage===1)s=action(s,'official');if(s.opponent.alertStage===1)s=action(s,'official');assert.equal(s.opponent.alertStage,2);assert.equal(s.closedEdges.length,1);assert.ok(s.knownEdges.includes(s.closedEdges[0]));const closed=s.closedEdges[0],capital=s.politicalCapital,noise=s.noise;s=action(s,'hold');assert.ok(s.noise<noise);assert.equal(s.politicalCapital,Math.min(5,capital+1));assert.ok(s.closedEdges.includes(closed));assert.equal(s.opponent.actionsTaken.length,2);assert.ok(validate(s));
});
test('gatekeeper opens access but never supplies content endorsement, and a closed gate is not a phantom',()=>{
  let s=act(create(caseSeed('appoint','hr')),{type:'open'});s=action(s,'consult','hr');s=action(s,'move','hr');s=action(s,'move','ceo');assert.equal(s.markerNode,'hr');assert.equal(s.ghostAttempts,0);s=action(s,'gate','hr');assert.ok(road(s,'hr','ceo'));assert.equal(endorsers(s).length,0);s=action(s,'brief','hr');assert.equal(s.carriers.hr,false);assert.ok(validate(s));
});
test('closing the owners own pilot still requires the operational carriers consent',()=>{
  let s=act(create(caseSeed('close')),{type:'open'});for(const [type,id] of [['consult','analyst'],['brief','analyst'],['move','analyst'],['probe','analyst'],['move','cfo']])s=action(s,type,id);s=act(s,{type:'resolve'});while(s.phase==='resolving')s=act(s,{type:'tick'});assert.equal(s.result.kind,'orphan');assert.ok(s.decider.accumulatedPush>.6);assert.match(s.decisionSteps.at(-1).text,/без её согласия/);
});
test('overpush depends on total recommendations; a second strong ally can make an appointment fail',()=>{
  let s=act(create(caseSeed('appoint','hr')),{type:'open'});for(const [type,id] of [['consult','hr'],['move','hr'],['consult','mentor'],['brief','mentor'],['move','mentor'],['probe','mentor'],['consult','peer'],['brief','peer'],['move','ceo']])s=action(s,type,id);assert.equal(s.phase,'decision');assert.equal(endorsers(s).length,2);s=act(s,{type:'resolve'});while(s.phase==='resolving')s=act(s,{type:'tick'});assert.ok(s.decider.overpushPenalty>0);assert.equal(s.result.kind,'overpush');assert.equal(s.result.grade,'F');assert.ok(validate(s));
});
test('trade only reveals existing access; official requests and escalation cannot teleport a decision',()=>{
  let s=act(create(caseSeed('regl')),{type:'open'});const before=s.scenario.edges.length;s=action(s,'trade','dir');assert.equal(s.scenario.edges.length,before);assert.equal(s.markerNode,'you');s=action(s,'escalate','dir');assert.equal(s.markerNode,'you');assert.ok(s.noise>=7);assert.equal(s.officialRequests,1);assert.equal(s.scenario.edges.length,before);assert.ok(validate(s));
});
test('one temporary event actually closes a route for one turn; waiting reopens it within the case budget',()=>{
  const seed=Array.from({length:200},(_,i)=>'route-weather-'+i).find(seed=>{const s=create(seed);return s.scenarioId==='close'&&s.scenario.event.id==='travel';}),done=play(seed);let s=create(seed);for(const c of done.commands){if(c.type==='hold')break;s=act(s,c);}assert.equal(s.markerNode,'coo');assert.equal(road(s,'coo','cfo'),undefined);assert.equal(s.eventHistory.length,1);const known=[...s.knownEdges];s=act(s,{type:'hold'});assert.ok(road(s,'coo','cfo'));assert.deepEqual(s.knownEdges,known);assert.equal(done.result.kind,'success');assert.equal(done.turnsLeft,0);assert.equal(done.eventHistory.length,1);
});
test('partial routes, earned outcomes, archives and unknown profile fields survive export without revealing saved fog',()=>{
  const {createStore}=require('../assets/store.js'),{routeMap}=require('../assets/influence-route/map.js'),map=new Map(),store=createStore({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}),id=store.active();let s=act(create(caseSeed('regl')),{type:'open'});s=act(s,{type:'move',id:'expert'});s=act(s,{type:'tick'});s.custom={keep:true};const earned=play(caseSeed('close')),before=structuredClone(earned);routeMap(earned,{mode:'full'});assert.deepEqual(earned,before);store.update(id,d=>{d.course.arcadeGames={influence:s};d.course.arcadeArchives={influence:[earned]};d.custom='profile';});const imported=store.import(JSON.parse(JSON.stringify(store.export(id)))),data=store.profile(imported).data;assert.deepEqual(data.course.arcadeGames.influence,s);assert.deepEqual(data.course.arcadeArchives.influence,[earned]);assert.equal(data.custom,'profile');assert.ok(validate(data.course.arcadeGames.influence));
});
