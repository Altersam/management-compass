import {CourseUI as C} from '../course-ui.js';
import {createState,resumeState} from '../detective/engine.js';
import {mountDetective} from '../detective/ui.js';

C.mount();
const saved=C.data().course?.detectiveGame,restored=resumeState(saved),root=document.getElementById('detectiveRoot');
if(saved&&!restored){
  root.innerHTML=`<h1>Найди разрыв</h1><p>Этот проект расследования не удалось открыть. Сначала скачайте копию данных в настройках; прежнее сохранение остаётся в профиле.</p><a href="${C.link('settings.html')}">Открыть настройки →</a>`;
}else{
  const state=restored||createState();
  function save(next){C.save(data=>{if(!data.course)data.course={};data.course.detectiveGame=next;});}
  function restart(seed){
    C.save(data=>{if(!data.course)data.course={};const old=data.course.detectiveGame;if(old)data.course.detectiveGameArchive=[...(data.course.detectiveGameArchive||[]),old].slice(-10);data.course.detectiveGame=createState(seed);});location.reload();
  }
  const game=mountDetective({container:root,state,onSave:save,onRestart:restart,link:C.link,notify:C.U.notify,onExperiment:draft=>C.save(data=>data.worksheets.newExperiment=draft)});
  window.addEventListener('pagehide',()=>game.dispose(),{once:true});
}
