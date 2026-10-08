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
  await page.locator('#moduleSearch').fill('документы');await expect(page.locator('.module-card:visible')).toHaveCount(1);
  await page.goto('/modules/module-08.html');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('#capacityForm [name=flow]').fill('100');await page.locator('#capacityForm button').click();await expect(page.locator('#capacityResult')).toContainText('очередь будет расти');
});
test('unsaved diary draft survives navigation and starts empty in a different profile',async({page})=>{
  await page.goto('/');await page.locator('#diaryForm [name=title]').fill('Черновик наблюдения');await page.locator('#diaryForm [name=situation]').fill('Нужно восстановить факты передачи');
  await page.reload();await expect(page.locator('#diaryForm [name=title]')).toHaveValue('Черновик наблюдения');
  page.once('dialog',d=>d.accept('Новая тетрадь'));await page.locator('#addProfile').click();await expect(page.locator('#diaryForm [name=title]')).toHaveValue('');
});
