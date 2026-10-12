const base=new URL('../',import.meta.url);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const themeKey='manager-almanac:theme';
function applyTheme(theme){
  document.documentElement.dataset.theme=theme==='light'?'light':'dark';
  const light=theme==='light',button=document.getElementById('themeToggle');
  if(button){button.textContent=light?'Включить тёмную тему':'Включить светлую тему';button.setAttribute('aria-label',button.textContent);}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#e0e4eb':'#101b32');
}
export function productLink(path,profile){const url=new URL(path,base);if(profile)url.searchParams.set('user',profile);return url.pathname+url.search+url.hash;}
export function setTheme(theme){applyTheme(theme);try{localStorage.setItem(themeKey,theme);}catch(_){}const select=document.getElementById('appearanceTheme');if(select)select.value=document.documentElement.dataset.theme;}
export function mountShell(profile){
  let theme='light';try{const saved=localStorage.getItem(themeKey);if(['light','dark'].includes(saved))theme=saved;}catch(_){}applyTheme(theme);
  document.title=document.title.replace(/Практика управления/g,'Альманах менеджера');if(!document.title.includes('Альманах менеджера'))document.title+=' — Альманах менеджера';
  let slot=document.getElementById('courseHeader');
  if(!slot){slot=document.createElement('div');slot.id='courseHeader';document.body.prepend(slot);}
  if(!document.querySelector('[data-shell-style]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('shell.css',import.meta.url);style.dataset.shellStyle='';document.head.append(style);}
  const primary=[['theory.html','Теория'],['games.html','Игры'],['workspace.html#route','Ситуация'],['workspace.html#modules','Техники'],['workspace.html#diary','Дневник']];
  const more=[['experiments.html','Мои действия'],['adizes.html','Модели Адизеса'],['sources.html','Модели и источники'],['settings.html','Настройки и данные']];
  const current=location.pathname.split('/').pop();
  function mode(){return ['games.html','game.html','detective.html','trainer.html'].includes(current)?1:current==='theory.html'||current==='learn.html'||location.pathname.includes('/modules/')?0:current==='workspace.html'?['modules','library','favorites','practice'].includes(location.hash.slice(1))?3:['diary','decisions'].includes(location.hash.slice(1))?4:2:current==='navigator.html'?2:current==='experiments.html'?4:-1;}
  slot.innerHTML=`<a class="skip-link" href="#mainContent">К содержимому</a><header class="learning-header product-header">
    <a class="learning-brand" aria-label="Альманах менеджера — главная" href="${productLink('index.html',profile)}">Альманах<span>менеджера</span></a>
    <nav aria-label="Основная навигация">${primary.map(([path,label],i)=>`<a href="${productLink(path,profile)}" data-section="${i}" ${i>2?'class="nav-personal"':''}>${label}</a>`).join('')}</nav>
    <details class="secondary-menu"><summary>Меню</summary><div>
      <div class="menu-personal">${primary.slice(3).map(([path,label],i)=>`<a data-menu-section="${i+3}" href="${productLink(path,profile)}">${label}</a>`).join('')}</div>
      ${more.map(([path,label])=>`<a href="${productLink(path,profile)}">${label}</a>`).join('')}
      <button type="button" id="themeToggle" class="theme-toggle">Оформление</button>
      <details class="extra-exercises"><summary>Другие упражнения</summary><a href="${productLink('index.html#final',profile)}">История общего сервиса</a><a href="${productLink('workspace.html#cases',profile)}">Кейсы</a><a href="${productLink('workspace.html#practice',profile)}">Рабочие шаблоны</a></details>
    </div></details></header>`;
  function currentSection(){slot.querySelectorAll('[data-section],[data-menu-section]').forEach(a=>Number(a.dataset.section??a.dataset.menuSection)===mode()?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));}
  currentSection();window.addEventListener('hashchange',currentSection);applyTheme(theme);
  slot.addEventListener('click',e=>{if(e.target.closest('.secondary-menu a')){slot.querySelector('.secondary-menu').open=false;requestAnimationFrame(()=>document.querySelector('main')?.focus({preventScroll:true}));}});
  document.getElementById('themeToggle').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
  window.addEventListener('storage',e=>{if(e.key===themeKey)applyTheme(e.newValue||'light');});
  if(!document.getElementById('productFooter')){
    const footer=document.createElement('footer');footer.id='productFooter';footer.className='product-footer';
    footer.innerHTML=`<b>Альманах менеджера</b><nav aria-label="Разделы в подвале">${[['theory.html','Теория'],['games.html','Игры'],['workspace.html#route','Ситуации'],['sources.html','Источники'],['settings.html','Настройки']].map(([path,label])=>`<a href="${productLink(path,profile)}">${label}</a>`).join('')}</nav><p>Личные записи остаются в вашем браузере.</p><a href="${productLink('settings.html#data',profile)}">Подробнее о данных</a>`;
    document.body.append(footer);
  }
  const main=document.querySelector('main');if(main){if(!main.id)main.id='mainContent';main.dataset.mainContent='';main.tabIndex=-1;slot.querySelector('.skip-link').href='#'+main.id;slot.querySelector('.skip-link').onclick=e=>{e.preventDefault();main.focus();main.scrollIntoView({block:'start'});};}
  slot.addEventListener('keydown',e=>{if(e.key==='Escape'){slot.querySelectorAll('details[open]').forEach(d=>d.open=false);slot.querySelector('.secondary-menu>summary').focus();}});
}
