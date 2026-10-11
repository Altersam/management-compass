const {test,expect}=require('@playwright/test');
const {createState}=require('../../assets/game/state.js'),{act,advance}=require('../../assets/game/engine.js'),{tasks}=require('../../assets/game/project.js');
test('entire editorial catalogue works without JavaScript and has two visual features',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL}),page=await context.newPage();await page.goto('/games.html');await expect(page.locator('.training-game')).toHaveCount(12);await expect(page.locator('.game-feature')).toHaveCount(2);await expect(page.locator('.game-group')).toHaveCount(3);await expect(page.locator('input[type=search]')).toHaveCount(0);
  await expect(page.locator('[data-game=hybrid]')).toContainText('Hybrid');await page.locator('[data-game=hybrid] a').click();await expect(page).toHaveURL(/game=hybrid/);await context.close();
});
test('Hybrid Lab compares real route changes, resumes both condition sets and carries a next step',async({page})=>{
  await page.goto('/trainer.html?game=hybrid');await page.locator('[name=context]').selectOption('discovery');await page.locator('[data-action=run]').click();await expect(page.locator('.hybrid-pressure')).toHaveCount(1);
  const original=await page.evaluate(()=>CourseUI.data().course.arcadeGames.hybrid.runs[0]);await page.locator('[data-action=preset][data-value=agile]').click();await page.reload();await expect(page.locator('.route-builder li')).toHaveCount(8);await page.locator('[data-action=run]').click();
  await expect(page.locator('.hybrid-comparison')).toContainText('одинаковом контексте');const saved=await page.evaluate(()=>CourseUI.data().course.arcadeGames.hybrid);expect(saved.runs[0]).toEqual(original);expect(saved.runs[1].result.rework).toBeLessThan(saved.runs[0].result.rework);
  await page.locator('[name=workAction]').fill('Проверить сценарий на образце до разработки');await page.locator('#arcadeExperiment').click();await expect(page.locator('#newExperiment [name=action]')).toHaveValue('Проверить сценарий на образце до разработки');
});
test('corrupted Hybrid save is preserved rather than replaced or rendered as a fake result',async({page})=>{
  await page.goto('/trainer.html?game=hybrid');await page.locator('[data-action=run]').click();
  await page.evaluate(()=>Workspace.update(Workspace.active(),d=>d.course.arcadeGames.hybrid.runs[0].result.days=0));const before=await page.evaluate(()=>JSON.stringify(CourseUI.data().course.arcadeGames.hybrid));
  await page.reload();await expect(page.locator('#arcadeRoot [role=alert]')).toContainText('остаётся в профиле');expect(await page.evaluate(()=>JSON.stringify(CourseUI.data().course.arcadeGames.hybrid))).toBe(before);
});
test('project next step exports an authored experiment without modifying earned run',async({page})=>{
  let state=createState('service-20',{balanceVersion:1});for(const task of tasks)state=act(state,{type:'assign',task:task.id,people:task.assigned});for(let i=0;i<80;i++)state=advance(state);
  await page.goto('/');await page.evaluate(s=>Workspace.update(Workspace.active(),d=>d.course.projectGame=s),state);await page.goto('/game.html');await expect(page.locator('#projectPracticeCycle [aria-current]')).toContainText('Следующий шаг');
  const earned=await page.evaluate(()=>JSON.stringify(CourseUI.data().course.projectGame));await page.locator('[name=workHypothesis]').fill('Ранняя сверка снизит возвраты');await page.locator('[name=workAction]').fill('Согласовать вход до передачи');await page.locator('[name=workPlace]').fill('Еженедельный отчёт');await page.locator('#projectExperiment').click();
  await expect(page.locator('#newExperiment [name=hypothesis]')).toHaveValue('Ранняя сверка снизит возвраты');await expect(page.locator('#newExperiment [name=place]')).toHaveValue('Еженедельный отчёт');expect(await page.evaluate(()=>JSON.stringify(CourseUI.data().course.projectGame))).toBe(earned);
});
test('detective explains missing pilot conditions and preserves next-step text while re-reading evidence',async({page})=>{
  await page.goto('/detective.html');await expect(page.locator('#pilotHint')).toContainText('прикрепить ещё 2 источника');
  for(const key of ['case:case-1','returns']){await page.locator(`[data-inspect="${key}"]`).first().click();await page.locator('#pinSource').click();await page.locator('#closeSource').click();}
  await page.locator('[data-stage=register]').first().click();await page.locator('#hypothesisNote').fill('Неполный вход вызывает возврат после регистрации.');await page.locator('[name=intervention][value=input]').check();await page.locator('#runPilot').click();await expect(page.locator('#detectivePracticeCycle [aria-current]')).toContainText('Наблюдение');await page.locator('#finishInvestigation').click();
  await page.locator('[name=workAction]').fill('Проверить комплектность входа на трёх делах');await page.locator('[data-inspect=returns]').first().click();await page.locator('#closeSource').click();await expect(page.locator('[name=workAction]')).toHaveValue('Проверить комплектность входа на трёх делах');await page.locator('#detectiveExperiment').click();await expect(page.locator('#newExperiment [name=action]')).toHaveValue('Проверить комплектность входа на трёх делах');
});
test('mobile project observation reveals the actual event; focused catalogue and Hybrid remain within viewport',async({page})=>{
  await page.setViewportSize({width:375,height:850});await page.goto('/game.html');for(let i=0;i<4;i++)await page.locator('#skipToEvent').click();await page.locator('[data-open-observation]').click();await expect(page.locator('#panel-events')).toBeVisible();await expect(page.locator('.game-event')).not.toHaveCount(0);
  for(const width of [320,375,430,768,1024,1440]){await page.setViewportSize({width,height:1000});for(const url of ['/games.html','/trainer.html?game=hybrid']){await page.goto(url);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' '+url).toBe(true);}}
  if(process.env.REFERENCE_SCREENSHOTS){await page.setViewportSize({width:1440,height:1000});await page.goto('/games.html');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/games-focused-catalog.png',fullPage:true});await page.goto('/trainer.html?game=hybrid');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/hybrid-lab-desktop.png',fullPage:true});await page.setViewportSize({width:375,height:850});await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/hybrid-lab-mobile.png',fullPage:true});}
});
