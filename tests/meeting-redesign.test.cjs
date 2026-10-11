const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../assets/arcade/meeting.js'),{roomMarkup,inferredRoom,meetingGaps}=require('../assets/arcade/meeting-room.js'),{createStore}=require('../assets/store.js');
const act=(s,type,value)=>G.act(s,{type,value});
function prepared(){let s=G.create();for(const [person,question] of [['it','constraint'],['finance','constraint'],['ops','fact'],['legal','constraint'],['owner','authority']]){s=act(s,'person',person);s=act(s,'ask',question);}return s;}
test('every new question costs four minutes and repeat answers neither add time nor transcript',()=>{
  let s=G.create();for(const [person,question] of [['it','fact'],['it','constraint'],['it','authority'],['it','option'],['finance','fact'],['finance','constraint'],['ops','fact']]){s=act(s,'person',person);const before=s.minutes,messages=s.messages.length;s=act(s,'ask',question);assert.equal(s.minutes,before+4);assert.equal(s.messages.length,messages+1);const repeat=act(s,'ask',question);assert.equal(repeat.minutes,s.minutes);assert.deepEqual(repeat.messages,s.messages);}
  assert.equal(s.minutes,28);s=act(s,'person','legal');assert.throws(()=>act(s,'ask','fact'),/Время встречи/);assert.equal(s.minutes,28);
});
test('plan and owner keep their original choices and constraints across both scenarios',()=>{
  for(const urgent of [true,false])for(const plan of ['pilot','full','delay'])for(const owner of G.people.map(p=>p.id)){let s={...prepared(),urgent};s=act(s,'plan',plan);s=act(s,'owner',owner);const r=G.evaluate(s),cost=plan==='pilot'?18:plan==='full'?30:24,days=plan==='pilot'?2:plan==='full'?5:10;assert.equal(s.plan,plan);assert.equal(s.owner,owner);assert.equal(r.cost,cost);assert.equal(r.days,days);assert.equal(r.viable,owner==='owner'&&cost<=(urgent?24:35)&&(plan==='delay'||days<=(urgent?2:6))&&days<=(urgent?7:12));}
});
test('first incomplete commit preserves conversation, adds three minutes and permits return',()=>{
  let s=G.create();s=act(s,'ask','constraint');const before=structuredClone(s);s=act(s,'commit');assert.equal(s.phase,'playing');assert.equal(s.minutes,7);assert.equal(s.attempts.length,1);assert.equal(s.turn,1);assert.deepEqual(s.messages,before.messages);assert.deepEqual(s.known,before.known);assert.equal(inferredRoom(s).showGap,true);assert.ok(meetingGaps(s).length<=2);assert.match(roomMarkup(s),/Вернуться к разговору/);s=act(s,'commit');assert.equal(s.phase,'ended');assert.equal(s.attempts.length,2);assert.equal(s.minutes,10);
});
test('executable commit ends on first attempt and time cap still terminates a weak meeting',()=>{
  let s=act(prepared(),'owner','owner');s=act(s,'commit');assert.equal(s.phase,'ended');assert.equal(s.minutes,23);assert.equal(s.attempts.length,1);assert.equal(s.attempts[0].viable,true);
  let late=G.create();for(const q of ['fact','constraint','authority','option'])late=act(late,'ask',q);late=act(late,'person','finance');for(const q of ['fact','constraint','authority'])late=act(late,'ask',q);late=act(late,'commit');assert.equal(late.minutes,30);assert.equal(late.phase,'ended');assert.equal(late.attempts.length,1);assert.equal(late.attempts[0].viable,false);
});
test('room is a meeting with one visible reply and a collapsed transcript, never selects',()=>{
  let s=prepared();s=act(s,'person','it');const html=roomMarkup(s);assert.equal((html.match(/class="meeting-bubble"/g)||[]).length,1);assert.match(html,/Что реально происходит/);assert.match(html,/Разговор · 5 реплик/);assert.doesNotMatch(html,/<select|arcade-form/);assert.match(html,/Зафиксировать решение/);assert.equal(inferredRoom(G.create()).ownerPicked,false);
});
test('legacy save, selected plan/owner and unknown data survive read-only presentation and backup',()=>{
  const map=new Map(),store=createStore({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}),id=store.active();let s=prepared();s=act(s,'plan','delay');s=act(s,'owner','finance');s.custom='сохранить';const before=structuredClone(s);assert.ok(G.validate(s));roomMarkup(s);assert.deepEqual(s,before);assert.equal(inferredRoom(s).ownerPicked,true);store.update(id,d=>{d.course.arcadeGames={meeting:s};d.course.arcadeArchives={meeting:[act(s,'commit')]};});const copy=store.import(JSON.parse(JSON.stringify(store.export(id)))),c=store.profile(copy).data.course;assert.deepEqual(c.arcadeGames.meeting,s);assert.equal(c.arcadeArchives.meeting[0].plan,'delay');assert.equal(c.arcadeArchives.meeting[0].owner,'finance');assert.equal(c.arcadeArchives.meeting[0].custom,'сохранить');
});
test('final replay uses only asked questions and actual attempts without fabricated conditions',()=>{
  let s=G.create();s=act(s,'ask','fact');s=act(s,'commit');s=act(s,'commit');const html=G.renderReport(s);assert.match(html,/Встреча заняла 10 мин/);assert.match(html,/Две попытки фиксации/);assert.match(html,/Интеграция зависит от тестового доступа/);assert.doesNotMatch(html,/В распоряжении проекта/);assert.match(html,/Существенные условия исполнения ещё не подтверждены/);assert.doesNotMatch(html,/arcade-result-metrics/);
});
