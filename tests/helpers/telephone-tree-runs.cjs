const {create}=require('../../assets/telephone-tree/state.js');
const {expect}=require('@playwright/test');
async function install(page,state){await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames.telephone=s;}),state);await page.goto('/trainer.html?game=telephone'+(state.modelVersion===2?'':'&legacy=1'));await expect(page.locator('#gameThemeToggle')).toBeVisible();}
async function openModern(page,seed='meaning-browser'){await install(page,create(seed));await page.locator('[data-meaning-action=open]').click();}
async function openLegacy(page){await install(page,require('../../assets/arcade/telephone.js').create('backup-telephone'));await expect(page.locator('[data-action=channel]')).not.toHaveCount(0);}
async function animate(page){await page.clock.runFor(10000);if(await page.locator('#meaningEventDialog[open]').count())await page.locator('#meaningEventDialog button:not(:disabled)').last().click();}
module.exports={install,openModern,openLegacy,animate};
