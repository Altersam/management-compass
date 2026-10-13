const {test,expect}=require('@playwright/test'),AxeBuilder=require('@axe-core/playwright').default;
const {openModern,runAnimation}=require('../helpers/change-network-runs.cjs');
for(const theme of ['light','dark'])test('live organization map, tools, events and consolidation are accessible: '+theme,async({page})=>{
  await page.addInitScript(t=>localStorage.setItem('manager-almanac:theme',t),theme);await page.clock.install();await page.setViewportSize({width:375,height:1000});await openModern(page);
  async function check(){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);}
  await check();await page.locator('[data-network-action=intervene][data-value=diagnose]').click();await page.locator('.network-more-tools summary').click();await check();for(let w=0;w<4;w++){await page.locator('[data-network-action=run]').click();await page.clock.runFor(10000);if(await page.locator('#networkEventDialog[open]').count()){await check();await page.locator('[data-network-action=decision]').first().click();}}for(let i=0;i<2;i++){await page.locator('[data-network-action=observe]').click();await runAnimation(page);}await check();await page.locator('[data-network-action=finish]').click();await check();
});
