const {create,act}=require('../../assets/influence-route/state.js');
function play(seed,{alternate=false}={}){
  let s=act(create(seed),{type:'open'});const a=(type,id)=>{const blocked=()=>s.scenario.edges.some(e=>e.from===s.markerNode&&e.to===id&&s.blocked[e.id]>s.turn);if(type==='move'&&blocked())a('hold');s=act(s,{type,id});while(s.phase==='motion')s=act(s,{type:'tick'});if(type==='move'&&s.markerNode!==id&&s.phase==='play'&&blocked()){a('hold');a('move',id);}};
  const sc=s.scenario,bridge=sc.bridge,next=sc.id==='regl'?'adv':sc.id==='close'?'coo':'mentor';
  if(alternate&&sc.id==='regl'){if(!s.knownNodes.includes('board')||!s.knownEdges.includes('you-board-access'))a('probe','you');a('probe','board');a('consult','board');a('brief','board');a('move','board');a('move',sc.decider);a('resolve');while(s.phase==='resolving')s=act(s,{type:'tick'});return s;}
  if(alternate&&sc.id==='appoint'){const other=bridge==='hr'?'cand':'hr';if(other==='hr'){if(!s.knownEdges.includes('you-hr-access'))a('probe','you');a('probe','hr');a('move','hr');}else{a('probe','cand');a('brief','cand');a('move','cand');}a('consult','mentor');a('brief','mentor');a('move','mentor');a('move',sc.decider);a('resolve');while(s.phase==='resolving')s=act(s,{type:'tick'});return s;}
  if(bridge==='hr'){a('probe','hr');a('move','hr');}
  else {a('probe',bridge);a('brief',bridge);a('move',bridge);}
  a('consult',next);a('brief',next);
  if(alternate&&sc.id==='close'){a('probe',bridge);a('move',sc.decider);}
  else {a('move',next);a('move',sc.decider);}
  if(s.phase==='decision'){a('resolve');while(s.phase==='resolving')s=act(s,{type:'tick'});}
  return s;
}
async function install(page,state){const {expect}=require('@playwright/test');await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames.influence=s;}),state);await page.goto('/trainer.html?game=influence'+(state.modelVersion===2?'':'&legacy=1'));await expect(page.locator('#gameThemeToggle')).toBeVisible();}
async function openLegacy(page){await install(page,require('../../assets/arcade/influence.js').create('legacy-map'));}
module.exports={play,install,openLegacy};
