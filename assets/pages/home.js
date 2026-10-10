import {CourseUI} from '../course-ui.js';
import {moduleCatalog} from '../../content/catalog.js';

// Legacy services are confined to this migration boundary. Page code takes services explicitly.
const C=CourseUI,{M,esc}=C;
const home=document.getElementById('homeContent'),secondary=document.getElementById('secondaryContent');
const legacy=['route','modules','library','practice','cases','diary','faq','decisions','favorites'];
let renderId=0;

function homeState(){
  const course=M.course(C.data()),last=course.last,element=document.getElementById('resumeCourse');
  const sim=course.simulation;
  const game=course.projectGame,gameLink=document.getElementById('startGame');
  if(game?.revision===1&&game.phase!=='ended'&&game.time>0){gameLink.textContent=`Продолжить проект — день ${Math.min(20,Math.floor(game.time)+1)}`;}
  else gameLink.textContent='Начать игру';
  element.hidden=true;
  if(course.resume?.kind==='simulation'&&sim?.decisions?.length<10){
    element.hidden=false;element.innerHTML=`Вы остановились в истории общего сервиса. <a id="continueCourse" href="${C.link('index.html#final')}">Продолжить →</a>`;
  }else if(last&&moduleCatalog.some(m=>m.id===last.module)){
    element.hidden=false;element.innerHTML=`Вы остановились здесь: ${esc(moduleCatalog[last.module-1].title)}. <a id="continueCourse" href="${C.lesson(last.module,last.step)}">Продолжить →</a>`;
  }
  document.querySelectorAll('[data-topic]').forEach(a=>{
    const passed=M.report(C.data(),Number(a.dataset.topic),[]).mastered;
    a.classList.toggle('topic-passed',passed);if(passed)a.title='Тема пройдена';else a.removeAttribute('title');
  });
}
function trajectory(){
  const reports=moduleCatalog.map(m=>M.report(C.data(),m.id,[])),last=M.course(C.data()).last;
  const resumed=moduleCatalog.find(m=>m.id===last?.module);
  secondary.innerHTML=`<h1>К чему вернуться</h1><p>Пройдено ${reports.filter(r=>r.mastered).length} из 10 тем.</p>${resumed?`<p>Вы остановились на теме «${esc(resumed.title)}». <a id="continueCourse" href="${C.lesson(last.module,last.step)}">Продолжить →</a></p>`:''}<ol class="trajectory-timeline">${moduleCatalog.map((m,i)=>`<li><span>${m.id}</span><div><a href="${C.lesson(m.id,last?.module===m.id?last.step:'intro')}">${esc(m.title)}</a><small>${reports[i].mastered?'Тема пройдена':last?.module===m.id?'Вы остановились здесь':''}</small></div></li>`).join('')}</ol><a href="${C.link('experiments.html')}">Что уже попробовали в работе →</a>`;
}
async function render(){
  const token=++renderId,hash=location.hash,alternate=hash==='#trajectory'||hash==='#final';
  home.hidden=alternate;secondary.hidden=!alternate;
  if(hash==='#trajectory')trajectory();
  else if(hash==='#final'){
    secondary.innerHTML='<h1>История общего сервиса</h1><p role="status">Открываем ситуацию…</p>';
    try{
      const {mountSimulation}=await import('./simulation.js');
      if(token===renderId)mountSimulation({ui:C,container:secondary});
    }catch(error){
      if(token!==renderId)return;
      secondary.innerHTML='<h1>История общего сервиса</h1><p role="alert">Не удалось открыть ситуацию. Попробуйте загрузить её ещё раз.</p><button class="button quiet" id="retrySimulation">Повторить</button>';
      secondary.querySelector('#retrySimulation').onclick=render;
      console.error(error);
    }
  }else homeState();
}
if(legacy.includes(location.hash.slice(1)))location.replace(C.link(`workspace.html${location.hash}`));
else{
  C.mount();
  document.querySelectorAll('#homeContent a[href]').forEach(a=>a.href=C.link(a.getAttribute('href')));
  window.addEventListener('hashchange',()=>{render();C.scrollToTop();});window.addEventListener('storage',render);render();
}
