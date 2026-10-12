const {test}=require('node:test'),assert=require('node:assert/strict');
const {gameCatalog}=require('../assets/game-catalog.js');
const {seedForDomain}=require('../assets/game-presentation.js');
const P=require('../assets/game/state.js'),D=require('../assets/detective/generator.js'),A=require('../assets/approach/state.js'),S=require('../assets/sprint-goal/state.js'),M=require('../assets/meeting-decision/state.js');
test('catalogue contains twelve independent games and the formerly hidden linked service story',()=>{
  assert.equal(gameCatalog.length,13);assert.equal(new Set(gameCatalog.map(g=>g.id)).size,13);assert.equal(new Set(gameCatalog.map(g=>g.href)).size,13);assert.equal(gameCatalog.find(g=>g.id==='simulation').href,'index.html#final');assert.equal(gameCatalog.filter(g=>g.featured).length,2);
});
test('new project cases vary real resources and workloads, not only a seed label',()=>{
  const fingerprints=new Set();for(let i=0;i<40;i++){const s=P.createState('audit-project-'+i,{scenarioVersion:3});assert.deepEqual(P.createState(s.seed,{scenarioVersion:3}),s);fingerprints.add(JSON.stringify([s.people.map(p=>[p.cost,p.skills,p.speed]),s.tasks.map(t=>t.effort),s.externalPlan]));assert.deepEqual(P.resumeState(JSON.parse(JSON.stringify(s))),s);}assert.ok(fingerprints.size>35);
});
test('choosing an area creates reproducible cases with actual varying context factors',()=>{
  const factories=[['legal',seed=>A.create(seed).project.domain,seed=>A.create(seed)],['education',seed=>S.create(seed).scenario.domain,seed=>S.create(seed)],['procurement',seed=>M.create(seed).scenario.id,seed=>M.create(seed)]];
  for(const [domain,domainOf,create] of factories){const one=seedForDomain(domain,domainOf,'case-picker-one'),two=seedForDomain(domain,domainOf,'case-picker-two');assert.equal(domainOf(one),domain);assert.equal(domainOf(two),domain);assert.deepEqual(create(one),create(one));assert.notDeepEqual(create(one),create(two));}
  assert.throws(()=>seedForDomain('missing',()=> 'another','base'));
});
test('investigation randomises a solvable casebook while two authored variants remain honest and reproducible',()=>{
  const kinds=new Set(),counts=new Set();for(let i=0;i<80;i++){const b=D.generateCasebook('audit-detective-'+i);kinds.add(b.archetype.id);counts.add(b.cases.length);assert.deepEqual(D.generateCasebook(b.seed),b);}assert.equal(kinds.size,7);assert.equal(counts.size,4);
  for(const id of ['ethics','versions']){const game=require('../assets/arcade/'+id+'.js'),variants=new Set();for(let i=0;i<40;i++){const s=game.create('audit-'+id+'-'+i);variants.add(s.variant);assert.deepEqual(game.create(s.seed),s);}assert.equal(variants.size,2);}
});
test('flow randomises defect sequences, fixed authored investigations do not pretend to have random factors',()=>{
  const flow=require('../assets/arcade/flow.js'),fingerprints=new Set();for(let i=0;i<30;i++){let s=flow.create('flow-audit-'+i);for(let t=0;t<5;t++)s=flow.act(s,{type:'tick'});fingerprints.add(JSON.stringify(s.outside.map(r=>r.defect)));}assert.ok(fingerprints.size>1);
  for(const id of ['metrics','influence','telephone','change']){const game=require('../assets/arcade/'+id+'.js'),a=game.create('one'),b=game.create('two');for(const s of [a,b]){delete s.seed;delete s.rng;}assert.deepEqual(a,b);}
});
