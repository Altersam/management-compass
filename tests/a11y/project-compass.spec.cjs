const {test,expect}=require('@playwright/test'),AxeBuilder=require('@axe-core/playwright').default;
const {createState}=require('../../assets/game/state.js'),{advanceScenarioEvents}=require('../../assets/game/scenario-events.js');
test('new scenario trade-offs and expanded personal calendars are accessible at both sizes',async({page})=>{
  const state=createState('accessible-case',{scenarioVersion:3});state.time=4;state.scenarioEvents.nextAt=0;state.scenarioEvents.seen=['helpWindow'];advanceScenarioEvents(state);
  await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.projectGame=s;}),state);
  for(const width of [1440,375]){
    await page.setViewportSize({width,height:1000});await page.goto('/game.html');await page.locator('[data-person-details=anna]>summary').click();
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
    await page.locator('[data-open-observation]').click();await expect(page.locator('[data-case-choice]')).toHaveCount(3);
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  }
});
