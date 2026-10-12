const {create,act}=require('../../assets/sprint-goal/state.js');
const {expect}=require('@playwright/test');
async function install(page,state){await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames.sprint=s;}),state);await page.goto('/trainer.html?game=sprint');await expect(page.locator('#arcadeRoot h1')).toBeVisible();}
async function openModern(page,seed='sprint-0'){await install(page,create(seed));}
async function openLegacy(page){await install(page,require('../../assets/arcade/sprint.js').create());}
async function add(page,ids){for(const id of ids)await page.locator(`[data-goal-action=add][data-id="${id}"]`).click();}
async function finishAnimation(page){for(let i=0;i<5;i++){await page.clock.runFor(60000);if(await page.locator('#goalEventDialog[open]').count()){const button=page.locator('[data-goal-action=decision][data-choice=decline]');if(await button.count())await button.click();else await page.locator('[data-goal-action=decision]').last().click();}else if(await page.locator('#goalReviewHeading').count())return;}throw new Error('Sprint did not finish');}
function firstReview(seed='sprint-0'){let s=create(seed);s=act(s,{type:'wip',value:2});for(const id of ['task-1','task-4','task-2','task-5','task-7'])s=act(s,{type:'add',id});s=act(s,{type:'run'});while(['running','event'].includes(s.phase))s=act(s,s.phase==='event'?{type:'decision',choice:({capacity:'replan',urgent:'fix',tempt:'decline'})[s.scenario.events.find(e=>e.id===s.run.pending).kind]}:{type:'tick'});return s;}
module.exports={install,openModern,openLegacy,add,finishAnimation,firstReview};
