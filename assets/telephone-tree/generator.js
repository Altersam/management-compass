import {templates} from './templates.js';
import {slotLabels} from './semantics.js';
import {roleFilters} from './channels.js';
import {eventDefinitions} from './events.js';
import {randomFrom,clamp} from '../sprint-goal/random.js';
import {validateScenario} from './validator.js';
export const taskArchetypes=['pilot','incident','procurement','event','report','education','contract','migration','approval','communication','audit','handoff'];
export function generateScenario(seed){
  const choose=randomFrom(seed),t=templates[Math.floor(choose()*templates.length)],variant=Math.floor(choose()*3);
  for(let attempt=0;attempt<20;attempt++){
    const r=randomFrom(seed+'#'+attempt),count=[20,30,40][variant],percent=15+Math.floor(r()*3)*5,amount=(2+Math.floor(r()*5))*50000,owner=['Владелец процесса','Руководитель программы','Заказчик результата'][variant];
    const format=text=>text.replace(/\{(count|percent|amount)\}/g,(_,key)=>key==='count'?String(count):key==='percent'?String(percent):amount.toLocaleString('ru-RU'));
    const original={goal:format(t.goal),deadline:`До ${['пятницы','понедельника','четверга'][variant]} ${[16,12,18][variant]}:00`,owner:owner+' принимает результат',criteria:format(t.criteria),constraint:format(t.constraint),priority:t.priority,context:t.context};
    const roles=[{id:'source',name:'Источник',bias:{}},...['head','coordinator','executor',variant===1?'recipient':'contractor'].map((id,i)=>({id,name:i===1&&t.domain==='Образование'?'Методический координатор':roleFilters[id].name,bias:Object.fromEntries(Object.keys(slotLabels).map(k=>[k,clamp((roleFilters[id].bias[k]||0)+(r()-.5)*.045,0,.16)]))}))];
    const phantom=r()<.15,events=[],steps=[1,2,3],countEvents=r()>.55?2:1;
    for(let i=0;i<countEvents;i++){const step=steps.splice(Math.floor(r()*steps.length),1)[0],pool=eventDefinitions.filter(e=>e.id!=='chat'&&!events.some(x=>x.id===e.id)),def=phantom&&i===0?eventDefinitions.find(e=>e.id==='chat'):pool[Math.floor(r()*pool.length)];events.push({id:def.id,step,target:Math.floor(r()*def.affected.length)});}
    events.sort((a,b)=>a.step-b.step);
    const s={templateId:t.id,title:t.title,domain:t.domain,archetype:t.archetype,brief:t.brief,variationId:variant,variationText:t.variations[variant],original,blurry:{goal:'Подготовить рабочий результат по общей вводной',deadline:`К ${['пятнице','понедельнику','четвергу'][variant]}`,owner:'Владелец приёмки уточняется',criteria:t.weakCriteria,constraint:'По возможности '+t.constraint.toLowerCase(),priority:'Приоритеты определить по ситуации',context:'Результат нужен для следующего этапа'},replacements:{goal:t.wrongGoal,deadline:'Как можно скорее',owner:'Текущий исполнитель принимает результат сам',criteria:'Формальная готовность достаточна: '+t.weakCriteria.toLowerCase(),constraint:t.wrongConstraint,priority:'Главное — сделать быстрее',context:'Дальнейший объём уже утверждён, отдельная проверка решения не нужна'},critical:[...t.critical],roles,events,resource:4+Math.floor(r()*2),clarifications:3,noise:.005+r()*.035,generationAttempt:attempt};
    s.lethalConstraint=['pilot','incident','analytics','event','move','trip','scientific-event','repair','consultation','website','software'].includes(t.id);
    if(validateScenario(s).valid)return s;
  }throw new Error('Не удалось собрать разрешимое поручение.');
}
