const {create,act}=require('../../assets/flow-constraint/state.js'),{detectConstraint}=require('../../assets/flow-constraint/constraint.js'),{donors}=require('../../assets/flow-constraint/intervention.js');
function animate(s){let guard=0;while(['observe','running'].includes(s.phase)&&guard++<200)s=act(s,{type:'tick'});return s;}
function intervention(s,strategy='good'){
  const c=detectConstraint(s),st=s.stages.find(st=>st.id===c.stageId);let guess=c.id,action;
  if(strategy==='local'){const target=s.stages.find(st=>st.id===s.scenario.falseLead);guess=target.id;action={type:'capacity',target:target.id,object:guess};}
  else if(strategy==='speed'){const target=s.stages.find(st=>st.canRemove&&!st.removed&&s.stages.indexOf(st)<s.stages.length-1);if(target){guess=target.id;action={type:'remove',target:target.id,object:guess};}else{guess=s.stages[0].id;action={type:'capacity',target:guess,object:guess};}}
  else if(c.type==='quality')action={type:'quality',target:st.id,object:guess};
  else if(st&&s.stages.some(x=>x.reworkTarget===st.id&&x.qualityFactor>.5)&&require('../../assets/flow-constraint/metrics.js').metrics(s).rework>.11)action={type:'quality',target:st.id,object:guess};
  else if(['policy','batch','priority'].includes(c.type))action={type:'rule',target:st?.id,object:guess};
  else if(c.type==='wip')action={type:'wip',limit:s.scenario.healthyWip,object:'wip'};
  else if(st.routeRule&&!st.ruleChanged&&strategy==='good')action={type:'rule',target:st.id,object:guess};
  else if(strategy==='reallocate'){const donor=donors(s,st).sort((a,b)=>b.currentCapacity-a.currentCapacity)[0];action=donor?{type:'reallocate',target:st.id,from:donor.id,object:guess}:{type:'capacity',target:st.id,object:guess};}
  else action={type:'capacity',target:st.id,object:guess};
  return {guess,action};
}
function play(seed,strategy='good'){let s=animate(act(create(seed),{type:'open'}));for(let i=0;i<3;i++){const {guess,action}=intervention(s,strategy);s=act(s,{type:'select',id:guess});s=act(s,{type:'guess'});s=act(s,{type:'plan',action});s=animate(act(s,{type:'run'}));s=act(s,{type:'next'});}return s;}
function seedFor(id,variation){const {generateScenario}=require('../../assets/flow-constraint/generator.js');for(let i=0;i<500;i++){const seed='flow-case-'+i,sc=generateScenario(seed);if(sc.id===id&&(variation===undefined||sc.variationId===variation))return seed;}throw new Error('Missing seed '+id);}
async function install(page,state){const {expect}=require('@playwright/test');await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames.flow=s;}),state);await page.goto('/trainer.html?game=flow'+(state.modelVersion===2?'':'&legacy=1'));await expect(page.locator('#gameThemeToggle')).toBeVisible();}
async function openLegacy(page){await install(page,require('../../assets/arcade/flow.js').create('legacy-flow'));}
module.exports={animate,intervention,play,seedFor,install,openLegacy};
