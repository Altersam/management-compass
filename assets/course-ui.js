import {Workspace as S,WorkspaceUI as U} from './runtime.js';
import * as M from './course-model.js';
import * as Choices from './choices.js';
import {setTheme} from './shell.js';
const CourseUI=(()=>{
  const esc=U.escape;
  const active=S.profile(new URLSearchParams(location.search).get('user')||S.active()).id;
  const data=()=>S.profile(active).data;
  function link(path){const url=new URL(path,location.href);url.searchParams.set('user',active);return url.pathname+url.search+url.hash;}
  function lesson(id,step='intro'){return link(`learn.html?module=${id}#${step}`);}
  let warned=false;
  function save(mutate){const ok=S.update(active,mutate);if(!ok&&!warned){warned=true;U.notify('Изменения не удалось сохранить. Откройте настройки, чтобы сделать копию.');}return ok;}
  function mount(){
    // The shared runtime mounts the product shell once for every page.
  }
  function settings(container){
    container.innerHTML=`<span class="edition-label">Личные настройки</span><h1>Настройки</h1>
      <section class="settings-section"><h2>Профиль</h2><label>Текущий профиль<select id="learningProfileSelect">${S.profiles().map(p=>`<option value="${esc(p.id)}" ${p.id===active?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><div class="inline-actions"><button id="learningAddProfile" class="button quiet">Создать профиль</button><button id="learningDeleteProfile" class="text-button">Удалить выбранный</button></div></section>
      <section class="settings-section"><h2>Внешний вид</h2><label>Оформление<select id="appearanceTheme"><option value="light">Бумага</option><option value="dark">Графит</option></select></label></section>
      <section class="settings-section"><h2>Резервная копия</h2><p>Скачайте записи перед очисткой браузера или переносом на другое устройство. Открытие копии создаёт отдельный профиль.</p><button id="learningExport" class="button primary">Скачать копию</button><button id="learningImportButton" class="button quiet">Открыть копию</button><input type="file" id="learningImport" accept="application/json,.json" hidden></section>
      <section class="settings-section" id="data"><h2>О данных и хранении</h2><p>Название профиля, ответы, прогресс, игровые попытки, избранное, черновики, дневник и оформление хранятся в этом браузере на этом устройстве. Приложение не отправляет содержание записей на сервер и не использует его для рекламы или аналитики.</p><p>Профили разделяют записи без пароля. Они доступны людям, которые пользуются этим браузером. Очистка его данных удалит записи; резервная копия нужна для восстановления и переноса.</p><p>GitHub Pages доставляет файлы сайта и может вести технические журналы запросов. Содержание ваших личных записей приложение хостингу не передаёт.</p><a href="${link('workspace.html#diary')}">Дневник</a></section>`;
    const appearance=container.querySelector('#appearanceTheme');appearance.value=document.documentElement.dataset.theme;appearance.onchange=()=>setTheme(appearance.value);
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
  window.addEventListener('storage',()=>{if(!S.profiles().some(p=>p.id===active)){const url=new URL(location.href);url.searchParams.set('user',S.active());location.replace(url.href);}});
  return {S,U,M,esc,active,data,link,lesson,save,mount,settings,question,feedback,resultSummary,adizes,scrollToTop};
})();
window.CourseUI=CourseUI;
export {CourseUI};
