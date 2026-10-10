const {test,expect}=require('@playwright/test');
async function range(page,name,value){await page.locator(`input[name="${name}"]`).evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function ethics(page){for(const id of ['facts','independent','criteria'])await page.locator(`[data-ethics="${id}"]`).click();}
test('landing has meaningful static HTML with two entries and four stages without JavaScript',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL}),page=await context.newPage();await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Практика управления');await expect(page.locator('.welcome-actions a')).toHaveCount(2);await expect(page.locator('.course-stage')).toHaveCount(4);await expect(page.locator('.topic-link')).toHaveCount(10);
  await expect(page.locator('main')).toContainText('работать с людьми');await context.close();
});
test('home loads a small entry and imports simulation only when requested',async({page})=>{
  const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
  await page.goto('/');await expect(page.locator('.learning-header .secondary-menu')).toBeVisible();
  for(const file of ['content.js','knowledge.js','course-questions.js','learning-content.js','question-revision.js','activities.js','simulation-engine.js','visuals.js'])expect(requests.some(p=>p.endsWith('/'+file)),file).toBe(false);
  await page.goto('/#trajectory');await expect(page.locator('.trajectory-timeline li')).toHaveCount(10);
  expect(requests.some(p=>p.endsWith('/simulation-engine.js'))).toBe(false);
  await page.goto('/#final');await expect(page.locator('#makeSimulationDecision')).toBeVisible();
  expect(requests.some(p=>p.endsWith('/simulation-engine.js'))).toBe(true);
  expect(requests.some(p=>p.endsWith('/course-questions.js'))).toBe(false);
});
test('learning starts in the day, changes its budget and replaces understood buttons with decisions',async({page})=>{
  await page.goto('/');await page.locator('#startCourse').click();await expect(page.locator('.activity-1')).toBeVisible();await expect(page.locator('#ackTheory')).toHaveCount(0);
  const before=await page.locator('.activity-metrics').textContent();await page.locator('[name=plan-meeting]').selectOption('delegate');await page.locator('[name=plan-requests]').selectOption('delegate');await page.locator('[name=plan-team]').selectOption('later');await page.locator('[name=focus]').check();await page.locator('[name=notify]').check();
  expect(await page.locator('.activity-metrics').textContent()).not.toBe(before);await page.locator('.activity-decide').click();await page.locator('#activityNext a').click();
  for(let i=0;i<3;i++){
    const answer=await page.evaluate(i=>PEDAGOGY.topics[1].blocks[i].micro.answer,i);await page.locator(`#microAction input[value="${answer}"]`).check();await page.locator('#microAction button').click();await expect(page.locator('#microFeedback')).not.toBeEmpty();await page.locator('#microNext a').click();
  }
  await expect(page.locator('input[name=burst]')).toBeChecked();await page.locator('.activity-decide').click();await page.locator('#activityNext a').click();await page.locator('.natural-next a[href="#transfer"]').click();
  await page.locator('#moduleTransfer [name=action]').fill('Защитить время для анализа без обычных сообщений');await page.locator('#moduleTransfer [name=place]').fill('В подготовке еженедельного отчёта');const today=await page.evaluate(()=>WorkspaceUI.today());await page.locator('#moduleTransfer [name=reviewDate]').fill(today);await page.locator('#moduleTransfer button').click();
  await page.locator('#moduleTransfer [name=action]').fill('Защитить час анализа и согласовать критические обращения');await page.locator('#moduleTransfer button').click();
  expect(await page.evaluate(()=>CourseUI.data().experiments.length)).toBe(1);expect(await page.evaluate(()=>CourseModel.report(CourseUI.data(),1,COURSE.questions[1]).mastered)).toBe(true);
  await page.goto('/experiments.html');await expect(page.locator('.experiment-row')).toContainText('Защитить час');await page.locator('.experiment-row summary').click();await page.locator('[name=outcome]').selectOption('partly');await page.locator('[name=why]').fill('Анализ закончен, но критические обращения ещё надо различать.');await page.locator('[data-experiment-review] button').click();await expect(page.locator('.experiment-history')).toContainText('Частично помогло');
});
test('each topic has a different causal object and its controls change observations',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const objects=['.workday','.order-timeline','.autonomy-scale','.decision-tree','.message-workbench','.department-map','.paper-document','.process-workbench','.adoption-story','.dashboard-workbench'];
  for(let id=1;id<=10;id++){await page.goto(`/learn.html?module=${id}`);await expect(page.locator(objects[id-1])).toBeVisible();await expect(page.locator('.module-progress')).toHaveCount(0);if(id===4)await ethics(page);await page.locator('.activity-decide').click();await expect(page.locator('#activityNext a')).toBeVisible();}
  await page.goto('/learn.html?module=2');await page.locator('[name=check]').selectOption('ready');await page.locator('[name=point]').selectOption('2');await expect(page.locator('.dependency-view .useful')).toBeVisible();await page.locator('[name=point]').selectOption('4');await expect(page.locator('.dependency-view .late')).toBeVisible();
  await page.goto('/learn.html?module=3');await range(page,'level',3);await page.locator('[name=bounds]').check();const skilled=await page.locator('.teacher-consequences').textContent();await page.locator('[name=newTask]').check();expect(await page.locator('.teacher-consequences').textContent()).not.toBe(skilled);
  await page.goto('/learn.html?module=5');await page.locator('[data-move="2:up"]').click();await page.locator('[data-move="1:up"]').click();await expect(page.locator('.message-piece').first()).toHaveAttribute('data-part','request');
  await page.goto('/learn.html?module=7');await page.locator('[name=version]').selectOption('old');for(const name of ['delivered','understood','executed','accepted'])await page.locator(`[name=${name}]`).check();await expect(page.locator('.activity-metrics')).toContainText('ещё не принят');
  await page.goto('/learn.html?module=8');const base=await page.locator('.queue-chart').textContent();await range(page,'incoming',90);expect(await page.locator('.queue-chart').textContent()).not.toBe(base);await range(page,'approvals',3);await expect(page.locator('#processWaiting')).toContainText('72');
  await page.goto('/learn.html?module=9');await page.locator('[name=group]').selectOption('access');await page.locator('[name=help]').selectOption('access');await expect(page.locator('.activity-metrics')).toContainText('17');
  await page.goto('/learn.html?module=10');await page.locator('[name=scope]').selectOption('all');await expect(page.locator('.activity-metrics')).toContainText('26');expect(errors).toEqual([]);
});
test('question presentation survives reload while consequence and canonical answer stay aligned',async({page})=>{
  await page.goto('/learn.html?module=6#check');const before=await page.locator('.learning-question input').evaluateAll(inputs=>inputs.map(i=>i.value));await page.reload();expect(await page.locator('.learning-question input').evaluateAll(inputs=>inputs.map(i=>i.value))).toEqual(before);
  const answer=await page.evaluate(()=>COURSE.questions[6][0].answer);await page.locator(`input[value="${answer}"]`).check();await page.locator('#singleDecision button').click();await expect(page.locator('#decisionFeedback')).toContainText('Что произойдёт дальше');expect(await page.evaluate(()=>CourseUI.data().course.modules['6'].answers['m6-q1'])).toBe(answer);
});
test('simulation branches on history, rewinds continuation, resumes and describes decisions without a grade',async({page})=>{
  await page.goto('/#final');await page.locator('input[value=tight-check]').check();await page.locator('#makeSimulationDecision').click();await expect(page.locator('#simulationDecisionFeedback')).toContainText('зависимость от руководителя');await page.locator('#nextSimulationScene').click();await expect(page.locator('#secondaryContent h1')).toContainText('Очередь переместилась');
  await page.locator('#undoSimulationDecision').click();await page.locator('input[value=sort-flow]').check();await page.locator('#makeSimulationDecision').click();await page.locator('#nextSimulationScene').click();await expect(page.locator('#secondaryContent h1')).not.toContainText('Очередь переместилась');
  const rest=['narrow-bound','exceptions','deadline-rule','clear-choice','sponsor-options','confirm-meaning','bottleneck','align-example','compare-context'];
  for(const id of rest){await page.locator(`input[value="${id}"]`).check();await page.locator('#makeSimulationDecision').click();await page.locator('#nextSimulationScene').click();}
  await expect(page.locator('.decision-profile')).toContainText('Системная причина');await expect(page.locator('.decision-profile')).toContainText('Полномочия');await expect(page.locator('main')).not.toContainText('8/10');
  await page.locator('#simulationReflection').fill('Проверить ожидание передачи и не делать вывод о ресурсе по одному среднему.');await page.locator('#saveSimulationReflection').click();await page.reload();await expect(page.locator('.decision-profile')).toBeVisible();expect(await page.evaluate(()=>CourseUI.data().journal.filter(e=>e.type==='Решение').length)).toBe(1);
});
test('work navigator asks ordinary diagnostic questions and distinguishes resource from handoff',async({page})=>{
  await page.goto('/workspace.html');await expect(page.locator('#problemSelect option')).toHaveCount(12);await page.locator('#problemSelect').selectOption('other-team');
  await page.locator('input[name=q0][value=busy]').check();await page.locator('input[name=q1][value=yes]').check();await page.locator('#situationQuestions button').click();await expect(page.locator('#situationSuggestion')).toContainText('ресурсный выбор');await expect(page.locator('#situationSuggestion .button')).toHaveAttribute('href',/#deviation$/);
  await page.locator('input[name=q0][value=input]').check();await page.locator('input[name=q1][value=no]').check();await page.locator('#situationQuestions button').click();await expect(page.locator('#situationSuggestion .button')).toHaveAttribute('href',/#handoff$/);await page.reload();await expect(page.locator('#problemSelect')).toHaveValue('overload');
});
test('legacy records, real experiments, profile selection and backup remain compatible',async({page})=>{
  await page.goto('/');await page.evaluate(()=>{
    const data={favorites:[8],journal:[{id:'old-note',date:'2026-10-08',type:'Рефлексия',title:'Прежняя запись',situation:'Старые факты',learning:'Вывод',action:'Шаг',rating:3,createdAt:'2026-10-08',updatedAt:''}],caseAnswers:{focus:{choice:1,correct:true}},caseReflections:{focus:'Старая мысль'},worksheets:{taskForm:{result:'Прежнее поручение'}},assessments:{paei:{values:[5,4,3]}}};localStorage.setItem('management-compass:v1',JSON.stringify({version:1,active:'personal',profiles:[{id:'personal',name:'Прежний профиль',data}]}));
  });
  await page.goto('/learn.html?module=3');await page.locator('.activity-decide').click();await page.goto('/workspace.html#practice');await expect(page.locator('#taskForm [name=result]')).toHaveValue('Прежнее поручение');
  await page.goto('/workspace.html#diary');await page.locator('.notes-archive summary').click();await expect(page.locator('#diaryList')).toContainText('Прежняя запись');
  await page.goto('/settings.html');const backup=await page.evaluate(()=>Workspace.export(CourseUI.active));expect(backup.data.assessments.paei.values[0]).toBe(5);expect(backup.data.course.modules['3'].activities.intro.done).toBe(true);
  await page.locator('#learningImport').setInputFiles({name:'copy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await expect(page.locator('#learningProfileSelect option:checked')).toContainText('импорт');
  expect(await page.evaluate(()=>CourseUI.data().worksheets.taskForm.result)).toBe('Прежнее поручение');expect(await page.evaluate(()=>CourseUI.data().course.modules['3'].activities.intro.done)).toBe(true);
});
test('all scenes and pages fit mobile; keyboard controls and reduced motion work',async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const phases=['intro','theory-0','theory-1','theory-2','practice','technique','transfer','check','connections'];
  const pages=['/','/settings.html','/experiments.html','/workspace.html','/navigator.html','/sources.html','/adizes.html','/adizes-paei.html','/adizes-capi.html','/adizes-lifecycle.html',...Array.from({length:10},(_,i)=>`/modules/module-${String(i+1).padStart(2,'0')}.html`),...Array.from({length:10},(_,i)=>phases.map(phase=>`/learn.html?module=${i+1}#${phase}`)).flat(),'/#final'];
  for(const url of pages){await page.goto(url);await expect(page.locator('h1:visible')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),url).toBe(true);expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),url).toBe('auto');}
  await page.goto('/learn.html?module=3');await page.locator('input[name=level]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-autonomy-level="1"]')).toHaveClass(/selected/);
  await page.goto('/learn.html?module=4');await page.locator('[data-ethics=facts]').focus();await page.keyboard.press('Enter');await expect(page.locator('#ethicsHeading')).toContainText('внешний срок');
  if(process.env.REFERENCE_SCREENSHOTS){await page.goto('/learn.html?module=8');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/experience-process-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/experience-home.png',fullPage:true});await page.goto('/learn.html?module=5');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/experience-message.png',fullPage:true});}
  expect(errors).toEqual([]);
});
