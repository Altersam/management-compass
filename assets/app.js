import {Workspace,WorkspaceUI} from './runtime.js';
import * as Experiments from './experiments.js';
import * as WorkingNavigator from './navigator.js';
import {createDiary} from './diary.js';
(() => {
  'use strict';
  const S=Workspace,U=WorkspaceUI,esc=U.escape,chapters=HANDBOOK.chapters;
  const $=id=>document.getElementById(id);
  let active=S.profile(new URLSearchParams(location.search).get('user')||S.active()).id;
  let quickDiary=null;
  const data=()=>S.profile(active).data;
  const href=p=>`${p}?user=${encodeURIComponent(active)}`;
  const modulePath=n=>`modules/module-${String(n).padStart(2,'0')}.html`;
  const modeLink=document.querySelector('.mode-link');
  function status(){}
  function save(mutate){S.update(active,mutate);status();stats();}
  function profiles(){const url=new URL(location.href);url.searchParams.set('user',active);history.replaceState(null,'',url);$('navigatorLink').href=href('navigator.html');document.querySelectorAll('a[href]').forEach(a=>{if(a.getAttribute('href').startsWith('#'))return;const url=new URL(a.href);if(url.origin===location.origin){url.searchParams.set('user',active);a.href=url;}});}
  function stats(){}
  function resetDiary(){quickDiary?.reset();}
  function switchTo(id){S.select(id);active=id;profiles();renderModules();route();cases();diary();resetDiary();restoreDrafts();stats();}
  let libraryMode='techniques';
  function renderModules(){
    const grid=$('moduleGrid');
    grid.innerHTML=`<div class="library-controls"><div class="library-switch" aria-label="Способ просмотра"><button type="button" data-library-mode="techniques">По техникам</button><button type="button" data-library-mode="chapters">По темам</button></div><label class="search-label">Найти инструмент<input class="module-search" id="moduleSearch" type="search" placeholder="Например: SMART, очередь, делегирование"></label><label class="topic-filter">Задача / тема<select id="techniqueTopic"><option value="">Все темы</option>${chapters.map(c=>`<option value="${c.id}" ${c.id===1?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label><label class="favorite-filter"><input id="favoritesOnly" type="checkbox"> Только избранное</label></div><p class="library-count" id="libraryCount" aria-live="polite"></p><div class="module-grid-inner"></div>`;
    const holder=grid.querySelector('.module-grid-inner');
    function draw(){
      const query=$('moduleSearch').value.toLowerCase().trim();
      const favoritesOnly=$('favoritesOnly').checked;
      const entries=libraryMode==='chapters'?chapters.map(c=>({chapter:c})):chapters.flatMap(c=>c.techniques.map(t=>({chapter:c,technique:t})));
      const visible=entries.filter(({chapter:c,technique:t})=>{
        if(t&&$('techniqueTopic').value&&c.id!==Number($('techniqueTopic').value))return false;
        if(favoritesOnly&&!data().favorites.includes(c.id))return false;
        const search=t?[c.title,t.name,t.when,t.why,Visuals.definitions[t.visual].title].join(' '):[c.title,c.short,c.intro,...c.tags,...c.theory.flat(),...c.terms.flat(),...c.techniques.map(t=>t.name)].join(' ');
        return search.toLowerCase().includes(query);
      });
      holder.innerHTML=visible.length?chapters.map(c=>{const group=visible.filter(entry=>entry.chapter.id===c.id);return group.length?`<section class="technique-group"><h2>${String(c.id).padStart(2,'0')} / ${esc(c.title)}</h2>${group.map(({technique:t})=>`<article class="module-card ${t?'atlas-card':''}"><div class="module-head"><div><h3><a class="module-link" href="${href(modulePath(c.id))}${t?'#'+t.id:''}">${esc(t?t.name:c.title)}</a></h3><p>${esc(t?t.when:c.short)}</p></div></div><div class="module-actions"><button class="text-button favorite" data-id="${c.id}" aria-pressed="${data().favorites.includes(c.id)}">${data().favorites.includes(c.id)?'В избранном':'В избранное'}</button></div></article>`).join('')}</section>`:'';}).join(''):'<p class="no-results">Ничего не найдено. Измените запрос или тему.</p>';
      $('libraryCount').textContent='';
      grid.querySelectorAll('[data-library-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.libraryMode===libraryMode)));
      grid.querySelector('.topic-filter').hidden=libraryMode!=='techniques';
      holder.querySelectorAll('.favorite').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.id);save(d=>d.favorites=d.favorites.includes(id)?d.favorites.filter(n=>n!==id):[...d.favorites,id]);draw();});
    }
    $('moduleSearch').oninput=()=>{if($('moduleSearch').value.trim())$('techniqueTopic').value='';draw();};$('techniqueTopic').onchange=draw;$('favoritesOnly').onchange=draw;
    grid.querySelectorAll('[data-library-mode]').forEach(b=>b.onclick=()=>{libraryMode=b.dataset.libraryMode;draw();});
    draw();
  }
  function route(){WorkingNavigator.mount({select:$('problemSelect'),result:$('routeResult'),store:S,profile:active});}
  function cases(){
    const selector=$('caseSelect'),previous=selector.value;
    selector.innerHTML=HANDBOOK.cases.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('');
    if(HANDBOOK.cases.some(c=>c.id===previous))selector.value=previous;
    CaseUI.render($('caseGrid'),HANDBOOK.cases,active,()=>{stats();diary();status();});
    function show(){document.querySelectorAll('#caseGrid [data-case]').forEach(c=>c.hidden=c.dataset.case!==selector.value);}
    selector.onchange=show;show();
  }
  function diary(){
    const experimentRoot=$('workingExperiments');if(experimentRoot)Experiments.render(experimentRoot,S,active);
    if(!quickDiary&&$('diaryApp'))quickDiary=createDiary({root:$('diaryApp'),store:S,active:()=>active,notify:U.notify,onChange:()=>{stats();status();}});
    quickDiary?.render();
  }
  const toolForms=['taskForm','talkForm'];
   function restoreDrafts(){toolForms.forEach(id=>{const f=$(id);f.reset();const saved=data().worksheets[id]||{};for(const [k,v]of Object.entries(saved)){if(f.elements[k]&&typeof v==='string')f.elements[k].value=v;}$((id==='taskForm'?'task':'talk')+'Output').hidden=true;});}
  toolForms.forEach(id=>$(id).addEventListener('input',()=>{const v=Object.fromEntries(new FormData($(id)));save(d=>d.worksheets[id]=v);}));
  function generated(formId,outputId,lines){const f=$(formId);f.onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(f));const output=$(outputId);output.querySelector('p').textContent=lines.map(([title,k])=>`${title}: ${values[k]?.trim()||'уточнить'}`).join('\n');output.hidden=false;};}
  generated('taskForm','taskOutput',[['Результат','result'],['Ответственный','owner'],['Срок','deadline'],['Качество / приёмка','quality'],['Ресурс / зависимость','dependency']]);generated('talkForm','talkOutput',[['Факт','fact'],['Общий результат','goal'],['Интересы и ограничения','interests'],['Варианты','options']]);
  document.querySelectorAll('.save-generated').forEach(b=>b.onclick=()=>{S.journal(active,{type:'План действия',title:b.dataset.kind,situation:b.closest('.generated').querySelector('p').textContent,action:'Согласовать следующий шаг и способ проверки результата.'});diary();stats();status();U.notify('Черновик добавлен в дневник.');});
  document.querySelectorAll('.copy-generated').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.closest('.generated').querySelector('p').textContent);U.notify('Скопировано.');}catch(_){U.notify('Выделите текст и скопируйте его вручную.');}});
  const faq=document.querySelector('.faq-list');chapters.forEach(c=>c.faq.forEach(([q,a])=>{const el=document.createElement('details');el.innerHTML=`<summary>${esc(q)}</summary><p>${esc(a)} <a href="${href(modulePath(c.id))}">Подробнее →</a></p>`;el.dataset.extraFaq='true';faq.append(el);}));
  window.addEventListener('storage',()=>{if(!S.profiles().some(p=>p.id===active)){switchTo(S.active());return;}stats();diary();});
  profiles();renderModules();route();cases();diary();resetDiary();restoreDrafts();stats();
})();
