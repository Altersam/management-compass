import {initial,clone,assertPlaying,record,button,select,summary,esc,basicValid} from './common.js';
export const contexts=[{id:'report',name:'Обязательная отчётная система',uncertainty:0.15,gate:true,deadline:25,description:'Требования почти фиксированы. Ошибка дорогая, внешний срок и приёмка обязательны.'},{id:'discovery',name:'Новый внутренний сервис',uncertainty:0.9,gate:false,deadline:25,description:'Потребность известна, способ решения неизвестен. Нужна ранняя обратная связь пользователей.'},{id:'integration',name:'Интеграция двух систем',uncertainty:0.55,gate:true,deadline:28,description:'Технический контур предсказуем, интерфейс нужно исследовать. Есть внешнее окно и проверка.'}];
export const blocks=[{id:'research',name:'Исследование',days:2},{id:'prototype',name:'Прототип',days:2},{id:'plan',name:'Планирование',days:2},{id:'build',name:'Разработка',days:6},{id:'review',name:'Review',days:1},{id:'gate',name:'Stage gate',days:2},{id:'test',name:'Тестирование',days:2},{id:'pilot',name:'Пилот пользователей',days:2},{id:'release',name:'Выпуск',days:1}];
export function create(seed='hybrid-1'){return {...initial(seed),context:'report',route:['plan','build','test','gate','release'],runs:[]};}
export function evaluate(route,contextId,trial=0){
  const context=contexts.find(c=>c.id===contextId);if(!context)throw new Error('Контекст не найден.');
  const positions=id=>route.flatMap((value,i)=>value===id?[i]:[]),builds=positions('build'),release=route.indexOf('release'),first=builds[0];
  let uncertainty=context.uncertainty,rework=0,quality=35,feedback=0,elapsed=0;const trace=[];
  for(let i=0;i<route.length;i++){const b=blocks.find(b=>b.id===route[i]);elapsed+=b.days;let effect='';
    if(b.id==='research'){uncertainty*=0.65;effect='Уточнена потребность до следующей работы.';}
    if(b.id==='prototype'){uncertainty*=0.7;effect='Дешёвый образец уточнил способ решения.';}
    if(b.id==='build'){quality+=15;effect='Создана работающая часть; непроверенные предположения остаются.';}
    if(['review','pilot'].includes(b.id)){feedback++;const done=route.slice(0,i).filter(x=>x==='build').length;const loss=Math.ceil(uncertainty*done*(trial?6:4));rework+=loss;elapsed+=loss;uncertainty*=0.35;quality+=b.id==='pilot'?12:5;effect=`Обратная связь обнаружила ${loss} дня изменения уже созданного.`;}
    if(b.id==='test'){quality+=18;effect='Проверены ошибки реализации, не сама потребность.';}
    trace.push({id:b.id,name:b.name,end:elapsed,effect});
  }
  const approved=!context.gate||positions('gate').some(i=>i>first&&i<release),tested=positions('test').some(i=>i>first&&i<release),late=feedback===0?Math.ceil(uncertainty*builds.length*(trial?9:6)):Math.ceil(uncertainty*builds.length*2);
  rework+=late;elapsed+=late;quality=Math.min(95,quality-(tested?0:22));
  const viable=builds.length>0&&release>first&&approved&&tested;
  return {days:elapsed,rework,quality,feedback,approved,tested,viable,deadline:context.deadline,uncertainty,trace,context:context.name,insights:[approved?'Обязательная приёмка учтена.':'Быстрый маршрут не прошёл обязательную приёмку.',feedback?'Ранняя обратная связь уменьшила остаточную неопределённость.':'Предположения проверены только к выпуску; позднее изменение дороже.',elapsed>context.deadline?'Дополнительные блоки и переделка не помещаются в срок.':'Маршрут помещается в условный срок; сравните цену обратной связи.']};
}
export function act(state,a){assertPlaying(state);const s=clone(state);
  if(a.type==='context'){if(!contexts.some(c=>c.id===a.value)||s.runs.length)throw new Error('Новый контекст — в новой попытке.');s.context=a.value;}
  else if(a.type==='add'){if(!blocks.some(b=>b.id===a.value)||s.route.length>=14)throw new Error('Предел маршрута — 14 блоков.');s.route.push(a.value);}
  else if(a.type==='remove'){if(!Number.isInteger(a.index)||a.index<0||a.index>=s.route.length)throw new Error('Блок не найден.');s.route.splice(a.index,1);}
  else if(a.type==='move'){const to=a.index+a.delta;if(![-1,1].includes(a.delta)||to<0||to>=s.route.length)throw new Error('Нельзя переместить блок.');[s.route[a.index],s.route[to]]=[s.route[to],s.route[a.index]];}
  else if(a.type==='run'){if(!s.route.includes('build')||!s.route.includes('release'))throw new Error('Нужны разработка и выпуск.');const result=evaluate(s.route,s.context,s.runs.length);s.runs.push({route:[...s.route],result});s.turn++;if(s.runs.length===2)s.phase='ended';}
  else throw new Error('Действие не найдено.');record(s,a,a.type==='run'?'Маршрут испытан':'Маршрут изменён');return s;
}
export function validate(s){return basicValid(s)&&contexts.some(c=>c.id===s.context)&&Array.isArray(s.route)&&s.route.length<=14&&s.route.every(id=>blocks.some(b=>b.id===id))&&Array.isArray(s.runs)&&s.runs.length<=2;}
export function render(s){const c=contexts.find(c=>c.id===s.context);return `<div class="hybrid-context">${select('context','Природа проекта',contexts.map(c=>[c.id,c.name]),s.context)}<p>${c.description}</p></div><section><h2>Соберите способ работы</h2><div class="block-palette">${blocks.map(b=>button('add',b.name+' · '+b.days+' д.',`data-value="${b.id}"`)).join('')}</div><ol class="route-builder">${s.route.map((id,i)=>`<li><b>${blocks.find(b=>b.id===id).name}</b><div>${button('move','←',`data-index="${i}" data-delta="-1" aria-label="Переместить блок ${i+1} влево"`,i===0)}${button('move','→',`data-index="${i}" data-delta="1" aria-label="Переместить блок ${i+1} вправо"`,i===s.route.length-1)}${button('remove','Убрать',`data-index="${i}"`)}</div></li>`).join('')}</ol>${button('run',s.runs.length?'Испытать исправленный маршрут':'Испытать маршрут', 'class="button primary"')}</section>${s.runs.map((r,i)=>`<section class="trial-result"><h2>Испытание ${i+1}: ${i?'новое внешнее условие':'обычная обратная связь'}</h2><p>${r.result.days} дней · переделка ${r.result.rework} · качество ${r.result.quality}/100 · ${r.result.viable?'выпуск исполним':'выпуск пока не исполним'}</p><ol class="route-trace">${r.result.trace.map(t=>`<li><b>${t.name} · день ${t.end}</b><p>${esc(t.effect)}</p></li>`).join('')}</ol></section>`).join('')}`;}
export function report(s){const r=evaluate(s.runs.at(-1).route,s.context,1);return summary([['Срок',r.days+' / '+r.deadline+' дней'],['Переделка',r.rework+' дней'],['Качество',r.quality+'/100'],['Приёмка',r.approved?'учтена':'не пройдена']],r.insights);}
