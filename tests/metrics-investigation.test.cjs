const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../assets/arcade/metrics.js'),{createStore}=require('../assets/store.js');
const act=(s,type,value)=>M.act(s,{type,value});
function draft(ids=['channels','unfinished'],conclusion='success'){
  let s=M.create();for(const id of ids)s=act(s,'inspect',id);s=act(s,'conclusion',conclusion);s=act(s,'next','users');return act(s,'note','Среднее закрытых заявок не подтверждает улучшение всего сервиса.');
}
test('original samples, averages and lower bounds remain unchanged',()=>{
  const s=M.create(),narrow=M.calculate(s),all=M.calculate({...s,channel:'all',pending:true});
  assert.deepEqual(M.samples,[{id:'fast',channel:'system',count:50,time:12,closed:true},{id:'complex',channel:'system',count:10,time:50,closed:true},{id:'mail',channel:'mail',count:20,time:90,closed:true},{id:'pending',channel:'mail',count:20,time:120,closed:false}]);
  assert.deepEqual(narrow,{mean:18.33,lower:18.33,count:60,closedCount:60,unfinished:0,before:46.4,repeatsBefore:8,repeatsAfter:15});
  assert.deepEqual(all,{mean:36.25,lower:53,count:100,closedCount:80,unfinished:20,before:46.4,repeatsBefore:8,repeatsAfter:15});
  const html=M.render(s);assert.match(html,/18,3/);assert.match(html,/60,5%/);assert.doesNotMatch(html,/metric-probes|textarea|select|Повторные|Знаменатель/);
});
test('each new question costs one, repeated questions stay readable at exhausted budget',()=>{
  let s=M.create();for(const [i,id] of ['period','distribution','denominator','repeats'].entries()){const before=structuredClone(s);s=act(s,'inspect',id);assert.equal(s.budget,3-i);assert.equal(before.opened.length,i);assert.ok(M.validate(s));const reread=act(s,'inspect',id);assert.equal(reread.budget,s.budget);assert.deepEqual(reread.opened,s.opened);}
  assert.throws(()=>act(s,'inspect','channels'),/использованы/);assert.equal(act(s,'inspect','period').budget,0);
});
test('contextual actions reveal population and waiting without changing the calculation',()=>{
  let s=act(M.create(),'inspect','channels');assert.match(M.render(s),/Показать весь поток/);assert.doesNotMatch(M.render(s),/Добавить незавершённые|metric-breakdown|metric-population/);
  s=act(s,'channel','all');assert.equal(M.calculate(s).mean,36.25);assert.equal(M.calculate(s).closedCount,80);assert.equal(s.budget,3);
  s=act(s,'inspect','unfinished');s=act(s,'pending',true);assert.equal(s.pending,true);assert.match(M.render(s),/≥53 мин/);assert.equal(s.budget,2);
  const narrowWaiting=act(act(M.create(),'inspect','unfinished'),'pending',true);assert.equal(M.calculate(narrowWaiting).mean,18.33);assert.match(M.render(narrowWaiting),/≥53 мин/,'the waiting observation explicitly covers the whole flow');
});
test('distribution exposes only data whose question was opened',()=>{
  let s=act(M.create(),'inspect','distribution');assert.match(M.render(s),/50 быстрых/);assert.match(M.render(s),/10 сложных/);assert.doesNotMatch(M.render(s),/20 писем|20 незавершённых/);
  s=act(s,'inspect','channels');s=act(s,'inspect','distribution');assert.match(M.render(s),/20 писем/);assert.doesNotMatch(M.render(s),/20 незавершённых/);
  s=act(s,'inspect','unfinished');s=act(s,'inspect','distribution');assert.match(M.render(s),/20 незавершённых/);assert.match(M.render(s),/≥120 мин/);assert.equal(s.budget,1);
});
test('any two different probes can lead to a qualified conclusion',()=>{
  for(let i=0;i<M.probes.length;i++)for(let j=i+1;j<M.probes.length;j++){
    let s=act(M.create(),'inspect',M.probes[i][0]);assert.throws(()=>act(s,'formulate'),/две проверки/);s=act(s,'inspect',M.probes[j][0]);s=act(s,'formulate');assert.equal(s.investigation.stage,'conclusion');s=act(s,'conclusion','hypothesis');s=act(s,'next','charts');s=act(s,'note','Изменилось среднее выбранных закрытых, весь сервис пока не оценён.');s=act(s,'decide');assert.equal(s.phase,'ended');assert.ok(M.validate(s));
  }
});
test('strong conclusions trigger one corrective loop while retaining evidence and authored text',()=>{
  for(const conclusion of ['success','failure']){
    let s=draft(undefined,conclusion);const before=structuredClone(s);s=act(s,'decide');assert.equal(s.phase,'playing');assert.equal(s.turn,0);assert.equal(s.investigation.correction,true);assert.deepEqual(s.opened,before.opened);assert.equal(s.note,before.note);assert.equal(s.budget,2);assert.match(M.render(s),/Вывод сильнее имеющихся данных/);
    s=act(s,'recheck');s=act(s,'inspect','denominator');s=act(s,'formulate');s=act(s,'conclusion',conclusion);s=act(s,'next','users');s=act(s,'decide');assert.equal(s.phase,'ended','after reflection an authored conclusion can be confirmed, not AI-graded');assert.equal(s.turn,1);assert.deepEqual(s.opened,['channels','unfinished','denominator']);
  }
});
test('exhausted budget permits revision and a normal back action never bypasses corrective feedback',()=>{
  let s=draft(['channels','unfinished','denominator','period'],'failure');s=act(s,'decide');assert.match(M.render(s),/Пересмотреть формулировку/);s=act(s,'reconsider');s=act(s,'conclusion','hypothesis');s=act(s,'next','users');s=act(s,'decide');assert.equal(s.phase,'ended');assert.equal(s.budget,0);
  let fresh=draft();fresh=act(fresh,'recheck');fresh=act(fresh,'decide');assert.equal(fresh.investigation.correction,true);
});
test('legacy saves and current investigation drafts round-trip with the same calculations and unknown fields',()=>{
  const map=new Map(),store=createStore({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}),id=store.active();
  let legacy=draft(undefined,'hypothesis');delete legacy.investigation;legacy.customFact='сохранить';assert.ok(M.validate(legacy));const before=structuredClone(legacy);assert.equal(M.investigation(legacy).stage,'write');assert.match(M.render(legacy),/Среднее закрытых заявок/);assert.deepEqual(legacy,before);
  const ended=act(legacy,'decide');assert.equal(ended.phase,'ended');assert.equal(ended.customFact,'сохранить');
  const revised=act(draft(),'decide');store.update(id,d=>{d.course.arcadeGames={metrics:revised};d.course.arcadeArchives={metrics:[ended]};});const copy=store.import(JSON.parse(JSON.stringify(store.export(id)))),data=store.profile(copy).data.course;
  assert.deepEqual(data.arcadeGames.metrics,revised);assert.deepEqual(M.calculate(data.arcadeGames.metrics),M.calculate(revised));assert.ok(M.validate(data.arcadeGames.metrics));assert.deepEqual(M.report(data.arcadeArchives.metrics[0]),M.report(ended));
});
test('text limits and final review preserve authored text and list only opened questions',()=>{
  let s=draft(['period','distribution'],'hypothesis');s=act(s,'note','<img src=x onerror=alert(1)> '+ 'А'.repeat(2100));assert.equal(s.note.length,2000);s=act(s,'decide');const html=M.renderReport(s);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.match(html,/Сопоставимы ли периоды/);assert.doesNotMatch(html,/<li>Другие каналы<\/li>/);assert.match(html,/60 \/ 100/);
});
