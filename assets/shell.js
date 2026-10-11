const base=new URL('../',import.meta.url);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const themeKey='manager-almanac:theme';
function applyTheme(theme){
  document.documentElement.dataset.theme=theme==='light'?'light':'dark';
  const light=theme==='light',button=document.getElementById('themeToggle');
  if(button){button.textContent=light?'☾ Тёмная':'☀ Светлая';button.setAttribute('aria-label',light?'Включить тёмную тему':'Включить светлую тему');}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#F4F0EA':'#191716');
}
export function productLink(path,profile){const url=new URL(path,base);if(profile)url.searchParams.set('user',profile);return url.pathname+url.search+url.hash;}
export function mountShell(profile){
  let theme='dark';try{theme=localStorage.getItem(themeKey)||'dark';}catch(_){}applyTheme(theme);
  document.title=document.title.replace(/Практика управления/g,'Альманах менеджера');if(!document.title.includes('Альманах менеджера'))document.title+=' — Альманах менеджера';
  let slot=document.getElementById('courseHeader');
  if(!slot){slot=document.createElement('div');slot.id='courseHeader';document.body.prepend(slot);}
  if(!document.querySelector('[data-shell-style]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('shell.css',import.meta.url);style.dataset.shellStyle='';document.head.append(style);}
  const primary=[['theory.html','Теория'],['games.html','Игры'],['workspace.html#route','Рабочие ситуации'],['workspace.html#modules','Техники'],['workspace.html#diary','Мой дневник']];
  const more=[['experiments.html','Мои действия'],['adizes.html','Модели Адизеса'],['sources.html','Модели и источники'],['settings.html','Настройки и данные']];
  const current=location.pathname.split('/').pop();
  function mode(){return ['games.html','game.html','detective.html','trainer.html'].includes(current)?1:current==='theory.html'||current==='learn.html'||location.pathname.includes('/modules/')?0:current==='workspace.html'?['modules','library','favorites','practice'].includes(location.hash.slice(1))?3:['diary','decisions'].includes(location.hash.slice(1))?4:2:current==='navigator.html'?2:current==='experiments.html'?4:-1;}
  const intents=['Понять','Попробовать','Решить рабочую проблему'];
  slot.innerHTML=`<a class="skip-link" href="#mainContent">К содержимому</a><header class="learning-header product-header"><a class="learning-brand" href="${productLink('index.html',profile)}"><span class="almanac-mark" aria-hidden="true">АМ</span>Альманах менеджера</a><nav aria-label="Основная навигация">${primary.map(([path,label],i)=>`<a href="${productLink(path,profile)}" data-section="${i}" ${i<3?`data-intent="${intents[i]}" aria-label="${label} — ${intents[i]}"`:'class="nav-personal"'}>${label}</a>`).join('')}</nav><button type="button" id="themeToggle" class="theme-toggle">Светлая тема</button><details class="secondary-menu"><summary>Ещё</summary><div>${more.map(([path,label])=>`<a href="${productLink(path,profile)}">${label}</a>`).join('')}<details class="extra-exercises"><summary>Другие упражнения</summary><a href="${productLink('index.html#final',profile)}">История общего сервиса</a><a href="${productLink('workspace.html#cases',profile)}">Кейсы</a><a href="${productLink('workspace.html#practice',profile)}">Рабочие шаблоны</a></details></div></details></header>`;
  function currentSection(){slot.querySelectorAll('[data-section]').forEach(a=>Number(a.dataset.section)===mode()?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));}
  currentSection();window.addEventListener('hashchange',currentSection);applyTheme(theme);
  document.getElementById('themeToggle').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(next);try{localStorage.setItem(themeKey,next);}catch(_){}};
  window.addEventListener('storage',e=>{if(e.key===themeKey)applyTheme(e.newValue||'dark');});
  if(!document.getElementById('productFooter')){
    const footer=document.createElement('footer');footer.id='productFooter';footer.className='product-footer';
    footer.innerHTML=`<div class="footer-intro"><b>Альманах менеджера</b><p>Идея → попытка → наблюдение → следующий шаг.</p></div><div><h2>Какие данные сохраняются</h2><p>Название локального профиля, ответы, прогресс, игровые попытки, избранное, черновики, записи дневника и выбранная тема оформления — только в хранилище этого браузера на этом устройстве. Приложение не отправляет их на сервер и не использует для рекламы или аналитики.</p></div><div><h2>Конфиденциальность и ваши записи</h2><p>Это локальные профили без пароля. Очистка данных браузера удалит записи; для переноса используйте экспорт в настройках. GitHub Pages доставляет файлы сайта и может вести технические журналы запросов, но содержание ваших записей приложение ему не передаёт.</p><a href="${productLink('settings.html',profile)}">Управлять данными и скачать копию →</a></div>`;
    document.body.append(footer);
  }
  const main=document.querySelector('main');if(main){if(!main.id)main.id='mainContent';main.dataset.mainContent='';main.tabIndex=-1;slot.querySelector('.skip-link').href='#'+main.id;slot.querySelector('.skip-link').onclick=e=>{e.preventDefault();main.focus();main.scrollIntoView({block:'start'});};}
  slot.addEventListener('keydown',e=>{if(e.key==='Escape'){slot.querySelectorAll('details[open]').forEach(d=>d.open=false);slot.querySelector('.secondary-menu>summary').focus();}});
}
