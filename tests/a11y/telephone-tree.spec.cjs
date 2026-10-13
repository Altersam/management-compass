const {test,expect}=require('@playwright/test'),AxeBuilder=require('@axe-core/playwright').default;
const {openModern,animate}=require('../helpers/telephone-tree-runs.cjs');
for(const theme of ['light','dark'])test('semantic tree, synchronized table, channels, events and outcome are accessible: '+theme,async({page})=>{
  await page.addInitScript(t=>localStorage.setItem('manager-almanac:theme',t),theme);await page.clock.install();await page.setViewportSize({width:375,height:1000});await openModern(page);
  async function check(){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);}
  await check();for(let i=0;i<4;i++){await page.locator('[data-meaning-action=send]').click();await page.clock.runFor(10000);if(await page.locator('#meaningEventDialog[open]').count()){await check();await page.locator('#meaningEventDialog button:not(:disabled)').last().click();}if(i===1)await check();}await page.locator('[data-meaning-action=execute]').click();await page.clock.runFor(2250);await check();await page.locator('[data-meaning-action=finish]').click();await check();
});
