import {CourseUI as C} from '../course-ui.js';
import {catalog,loaders} from '../arcade/catalog.js';
import {mountTrainer} from '../arcade/ui.js';
const root=document.getElementById('arcadeRoot'),id=new URLSearchParams(location.search).get('game'),meta=catalog.find(m=>m.id===id);
if(!meta){root.innerHTML=`<h1>Выберите тренажёр</h1><p>Этот адрес не соответствует доступной игре.</p><a href="${C.link('games.html')}">Все тренажёры →</a>`;}
else{
  document.title=meta.title+' — Практика управления';document.body.dataset.arcade=id;
  try{
    const game=await loaders[id](),saved=C.data().course?.arcadeGames?.[id];
    if(saved&&!game.validate(saved))throw new Error('Сохранение этой игры не удалось открыть. Оно остаётся в профиле; сделайте копию в настройках.');
    const state=saved||game.create(id+'-1');
    function save(next){C.save(d=>{if(!d.course)d.course={};if(!d.course.arcadeGames)d.course.arcadeGames={};d.course.arcadeGames[id]=next;});}
    function restart(seed){C.save(d=>{if(!d.course)d.course={};if(!d.course.arcadeGames)d.course.arcadeGames={};if(!d.course.arcadeArchives)d.course.arcadeArchives={};const previous=d.course.arcadeGames[id];if(previous)d.course.arcadeArchives[id]=[...(d.course.arcadeArchives[id]||[]),previous].slice(-10);d.course.arcadeGames[id]=game.create(seed);});location.reload();}
    const ui=mountTrainer({root,meta,game,state,onSave:save,onRestart:restart,link:C.link,notify:C.U.notify,onExperiment:draft=>C.save(d=>d.worksheets.newExperiment=draft)});
    window.addEventListener('pagehide',()=>ui.dispose(),{once:true});
  }catch(error){root.innerHTML=`<h1>${C.esc(meta.title)}</h1><p role="alert">${C.esc(error.message)}</p><div class="workspace-links"><a href="${C.link('settings.html')}">Настройки и копия данных →</a><a href="${C.link('games.html')}">Каталог →</a></div>`;}
}
