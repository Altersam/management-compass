const {create,act}=require('../../assets/approach/state.js');
const {expect}=require('@playwright/test');
async function install(page,state){await page.goto('/');await page.evaluate(state=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames.hybrid=state;}),state);await page.goto('/trainer.html?game=hybrid');}
async function openModern(page,seed='browser-approach'){await install(page,create(seed));await page.locator('[data-approach=start]').click();}
async function openLegacy(page){await install(page,require('../../assets/arcade/hybrid.js').create());await expect(page.locator('#arcadeBoard')).not.toBeEmpty();}
function firstReview(seed='browser-approach'){
  let s=act(create(seed),{type:'start'});s=act(s,{type:'run'});while(['running','event'].includes(s.phase))s=act(s,s.phase==='event'?{type:'decision',choice:({delay:'fast',capacity:'fast',budget:'probe'})[s.events.find(e=>e.id===s.current.pending).kind]||'adapt'}:{type:'tick'});return s;
}
async function finishAnimation(page){
  for(let i=0;i<10;i++){
    await page.clock.runFor(60000);
    if(await page.locator('#approachEventDialog[open]').count()){await page.locator('[data-approach=decision]').first().click();continue;}
    if(await page.locator('#approachResultHeading').count())return;
  }throw new Error('Animation did not finish');
}
module.exports={install,openModern,openLegacy,firstReview,finishAnimation};
