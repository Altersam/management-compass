import {CourseUI as C} from '../course-ui.js';
C.mount();
document.querySelectorAll('main a[href]').forEach(a=>a.href=C.link(a.getAttribute('href')));
const project=C.data().course?.projectGame,detective=C.data().course?.detectiveGame;
if(project?.revision===1&&project.phase!=='ended'&&project.time>0)document.getElementById('projectGameEntry').textContent='Продолжить проект — день '+Math.min(20,Math.floor(project.time)+1);
if(detective?.revision===1&&detective.phase!=='ended'&&detective.inspected?.length)document.getElementById('detectiveGameEntry').textContent='Продолжить расследование — '+detective.inspected.length+' источника';
