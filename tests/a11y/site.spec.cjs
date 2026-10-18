const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const routes=['#/','#/lectures',...[1,2,3,4,5,6,7,8,9,10].map(n=>'#/lectures/'+n),'#/games','#/faq','#/faq/hard-talk',...['day','project','detective','flow','sprint','meeting','telephone','ethics','influence','change','approach','metrics','versions'].map(g=>'#/play/'+g+'/1')];
for(const r of routes){
  test(`no serious accessibility violations: ${r}`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/index.html'+r);
    await page.waitForSelector('#view h1');
    if(r.startsWith('#/play'))await page.click('[data-kit="start"]');
    const res=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
    const serious=res.violations.filter(v=>['serious','critical'].includes(v.impact));
    expect(serious.map(v=>`${v.id}: ${v.nodes.length} ${v.nodes[0]?.target}`)).toEqual([]);
  });
}
