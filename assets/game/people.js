export const people=[
  {id:'anna',name:'Анна',role:'Аналитика и качество',behavior:'Сверяет источники и замечает несовместимые требования. Для нового случая просит образец.',speed:2,quality:3,communication:2,cost:9000,skills:{analysis:3,design:1,testing:3,engineering:1,coordination:2,teaching:1}},
  {id:'maxim',name:'Максим',role:'Быстрый прототип',behavior:'Быстро показывает работающий вариант. При спешке оставляет крайние случаи на потом.',speed:3,quality:2,communication:1,cost:12000,skills:{analysis:1,design:3,testing:1,engineering:2,coordination:1,teaching:1}},
  {id:'irina',name:'Ирина',role:'Координация и пользователи',behavior:'Выясняет, кто должен договориться. Проверяет новый порядок на реальном обращении.',speed:2,quality:2,communication:3,cost:9000,skills:{analysis:2,design:1,testing:2,engineering:0,coordination:3,teaching:3}},
  {id:'pavel',name:'Павел',role:'Проверки и стабильность',behavior:'Делает путь повторяемым и проверяет исключения. На неопределённом входе работает медленнее.',speed:1,quality:3,communication:2,cost:8000,skills:{analysis:2,design:1,testing:3,engineering:2,coordination:2,teaching:2}},
  {id:'denis',name:'Денис',role:'Интеграция',behavior:'Разбирается в технических связях. Без ответа владельца доступа не обещает готовность.',speed:2,quality:2,communication:2,cost:10000,skills:{analysis:1,design:2,testing:2,engineering:3,coordination:1,teaching:1}}
];
export const contractor={id:'expert',name:'Лев',role:'Временный эксперт IT',behavior:'Быстро соединяет системы; доступен на время этого проекта. Команде нужно сохранить знания после передачи.',speed:3,quality:3,communication:1,cost:22000,skills:{analysis:1,design:1,testing:2,engineering:3,coordination:1,teaching:0},temporary:true};
export function skillFit(person,task){return task.skills.reduce((sum,skill)=>sum+(person.skills[skill]||0),0)/(task.skills.length*3);}
export function available(person,time){return time>=person.absentUntil&&time>=person.trainingUntil;}
