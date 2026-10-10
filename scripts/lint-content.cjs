const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {loadLegacy,sentences,duplicates}=require('./content-audit.cjs');
const {publicFiles,publicPath}=require('./public-files.cjs');
const root=path.resolve(__dirname,'..');

async function lint(){
  require('./check-conflicts.cjs').assertClean(root);
  const [{topicsFromLegacy},{validateTopics}]=await Promise.all(['legacy-adapter','topic-schema'].map(name=>import(pathToFileURL(path.join(root,`content/${name}.js`)))));
  const content=loadLegacy(),topics=topicsFromLegacy(content),errors=validateTopics(topics),warnings=[];
  const simulation=await import(pathToFileURL(path.join(root,'assets/simulation-engine.js'))),actionIds=new Set();
  let state=simulation.initial();
  for(let turn=0;turn<10;turn++){
    const scene=simulation.scene(turn,state);
    if(!scene.title||!scene.text||!scene.actions?.length)errors.push(`simulation ${turn}: incomplete scene`);
    for(const action of scene.actions||[]){
      if(!action.id||!action.text||!action.appeal||actionIds.has(action.id))errors.push(`simulation ${turn}: invalid action ${action.id}`);
      actionIds.add(action.id);
      if(action.misconception!==undefined&&!Object.hasOwn((await import(pathToFileURL(path.join(root,'content/misconceptions.js')))).misconceptions,action.misconception))errors.push(`simulation ${turn}: unknown misconception`);
      if(!simulation.apply(state,turn,action.id).consequence)errors.push(`simulation ${turn}: missing consequence`);
    }
    state=simulation.apply(state,turn,scene.actions[0].id).state;
  }
  const files=publicFiles(root);
  const [{eventDefinitions,actionLabels},{tasks:gameTasks},gameEngine]=await Promise.all(['events','project','engine'].map(name=>import(pathToFileURL(path.join(root,`assets/game/${name}.js`)))));
  const {createState}=await import(pathToFileURL(path.join(root,'assets/game/state.js')));
  const gameIds=new Set();
  for(const task of gameTasks){
    if(gameIds.has(task.id)||!task.name||task.duration<=0||!task.skills.length)errors.push(`game task: invalid ${task.id}`);
    gameIds.add(task.id);
  }
  for(const task of gameTasks)for(const dependency of task.dependencies)if(!gameIds.has(dependency))errors.push(`game task ${task.id}: missing dependency ${dependency}`);
  for(const [id,event] of Object.entries(eventDefinitions)){
    if(!event.title||!event.text||!event.explanation||!['external','causal'].includes(event.kind))errors.push(`game event ${id}: incomplete content`);
    if(!topics.some(t=>t.id===event.topic)||!/^theory-[0-2]$/.test(event.step))errors.push(`game event ${id}: invalid course fragment`);
    for(const action of event.actions){
      if(!actionLabels[action])errors.push(`game event ${id}: missing action label ${action}`);
      try{gameEngine.act(createState(),{type:action,task:'requirements'});}catch(error){if(error.message==='Неизвестное решение.')errors.push(`game event ${id}: unknown engine action ${action}`);}
    }
  }
  for(const file of files.filter(f=>f.startsWith('assets/game/')&&f.endsWith('.js')))if(/Math\.random\s*\(/.test(fs.readFileSync(path.join(root,file),'utf8')))errors.push(`${file}: game randomness must be seeded`);
  console.log(`Game: ${gameTasks.length} tasks, ${Object.keys(eventDefinitions).length} event definitions; seeded engine and course links checked.`);
  const [{stages:detectiveStages,sources:detectiveSources,interventions:detectiveInterventions,scenarios:detectiveScenarios},{createCasebook,trace,compare},{evidence}]=await Promise.all(['data','model','evidence'].map(name=>import(pathToFileURL(path.join(root,`assets/detective/${name}.js`)))));
  const stageIds=new Set(detectiveStages.map(s=>s.id)),sourceIds=new Set(detectiveSources.map(s=>s.id)),interventionIds=new Set(detectiveInterventions.map(i=>i.id));
  if(stageIds.size!==detectiveStages.length||sourceIds.size!==detectiveSources.length||interventionIds.size!==detectiveInterventions.length)errors.push('detective: duplicate IDs');
  for(const source of detectiveSources)if(!source.name||!source.description||!Number.isInteger(source.cost)||source.cost<=0)errors.push(`detective source ${source.id}: invalid content/cost`);
  for(const intervention of detectiveInterventions)if(!intervention.name||!intervention.description||!stageIds.has(intervention.stage))errors.push(`detective intervention ${intervention.id}: invalid stage`);
  for(const [index,scenario] of detectiveScenarios.entries()){
    if(!stageIds.has(scenario.stage)||!interventionIds.has(scenario.intervention)||!scenario.title||!scenario.explanation||!scenario.next||!topics.some(t=>t.id===scenario.topic)||!/^theory-[0-2]$/.test(scenario.step))errors.push(`detective scenario ${scenario.id}: incomplete content or course link`);
    const book=createCasebook('case-0'+(index+1));if(book.cases.length!==5)errors.push(`detective scenario ${scenario.id}: incomplete case set`);
    for(const item of book.cases)if(trace(item).some(s=>!stageIds.has(s.stage)||[s.work,s.wait,s.rework,s.start,s.end].some(n=>!Number.isFinite(n)||n<0)))errors.push(`detective case ${item.id}: invalid timeline`);
    for(const source of detectiveSources){const fact=evidence(book,source.id==='case'?'case:case-2':source.id);if(!fact.title||!fact.text||!fact.provenance||!fact.rows.length||fact.signals.some(id=>!stageIds.has(id)))errors.push(`detective evidence ${source.id}: incomplete`);}
    for(const intervention of detectiveInterventions){const result=compare(book,intervention.id);if(result.before.total!==5||result.after.total!==5||result.cases.length!==5)errors.push('detective: pilot changes the comparison sample');}
  }
  for(const file of files.filter(f=>f.startsWith('assets/detective/')&&f.endsWith('.js')))if(/Math\.random\s*\(/.test(fs.readFileSync(path.join(root,file),'utf8')))errors.push(`${file}: randomness must be seeded`);
  console.log(`Detective: ${detectiveStages.length} stages, ${detectiveSources.length} source types, ${detectiveScenarios.length} scenarios; case math and course links checked.`);
  for(const relative of files){
    if(!/\.(html|js)$/.test(relative))continue;
    const source=fs.readFileSync(path.join(root,relative),'utf8');
    const links=relative.endsWith('.html')?[...source.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]):[...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]);
    for(const link of links){
      if(/^[a-z]+:/i.test(link)||link.startsWith('#'))continue;
      const clean=link.split(/[?#]/)[0];if(!clean)continue;
      const target=path.posix.normalize(path.posix.join(path.posix.dirname(relative),clean));
      if(!publicPath(target)||!files.includes(target))errors.push(`${relative}: missing public target ${link}`);
    }
  }
  const questions=topics.flatMap(t=>t.questions),positions=Array(3).fill(0);
  let totalCorrectLength=0,totalOtherLength=0,longest=0;
  for(const q of questions){
    positions[q.answer]++;
    const correct=q.options[q.answer].text.length,other=q.options.filter((_,i)=>i!==q.answer).map(o=>o.text.length);
    totalCorrectLength+=correct;totalOtherLength+=other.reduce((sum,n)=>sum+n,0);
    if(correct>Math.max(...other))longest++;
  }
  if(totalCorrectLength/questions.length>totalOtherLength/(questions.length*2)*1.3)errors.push('questions: correct answers systematically longer than alternatives');
  if(longest>questions.length*0.4)errors.push('questions: too many longest correct answers');
  if(Math.max(...positions)-Math.min(...positions)>Math.ceil(questions.length*0.15))errors.push('questions: canonical answer positions are unbalanced');
  const editorial=topics.map(({reference,course,...topic})=>topic);
  for(const sentence of sentences(editorial)){
    if(/(?:ты|вы|он|она|сотрудник)\s+(?:являетесь?\s+)?(?:тип\s+[DISC]|прирожд[её]нн|неизменн)|(?:PAEI\s*)?P\s*=\s*(?:DISC\s*)?D\s*=\s*Driver/i.test(sentence.text))errors.push(`${sentence.location}: personal typology label`);
  }
  for(const topic of topics)for(const b of topic.explanations)for(const o of b.micro?.options||[]){
    if(/Этот вариант опирается на одну из видимых сторон ситуации/.test(o.appeal))errors.push(`topic ${topic.id}.${b.micro.id}: generic appeal`);
  }
  // Similarity is advisory: a shared concept must not cause automatic deletion.
  const candidates=sentences(editorial).filter(s=>s.location.includes('.explanations.')&&s.normalized.length>=100),similar=[];
  const wordSet=s=>new Set(s.normalized.split(' '));
  for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){
    const a=candidates[i],b=candidates[j];if(a.normalized===b.normalized)continue;
    const x=wordSet(a),y=wordSet(b),intersection=[...x].filter(w=>y.has(w)).length;
    if(intersection/(x.size+y.size-intersection)>=0.75)similar.push(`${a.location} ~ ${b.location}`);
  }
  const exact=duplicates(editorial);
  console.log(`Content: ${topics.length} topics, ${topics.reduce((n,t)=>n+t.techniques.length,0)} techniques, ${questions.length} questions; answer positions ${positions.join('/')}; longest correct ${longest}.`);
  console.log(`Editorial candidates: ${exact.length} exact sentence groups, ${similar.length} similar pairs, ${warnings.length} generic appeals (legacy migration).`);
  if(process.argv.includes('--report')){
    for(const group of exact)console.log(`DUPLICATE: ${group[0].text}\n  ${group.map(s=>s.location).join('\n  ')}`);
    for(const pair of similar)console.log('SIMILAR: '+pair);
    for(const warning of warnings)console.log('REVIEW: '+warning);
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Content validation passed.');
}
lint().catch(error=>{console.error(error.message);process.exitCode=1;});
