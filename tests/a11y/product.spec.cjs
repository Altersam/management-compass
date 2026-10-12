const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const {createState}=require('../../assets/game/state.js'),{advance,act}=require('../../assets/game/engine.js'),{tasks}=require('../../assets/game/project.js');
async function check(page,url){const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();return results.violations.map(v=>({url,id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));}
for(const theme of ['dark','light'])test.describe(theme+' theme',()=>{
  test.beforeEach(async({page})=>{await page.addInitScript(theme=>localStorage.setItem('manager-almanac:theme',theme),theme);});
  test('five routes, forms and reference pages meet automated WCAG checks',async({page})=>{
    test.setTimeout(90000);const violations=[];
    for(const url of ['/','/theory.html','/games.html','/game.html','/workspace.html','/workspace.html#modules','/workspace.html#diary','/navigator.html','/experiments.html','/settings.html','/sources.html','/adizes.html','/adizes-paei.html','/adizes-capi.html','/adizes-lifecycle.html','/modules/module-03.html#delegate']){await page.goto(url);await expect(page.locator('.product-header')).toBeVisible();violations.push(...await check(page,url));}
    expect(violations).toEqual([]);
  });
  test('all course scene types and authored responses are accessible',async({page})=>{
    const violations=[];for(let id=1;id<=10;id++){await page.goto(`/learn.html?module=${id}`);await expect(page.locator('.activity-'+id)).toBeVisible();violations.push(...await check(page,'topic '+id));}
    await page.goto('/learn.html?module=5#theory-1');violations.push(...await check(page,'productive response'));expect(violations).toEqual([]);
  });
  test('expanded theory and all diagram types retain accessible explanations in both sizes',async({page})=>{
    test.setTimeout(180000);const violations=[];
    for(let id=1;id<=10;id++){await page.goto(`/modules/module-${String(id).padStart(2,'0')}.html#theory`);await expect(page.locator('.depth-article')).toHaveCount(2);violations.push(...await check(page,'full theory '+id));}
    for(const width of [1440,375]){await page.setViewportSize({width,height:1000});
      for(const diagram of ['depth-fishbone','depth-decomposition','balance-wheel','focus-blocks','service-time','depth-data-maturity']){
        await page.goto('/theory.html?view=schemes&diagram='+diagram);await expect(page.locator('#schemeCanvas [data-diagram]')).toHaveAttribute('data-diagram',diagram);
        if(width===375)await page.locator('#schemeCanvas .diagram-graphic summary').click();
        violations.push(...await check(page,'scheme '+diagram+' '+width));
      }
    }expect(violations).toEqual([]);
  });
  test('mobile situation result and game dialog retain accessible controls',async({page})=>{
    await page.setViewportSize({width:375,height:850});await page.goto('/navigator.html');await page.locator('[name=q0]').first().check();await page.locator('[name=q1]').first().check();await page.locator('#situationQuestions button').click();expect(await check(page,'hypothesis')).toEqual([]);
    await page.goto('/game.html');for(let i=0;i<4;i++){await page.locator('#skipToEvent').click();if(await page.locator('#gameEventChoice').isVisible()){expect(await check(page,'event trade-offs')).toEqual([]);await page.locator('#eventBackToBoard').click();}}await page.locator('#mcEventHistory>summary').click();const why=page.locator('[data-explain]').first();await expect(why).toBeVisible();await why.click();expect(await check(page,'dialog')).toEqual([]);
  });
  test('task drawer, causal replay and completed comparison are accessible',async({page})=>{
    await page.goto('/game.html');await page.locator('.gantt-task-name[data-task=prototype]').click();expect(await check(page,'task drawer')).toEqual([]);await page.locator('.task-more>summary').click();expect(await check(page,'task secondary controls')).toEqual([]);
    let state=createState('service-20',{balanceVersion:1});for(const t of tasks)state=act(state,{type:'assign',task:t.id,people:t.assigned});for(let i=0;i<80;i++)state=advance(state);
    await page.evaluate(s=>Workspace.update(Workspace.active(),d=>d.course.projectGame=s),state);await page.reload();await page.locator('#mcEventHistory>summary').click();await page.locator('[data-event-id=requirements-return]').click();expect(await check(page,'causal review')).toEqual([]);await page.locator('#compareCause').click();expect(await check(page,'causal comparison')).toEqual([]);
  });
  test('detective sources, selected clues, pilot and final are accessible',async({page})=>{
    const {openCase,selectKeys,pilot}=require('../helpers/detective-runs.cjs');
    const book=await openCase(page);await expect(page.locator('.detective-chain')).toBeVisible();expect(await check(page,'detective initial')).toEqual([]);
    await selectKeys(page,book);expect(await check(page,'detective selected clues')).toEqual([]);
    await pilot(page,book.archetype.trueStage,book.archetype.effectiveInterventions[0]);expect(await check(page,'detective pilot')).toEqual([]);await page.locator('#finishInvestigation').click();expect(await check(page,'detective final')).toEqual([]);
    await page.setViewportSize({width:375,height:850});expect(await check(page,'detective mobile final')).toEqual([]);
  });
  test('all ten arcade mechanics are accessible at desktop and mobile',async({page})=>{
    test.setTimeout(180000);const {ids}=require('../helpers/arcade-runs.cjs'),violations=[];
    for(const width of [1440,375]){await page.setViewportSize({width,height:1000});for(const id of ids){await page.goto('/trainer.html?game='+id);await expect(page.locator('#arcadeBoard')).not.toBeEmpty();violations.push(...await check(page,'arcade '+id+' '+width));}}expect(violations).toEqual([]);
  });
  test('saved arcade results retain accessible final and self-review controls',async({page})=>{
    test.setTimeout(180000);const {ids,finishedGame}=require('../helpers/arcade-runs.cjs'),violations=[];
    for(const id of ids){await page.goto('/trainer.html?game='+id);await expect(page.locator('#arcadeBoard')).not.toBeEmpty();await page.evaluate(({id,state})=>{if(['hybrid','sprint','meeting'].includes(id))sessionStorage.setItem('management-compass:legacy-view:'+id,state.seed);Workspace.update(Workspace.active(),d=>{d.course.arcadeGames??={};d.course.arcadeGames[id]=state;});},{id,state:finishedGame(id)});await page.reload();await expect(page.locator('#arcadeResult')).toBeVisible();
      for(const width of [1440,375]){await page.setViewportSize({width,height:1000});violations.push(...await check(page,'arcade final '+id+' '+width));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' final '+width).toBe(true);}
    }expect(violations).toEqual([]);
  });
});
