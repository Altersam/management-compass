const {test,expect}=require('@playwright/test');
test('all reference pages render offline assets and links without errors',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const pages=['/','/navigator.html','/sources.html','/adizes.html','/adizes-paei.html','/adizes-capi.html','/adizes-lifecycle.html',...Array.from({length:10},(_,i)=>`/modules/module-${String(i+1).padStart(2,'0')}.html`)];
  for(const url of pages){await page.goto(url);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('body')).not.toContainText('DIRECTUM');}
  expect(errors).toEqual([]);
});
test('profiles isolate working drafts, cases and editable diary, including nested pages',async({page})=>{
  await page.goto('/');page.once('dialog',d=>d.accept('Профиль А'));await page.locator('#addProfile').click();
  const a=await page.locator('#profileSelect').inputValue();
<<<<<<< HEAD
  await page.locator('[data-view-link=practice]').click();
  await page.locator('#taskForm [name=result]').fill('Результат А');
  await page.locator('.practice-tabs a[href="#cases"]').click();
  await page.locator('[data-case=focus] input[value="1"]').check();await page.locator('[data-case=focus] .check-case').click();
  await expect(page.locator('[data-case=focus] .case-feedback')).toContainText('Логика обоснована');
  await page.locator('[data-case=focus] textarea').fill('Уточнить конфликт приоритетов');await page.locator('[data-case=focus] .save-case-note').click();
  await page.locator('[data-view-link=journal]').click();
  await page.locator('#diaryList .edit-entry').first().click();await page.locator('#diaryForm [name=action]').fill('Согласовать срок завтра');await page.locator('#diaryForm [type=submit]').click();
  await expect(page.locator('#diaryList')).toContainText('Согласовать срок завтра');
  await page.goto(`/modules/module-08.html?user=${a}#process`);await page.locator('.worksheet summary').click();await page.locator('form[data-tool=process] [name=field0]').fill('Вход: обращение, выход: принятый ответ');
  await page.reload();await expect(page.locator('form[data-tool=process] [name=field0]')).toHaveValue('Вход: обращение, выход: принятый ответ');
  await page.locator('.worksheet summary').click();await page.locator('form[data-tool=process] [type=submit]').click();await page.goto(`/?user=${a}#diary`);await expect(page.locator('#diaryList')).toContainText('Карта процесса');
  page.once('dialog',d=>d.accept('Профиль Б'));await page.locator('#addProfile').click();const b=await page.locator('#profileSelect').inputValue();
  expect(b).not.toBe(a);await expect(page.locator('#statNotes')).toHaveText('0');await expect(page.locator('#taskForm [name=result]')).toHaveValue('');await expect(page.locator('[data-case=focus] textarea')).toHaveValue('');
  await page.goto(`/modules/module-08.html?user=${b}#process`);await expect(page.locator('form[data-tool=process] [name=field0]')).toHaveValue('');
  await page.goto(`/?user=${a}#practice`);await expect(page.locator('#taskForm [name=result]')).toHaveValue('Результат А');await expect(page.locator('#statNotes')).toHaveText('2');
=======
  await page.locator('#taskForm [name=result]').fill('Результат А');
  await page.locator('[data-case=focus] input[value="1"]').check();await page.locator('[data-case=focus] .check-case').click();
  await expect(page.locator('[data-case=focus] .case-feedback')).toContainText('Логика обоснована');
  await page.locator('[data-case=focus] textarea').fill('Уточнить конфликт приоритетов');await page.locator('[data-case=focus] .save-case-note').click();
  await page.locator('#diaryList .edit-entry').first().click();await page.locator('#diaryForm [name=action]').fill('Согласовать срок завтра');await page.locator('#diaryForm [type=submit]').click();
  await expect(page.locator('#diaryList')).toContainText('Согласовать срок завтра');
  await page.goto(`/modules/module-08.html?user=${a}`);await page.locator('form[data-tool=process] [name=field0]').fill('Вход: обращение, выход: принятый ответ');
  await page.reload();await expect(page.locator('form[data-tool=process] [name=field0]')).toHaveValue('Вход: обращение, выход: принятый ответ');
  await page.locator('form[data-tool=process] [type=submit]').click();await page.goto(`/?user=${a}`);await expect(page.locator('#diaryList')).toContainText('Карта процесса');
  page.once('dialog',d=>d.accept('Профиль Б'));await page.locator('#addProfile').click();const b=await page.locator('#profileSelect').inputValue();
  expect(b).not.toBe(a);await expect(page.locator('#statNotes')).toHaveText('0');await expect(page.locator('#taskForm [name=result]')).toHaveValue('');await expect(page.locator('[data-case=focus] textarea')).toHaveValue('');
  await page.goto(`/modules/module-08.html?user=${b}`);await expect(page.locator('form[data-tool=process] [name=field0]')).toHaveValue('');
  await page.goto(`/?user=${a}`);await expect(page.locator('#taskForm [name=result]')).toHaveValue('Результат А');await expect(page.locator('#statNotes')).toHaveText('2');
>>>>>>> fe405c0604a0b1ab41d3f43b71d6a8b379703d35
});
test('export contains model parameters and import clones profile without overwriting',async({page})=>{
  await page.goto('/adizes-paei.html');await page.locator('input[data-index="0"]').evaluate(input=>{input.value='5';input.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#reflectionForm [name=reflection]').fill('Чаще возвращаюсь к результату');await page.locator('#reflectionForm [name=action]').fill('Уточнить интересы участников');await page.locator('#reflectionForm button').click();
  await page.goto('/');const backup=await page.evaluate(()=>Workspace.export(Workspace.profile(new URLSearchParams(location.search).get('user')).id));
  expect(backup.data.assessments.paei.values[0]).toBe(5);expect(backup.data.journal.length).toBe(1);
  const original=await page.locator('#profileSelect').inputValue();await page.locator('#importProfile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.locator('#statNotes')).toHaveText('1');expect(await page.locator('#profileSelect').inputValue()).not.toBe(original);
  const optionsBefore=await page.locator('#profileSelect option').count();await page.locator('#importProfile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"management-compass-profile"}')});await expect(page.locator('#toast')).toContainText('Импорт отменён');expect(await page.locator('#profileSelect option').count()).toBe(optionsBefore);
});
test('mobile reference has no document overflow and searchable sections',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
<<<<<<< HEAD
  await page.locator('[data-view-link=reference]').click();await page.locator('#moduleSearch').fill('документы');await expect(page.locator('.module-card:visible')).toHaveCount(1);
  await page.goto('/modules/module-08.html#process');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('#capacityDetails summary').click();
  await page.locator('#capacityForm [name=flow]').fill('100');await page.locator('#capacityForm button').click();await expect(page.locator('#capacityResult')).toContainText('очередь будет расти');
});
test('unsaved diary draft survives navigation and starts empty in a different profile',async({page})=>{
  await page.goto('/#diary');await page.locator('#diaryForm [name=title]').fill('Черновик наблюдения');await page.locator('#diaryForm [name=situation]').fill('Нужно восстановить факты передачи');
  await page.reload();await expect(page.locator('#diaryForm [name=title]')).toHaveValue('Черновик наблюдения');
  page.once('dialog',d=>d.accept('Новая тетрадь'));await page.locator('#addProfile').click();await expect(page.locator('#diaryForm [name=title]')).toHaveValue('');
});
test('focused navigation exposes one task at a time and supports direct links and history',async({page})=>{
  await page.goto('/');await expect(page.locator('[data-view-link]')).toHaveCount(4);
  await expect(page.locator('#route')).toBeVisible();await expect(page.locator('#modules')).toBeHidden();await expect(page.locator('#diary')).toBeHidden();
  await page.locator('[data-view-link=reference]').click();await expect(page.locator('#modules')).toBeVisible();await expect(page.locator('#route')).toBeHidden();
  await page.locator('[data-library-mode=techniques]').click();await expect(page.locator('.atlas-card')).toHaveCount(30);
  await page.locator('#moduleSearch').fill('SIPOC');await expect(page.locator('.atlas-card')).toHaveCount(1);
  await page.locator('.atlas-card .module-link').click();await expect(page).toHaveURL(/#sipoc$/);await expect(page.locator('#theory')).toBeHidden();
  await expect(page.locator('[data-current-technique=sipoc]')).toBeVisible();
  await page.locator('.chapter-tabs a[href="#theory"]').click();await expect(page.locator('.theory-article')).toHaveCount(3);await expect(page.locator('.theory-introduction')).toBeVisible();
  await page.goBack();await expect(page.locator('[data-current-technique=sipoc]')).toBeVisible();
});
test('each technique has an interactive diagram and drafts survive switching tools',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(let n=1;n<=10;n++){
    await page.goto(`/modules/module-${String(n).padStart(2,'0')}.html`);
    await expect(page.locator('#theory .visual-diagram')).toHaveCount(2);
    await page.locator('.chapter-tabs a[href="#techniques"]').click();
    for(let i=0;i<3;i++){
      await page.locator('[data-technique]').nth(i).click();
      const visual=page.locator('#techniquePanel .visual-diagram');await expect(visual).toHaveCount(1);
      const explanation=await visual.locator('.visual-explanation').textContent();
      await visual.locator('[data-point="1"]').click();await expect(visual.locator('[data-point="1"]')).toHaveAttribute('aria-pressed','true');
      expect(await visual.locator('.visual-explanation').textContent()).not.toBe(explanation);
    }
  }
  await page.goto('/modules/module-03.html#delegate');await page.locator('.worksheet summary').click();await page.locator('form [name=field0]').fill('Передать типовые ответы с границами');
  await page.locator('[data-technique=feedback]').click();await page.locator('[data-technique=delegate]').click();await expect(page.locator('form [name=field0]')).toHaveValue('Передать типовые ответы с границами');
  expect(errors).toEqual([]);
});
test('visual theory and technique pages remain usable on mobile, with unique SVG IDs',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const url of ['/modules/module-01.html','/modules/module-06.html#raci','/adizes-paei.html','/adizes-capi.html','/adizes-lifecycle.html']){
    await page.goto(url);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),url).toBe(true);
    const ids=await page.locator('svg [id], svg[id]').evaluateAll(elements=>elements.map(e=>e.id));expect(new Set(ids).size).toBe(ids.length);
    await expect(page.locator('.mobile-model:visible').first()).toBeVisible();
    const diagram=page.locator('.visual-diagram:visible').first();await diagram.locator('[data-point="1"]').focus();await page.keyboard.press('Enter');await expect(diagram.locator('[data-point="1"]')).toHaveAttribute('aria-pressed','true');
  }
  if(process.env.REFERENCE_SCREENSHOTS){
    await page.goto('/modules/module-01.html#priority');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/compass-mobile.png',fullPage:true});
    await page.setViewportSize({width:1440,height:1000});await page.goto('/#modules');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/compass-catalog.png',fullPage:true});
    await page.goto('/modules/module-08.html#process');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/compass-technique.png',fullPage:true});
  }
});
=======
  await page.locator('#moduleSearch').fill('документы');await expect(page.locator('.module-card:visible')).toHaveCount(1);
  await page.goto('/modules/module-08.html');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('#capacityForm [name=flow]').fill('100');await page.locator('#capacityForm button').click();await expect(page.locator('#capacityResult')).toContainText('очередь будет расти');
});
test('unsaved diary draft survives navigation and starts empty in a different profile',async({page})=>{
  await page.goto('/');await page.locator('#diaryForm [name=title]').fill('Черновик наблюдения');await page.locator('#diaryForm [name=situation]').fill('Нужно восстановить факты передачи');
  await page.reload();await expect(page.locator('#diaryForm [name=title]')).toHaveValue('Черновик наблюдения');
  page.once('dialog',d=>d.accept('Новая тетрадь'));await page.locator('#addProfile').click();await expect(page.locator('#diaryForm [name=title]')).toHaveValue('');
});
>>>>>>> fe405c0604a0b1ab41d3f43b71d6a8b379703d35
