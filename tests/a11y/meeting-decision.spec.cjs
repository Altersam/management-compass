const {test,expect}=require('@playwright/test'),AxeBuilder=require('@axe-core/playwright').default;
const {openModern,linked}=require('../helpers/meeting-decision-runs.cjs');
for(const width of [1440,375])test('draft table, known risks, commitments, execution and corrective report are accessible at '+width,async({page})=>{
  await page.clock.install();await page.setViewportSize({width,height:1000});await openModern(page);
  async function check(){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);}
  await check();await page.locator('.decision-editor summary').click();await check();await page.locator('[data-decision-action=fix]').click();await page.clock.runFor(800);await check();await page.locator('[data-decision-action=retry]').click();await linked(page);await page.locator('[data-decision-action=check]').click();await check();await page.locator('[data-decision-action=fix]').click();await page.clock.runFor(800);await page.locator('[data-decision-action=pause]').click();await check();await page.locator('[data-decision-action=resume]').click();await page.clock.runFor(2400);await check();await page.locator('[data-decision-action=finish]').click();await check();
});
