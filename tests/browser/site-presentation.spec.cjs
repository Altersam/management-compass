const {test,expect}=require('@playwright/test');
const routes=[['home','/'],['theory','/theory.html'],['schemes','/theory.html?view=schemes&diagram=depth-fishbone'],['games','/games.html'],['navigator','/navigator.html'],['route','/workspace.html#route'],['techniques','/workspace.html#modules'],['journal','/workspace.html#diary'],['experiments','/experiments.html'],['settings','/settings.html'],['sources','/sources.html'],['adizes','/adizes.html'],['paei','/adizes-paei.html'],['capi','/adizes-capi.html'],['lifecycle','/adizes-lifecycle.html'],...Array.from({length:10},(_,i)=>['chapter-'+(i+1),`/modules/module-${String(i+1).padStart(2,'0')}.html`]),['lesson','/learn.html?module=8'],['project','/game.html'],['detective','/detective.html'],['approach','/trainer.html?game=hybrid'],['sprint','/trainer.html?game=sprint'],['meeting','/trainer.html?game=meeting']];
test('all public sections share the new palette and maintain a valid desktop/mobile page structure',async({page})=>{
  test.setTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const theme of ['light','dark']){
    await page.addInitScript(t=>localStorage.setItem('manager-almanac:theme',t),theme);
    for(const width of [1440,375]){await page.setViewportSize({width,height:1000});for(const [name,url] of routes){
      await page.goto(url);await expect(page.locator('.product-header')).toHaveCount(1);await expect(page.locator('main')).toHaveCount(1);await expect(page.locator('#productFooter')).toHaveCount(1);await expect(page.locator('main h1:visible')).toHaveCount(1);
      await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
      expect(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),name+' '+theme).toBe(theme==='dark'?'rgb(16, 27, 50)':'rgb(224, 228, 235)');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' '+theme+' '+width).toBe(true);
      const target=await page.locator('.skip-link').evaluate(a=>new URL(a.href).hash);expect(target).toMatch(/^#/);await expect(page.locator(target)).toHaveCount(1);
      if(process.env.REFERENCE_SCREENSHOTS&&['home','theory','techniques','journal','settings','chapter-1','lesson','approach'].includes(name))await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+`/site-${theme}-${name}-${width}.png`,fullPage:true,animations:'disabled'});
    }}
  }expect(errors).toEqual([]);
});
test('site theme changes via settings and navigation without mutating saved work',async({page})=>{
  await page.goto('/settings.html');await expect(page.locator('#appearanceTheme option')).toHaveText(['Светлая — металлик, розовый, синий','Тёмная — тёмно-синий, оранжевый, коралловый']);
  const before=await page.evaluate(()=>JSON.stringify(Workspace.export(Workspace.active()).data));await page.locator('#appearanceTheme').selectOption('dark');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(await page.evaluate(()=>JSON.stringify(Workspace.export(Workspace.active()).data))).toBe(before);
  await page.locator('.product-header [data-section="0"]').click();await expect(page).toHaveURL(/theory\.html/);await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.locator('.secondary-menu>summary').click();await page.locator('#themeToggle').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
test('old saved games open current interfaces by default and retain the original earned state in archives',async({page})=>{
  for(const [id,version,selector] of [['sprint',2,'.goal-sprint-game'],['hybrid',3,'[data-approach=start]'],['meeting',2,'[data-decision-action=start]']]){
    const game=require('../../assets/arcade/'+id+'.js'),old=game.create('previous-'+id);old.custom='retain';await page.goto('/');await page.evaluate(({id,old})=>Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames[id]=old;}),{id,old});await page.goto('/trainer.html?game='+id);await expect(page.locator(selector)).toBeVisible();const c=await page.evaluate(()=>CourseUI.data().course);expect(c.arcadeGames[id].modelVersion).toBe(version);expect(c.arcadeArchives[id].at(-1)).toEqual(old);await page.reload();await expect(page.locator(selector)).toBeVisible();expect(await page.evaluate(id=>CourseUI.data().course.arcadeArchives[id].length,id)).toBe(c.arcadeArchives[id].length);
  }
});
