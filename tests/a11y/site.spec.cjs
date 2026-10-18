const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
for(const r of ['#/','#/theory','#/theory/3','#/theory/8','#/games','#/help','#/help/hard-talk',...['project','detective','flow','sprint','meeting','telephone','ethics','influence','change','approach','metrics','versions'].map(g=>'#/play/'+g)]){
  test(`no serious accessibility violations: ${r}`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/index.html'+r);await page.waitForSelector('#view h1');
    if(r.startsWith('#/play'))await page.click('[data-kit="start"]');
    const res=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
    const serious=res.violations.filter(v=>['serious','critical'].includes(v.impact));
    expect(serious.map(v=>`${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}
