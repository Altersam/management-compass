import {CourseUI as C} from '../course-ui.js';
import {catalog,loaders} from '../arcade/catalog.js';
import {mountTrainer} from '../arcade/ui.js';
const root=document.getElementById('arcadeRoot'),id=new URLSearchParams(location.search).get('game'),meta=catalog.find(m=>m.id===id);
if(!meta){root.innerHTML=`<h1>Выберите тренажёр</h1><p>Этот адрес не соответствует доступной игре.</p><a href="${C.link('games.html')}">Все тренажёры →</a>`;}
else{
  document.title=meta.title+' — Альманах менеджера';document.body.dataset.arcade=id;
  try{
    const game=await loaders[id](),saved=C.data().course?.arcadeGames?.[id];
    if(saved&&!game.validate(saved))throw new Error('Сохранение этой игры не удалось открыть. Оно остаётся в профиле; сделайте копию в настройках.');
    const state=saved||(id==='hybrid'?game.create(undefined,{modelVersion:3}):id==='sprint'?game.create(undefined,{modelVersion:2}):game.create(id+'-1'));
    function save(next){C.save(d=>{if(!d.course)d.course={};if(!d.course.arcadeGames)d.course.arcadeGames={};d.course.arcadeGames[id]=next;});}
    function restart(seed,{modern=false}={}){C.save(d=>{if(!d.course)d.course={};if(!d.course.arcadeGames)d.course.arcadeGames={};if(!d.course.arcadeArchives)d.course.arcadeArchives={};const previous=d.course.arcadeGames[id];if(previous)d.course.arcadeArchives[id]=[...(d.course.arcadeArchives[id]||[]),previous].slice(-10);d.course.arcadeGames[id]=game.create(seed,{modelVersion:id==='hybrid'&&(modern||state.modelVersion===3)?3:id==='sprint'&&(modern||state.modelVersion===2)?2:undefined});});location.reload();}
    const options={root,meta,game,state,onSave:save,onRestart:restart,link:C.link,notify:C.U.notify,onExperiment:draft=>C.save(d=>d.worksheets.newExperiment=draft)};
    let ui;
    if(id==='hybrid'&&state.modelVersion===3){
      const {mountApproach}=await import('../approach/ui.js');
      const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='assets/approach/approach.css';await new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=()=>reject(new Error('Не удалось загрузить оформление игры.'));document.head.append(stylesheet);});
      document.body.dataset.approach='';document.title='Проектный подход — Management Compass';
      document.querySelector('.product-header').innerHTML=`<a class="learning-brand" href="${C.link('games.html')}">Management Compass<span>Игровой режим</span></a><nav aria-label="Навигация игры"><a href="${C.link('games.html')}">Все игры</a></nav><details class="secondary-menu"><summary>Помощь и данные</summary><div><a href="${C.link('settings.html')}">Профиль и копия данных</a><a href="${C.link('learn.html?module=9')}">Теория проекта</a></div></details>`;
      document.getElementById('productFooter').innerHTML=`<p>Личные попытки остаются в браузере.</p><a href="${C.link('settings.html#data')}">О данных</a>`;
      if(!saved)save(state);ui=mountApproach(options);
    }else if(id==='sprint'&&state.modelVersion===2){
      const {mountGoalSprint}=await import('../sprint-goal/ui.js');
      const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='assets/sprint-goal/sprint-goal.css';await new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=()=>reject(new Error('Не удалось загрузить оформление игры.'));document.head.append(stylesheet);});
      document.body.dataset.goalSprint='';document.title='Спринт: цель вместо скорости — Management Compass';
      document.querySelector('.product-header').innerHTML=`<a class="learning-brand" href="${C.link('games.html')}">Management Compass<span>Игровой режим</span></a><nav aria-label="Навигация игры"><a href="${C.link('games.html')}">Все игры</a></nav><details class="secondary-menu"><summary>Помощь и данные</summary><div><a href="${C.link('settings.html')}">Профиль и копия данных</a><a href="${C.link('learn.html?module=2')}">Фокус и завершённость</a></div></details>`;
      document.getElementById('productFooter').innerHTML=`<p>Личные попытки остаются в браузере.</p><a href="${C.link('settings.html#data')}">О данных</a>`;
      if(!saved)save(state);ui=mountGoalSprint(options);
    }else{
      ui=mountTrainer(options);
      if(id==='hybrid'){const button=document.createElement('button');button.type='button';button.className='button quiet';button.textContent='Новое дело: живая траектория';button.onclick=()=>restart(undefined,{modern:true});root.append(button);}
      if(id==='sprint'){const button=document.createElement('button');button.type='button';button.className='button quiet';button.textContent='Новое дело: два спринта под цель';button.onclick=()=>restart(undefined,{modern:true});root.append(button);}
    }
    window.addEventListener('pagehide',()=>ui.dispose(),{once:true});
  }catch(error){root.innerHTML=`<h1>${C.esc(meta.title)}</h1><p role="alert">${C.esc(error.message)}</p><div class="workspace-links"><a href="${C.link('settings.html')}">Настройки и копия данных →</a><a href="${C.link('games.html')}">Каталог →</a></div>`;}
}
