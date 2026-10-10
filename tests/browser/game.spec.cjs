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
  await page.locator('[data-command=coordinateIT]').click();await page.locator('[data-command=clarify]').click();await page.locator('#gameClock').click();await page.clock.runFor(640000);
  await expect(page.locator('#gameResult')).toBeVisible();await expect(page.locator('#gameResult')).toContainText('Переделка');await expect(page.locator('#gameResult')).toContainText('Ручные решения');await expect(page.locator('.game-insights li')).toHaveCount(5);
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
