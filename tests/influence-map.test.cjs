const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../assets/arcade/influence.js'),{mapMarkup}=require('../assets/arcade/influence-map.js'),{createStore}=require('../assets/store.js');
const act=(s,type,value,extra={})=>G.act(s,{type,value,...extra});
function edge(s,from,to,kind){for(const [type,value] of Object.entries({from,to,kind}))s=act(s,type,value);return act(s,'edge');}
function researched(){let s=G.create();for(const id of ['resource','information','authority','application']){s=act(s,'observe',id);const o=G.observations.find(o=>o.id===id);s=edge(s,o.from,o.to,o.kind);}return s;}
test('observations cost once, clues do not automatically create edges and new coalition has no suggested director',()=>{
  let s=G.create();assert.deepEqual(s.coalition,[]);s=act(s,'observe','resource');assert.equal(s.budget,3);assert.equal(s.edges.length,0);const again=act(s,'observe','resource');assert.equal(again.budget,3);assert.deepEqual(again.opened,['resource']);assert.match(mapMarkup(s),/контролирует доступ/);
  for(const id of ['trust','price','application'])s=act(s,'observe',id);assert.equal(s.budget,0);assert.throws(()=>act(s,'observe','authority'),/исчерпан/);assert.equal(act(s,'observe','price').budget,0);
});
test('unsupported directed links remain editable and only opened matching observations confirm them',()=>{
  let s=edge(G.create(),'it','lead','resource');assert.ok(G.validate(s));assert.equal(G.evaluate(s).falseEdges,1);s=act(s,'observe','resource');assert.equal(G.evaluate(s).falseEdges,1);s=edge(s,'lead','it','resource');assert.equal(G.evaluate(s).correct,1);assert.throws(()=>edge(s,'lead','it','resource'),/уже есть/);s=act(s,'remove',undefined,{index:0});assert.equal(s.edges.length,1);assert.deepEqual(s.edges[0],{from:'lead',to:'it',kind:'resource'});
});
test('insufficient support shows a gap without ending or losing the map; revised viable support ends',()=>{
  let s=researched();const before=structuredClone(s);s=act(s,'implement');assert.equal(s.phase,'playing');assert.equal(s.turn,0);assert.equal(s.implementationFeedback,true);assert.deepEqual(s.edges,before.edges);assert.deepEqual(s.opened,before.opened);assert.equal(s.budget,0);assert.match(G.gap(s),/стороны/);assert.doesNotMatch(G.gap(s),/Операции/);
  for(const id of ['lead','it','anna','ops'])s=act(s,'coalition',id);assert.deepEqual(G.evaluate(s),{covered:['lead','it','anna','ops'],viable:true,correct:4,falseEdges:0});s=act(s,'implement');assert.equal(s.phase,'ended');assert.equal(s.turn,1);
});
test('unresolved investigation can be explicitly recorded after feedback without inventing viability',()=>{
  let s=G.create();s=act(s,'observe','trust');s=act(s,'observe','price');s=edge(s,'anna','ops','information');s=edge(s,'finance','lead','information');s=act(s,'coalition','director');assert.throws(()=>act(s,'finishReview'),/Сначала/);s=act(s,'implement');assert.equal(s.phase,'playing');s=act(s,'finishReview');assert.equal(s.phase,'ended');assert.equal(G.evaluate(s).viable,false);assert.match(G.renderReport(s),/есть разрыв/);
});
test('legacy revision one, director selection, unknown fields, archives and evaluation survive backup',()=>{
  const map=new Map(),store=createStore({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}),id=store.active();let s=researched();s.coalition=['director','lead','it','anna','ops'];s.customFact='сохранить';assert.ok(G.validate(s));const before=structuredClone(s);mapMarkup(s);assert.deepEqual(s,before);s=act(s,'implement');assert.equal(s.phase,'ended');
  store.update(id,d=>{d.course.arcadeGames={influence:s};d.course.arcadeArchives={influence:[s]};});const copy=store.import(JSON.parse(JSON.stringify(store.export(id)))),data=store.profile(copy).data.course;assert.deepEqual(data.arcadeGames.influence,s);assert.deepEqual(G.evaluate(data.arcadeGames.influence),G.evaluate(s));assert.deepEqual(data.arcadeArchives.influence,[s]);assert.equal(data.arcadeGames.influence.customFact,'сохранить');
});
test('final markup includes the player map, directed text, selected roles and unconfirmed evidence',()=>{
  let s=researched();s=edge(s,'ops','anna','authority');s=act(s,'implement');s=act(s,'finishReview');const html=G.renderReport(s);assert.match(html,/Ваша карта/);assert.match(html,/Операции → Право решения → Анна/);assert.match(html,/нет открытого подтверждения/);assert.match(html,/Что вы предположили/);assert.match(html,/CAPI/);assert.doesNotMatch(G.render(G.create()),/CAPI/);
});
