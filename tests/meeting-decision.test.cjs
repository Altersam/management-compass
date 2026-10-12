const {test}=require('node:test'),assert=require('node:assert/strict');
const {generateScenario,validateScenario}=require('../assets/meeting-decision/generator.js');
const {create,act,validate}=require('../assets/meeting-decision/state.js');
const {physicallyViable,knownRisks,availableDay}=require('../assets/meeting-decision/constraints.js');
const {support}=require('../assets/meeting-decision/participants.js');
const {report}=require('../assets/meeting-decision/scoring.js');
const {createStore}=require('../assets/store.js');
function ask(s,id,question){return act(act(s,{type:'select',id}),{type:'ask',question});}
function linkedPlan(s){s=ask(s,'formal','constraint');if(s.scenario.requiresAuthorization)s=act(s,{type:'draft',key:'conditions',value:'basis'});s=ask(s,'resource','concession');s=ask(s,'finance','concession');s=act(s,{type:'link'});for(const id of ['formal','operations'])s=ask(s,id,'commitment');return s;}
function execute(s){s=act(s,{type:'fix'});assert.equal(s.phase,'execution');while(s.phase==='execution')s=act(s,{type:'tick'});return s;}
test('250 seeds produce eight changing participant cases and seven causal conflict archetypes',()=>{
  const cases=new Set(),archetypes=new Set(),orders=new Set();for(let i=0;i<250;i++){
    const b=generateScenario('meeting-'+i);assert.deepEqual(generateScenario('meeting-'+i),b);assert.equal(validateScenario(b).valid,true);cases.add(b.id);archetypes.add(b.archetype);orders.add(b.execution.map(e=>e.participant).join());assert.equal(b.participants.length,5);assert.ok(b.participants.every(p=>p.name&&p.publicPosition&&p.obligation));assert.equal(physicallyViable(b,b.defaultDraft),false);
  }assert.equal(cases.size,8);assert.equal(archetypes.size,7);assert.ok(orders.size>10);
});
test('public agreement can be unanimous while execution fails; absence of commitment is also causal',()=>{
  let s=act(create('trap'),{type:'start'});assert.equal(s.scenario.participants.filter(p=>support(p,s.draft)).length,5);s=execute(s);assert.equal(s.attempts[0].success,false);assert.equal(s.attempts[0].rows.length,1);assert.ok(s.attempts[0].rows[0].reason);assert.equal(report(s).success,false);
  let plausible=act(create('promises'),{type:'start'}),solution=validateScenario(plausible.scenario).solutions[0];for(const key of ['scope','deadline','staffing','budget'])plausible=act(plausible,{type:'draft',key,value:solution[key]});if(solution.conditions.length)plausible=act(plausible,{type:'draft',key:'conditions',value:'basis'});plausible=execute(plausible);assert.equal(plausible.attempts[0].success,false);assert.match(plausible.attempts[0].rows[0].reason,/обязательства/);
});
test('linked concrete concessions confirm two promises; successful execution does not need unanimity or every fact',()=>{
  for(let i=0;i<35;i++){let s=linkedPlan(act(create('linked-'+i),{type:'start'}));assert.equal(s.scenario.participants.filter(p=>support(p,s.draft)).length,4);assert.ok(s.actionsLeft>=0);assert.ok(Object.values(s.participants).some(p=>!p.constraintKnown));s=execute(s);assert.equal(s.attempts[0].success,true);assert.ok(['A','B'].includes(report(s).grade));assert.ok(validate(s));let day=0;for(const row of s.attempts[0].rows){assert.ok(row.day>day);assert.ok(row.day>=availableDay(s.scenario.participants.find(p=>p.id===row.participant),s.draft));day=row.day;}}
});
test('check exposes only known risks and changing the draft invalidates promises without losing facts',()=>{
  let s=act(create('known'),{type:'start'});s=ask(s,'formal','constraint');s=act(s,{type:'check'});assert.equal(s.preview.filter(r=>r.state==='unknown').length,4);assert.ok(s.preview.find(r=>r.id==='formal').state!=='unknown');assert.equal(s.actionsLeft,s.scenario.actions-2);
  s=linkedPlan(act(create('invalidates'),{type:'start'}));const known=structuredClone(s.participants);s=act(s,{type:'draft',key:'deadline',value:s.scenario.deadlines[2]});assert.ok(Object.values(s.participants).every(p=>p.commitment===null));assert.equal(s.preview,null);for(const id of Object.keys(known)){assert.equal(s.participants[id].constraintKnown,known[id].constraintKnown);assert.equal(s.participants[id].concessionKnown,known[id].concessionKnown);}
});
test('limited actions prevent exhausting all questions and repeated clicks cannot create free promises',()=>{
  let s=act(create('time'),{type:'start'});for(let i=0;i<s.scenario.actions;i++)s=ask(s,'owner','constraint');assert.equal(s.actionsLeft,0);assert.equal(s.redundant,s.scenario.actions-1);assert.throws(()=>ask(s,'owner','commitment'),/Ходы/);assert.throws(()=>act(s,{type:'check'}),/Ходы/);assert.equal(act(s,{type:'fix'}).phase,'execution');
});
test('failed attempt reveals its own cause, retry adds four turns and preserves learned facts and first result',()=>{
  let s=execute(act(create('retry'),{type:'start'}));const first=structuredClone(s.attempts[0]),learned=structuredClone(s.participants),left=s.actionsLeft;s=act(s,{type:'retry'});assert.equal(s.actionsLeft,left+4);assert.deepEqual(s.attempts[0],first);for(const id of Object.keys(learned))assert.equal(s.participants[id].constraintKnown,learned[id].constraintKnown);
  s=linkedPlan(s);s=execute(s);assert.equal(s.attempts[1].success,true);assert.equal(report(s).corrected,true);assert.ok(['A','B'].includes(report(s).grade));s=act(s,{type:'finish'});assert.ok(validate(s));assert.throws(()=>act(s,{type:'retry'}));
});
test('save and backup retain pending execution and unknown profile fields while forged promises fail validation',()=>{
  let s=linkedPlan(act(create('save'),{type:'start'}));s=act(s,{type:'fix'});s=act(s,{type:'tick'});s=act(s,{type:'pause'});s.custom='keep';assert.ok(validate(JSON.parse(JSON.stringify(s))));const bad=structuredClone(s);bad.execution.rows[0].ok=false;assert.equal(validate(bad),false);
  const values=new Map(),store=createStore({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),id=store.active();store.update(id,d=>{d.course.arcadeGames={meeting:s,sprint:{keep:true}};d.course.arcadeArchives={meeting:[create('archive')]};});const imported=store.import(JSON.parse(JSON.stringify(store.export(id)))),c=store.profile(imported).data.course;assert.deepEqual(c.arcadeGames.meeting,s);assert.ok(validate(c.arcadeGames.meeting));assert.equal(c.arcadeGames.sprint.keep,true);
});
