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
