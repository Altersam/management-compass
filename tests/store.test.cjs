const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createStore,blank}=require('../assets/store.js');
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
