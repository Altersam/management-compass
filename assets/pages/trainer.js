import {CourseUI as C} from '../course-ui.js';
import {catalog,loaders} from '../arcade/catalog.js';
import {mountTrainer} from '../arcade/ui.js';
import {mountGamePresentation,newGameSeed} from '../game-presentation.js';
import {needsUpgrade,upgradeRecord} from '../arcade/upgrade.js';
const root=document.getElementById('arcadeRoot'),id=new URLSearchParams(location.search).get('game'),meta=catalog.find(m=>m.id===id);
if(!meta){root.innerHTML=`<h1>Выберите тренажёр</h1><p>Этот адрес не соответствует доступной игре.</p><a href="${C.link('games.html')}">Все тренажёры →</a>`;}
else{
  document.title=meta.title+' — Альманах менеджера';document.body.dataset.arcade=id;
  try{
    const game=await loaders[id]();let saved=C.data().course?.arcadeGames?.[id];
    if(saved&&!game.validate(saved))throw new Error('Сохранение этой игры не удалось открыть. Оно остаётся в профиле; сделайте копию в настройках.');
    let legacyView=new URLSearchParams(location.search).get('legacy')==='1';
    try{if(legacyView&&saved)sessionStorage.setItem('management-compass:legacy-view:'+id,saved.seed);else legacyView=sessionStorage.getItem('management-compass:legacy-view:'+id)===saved?.seed;}catch(_){}
    let upgraded=false;
    if(needsUpgrade(id,saved)&&!legacyView){C.save(d=>{upgraded=upgradeRecord(d.course,id,game.create);});saved=C.data().course.arcadeGames[id];}
    const state=saved||(id==='hybrid'?game.create(undefined,{modelVersion:3}):['sprint','meeting','ethics','change','telephone'].includes(id)?game.create(undefined,{modelVersion:2}):game.create(newGameSeed()));
    function save(next){C.save(d=>{if(!d.course)d.course={};if(!d.course.arcadeGames)d.course.arcadeGames={};d.course.arcadeGames[id]=next;});}
    if(!saved)save(state);
    function restart(seed,{modern=false}={}){C.save(d=>{if(!d.course)d.course={};if(!d.course.arcadeGames)d.course.arcadeGames={};if(!d.course.arcadeArchives)d.course.arcadeArchives={};const previous=d.course.arcadeGames[id];if(previous)d.course.arcadeArchives[id]=[...(d.course.arcadeArchives[id]||[]),previous].slice(-10);d.course.arcadeGames[id]=game.create(seed,{modelVersion:id==='hybrid'&&(modern||state.modelVersion===3)?3:['sprint','meeting','ethics','change','telephone'].includes(id)&&(modern||state.modelVersion===2)?2:undefined});});location.reload();}
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
    }else if(id==='meeting'&&state.modelVersion===2){
      const {mountDecisionMeeting}=await import('../meeting-decision/ui.js');
      const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='assets/meeting-decision/meeting-decision.css';await new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=()=>reject(new Error('Не удалось загрузить оформление игры.'));document.head.append(stylesheet);});
      document.body.dataset.decisionMeeting='';document.title='Совещание без решения — Management Compass';
      document.querySelector('.product-header').innerHTML=`<a class="learning-brand" href="${C.link('games.html')}">Management Compass<span>Игровой режим</span></a><nav aria-label="Навигация игры"><a href="${C.link('games.html')}">Все игры</a></nav><details class="secondary-menu"><summary>Помощь и данные</summary><div><a href="${C.link('settings.html')}">Профиль и копия данных</a><a href="${C.link('learn.html?module=6')}">Решение и обязательства</a></div></details>`;
      document.getElementById('productFooter').innerHTML=`<p>Личные попытки остаются в браузере.</p><a href="${C.link('settings.html#data')}">О данных</a>`;
      if(!saved)save(state);ui=mountDecisionMeeting(options);
    }else if(id==='ethics'&&state.modelVersion===2){
      const {mountEthicsDossier}=await import('../ethics-dossier/ui.js');
      const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='assets/ethics-dossier/ethics-dossier.css';await new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=()=>reject(new Error('Не удалось загрузить оформление игры.'));document.head.append(stylesheet);});
      document.body.dataset.ethicsDossier='';document.title='Этическая развилка — Management Compass';
      document.querySelector('.product-header').innerHTML=`<a class="learning-brand" href="${C.link('games.html')}">Management Compass<span>Игровой режим</span></a><nav aria-label="Навигация игры"><a href="${C.link('games.html')}">Все игры</a></nav><details class="secondary-menu"><summary>Помощь и данные</summary><div><a href="${C.link('settings.html')}">Профиль и копия данных</a><a href="${C.link('learn.html?module=4')}">Управленческая этика</a></div></details>`;
      document.getElementById('productFooter').innerHTML=`<p>Личные попытки остаются в браузере.</p><a href="${C.link('settings.html#data')}">О данных</a>`;
      ui=mountEthicsDossier(options);
    }else if(id==='change'&&state.modelVersion===2){
      const {mountChangeNetwork}=await import('../change-network/ui.js');
      const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='assets/change-network/change-network.css';await new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=()=>reject(new Error('Не удалось загрузить оформление игры.'));document.head.append(stylesheet);});
      document.body.dataset.changeNetwork='';document.title='Лаборатория изменений — Management Compass';
      document.querySelector('.product-header').innerHTML=`<a class="learning-brand" href="${C.link('games.html')}">Management Compass<span>Игровой режим</span></a><nav aria-label="Навигация игры"><a href="${C.link('games.html')}">Все игры</a></nav><details class="secondary-menu"><summary>Помощь и данные</summary><div><a href="${C.link('settings.html')}">Профиль и копия данных</a><a href="${C.link('learn.html?module=9')}">Внедрение изменений</a></div></details>`;
      document.getElementById('productFooter').innerHTML=`<p>Личные попытки остаются в браузере.</p><a href="${C.link('settings.html#data')}">О данных</a>`;ui=mountChangeNetwork(options);
    }else if(id==='telephone'&&state.modelVersion===2){
      const {mountMeaningTelephone}=await import('../telephone-tree/ui.js');
      const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='assets/telephone-tree/telephone-tree.css';await new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=()=>reject(new Error('Не удалось загрузить оформление игры.'));document.head.append(stylesheet);});
      document.body.dataset.meaningTelephone='';document.title='Испорченный телефон — Management Compass';
      document.querySelector('.product-header').innerHTML=`<a class="learning-brand" href="${C.link('games.html')}">Management Compass<span>Игровой режим</span></a><nav aria-label="Навигация игры"><a href="${C.link('games.html')}">Все игры</a></nav><details class="secondary-menu"><summary>Помощь и данные</summary><div><a href="${C.link('settings.html')}">Профиль и копия данных</a><a href="${C.link('learn.html?module=5')}">Передача управленческого смысла</a></div></details>`;
      document.getElementById('productFooter').innerHTML=`<p>Личные попытки остаются в браузере.</p><a href="${C.link('settings.html#data')}">О данных</a>`;ui=mountMeaningTelephone(options);
    }else{
      ui=mountTrainer(options);
      if(id==='hybrid'){const button=document.createElement('button');button.type='button';button.className='button quiet';button.textContent='Новое дело: живая траектория';button.onclick=()=>restart(undefined,{modern:true});root.append(button);}
      if(id==='sprint'){const button=document.createElement('button');button.type='button';button.className='button quiet';button.textContent='Новое дело: два спринта под цель';button.onclick=()=>restart(undefined,{modern:true});root.append(button);}
      if(id==='meeting'){const button=document.createElement('button');button.type='button';button.className='button quiet';button.textContent='Новое дело: проверить решение исполнением';button.onclick=()=>restart(undefined,{modern:true});root.append(button);}
      if(id==='ethics'){const button=document.createElement('button');button.type='button';button.className='button quiet';button.textContent='Новое дело: расширенное этическое досье';button.onclick=()=>restart(undefined,{modern:true});root.append(button);}
      if(id==='change'){const button=document.createElement('button');button.type='button';button.className='button quiet';button.textContent='Новое дело: живая сеть изменений';button.onclick=()=>restart(undefined,{modern:true});root.append(button);}
      if(id==='telephone'){const button=document.createElement('button');button.type='button';button.className='button quiet';button.textContent='Новое дело: дерево управленческого смысла';button.onclick=()=>restart(undefined,{modern:true});root.append(button);}
    }
    let domains=[],domainOf;
    if(id==='hybrid'){const data=await import('../approach/contexts.js');domains=data.domains.map(d=>({id:d.id,name:d.name}));domainOf=seed=>game.create(seed,{modelVersion:3}).project.domain;}
    if(id==='sprint'){const data=await import('../sprint-goal/domains.js');domains=data.domains.map(d=>({id:d.id,name:d.name}));domainOf=seed=>game.create(seed,{modelVersion:2}).scenario.domain;}
    if(id==='meeting'){const data=await import('../meeting-decision/cases.js');domains=data.cases.map(d=>({id:d.id,name:d.domain}));domainOf=seed=>game.create(seed,{modelVersion:2}).scenario.id;}
    if(id==='ethics'){const data=await import('../ethics-dossier/templates.js');domains=data.templates.map(d=>({id:d.id,name:d.title}));domainOf=seed=>game.create(seed,{modelVersion:2}).scenarioId;}
    if(id==='change'){const data=await import('../change-network/templates.js');domains=data.templates.map(d=>({id:d.id,name:d.title}));domainOf=seed=>game.create(seed,{modelVersion:2}).scenarioId;}
    if(id==='telephone'){const data=await import('../telephone-tree/templates.js');domains=data.templates.map(d=>({id:d.id,name:d.title}));domainOf=seed=>game.create(seed,{modelVersion:2}).scenarioId;}
    const random=['hybrid','sprint','meeting','ethics','change','telephone','versions','flow'].includes(id);
    const disposePresentation=mountGamePresentation({seed:state.seed,onRestart:restart,domains,domainOf,random,newOptions:{modern:['hybrid','sprint','meeting','ethics','change','telephone'].includes(id)},note:id==='versions'?'Авторская причинная модель с двумя seeded-вариантами. Новый seed может снова выбрать тот же вариант.':['ethics','change','telephone'].includes(id)?'24 дела, по три варианта каждого. Повтор сохраняет исходный расклад; новый seed меняет организацию и факторы.':undefined});
    if(upgraded){const note=document.createElement('p');note.className='game-upgrade-note';note.textContent='Открыта новая версия игры. Прежняя попытка сохранена в архиве профиля; её результат не пересчитывался.';root.before(note);}
    window.addEventListener('pagehide',()=>{ui.dispose();disposePresentation();},{once:true});
  }catch(error){root.innerHTML=`<h1>${C.esc(meta.title)}</h1><p role="alert">${C.esc(error.message)}</p><div class="workspace-links"><a href="${C.link('settings.html')}">Настройки и копия данных →</a><a href="${C.link('games.html')}">Каталог →</a></div>`;}
}
