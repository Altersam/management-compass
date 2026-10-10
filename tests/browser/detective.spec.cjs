const {test,expect}=require('@playwright/test');
async function source(page,key,pin=true){await page.locator(`[data-inspect="${key}"]:visible`).first().click();await expect(page.locator('#sourceDialog')).toBeVisible();if(pin)await page.locator('#pinSource').click();await page.locator('#closeSource').click();}
async function hypothesis(page,stage){await page.locator(`.detective-chain [data-stage="${stage}"]`).click();await page.locator('#hypothesisNote').fill('Долгое ожидание и возвраты совпадают в регистрации: сначала проверю вход.');}
test('player opens cases, records evidence, tests a wrong measure and revises it without a linear quiz',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1440,height:1000});await page.goto('/detective.html');
  await expect(page.locator('.detective-chain button')).toHaveCount(7);await expect(page.locator('.case-files button')).toHaveCount(5);await expect(page.locator('.source-folder')).toHaveCount(8);
  await page.locator('[data-case=case-2]').click();await source(page,'case:case-2');await source(page,'returns');await expect(page.locator('.trace-row')).toHaveCount(7);await expect(page.locator('.evidence-card.is-pinned')).toHaveCount(2);
  await hypothesis(page,'dispatch');await page.locator('[name=intervention][value=bounds]').check();await page.locator('#runPilot').click();await expect(page.locator('.latest-pilot')).toContainText('Основная потеря осталась');await expect(page.locator('.detective-chain button')).toHaveCount(7);
  await hypothesis(page,'register');await page.locator('[name=intervention][value=input]').check();await page.locator('#runPilot').click();await expect(page.locator('.latest-pilot')).toContainText('Полный срок уменьшился');
  if(process.env.REFERENCE_SCREENSHOTS)await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/detective-pilot.png',fullPage:true});
  await page.locator('#finishInvestigation').click();await expect(page.locator('#investigationResult')).toContainText('Неполный вход');await expect(page.locator('#investigationResult')).toContainText('2 из 5');expect(errors).toEqual([]);
  if(process.env.REFERENCE_SCREENSHOTS)await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/detective-final.png',fullPage:true});
});
test('source cost is charged once, draft and selection survive reload and catalog offers continuation',async({page})=>{
  await page.goto('/detective.html');await source(page,'versions',false);const spent=await page.evaluate(()=>CourseUI.data().course.detectiveGame.spent);await source(page,'versions',false);expect(await page.evaluate(()=>CourseUI.data().course.detectiveGame.spent)).toBe(spent);
  await page.locator('.detective-chain [data-stage=execute]').click();await page.locator('#hypothesisNote').fill('Проверить, совпадает ли версия исполнителя с действующей.');await page.locator('[name=intervention][value=version]').check();await page.reload();await expect(page.locator('#hypothesisNote')).toHaveValue(/версия/);await expect(page.locator('[data-stage=execute]').first()).toHaveAttribute('aria-pressed','true');await expect(page.locator('[name=intervention][value=version]')).toBeChecked();
  await page.goto('/games.html');await expect(page.locator('#detectiveGameEntry')).toContainText('Продолжить расследование');
});
test('investigation restart archives only its own game and completed evidence remains readable',async({page})=>{
  await page.goto('/detective.html');await page.evaluate(()=>Workspace.update(CourseUI.active,d=>{d.course.projectGame={revision:1,time:11};d.course.simulation={revision:2,decisions:['tight-check']};}));
  await source(page,'case:case-1');await source(page,'returns');await hypothesis(page,'register');await page.locator('[name=intervention][value=input]').check();await page.locator('#runPilot').click();await page.locator('#finishInvestigation').click();
  await page.locator('[data-inspect=returns]').first().click();await expect(page.locator('#sourceDocument')).toContainText('недостающим');await page.locator('#closeSource').click();
  await page.locator('#nextInvestigation [name=seed]').selectOption('case-03');await page.locator('#nextInvestigation button[type=submit]').click();await expect(page.locator('.detective-eyebrow').first()).toContainText('case-03');
  const course=await page.evaluate(()=>CourseUI.data().course);expect(course.detectiveGameArchive).toHaveLength(1);expect(course.detectiveGame.seed).toBe('case-03');expect(course.projectGame.time).toBe(11);expect(course.simulation.decisions).toEqual(['tight-check']);
});
test('games catalog is engine-lazy and main menu reaches both working games',async({page})=>{
  const requests=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));await page.goto('/games.html');await expect(page.locator('.training-game')).toHaveCount(2);
  expect(requests.some(path=>path.includes('/assets/detective/'))).toBe(false);expect(requests.some(path=>path.includes('/assets/game/'))).toBe(false);
  await page.locator('#detectiveGameEntry').click();await expect(page.locator('.detective-chain')).toBeVisible();await page.locator('.product-header>nav a').first().click();await expect(page).toHaveURL(/games\.html/);await page.locator('#projectGameEntry').click();await expect(page.locator('.gantt-row')).toHaveCount(7);
});
test('keyboard source reading, pinning and mobile areas remain usable at six widths',async({page})=>{
  await page.goto('/detective.html');await page.locator('[data-inspect=returns]').focus();await page.keyboard.press('Enter');await expect(page.locator('#closeSource')).toBeFocused();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Enter');await expect(page.locator('#pinSource')).toBeDisabled();await page.keyboard.press('Escape');await expect(page.locator('[data-inspect=returns]').first()).toBeFocused();
  for(const width of [320,375,430,768,1024,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width)).toBe(true);if(width<=430){await page.locator('[data-tab=sources]').click();await expect(page.locator('#detective-sources')).toBeVisible();await expect(page.locator('#detective-project')).toBeHidden();await page.locator('[data-tab=project]').click();}}
  await page.setViewportSize({width:375,height:850});await page.locator('[data-tab=project]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-tab=sources]')).toHaveAttribute('aria-selected','true');
  if(process.env.REFERENCE_SCREENSHOTS){await page.locator('[data-tab=project]').click();await page.locator('[data-case=case-2]').click();await source(page,'case:case-2',false);await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/detective-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/detective-desktop.png',fullPage:true});}
});
test('mobile investigation reaches pilot and finish without returning to a hidden sidebar',async({page})=>{
  await page.setViewportSize({width:375,height:850});await page.goto('/detective.html');await page.locator('[data-tab=sources]').click();await source(page,'case:case-1');await source(page,'returns');await page.locator('[data-tab=project]').click();await page.locator('.detective-chain [data-stage=register]').click();await page.locator('#serviceChain [data-refine]').click();await expect(page.locator('#detective-facts')).toBeVisible();
  await page.locator('#hypothesisNote').fill('Повторное уточнение сведений увеличивает задержку на входе.');await page.locator('[name=intervention][value=input]').check();await page.locator('#runPilot').click();await expect(page.locator('#detective-project')).toBeVisible();await expect(page.locator('#finishInvestigation')).toBeHidden();await page.locator('.latest-pilot [data-finish]').click();await expect(page.locator('#investigationResult')).toBeVisible();
});
