const {test,expect}=require('@playwright/test'),AxeBuilder=require('@axe-core/playwright').default;
const {openCase,selectKeys,pilot}=require('../helpers/detective-runs.cjs');
for(const width of [1440,375])test('investigation intro, choices, trap, refinement and report are accessible at '+width,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/detective.html');await expect(page.locator('[data-start]')).toBeVisible();
  async function check(){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);}
  await check();const book=await openCase(page);await selectKeys(page,book);await page.locator(`[data-stage="${book.archetype.trueStage}"]`).click();await check();
  await pilot(page,book.archetype.trueStage,'change_metric');await check();await page.locator('[data-refine]').click();await check();await pilot(page,book.archetype.trueStage,book.archetype.effectiveInterventions[0]);await page.locator('#finishInvestigation').click();await check();
});
