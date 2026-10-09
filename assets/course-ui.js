window.CourseUI=(() => {
  const S=Workspace,U=WorkspaceUI,M=CourseModel,esc=U.escape;
  const active=S.profile(new URLSearchParams(location.search).get('user')||S.active()).id;
  const data=()=>S.profile(active).data;
  function link(path){const url=new URL(path,location.href);url.searchParams.set('user',active);return url.pathname+url.search+url.hash;}
  function lesson(id,step='intro'){return link(`learn.html?module=${id}#${step}`);}
  function save(mutate){const ok=S.update(active,mutate);if(!ok)U.notify('Хранилище недоступно. Экспортируйте данные перед закрытием.');return ok;}
  function mount(){
    const header=document.getElementById('courseHeader');
    header.innerHTML=`<header class="course-header"><a class="brand" href="${link('index.html')}"><span class="brand-mark">У</span><span>Практика управления<small>курс и рабочая среда руководителя</small></span></a><nav class="course-main-nav" aria-label="Разделы продукта"><a href="${link('index.html#course')}" data-course-nav="course">Курс</a><a href="${link('index.html#trajectory')}" data-course-nav="trajectory">Моя траектория</a><a href="${link('index.html#final')}" data-course-nav="final">Итоговый тренажёр</a><a href="${link('workspace.html#route')}" class="navigator-mode">Рабочий навигатор ↗</a></nav><details class="course-profile"><summary>Профиль: <span id="learningProfileName">${esc(S.profile(active).name)}</span></summary><div class="profile-menu"><label>Мой профиль<select id="learningProfileSelect">${S.profiles().map(p=>`<option value="${esc(p.id)}" ${p.id===active?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><div class="inline-actions"><button type="button" id="learningAddProfile" class="text-button">Новый профиль</button><button type="button" id="learningDeleteProfile" class="text-button">Удалить</button></div><button type="button" id="learningExport" class="button quiet">Экспорт всех данных</button><button type="button" id="learningImportButton" class="text-button">Импорт резервной копии</button><input type="file" id="learningImport" accept="application/json,.json" hidden><a href="${link('workspace.html#diary')}">Дневник и рабочие записи →</a><p class="small">${S.persistent?'Автосохранение на этом устройстве.':'Хранилище недоступно: используйте экспорт.'} Профили разделяют записи, но не защищены паролем.</p></div></details></header>`;
    function reload(id){S.select(id);const url=new URL(location.href);url.searchParams.set('user',id);location.assign(url.href);}
    document.getElementById('learningProfileSelect').onchange=e=>reload(e.target.value);
    document.getElementById('learningAddProfile').onclick=()=>{const name=prompt('Имя для личного профиля:');if(name?.trim())reload(S.add(name));};
    document.getElementById('learningDeleteProfile').onclick=()=>{if(S.profiles().length<2){U.notify('Оставьте хотя бы один профиль.');return;}if(confirm(`Удалить профиль «${S.profile(active).name}» и его данные?`))reload(S.remove(active));};
    document.getElementById('learningExport').onclick=()=>U.download('management-compass-profile.json',JSON.stringify(S.export(active),null,2));
    document.getElementById('learningImportButton').onclick=()=>document.getElementById('learningImport').click();
    document.getElementById('learningImport').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('Файл больше 5 МБ.');const payload=JSON.parse(await file.text());if(payload.format==='management-compass-diary'){S.importDiary(active,payload);U.notify('Дневник добавлен в профиль.');}else reload(S.import(payload));}catch(err){U.notify(`Импорт отменён: ${err.message}`);}finally{e.target.value='';}};
    const workspaceLinks=document.createElement('details');workspaceLinks.className='course-work-links';workspaceLinks.innerHTML=`<summary>Моя работа</summary><div><a href="${link('workspace.html#diary')}">Дневник</a><a href="${link('workspace.html#decisions')}">Мои решения</a><a href="${link('workspace.html#favorites')}">Избранное</a><a href="${link('adizes.html')}">Адизес</a><a href="${link('sources.html')}">Модели и литература</a></div>`;header.querySelector('.course-profile').before(workspaceLinks);
  }
  function feedback(q,choice){
    const option=q.options[choice];if(!option)return '';
    return `<div class="learning-feedback"><p><b>Почему вариант кажется разумным</b><br>${esc(option.appeal)}</p><p><b>${choice===q.answer?'Что делает его обоснованным':'Где ограничение этого хода'}</b><br>${esc(option.analysis)}</p></div>`;
  }
  function question(q,choice,prefix='quiz'){
    return `<fieldset class="learning-question" data-question="${q.id}"><legend>${esc(q.title)}</legend><p>${esc(q.scenario)}</p><p class="question-prompt">${esc(q.prompt||'Какой следующий шаг выберете?')}</p>${q.options.map((o,i)=>`<label class="learning-option"><input type="radio" name="${prefix}-${q.id}" value="${i}" ${choice===i?'checked':''}><span>${esc(o.text)}</span></label>`).join('')}</fieldset>`;
  }
  function resultSummary(result,questions,answers,final=false){
    const threshold=final?8:4;
    const wrong=questions.filter(q=>result.wrong.includes(q.id));
    const blocks=[...new Map(wrong.map(q=>[`${q.module}:${q.block}`,q])).values()];
    const blockTitle=q=>COURSE.modules[q.module-1].blockTitles[q.block];
    const model=wrong.length?Visuals.render(COURSE.modules[wrong[0].module-1].visuals[wrong[0].block]):'';
    return `<section class="quiz-report panel" aria-live="polite"><span class="eyebrow">Результат этой попытки</span><h2>${result.score}/${result.total} — ${result.score>=threshold?'порог достигнут':'есть блоки для повторения'}</h2><p>${final?'Итоговая проверка':'Мини-тест'} помогает найти слабое место в решении. ${result.score>=threshold?'Теперь проверьте перенос вывода в собственную работу.':'Вернитесь к указанным блокам и попробуйте применить их к ситуации.'}</p>${wrong.length?`<div class="remediation-list">${blocks.map(q=>`<a href="${lesson(q.module,`theory-${q.block}`)}">${q.module}.${q.block+1} · ${esc(blockTitle(q))}</a>`).join('')}</div><h3>Модель для первой зоны повторения</h3>${model}`:''}<details><summary>Разбор всех выбранных действий</summary>${questions.map(q=>`<article class="answer-review"><h3>${esc(q.title)}</h3><p><b>Ваш выбор:</b> ${esc(q.options[answers[q.id]]?.text||'не указан')}</p>${feedback(q,answers[q.id])}</article>`).join('')}</details></section>`;
  }
  function adizes(note){return `<details class="adizes-comment"><summary>Комментарий Адизеса: ${esc(note.title)}</summary><p>${esc(note.text)}</p>${Visuals.render(note.visual)}<a href="${link(note.page)}">Углубиться в модель →</a></details>`;}
  return {S,U,M,esc,active,data,link,lesson,save,mount,feedback,question,resultSummary,adizes};
})();
