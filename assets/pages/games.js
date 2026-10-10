import {CourseUI as C} from '../course-ui.js';
<<<<<<< HEAD
import {catalog} from '../arcade/catalog.js';
C.mount();
const grid=document.querySelector('.games-catalog');
for(const meta of catalog){const saved=C.data().course?.arcadeGames?.[meta.id],resume=saved?.revision===1&&saved.phase==='playing'&&saved.history?.length;grid.insertAdjacentHTML('beforeend',`<article class="training-game arcade-training" data-game="${meta.id}"><span class="game-catalog-kind">${C.esc(meta.subtitle)} · ${meta.time}</span><h2>${C.esc(meta.title)}</h2><p>${C.esc(meta.mechanic)}</p><p class="game-catalog-topics">Темы: ${meta.topics.join(' · ')}</p><a class="button primary" href="trainer.html?game=${meta.id}">${resume?'Продолжить попытку':'Играть'}</a></article>`);}
=======
C.mount();
>>>>>>> f975cf8a45f64941b9c5610bdec18930a289499e
document.querySelectorAll('main a[href]').forEach(a=>a.href=C.link(a.getAttribute('href')));
const project=C.data().course?.projectGame,detective=C.data().course?.detectiveGame;
if(project?.revision===1&&project.phase!=='ended'&&project.time>0)document.getElementById('projectGameEntry').textContent='Продолжить проект — день '+Math.min(20,Math.floor(project.time)+1);
if(detective?.revision===1&&detective.phase!=='ended'&&detective.inspected?.length)document.getElementById('detectiveGameEntry').textContent='Продолжить расследование — '+detective.inspected.length+' источника';
