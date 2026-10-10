const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const {createState}=require('../../assets/game/state.js'),{advance,act}=require('../../assets/game/engine.js'),{tasks}=require('../../assets/game/project.js');
async function check(page,url){const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();return results.violations.map(v=>({url,id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));}
test('product pages meet automated WCAG checks',async({page})=>{
  const violations=[];for(const url of ['/','/game.html','/workspace.html','/workspace.html#modules','/workspace.html#diary','/navigator.html','/experiments.html','/settings.html','/sources.html','/adizes.html','/adizes-paei.html','/adizes-capi.html','/adizes-lifecycle.html','/modules/module-03.html#delegate']){await page.goto(url);await expect(page.locator('.product-header')).toBeVisible();violations.push(...await check(page,url));}expect(violations).toEqual([]);
});
test('all course scene types and authored responses are accessible',async({page})=>{
  const violations=[];for(let id=1;id<=10;id++){await page.goto(`/learn.html?module=${id}`);await expect(page.locator('.activity-'+id)).toBeVisible();violations.push(...await check(page,'topic '+id));}
  await page.goto('/learn.html?module=5#theory-1');violations.push(...await check(page,'productive response'));expect(violations).toEqual([]);
});
test('mobile situation result and game dialog retain accessible controls',async({page})=>{
  await page.setViewportSize({width:375,height:850});await page.goto('/navigator.html');await page.locator('[name=q0]').first().check();await page.locator('[name=q1]').first().check();await page.locator('#situationQuestions button').click();expect(await check(page,'hypothesis')).toEqual([]);
  await page.goto('/game.html');for(let i=0;i<4;i++)await page.locator('#skipToEvent').click();const why=page.locator('[data-explain]').first();await page.locator('[data-tab=events]').click();await expect(why).toBeVisible();await why.click();expect(await check(page,'dialog')).toEqual([]);
});
test('task drawer, causal replay and completed comparison are accessible',async({page})=>{
  await page.goto('/game.html');await page.locator('.gantt-task-name[data-task=prototype]').click();expect(await check(page,'task drawer')).toEqual([]);await page.locator('.task-more>summary').click();expect(await check(page,'task secondary controls')).toEqual([]);
  let state=createState('service-20',{balanceVersion:1});for(const t of tasks)state=act(state,{type:'assign',task:t.id,people:t.assigned});for(let i=0;i<80;i++)state=advance(state);
  await page.evaluate(s=>Workspace.update(Workspace.active(),d=>d.course.projectGame=s),state);await page.reload();await page.locator('[data-event-id=requirements-return]').click();expect(await check(page,'causal review')).toEqual([]);await page.locator('#compareCause').click();expect(await check(page,'causal comparison')).toEqual([]);
});
test('catalog and detective investigation, source dialog, pilot and final are accessible',async({page})=>{
  await page.goto('/games.html');expect(await check(page,'games catalog')).toEqual([]);await page.goto('/detective.html');await expect(page.locator('.detective-chain')).toBeVisible();expect(await check(page,'detective initial')).toEqual([]);
  for(const key of ['case:case-1','returns']){await page.locator(`[data-inspect="${key}"]`).first().click();expect(await check(page,'detective source '+key)).toEqual([]);await page.locator('#pinSource').click();await page.locator('#closeSource').click();}
  await page.locator('.detective-chain [data-stage=register]').click();await page.locator('#hypothesisNote').fill('Повторный сбор сведений увеличивает ожидание после регистрации.');await page.locator('[name=intervention][value=input]').check();await page.locator('#runPilot').click();expect(await check(page,'detective pilot')).toEqual([]);await page.locator('#finishInvestigation').click();expect(await check(page,'detective final')).toEqual([]);
  await page.setViewportSize({width:375,height:850});expect(await check(page,'detective mobile final')).toEqual([]);
});
