import {Workspace,WorkspaceUI} from './runtime.js';
(() => {
  const U=WorkspaceUI,esc=U.escape;
  const p=Workspace.profile(new URLSearchParams(location.search).get('user')||Workspace.active());
  const home=`workspace.html?user=${encodeURIComponent(p.id)}`;
  const bar=document.getElementById('pageBar');if(bar)bar.innerHTML='';
  if(location.pathname.endsWith('/sources.html')){document.title='Модели и источники — Практика управления';document.querySelector('h1').textContent='Модели и источники';}
  if(document.body.dataset.adizes&&bar){const current=document.body.dataset.adizes;bar.insertAdjacentHTML('beforeend',`<nav class="reading-nav adizes-navigation" aria-label="Рамки Адизеса">${[['paei','PAEI · функции'],['capi','CAPI · реализация'],['lifecycle','Жизненный цикл']].map(([key,title])=>`<a href="adizes-${key}.html?user=${encodeURIComponent(p.id)}" ${key===current?'aria-current="page" class="active"':''}>${title}</a>`).join('')}</nav>`);}
  if(document.body.dataset.adizes){const mapping={paei:[3,'Команда и требуемые функции'],capi:[6,'Ресурс, полномочия и влияние'],lifecycle:[9,'Изменение рабочей практики']},[topic,title]=mapping[document.body.dataset.adizes];document.querySelector('main').insertAdjacentHTML('beforeend',`<section class="idea-location"><h2>Где встретить эту идею</h2><p><a href="learn.html?module=${topic}&user=${encodeURIComponent(p.id)}">${title} →</a></p><a href="game.html?user=${encodeURIComponent(p.id)}">Попробовать в проекте под давлением →</a></section>`);}
  document.querySelectorAll('a[href]').forEach(a=>{const url=new URL(a.href);if(url.origin===location.origin&&url.pathname.endsWith('.html')){url.searchParams.set('user',p.id);a.href=url;}});
})();
