import {CourseUI as C} from '../course-ui.js';
import {createState,resumeState} from '../game/state.js';
import {mountGame} from '../game/ui.js';

C.mount();
const saved=C.data().course?.projectGame,state=resumeState(saved)||createState();
function save(state){C.save(d=>{if(!d.course)d.course={};d.course.projectGame=state;});}
function restart(seed){
  C.save(d=>{
    if(!d.course)d.course={};
    if(d.course.projectGame)d.course.projectGameArchive=[...(d.course.projectGameArchive||[]),d.course.projectGame].slice(-10);
    d.course.projectGame=createState(seed);
  });
  location.reload();
}
const game=mountGame({container:document.getElementById('gameRoot'),state,onSave:save,onRestart:restart,link:C.link,notify:C.U.notify});
window.addEventListener('pagehide',()=>game.dispose(),{once:true});
