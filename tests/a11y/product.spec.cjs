const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
async function check(page,url){const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),url).toEqual([]);}
test('product pages meet automated WCAG checks',async({page})=>{
  for(const url of ['/','/game.html','/workspace.html','/workspace.html#modules','/workspace.html#diary','/navigator.html','/experiments.html','/settings.html','/sources.html','/adizes.html','/adizes-paei.html','/adizes-capi.html','/adizes-lifecycle.html','/modules/module-03.html#delegate']){await page.goto(url);await expect(page.locator('.product-header')).toBeVisible();await check(page,url);}
});
test('all course scene types and authored responses are accessible',async({page})=>{
  for(let id=1;id<=10;id++){await page.goto(`/learn.html?module=${id}`);await expect(page.locator('.activity-'+id)).toBeVisible();await check(page,'topic '+id);}
  await page.goto('/learn.html?module=5#theory-1');await check(page,'productive response');
});
test('mobile situation result and game dialog retain accessible controls',async({page})=>{
  await page.setViewportSize({width:375,height:850});await page.goto('/navigator.html');await page.locator('[name=q0]').first().check();await page.locator('[name=q1]').first().check();await page.locator('#situationQuestions button').click();await check(page,'hypothesis');
  await page.goto('/game.html');for(let i=0;i<4;i++)await page.locator('#skipToEvent').click();const why=page.locator('[data-explain]').first();await page.locator('[data-tab=events]').click();await expect(why).toBeVisible();await why.click();await check(page,'dialog');
});
