export const project={title:'Запуск внутреннего сервиса заявок',deadline:20,budget:1200000,audience:100};
export const tasks=[
  {id:'requirements',name:'Исследование требований',duration:3,start:1,dependencies:[],skills:['analysis'],risk:0.12,assigned:['anna']},
  {id:'prototype',name:'Прототип',duration:4,start:4,dependencies:['requirements'],skills:['design'],risk:0.18,assigned:['maxim']},
  {id:'testing',name:'Проверка',duration:2,start:8,dependencies:['prototype'],skills:['testing'],risk:0.08,assigned:['pavel']},
  {id:'integration',name:'Интеграция',duration:4,start:10,dependencies:['testing'],skills:['engineering'],risk:0.2,assigned:['denis'],external:'it'},
  {id:'approval',name:'Согласование',duration:2,start:14,dependencies:['integration'],skills:['coordination'],risk:0.1,assigned:['irina']},
  {id:'training',name:'Обучение пользователей',duration:3,start:9,dependencies:['prototype'],skills:['teaching','coordination'],risk:0.12,assigned:['irina']},
  {id:'launch',name:'Запуск',duration:1,start:17,dependencies:['approval','training'],skills:['engineering','coordination'],risk:0.12,assigned:['denis','irina']}
];
export const complete=task=>task.progress>=task.effort-0.00001;
export function blockers(state,task){
  const result=task.dependencies.filter(id=>!complete(state.tasks.find(t=>t.id===id))).map(id=>state.tasks.find(t=>t.id===id).name);
  if(task.external==='it'&&!state.it.ready&&!state.it.riskAccepted)result.push('Доступ и ответ IT');
  if(task.awaitingDecision)result.push('Ваше разрешение');
  return result;
}
export function taskStatus(state,task){
  if(complete(task))return 'done';
  if(task.paused)return 'paused';
  if(blockers(state,task).length)return 'blocked';
  if(!task.assigned.some(id=>{const p=state.people.find(p=>p.id===id);return p&&state.time>=p.absentUntil&&state.time>=p.trainingUntil;}))return 'unassigned';
  return 'active';
}
