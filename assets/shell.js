const base=new URL('../',import.meta.url);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function productLink(path,profile){const url=new URL(path,base);if(profile)url.searchParams.set('user',profile);return url.pathname+url.search+url.hash;}
export function mountShell(profile){
  let slot=document.getElementById('courseHeader');
  if(!slot){slot=document.createElement('div');slot.id='courseHeader';document.body.prepend(slot);}
  if(!document.querySelector('[data-shell-style]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('shell.css',import.meta.url);style.dataset.shellStyle='';document.head.append(style);}
  const primary=[['games.html','Игра'],['index.html#courseMapTitle','Курс'],['workspace.html#route','Рабочая ситуация']];
  const more=[['experiments.html','Мои действия'],['workspace.html#modules','Инструменты'],['adizes.html','Адизес'],['sources.html','Модели и источники'],['settings.html','Настройки']];
<<<<<<< HEAD
  const current=location.pathname.split('/').pop(),mode=['games.html','game.html','detective.html','trainer.html'].includes(current)?0:current==='learn.html'||current==='index.html'?1:current==='workspace.html'||current==='navigator.html'?2:-1;
=======
  const current=location.pathname.split('/').pop(),mode=['games.html','game.html','detective.html'].includes(current)?0:current==='learn.html'||current==='index.html'?1:current==='workspace.html'||current==='navigator.html'?2:-1;
>>>>>>> f975cf8a45f64941b9c5610bdec18930a289499e
  slot.innerHTML=`<a class="skip-link" href="#mainContent">К содержимому</a><header class="learning-header product-header"><a class="learning-brand" href="${productLink('index.html',profile)}">Практика управления</a><nav aria-label="Основная навигация">${primary.map(([path,label],i)=>`<a href="${productLink(path,profile)}" ${mode===i?'aria-current="page"':''}>${label}</a>`).join('')}</nav><details class="secondary-menu"><summary>Ещё</summary><div>${more.map(([path,label])=>`<a href="${productLink(path,profile)}">${label}</a>`).join('')}<details class="extra-exercises"><summary>Другие упражнения</summary><a href="${productLink('index.html#final',profile)}">История общего сервиса</a><a href="${productLink('workspace.html#cases',profile)}">Кейсы</a><a href="${productLink('workspace.html#practice',profile)}">Рабочие шаблоны</a></details></div></details></header>`;
  const main=document.querySelector('main');if(main){if(!main.id)main.id='mainContent';main.dataset.mainContent='';main.tabIndex=-1;slot.querySelector('.skip-link').href='#'+main.id;slot.querySelector('.skip-link').onclick=e=>{e.preventDefault();main.focus();main.scrollIntoView({block:'start'});};}
  slot.addEventListener('keydown',e=>{if(e.key==='Escape'){slot.querySelectorAll('details[open]').forEach(d=>d.open=false);slot.querySelector('.secondary-menu>summary').focus();}});
}
