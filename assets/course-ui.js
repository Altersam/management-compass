window.CourseUI=(()=>{
  const S=Workspace,U=WorkspaceUI,M=CourseModel,esc=U.escape;
  const active=S.profile(new URLSearchParams(location.search).get('user')||S.active()).id;
  const data=()=>S.profile(active).data;
  function link(path){const url=new URL(path,location.href);url.searchParams.set('user',active);return url.pathname+url.search+url.hash;}
  function lesson(id,step='intro'){return link(`learn.html?module=${id}#${step}`);}
  let warned=false;
  function save(mutate){const ok=S.update(active,mutate);if(!ok&&!warned){warned=true;U.notify('Изменения не удалось сохранить. Откройте настройки, чтобы сделать копию.');}return ok;}
  function mount(){
    const header=document.getElementById('courseHeader');if(!header)return;
    header.innerHTML=`<header class="learning-header"><a class="learning-brand" href="${link('index.html')}">Практика управления</a><nav aria-label="Основная навигация"><a href="${link('index.html')}">Учиться</a><a href="${link('workspace.html#route')}">Рабочие ситуации</a></nav><details class="secondary-menu"><summary>Ещё</summary><div><a href="${link('index.html#trajectory')}">Где я остановился</a><a href="${link('index.html#final')}">Управленческая симуляция</a><a href="${link('experiments.html')}">Мои действия и дневник</a><a href="${link('workspace.html#modules')}">Инструменты</a><a href="${link('adizes.html')}">Адизес</a><a href="${link('sources.html')}">Модели и литература</a><a href="${link('settings.html')}">Настройки и о данных</a></div></details></header>`;
  }
  function settings(container){
    container.innerHTML=`<h1>Настройки и данные</h1><section class="settings-section"><h2>Мой профиль</h2><label>Выбрать профиль<select id="learningProfileSelect">${S.profiles().map(p=>`<option value="${esc(p.id)}" ${p.id===active?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><div class="inline-actions"><button id="learningAddProfile" class="button quiet">Создать профиль</button><button id="learningDeleteProfile" class="text-button">Удалить выбранный</button></div></section><section class="settings-section"><h2>Копия и перенос</h2><p>Ваши ответы, действия и заметки находятся в браузере на этом устройстве. Перед очисткой браузера или переходом на другой адрес скачайте копию. Импорт создаёт отдельный профиль.</p><button id="learningExport" class="button primary">Скачать все данные</button><button id="learningImportButton" class="button quiet">Открыть копию</button><input type="file" id="learningImport" accept="application/json,.json" hidden><p>Профили разделяют записи, но не являются защищёнными аккаунтами. Сервер не получает ваши записи.</p></section><section class="settings-section"><h2>Как вернуться к работе</h2><p>Курс запоминает последнее место. В «Моих действиях» можно проверить эксперимент и записать, что помогло. Подробный дневник и прежние записи остаются в рабочем режиме.</p><p>Первая попытка и ошибки нужны для разбора ситуации. Это не оценка сотрудника и не психологическая диагностика.</p><a href="${link('workspace.html#diary')}">Открыть прежние записи →</a></section>`;
    function reload(id){S.select(id);const url=new URL(location.href);url.searchParams.set('user',id);location.assign(url.href);}
    container.querySelector('#learningProfileSelect').onchange=e=>reload(e.target.value);
    container.querySelector('#learningAddProfile').onclick=()=>{const name=prompt('Как назвать профиль?');if(name?.trim())reload(S.add(name));};
    container.querySelector('#learningDeleteProfile').onclick=()=>{if(S.profiles().length<2){U.notify('Оставьте хотя бы один профиль.');return;}if(confirm(`Удалить «${S.profile(active).name}» вместе с его записями?`))reload(S.remove(active));};
    container.querySelector('#learningExport').onclick=()=>U.download('management-compass-profile.json',JSON.stringify(S.export(active),null,2));
    container.querySelector('#learningImportButton').onclick=()=>container.querySelector('#learningImport').click();
    container.querySelector('#learningImport').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('Копия больше 5 МБ.');const payload=JSON.parse(await file.text());if(payload.format==='management-compass-diary'){S.importDiary(active,payload);U.notify('Записи открыты в этом профиле.');}else reload(S.import(payload));}catch(error){U.notify(`Не удалось открыть копию: ${error.message}`);}finally{e.target.value='';}};
  }
  function question(q,choice,prefix='quiz'){
    const order=Choices.order(S,active,`v2-${q.id}`,q.options.length);
    return `<fieldset class="learning-question" data-question="${q.id}"><legend>${esc(q.title||q.prompt)}</legend>${q.scenario?`<p>${esc(q.scenario)}</p>`:''}${q.title&&q.prompt?`<p>${esc(q.prompt)}</p>`:''}${order.map(i=>`<label class="learning-option"><input type="radio" name="${prefix}-${q.id}" value="${i}" ${choice===i?'checked':''}><span>${esc(q.options[i].text)}</span></label>`).join('')}</fieldset>`;
  }
  function feedback(q,choice){const option=q.options[choice];return option?`<div class="decision-consequence"><p><b>Почему этот вариант кажется разумным</b><br>${esc(option.appeal)}</p><p><b>Что произойдёт дальше</b><br>${esc(option.analysis)}</p></div>`:'';}
  function resultSummary(result,questions,answers){
    const wrong=questions.filter(q=>result.wrong.includes(q.id)),blocks=[...new Map(wrong.map(q=>[`${q.module}:${q.block}`,q])).values()];
    return `<section class="decision-review"><h2>Что стоит взять в работу</h2><p class="quiet-note">${result.score} из ${result.total} решений опираются на существенное условие ситуации.</p>${blocks.length?`<p>К этим ситуациям полезно вернуться:</p><div class="remediation-list">${blocks.map(q=>`<a href="${lesson(q.module,`theory-${q.block}`)}">${esc(PEDAGOGY.topics[q.module].blocks[q.block].title)}</a>`).join('')}</div>`:'<p>Сравните теперь эту логику со своей рабочей ситуацией: что из условий там отличается?</p>'}<details><summary>Последствия каждого решения</summary>${questions.map(q=>`<article><h3>${esc(q.title)}</h3><p>${esc(q.options[answers[q.id]]?.text||'')}</p>${feedback(q,answers[q.id])}</article>`).join('')}</details></section>`;
  }
  function adizes(note){return `<details class="another-view"><summary>Другой взгляд · Адизес</summary><h3>${esc(note.title)}</h3><p>${esc(note.text)}</p><a href="${link(note.page)}">Подробнее об этой рамке →</a></details>`;}
  function scrollToTop(){window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  return {S,U,M,esc,active,data,link,lesson,save,mount,settings,question,feedback,resultSummary,adizes,scrollToTop};
})();
