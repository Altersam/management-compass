const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const E=require('../assets/situations-engine.js'),Sim=require('../assets/simulation-engine.js'),Choices=require('../assets/choices.js');
const X=require('../assets/experiments.js'),N=require('../assets/navigator.js'),M=require('../assets/course-model.js');
const {createStore,blank}=require('../assets/store.js');
const context={};context.window=context;
for(const name of ['content','knowledge','course-data','course-questions','learning-content','question-revision'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,`../assets/${name}.js`),'utf8'),context);
const course=JSON.parse(JSON.stringify(context.COURSE)),pedagogy=JSON.parse(JSON.stringify(context.PEDAGOGY));
function memory(){const map=new Map();return createStore({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)});}
test('day planning reveals displaced work and attention cost, not a magic extra hour',()=>{
  const s=E.initial(1),base=E.evaluate(1,s);assert.ok(base.visual.used>300);
  assert.ok(E.evaluate(1,{...s,interruptions:12}).visual.used>base.visual.used);
  const p={...s,focus:true,notify:true,plan:{external:'today',analysis:'today',meeting:'delegate',team:'later',requests:'delegate'}};
  assert.ok(E.evaluate(1,p).visual.used<=300);assert.equal(E.evaluate(1,{...p,burst:true}).visual.used,E.evaluate(1,p).visual.used+45);
});
test('a check after dependency loses reaction time; checking dispatch does not prove ready input',()=>{
  const s=E.initial(2),early=E.evaluate(2,{...s,point:2,check:'ready'}),late=E.evaluate(2,{...s,point:4,check:'ready'});
  assert.equal(early.visual.timely,true);assert.equal(late.visual.timely,false);assert.ok(early.metrics[2].value>late.metrics[2].value);
  assert.equal(E.evaluate(2,{...s,point:2,check:'sent'}).visual.timely,false);
});
test('autonomy depends on task experience, boundaries and risk, not a person label',()=>{
  const skilled={...E.initial(3),level:3,bounds:true};assert.equal(E.evaluate(3,skilled).visual.unsupported,false);
  assert.equal(E.evaluate(3,{...skilled,newTask:true}).visual.unsupported,true);
  assert.equal(E.evaluate(3,{...skilled,risk:3}).visual.unsupported,true);
});
test('message channel and resource owner produce different consequences',()=>{
  const s=E.initial(5);assert.equal(E.evaluate(5,{...s,ambiguous:true,channel:'email'}).visual.channelFit,false);assert.equal(E.evaluate(5,{...s,ambiguous:true,channel:'call'}).visual.channelFit,true);
  const request={...E.initial(6),variants:true,cost:true,action:'options'};assert.equal(E.evaluate(6,{...request,owner:'coordinator'}).visual.decision,false);assert.equal(E.evaluate(6,{...request,owner:'sponsor'}).visual.decision,true);
});
test('queue reacts to arrivals, rework and capacity while typing alone leaves main waiting',()=>{
  const s=E.initial(8),base=E.evaluate(8,s);
  assert.ok(E.evaluate(8,{...s,incoming:80}).visual.growth>base.visual.growth);
  assert.ok(E.evaluate(8,{...s,people:4}).visual.growth<base.visual.growth);
  assert.ok(E.evaluate(8,{...s,approvals:2}).visual.waiting>base.visual.waiting);
  assert.equal(E.evaluate(8,{...s,improvement:'typing'}).visual.waiting,base.visual.waiting);
});
test('adoption support must address the actual barrier and dashboard scope changes impression',()=>{
  const s={...E.initial(9),group:'access'};assert.equal(E.evaluate(9,{...s,help:'training'}).visual.supported,false);assert.equal(E.evaluate(9,{...s,help:'access'}).visual.supported,true);
  const d=E.initial(10);assert.ok(E.evaluate(10,{...d,scope:'all'}).visual.minutes>E.evaluate(10,d).visual.minutes);
});
test('a changed early decision changes the next situation and recomputed continuation',()=>{
  const a=Sim.replay(['tight-check']),b=Sim.replay(['sort-flow']);assert.notEqual(a.state.leaderHours,b.state.leaderHours);assert.notEqual(Sim.scene(1,a.state).text,Sim.scene(1,b.state).text);
  const path=['tight-check','hand-over','exceptions','deadline-rule','clear-choice','sponsor-options','confirm-meaning','bottleneck','align-example','compare-context'];
  const result=Sim.replay(path);assert.equal(result.trace.length,10);assert.ok(result.state.dataContext);assert.ok(result.state.bottleneck);
  const changed=Sim.replay(['sort-flow',...path.slice(1)]);assert.notEqual(changed.trace[1].before.leaderHours,result.trace[1].before.leaderHours);
  assert.throws(()=>Sim.apply(Sim.initial(),0,'compare-context'));
  assert.equal(Sim.profile(result.trace).length,5);
});
test('shuffle stores a stable presentation and never changes canonical score',()=>{
  const s=memory(),id=s.active(),order=Choices.order(s,id,'question',3);assert.equal(Choices.valid(order,3),true);assert.deepEqual(Choices.order(s,id,'question',3),order);
  const q=course.questions[1][0],position=order.indexOf(q.answer);assert.equal(order[position],q.answer);assert.equal(M.score([q],{[q.id]:order[position]}).score,1);
  const samples=Array.from({length:80},(_,i)=>Choices.order(s,id,'q'+i,3)[0]);assert.ok(new Set(samples).size>1);
});
test('all fifty alternatives stay concise and avoid systematic length clues',()=>{
  const questions=Object.values(course.questions).flat();let correct=0,alternatives=0;
  for(const q of questions){correct+=q.options[q.answer].text.length;alternatives+=q.options.filter((_,i)=>i!==q.answer).reduce((n,o)=>n+o.text.length,0);}
  assert.ok(correct/50<(alternatives/100)*1.3);
  assert.equal(Object.values(pedagogy.topics).flatMap(t=>t.blocks).length,30);
});
test('navigator distinguishes resource conflict from unclear handoff without asking for a model name',()=>{
  assert.equal(N.situations.length,12);assert.ok(N.situations.every(s=>s.questions.length>=2));
  assert.equal(N.choose('other-team',{q0:'busy',q1:'yes'}).technique,'deviation');
  assert.equal(N.choose('other-team',{q0:'input',q1:'no'}).technique,'handoff');
  assert.equal(N.choose('overload',{q0:'system',q1:'work'}).topic,8);
});
test('experiments migrate legacy plans, update one note and preserve review in backups',()=>{
  const s=memory(),id=s.active();const old=s.journal(id,{title:'Старый план',situation:'Отдел',learning:'Мой прежний вывод',action:'Проверить'});
  s.update(id,d=>d.course={modules:{6:{transferEntryId:old.id,transfer:{change:'Проверить передачу',situation:'Между отделами',reviewDate:'2026-11-01'}}}});
  const migrated=X.list(s,id)[0];assert.equal(migrated.journalEntryId,old.id);
  const updated=X.save(s,id,{...migrated,action:'Уточнить передачу'});assert.equal(s.profile(id).data.journal.length,1);
  X.review(s,id,updated.id,'partly','Срок лучше, но остаются неполные данные.');const clone=s.import(JSON.parse(JSON.stringify(s.export(id))));
  assert.equal(X.list(s,clone)[0].outcome,'partly');assert.match(s.profile(clone).data.journal[0].learning,/Мой прежний вывод/);
});
test('new theme completion requires decisions and an experiment, not acknowledgement clicks',()=>{
  const d=blank(),m=M.ensure(d,1);m.pedagogy=2;m.visited=['theory-0','theory-1','theory-2','technique','practice'];assert.equal(M.report(d,1,course.questions[1]).mastered,false);
  m.microAnswers={0:{choice:1},1:{choice:2},2:{choice:0}};m.activities={intro:{done:true},practice:{done:true}};m.experimentId='real-action';assert.equal(M.report(d,1,course.questions[1]).mastered,true);
  m.microAnswers={};m.legacyCompleted=true;assert.equal(M.report(d,1,course.questions[1]).mastered,true);
});
