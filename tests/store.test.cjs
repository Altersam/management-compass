const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createStore,blank,migrateProfile}=require('../assets/store.js');
function memory(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}
test('profiles isolate diary, worksheets, case answers and model reflections',()=>{
  const adapter=memory(),s=createStore(adapter),a=s.add('А'),b=s.add('Б');
  s.journal(a,{title:'Запись А',situation:'Факт'});
  s.update(a,d=>{d.worksheets.taskForm={result:'Результат А'};d.caseAnswers.focus={choice:1,correct:true};d.assessments.paei={values:[5,4,3]};});
  assert.equal(s.profile(b).data.journal.length,0);assert.deepEqual(s.profile(b).data.worksheets,{});
  const reopened=createStore(adapter);assert.equal(reopened.profile(a).data.journal[0].title,'Запись А');assert.equal(reopened.profile(a).data.assessments.paei.values[0],5);
});
test('shared pages merge mutations against current stored profile',()=>{
  const adapter=memory(),first=createStore(adapter),second=createStore(adapter),id=first.active();
  first.update(id,d=>d.worksheets.first={text:'A'});second.update(id,d=>d.worksheets.second={text:'B'});
  assert.equal(first.profile(id).data.worksheets.first.text,'A');assert.equal(first.profile(id).data.worksheets.second.text,'B');
});
test('full export and import preserves all data in a new profile',()=>{
  const s=createStore(memory()),id=s.add('Мой профиль');s.journal(id,{situation:'Ситуация',title:'Наблюдение'});s.update(id,d=>{d.favorites=[8];d.caseReflections.focus='Рефлексия';d.worksheets['chapter-8-process']={field0:'Начало'};d.assessments.capi={values:{authority:2}};});
  const backup=JSON.parse(JSON.stringify(s.export(id)));const restored=s.import(backup);
  assert.notEqual(restored,id);assert.deepEqual(s.profile(restored).data,s.profile(id).data);assert.equal(s.profiles().length,3);
});
test('invalid import does not create or modify profiles',()=>{
  const s=createStore(memory()),count=s.profiles().length;
  assert.throws(()=>s.import({format:'management-compass-profile',version:1,profile:{name:'X'},data:{...blank(),journal:[{date:'bad'}]}}));
  assert.equal(s.profiles().length,count);assert.equal(s.profile().data.journal.length,0);
});
test('diary import is validated and duplicate entry IDs are ignored',()=>{
  const s=createStore(memory()),id=s.active();const e=s.journal(id,{title:'Одна',situation:'Факт'});
  s.importDiary(id,{format:'management-compass-diary',version:1,journal:[e,e]});assert.equal(s.profile(id).data.journal.length,1);
});
test('quota failure keeps in-memory notes for export instead of reloading old data',()=>{
  const adapter=memory();let fail=false;const store=createStore({getItem:adapter.getItem,setItem:(k,v)=>{if(fail)throw new Error('Quota');adapter.setItem(k,v);}});
  store.journal('personal',{title:'Старая',situation:'Факт'});fail=true;store.journal('personal',{title:'Новая',situation:'Факт'});
  assert.equal(store.persistent,false);assert.equal(store.export('personal').data.journal.length,2);
});
test('unavailable storage keeps separate in-memory profiles and export',()=>{
  const s=createStore({getItem(){throw new Error('Blocked');},setItem(){throw new Error('Blocked');}});
  const id=s.add('Без хранилища');s.journal(id,{title:'Сохранить в файл',situation:'Факт'});
  assert.equal(s.persistent,false);assert.equal(s.export(id).data.journal.length,1);assert.equal(s.profile('personal').data.journal.length,0);
});
test('deleting a profile does not erase another profile and last profile is retained',()=>{
  const s=createStore(memory()),id=s.add('Второй');s.journal('personal',{title:'Сохранить',situation:'Факт'});s.remove(id);
  assert.equal(s.profile('personal').data.journal[0].title,'Сохранить');assert.throws(()=>s.remove('personal'));
});
test('v3 migration is additive, idempotent and leaves canonical answers and old simulation intact',()=>{
  const legacy={favorites:[6],journal:[],worksheets:{taskForm:{result:'Старый план'}},course:{modules:{6:{answers:{'m6-q3':1},attempts:[{score:4,total:5}],legacyCompleted:true}},optionOrders:{'v2-m6-q3':[2,0,1]},final:{answers:{final1:2}},simulation:{revision:2,decisions:['tight-check']},simulationArchive:[{revision:2,decisions:[]}]},extension:{source:'user'}};
  const before=JSON.stringify(legacy),migrated=migrateProfile(legacy);
  assert.equal(JSON.stringify(legacy),before);assert.equal(migrated.dataVersion,3);
  assert.deepEqual(migrated.course,legacy.course);assert.deepEqual(migrated.worksheets,legacy.worksheets);
  assert.deepEqual(migrateProfile(migrated),migrated);assert.deepEqual(migrated.experiments,[]);
  const adapter=memory();adapter.setItem('management-compass:v1',JSON.stringify({version:1,active:'personal',profiles:[{id:'personal',name:'Старый',data:legacy}]}));
  const store=createStore(adapter);assert.deepEqual(store.profile().data,migrated);
  store.update('personal',d=>d.extension.checked=true);
  assert.equal(JSON.parse(adapter.getItem('management-compass:v1')).profiles[0].data.dataVersion,3);
});
test('backup round-trip preserves added fields at profile, journal and experiment levels',()=>{
  const store=createStore(memory()),id=store.active();
  store.journal(id,{title:'Наблюдение',evidence:{count:7}});
  store.update(id,d=>{d.teamMap={actors:[{id:'expert',evidence:'Проверил расчёт'}]};d.experiments=[{id:'e1',action:'Проверить',place:'Команда',reviewDate:'2026-11-01',topic:3,outcome:null,why:'',journalEntryId:null,createdAt:'',updatedAt:'',hypothesis:'Зависимость от одного эксперта',observations:'Пять остановок',nextChange:'Дать резерву часть случаев',extra:{sample:[1,2]}}];});
  const restored=store.import(JSON.parse(JSON.stringify(store.export(id))));
  assert.deepEqual(store.profile(restored).data,store.profile(id).data);
});
test('nested unsafe keys and future data versions are rejected before profile creation',()=>{
  const store=createStore(memory()),backup=store.export(store.active()),count=store.profiles().length;
  const bad=JSON.parse(JSON.stringify(backup));bad.data.worksheets=JSON.parse('{"map":{"__proto__":{"polluted":true}}}');
  assert.throws(()=>store.import(bad),/Недопустимое/);assert.equal(store.profiles().length,count);
  assert.throws(()=>store.import({...backup,data:{...backup.data,dataVersion:4}}),/версия/);
  assert.equal(store.profiles().length,count);assert.equal({}.polluted,undefined);
});
