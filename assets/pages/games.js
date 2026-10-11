import {CourseUI as C} from '../course-ui.js';
import {catalog} from '../arcade/catalog.js';
C.mount();
const grid=document.querySelector('.games-catalog');
const categories={hybrid:'project',meeting:'people',ethics:'people',change:'people',telephone:'people',versions:'system',metrics:'system',flow:'system',sprint:'project',influence:'people'},symbols={project:'⚑',people:'◎',system:'⌘'};
for(const meta of catalog){const saved=C.data().course?.arcadeGames?.[meta.id],resume=saved?.revision===1&&saved.phase==='playing'&&saved.history?.length;grid.insertAdjacentHTML('beforeend',`<article class="training-game arcade-training" data-game="${meta.id}" data-category="${categories[meta.id]}"><span class="game-sigil" aria-hidden="true">${symbols[categories[meta.id]]}</span><span class="game-catalog-kind">${C.esc(meta.subtitle)} · ${meta.time}</span><h2>${C.esc(meta.title)}</h2><p>${C.esc(meta.mechanic)}</p><a class="button primary" href="trainer.html?game=${meta.id}">${resume?'Продолжить попытку':'Играть'}</a></article>`);}
let category='all';
function filter(){const query=document.getElementById('gameSearch').value.toLocaleLowerCase().trim();let count=0;grid.querySelectorAll('.training-game').forEach(card=>{card.hidden=!(category==='all'||card.dataset.category===category)||!card.textContent.toLocaleLowerCase().includes(query);if(!card.hidden)count++;});document.getElementById('gameCount').textContent=`Игр: ${count} из 12`;document.getElementById('gameEmpty').hidden=count>0;}
document.querySelectorAll('[data-game-filter]').forEach(button=>button.onclick=()=>{category=button.dataset.gameFilter;document.querySelectorAll('[data-game-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter();});document.getElementById('gameSearch').oninput=filter;filter();
document.querySelectorAll('main a[href]').forEach(a=>a.href=C.link(a.getAttribute('href')));
const project=C.data().course?.projectGame,detective=C.data().course?.detectiveGame;
if(project?.revision===1&&project.phase!=='ended'&&project.time>0)document.getElementById('projectGameEntry').textContent='Продолжить проект — день '+Math.min(20,Math.floor(project.time)+1);
if(detective?.revision===1&&detective.phase!=='ended'&&detective.inspected?.length)document.getElementById('detectiveGameEntry').textContent='Продолжить расследование — '+detective.inspected.length+' источника';
