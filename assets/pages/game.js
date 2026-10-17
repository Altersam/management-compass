import {CourseUI as C} from '../course-ui.js';
import {createState,resumeState} from '../game/state.js';
import {mountGame} from '../game/ui.js';
import {mountGamePresentation,newGameSeed} from '../game-presentation.js';

C.mount();
const header=document.querySelector('.product-header');header.innerHTML=`<a class="learning-brand" href="${C.link('games.html')}">Альманах менеджера<span>Игровой режим</span></a><nav aria-label="Навигация игры"><a href="${C.link('games.html')}">Все игры</a></nav><details class="secondary-menu"><summary>Помощь и данные</summary><div><a href="${C.link('settings.html')}">Профиль и копия данных</a><a href="${C.link('learn.html?module=9')}">Теория проекта</a></div></details>`;
document.getElementById('productFooter').innerHTML=`<p>Личные попытки остаются в браузере.</p><a href="${C.link('settings.html#data')}">О данных</a>`;
const saved=C.data().course?.projectGame,restored=resumeState(saved),state=restored||createState(newGameSeed(),{scenarioVersion:3});
function save(state){C.save(d=>{if(!d.course)d.course={};d.course.projectGame=state;});}
function restart(seed,{newCase=false}={}){
  C.save(d=>{
    if(!d.course)d.course={};
    if(d.course.projectGame)d.course.projectGameArchive=[...(d.course.projectGameArchive||[]),d.course.projectGame].slice(-10);
    d.course.projectGame=createState(seed,{scenarioVersion:newCase?3:d.course.projectGame?.scenarioVersion,balanceVersion:d.course.projectGame?.balanceVersion||2});
  });
  location.reload();
}
if(saved&&!restored){document.getElementById('gameRoot').innerHTML=`<h1>Проект под давлением</h1><p role="alert">Это сохранение не удалось открыть. Оно остаётся в профиле; скачайте копию в настройках.</p><a href="${C.link('settings.html')}">Настройки и копия данных →</a>`;mountGamePresentation();}
else{
  if(!saved)save(state);
  const game=mountGame({container:document.getElementById('gameRoot'),state,onSave:save,onRestart:restart,link:C.link,notify:C.U.notify,onExperiment:draft=>C.save(data=>data.worksheets.newExperiment=draft)});
  const disposePresentation=mountGamePresentation({seed:state.seed,onRestart:restart,newOptions:{newCase:true},note:'Та же структура проекта; новый случай меняет командные параметры, объёмы и события. Повтор воспроизводит исходные условия.'});
  window.addEventListener('pagehide',()=>{game.dispose();disposePresentation();},{once:true});
}
