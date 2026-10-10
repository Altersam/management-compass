const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {publicPath,publicFiles,resolvePublicFile}=require('../scripts/public-files.cjs');
const {loadLegacy}=require('../scripts/content-audit.cjs');
const root=path.resolve(__dirname,'..');
const load=name=>import(pathToFileURL(path.join(root,`content/${name}.js`)));

test('public boundary allows nested native modules and excludes private files and traversal',()=>{
  for(const name of ['content/topics/01-self-management.js','assets/pages/home.js','assets/activities/workday.js','modules/module-03.html'])assert.equal(publicPath(name),true,name);
  for(const name of ['.git/config','docs/v3-audit.md','package.json','assets/source.pdf','content/source.pptx','assets/../store.js','assets//store.js','assets\\store.js','content/.private/a.js'])assert.equal(publicPath(name),false,name);
  const files=publicFiles(root);assert.ok(files.includes('content/topic-schema.js'));
  assert.equal(resolvePublicFile(root,'content/topic-schema.js'),path.join(root,'content/topic-schema.js'));
  assert.equal(resolvePublicFile(root,'docs/v3-audit.md'),null);
});
test('lightweight navigation catalog agrees with existing topic IDs and titles',async()=>{
  const {moduleCatalog}=await load('catalog');
  assert.deepEqual(moduleCatalog,loadLegacy().course.modules.map(({id,title})=>({id,title})));
});
test('topic schema adapter preserves assembled content and canonical question and case order',async()=>{
  const {topicsFromLegacy,legacyViews}=await load('legacy-adapter'),{validateTopics}=await load('topic-schema');
  const legacy=loadLegacy(),topics=topicsFromLegacy(legacy),views=legacyViews(topics);
  assert.deepEqual(validateTopics(topics),[]);assert.equal(topics.length,10);
  assert.deepEqual(views.chapters,legacy.handbook.chapters);assert.deepEqual(views.modules,legacy.course.modules);
  assert.deepEqual(views.questions,legacy.course.questions);assert.deepEqual(views.topics,legacy.pedagogy.topics);assert.deepEqual(views.cases,legacy.handbook.cases);
});
test('topic schema rejects broken references, duplicate IDs and incomplete answer feedback',async()=>{
  const {topicsFromLegacy}=await load('legacy-adapter'),{validateTopics}=await load('topic-schema');
  const topics=topicsFromLegacy(loadLegacy());
  topics[0].questions[0].answer=9;topics[0].questions[1].id=topics[0].questions[0].id;
  topics[1].questions[0].options[0].analysis='';topics[1].questions[0].options[1].misconception='personality';
  topics[2].course.connections.push({id:99});
  const errors=validateTopics(topics);
  for(const fragment of ['invalid canonical answer','duplicate question ID','missing feedback','unknown misconception','missing target 99'])assert.ok(errors.some(e=>e.includes(fragment)),fragment);
});
test('productive questions require self-check criteria and an example',async()=>{
  const {topicsFromLegacy}=await load('legacy-adapter'),{validateTopics}=await load('topic-schema');
  const topics=topicsFromLegacy(loadLegacy()),q={id:'productive-1',kind:'productive',module:1,block:0,prompt:'Назовите вытесненное обязательство',criteria:['Есть получатель','Названа цена переноса'],example:'Сверка входа задержится; согласую новый срок с получателем.'};
  topics[0].retrievalQuestions.push(q);assert.deepEqual(validateTopics(topics),[]);
  delete q.example;assert.ok(validateTopics(topics).some(e=>e.includes('criteria and example')));
});
