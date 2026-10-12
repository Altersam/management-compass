const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,act,validate}=require('../assets/approach/state.js');
const {generateProject}=require('../assets/approach/generator.js');
const {presets}=require('../assets/approach/parameters.js');
const {startRun,stepWeek,forecast}=require('../assets/approach/simulation.js');
const {runReport,finalReport}=require('../assets/approach/scoring.js');
const {eventChoices}=require('../assets/approach/events.js');
const {createStore}=require('../assets/store.js');
const choice=(s)=>({delay:'fast',capacity:'fast',budget:'probe'})[s.events.find(e=>e.id===s.current.pending).kind]||'adapt';
function finish(s){let guard=0;while(['running','event'].includes(s.phase)){assert.ok(guard++<100);s=act(s,s.phase==='event'?{type:'decision',choice:choice(s)}:{type:'tick'});}return s;}
function attempt(seed,preset){let s=create(seed);s=act(s,{type:'start'});s=act(s,{type:'preset',value:preset});return finish(act(s,{type:'run'}));}
test('seed fixes projects, domain events and timing independently of parameters and attempt number',()=>{
  const domains=new Set(),counts=new Set();
  for(let i=0;i<250;i++){const b=generateProject('domain-'+i);assert.deepEqual(generateProject('domain-'+i),b);domains.add(b.project.domain);counts.add(b.events.length);assert.equal(new Set(b.events.map(e=>e.week)).size,b.events.length);assert.ok(b.events.every(e=>e.id.startsWith(b.project.domain+'-')&&e.week>=2&&e.week<b.project.weeks&&eventChoices[e.kind].length===3));}
  assert.equal(domains.size,11);assert.deepEqual([...counts].sort(),[2,3]);assert.notDeepEqual(generateProject('a'),generateProject('b'));
});
test('run advances ordinary weeks, events pause it and choices affect later rows without touching the past',()=>{
  let s=act(act(create('event-causality'),{type:'start'}),{type:'run'});assert.equal(s.current.rows.length,1);assert.equal(s.attempts.length,0);
  while(s.phase!=='event')s=act(s,{type:'tick'});
  assert.equal(s.paused,true);assert.throws(()=>act(s,{type:'tick'}));assert.throws(()=>act(s,{type:'resume'}));
  const event=s.events.find(e=>e.id===s.current.pending),before=JSON.stringify(s.current.rows.slice(0,-1)),a=act(s,{type:'decision',choice:eventChoices[event.kind][0][0]}),b=act(s,{type:'decision',choice:eventChoices[event.kind][1][0]});
  assert.equal(JSON.stringify(a.current.rows.slice(0,-1)),before);assert.notDeepEqual(finish(a).attempts[0],finish(b).attempts[0]);
});
test('checks reveal accumulated loss, later discovery is more expensive and frequent checks cost resources',()=>{
  const c={weeks:12,budget:100,unknowns:.8,volatility:.7,defectCost:.9,regulation:.5,maturity:.8,feedbackAccess:.9};
  const simulate=interval=>{let r=startRun(c,{upfront:.1,interval,feedback:.8,buffer:.2});for(let i=0;i<12;i++)r=stepWeek(r,c);return r;};
  const frequent=simulate(2),rare=simulate(8);assert.ok(frequent.rows.filter(r=>r.checkpoint).length>rare.rows.filter(r=>r.checkpoint).length);assert.ok(rare.lateRework>frequent.lateRework);assert.ok(rare.rows.some(r=>r.detected>1&&r.progress<r.work));
  const stable={...c,unknowns:.12,volatility:.12,regulation:.2};
  const cost=interval=>{let r=startRun(stable,{upfront:.25,interval,feedback:.8,buffer:.2});for(let i=0;i<12;i++)r=stepWeek(r,stable);return r.cost;};assert.ok(cost(1)>cost(8));
});
test('paused corrections replay exactly, cannot rewrite upfront work and retain snapshots on reload',()=>{
  let s=act(act(create('paused'),{type:'start'}),{type:'run'});s=act(s,{type:'tick'});assert.throws(()=>act(s,{type:'parameter',key:'interval',value:1}));
  s=act(s,{type:'pause'});s=act(s,{type:'parameter',key:'interval',value:1});s=act(s,{type:'parameter',key:'feedback',value:.85});assert.ok(validate(s));assert.throws(()=>act(s,{type:'parameter',key:'upfront',value:.5}));assert.throws(()=>act(s,{type:'parameter',key:'unknown',value:2}));
  s=finish(act(s,{type:'resume'}));assert.ok(validate(JSON.parse(JSON.stringify(s))));
  const tampered=structuredClone(s);tampered.attempts[0].cost=0;assert.equal(validate(tampered),false);
});
test('forecast omits future events and never changes current state or earned results',()=>{
  const s=create('forecast'),before=structuredClone(s),f=forecast(s.project,s.parameters);assert.deepEqual(s,before);assert.ok(f.rows.every(r=>!r.event));assert.ok(f.weeks>=s.project.weeks);
  let run=act(act(s,{type:'start'}),{type:'run'});run=act(run,{type:'tick'});const copy=structuredClone(run);forecast(run.project,run.parameters,run.current);assert.deepEqual(run,copy);
});
test('same project and events survive two trials, presets are not universal winners and finals explain causes',()=>{
  const winners=new Set();
  for(let i=0;i<50;i++){
    const results=Object.keys(presets).map(p=>{const s=attempt('balance-'+i,p);assert.ok(validate(s));return [p,runReport(s.attempts[0],s.project).score];});results.sort((a,b)=>b[1]-a[1]);winners.add(results[0][0]);
  }
  assert.ok(winners.size>=2);
  let s=attempt('two-runs','waterfall'),first=structuredClone(s.attempts[0]),events=structuredClone(s.events);s=act(s,{type:'adjust'});s=act(s,{type:'preset',value:'agile'});s=finish(act(s,{type:'run'}));assert.equal(s.phase,'ended');assert.deepEqual(s.attempts[0],first);assert.deepEqual(s.events,events);assert.equal(s.attempts[0].responses.length,s.events.length);assert.equal(s.attempts[1].responses.length,s.events.length);assert.ok(validate(s));assert.ok(['A','B','C','D'].includes(finalReport(s).grade));assert.ok(!finalReport(s).insights.some(t=>/Правильный подход/.test(t)));assert.throws(()=>act(s,{type:'run'}));
});
test('all domains and extreme legal parameter profiles terminate with finite costs and honest progress',()=>{
  for(let i=0;i<60;i++){let s=act(create('finite-'+i),{type:'start'});for(const [key,value] of Object.entries(i%2?{upfront:.5,interval:8,feedback:0,buffer:0}:{upfront:0,interval:1,feedback:1,buffer:.6}))s=act(s,{type:'parameter',key,value});s=finish(act(s,{type:'run'}));assert.ok(validate(s));for(const r of s.attempts[0].rows){for(const key of ['progress','work','accepted','unknowns','cost','rework','reserve'])assert.ok(Number.isFinite(r[key])&&r[key]>=0);assert.ok(r.accepted<=100);} }
});
test('backup keeps current week, decision journal, project archives and other games isolated',()=>{
  const values=new Map(),store=createStore({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),id=store.active();
  let s=act(act(create('backup-approach'),{type:'start'}),{type:'run'});while(s.phase!=='event')s=act(s,{type:'tick'});
  store.update(id,d=>{d.course.arcadeGames={hybrid:s,meeting:{keep:true}};d.course.arcadeArchives={hybrid:[attempt('archived','hybrid')]};d.course.detectiveGame={seed:'saved'};});const imported=store.import(JSON.parse(JSON.stringify(store.export(id)))),course=store.profile(imported).data.course;assert.deepEqual(course.arcadeGames.hybrid,s);assert.ok(validate(course.arcadeGames.hybrid));assert.equal(course.arcadeGames.meeting.keep,true);assert.equal(course.detectiveGame.seed,'saved');assert.ok(validate(course.arcadeArchives.hybrid[0]));
});
