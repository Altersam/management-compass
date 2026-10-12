import {CourseUI as C} from '../course-ui.js';
import {createState,resumeState} from '../detective/engine.js';
import {mountDetective} from '../detective/ui.js';
import {newSeed} from '../detective/generator.js';

C.mount();
document.querySelector('.product-header').innerHTML=`<a class="learning-brand" href="${C.link('games.html')}">Management Compass<span>Игровой режим</span></a><nav aria-label="Навигация игры"><a href="${C.link('games.html')}">Все игры</a></nav><details class="secondary-menu"><summary>Помощь и данные</summary><div><a href="${C.link('settings.html')}">Профиль и копия данных</a><a href="${C.link('learn.html?module=8')}">Теория процесса</a></div></details>`;
document.getElementById('productFooter').innerHTML=`<p>Личные попытки остаются в браузере.</p><a href="${C.link('settings.html#data')}">О данных</a>`;
const saved=C.data().course?.detectiveGame,restored=resumeState(saved),root=document.getElementById('detectiveRoot');
if(saved&&!restored){
  root.innerHTML=`<h1>Найди разрыв</h1><p>Этот проект расследования не удалось открыть. Сначала скачайте копию данных в настройках; прежнее сохранение остаётся в профиле.</p><a href="${C.link('settings.html')}">Открыть настройки →</a>`;
}else{
  const state=restored||createState(newSeed(),{generatorVersion:2});
  function save(next){C.save(data=>{if(!data.course)data.course={};data.course.detectiveGame=next;});}
  if(!saved)save(state);
  function restart(seed,{same=false}={}){
    C.save(data=>{if(!data.course)data.course={};const old=data.course.detectiveGame;if(old)data.course.detectiveGameArchive=[...(data.course.detectiveGameArchive||[]),old].slice(-10);data.course.detectiveGame=createState(seed,{generatorVersion:same?state.generatorVersion:2});});location.reload();
  }
  const game=mountDetective({container:root,state,onSave:save,onRestart:restart,link:C.link,notify:C.U.notify,onExperiment:draft=>C.save(data=>data.worksheets.newExperiment=draft)});
  window.addEventListener('pagehide',()=>game.dispose(),{once:true});
}
