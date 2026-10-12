const {test}=require('node:test'),assert=require('node:assert/strict');
const {createState,resumeState}=require('../assets/game/state.js');
const {advanceScenarioEvents,applyScenarioChoice}=require('../assets/game/scenario-events.js');
const {advance,forecast}=require('../assets/game/engine.js');

test('new cases and resumed randomised profiles are deterministic without changing legacy saves',()=>{
  const first=createState('compass-case',{scenarioVersion:3});
  assert.deepEqual(createState('compass-case',{scenarioVersion:3}),first);
  assert.deepEqual(resumeState(JSON.parse(JSON.stringify(first))),first);
  assert.notDeepEqual(createState('another-case',{scenarioVersion:3}).people,first.people);
  const legacy=createState('compass-case');assert.equal(legacy.scenarioEvents,undefined);assert.deepEqual(resumeState(legacy),legacy);
  const broken=structuredClone(first);broken.scenarioEvents.nextAt=NaN;assert.equal(resumeState(broken),null);
});
test('random events respect family context, avoid immediate repetition and have variable gaps',()=>{
  const gaps=new Set(),seen=new Set();
  for(let seed=0;seed<30;seed++){
    const s=createState('case-'+seed,{scenarioVersion:3});s.people.forEach(p=>{p.life={children:0,care:false,remote:true};});
    for(let i=0;i<3;i++){
      s.time=s.scenarioEvents.nextAt;advanceScenarioEvents(s);const event=s.events.at(-1);
      assert.ok(event?.scenario);assert.ok(!['childCare','familyCare','transport','plannedLeave'].includes(event.definition));
      assert.ok(!s.scenarioEvents.seen.slice(0,-1).includes(event.definition));
      gaps.add(s.scenarioEvents.nextAt-s.time);seen.add(event.definition);applyScenarioChoice(s,{event:event.id,choice:'reserve'});
    }
  }
  assert.ok(gaps.size>10);assert.ok(seen.size>5);
});
test('an unresolved disruption costs availability; trade-offs have different causal consequences',()=>{
  const s=createState('choice',{scenarioVersion:3});s.time=4;s.people[0].life={children:1,care:true,remote:false};s.scenarioEvents.nextAt=0;
  // Narrow the eligible pool so this checks disruption consequences, not a lucky draw.
  s.scenarioEvents.seen=['helpWindow'];advanceScenarioEvents(s);
  const event=s.events.at(-1),person=s.people.find(p=>p.id===event.person);assert.ok(person.absentUntil>s.time);
  const wait=structuredClone(s),reserve=structuredClone(s),flex=structuredClone(s),cost=s.spent,effort=s.tasks.find(t=>t.id===event.task).effort;
  applyScenarioChoice(wait,{event:event.id,choice:'wait'});assert.equal(wait.spent,cost);assert.equal(wait.people[0].absentUntil,person.absentUntil);
  applyScenarioChoice(reserve,{event:event.id,choice:'reserve'});assert.ok(reserve.spent>cost);assert.equal(reserve.people[0].absentUntil,event.priorAbsentUntil);
  applyScenarioChoice(flex,{event:event.id,choice:'flex'});assert.ok(flex.people[0].fatigue>0);assert.ok(flex.tasks.find(t=>t.id===event.task).effort>effort);
  assert.throws(()=>applyScenarioChoice(reserve,{event:event.id,choice:'wait'}));
});
test('known leave affects the forecast and cannot be avoided by ignoring its event',()=>{
  let s=createState('calendar',{scenarioVersion:3});s.people.forEach(p=>{delete p.life.leave;});s.people[0].life.leave={start:.25,days:2,started:false};s.scenarioEvents.nextAt=99;
  const before=structuredClone(s);forecast(s);assert.deepEqual(s,before);
  s=advance(s);const e=s.events.find(e=>e.definition==='plannedLeave');assert.ok(e);assert.equal(s.people[0].absentUntil,2.25);
  s=advance(s);assert.equal(s.events.filter(e=>e.definition==='plannedLeave').length,1);assert.ok(s.people[0].absentUntil>s.time);
});
