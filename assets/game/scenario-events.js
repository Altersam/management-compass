// Events only for the organisational service launch, not a universal domain engine.
import {random} from './state.js';
import {emit} from './events.js';
const choices=(cost,days)=>[
  {id:'reserve',title:'Закрыть резервом',detail:'Дополнительные расходы; доступность команды сохранена.',cost},
  {id:'flex',title:'Перестроить работу',detail:'Меньше расходов сейчас; дополнительная нагрузка и риск переделки.',fatigue:.08,effort:.25},
  {id:'wait',title:'Дать время',detail:`Без доплаты; часть работы ждёт ${String(days).replace(".",",")} дня.`,days}
];
export const scenarioEvents=[
  {id:'childCare',domain:'organisation',weight:2,human:true,title:'Нужен день дома',text:'У коллеги заболел ребёнок. Доступность на ближайший день изменилась.',choices:choices(9000,1)},
  {id:'familyCare',domain:'organisation',weight:2,human:true,title:'Семейные обстоятельства',text:'Коллеге нужно помочь близкому человеку. Два дня нельзя считать обычными рабочими.',choices:choices(18000,2)},
  {id:'transport',domain:'organisation',weight:2,human:true,title:'Проблема с транспортом',text:'Коллега не может вовремя добраться до рабочего места.',choices:choices(3000,.5)},
  {id:'connectionLoss',domain:'organisation',weight:2,human:true,title:'Нет связи с рабочим контуром',text:'Связь недоступна до конца дня; можно выделить резервный рабочий канал.',choices:choices(5000,1)},
  {id:'equipment',domain:'organisation',weight:2,human:true,title:'Рабочий ноутбук недоступен',text:'Человек готов работать, но техника требует ремонта или замены.',choices:choices(16000,1.5)},
  {id:'doctor',domain:'organisation',weight:1,human:true,title:'Часть дня нужна для врача',text:'У коллеги изменилась доступность на ближайшую половину дня.',choices:choices(6000,.5)},
  {id:'leaveRequest',domain:'organisation',weight:1,human:true,title:'Запрос на незапланированный отпуск',text:'Коллега просит два дня. Нужно пересмотреть обязательства и резерв.',choices:choices(14000,2)},
  {id:'helpWindow',domain:'organisation',weight:1,human:true,title:'Коллега предложил помощь',text:'Появилось небольшое окно помощи. Можно направить его на запас или на проверку.',choices:[{id:'reserve',title:'Разгрузить команду',detail:'Восстановить ресурс людей; текущий план не ускоряется.',recover:.12},{id:'flex',title:'Проверить рабочий образец',detail:'Сейчас потребуются время и деньги, зато предположений станет меньше.',cost:6000,align:true},{id:'wait',title:'Сохранить окно в резерве',detail:'Ничего не менять сейчас; коллега сможет восстановить силы.',recover:.06}]},
  {id:'purchaseDelay',domain:'organisation',weight:2,human:false,title:'Задержалась закупка доступа',text:'Для следующей рабочей операции не подтверждён необходимый ресурс.',choices:choices(20000,1)},
  {id:'priorityChange',domain:'organisation',weight:2,human:false,title:'Появилось конкурирующее поручение',text:'У выбранного специалиста есть новое обязательство другого руководителя.',choices:choices(18000,1.5)},
  {id:'inputMismatch',domain:'organisation',weight:2,human:false,title:'На стыке непригодный вход',text:'Получатель уточнил состав данных: без них текущая операция не даёт пригодный результат.',choices:choices(12000,1)},
  {id:'acceptanceChange',domain:'organisation',weight:1,human:false,title:'Приёмка требует рабочий пример',text:'Подписи недостаточно: принимающая сторона просит подтвердить обычный сценарий.',choices:choices(15000,1)},
  {id:'plannedLeave',domain:'organisation',weight:0,human:true,title:'Началось запланированное отсутствие',text:'Даты были известны в профиле сотрудника. Теперь его работу должен прикрыть резерв или пересмотренный план.',choices:choices(14000,2)}
];
export function createScenarioEvents(rng){return {nextAt:2+random(rng)*3,seen:[],version:1};}
function eligible(def,p){return def.id==='childCare'?p.life?.children>0:def.id==='familyCare'?p.life?.care:def.id==='connectionLoss'?p.life?.remote:def.id==='transport'?!p.life?.remote:true;}
function introduce(s,def,person){
  const task=s.tasks.find(t=>t.progress<t.effort&&t.assigned.includes(person.id))||s.tasks.find(t=>t.progress<t.effort);
  emit(s,def.id,{key:'case-'+def.id+'-'+person.id+'-'+s.time,subject:person.id,detail:person.name+': '+def.text});
  const event=s.events.at(-1);event.scenario=true;event.task=task?.id;event.person=person.id;
  const days=def.choices.find(c=>c.id==='wait')?.days;
  if(days){event.priorAbsentUntil=person.absentUntil;event.unavailableUntil=s.time+days;person.absentUntil=Math.max(person.absentUntil,event.unavailableUntil);}
  return event;
}
export function advanceScenarioEvents(s){
  if(!s.scenarioEvents)return;
  for(const p of s.people){const leave=p.life?.leave;if(leave&&!leave.started&&s.time>=leave.start){leave.started=true;introduce(s,scenarioEvents.find(e=>e.id==='plannedLeave'),p);}}
  if(s.time<s.scenarioEvents.nextAt||s.time>=18||s.events.some(e=>e.scenario&&e.status==='open'))return;
  const active=s.people.filter(p=>s.time>=p.absentUntil&&s.time>=p.trainingUntil&&s.tasks.some(t=>t.assigned.includes(p.id)&&t.progress<t.effort));
  const candidates=def=>active.filter(p=>eligible(def,p));
  const pool=scenarioEvents.filter(e=>e.weight>0&&!s.scenarioEvents.seen.slice(-4).includes(e.id)&&candidates(e).length);
  if(!pool.length){s.scenarioEvents.nextAt=s.time+1;return;}
  let pick=random(s)*pool.reduce((n,e)=>n+e.weight,0),def=pool[0];for(const item of pool){pick-=item.weight;if(pick<=0){def=item;break;}}
  const people=candidates(def);introduce(s,def,people[Math.floor(random(s)*people.length)]);
  s.scenarioEvents.seen.push(def.id);s.scenarioEvents.nextAt=s.time+2+random(s)*4;
}
export function applyScenarioChoice(s,command){
  const event=s.events.find(e=>e.id===command.event&&e.scenario&&e.status==='open'),def=event&&scenarioEvents.find(e=>e.id===event.definition),choice=def?.choices.find(c=>c.id===command.choice);
  if(!choice)throw new Error('Это решение события уже недоступно.');if(s.spent+(choice.cost||0)>s.budget)throw new Error('Для этого варианта не осталось бюджета.');s.spent+=choice.cost||0;
  const person=s.people.find(p=>p.id===event.person),task=s.tasks.find(t=>t.id===event.task);
  // Availability models the covered work position: reserve or reassignment covers
  // this event, but cannot cancel another absence already recorded for the person.
  if(person&&event.unavailableUntil&&choice.id!=='wait'&&person.absentUntil===event.unavailableUntil)person.absentUntil=event.priorAbsentUntil;
  if(choice.days&&person&&!event.unavailableUntil)person.absentUntil=Math.max(person.absentUntil,s.time+choice.days);
  if(choice.fatigue)for(const p of s.people)p.fatigue=Math.min(1,p.fatigue+choice.fatigue);if(choice.effort&&task&&task.progress<task.effort)task.effort+=choice.effort;
  if(choice.recover)for(const p of s.people)p.fatigue=Math.max(0,p.fatigue-choice.recover);if(choice.align)s.flags.requirementsAligned=true;event.status='resolved';event.choice=choice.id;
}
