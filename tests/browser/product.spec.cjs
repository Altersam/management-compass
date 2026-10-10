const {test,expect}=require('@playwright/test');
test('all modes share one shell and retain the selected profile in cross-page links',async({page})=>{
  for(const url of ['/','/game.html','/learn.html?module=3','/workspace.html','/navigator.html','/experiments.html','/settings.html','/sources.html','/adizes.html','/adizes-paei.html','/adizes-capi.html','/adizes-lifecycle.html','/modules/module-03.html']){
    await page.goto(url);await expect(page.locator('.product-header')).toHaveCount(1);await expect(page.locator('.product-header>nav a')).toHaveText(['Игра','Курс','Рабочая ситуация']);
    for(const link of await page.locator('.product-header a').evaluateAll(links=>links.map(a=>a.href)))expect(link).toContain('user=personal');
  }
});
test('both situation entries use the same questions, hypotheses and tools',async({page})=>{
  for(const url of ['/workspace.html','/navigator.html']){
    await page.goto(url);await expect(page.locator('#problemSelect option')).toHaveCount(16);await page.locator('#problemSelect').selectOption('informal-blocker');
    await page.locator('[name=q0][value=resource]').check();await page.locator('[name=q1][value=no]').check();await page.locator('#situationQuestions button').click();
    await expect(page.locator('#situationSuggestion')).toContainText('Похоже, рабочая гипотеза');await expect(page.locator('#situationSuggestion')).toContainText('Если не подтвердится');await expect(page.locator('#situationSuggestion .button')).toHaveAttribute('href',/#interests$/);
  }
});
test('pointer assignment previews skill and retains checkbox fallback',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/game.html');
  const source=await page.locator('[data-drag-person=maxim]').boundingBox(),target=await page.locator('[data-drop-task=prototype]').boundingBox();
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:12});
  await expect(page.locator('.drag-preview')).toContainText('Прототипирование 3/3');await page.mouse.up();
  await expect(page.locator('[data-assign=maxim]')).toBeChecked();await expect(page.locator('[data-drop-task=prototype] .task-avatars')).toContainText('М');
  await page.locator('[data-assign=maxim]').uncheck();await expect(page.locator('[data-assign=maxim]')).not.toBeChecked();
});
test('automatic pause and skip stop at changes without removing the project board',async({page})=>{
  await page.clock.install();await page.goto('/game.html');await expect(page.locator('#autoPause')).toBeChecked();await page.locator('#skipToEvent').click();
  await expect(page.locator('#gameStatus')).not.toBeEmpty();await expect(page.locator('.gantt-row')).toHaveCount(7);
  const time=await page.evaluate(()=>Workspace.profile(Workspace.active()).data.course.projectGame.time);await page.clock.runFor(32000);expect(await page.evaluate(()=>Workspace.profile(Workspace.active()).data.course.projectGame.time)).toBe(time);
});
