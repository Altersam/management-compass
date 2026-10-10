const {test}=require('node:test'),assert=require('node:assert/strict');
const {stages,sources,scenarios}=require('../assets/detective/data.js');
const {createCasebook,trace,metrics,pilotCases,compare,hoursPerDay}=require('../assets/detective/model.js');
const {evidence}=require('../assets/detective/evidence.js');
const {createState,act,resumeState,finalReport,budget}=require('../assets/detective/engine.js');
const {createStore}=require('../assets/store.js');
function prepared(seed='case-01',stage='register'){
  let s=createState(seed);for(const key of ['case:case-2','returns']){s=act(s,{type:'inspect',key});s=act(s,{type:'pin',key,value:true});}
  return act(s,{type:'hypothesis',stage,note:'Сопоставляю место долгого ожидания с причиной повторной работы.'});
}
test('seed fixes casebook and the three authored cases locate different causes',()=>{
  assert.deepEqual(createCasebook('same'),createCasebook('same'));
  assert.notDeepEqual(createCasebook('same'),createCasebook('another'));
  assert.deepEqual(['case-01','case-02','case-03'].map(seed=>createCasebook(seed).scenario.stage),['register','decision','execute']);
});
test('case timestamps sum all work, waiting and rework and keep the same five cases',()=>{
  for(const seed of ['case-01','case-02','case-03']){
    const book=createCasebook(seed);assert.equal(book.cases.length,5);
    for(const item of book.cases){const flow=trace(item);assert.equal(flow.length,7);assert.equal(flow[0].start,0);for(let i=0;i<flow.length;i++){if(i)assert.equal(flow[i].start,flow[i-1].end);assert.ok(Math.abs(flow[i].end-flow[i].start-flow[i].work-flow[i].wait-flow[i].rework)<0.03);}}
    const m=metrics(book.cases);assert.equal(m.total,5);assert.equal(m.included,2);assert.ok(Math.abs(m.days*hoursPerDay-(m.work+m.wait+m.rework))<0.1);assert.ok(m.days>m.reportedDays*2);
  }
});
test('new inspection is charged once, repeated reading is free and budget cannot become negative',()=>{
  let s=createState(),first=act(s,{type:'inspect',key:'case:case-2'});assert.equal(s.spent,0);assert.equal(first.spent,1);
  s=act(first,{type:'inspect',key:'case:case-2'});assert.equal(s.spent,1);assert.equal(s.inspected.length,1);
  for(const key of ['returns','versions','channels','roles','capacity','metric'])s=act(s,{type:'inspect',key});assert.equal(s.spent,budget);
  assert.throws(()=>act(s,{type:'inspect',key:'receipt'}),/Бюджет/);assert.equal(s.spent,budget);
});
test('closed evidence cannot be pinned, and a pilot needs an explained hypothesis and two actual sources',()=>{
  let s=createState();assert.throws(()=>act(s,{type:'pin',key:'versions',value:true}),/Сначала/);assert.throws(()=>act(s,{type:'pilot',intervention:'input'}),/Отметьте/);
  s=prepared();s=act(s,{type:'pin',key:'returns',value:false});assert.throws(()=>act(s,{type:'pilot',intervention:'input'}),/два/);
});
test('appropriate pilot changes the causal loss and charges time to simple cases too',()=>{
  for(const [index,scenario] of scenarios.entries()){
    const book=createCasebook('case-0'+(index+1)),result=compare(book,scenario.intervention),after=pilotCases(book,scenario.intervention);
    assert.ok(result.daysSaved>2);assert.ok(result.after.work>result.before.work);assert.ok(result.after.wait<result.before.wait);
    assert.ok(result.cases[0].after>result.cases[0].before);assert.deepEqual(after.map(c=>c.id),book.cases.map(c=>c.id));
    for(const other of ['input','bounds','version'].filter(id=>id!==scenario.intervention))assert.ok(compare(book,other).daysSaved<=0);
  }
});
test('version pilot improves first usable answers; faster checking of input alone does not',()=>{
  const book=createCasebook('case-03');assert.equal(metrics(book.cases).usable,2);assert.equal(compare(book,'version').after.usable,5);assert.equal(compare(book,'input').after.usable,2);
});
test('pilot does not silently replace a wrong marker with the right stage',()=>{
  let s=prepared('case-01','dispatch');s=act(s,{type:'pilot',intervention:'input'});s=act(s,{type:'finish'});
  const result=finalReport(s);assert.equal(result.stageMatched,false);assert.equal(result.measureMatched,true);assert.equal(result.last.hypothesis.stage,'dispatch');assert.ok(result.last.result.daysSaved>2);
});
test('second different pilot is possible, its baseline is unchanged and third pilot is rejected',()=>{
  let s=prepared();s=act(s,{type:'pilot',intervention:'bounds'});assert.throws(()=>act(s,{type:'pilot',intervention:'bounds'}),/уже проверено/);
  s=act(s,{type:'hypothesis',stage:'register'});s=act(s,{type:'pilot',intervention:'input'});
  assert.equal(s.pilots.length,2);assert.deepEqual(s.pilots[0].result.before,s.pilots[1].result.before);assert.throws(()=>act(s,{type:'pilot',intervention:'version'}),/Два/);
});
test('completed investigation retains earned evidence; reopening existing sources is read-only',()=>{
  let s=act(prepared(),{type:'pilot',intervention:'input'});s=act(s,{type:'finish'});const before=JSON.stringify(s.pilots),reopened=act(s,{type:'inspect',key:'returns'});
  assert.equal(JSON.stringify(reopened.pilots),before);assert.equal(reopened.spent,s.spent);assert.throws(()=>act(s,{type:'inspect',key:'versions'}),/завершено/);assert.throws(()=>act(s,{type:'hypothesis',stage:'approve'}),/завершено/);
});
test('all eight evidence types are coherent and reference actual case/stage IDs',()=>{
  assert.equal(sources.length,8);for(const seed of ['case-01','case-02','case-03']){
    const book=createCasebook(seed);
    for(const source of sources){const fact=evidence(book,source.id==='case'?'case:case-2':source.id);assert.ok(fact.title&&fact.text&&fact.provenance&&fact.rows.length);for(const id of fact.signals)assert.ok(stages.some(s=>s.id===id));}
    assert.equal(evidence(book,'metric').rows.at(-1).value.includes('5'),true);
  }
});
test('resume recomputes pilot results and rejects inconsistent budget or fabricated evidence',()=>{
  const s=act(prepared(),{type:'pilot',intervention:'input'}),payload=JSON.parse(JSON.stringify(s));payload.pilots[0].result.after.days=999;
  assert.deepEqual(resumeState(payload),s);assert.equal(resumeState({...s,revision:2}),null);assert.equal(resumeState({...s,spent:12}),null);assert.equal(resumeState({...s,pinned:['unopened']}),null);
});
test('detective export/import stays isolated from project game, old simulation and personal actions',()=>{
  const values=new Map(),store=createStore({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),id=store.active();
  const s=act(prepared(),{type:'pilot',intervention:'input'});store.update(id,data=>{data.course.detectiveGame=s;data.course.detectiveGameArchive=[createState('case-02')];data.course.projectGame={revision:1,time:11};data.course.simulation={revision:2,decisions:['tight-check']};});
  const imported=store.import(JSON.parse(JSON.stringify(store.export(id)))),data=store.profile(imported).data;
  assert.deepEqual(resumeState(data.course.detectiveGame),s);assert.deepEqual(data.course.projectGame,{revision:1,time:11});assert.deepEqual(data.course.simulation,{revision:2,decisions:['tight-check']});assert.equal(data.course.detectiveGameArchive[0].seed,'case-02');
});
test('fifty seeds keep intervals finite and preserve the pilot sample and quality guard',()=>{
  for(let i=0;i<50;i++){
    const book=createCasebook('audit-'+i),result=compare(book,book.scenario.intervention);
    assert.ok(result.daysSaved>0.5);assert.equal(result.before.total,result.after.total);assert.ok(result.after.usable>=result.before.usable);assert.ok(result.after.returns<=result.before.returns);
    for(const item of pilotCases(book,book.scenario.intervention))for(const step of trace(item))for(const key of ['work','wait','rework','start','end'])assert.ok(Number.isFinite(step[key])&&step[key]>=0);
  }
});
