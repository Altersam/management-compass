const {create,act}=require('../../assets/ethics-dossier/state.js');
const {expect}=require('@playwright/test');
async function install(page,state){await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames.ethics=s;}),state);await page.goto('/trainer.html?game=ethics'+(state.modelVersion===2?'':'&legacy=1'));await expect(page.locator('#arcadeRoot h1')).toBeVisible();}
async function openModern(page,seed='ethics-browser'){await install(page,create(seed));await page.locator('[data-dossier-action=open]').click();}
async function openLegacy(page){await install(page,require('../../assets/arcade/ethics.js').create('backup-ethics'));}
async function basis(page,ids=['advocate','rule']){for(const id of ids){await page.locator(`[data-dossier-action=read][data-id=${id}]`).click();await page.locator(`[data-dossier-action=check][data-id=${id}]`).click();await page.locator(`.dossier-document [data-dossier-action=basis][data-id=${id}]`).click();}}
async function choose(page){await page.locator('[data-dossier-action=principle][data-id=utility]').click();await page.locator('[data-dossier-action=decision][data-id=option_a]').click();await page.locator('[data-dossier-action=mitigation][data-id=independent]').click();await page.locator('[data-dossier-action=commit]').click();}
module.exports={install,openModern,openLegacy,basis,choose};
