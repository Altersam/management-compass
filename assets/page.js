import {Workspace,WorkspaceUI} from './runtime.js';
(() => {
  const U=WorkspaceUI,esc=U.escape;
  const p=Workspace.profile(new URLSearchParams(location.search).get('user')||Workspace.active());
  const home=`workspace.html?user=${encodeURIComponent(p.id)}`;
  const bar=document.getElementById('pageBar');if(bar)bar.innerHTML='';
  if(document.body.dataset.adizes&&bar){const current=document.body.dataset.adizes;bar.insertAdjacentHTML('beforeend',`<nav class="reading-nav adizes-navigation" aria-label="Рамки Адизеса">${[['paei','PAEI · функции'],['capi','CAPI · реализация'],['lifecycle','Жизненный цикл']].map(([key,title])=>`<a href="adizes-${key}.html?user=${encodeURIComponent(p.id)}" ${key===current?'aria-current="page" class="active"':''}>${title}</a>`).join('')}</nav>`);}
  document.querySelectorAll('a[href]').forEach(a=>{const url=new URL(a.href);if(url.origin===location.origin&&url.pathname.endsWith('.html')){url.searchParams.set('user',p.id);a.href=url;}});
})();
