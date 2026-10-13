const {test}=require('node:test'),assert=require('node:assert/strict');
const {templates}=require('../assets/change-network/templates.js'),{generateScenario}=require('../assets/change-network/generator.js'),{validateScenario}=require('../assets/change-network/validator.js'),{witnessScenario}=require('../assets/change-network/witness.js');
const {create,act,validate}=require('../assets/change-network/state.js'),{bestTool}=require('../assets/change-network/barriers.js'),{influenceFrames}=require('../assets/change-network/influence.js'),{metrics,stable}=require('../assets/change-network/adoption.js'),{selectEvent}=require('../assets/change-network/events.js');
const {createStore}=require('../assets/store.js');
function finishAnimation(s){while(['wave','consolidation'].includes(s.phase))s=act(s,{type:'tick'});if(s.phase==='event')s=act(s,{type:'decision',choice:({rumor:'listen',sabotage:'diagnose',overload:'resource',envy:'share'})[s.pendingEvent.kind]});return s;}
function strategy(seed,mode='targeted'){
  let s=act(create(seed),{type:'open'});
  for(let w=1;w<=4;w++){
    if(mode==='targeted'&&w===1){s=act(s,{type:'select',id:s.scenario.hub});for(const id of ['diagnose',bestTool(s.nodes.find(n=>n.id===s.selected)),'champion'])s=act(s,{type:'intervene',id});}
    let guard=0;while(s.actionsLeft>0&&guard++<12){
      const n=mode==='targeted'?[...s.nodes].filter(n=>!n.resolved).sort((a,b)=>b.influence-a.influence||a.adoption-b.adoption)[0]:s.nodes[(guard+w)%s.nodes.length];if(!n)break;
      if(mode==='targeted'&&s.actionsLeft<2&&!n.barrierKnown)break;s=act(s,{type:'select',id:n.id});if(mode==='targeted'&&!n.barrierKnown)s=act(s,{type:'intervene',id:'diagnose'});if(!s.actionsLeft)break;s=act(s,{type:'intervene',id:mode==='targeted'?bestTool(n):mode});
    }
    s=finishAnimation(act(s,{type:'run'}));
  }
  const immediately=metrics(s.nodes,s.scenario.threshold);for(let i=0;i<2;i++)s=finishAnimation(act(s,{type:'observe'}));return {s,immediately};
}
test('24 templates times three variants cover six topologies and all nine barriers with valid solvable networks',()=>{
  assert.equal(templates.length,24);assert.ok(templates.every(t=>t.variations.length===3));const variants=new Set(),topologies=new Set(),barriers=new Set();
  for(let i=0;i<1800;i++){const b=generateScenario('network-audit-'+i);assert.deepEqual(validateScenario(b),{valid:true,errors:[]});variants.add(b.templateId+':'+b.variantId);topologies.add(b.topology);b.nodes.forEach(n=>barriers.add(n.barrier));assert.ok(witnessScenario(b).feasible);assert.ok(b.edges.filter(e=>e.hidden).length<=2);if(i<25)assert.deepEqual(generateScenario('network-audit-'+i),b);if(b.templateId==='merge'){assert.equal(b.topology,'two_camps');assert.ok(b.nodes.some(n=>n.name.includes('Б')));}}
  assert.equal(variants.size,72);assert.equal(topologies.size,6);assert.equal(barriers.size,9);
});
test('a wave uses simultaneous snapshots and directed outgoing influence rather than an undirected cascade',()=>{
  const s=act(create('directed'),{type:'open'}),before=structuredClone(s);const frames=influenceFrames(s);assert.deepEqual(s,before);assert.equal(frames.length,s.nodes.length);const reversed=structuredClone(s);reversed.edges=reversed.edges.map(e=>({...e,from:e.to,to:e.from}));assert.notDeepEqual(influenceFrames(reversed),frames);
  const running=act(s,{type:'run'});assert.deepEqual(running.nodes,s.nodes);const tick=act(running,{type:'tick'});assert.equal(tick.animation.index,1);assert.deepEqual(tick.nodes.slice(1),running.nodes.slice(1));
});
test('diagnostics disclose only the chosen barrier and connected hidden links; action budgets constrain choices',()=>{
  let s=act(create('diagnose'),{type:'open'});s=act(s,{type:'select',id:s.scenario.hub});const before=s.actionsLeft;s=act(s,{type:'intervene',id:'diagnose'});assert.equal(s.actionsLeft,before-1);assert.equal(s.nodes.filter(n=>n.barrierKnown).length,1);assert.ok(s.edges.filter(e=>e.hidden&&e.from===s.selected).every(e=>e.revealed));assert.throws(()=>act(s,{type:'intervene',id:'diagnose'}));while(s.actionsLeft)s=act(s,{type:'intervene',id:'explain'});assert.throws(()=>act(s,{type:'intervene',id:'resource'}),/Действия/);
});
test('wrong training and repeated interventions have causal fatigue while an artificial champion loses trust',()=>{
  let s=act(create('fatigue'),{type:'open'});const n=s.nodes.find(n=>!stable(n,s.scenario.threshold)&&n.barrier!=='skill')||s.nodes[1];s=act(s,{type:'select',id:n.id});const trust=n.trust;s=act(s,{type:'intervene',id:'champion'});assert.equal(s.nodes.find(x=>x.id===n.id).champion,false);assert.ok(s.nodes.find(x=>x.id===n.id).trust<trust);const fatigue=s.nodes.find(x=>x.id===n.id).fatigue;s=act(s,{type:'intervene',id:'train'});s=act(s,{type:'intervene',id:'train'});assert.ok(s.nodes.find(x=>x.id===n.id).fatigue>fatigue);
});
test('pressure can help a ready group but increases hidden resistance in an unready one',()=>{
  let s=act(create('pressure'),{type:'open'});const ready=s.nodes[0];assert.ok(stable(ready,s.scenario.threshold));const a=act(s,{type:'intervene',id:'pressure'});assert.ok(a.nodes[0].commitment>ready.commitment);const id=s.nodes.find(n=>n.id!==ready.id&&n.commitment<55).id;s=act(s,{type:'select',id});const b=act(s,{type:'intervene',id:'pressure'});assert.ok(b.nodes.find(n=>n.id===id).latentResistance>s.nodes.find(n=>n.id===id).latentResistance);assert.ok(b.nodes.find(n=>n.id===id).compliance>s.nodes.find(n=>n.id===id).compliance);
});
test('state-driven events are limited, contain choices and do not fire without their cause',()=>{
  const s=act(create('events'),{type:'open'});s.nodes.forEach(n=>{n.trust=80;n.latentResistance=10;n.fatigue=10;n.compliance=10;});assert.equal(selectEvent(s),null);s.nodes[1].trust=20;const event=selectEvent(s);assert.equal(event.kind,'rumor');s.events=[event,{kind:'envy'}];assert.equal(selectEvent(s),null);
});
test('targeted network strategies survive withdrawal without touching every group; training and pressure are not universal victories',()=>{
  let failedPressure=0,failedTraining=0,indirect=0;
  for(let i=0;i<30;i++){
    const {s}=strategy('strategy-'+i);assert.equal(s.history.length,4);assert.equal(s.followup.length,2);assert.ok(s.result.metrics.accepted>=Math.ceil(s.nodes.length*.6));assert.ok(['A','B'].includes(s.result.grade));assert.ok(validate(s));if(s.nodes.some(n=>!n.touched&&stable(n,s.scenario.threshold)))indirect++;
    const p=strategy('strategy-'+i,'pressure'),t=strategy('strategy-'+i,'train');if(p.s.result.metrics.accepted<Math.ceil(p.s.nodes.length*.6))failedPressure++;if(t.s.result.metrics.accepted<Math.ceil(t.s.nodes.length*.6))failedTraining++;
    for(const n of p.s.nodes)for(const key of ['support','adoption','trust','commitment','capability','capacity','fatigue','latentResistance','compliance'])assert.ok(Number.isFinite(n[key])&&n[key]>=0&&n[key]<=100);
  }assert.ok(indirect>0);assert.ok(failedPressure>0);assert.ok(failedTraining>0);
});
test('seed, animated partial wave, hidden edges and final journal survive backup; fabricated adoption is rejected',()=>{
  let s=act(create('backup-network'),{type:'open'});s=act(s,{type:'run'});s=act(s,{type:'tick'});s=act(s,{type:'pause'});s.custom='keep';assert.ok(validate(JSON.parse(JSON.stringify(s))));const bad=structuredClone(s);bad.nodes[1].adoption=999;assert.equal(validate(bad),false);assert.deepEqual(create(s.seed).scenario,s.scenario);
  const values=new Map(),store=createStore({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),id=store.active();store.update(id,d=>{d.course.arcadeGames={change:s,ethics:{keep:true}};d.course.arcadeArchives={change:[create('archive')]};});const copy=store.import(JSON.parse(JSON.stringify(store.export(id)))),c=store.profile(copy).data.course;assert.deepEqual(c.arcadeGames.change,s);assert.ok(validate(c.arcadeGames.change));assert.ok(c.arcadeGames.ethics.keep);
});
