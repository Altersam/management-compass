const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=id=>import(path.join(root,'assets/games',id+'.js'));
const play=(m,sc,actions)=>{let s=m.create(sc);for(const a of actions){if(s.done)break;const [type,arg]=a;s=m.act(s,{type,arg});}return s;};

test('every game exports the kit contract and renders each scenario',async()=>{
  const {games}=await import(path.join(root,'content/games.js'));
  assert.equal(games.length,13);
  for(const g of games){const m=await load(g.id);
    for(const k of ['create','act','hud','board','result'])assert.equal(typeof m[k],'function',`${g.id}.${k}`);
    assert.ok(m.intro.story&&m.intro.goal&&m.intro.rules.length>=2,g.id);
    assert.equal(m.levels.length,3,g.id);
    for(let sc=0;sc<(m.scenarios||[0]).length;sc++)for(let L=0;L<3;L++){const s=m.create(sc,L);assert.ok(m.hud(s).length);assert.ok(m.board(s).length>100,g.id);}
  }
});

test('project: good decisions earn three stars, ignoring requirements costs quality',async()=>{
  const m=await load('project');
  const run=choices=>{let s=m.create(0),g=0;const done=id=>{const t=s.tasks.find(x=>x.id===id);return t.done>=t.effort;};
    while(!s.done&&g++<40){if(s.modal){s=m.act(s,{type:'choose',arg:choices[s.modal.id]});continue;}
      for(const p of s.people){if(p.away)continue;if(p.energy<=1&&!p.task){p.task='rest';continue;}if(p.task)continue;const ready=s.tasks.filter(t=>t.done<t.effort&&t.deps.every(done));ready.sort((a,b)=>p.skills[b.skill]-p.skills[a.skill]);if(ready[0]&&p.skills[ready[0].skill]>=2)p.task=ready[0].id;}
      s=m.act(s,{type:'next'});}
    return m.result(s);};
  assert.equal(run({e3:'clarify',e5:'manage',e7:'refuse',e9:'keep'}).stars,3);
  assert.ok(run({e3:'ignore',e5:'manage',e7:'present',e9:'skip'}).stars<3);
});

test('detective: right stage and right fix shorten the cycle; hiring does not',async()=>{
  const m=await load('detective');
  const good=play(m,0,[['open','chrono'],['open','load'],['open','method'],['suspect','approve'],['fix','deputy'],['pilot']]);
  assert.equal(m.result(good).stars,3);
  const hire=play(m,0,[['open','complaints'],['enough'],['suspect','work'],['fix','hire'],['pilot']]);
  assert.equal(m.result(hire).stars,1);
});

test('flow: strengthening the constraint first matters',async()=>{
  const m=await load('flow');
  let s=m.create(0);for(let i=0;i<3;i++){s=m.act(s,{type:'action',arg:'person'});s=m.act(s,{type:'stage',arg:m.bottleneck(s)});s=m.act(s,{type:'run'});}
  assert.equal(m.result(s).stars,3);
  let w=m.create(0);for(const st of ['in','out','check']){w=m.act(w,{type:'action',arg:'person'});w=m.act(w,{type:'stage',arg:st});w=m.act(w,{type:'run'});}
  assert.equal(m.result(w).stars,1);
});

test('sprint: goal work beats visible work',async()=>{
  const m=await load('sprint');
  let s=play(m,0,[['add','cause'],['add','base'],['add','tmpl'],['add','train'],['run'],['choose','decline'],['next'],['add','call'],['run'],['choose','trim'],['next']]);
  assert.equal(m.result(s).stars,3);
  let b=play(m,0,[['add','site'],['add','dash'],['add','survey'],['add','base'],['run'],['choose','accept'],['next'],['run'],['choose','keep'],['next']]);
  assert.equal(m.result(b).stars,1);
});

test('meeting: only the pilot that respects every constraint executes',async()=>{
  const m=await load('meeting');
  for(const sc of [0,1]){
    const ok=play(m,sc,[['talk','boss'],['talk','it'],['talk','hr'],['talk','law'],['dial','scope:1'],['dial','time:1'],['dial','train:1'],['commit']]);
    assert.equal(m.result(ok).stars,3);
    const all=play(m,sc,[['meet'],['commit']]);
    assert.equal(m.result(all).stars,1);
  }
});

test('telephone: written channels keep critical conditions, voice loses them',async()=>{
  const m=await load('telephone');
  const mail=play(m,0,['mail','mail','mail','mail'].flatMap(c=>[['channel',c],['send']]));
  assert.ok(m.result(mail).stars>=2);
  const voice=play(m,0,['voice','voice','voice','voice'].flatMap(c=>[['channel',c],['send']]));
  assert.equal(m.result(voice).stars,1);
});

test('ethics, influence, approach, metrics, versions: best path is three stars',async()=>{
  const e=await load('ethics');assert.equal(e.result(play(e,0,[['read','rule'],['read','log'],['basis','rule'],['basis','log'],['toDecide'],['decision','extend'],['principle','same'],['sign']])).stars,3);
  assert.equal(e.result(play(e,1,[['read','oleg'],['read','deputy'],['basis','oleg'],['basis','deputy'],['toDecide'],['decision','visible'],['principle','benefit'],['sign']])).stars,1);
  const i=await load('influence');assert.equal(i.result(play(i,0,[['select','expert'],['scout'],['prepare'],['select','advisor'],['scout'],['prepare'],['select','expert'],['pass'],['select','advisor'],['pass'],['select','dir'],['pass']])).stars,3);
  const formal=play(i,0,[['select','boss'],['scout'],['prepare'],['select','deputy'],['scout'],['prepare'],['select','boss'],['pass'],['select','deputy'],['pass'],['select','dir'],['pass']]);
  assert.equal(i.result(formal).stars,1);
  const a=await load('approach');assert.equal(a.result(play(a,0,[['ap','room:water'],['cad','room:regular'],['ap','app:agile'],['cad','app:often'],['ap','archive:hybrid'],['cad','archive:regular'],['run']])).stars,3);
  assert.equal(a.result(play(a,0,[['ap','room:agile'],['cad','room:rare'],['ap','app:water'],['cad','app:rare'],['ap','archive:water'],['cad','archive:rare'],['run']])).stars,1);
  const mx=await load('metrics');assert.equal(mx.result(play(mx,0,[['check','cases'],['check','repeat'],['check','method'],['diag','gaming'],['fix','pair'],['next']])).stars,3);
  const v=await load('versions');assert.equal(v.result(play(v,0,[['clue','sign'],['clue','registry'],['pick','final'],['after','notify'],['confirm']])).stars,3);
  assert.equal(v.result(play(v,1,[['clue','dates'],['pick','final2'],['after','rename'],['confirm']])).stars,1);
});

test('change: well-aimed measures move groups, misses and neglect cost progress',async()=>{
  const m=await load('change');
  let s=m.create(0);
  while(!s.done){if(s.ap===0){s=m.act(s,{type:'endWave'});continue;}const c=s.groups.filter(g=>g.stage<5).sort((a,b)=>(5-a.stage)-(5-b.stage));const g=c.find(x=>x.stage===4)||c[0];if(!g){s=m.act(s,{type:'endWave'});continue;}s=m.act(s,{type:'select',arg:g.id});s=m.act(s,{type:m.ACTIONS[g.stage][0]});}
  assert.equal(m.result(s).stars,3);
  let w=m.create(0);while(!w.done){if(w.ap===0){w=m.act(w,{type:'endWave'});continue;}w=m.act(w,{type:'select',arg:'teach'});w=m.act(w,{type:'train'});}
  assert.equal(m.result(w).stars,1);
});

test('day: plan by consequences earns three stars on every level, a cluttered day earns one',async()=>{
  const m=await load('day');
  const go=(L,plan,del,drop)=>{let s=m.create(0,L);for(const [id,i] of plan){s=m.act(s,{type:'pick',arg:id});s=m.act(s,{type:'slot',arg:String(i)});}
    for(const id of del){s=m.act(s,{type:'pick',arg:id});s=m.act(s,{type:'delegate'});}for(const id of drop){s=m.act(s,{type:'pick',arg:id});s=m.act(s,{type:'drop'});}
    return m.result(m.act(s,{type:'run'})).stars;};
  assert.equal(go(0,[['strat',0],['report',2],['talk',3],['mail',4]],['spr'],['news']),3);
  assert.equal(go(1,[['strat',0],['report',2],['talk',3],['plan',4]],['spr'],['news','meet','mail']),3);
  assert.equal(go(2,[['strat',0],['rector',2],['talk',3],['report',4]],['spr','train'],['news','meet','mail']),3);
  assert.equal(go(2,[['news',0],['mail',1],['strat',4],['report',6],['talk',3],['rector',2]],[],[]),1);
});
test('levels tighten resources but the best strategy can still earn three stars',async()=>{
  const d=await load('detective');let q=d.create(0,2);for(const [x,y] of [['open','chrono'],['open','load'],['suspect','approve'],['fix','deputy'],['pilot']])q=d.act(q,{type:x,arg:y});assert.equal(d.result(q).stars,3);
  const t=await load('telephone');let s=t.create(0,2);for(const c of ['mail','mail','mail','meet']){s=t.act(s,{type:'channel',arg:c});s=t.act(s,{type:'send'});}assert.equal(t.result(s).stars,3);
  const sp=await load('sprint');let p=sp.create(0,2);for(const [a,b] of [['add','cause'],['add','base'],['add','tmpl'],['add','train'],['run'],['choose','decline'],['next'],['add','call'],['run'],['choose','trim'],['next']]){if(p.done)break;p=sp.act(p,{type:a,arg:b});}assert.equal(sp.result(p).stars,3);
});
