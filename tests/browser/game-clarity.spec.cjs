const {test,expect}=require('@playwright/test');
const {createState}=require('../../assets/game/state.js');
const {act,advance}=require('../../assets/game/engine.js');
const {tasks}=require('../../assets/game/project.js');
function replay(ended=false){let s=createState('service-20',{balanceVersion:1});for(const t of tasks)s=act(s,{type:'assign',task:t.id,people:t.assigned});for(let i=0;i<(ended?80:36);i++)s=advance(s);return s;}
async function openFixture(page,state){await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>{d.course.projectGame=s;}),state);await page.goto('/game.html');}
test('regular pace is four seconds per quarter-day and changing speed does not change model steps',async({page})=>{
  await page.clock.install();await page.goto('/game.html');await expect(page.locator('#gameSpeed')).toHaveValue('4000');await page.locator('#gameClock').click();await page.clock.runFor(4000);await page.locator('#gameClock').click();
  expect(await page.evaluate(()=>CourseUI.data().course.projectGame.time)).toBe(0.25);
  await page.locator('#gameSpeed').selectOption('2000');await page.locator('#gameClock').click();await page.clock.runFor(2000);await page.locator('#gameClock').click();expect(await page.evaluate(()=>CourseUI.data().course.projectGame.time)).toBe(0.5);
});
test('task drawer keeps project visible, hides secondary settings and closes with keyboard',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/game.html');await expect(page.locator('#taskDrawer')).toBeHidden();
  await page.locator('.gantt-task-name[data-task=prototype]').click();await expect(page.locator('#taskDrawer')).toBeVisible();await expect(page.locator('.gantt-row')).toHaveCount(7);await expect(page.locator('[data-setting=checkpoint]')).toBeHidden();
  await page.locator('[data-assign=maxim]').focus();await page.keyboard.press('Space');await expect(page.locator('[data-assign=maxim]')).toBeChecked();await page.keyboard.press('Escape');await expect(page.locator('#taskDrawer')).toBeHidden();await expect(page.locator('.gantt-task-name[data-task=prototype]')).toBeFocused();
  if(process.env.REFERENCE_SCREENSHOTS){await page.locator('.gantt-task-name[data-task=prototype]').click();await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/game-compact-drawer.png',fullPage:true});await page.setViewportSize({width:375,height:850});await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/game-compact-drawer-mobile.png',fullPage:true});}
});
test('live causal review explains actual timeline but offers no rollback or early comparison',async({page})=>{
  await openFixture(page,replay());await page.locator('[data-event-id=requirements-return]').click();await expect(page.locator('#causeReview')).toContainText('Что произошло и откуда');await expect(page.locator('.cause-chain li')).toHaveCount(3);await expect(page.locator('#causeReview')).toContainText('22');await expect(page.locator('#compareCause')).toHaveCount(0);
  await expect(page.locator('#causeReview')).toContainText('после завершения');await page.locator('#returnToGame').click();await page.locator('#causeJournal>summary').click();await expect(page.locator('#causeJournalEntries')).toContainText('Последствие');
});
test('finished causal comparison works on a copy and survives profile backup',async({page})=>{
  const state=replay(true);await openFixture(page,state);await page.locator('[data-event-id=requirements-return]').click();await expect(page.locator('#compareCause')).toBeVisible();
  const before=await page.evaluate(()=>JSON.stringify(CourseUI.data().course.projectGame));await page.locator('#compareCause').click();await expect(page.locator('#causeComparison')).toContainText('Ваш путь');await expect(page.locator('#causeComparison')).toContainText('Переделка');expect(await page.evaluate(()=>JSON.stringify(CourseUI.data().course.projectGame))).toBe(before);
  const restored=await page.evaluate(()=>{const id=Workspace.import(JSON.parse(JSON.stringify(Workspace.export(CourseUI.active))));return Workspace.profile(id).data.course.projectGame;});expect(restored).toEqual(JSON.parse(before));
  if(process.env.REFERENCE_SCREENSHOTS)await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/game-causal-comparison.png',fullPage:true});
});
test('linked experiments retain observation and next change in an exported profile',async({page})=>{
  await page.goto('/experiments.html');await page.locator('.new-experiment>summary').click();await page.locator('#newExperiment [name=hypothesis]').fill('Ранняя сверка уменьшит возвраты');await page.locator('#newExperiment [name=action]').fill('Проверить вход до подготовки');await page.locator('#newExperiment [name=place]').fill('Отчёт');await page.locator('#newExperiment [name=reviewDate]').fill('2026-10-01');await page.locator('#newExperiment button').click();
  await page.locator('.experiment-row summary').click();await page.locator('[name=observations]').fill('Два возврата вместо пяти');await page.locator('[name=why]').fill('Помогло, но не всем случаям');await page.locator('[name=nextChange]').fill('Проверить исключения');await page.locator('[data-experiment-review] button').click();await page.locator('.experiment-history>summary').click();await page.locator('[data-next-experiment]').click();await expect(page.locator('#newExperiment [name=action]')).toHaveValue('Проверить исключения');await page.locator('#newExperiment [name=reviewDate]').fill('2026-11-01');await page.locator('#newExperiment button').click();
  const items=await page.evaluate(()=>CourseUI.data().experiments);expect(items[1].previousId).toBe(items[0].id);expect(items[0].observations).toBe('Два возврата вместо пяти');expect(await page.evaluate(()=>{const id=Workspace.import(Workspace.export(CourseUI.active));return Workspace.profile(id).data.experiments;})).toEqual(items);
});
test('six viewport sizes preserve project, situation and application without page overflow',async({page})=>{
  test.setTimeout(60000);
  for(const width of [320,375,430,768,1024,1440]){
    await page.setViewportSize({width,height:1000});
    for(const path of ['/game.html','/workspace.html','/navigator.html','/experiments.html','/settings.html','/learn.html?module=5#theory-1']){
      await page.goto(path);await expect(page.locator('.product-header')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${path}`).toBe(true);
    }
  }
});
