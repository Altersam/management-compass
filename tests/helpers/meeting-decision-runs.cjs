const {create,act}=require('../../assets/meeting-decision/state.js');
const {expect}=require('@playwright/test');
async function install(page,state){await page.goto('/');await page.evaluate(state=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames.meeting=state;}),state);await page.goto('/trainer.html?game=meeting');await expect(page.locator('#arcadeRoot h1')).toBeVisible();}
async function openModern(page,seed='meeting-browser'){await install(page,create(seed));await page.locator('[data-decision-action=start]').click();}
async function openLegacy(page){await install(page,require('../../assets/arcade/meeting.js').create());}
async function ask(page,id,question){await page.locator(`[data-decision-action=select][data-id="${id}"]`).click();const button=page.locator(`[data-decision-action=ask][data-question="${question}"]`);if(await button.isEnabled())await button.click();}
async function linked(page){
  await ask(page,'formal','constraint');const s=await page.evaluate(()=>CourseUI.data().course.arcadeGames.meeting);if(s.scenario.requiresAuthorization){await page.locator('.decision-editor summary').click();await page.locator('[data-key=conditions]').click();}
  await ask(page,'resource','concession');await ask(page,'finance','concession');await page.locator('[data-decision-action=link]').click();for(const id of ['formal','operations'])await ask(page,id,'commitment');
}
function prepared(seed='meeting-browser'){let s=act(create(seed),{type:'start'});const ask=(id,question)=>{s=act(s,{type:'select',id});s=act(s,{type:'ask',question});};ask('formal','constraint');if(s.scenario.requiresAuthorization)s=act(s,{type:'draft',key:'conditions',value:'basis'});ask('resource','concession');ask('finance','concession');s=act(s,{type:'link'});ask('formal','commitment');ask('operations','commitment');return s;}
module.exports={install,openModern,openLegacy,ask,linked,prepared};
