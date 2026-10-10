const {test,expect}=require('@playwright/test');
async function assign(page,task,people){
  await page.locator(`.gantt-task-name[data-task="${task}"]`).click();
  for(const id of people)await page.locator(`[data-assign="${id}"]`).check();
}
async function plan(page){
  for(const [id,people] of [['prototype',['maxim']],['testing',['pavel']],['integration',['denis']],['approval',['irina']],['training',['irina']],['launch',['denis','irina']]])await assign(page,id,people);
}
test('persistent project board advances on clock, pauses, and resumes with assignments',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto('/game.html');
  await expect(page.locator('.gantt-row')).toHaveCount(7);await expect(page.locator('.game-person')).toHaveCount(5);await expect(page.locator('#gameClock')).toHaveText('Запустить время');
  await plan(page);await page.locator('[data-setting=autonomy]').selectOption('manual');
  await page.locator('#gameClock').click();await page.clock.runFor(32000);await page.locator('#gameClock').click();
  const state=await page.evaluate(()=>Workspace.profile(CourseUI.active).data.course.projectGame);expect(state.time).toBe(1);expect(state.spent).toBe(48000);expect(state.tasks[1].assigned).toEqual(['maxim']);
  await page.clock.runFor(32000);expect(await page.evaluate(()=>Workspace.profile(CourseUI.active).data.course.projectGame.time)).toBe(1);
  await page.reload();await expect(page.locator('#gameBrief')).toContainText('Продолжить проект — день 2');await expect(page.locator('#selectedTaskHeading')).toHaveText('Запуск');await expect(page.locator('#gameClock')).toHaveText('Продолжить время');expect(errors).toEqual([]);
});
test('event explanation pauses clock and links to a precise course fragment',async({page})=>{
  await page.clock.install();await page.goto('/game.html');await plan(page);await page.locator('#gameClock').click();await page.clock.runFor(160000);
  await expect(page.locator('[data-explain=requirements]')).toBeVisible();await page.locator('[data-explain=requirements]').click();await expect(page.locator('#gameExplanation')).toBeVisible();
  await expect(page.locator('#explanationCourse')).toHaveAttribute('href',/learn\.html\?module=2.*#theory-0/);
  const before=await page.evaluate(()=>Workspace.profile(CourseUI.active).data.course.projectGame.time);await page.clock.runFor(16000);expect(await page.evaluate(()=>Workspace.profile(CourseUI.active).data.course.projectGame.time)).toBe(before);
  await page.keyboard.press('Escape');await expect(page.locator('#gameExplanation')).not.toBeVisible();await expect(page.locator('#gameClock')).toHaveText('Продолжить время');
});
test('full game produces a multidimensional result and restart archives only this game',async({page})=>{
  await page.clock.install();await page.goto('/game.html');await plan(page);
  await page.evaluate(()=>Workspace.update(CourseUI.active,d=>{d.course.simulation={revision:2,decisions:['tight-check']};d.course.simulationArchive=[{reflection:'Прежняя история'}];}));
  await page.locator('[data-command=coordinateIT]').click();await page.locator('[data-command=clarify]').click();await page.locator('#gameClock').click();await page.clock.runFor(320000);
  if(process.env.REFERENCE_SCREENSHOTS){await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/project-game-day-11.png',fullPage:true});}
  await page.clock.runFor(320000);
  await expect(page.locator('#gameResult')).toBeVisible();await expect(page.locator('#gameResult')).toContainText('Переделка');await expect(page.locator('#gameResult')).toContainText('Ручные решения');await expect(page.locator('.game-insights li')).toHaveCount(5);
  if(process.env.REFERENCE_SCREENSHOTS)await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/project-game-result.png',fullPage:true});
  await page.locator('#newProjectForm button').click();await expect(page.locator('#gameClock')).toHaveText('Запустить время');
  const course=await page.evaluate(()=>Workspace.profile(CourseUI.active).data.course);expect(course.projectGameArchive).toHaveLength(1);expect(course.simulation.decisions).toEqual(['tight-check']);expect(course.simulationArchive[0].reflection).toBe('Прежняя история');
});
test('mobile focuses one area and timeline scroll never expands the document',async({page})=>{
  await page.goto('/game.html');
  for(const width of [320,375,430,768,1024]){
    await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width)).toBe(true);
    if(width<=430){await expect(page.locator('#panel-project')).toBeVisible();await expect(page.locator('#panel-team')).toBeHidden();await page.locator('[data-tab=team]').click();await expect(page.locator('#panel-team')).toBeVisible();await expect(page.locator('#panel-project')).toBeHidden();await page.locator('[data-tab=project]').click();}
  }
  await page.setViewportSize({width:375,height:850});await page.locator('[data-tab=project]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-tab=team]')).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('ArrowRight');await expect(page.locator('#panel-events')).toBeVisible();
});
test('main entry offers game continuation and keeps course and legacy simulation reachable',async({page})=>{
  await page.clock.install();await page.goto('/game.html');await page.locator('#gameClock').click();await page.clock.runFor(32000);await page.goto('/');
  await expect(page.locator('#startGame')).toHaveText('Продолжить проект — день 2');await expect(page.locator('#startCourse')).toHaveAttribute('href',/learn\.html\?module=1/);
  await expect(page.locator('.learning-header>nav a')).toHaveCount(3);await page.locator('a[href*="#final"]').last().click();await expect(page.locator('#makeSimulationDecision')).toBeVisible();
});
test('keyboard play and explanation return preserve focus and timeline position',async({page})=>{
  await page.clock.install();await page.goto('/game.html');await page.setViewportSize({width:1024,height:900});
  await page.locator('.gantt-task-name[data-task=prototype]').focus();await page.keyboard.press('Enter');await expect(page.locator('#selectedTaskHeading')).toBeFocused();
  await page.locator('[data-assign=maxim]').focus();await page.keyboard.press('Space');await expect(page.locator('[data-assign=maxim]')).toBeChecked();await expect(page.locator('[data-assign=maxim]')).toBeFocused();
  await page.locator('.gantt-scroll').evaluate(el=>el.scrollLeft=50);const scroll=await page.locator('.gantt-scroll').evaluate(el=>el.scrollLeft);
  await page.locator('#gameClock').focus();await page.keyboard.press('Enter');await page.clock.runFor(128000);await page.keyboard.press('Enter');
  expect(await page.locator('.gantt-scroll').evaluate(el=>el.scrollLeft)).toBe(scroll);
  await page.locator('[data-explain=requirements]').focus();await page.keyboard.press('Enter');await expect(page.locator('#returnToGame')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('[data-explain=requirements]')).toBeFocused();
});
test('game modules are not downloaded by the landing page and game images stay local',async({page})=>{
  const requests=[];page.on('request',r=>requests.push(r.url()));await page.goto('/');expect(requests.some(url=>url.includes('/assets/game/'))).toBe(false);
  await page.locator('#startGame').click();await expect(page.locator('.gantt-row')).toHaveCount(7);
  expect(requests.filter(url=>new URL(url).origin!==new URL(page.url()).origin)).toEqual([]);
  if(process.env.REFERENCE_SCREENSHOTS){
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/project-game-desktop.png',fullPage:true});
    await page.setViewportSize({width:375,height:850});await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/project-game-mobile.png',fullPage:true});
  }
});
