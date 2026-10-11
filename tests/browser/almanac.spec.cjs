const {test,expect}=require('@playwright/test');
test('five routes explain their purpose, search hides irrelevant materials and journal opens directly',async({page})=>{
  await page.goto('/');await expect(page.locator('.path-card')).toHaveCount(5);await page.locator('[data-path=theory]').click();await expect(page.locator('.theory-topic')).toHaveCount(10);
  await page.locator('#theorySearch').fill('документы');await expect(page.locator('.theory-topic')).toHaveCount(1);await page.locator('.theory-topic .topic-read').click();await expect(page).toHaveURL(/module-07.*#theory/);await expect(page.locator('#theory')).toBeVisible();
  await page.locator('.product-header [data-section="1"]').click();await expect(page.locator('.training-game')).toHaveCount(12);await page.locator('[data-game-filter=project]').click();await expect(page.locator('.training-game:visible')).toHaveCount(3);await page.locator('#gameSearch').fill('Sprint');await expect(page.locator('.training-game:visible')).toHaveCount(1);
  await page.locator('.product-header [data-section="3"]').click();await expect(page.locator('.atlas-card')).toHaveCount(3);await page.locator('#moduleSearch').fill('SIPOC');await expect(page.locator('.atlas-card')).toHaveCount(1);
  await page.locator('.product-header [data-section="4"]').click();await expect(page.locator('#diaryForm')).toBeVisible();await expect(page.locator('#route')).toBeHidden();await expect(page.locator('.product-header [data-section="4"]')).toHaveAttribute('aria-current','page');
});
test('theme switches both ways, survives navigation and leaves saved notes intact',async({page})=>{
  await page.goto('/workspace.html#diary');await page.locator('#diaryForm [name=title]').fill('Мой личный вывод');const before=await page.evaluate(()=>Workspace.export(Workspace.active()).data);
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.locator('#themeToggle').focus();await page.keyboard.press('Enter');await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  expect(await page.evaluate(()=>Workspace.export(Workspace.active()).data)).toEqual(before);await page.locator('.product-header [data-section="1"]').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.locator('#themeToggle').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.locator('.product-header [data-section="4"]').click();await expect(page.locator('#diaryForm [name=title]')).toHaveValue('Мой личный вывод');await expect(page.locator('#productFooter')).toContainText('не отправляет их на сервер');
});
test('new routes fit six widths in both themes and retain offline storage fallback',async({page})=>{
  test.setTimeout(90000);for(const theme of ['dark','light']){await page.goto('/');if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#themeToggle').click();
    for(const width of [320,375,430,768,1024,1440]){await page.setViewportSize({width,height:1000});for(const url of ['/','/theory.html','/games.html','/workspace.html#modules','/workspace.html#diary']){await page.goto(url);await expect(page.locator('.product-header')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme+' '+width+' '+url).toBe(true);}}
    if(process.env.REFERENCE_SCREENSHOTS){await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-'+theme+'-desktop.png',fullPage:true});await page.setViewportSize({width:375,height:850});await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-'+theme+'-mobile.png',fullPage:true});
      for(const [name,url] of [['theory','/theory.html'],['games','/games.html'],['techniques','/workspace.html#modules'],['diary','/workspace.html#diary']]){await page.setViewportSize({width:1440,height:1000});await page.goto(url);await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/almanac-'+theme+'-'+name+'.png',fullPage:true});}
    }
  }
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});await page.goto('/');await page.locator('#themeToggle').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect(page.locator('.path-card')).toHaveCount(5);
});
