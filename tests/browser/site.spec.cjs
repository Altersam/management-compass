const {test,expect}=require('@playwright/test');
const routes=['#/','#/lectures','#/lectures/1','#/lectures/9','#/practice','#/faq','#/faq/no-time','#/play/project'];
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
test('a lesson can be passed and unlocks the next one',async({page})=>{
  await page.goto('/index.html#/lesson/1.1');
  const solve=async()=>{const ex=await page.evaluate(async()=>{const {course}=await import('/content/course.js');const q=document.querySelector('.ls-q').textContent;const t=document.querySelector('.ls').dataset.type;return course[0].lessons[0].ex.find(e=>e.t===t&&q.includes(e.q.split('___')[0].slice(0,20)));});
    if(ex.t==='tf')await page.click(`[data-tf="${ex.ok}"]`);
    else if(['choice','case','fill'].includes(ex.t))await page.locator('[data-pick]',{hasText:ex.opts[ex.ok]}).first().click();
    else if(ex.t==='multi')for(const i of ex.ok)await page.locator('[data-pick]',{hasText:ex.opts[i]}).first().click();
    else if(ex.t==='match')for(const [a,b] of ex.pairs){await page.locator('[data-ml]',{hasText:a}).click();await page.locator('[data-mr]',{hasText:b}).click();}
    if(await page.locator('[data-ls="check"]:not([disabled])').count())await page.click('[data-ls="check"]');
    await expect(page.locator('.ls-foot.is-ok')).toBeVisible();await page.click('[data-ls="next"]');};
  for(let i=0;i<6;i++)await solve();
  await expect(page.locator('.ls-result h1')).toContainText('Без единой ошибки');
  await page.goto('/index.html#/practice');await expect(page.locator('#unit-1 a.node.is-done')).toHaveCount(1);await expect(page.locator('#unit-1 a.node.is-open')).toHaveCount(1);
});
test('faq search and topic filter narrow the list',async({page})=>{
  await page.goto('/index.html#/faq');const all=await page.locator('.faq-item').count();
  await page.fill('#faqSearch','совещание');await expect(page.locator('.faq-item')).not.toHaveCount(all);
  await page.fill('#faqSearch','');await page.click('[data-topic="7"]');await expect(page.locator('.faq-item')).toHaveCount(3);
  await page.locator('.faq-item summary').first().click();await expect(page.locator('.faq-do li').first()).toBeVisible();
});
test('a simulation is playable from brief to stars and saves the best result',async({page})=>{
  await page.goto('/index.html#/play/meeting');await page.click('[data-kit="start"]');
  for(const who of ['boss','it','hr','law'])await page.click(`[data-act="talk"][data-arg="${who}"]`);
  for(const d of ['scope:1','time:1','train:1'])await page.click(`[data-act="dial"][data-arg="${d}"]`);
  await page.click('[data-act="commit"]');await expect(page.locator('.g-big-star.on')).toHaveCount(3);
  await page.goto('/index.html#/practice');await page.click('text=Открыть все уровни');await expect(page.locator('a[href="#/play/meeting"] .stars svg.on')).toHaveCount(3);
});
