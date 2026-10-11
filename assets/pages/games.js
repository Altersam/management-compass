import {CourseUI as C} from '../course-ui.js';
import {gameCatalog} from '../game-catalog.js';
C.mount();
for(const meta of gameCatalog){
  const card=document.querySelector(`[data-game="${meta.id}"]`),saved=meta.id==='project'?C.data().course?.projectGame:meta.id==='detective'?C.data().course?.detectiveGame:C.data().course?.arcadeGames?.[meta.id];
  if(!card)continue;
  card.querySelector('a').href=C.link(meta.href);
  if(saved?.revision===1&&saved.phase!=='ended'){
    const text=meta.id==='project'&&saved.time>0?'Продолжить проект — день '+Math.min(20,Math.floor(saved.time)+1):meta.id==='detective'&&saved.inspected?.length?'Продолжить расследование':saved.history?.length?'Продолжить попытку':'';
    card.querySelector('.game-resume').textContent=text;
  }
}
