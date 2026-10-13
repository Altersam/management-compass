const {test}=require('node:test'),assert=require('node:assert/strict');
const {templates}=require('../assets/ethics-dossier/templates.js'),{generateScenario}=require('../assets/ethics-dossier/generator.js'),{validateScenario}=require('../assets/ethics-dossier/validator.js');
const {create,act,validate}=require('../assets/ethics-dossier/state.js'),{scoreDecision,documentVerdict}=require('../assets/ethics-dossier/scoring.js'),{consequencePlan,futureOutcome}=require('../assets/ethics-dossier/consequences.js');
const {createStore}=require('../assets/store.js');
function prepared(seed='dossier'){let s=act(create(seed),{type:'open'});for(const id of ['advocate','rule']){s=act(s,{type:'read',id});s=act(s,{type:'check',id});s=act(s,{type:'basis',id});}s=act(s,{type:'principle',id:'utility'});s=act(s,{type:'decision',id:'option_a'});return act(s,{type:'mitigation',id:'independent'});}
test('24 authored cases cover at least 72 reproducible combinations and all nine document issues',()=>{
  assert.equal(templates.length,24);assert.equal(new Set(templates.map(t=>t.id)).size,24);assert.ok(templates.every(t=>t.variations.length>=3&&t.options.length===4&&t.facts.length===4&&t.future.length>=2));
  const pairs=new Set(),issues=new Set(),domains=new Set();for(let i=0;i<2500;i++){const b=generateScenario('ethics-'+i);assert.deepEqual(validateScenario(b),{valid:true,errors:[]});pairs.add(b.templateId+':'+b.variation);b.documents.forEach(d=>issues.add(d.issue));domains.add(b.domain);if(i<50)assert.deepEqual(generateScenario('ethics-'+i),b);}
  assert.equal(pairs.size,72);assert.equal(issues.size,9);assert.ok(domains.size>=12);
});
test('validator rejects dominant options, bad budget, missing reliable evidence and a knowable future',()=>{
  const b=generateScenario('bad');const dominant=structuredClone(b);dominant.options[0].profile=Object.fromEntries(Object.keys(dominant.options[0].profile).map(k=>[k,10]));assert.ok(!validateScenario(dominant).valid);
  assert.ok(!validateScenario({...b,checks:b.documents.length}).valid);const broken=structuredClone(b);broken.documents.forEach(d=>d.issue='BIAS');assert.ok(!validateScenario(broken).valid);
  assert.ok(!validateScenario({...b,future:{...b.future,unavailableAtDecision:false}}).valid);
});
test('reading, limited checks and basis are distinct; repeated verification is free and limits are real',()=>{
  let s=act(create('checks'),{type:'open'});assert.throws(()=>act(s,{type:'check',id:'rule'}),/прочитайте/);assert.throws(()=>act(s,{type:'basis',id:'rule'}),/прочитайте/);const before=s.checksLeft;s=act(s,{type:'read',id:'rule'});assert.equal(s.checksLeft,before);s=act(s,{type:'check',id:'rule'});assert.equal(s.checksLeft,before-1);assert.equal(act(s,{type:'check',id:'rule'}).checksLeft,s.checksLeft);
  for(const d of s.scenario.documents.filter(d=>d.id!=='rule')){s=act(s,{type:'read',id:d.id});if(s.checksLeft)s=act(s,{type:'check',id:d.id});else assert.throws(()=>act(s,{type:'check',id:d.id}),/исчерпаны/);}assert.ok(Object.values(s.documents).some(d=>!d.checked));
  for(const id of ['rule','reference','advocate'])s=act(s,{type:'basis',id});assert.throws(()=>act(s,{type:'basis',id:'record'}),/трёх/);s=act(s,{type:'principle',id:'rules'});s=act(s,{type:'principle',id:'fairness'});assert.throws(()=>act(s,{type:'principle',id:'utility'}),/двух/);
});
test('bias is not false, official rules stay reliable and procedural/outdated records need an explicit qualification',()=>{
  let s=prepared();const advocate=s.scenario.documents.find(d=>d.id==='advocate'),v=documentVerdict(s,advocate);assert.match(v.status,/факт подтверждён/);assert.ok(v.quality>.8);assert.equal(s.scenario.documents.find(d=>d.id==='rule').issue,'NONE');
  for(let i=0;i<40;i++){const b=generateScenario('record-'+i);assert.equal(b.documents.find(d=>d.id==='rule').issue,'NONE');assert.ok(['OUTDATED','PROCEDURAL','INCOMPLETE'].includes(b.documents.find(d=>d.id==='record').issue));}
});
test('protection changes real consequences and a defended risky choice can have high process quality',()=>{
  const s=prepared();assert.ok(['A','B'].includes(scoreDecision(s).grade));const a=consequencePlan(s.scenario,'option_a','independent'),b=consequencePlan(s.scenario,'option_a','recognition');assert.notDeepEqual(a,b);assert.equal(a[2].sign,'plus');assert.equal(b[2].sign,'mixed');
  for(const o of s.scenario.options){const plan=consequencePlan(s.scenario,o.id,'checkpoint');assert.ok(plan.some(e=>e.sign==='plus'));assert.ok(plan.some(e=>e.sign==='minus'));}
});
test('future outcome never changes the grade; a lucky fragile decision is not rewarded with A',()=>{
  const s=prepared('future'),before=scoreDecision(s),changed=structuredClone(s);changed.scenario.future={...changed.scenario.future,text:'Совершенно другое внешнее событие.',favourable:!s.scenario.future.favourable,impact:'negative'};assert.deepEqual(scoreDecision(changed),before);
  let weak=act(create('lucky'),{type:'open'});for(const id of ['record','testimony']){weak=act(weak,{type:'read',id});weak=act(weak,{type:'basis',id});}weak=act(weak,{type:'principle',id:'utility'});weak=act(weak,{type:'decision',id:'option_a'});weak=act(weak,{type:'mitigation',id:'recognition'});weak.scenario.future.favourable=true;assert.ok(scoreDecision(weak).grade!=='A');
  assert.equal(futureOutcome(s.scenario,'option_a','independent').unavailableAtDecision,true);
});
test('timeline releases one moment at a time, new information is separate and stored process remains fixed',()=>{
  let s=act(prepared('timeline'),{type:'commit'}),result=structuredClone(s.result);assert.equal(s.consequences.length,0);assert.equal(s.futureReveal,null);assert.throws(()=>act(s,{type:'reveal'}));s=act(s,{type:'tick'});assert.equal(s.consequences.length,1);s=act(s,{type:'pause'});assert.throws(()=>act(s,{type:'tick'}));s=act(s,{type:'resume'});while(s.phase==='consequences')s=act(s,{type:'tick'});assert.equal(s.phase,'future');assert.equal(s.futureReveal,null);s=act(s,{type:'reveal'});assert.deepEqual(s.result,result);s=act(s,{type:'finish'});assert.ok(validate(s));assert.throws(()=>act(s,{type:'basis',id:'primary'}));
});
test('same seed fixes hidden issues and future, backup retains the case and forged result is rejected',()=>{
  let s=act(prepared('backup'),{type:'commit'});s=act(s,{type:'tick'});s.custom='preserve';assert.ok(validate(JSON.parse(JSON.stringify(s))));const tampered=structuredClone(s);tampered.result.grade='F';assert.equal(validate(tampered),false);assert.deepEqual(create(s.seed).scenario,s.scenario);
  const values=new Map(),store=createStore({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),id=store.active();store.update(id,d=>{d.course.arcadeGames={ethics:s,sprint:{keep:true}};d.course.arcadeArchives={ethics:[create('archive')]};});const copy=store.import(JSON.parse(JSON.stringify(store.export(id)))),c=store.profile(copy).data.course;assert.deepEqual(c.arcadeGames.ethics,s);assert.ok(validate(c.arcadeGames.ethics));assert.ok(c.arcadeGames.sprint.keep);
});
