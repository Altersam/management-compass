const {test}=require('node:test'),assert=require('node:assert/strict');
const {createState,resumeState}=require('../assets/game/state.js');
const {tasks,complete}=require('../assets/game/project.js');
const {advance,act,alternative,alternativeFromEvent,stopReason}=require('../assets/game/engine.js');
const {causeReview,causeJournal,decisionEffects,influentialDecisions,alternateCommand}=require('../assets/game/review.js');
function planned(){let s=createState('service-20',{balanceVersion:1});for(const task of tasks)s=act(s,{type:'assign',task:task.id,people:task.assigned});return s;}
function end(s){for(let i=0;i<80&&s.phase!=='ended';i++)s=advance(s);return s;}
test('observed rework records start, completion, later detection and actual cost',()=>{
  const s=end(planned()),event=s.events.find(e=>e.id==='requirements-return'),review=causeReview(s,event);
  assert.equal(review.chain.length,3);assert.ok(review.chain[0].at<review.chain[1].at&&review.chain[1].at<review.chain[2].at);
  assert.equal(event.impact.work,1.25);assert.equal(event.impact.cost,22500);assert.equal(event.origin.checkpoint,'none');
  assert.match(review.chain[1].text,/без отдельной ранней/);assert.match(review.chain[2].text,/22/);
});
test('missing early checkpoint can be compared from task start after the run, never modifies the original',()=>{
  const s=end(planned()),before=JSON.stringify(s),result=alternativeFromEvent(s,'requirements-return');
  assert.ok(result.state.stats.rework<s.stats.rework);assert.equal(JSON.stringify(s),before);
  assert.ok(result.state.decisions.some(d=>d.type==='checkpoint'&&d.task==='prototype'&&d.value==='early'));
  assert.throws(()=>alternativeFromEvent(planned(),'requirements-return'),/завершения/);
  assert.deepEqual(resumeState(JSON.parse(JSON.stringify(s))).reviewPoints,s.reviewPoints);
  assert.ok(JSON.stringify(s).length<5*1024*1024);
});
test('old event is explained without inventing a missing start snapshot',()=>{
  const s=end(planned()),event=s.events.find(e=>e.definition==='rework');delete event.origin;delete s.reviewPoints;
  const review=causeReview(s,event);assert.equal(review.chain.length,2);assert.ok(review.next.length>20);
  assert.throws(()=>alternativeFromEvent(s,event.id),/нет снимка/);
});
test('cause journal includes actions and later outcomes, decision deltas use snapshots',()=>{
  let s=act(planned(),{type:'coordinateIT'});s=end(s);
  const index=s.decisions.findIndex(d=>d.type==='coordinateIT'),effects=decisionEffects(s,s.decisions[index],index);
  assert.equal(effects.cost,15000);assert.ok(causeJournal(s).some(item=>item.kind==='decision'));assert.ok(causeJournal(s).some(item=>item.kind==='consequence'));
  assert.equal(influentialDecisions(s).length,3);
});
test('comparison can omit a resource action rather than replacing it with a pretend task toggle',()=>{
  let s=act(planned(),{type:'clarify'});s=end(s);const index=s.decisions.findIndex(d=>d.type==='clarify');
  assert.equal(alternateCommand(s.decisions[index]),null);const result=alternative(s,index,null);assert.ok(result.state.stats.rework>s.stats.rework);
});
test('skip notices new blocking of a task even without a new event',()=>{
  const before=planned();const after=structuredClone(before);after.tasks[0].awaitingDecision=true;after.events=[];
  assert.equal(stopReason(before,after),'Требуется решение');
  const afterOther=structuredClone(before);const requirements=afterOther.tasks[0],prototype=afterOther.tasks[1];requirements.progress=requirements.effort;prototype.progress=1;
  const afterReturn=structuredClone(afterOther);afterReturn.tasks[0].effort+=1;
  assert.equal(stopReason(afterOther,afterReturn),'Задача ждёт условия');
});
