const {test}=require('node:test'),assert=require('node:assert/strict');
const {generateCasebook}=require('../assets/detective/generator.js'),{validateCase}=require('../assets/detective/case-validator.js');
const {createState,act,resumeState,finalReport}=require('../assets/detective/engine.js');
const {runPilot,cycle}=require('../assets/detective/pilot.js');
const {scoreInvestigation}=require('../assets/detective/investigation-scoring.js');
const {presentationBook,displayedPilot}=require('../assets/detective/presentation.js');
function prepared(seed){let s=createState(seed,{generatorVersion:2}),b=generateCasebook(seed);s=act(s,{type:'start'});for(const source of b.sources.filter(s=>s.facts.some(f=>f.kind==='key'))){s=act(s,{type:'inspect',key:source.id});s=act(s,{type:'evidence',id:source.facts[0].id});}s=act(s,{type:'hypothesis',stage:b.archetype.trueStage});return [s,b];}
test('500 seeded cases cover every archetype and satisfy solvability without opening all sources',()=>{
  const kinds=new Set(),counts=new Set(),budgets=new Set();
  for(let i=0;i<500;i++){const b=generateCasebook('validate-'+i);assert.deepEqual(generateCasebook('validate-'+i),b);assert.deepEqual(validateCase(b),{valid:true,errors:[]});kinds.add(b.archetype.id);counts.add(b.cases.length);budgets.add(b.budget);assert.equal(b.sources.length,6);assert.ok(new Set(b.cases.map(c=>cycle(c))).size>1);const effective=runPilot(b,b.archetype.effectiveInterventions[0]);assert.ok(effective.delta>=1);assert.deepEqual(effective.afterCases.map(c=>c.id),b.cases.map(c=>c.id));}
  assert.equal(kinds.size,7);assert.equal(counts.size,4);assert.equal(budgets.size,3);
});
test('validator rejects weak paradox, missing clues, absent signal and affordable-all sources',()=>{
  const b=generateCasebook('invalid');
  assert.equal(validateCase({...b,reportedCycle:b.realCycle}).valid,false);
  const noClues=structuredClone(b);noClues.sources.forEach(s=>s.facts.forEach(f=>f.kind='neutral'));assert.equal(validateCase(noClues).valid,false);
  assert.equal(validateCase({...b,budget:100}).valid,false);
  const noSignal=structuredClone(b);noSignal.cases.forEach(c=>c.events.forEach(e=>delete e.cause));assert.equal(validateCase(noSignal).valid,false);
});
test('reporting trap changes only measurement and marks no case event as changed',()=>{
  for(let i=0;i<30;i++){const b=generateCasebook('metric-'+i),r=runPilot(b,'change_metric');assert.equal(r.delta,0);assert.equal(r.before,r.after);assert.equal(r.reportedAfter,r.after);assert.ok(r.reportedAfter>r.reportedBefore);assert.ok(r.afterCases.every(c=>c.events.every(e=>!e.changed)));}
});
test('evidence costs once, max three facts, state gates and budget forbid indiscriminate inspection',()=>{
  let s=createState('evidence',{generatorVersion:2}),b=generateCasebook(s.seed);assert.throws(()=>act(s,{type:'hypothesis',stage:'execute'}));assert.throws(()=>act(s,{type:'evidence',id:b.sources[0].facts[0].id}));
  s=act(s,{type:'start'});for(const source of b.sources.slice(0,3)){s=act(s,{type:'inspect',key:source.id});s=act(s,{type:'evidence',id:source.facts[0].id});}const spent=s.spent;assert.equal(act(s,{type:'inspect',key:b.sources[0].id}).spent,spent);
  s=act(s,{type:'inspect',key:b.sources[3].id});assert.throws(()=>act(s,{type:'evidence',id:b.sources[3].facts[0].id}),/трёх/);
  for(const source of b.sources.slice(4)){if(s.spent+source.cost<=b.budget)s=act(s,{type:'inspect',key:source.id});else assert.throws(()=>act(s,{type:'inspect',key:source.id}),/Бюджет/);}
  assert.ok(s.inspected.length<b.sources.length);
});
test('second pilot is a fair baseline comparison; successful revision earns a strong result',()=>{
  let [s,b]=prepared('revision');s=act(s,{type:'pilot',intervention:'change_metric'});const first=structuredClone(s.pilots[0]);s=act(s,{type:'refine'});s=act(s,{type:'pilot',intervention:b.archetype.effectiveInterventions[0]});assert.deepEqual(s.pilots[0],first);assert.equal(s.pilots[1].result.before,first.result.before);assert.throws(()=>act(s,{type:'refine'}));const result=scoreInvestigation(s,b);assert.equal(result.corrected,true);assert.ok(['A','B'].includes(result.grade));
  s=act(s,{type:'finish'});assert.throws(()=>act(s,{type:'inspect',key:b.sources[0].id}));
  assert.equal(finalReport(s).grade,result.grade);assert.equal(finalReport(s).scenario.id,b.archetype.id);
});
test('resume reconstructs earned pilot results, rejects fabrication, and keeps unknown fields',()=>{
  let [s,b]=prepared('resume');s=act(s,{type:'pilot',intervention:b.interventions[0]});s.custom={keep:true};const before=structuredClone(s);s.pilots[0].result.after=999;assert.deepEqual(resumeState(s),before);
  assert.equal(resumeState({...s,spent:99}),null);assert.equal(resumeState({...s,selectedEvidence:['fake']}),null);assert.equal(resumeState({...s,generatorVersion:99}),null);
  const early=act(createState('early',{generatorVersion:2}),{type:'finish'});assert.equal(scoreInvestigation(early,generateCasebook('early')).grade,null);
});
test('legacy presentation retains original cases and pilots without text entry or regeneration',()=>{
  let s=createState('case-03');for(const key of ['returns','versions']){s=act(s,{type:'inspect',key});s=act(s,{type:'pin',key,value:true});}s=act(s,{type:'hypothesis',stage:'execute',note:'Старая версия создаёт возврат пригодного ответа.'});s=act(s,{type:'pilot',intervention:'version'});
  const before=structuredClone(s),book=presentationBook(s),p=displayedPilot(s,book,s.pilots[0]);assert.equal(book.cases.length,5);assert.equal(p.result.before,s.pilots[0].result.before.days);assert.equal(p.result.after,s.pilots[0].result.after.days);assert.deepEqual(s,before);assert.deepEqual(resumeState(s),s);
});
