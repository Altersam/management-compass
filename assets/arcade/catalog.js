export const catalog=[
  {id:'hybrid',title:'Проектный подход',subtitle:'Agile / Waterfall / Hybrid Lab',mechanic:'Соберите маршрут из блоков и испытайте его на разных изменениях.',time:'7–10 минут',topics:[2,8,9],storage:'hybrid'},
  {id:'meeting',title:'Совещание без решения',subtitle:'Стол переговоров',mechanic:'Выясните ограничения участников и получите выбор, который можно исполнить.',time:'5–8 минут',topics:[5,6],storage:'meeting'},
  {id:'ethics',title:'Этическая развилка',subtitle:'Факты до выбора',mechanic:'Исследуйте две заявки, отделите личную связь от критерия и объясните решение.',time:'5–7 минут',topics:[4],storage:'ethics'},
  {id:'change',title:'Change Lab',subtitle:'Лаборатория принятия',mechanic:'Выбирайте меры для четырёх групп и наблюдайте реальные барьеры и отложенное подкрепление.',time:'6–10 минут',topics:[3,6,9],storage:'change'},
  {id:'telephone',title:'Испорченный телефон',subtitle:'Передача смысла',mechanic:'Проведите поручение через пять переходов, сохранив действие, срок, качество и условия.',time:'4–6 минут',topics:[5,7],storage:'telephone'},
  {id:'versions',title:'Версия 7_final_точно2',subtitle:'Документальный детектив',mechanic:'Восстановите действующую версию по файлам, датам и уведомлениям.',time:'4–6 минут',topics:[7],storage:'versions'},
  {id:'metrics',title:'Метрика врёт',subtitle:'Дашборд под подозрением',mechanic:'Меняйте разрезы и знаменатель, чтобы отделить улучшение от исчезнувших пользователей.',time:'4–7 минут',topics:[10],storage:'metrics'},
  {id:'flow',title:'Бутылочное горлышко',subtitle:'Живой поток заявок',mechanic:'Управляйте WIP, ресурсом и возвратами там, где действительно скапливается очередь.',time:'5–8 минут',topics:[8],storage:'flow'},
  {id:'sprint',title:'Sprint Commander',subtitle:'Цель вместо velocity',mechanic:'Соберите backlog под цель, ограничьте незавершённое и скорректируйте следующий спринт.',time:'6–9 минут',topics:[1,2,3],storage:'sprint'},
  {id:'influence',title:'Карта влияния',subtitle:'Реальная сеть',mechanic:'Восстановите связи права, информации и ресурса, затем соберите опору решения.',time:'5–7 минут',topics:[3,6],storage:'influence'}
];
export const loaders={hybrid:()=>import('./hybrid.js'),meeting:()=>import('./meeting.js'),ethics:()=>import('./ethics.js'),change:()=>import('./change.js'),telephone:()=>import('./telephone.js'),versions:()=>import('./versions.js'),metrics:()=>import('./metrics.js'),flow:()=>import('./flow.js'),sprint:()=>import('./sprint.js'),influence:()=>import('./influence.js')};
