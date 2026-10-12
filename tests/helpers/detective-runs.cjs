const {createState,act}=require('../../assets/detective/engine.js');
const {generateCasebook}=require('../../assets/detective/generator.js');
const {expect}=require('@playwright/test');
async function openCase(page,seed='clear-browser',legacy=false){
  const state=createState(seed,{generatorVersion:legacy?undefined:2});
  await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.detectiveGame=s;}),state);await page.goto('/detective.html');
  if(!legacy)await page.locator('[data-start]').click();return legacy?null:generateCasebook(seed);
}
async function selectKeys(page,book){for(const source of book.sources.filter(s=>s.facts.some(f=>f.kind==='key'))){await page.locator(`[data-inspect="${source.id}"]`).click();await page.locator(`[data-fact="${source.facts[0].id}"]`).click();}}
async function pilot(page,stage,measure){await page.locator(`[data-stage="${stage}"]`).click();await page.locator(`[data-measure="${measure}"]`).click();await page.locator('#runPilot').click();await expect(page.locator('#latestPilotHeading')).toBeVisible();}
function finished(seed='clear-browser'){
  const book=generateCasebook(seed);let s=createState(seed,{generatorVersion:2});s=act(s,{type:'start'});
  for(const source of book.sources.filter(s=>s.facts.some(f=>f.kind==='key'))){s=act(s,{type:'inspect',key:source.id});s=act(s,{type:'evidence',id:source.facts[0].id});}
  s=act(s,{type:'hypothesis',stage:book.archetype.trueStage});s=act(s,{type:'pilot',intervention:book.archetype.effectiveInterventions[0]});return act(s,{type:'finish'});
}
module.exports={openCase,selectKeys,pilot,finished};
