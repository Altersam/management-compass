import {CourseUI as C} from '../course-ui.js';
import {moduleCatalog} from '../../content/catalog.js';
C.mount();
const questions=['Как защитить время для важного?','Как согласовать результат и момент контроля?','Как передать работу без ручного управления?','Как обосновать справедливый выбор?','Как сохранить смысл договорённости?','Как договориться между подразделениями?','Как довести решение до пригодного результата?','Где теряется время и что изменить?','Как помочь людям освоить новый порядок?','Что число действительно доказывает?'];
function render(){
  const query=document.getElementById('theorySearch').value.toLocaleLowerCase().trim(),topics=moduleCatalog.filter(m=>(m.title+' '+questions[m.id-1]).toLocaleLowerCase().includes(query));
  document.getElementById('theoryCount').textContent=`Тем: ${topics.length} из 10`;
  document.getElementById('theoryTopics').innerHTML=topics.length?topics.map(m=>`<a class="theory-topic" href="${C.link('modules/module-'+String(m.id).padStart(2,'0')+'.html#theory')}"><span class="topic-number">${String(m.id).padStart(2,'0')}</span><div><h2>${C.esc(m.title)}</h2><p>${questions[m.id-1]}</p></div><span aria-hidden="true">↗</span></a>`).join(''):'<p>Похожая тема не найдена. Попробуйте другое слово.</p>';
}
document.getElementById('theorySearch').oninput=render;
document.querySelectorAll('main a[href]').forEach(a=>a.href=C.link(a.getAttribute('href')));render();
