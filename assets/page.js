(() => {
  const U=WorkspaceUI,esc=U.escape;
  const p=Workspace.profile(new URLSearchParams(location.search).get('user')||Workspace.active());
  const home=`index.html?user=${encodeURIComponent(p.id)}`;
  const bar=document.getElementById('pageBar');if(bar)bar.innerHTML=`<div class="reading-bar"><a href="${home}">← Справочник</a><span>${esc(p.name)}</span><a href="${home}#diary">Мой дневник</a></div>`;
  if(document.body.dataset.adizes&&bar){const current=document.body.dataset.adizes;bar.insertAdjacentHTML('beforeend',`<nav class="reading-nav adizes-navigation" aria-label="Рамки Адизеса">${[['paei','PAEI · функции'],['capi','CAPI · реализация'],['lifecycle','Жизненный цикл']].map(([key,title])=>`<a href="adizes-${key}.html?user=${encodeURIComponent(p.id)}" ${key===current?'aria-current="page" class="active"':''}>${title}</a>`).join('')}</nav>`);}
  const routes=document.getElementById('routesGrid');if(routes)routes.innerHTML=HANDBOOK.routes.map(r=>`<article class="panel theory-card"><h3>${esc(r.label)}</h3><p><b>Первый шаг:</b> ${esc(r.first)}</p><p><b>Избегайте:</b> ${esc(r.avoid)}</p><p><b>Проверка результата:</b> ${esc(r.proof)}</p><div class="route-steps">${r.path.map(n=>`<a href="modules/module-${String(n).padStart(2,'0')}.html?user=${encodeURIComponent(p.id)}">${esc(HANDBOOK.chapters[n-1].title)}</a>`).join('')}</div></article>`).join('');
  document.querySelectorAll('a[href]').forEach(a=>{const url=new URL(a.href);if(url.origin===location.origin&&url.pathname.endsWith('.html')){url.searchParams.set('user',p.id);a.href=url;}});
})();
