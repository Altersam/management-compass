const {test,expect}=require('@playwright/test');
const routes=['#/','#/theory','#/theory/1','#/theory/10','#/games','#/help','#/help/no-time','#/play/project'];
test('main routes render without errors and without horizontal scroll on phone and desktop',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  for(const width of [375,1366]){await page.setViewportSize({width,height:900});
    for(const r of routes){await page.goto('/index.html'+r);await expect(page.locator('#view h1').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${r}`).toBe(true);}}
  expect(errors).toEqual([]);
});
test('old addresses redirect to the new sections',async({page})=>{
  await page.goto('/modules/module-03.html');await expect(page).toHaveURL(/#\/theory\/3$/);await expect(page.locator('h1')).toContainText('Команда');
  await page.goto('/trainer.html?game=metrics');await expect(page).toHaveURL(/#\/play\/metrics$/);
});
test('theory quiz gives feedback and counts progress',async({page})=>{
  await page.goto('/index.html#/theory/2');const quiz=page.locator('.quiz').first();await quiz.locator('[data-opt="1"]').click();
  await expect(quiz.locator('.quiz-why')).toContainText('Верно');await page.goto('/index.html#/theory');await expect(page.locator('a[href="#/theory/2"]')).toContainText('1/4');
});
test('help search and topic filter narrow the list',async({page})=>{
  await page.goto('/index.html#/help');const all=await page.locator('.help-item').count();
  await page.fill('#helpSearch','совещание');await expect(page.locator('.help-item')).not.toHaveCount(all);
  await page.fill('#helpSearch','');await page.click('[data-topic="7"]');await expect(page.locator('.help-item')).toHaveCount(3);
  await page.click('.help-item >> nth=0');await expect(page.locator('.do-list li').first()).toBeVisible();
});
test('a game is playable from intro to stars and saves the best result',async({page})=>{
  await page.goto('/index.html#/play/meeting');await page.click('[data-kit="start"]');
  for(const who of ['boss','it','hr','law'])await page.click(`[data-act="talk"][data-arg="${who}"]`);
  for(const d of ['scope:1','time:1','train:1'])await page.click(`[data-act="dial"][data-arg="${d}"]`);
  await page.click('[data-act="commit"]');await expect(page.locator('.g-big-star.on')).toHaveCount(3);
  await page.goto('/index.html#/games');await expect(page.locator('a[href="#/play/meeting"] .stars svg.on')).toHaveCount(3);
});
