const {test,expect}=require('@playwright/test');
const {createState}=require('../../assets/game/state.js');
const {advanceScenarioEvents}=require('../../assets/game/scenario-events.js');

test('action-first selection assigns a weak fit, allows parallel work and reveals profile on demand',async({page})=>{
  await page.goto('/game.html');await expect(page.locator('.mc-goalbar')).toContainText('20 дней');await expect(page.locator('#mcForecast')).toContainText('Прогноз запуска');
  await expect(page.locator('[data-person-details=anna]')).not.toHaveAttribute('open');
  await page.locator('[data-pick-person=anna]').first().click();await expect(page.locator('#mcOnboarding')).toContainText('2.');
  await page.locator('.gantt-task-name[data-task=training]').click();await expect(page.locator('[data-assign=anna]')).toBeChecked();await expect(page.locator('#mcOnboarding')).toContainText('3.');
  const state=await page.evaluate(()=>Workspace.profile(CourseUI.active).data.course.projectGame);expect(state.tasks.filter(t=>t.assigned.includes('anna')).map(t=>t.id)).toEqual(['requirements','training']);
  await page.locator('#closeTaskDrawer').click();await page.locator('[data-person-details=anna]>summary').click();await expect(page.locator('[data-person-details=anna]')).toContainText('Аналитика');
});
test('a case dialog applies a trade-off, keeps time paused and preserves the decision on reload',async({page})=>{
  const state=createState('dialog',{scenarioVersion:3});state.time=4;state.scenarioEvents.nextAt=0;state.people.forEach(p=>{delete p.life.leave;});state.scenarioEvents.seen=['helpWindow'];advanceScenarioEvents(state);
  await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.projectGame=s;}),state);await page.goto('/game.html');
  await page.locator('[data-open-observation]').click();await expect(page.locator('#gameEventChoice')).toBeVisible();await expect(page.locator('[data-case-choice]')).toHaveCount(3);
  await page.locator('[data-case-choice=flex]').click();await expect(page.locator('#gameEventChoice')).toBeHidden();await expect(page.locator('#gameClock')).toHaveText('Продолжить время');
  await page.reload();const saved=await page.evaluate(()=>Workspace.profile(CourseUI.active).data.course.projectGame);expect(saved.time).toBe(4);expect(saved.events.at(-1).choice).toBe('flex');expect(saved.decisions.at(-1).type).toBe('scenarioChoice');
});
test('mobile forecast panel does not overlay the task board',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/game.html');
  expect(await page.locator('.mc-actionbar').evaluate(el=>getComputedStyle(el).position)).toBe('static');
  const board=await page.locator('#panel-project').boundingBox(),actions=await page.locator('.mc-actionbar').boundingBox();expect(actions.y).toBeGreaterThan(board.y+board.height);
  await page.locator('.gantt-task-name[data-task=prototype]').click();await expect(page.locator('#taskDrawer')).toBeVisible();await page.locator('#closeTaskDrawer').click();
  if(process.env.REFERENCE_SCREENSHOTS)await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/project-compass-mobile-complete.png',fullPage:true});
});
