const {test,expect}=require('@playwright/test'),AxeBuilder=require('@axe-core/playwright').default;
const {openModern,finishAnimation}=require('../helpers/approach-runs.cjs');
for(const width of [1440,375])test('project approach planning, running, event, review and comparison are accessible at '+width,async({page})=>{
  await page.clock.install();await page.setViewportSize({width,height:1000});await openModern(page,'accessible-approach');
  async function check(){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);}
  await check();await page.locator('.approach-help summary').click();await page.locator('[data-help=interval] summary').click();await check();await page.locator('[data-approach=run]').click();await page.clock.runFor(650);await page.locator('[data-approach=pause]').click();await check();await page.locator('[data-approach=resume]').click();await page.clock.runFor(60000);await expect(page.locator('#approachEventDialog')).toBeVisible();await check();await page.locator('[data-approach=decision]').first().click();await finishAnimation(page);await check();await page.locator('[data-approach=adjust]').click();await page.locator('[data-approach=run]').click();await finishAnimation(page);await check();
});
