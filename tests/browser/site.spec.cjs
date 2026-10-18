const {test,expect}=require('@playwright/test');
const routes=['#/','#/lectures','#/lectures/1','#/lectures/9','#/games','#/faq','#/faq/no-time','#/play/project/1','#/play/day/1'];
test('main routes render without errors and without horizontal scroll on phone and desktop',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  for(const width of [375,1366]){await page.setViewportSize({width,height:900});
    for(const r of routes){await page.goto('/index.html'+r);await expect(page.locator('#view h1').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${r}`).toBe(true);}}
  expect(errors).toEqual([]);
});
test('old addresses redirect to the new sections',async({page})=>{
  await page.goto('/modules/module-03.html');await expect(page).toHaveURL(/#\/theory\/3$/);await expect(page.locator('h1')).toContainText('командой');
  await page.goto('/trainer.html?game=metrics');await expect(page).toHaveURL(/#\/play\/metrics$/);
});
test('lecture blocks are interactive',async({page})=>{
  await page.goto('/index.html#/lectures/2');
  const steps=page.locator('[data-block="steps"]').first();await steps.locator('.b-step').nth(2).click();
  await expect(steps.locator('.b-step').nth(2)).toHaveAttribute('aria-pressed','true');
  const quiz=page.locator('[data-block="quiz"]').first();await quiz.locator('.opt').first().click();await expect(quiz.locator('.feedback')).toBeVisible();
  await page.goto('/index.html#/lectures/9');const calc=page.locator('[data-kind="kpi"]');await expect(calc.locator('.b-calc-out')).toContainText('83%');
});
test('day game: plan, live the day, earn stars and unlock level 2',async({page})=>{
  await page.goto('/index.html#/play/day/1');await page.click('[data-kit="start"]');
  for(const [id,slot] of [['strat',0],['report',2],['talk',3],['mail',4]]){await page.click(`[data-act="pick"][data-arg="${id}"]`);await page.click(`[data-act="slot"][data-arg="${slot}"]`);}
  await page.click('[data-act="pick"][data-arg="spr"]');await page.click('[data-act="delegate"]');
  await page.click('[data-act="pick"][data-arg="news"]');await page.click('[data-act="drop"]');
  await page.click('[data-act="run"]');await expect(page.locator('.g-big-star.on')).toHaveCount(3,{timeout:5000});
  await expect(page.locator('a[href="#/play/day/2"]')).toBeVisible();
  await page.goto('/index.html#/games');await expect(page.locator('a.gm-lv[href="#/play/day/2"]')).toBeVisible();await expect(page.locator('#topic-1 .gm-lv.is-locked')).toHaveCount(1);
});
test('faq search and topic filter narrow the list',async({page})=>{
  await page.goto('/index.html#/faq');const all=await page.locator('.faq-item').count();
  await page.fill('#faqSearch','совещание');await expect(page.locator('.faq-item')).not.toHaveCount(all);
  await page.fill('#faqSearch','');await page.click('[data-topic="7"]');await expect(page.locator('.faq-item')).toHaveCount(3);
  await page.locator('.faq-item summary').first().click();await expect(page.locator('.faq-do li').first()).toBeVisible();
});
test('a simulation is playable from brief to stars and saves the best result',async({page})=>{
  await page.goto('/index.html#/play/meeting/1');await page.click('[data-kit="start"]');
  for(const who of ['boss','it','hr','law'])await page.click(`[data-act="talk"][data-arg="${who}"]`);
  await page.click(`[data-act="meet"]`);
  for(const d of ['scope:1','time:1','train:1'])await page.click(`[data-act="dial"][data-arg="${d}"]`);
  await page.click('[data-act="commit"]');await expect(page.locator('.g-big-star.on')).toHaveCount(3,{timeout:5000});
  await page.goto('/index.html#/games');await expect(page.locator('a.gm-lv[href="#/play/meeting/1"] .stars svg.on')).toHaveCount(3);
});
