import {CourseUI as C} from '../course-ui.js';
import {gameCatalog} from '../game-catalog.js';
import {mountGamePresentation} from '../game-presentation.js';
C.mount();
mountGamePresentation();
for(const meta of gameCatalog){
  const card=document.querySelector(`[data-game="${meta.id}"]`),saved=meta.id==='project'?C.data().course?.projectGame:meta.id==='detective'?C.data().course?.detectiveGame:meta.id==='simulation'?C.data().course?.simulation:C.data().course?.arcadeGames?.[meta.id];
  if(!card)continue;
  card.querySelector('a').href=C.link(meta.href);
  if(meta.id==='simulation'&&saved?.revision===2&&saved.decisions?.length&&saved.decisions.length<10)card.querySelector('.game-resume').textContent='Продолжить историю · шаг '+(saved.decisions.length+1);
  if(saved?.revision===1&&saved.phase!=='ended'){
    const text=meta.id==='project'&&saved.time>0?'Продолжить проект — день '+Math.min(20,Math.floor(saved.time)+1):meta.id==='detective'&&saved.inspected?.length?'Продолжить расследование':saved.history?.length?'Продолжить попытку':'';
    card.querySelector('.game-resume').textContent=text;
  }
}
