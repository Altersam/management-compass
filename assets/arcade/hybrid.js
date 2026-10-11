import {initial,clone,assertPlaying,record,button,select,summary,esc,basicValid,seedNumber} from './common.js';
import {mountProjectRoute,comparisonReview} from './hybrid-route.js';
export const ui={history:false,practiceCycle:false,quietStatus:true,compactTransfer:true};
export const mountUI=mountProjectRoute;
export const renderReport=comparisonReview;
export const contexts=[{id:'report',name:'Обязательная отчётная система',uncertainty:0.15,gate:true,deadline:25,description:'Требования почти фиксированы. Ошибка дорогая, внешний срок и приёмка обязательны.'},{id:'discovery',name:'Новый внутренний сервис',uncertainty:0.9,gate:false,deadline:25,description:'Потребность известна, способ решения неизвестен. Нужна ранняя обратная связь пользователей.'},{id:'integration',name:'Интеграция двух систем',uncertainty:0.55,gate:true,deadline:28,description:'Технический контур предсказуем, интерфейс нужно исследовать. Есть внешнее окно и проверка.'}];
export const blocks=[{id:'research',name:'Исследование',days:2},{id:'prototype',name:'Прототип',days:2},{id:'plan',name:'Планирование',days:2},{id:'build',name:'Разработка',days:6},{id:'review',name:'Review',days:1},{id:'gate',name:'Stage gate',days:2},{id:'test',name:'Тестирование',days:2},{id:'pilot',name:'Пилот пользователей',days:2},{id:'release',name:'Выпуск',days:1}];
export const presets={waterfall:['plan','build','test','gate','release'],agile:['plan','prototype','review','build','review','test','pilot','release'],hybrid:['plan','prototype','review','build','test','gate','pilot','release']};
const costs={report:{daily:90000,budget:1800000,change:'Внешний получатель уточняет обязательный формат',window:0},discovery:{daily:35000,budget:850000,change:'Пользователи иначе выполняют основной сценарий',window:0},integration:{daily:65000,budget:1600000,change:'Соседняя система меняет ограничение интерфейса',window:12}};
export const contextTerms=costs;
export function create(seed='hybrid-1'){return {...initial(seed),modelVersion:2,context:'report',route:[...presets.waterfall],runs:[]};}
function evaluateLegacy(route,contextId,trial=0){
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
  const viable=builds.length>0&&release>first&&release===route.length-1&&approved&&tested;
  return {days:elapsed,rework,quality,feedback,approved,tested,viable,deadline:context.deadline,uncertainty,trace,context:context.name,insights:[viable?'Выпуск завершает маршрут после необходимых проверок.':'Для исполнимого выпуска нужны разработка, тест после неё, обязательная приёмка и выпуск последним блоком.',approved?'Обязательная приёмка учтена.':'Быстрый маршрут не прошёл обязательную приёмку.',feedback?'Обратная связь уменьшила остаточную неопределённость; сравните цену её момента.':'Предположения проверены только к выпуску; позднее изменение дороже.',elapsed>context.deadline?'Дополнительные блоки и переделка не помещаются в срок.':'Маршрут помещается в условный срок; сравните цену обратной связи.']};
}
export function evaluate(route,contextId,trial=0,{severity=1}={}){
  const context=contexts.find(c=>c.id===contextId),terms=costs[contextId];
  if(!context||!Array.isArray(route)||route.some(id=>!blocks.some(b=>b.id===id)))throw new Error('Маршрут или контекст не найден.');
  const lastBuild=route.lastIndexOf('build'),release=route.indexOf('release');
  let uncertainty=context.uncertainty,built=0,prototype=0,days=0,rework=0,quality=35,feedback=0,gateAt=-1,testAt=-1;const trace=[],feedbackSamples=new Set();
  for(const [index,id] of route.entries()){
    const b=blocks.find(b=>b.id===id),start=days;let extra=0,effect='',waiting=0;
    if(id==='plan')effect='Согласованы исходный продукт и зависимости. Сам план не подтвердил потребность.';
    if(id==='research'){uncertainty*=0.65;effect='Проверена потребность: следующая работа начинается с меньшим числом предположений.';}
    if(id==='prototype'){prototype++;effect='Создан дешёвый образец. Для проверки трактовок нужен review или пилот.';}
    if(id==='build'){built++;quality+=15;effect='Создана рабочая часть. Остаточная неопределённость переносится в готовое решение.';}
    if(['review','pilot'].includes(id)){
      const sample=id+':'+prototype+':'+built;
      if(!prototype&&!built)effect='Пока нет ни образца, ни работающей части: встреча не дала проверяемой обратной связи.';
      else if(feedbackSamples.has(sample))effect='Тот же способ проверки и тот же образец: новых свидетельств нет. Встреча заняла время, неопределённость не изменилась.';
      else{feedbackSamples.add(sample);feedback++;extra=Math.ceil(uncertainty*built*(id==='pilot'?5:4)*severity);rework+=extra;uncertainty*=0.35;quality+=id==='pilot'?12:5;effect=`Обратная связь на ${prototype?'образце или рабочей части':'рабочей части'}: ${extra} дня исправления уже созданного. Следующая работа опирается на проверенные условия.`;}
    }
    if(id==='test'){
      if(built){quality+=18;testAt=index;effect='Проверена текущая реализация. Разработка после этого блока потребует новой проверки.';}
      else effect='Рабочей реализации ещё нет: тест не подтверждает качество будущей разработки.';
    }
    if(id==='gate'){
      if(built&&testAt>lastBuild){gateAt=index;waiting=context.gate?Math.max(0,terms.window-(days+b.days)):0;effect=`Приёмка проверила созданное и испытанное решение.${waiting?' До внешнего окна осталось '+waiting+' дня ожидания.':''}`;}
      else effect='Gate ещё не имеет испытанного продукта для приёмки. Формальная встреча не подтверждает будущий выпуск.';
    }
    if(id==='release')effect='Проверяем выпуск и последующий эффект; остаточные предположения могут потребовать позднего изменения.';
    days+=b.days+extra+waiting;trace.push({id,name:b.name,start,end:days,work:b.days,rework:extra,wait:waiting,effect});
  }
  const tested=testAt>lastBuild&&testAt<release,approved=!context.gate||gateAt>testAt&&gateAt<release;
  const late=Math.ceil(uncertainty*built*(trial?9:6)*severity);rework+=late;days+=late;
  const event=trial?terms.change:'Проверка остаточных предположений после выпуска';
  if(late)trace.push({id:'consequence',name:event,start:days-late,end:days,work:0,rework:late,wait:0,effect:`Осталось ${Math.round(uncertainty*100)}% неопределённости учебной модели. Позднее изменение потребовало ${late} дня переделки.`});
  quality=Math.max(0,Math.min(95,quality-(tested?0:22)));const spend=days*terms.daily;
  const viable=built>0&&release>lastBuild&&release===route.length-1&&tested&&approved,within=days<=context.deadline&&spend<=terms.budget;
  return {days,rework,quality,feedback,approved,tested,viable,within,spend,budget:terms.budget,daily:terms.daily,deadline:context.deadline,uncertainty,trace,context:context.name,event,insights:[
    viable?'Выпуск завершает маршрут после необходимых проверок.':'Выпуск не подтверждён: нужны разработка, проверка после последней разработки, обязательная приёмка и выпуск последним блоком.',
    feedback?'Обратная связь уменьшила остаточную неопределённость; сравните цену её момента.':'Потребность не проверена на образце: основная цена обнаружилась после создания решения.',
    within?'Срок и условный бюджет выдержаны. Это ещё не доказывает полезность продукта.':'Проверки, ожидание и переделка вышли за срок или условный бюджет.',
    context.gate?(approved?'Обязательный gate учтён после теста готового решения.':'Название Agile не отменяет обязательной внешней приёмки.'):'В этом контексте внешний gate не обязателен; он тоже расходует время.'
  ]};
}
function experiment(route,s){const severity=1+(seedNumber(s.seed)%3)*0.15;return {route:[...route],result:evaluate(route,s.context,0,{severity}),pressure:evaluate(route,s.context,1,{severity})};}
export function act(state,a){assertPlaying(state);const s=clone(state);
  if(a.type==='context'){if(!contexts.some(c=>c.id===a.value)||s.runs.length)throw new Error('Новый контекст — в новой попытке.');s.context=a.value;}
  else if(a.type==='add'){if(!blocks.some(b=>b.id===a.value)||s.route.length>=14)throw new Error('Предел маршрута — 14 блоков.');s.route.push(a.value);}
  else if(a.type==='remove'){if(!Number.isInteger(a.index)||a.index<0||a.index>=s.route.length)throw new Error('Блок не найден.');s.route.splice(a.index,1);}
  else if(a.type==='move'){const to=a.index+a.delta;if(!Number.isInteger(a.index)||a.index<0||a.index>=s.route.length||![-1,1].includes(a.delta)||to<0||to>=s.route.length)throw new Error('Нельзя переместить блок.');[s.route[a.index],s.route[to]]=[s.route[to],s.route[a.index]];}
  else if(a.type==='preset'){if(!presets[a.value])throw new Error('Подход не найден.');s.route=[...presets[a.value]];}
  else if(a.type==='run'){if(!s.route.includes('build')||!s.route.includes('release'))throw new Error('Нужны разработка и выпуск.');s.runs.push(s.modelVersion===2?experiment(s.route,s):{route:[...s.route],result:evaluateLegacy(s.route,s.context,s.runs.length)});s.turn++;if(s.runs.length===2)s.phase='ended';}
  else throw new Error('Действие не найдено.');record(s,a,a.type==='run'?'Маршрут испытан':'Маршрут изменён');return s;
}
const validRoute=route=>Array.isArray(route)&&route.length<=14&&route.every(id=>blocks.some(b=>b.id===id));
function validResult(r){return r&&['days','rework','quality','deadline'].every(key=>Number.isFinite(r[key])&&r[key]>=0)&&typeof r.viable==='boolean'&&typeof r.approved==='boolean'&&Array.isArray(r.insights)&&r.insights.every(text=>typeof text==='string')&&Array.isArray(r.trace)&&r.trace.every(t=>t&&typeof t.name==='string'&&Number.isFinite(t.end)&&typeof t.effect==='string');}
export function validate(s){return Boolean(basicValid(s)&&[undefined,2].includes(s.modelVersion)&&contexts.some(c=>c.id===s.context)&&validRoute(s.route)&&Array.isArray(s.runs)&&s.runs.length<=2&&s.turn===s.runs.length&&(s.phase==='ended')===(s.runs.length===2)&&s.runs.every(r=>r&&validRoute(r.route)&&r.route.includes('build')&&r.route.includes('release')&&validResult(r.result)&&(s.modelVersion!==2||validResult(r.pressure)&&JSON.stringify(r)===JSON.stringify(experiment(r.route,s)))));}
function trialMarkup(run,index){const r=run.result;return `<section class="trial-result"><h2>Испытание ${index+1}: ${run.pressure?'обычные условия и изменение':'сохранённые условия'}</h2><p>${r.days} дней · переделка ${r.rework} · качество ${r.quality}/100 · ${r.viable?'выпуск исполним':'выпуск пока не исполним'}</p>${run.pressure?`<p class="hybrid-pressure">${esc(run.pressure.event)}: ${run.pressure.days} дней · ${run.pressure.rework} дня переделки · расход ${run.pressure.spend.toLocaleString('ru-RU')} ₽.</p>`:''}<ol class="route-trace">${r.trace.map(t=>`<li><b>${esc(t.name)} · день ${t.end}</b><p>${esc(t.effect)}</p></li>`).join('')}</ol></section>`;}
export function render(s){const c=contexts.find(c=>c.id===s.context),terms=costs[s.context],r=s.modelVersion===2?evaluate(s.route,s.context):evaluateLegacy(s.route,s.context);return `<div class="hybrid-context">${select('context','Природа проекта',contexts.map(c=>[c.id,c.name]),s.context,s.runs.length>0)}<p>${c.description}</p>${s.modelVersion===2?`<p>Срок ${c.deadline} дней · бюджет ${terms.budget.toLocaleString('ru-RU')} ₽ · ${terms.daily.toLocaleString('ru-RU')} ₽ за день работы, ожидания или переделки.</p>`:'<p>Продолжаете сохранённую попытку с прежней моделью расчёта.</p>'}</div><section><h2>Соберите способ работы</h2><p>Выберите стартовый подход, затем меняйте блоки. Цена определяется порядком проверки, а не названием методологии.</p><div class="hybrid-presets">${Object.entries(presets).map(([id])=>button('preset',{waterfall:'Waterfall',agile:'Agile',hybrid:'Hybrid'}[id],`data-value="${id}"`)).join('')}</div><details class="hybrid-block-help"><summary>Что проверяют разные блоки</summary><p>Исследование уточняет потребность; прототип создаёт образец. Review и пилот проверяют предположения на образце или готовой части. Тест ищет ошибки реализации, gate подтверждает обязательную приёмку. Выпуск должен завершать маршрут.</p></details><div class="block-palette">${blocks.map(b=>button('add',b.name+' · '+b.days+' д.',`data-value="${b.id}"`,s.route.length>=14)).join('')}</div><ol class="route-builder">${s.route.map((id,i)=>`<li><b>${blocks.find(b=>b.id===id).name}</b><div>${button('move','←',`data-index="${i}" data-delta="-1" aria-label="Переместить блок ${i+1} влево"`,i===0)}${button('move','→',`data-index="${i}" data-delta="1" aria-label="Переместить блок ${i+1} вправо"`,i===s.route.length-1)}${button('remove','Убрать',`data-index="${i}"`)}</div></li>`).join('')}</ol><p class="hybrid-preview">План до испытания: ${s.route.reduce((n,id)=>n+blocks.find(b=>b.id===id).days,0)} дней блоков. ${r.viable?'Проверки выпуска стоят в исполнимом порядке.':'Порядок выпуска ещё не подтверждён.'} Цена переделки станет наблюдением после испытания.</p>${button('run',s.runs.length?'Испытать исправленный маршрут':'Испытать маршрут', 'class="button primary"')}</section>${s.runs.map(trialMarkup).join('')}${s.phase==='ended'?comparisonMarkup(s):''}`;}
export function comparison(s){if(s.modelVersion!==2||s.runs.length<2)return null;const [a,b]=s.runs;return {days:b.result.days-a.result.days,rework:b.result.rework-a.result.rework,spend:b.result.spend-a.result.spend,pressureDays:b.pressure.days-a.pressure.days,changed:JSON.stringify(a.route)!==JSON.stringify(b.route)};}
function comparisonMarkup(s){const diff=comparison(s);if(!diff)return '';const signed=n=>(n>0?'+':'')+n.toLocaleString('ru-RU');return `<section class="hybrid-comparison"><h2>Что изменил второй маршрут</h2><p>Оба плана испытаны в одинаковом контексте и на одном внешнем изменении. ${diff.changed?'Поменялся только состав или порядок блоков.':'Маршрут остался прежним: различий результата ожидать не нужно.'}</p><dl><div><dt>Срок</dt><dd>${signed(diff.days)} дня</dd></div><div><dt>Переделка</dt><dd>${signed(diff.rework)} дня</dd></div><div><dt>Расход</dt><dd>${signed(diff.spend)} ₽</dd></div><div><dt>Срок при изменении</dt><dd>${signed(diff.pressureDays)} дня</dd></div></dl></section>`;}
export function report(s){const run=s.runs.at(-1),r=run.result,diff=comparison(s),insights=[...r.insights];if(diff)insights.push(diff.changed?`Второй маршрут изменил срок на ${diff.days} дня, переделку на ${diff.rework} дня и расход на ${diff.spend.toLocaleString('ru-RU')} ₽ при тех же условиях.`:'Одинаковые маршруты дали одинаковый результат: метка Agile/Waterfall сама по себе ничего не меняет.');if(run.pressure)insights.push(`При внешнем изменении: ${run.pressure.days} / ${r.deadline} дней, ${run.pressure.viable?'выпуск подтверждён':'выпуск не подтверждён'}, ${run.pressure.within?'срок и бюджет выдержаны':'ограничения превышены'}.`);return summary([['Срок',r.days+' / '+r.deadline+' дней'],['Переделка',r.rework+' дней'],['Качество',r.quality+'/100'],['Приёмка',r.approved?'учтена':'не пройдена']],insights,{nextAction:'Проверить одно важное предположение на образце до дорогостоящей разработки'});}
