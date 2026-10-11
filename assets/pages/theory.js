import {CourseUI as C} from '../course-ui.js';
import {moduleCatalog} from '../../content/catalog.js';
import {theoryGuide} from '../../content/theory-guide.js';
C.mount();
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const topicPath=id=>'modules/module-'+String(id).padStart(2,'0')+'.html';
function renderTopics(){
  const query=$('theorySearch').value.toLocaleLowerCase().trim(),topics=moduleCatalog.filter(m=>{const guide=theoryGuide.find(g=>g.id===m.id);return [m.title,guide.question,...guide.models].join(' ').toLocaleLowerCase().includes(query);});
  $('theoryCount').textContent=`Тем: ${topics.length} из 10 · 50 объяснений · 30 техник · 66 схем`;
  $('theoryTopics').innerHTML=topics.length?topics.map(m=>{const g=theoryGuide.find(g=>g.id===m.id);return `<article class="theory-topic"><span class="topic-number">${String(m.id).padStart(2,'0')}</span><div><h2>${C.esc(m.title)}</h2><p>${C.esc(g.question)}</p><p class="topic-depth-count">5 разборов · 3 техники · ${g.diagrams.length} схем</p><details class="topic-contents"><summary>Что внутри темы</summary><ul>${g.models.map(name=>`<li>${C.esc(name)}</li>`).join('')}</ul></details><div class="topic-entry-links"><a class="topic-read" href="${C.link(topicPath(m.id)+'#theory')}">Читать тему →</a><a href="${C.link('theory.html?view=schemes&topic='+m.id)}">Посмотреть схемы →</a></div></div></article>`;}).join(''):'<p>Похожая тема не найдена. Попробуйте другое слово.</p>';
}
let loaded=null,selected=params.get('diagram')||'',schemeEntries=[];
async function loadSchemes(){
  if(!loaded)loaded=(async()=>{await import('../content.js');await import('../knowledge.js');await import('../visuals.js');const {registerDepth}=await import('../theory-depth.js');registerDepth();
    schemeEntries=theoryGuide.flatMap(g=>g.diagrams.map(id=>({id,topic:g.id,...Visuals.definitions[id]})));
  })();
  return loaded;
}
function drawSchemes(){
  const topic=$('schemeTopic').value,query=$('schemeSearch').value.toLocaleLowerCase().trim();
  const visible=schemeEntries.filter(d=>(!topic||d.topic===Number(topic))&&[d.title,d.note,...d.points.flatMap(p=>[p.label,p.detail])].join(' ').toLocaleLowerCase().includes(query));
  if(!visible.some(d=>d.id===selected))selected=visible[0]?.id||'';
  $('schemeCount').textContent=`Схем: ${visible.length} из ${schemeEntries.length}. Выберите одну — справа её графика и объяснение.`;
  $('schemePicker').innerHTML=visible.map(d=>`<button type="button" data-scheme="${d.id}" aria-pressed="${d.id===selected}"><span>Тема ${d.topic}</span><b>${C.esc(d.title)}</b></button>`).join('');
  const current=visible.find(d=>d.id===selected);
  $('schemeCanvas').innerHTML=current?Visuals.render(current.id)+`<a class="mode-link" href="${C.link(topicPath(current.topic)+'#theory')}">Прочитать объяснение темы ${current.topic} →</a>`:'<p>Схема не найдена. Измените запрос или тему.</p>';
  Visuals.bind($('schemeCanvas'));
  $('schemePicker').querySelectorAll('[data-scheme]').forEach(button=>button.onclick=()=>{selected=button.dataset.scheme;drawSchemes();$('schemePicker').querySelector(`[data-scheme="${selected}"]`)?.focus({preventScroll:true});const url=new URL(location.href);url.searchParams.set('diagram',selected);history.replaceState(null,'',url);});
}
async function setView(view){
  const schemes=view==='schemes';$('topicView').hidden=schemes;$('schemeView').hidden=!schemes;
  document.querySelectorAll('[data-theory-view]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.theoryView==='schemes')===schemes)));
  if(schemes){$('schemeCount').textContent='Открываем схемы…';try{await loadSchemes();drawSchemes();}catch(error){loaded=null;$('schemeCount').textContent='Не удалось открыть схемы. Попробуйте переключить раздел ещё раз.';}}
  const url=new URL(location.href);url.searchParams.set('view',schemes?'schemes':'topics');history.replaceState(null,'',url);
}
$('schemeTopic').insertAdjacentHTML('beforeend',moduleCatalog.map(m=>`<option value="${m.id}">${C.esc(m.title)}</option>`).join(''));
if(theoryGuide.some(g=>String(g.id)===params.get('topic')))$('schemeTopic').value=params.get('topic');
$('theorySearch').oninput=renderTopics;$('schemeSearch').oninput=drawSchemes;$('schemeTopic').onchange=()=>{const url=new URL(location.href);$('schemeTopic').value?url.searchParams.set('topic',$('schemeTopic').value):url.searchParams.delete('topic');history.replaceState(null,'',url);drawSchemes();};
document.querySelectorAll('[data-theory-view]').forEach(button=>button.onclick=()=>setView(button.dataset.theoryView));
document.querySelectorAll('main a[href]').forEach(a=>a.href=C.link(a.getAttribute('href')));renderTopics();setView(params.get('view'));
