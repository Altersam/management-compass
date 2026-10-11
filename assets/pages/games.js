import {CourseUI as C} from '../course-ui.js';
import {gameCatalog} from '../game-catalog.js';
C.mount();
for(const meta of gameCatalog){
  const card=document.querySelector(`[data-game="${meta.id}"]`),saved=meta.id==='project'?C.data().course?.projectGame:meta.id==='detective'?C.data().course?.detectiveGame:C.data().course?.arcadeGames?.[meta.id];
  if(!card)continue;
  const entry=card.querySelector('a');entry.href=C.link(meta.href);
  if(saved?.revision===1&&saved.phase!=='ended'){
    if(meta.id==='project'&&saved.time>0)entry.textContent='Продолжить проект — день '+Math.min(20,Math.floor(saved.time)+1);
    else if(meta.id==='detective'&&saved.inspected?.length)entry.textContent='Продолжить расследование — '+saved.inspected.length+' источника';
    else if(saved.history?.length)entry.textContent='Продолжить попытку';
  }
}
let category='all';
function filter(){
  const query=document.getElementById('gameSearch').value.toLocaleLowerCase().trim();let count=0;
  document.querySelectorAll('.training-game').forEach(card=>{card.hidden=!(category==='all'||card.dataset.category===category)||!card.textContent.toLocaleLowerCase().includes(query);if(!card.hidden)count++;});
  document.getElementById('gameCount').textContent=`Игр: ${count} из ${gameCatalog.length}`;document.getElementById('gameEmpty').hidden=count>0;
  document.querySelectorAll('.games-catalog').forEach(grid=>{const empty=![...grid.querySelectorAll('.training-game')].some(card=>!card.hidden);grid.hidden=empty;document.getElementById(grid.getAttribute('aria-labelledby')).hidden=empty;if(grid.classList.contains('short-games'))document.getElementById('shortGamesLead').hidden=empty;});
}
document.querySelectorAll('[data-game-filter]').forEach(button=>button.onclick=()=>{category=button.dataset.gameFilter;document.querySelectorAll('[data-game-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter();});document.getElementById('gameSearch').oninput=filter;filter();
