const {test,expect}=require('@playwright/test'),AxeBuilder=require('@axe-core/playwright').default;
const {openModern,basis,choose}=require('../helpers/ethics-dossier-runs.cjs');
for(const theme of ['light','dark'])test('ethical source checks, principles, protection and future report are accessible: '+theme,async({page})=>{
  await page.addInitScript(t=>localStorage.setItem('manager-almanac:theme',t),theme);await page.clock.install();await page.setViewportSize({width:375,height:1000});await openModern(page);
  const check=async()=>expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  await check();await basis(page);await page.locator('.dossier-decisions details summary').click();await check();await choose(page);await page.clock.runFor(3000);await check();await page.locator('[data-dossier-action=reveal]').click();await check();await page.locator('[data-dossier-action=finish]').click();await check();
});
