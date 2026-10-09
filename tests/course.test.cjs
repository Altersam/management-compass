const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../assets/course-model.js');
const {createStore,blank}=require('../assets/store.js');
const root=path.resolve(__dirname,'..'),context={};context.window=context;
for(const name of ['content','knowledge','visuals','course-data','course-questions'])vm.runInNewContext(fs.readFileSync(path.join(root,`assets/${name}.js`),'utf8'),context);
const course=JSON.parse(JSON.stringify(context.COURSE));
const questions=course.questions[6];
function answered(data,count=5){const m=M.ensure(data,6);questions.forEach((q,i)=>m.answers[q.id]=i<count?q.answer:(q.answer+1)%q.options.length);return m;}
function learned(data){const m=M.ensure(data,6);m.diagnostic={choice:0};m.visited=['theory-0','theory-1','theory-2','technique','practice'];m.transferEntryId='application';return m;}
test('course has 50 contextual mini-test questions with useful feedback and 10 final stages',()=>{
  assert.equal(course.modules.length,10);assert.equal(course.finalQuestions.length,10);
  const all=Object.values(course.questions).flat();assert.equal(all.length,50);assert.equal(new Set(all.map(q=>q.id)).size,50);
  for(const m of course.modules){assert.equal(m.goals.length,4);assert.equal(m.thoughts.length,3);assert.equal(m.examples.length,3);assert.equal(m.rubric.length,3);assert.ok(m.adizes.text.length>80);assert.equal(course.questions[m.id].length,5);m.visuals.forEach(id=>assert.ok(context.Visuals.definitions[id]));}
  for(const q of [...all,...course.finalQuestions]){assert.equal(q.options.length,3);assert.ok(q.answer>=0&&q.answer<3);assert.ok(q.block>=0&&q.block<=2);q.options.forEach(o=>{assert.ok(o.text&&o.appeal&&o.analysis);});}
});
test('legacy profile data starts with zero learning progress without losing old notes or worksheets',()=>{
  const old={journal:[{title:'Существующая запись'}],worksheets:{taskForm:{result:'Существующий результат'}},caseAnswers:{focus:{choice:1,correct:true}}};
  const before=JSON.stringify(old);assert.equal(M.report(old,6,questions).progress,0);assert.equal(JSON.stringify(old),before);
  M.mark(old,6,'theory-0');assert.equal(old.journal[0].title,'Существующая запись');assert.equal(old.worksheets.taskForm.result,'Существующий результат');
});
test('correct quiz alone does not certify module mastery without learning and application',()=>{
  const d=blank();answered(d);const result=M.submit(d,6,questions);assert.equal(result.score,5);assert.equal(M.report(d,6,questions).mastered,false);assert.ok(M.report(d,6,questions).missing.includes('План в личном дневнике'));
});
test('mastery needs a 4/5 attempt and all core learning steps',()=>{
  const d=blank();learned(d);answered(d,3);M.submit(d,6,questions);assert.equal(M.report(d,6,questions).mastered,false);
  answered(d,4);M.submit(d,6,questions);assert.equal(M.report(d,6,questions).mastered,true);assert.equal(M.report(d,6,questions).progress,100);
});
test('incomplete quiz does not create an attempt and wrong answers identify concrete blocks',()=>{
  const d=blank();answered(d,2);delete M.ensure(d,6).answers[questions[4].id];assert.equal(M.submit(d,6,questions).complete,false);assert.equal(M.moduleState(d,6).attempts.length,0);
  answered(d,2);const result=M.submit(d,6,questions);assert.equal(result.score,2);assert.deepEqual(result.wrong,questions.slice(2).map(q=>q.id));
});
test('earned mastery survives later practice attempts while latest feedback stays separate',()=>{
  const d=blank();learned(d);answered(d);M.submit(d,6,questions);answered(d,2);M.submit(d,6,questions);assert.equal(M.report(d,6,questions).mastered,true);assert.equal(M.report(d,6,questions).last.score,2);
});
test('profile export preserves both course and working navigator data; old backups remain importable',()=>{
  const values=new Map(),s=createStore({getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}),id=s.active();
  s.update(id,d=>{learned(d);answered(d,4);M.submit(d,6,questions);d.worksheets.taskForm={result:'Рабочий результат'};});
  const cloned=s.import(JSON.parse(JSON.stringify(s.export(id))));assert.equal(M.report(s.profile(cloned).data,6,questions).mastered,true);assert.equal(s.profile(cloned).data.worksheets.taskForm.result,'Рабочий результат');
  const backup=JSON.parse(JSON.stringify(s.export(id)));delete backup.data.course;const oldId=s.import(backup);assert.equal(M.report(s.profile(oldId).data,6,questions).progress,0);assert.equal(s.profile(oldId).data.worksheets.taskForm.result,'Рабочий результат');
});
test('module six cross-links address communication, documents, process and change',()=>assert.deepEqual(course.modules[5].connections.map(x=>x.id),[5,7,8,9]));
