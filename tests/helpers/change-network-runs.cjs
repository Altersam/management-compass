const {create,act}=require('../../assets/change-network/state.js');
const {expect}=require('@playwright/test');
async function install(page,state){await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames.change=s;}),state);await page.goto('/trainer.html?game=change'+(state.modelVersion===2?'':'&legacy=1'));await expect(page.locator('#gameThemeToggle')).toBeVisible();}
async function openModern(page,seed='network-browser'){await install(page,create(seed));await page.locator('[data-network-action=open]').click();}
async function openLegacy(page){await install(page,require('../../assets/arcade/change.js').create('backup-change'));await expect(page.locator('[data-action=observe]')).toBeVisible();}
async function runAnimation(page){await page.clock.runFor(10000);if(await page.locator('#networkEventDialog[open]').count()){const kind=await page.evaluate(()=>CourseUI.data().course.arcadeGames.change.pendingEvent.kind),choice=({rumor:'listen',sabotage:'diagnose',overload:'resource',envy:'share'})[kind];await page.locator(`[data-network-action=decision][data-choice=${choice}]`).click();}}
module.exports={install,openModern,openLegacy,runAnimation};
