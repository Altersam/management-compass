const {test,expect}=require('@playwright/test'),AxeBuilder=require('@axe-core/playwright').default;
const {openModern,add,finishAnimation,install,firstReview}=require('../helpers/sprint-goal-runs.cjs');
for(const width of [1440,375])test('threshold goals, loading, WIP, events, debt and review are accessible at '+width,async({page})=>{
  await page.clock.install();await page.setViewportSize({width,height:1000});await openModern(page);
  async function check(){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);}
  await check();await add(page,['task-1','task-4','task-2','task-5','task-7']);await check();await page.locator('[data-goal-action=run]').first().first().click();await page.clock.runFor(60000);await expect(page.locator('#goalEventDialog')).toBeVisible();await check();await page.locator('[data-goal-action=decision]').last().click();await finishAnimation(page);await check();
  await install(page,firstReview());await page.locator('[data-goal-action=next]').click();await check();await page.locator('[data-goal-action=askCancel]').first().click();await check();await page.locator('[data-goal-action=closeCancel]').click();await add(page,['task-3','task-6']);await page.locator('[data-goal-action=run]').first().first().click();await finishAnimation(page);await page.locator('[data-goal-action=finish]').click();await check();
});
