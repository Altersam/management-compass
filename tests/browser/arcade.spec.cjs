const {test,expect}=require('@playwright/test');
const games=['hybrid','meeting','ethics','change','telephone','versions','metrics','flow','sprint','influence'];
const click=(page,type,value)=>page.locator(`[data-action="${type}"]${value?`[data-value="${value}"]`:''}`).first().click();
test('all ten games load separate working objects and preserve same product shell',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));for(const id of games){await page.goto('/trainer.html?game='+id);await expect(page.locator('#arcadeBoard')).not.toBeEmpty();await expect(page.locator('.product-header>nav a')).toHaveText(['Теория','Игры','Ситуация','Техники','Дневник']);}expect(errors).toEqual([]);
});
test('Hybrid route can be rearranged and two trials reach a comparison result',async({page})=>{
  await page.goto('/trainer.html?game=hybrid');await click(page,'run');await expect(page.locator('.trial-result')).toHaveCount(1);await expect(page.locator('[name=context]')).toBeDisabled();
  await click(page,'add','research');await expect(page.locator('.route-builder li')).toHaveCount(6);
  for(let index=5;index>0;index--)await page.locator(`[data-action=move][data-index="${index}"][data-delta="-1"]`).click();
  await expect(page.locator('.route-builder li').first()).toContainText('Исследование');await click(page,'run');await expect(page.locator('#arcadeResult')).toBeVisible();await expect(page.locator('#arcadeResult')).toContainText('Выпуск завершает маршрут');
});
test('meeting obtains facts and confirms an executable resource choice',async({page})=>{
  await page.goto('/trainer.html?game=meeting');for(const [person,question] of [['it','constraint'],['finance','constraint'],['ops','fact'],['legal','constraint'],['owner','authority']]){await click(page,'person',person);await click(page,'ask',question);}await page.locator('[name=owner]').selectOption('owner');await page.locator('[data-form=commit] button').click();await expect(page.locator('#arcadeResult')).toContainText('подтверждена');
});
test('ethics and document reconstruction require actual investigation and authored reasoning',async({page})=>{
  for(const id of ['ethics','versions']){await page.goto('/trainer.html?game='+id);if(id==='ethics')await click(page,'openCases');await click(page,'inspect',id==='ethics'?'rule':'dates');await click(page,'inspect',id==='ethics'?'deadline':'copy');if(id==='ethics'){await click(page,'decision');const allocation=await page.evaluate(()=>CourseUI.data().course.arcadeGames.ethics.variant?'a':'b');await click(page,'allocation',allocation);await click(page,'criterion','deadline');await click(page,'disclosure','criterion');}await page.locator('[name=note]').fill('Проверяю существенный факт и право на решение по рабочему критерию.');await page.locator('[data-form] button').last().click();await expect(page.locator('#arcadeResult')).toBeVisible();await expect(page.locator(id==='ethics'?'.ethics-review':'.self-review')).toContainText('не оценивался автоматически');}
});
test('change lab runs delayed intervention rounds and telephone travels all five hops',async({page})=>{
  await page.goto('/trainer.html?game=change');await click(page,'observe');await click(page,'measure','example');for(let i=0;i<4;i++)await click(page,'round');await expect(page.locator('#arcadeResult')).toBeVisible();
  await page.goto('/trainer.html?game=telephone');for(const channel of ['email','meeting','email','document','meeting']){await page.locator('[name=channel]').selectOption(channel);await page.locator('[data-form=send] button').click();}await expect(page.locator('#arcadeResult')).toContainText('4/4');
});
test('metrics has controllable population and substantive conclusion',async({page})=>{
  await page.goto('/trainer.html?game=metrics');await click(page,'investigate');await click(page,'inspect','denominator');await click(page,'inspect','channels');await click(page,'channel','all');await click(page,'inspect','unfinished');await click(page,'pending','true');await expect(page.locator('.metric-observed')).toContainText('53');await click(page,'formulate');await click(page,'conclusion','hypothesis');await click(page,'next','users');await page.locator('[name=note]').fill('Среднее системы не описывает незавершённые и обращения в другом канале.');await page.locator('[data-form=decide] button').click();await expect(page.locator('#arcadeResult')).toBeVisible();
});
test('flow is a living timed system and sprint uses a real backlog rather than quiz scenes',async({page})=>{
  await page.clock.install();await page.goto('/trainer.html?game=flow');await page.locator('#arcadeClock').click();await page.clock.runFor(3600);await page.locator('#arcadeClock').click();await expect(page.locator('.request-dots i')).not.toHaveCount(0);for(let i=0;i<17;i++)await click(page,'tick');await expect(page.locator('#arcadeResult')).toBeVisible();
  await page.goto('/trainer.html?game=sprint');for(let i=0;i<3;i++){await click(page,'select','task-'+(i+1));await click(page,'sprint');}await expect(page.locator('#arcadeResult')).toBeVisible();
});
test('influence builds observed graph and ends with a real coalition check',async({page})=>{
  await page.goto('/trainer.html?game=influence');await page.locator('[data-map-action=startMap]').click();for(const [id,from,to,kind] of [['resource','lead','it','resource'],['information','it','anna','information'],['authority','director','lead','authority'],['application','lead','ops','resource']]){await page.locator(`[data-map-action=observe][data-value=${id}]`).click();await page.locator('[data-map-action=closeObservation]').click();await page.locator(`[data-map-action=node][data-actor=${from}]`).click();await page.locator('[data-map-action=beginLink]').click();await page.locator(`[data-map-action=node][data-actor=${to}]`).click();await page.locator(`[data-map-action=linkKind][data-value=${kind}]`).click();}await page.locator('[data-map-action=coalitionStage]').click();for(const id of ['lead','it','anna','ops'])await page.locator(`[data-map-action=node][data-actor=${id}]`).click();await page.locator('[data-map-action=implement]').click();await expect(page.locator('#arcadeResult')).toContainText('условия собраны');
});
test('game saves resume, finished restart archives only the selected game, catalog is engine lazy',async({page})=>{
  const requests=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));await page.goto('/games.html');await expect(page.locator('.training-game')).toHaveCount(12);expect(requests.some(p=>/\/arcade\/(hybrid|meeting|flow)\.js/.test(p))).toBe(false);
  await page.goto('/trainer.html?game=hybrid');await click(page,'add','research');await page.reload();await expect(page.locator('.route-builder li')).toHaveCount(6);await click(page,'run');await click(page,'run');await page.locator('#arcadeRestart button').click();await expect(page.locator('.route-builder li')).toHaveCount(5);const course=await page.evaluate(()=>CourseUI.data().course);expect(course.arcadeArchives.hybrid).toHaveLength(1);
});
test('all new games fit mobile and keyboard buttons remain operable',async({page})=>{
  test.setTimeout(60000);for(const width of [320,375,430,768,1024,1440]){await page.setViewportSize({width,height:1000});for(const id of games){await page.goto('/trainer.html?game='+id);await expect(page.locator('#arcadeBoard')).not.toBeEmpty();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' '+id).toBe(true);}}
  await page.goto('/trainer.html?game=hybrid');await page.locator('[data-action=add][data-value=research]').focus();await page.keyboard.press('Enter');await expect(page.locator('.route-builder li')).toHaveCount(6);
});
