const {test,expect}=require('@playwright/test');

async function chooseQuiz(page,module,correctCount=5){
  const questions=await page.evaluate(id=>COURSE.questions[id].map(q=>({id:q.id,answer:q.answer})),module);
  for(let i=0;i<questions.length;i++){const q=questions[i];const choice=i<correctCount?q.answer:(q.answer+1)%3;await page.locator(`[data-question="${q.id}"] input[value="${choice}"]`).check();}
}

test('course is the main entry and former diary bookmarks keep working',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('h1')).toHaveText('Практика управления');await expect(page.locator('.course-map-node')).toHaveCount(10);
  await page.locator('.navigator-entry').click();await expect(page).toHaveURL(/workspace\.html/);await expect(page.locator('#route')).toBeVisible();
  await page.goto('/#diary');await expect(page).toHaveURL(/workspace\.html.*#diary$/);await expect(page.locator('#diaryForm')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a complete module unites learning, application, grade and resume without duplicate diary entries',async({page})=>{
  await page.goto('/learn.html?module=6');
  await page.locator('#tryEntry').click();await page.locator('#entryAttempt input[value="0"]').check();await page.locator('#saveEntry').click();
  await expect(page.locator('#entryFeedback')).toContainText('Почему вариант кажется разумным');
  await page.locator('#startTheory').click();
  for(let i=0;i<3;i++){await expect(page.locator('.lesson-thought .visual-diagram')).toHaveCount(1);await page.locator('#ackTheory').click();}
  await page.locator('#ackTechnique').click();await page.locator('#guidedPractice [name=response]').fill('Определю общий продукт, принимающего и ограничение ресурса. Передам два варианта владельцу приоритета.');
  for(const input of await page.locator('.rubric-check input').all())await input.check();
  await page.locator('#guidedPractice button').click();
  await page.locator('#moduleTransfer [name=situation]').fill('Данные для общего отчёта приходят после нужного срока.');
  await page.locator('#moduleTransfer [name=automatic]').fill('Повторно просил коллег без уточнения ограничения.');
  await page.locator('#moduleTransfer [name=change]').fill('Согласую продукт передачи и варианты ресурсного выбора.');
  await page.locator('#moduleTransfer [name=reviewDate]').fill('2026-12-01');await page.locator('#moduleTransfer button').click();
  await expect(page.locator('#transferSaved')).toContainText('План сохранён');
  await page.locator('#moduleTransfer [name=change]').fill('Согласую продукт, варианты и раннюю проверку передачи.');await page.locator('#moduleTransfer button').click();
  expect(await page.evaluate(()=>CourseUI.data().journal.filter(e=>e.type==='План применения').length)).toBe(1);
  await page.locator('.lesson-actions a[href="#check"]').click();await chooseQuiz(page,6,4);await page.locator('#moduleQuiz button').click();
  await expect(page.locator('#quizResult')).toContainText('4/5');await expect(page.locator('#masteryResult')).toContainText('Модуль освоен');await expect(page.locator('#modulePercent')).toHaveText('100%');
  await page.reload();await expect(page.locator('#modulePercent')).toHaveText('100%');await expect(page.locator('#quizResult')).toContainText('4/5');
  await page.locator('[data-course-nav=trajectory]').click();await expect(page.locator('.trajectory-row').nth(5)).toContainText('100%');
  await expect(page.locator('#continueCourse')).toHaveAttribute('href',/module=6.*#check$/);
  await page.locator('.course-profile summary').click();page.once('dialog',d=>d.accept('Другой учащийся'));await page.locator('#learningAddProfile').click();
  await expect(page.locator('.course-stats')).toContainText('0/10');
});

test('wrong and incomplete quizzes give targeted repetition, not premature mastery',async({page})=>{
  await page.goto('/learn.html?module=2#check');await page.locator('#moduleQuiz button').click();await expect(page.locator('#toast')).toContainText('всех пяти');
  await chooseQuiz(page,2,2);await page.locator('#moduleQuiz button').click();await expect(page.locator('#quizResult')).toContainText('2/5');
  await expect(page.locator('#masteryResult')).not.toContainText('Модуль освоен');await expect(page.locator('.remediation-list a')).toHaveCount(2);
  await page.locator('#quizResult details summary').click();await expect(page.locator('#quizResult')).toContainText('Где ограничение этого хода');
  await page.locator('.remediation-list a').first().click();await expect(page).toHaveURL(/module=2.*#theory-[0-2]$/);await expect(page.locator('.lesson-thought')).toBeVisible();
});

test('final scenario grades ten connected stages, resumes and saves a personal decision',async({page})=>{
  await page.goto('/#final');
  const questions=await page.evaluate(()=>COURSE.finalQuestions.map(q=>({id:q.id,answer:q.answer})));
  for(let i=0;i<questions.length;i++){
    const q=questions[i],choice=i<8?q.answer:(q.answer+1)%3;
    await page.locator(`[data-question="${q.id}"] input[value="${choice}"]`).check();await page.locator('#finalNext').click();
  }
  await expect(page.locator('#finalReport')).toContainText('8/10');await expect(page.locator('#finalReport .remediation-list a')).toHaveCount(2);
  await page.locator('#finalConclusion').fill('Проверю единый канал и качество входных заявок на ограниченной группе за две недели.');await page.locator('#saveFinalDecision').click();await page.locator('#saveFinalDecision').click();
  expect(await page.evaluate(()=>CourseUI.data().journal.filter(e=>e.type==='Решение').length)).toBe(1);
  await page.reload();await expect(page.locator('[data-question=final-10]')).toBeVisible();await expect(page.locator('#finalReport')).toContainText('8/10');
  await page.goto('/workspace.html#decisions');await expect(page.locator('#diaryList')).toContainText('Проверю единый канал');
});

test('old profiles keep worksheets, notes and Adizes observations in both modes and backup',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const old={favorites:[8],journal:[{id:'old-note',date:'2026-10-08',type:'Рефлексия',title:'Моя прежняя запись',situation:'Факты до курса',learning:'Вывод',action:'Следующий шаг',rating:3,createdAt:'2026-10-08T12:00:00Z',updatedAt:''}],caseAnswers:{focus:{choice:1,correct:true}},caseReflections:{focus:'Старая рефлексия'},worksheets:{taskForm:{result:'Старое поручение'}},assessments:{paei:{values:[5,4,3]}}};
    localStorage.setItem('management-compass:v1',JSON.stringify({version:1,active:'personal',profiles:[{id:'personal',name:'Прежний профиль',createdAt:'2026-10-08',data:old}]}));
  });
  await page.reload();await page.goto('/learn.html?module=3#theory-0');await page.locator('#ackTheory').click();
  await page.goto('/workspace.html#practice');await expect(page.locator('#taskForm [name=result]')).toHaveValue('Старое поручение');
  await page.goto('/workspace.html#diary');await expect(page.locator('#diaryList')).toContainText('Моя прежняя запись');
  await page.goto('/#trajectory');
  const backup=await page.evaluate(()=>Workspace.export(CourseUI.active));expect(backup.data.assessments.paei.values[0]).toBe(5);expect(backup.data.course.modules['3'].visited).toContain('theory-0');
  await page.locator('#learningImport').setInputFiles({name:'full-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.locator('#learningProfileName')).toContainText('импорт');
  expect(await page.evaluate(()=>CourseUI.data().worksheets.taskForm.result)).toBe('Старое поручение');
  expect(await page.evaluate(()=>CourseUI.data().course.modules['3'].visited)).toContain('theory-0');
});

test('all learning modules, links and mobile stages render without script errors or overflow',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});
  await page.goto('/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(let n=1;n<=10;n++){
    await page.goto(`/learn.html?module=${n}#theory-1`);await expect(page.locator('.lesson-thought')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`module ${n}`).toBe(true);
    await page.locator('.adizes-comment summary').click();await expect(page.locator('.adizes-comment .visual-diagram')).toBeVisible();
  }
  await page.goto('/learn.html?module=6#connections');await expect(page.locator('.cross-course-links a')).toHaveCount(4);
  await page.goto('/#final');await expect(page.locator('.final-case')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(process.env.REFERENCE_SCREENSHOTS){
    await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/course-final-mobile.png',fullPage:true});
    await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/course-home.png',fullPage:true});
    await page.goto('/learn.html?module=6#theory-2');await page.screenshot({path:process.env.REFERENCE_SCREENSHOTS+'/course-lesson.png',fullPage:true});
  }
  expect(errors).toEqual([]);
});
