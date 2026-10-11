const {test,expect}=require('@playwright/test');
async function toggleTheme(page){await page.locator('.secondary-menu>summary').click();await page.locator('#themeToggle').click();await page.locator('.secondary-menu>summary').click();}
test('five routes explain their purpose, search hides irrelevant materials and journal opens directly',async({page})=>{
  await page.goto('/');await expect(page.locator('.index-row')).toHaveCount(3);await expect(page.locator('[data-path]')).toHaveCount(5);await page.locator('[data-path=theory]').click();await expect(page.locator('.theory-topic')).toHaveCount(10);
  await page.locator('#theorySearch').fill('документы');await expect(page.locator('.theory-topic')).toHaveCount(1);await page.locator('.theory-topic .topic-read').click();await expect(page).toHaveURL(/module-07.*#theory/);await expect(page.locator('#theory')).toBeVisible();
  await page.locator('.product-header [data-section="1"]').click();await expect(page.locator('.training-game')).toHaveCount(12);await expect(page.locator('.game-row')).toHaveCount(10);await expect(page.locator('.game-group>h2')).toHaveText(['Проект и ресурс','Люди и договорённости','Процесс и данные']);
  await page.locator('.product-header [data-section="3"]').click();await expect(page.locator('.atlas-card')).toHaveCount(3);await page.locator('#moduleSearch').fill('SIPOC');await expect(page.locator('.atlas-card')).toHaveCount(1);
  await page.locator('.product-header [data-section="4"]').click();await expect(page.locator('#diaryForm')).toBeVisible();await expect(page.locator('#route')).toBeHidden();await expect(page.locator('.product-header [data-section="4"]')).toHaveAttribute('aria-current','page');
});
test('theme switches both ways, survives navigation and leaves saved notes intact',async({page})=>{
  await page.goto('/workspace.html#diary');await page.locator('#diaryForm [name=title]').fill('Мой личный вывод');const before=await page.evaluate(()=>Workspace.export(Workspace.active()).data);
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.locator('.secondary-menu>summary').click();await page.locator('#themeToggle').focus();await page.keyboard.press('Enter');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.locator('.secondary-menu>summary').click();
  expect(await page.evaluate(()=>Workspace.export(Workspace.active()).data)).toEqual(before);await page.locator('.product-header [data-section="1"]').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await toggleTheme(page);await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.locator('.product-header>nav [data-section="4"]').click();await expect(page.locator('#diaryForm [name=title]')).toHaveValue('Мой личный вывод');await expect(page.locator('#productFooter')).toContainText('Личные записи остаются в вашем браузере');
});
test('diagram library exposes every model and mobile can open the graphical form and full reading',async({page})=>{
  test.setTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/theory.html?view=schemes');await expect(page.locator('[data-scheme]')).toHaveCount(70);
  const ids=await page.locator('[data-scheme]').evaluateAll(buttons=>buttons.map(b=>b.dataset.scheme));
  for(const id of ids){await page.locator(`[data-scheme="${id}"]`).click();await expect(page.locator('#schemeCanvas [data-diagram]')).toHaveAttribute('data-diagram',id);await expect(page.locator('#schemeCanvas svg')).toBeVisible();}
  await page.locator('#schemeSearch').fill('Исикава');await expect(page.locator('[data-scheme]')).toHaveCount(1);await expect(page.locator('#schemeCanvas')).toContainText('Ни одна ветвь не становится доказательством');
  await page.setViewportSize({width:375,height:850});await page.goto('/theory.html?view=schemes&topic=8&diagram=depth-fishbone');await expect(page.locator('#schemeCanvas [data-diagram]')).toHaveAttribute('data-diagram','depth-fishbone');
  await expect(page.locator('#schemeCanvas svg')).toBeHidden();await page.locator('#schemeCanvas .diagram-graphic summary').click();await expect(page.locator('#schemeCanvas svg')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#schemeCanvas .mode-link').click();await expect(page).toHaveURL(/#reading-fishbone$/);await expect(page.locator('#reading-fishbone')).toBeVisible();await expect(page.locator('#reading-fishbone')).toContainText('Для каждой ветви нужен проверяемый факт');
  await page.reload();await expect(page.locator('#reading-fishbone')).toBeVisible();expect(errors).toEqual([]);
  if(process.env.REFERENCE_SCREENSHOTS){await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-theory-full-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.goto('/theory.html?view=schemes&topic=8&diagram=depth-fishbone');await expect(page.locator('#schemeCanvas svg')).toBeVisible();await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-schemes-light.png',fullPage:true});await toggleTheme(page);await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-schemes-dark.png',fullPage:true});}
});
test('new routes fit six widths in both themes and retain offline storage fallback',async({page})=>{
  test.setTimeout(90000);for(const theme of ['dark','light']){await page.goto('/');if(await page.locator('html').getAttribute('data-theme')!==theme)await toggleTheme(page);
    for(const width of [320,375,430,768,1024,1440]){await page.setViewportSize({width,height:1000});for(const url of ['/','/theory.html','/games.html','/workspace.html#modules','/workspace.html#diary']){await page.goto(url);await expect(page.locator('.product-header')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme+' '+width+' '+url).toBe(true);}}
    if(process.env.REFERENCE_SCREENSHOTS){await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-'+theme+'-desktop.png',fullPage:true});await page.setViewportSize({width:375,height:850});await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-'+theme+'-mobile.png',fullPage:true});
      for(const [name,url] of [['theory','/theory.html'],['games','/games.html'],['techniques','/workspace.html#modules'],['diary','/workspace.html#diary']]){await page.setViewportSize({width:1440,height:1000});await page.goto(url);await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-'+theme+'-'+name+'.png',fullPage:true});}
    }
  }
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});await page.goto('/');await toggleTheme(page);await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('[data-path]')).toHaveCount(5);
});
