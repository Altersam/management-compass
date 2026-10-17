const {test}=require('node:test');
const assert=require('node:assert/strict');
const {composeEntry,summarize}=require('../assets/diary.js');
const {createStore}=require('../assets/store.js');
const {theoryBlocks}=require('../content/theory-blocks.js');
function memory(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}

test('quick diary entry is built from choices and passes store validation',()=>{
  const e=composeEntry({topic:2,situation:'Узнал о проблеме слишком поздно',rating:2,helped:[],blocked:['Поздно узнал'],next:'Поставить контрольную точку',note:'',date:'2026-10-17'});
  assert.equal(e.title,'Узнал о проблеме слишком поздно');
  assert.equal(e.situation,'Результат и контроль: Узнал о проблеме слишком поздно');
  assert.equal(e.learning,'Мешало: Поздно узнал');
  assert.equal(e.action,'Поставить контрольную точку');
  const s=createStore(memory()),id=s.active();s.journal(id,e);
  const reopened=s.export(id);assert.equal(reopened.data.journal[0].topic,2);assert.deepEqual(reopened.data.journal[0].quick.blocked,['Поздно узнал']);
});

test('re-tagging a legacy free-text entry keeps its original text and unknown fields',()=>{
  const legacy={id:'old',date:'2026-10-01',type:'Рефлексия',title:'Прежняя запись',situation:'Старые факты',learning:'Вывод',action:'',rating:4,evidence:{count:3}};
  const once=composeEntry({topic:5,situation:'Письмо осталось без ответа',rating:3,helped:['Ясный результат'],blocked:[],next:'',note:'',date:'2026-10-01'},legacy);
  const twice=composeEntry({topic:5,situation:'Поручение поняли по-разному',rating:3,helped:[],blocked:[],next:'',note:'',date:'2026-10-01'},once);
  for(const e of [once,twice]){assert.match(e.situation,/Старые факты/);assert.match(e.learning,/Вывод/);assert.equal(e.type,'Рефлексия');assert.deepEqual(e.evidence,{count:3});}
});

test('summary counts topics, factors, the last week and the rating trend',()=>{
  const now=new Date('2026-10-17T12:00:00Z');
  const entries=[
    {date:'2026-10-16',rating:2,topic:2,quick:{helped:[],blocked:['Перегрузка']}},
    {date:'2026-10-15',rating:4,topic:2,quick:{helped:['Ясный результат'],blocked:['Перегрузка']}},
    {date:'2026-09-01',rating:3,title:'Старая запись'}
  ];
  const s=summarize(entries,now);
  assert.equal(s.total,3);assert.equal(s.week,2);assert.equal(s.byTopic[2],2);
  assert.deepEqual(s.blocked[0],['Перегрузка',2]);assert.deepEqual(s.trend,[3,4,2]);assert.equal(s.average,3);
});

test('every theory section has a visual block of a known type',()=>{
  const types=new Set(['compare','table','cards','flow','matrix','scale','checklist','raci']);
  for(const [topic,t] of Object.entries(theoryBlocks)){
    assert.equal(t.base.length,3,`topic ${topic}`);
    for(const b of [...t.base,...Object.values(t.depth)].flat()){assert.ok(types.has(b.type),`${topic}: ${b.type}`);assert.ok(b.title,`${topic} block title`);}
  }
});
