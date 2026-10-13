export const mitigations=[
  {id:'independent',name:'Независимая проверка и отвод заинтересованного участника',text:'Отделить факт и оценку от личного интереса; проверка потребует ресурса и может задержать исполнение.',covers:['procedure','conflict'],principles:['rules','fairness']},
  {id:'appeal',name:'Право апелляции и публикация критериев',text:'Сделать основание доступным сторонам и оставить путь пересмотра; это не гарантирует удовлетворённость всех.',covers:['trust','fairness'],principles:['fairness','care']},
  {id:'checkpoint',name:'Контрольная точка и испытательный этап',text:'Проверить эффект до продолжения полного объёма; часть результата появится позже.',covers:['performance','uncertainty'],principles:['safety','sustainability']},
  {id:'reserve',name:'Резервный вариант и поэтапное обязательство',text:'Сохранить возможность замены или уменьшения потерь; резерв требует денег и координации.',covers:['uncertainty','performance'],principles:['safety','utility']},
  {id:'recognition',name:'Зафиксировать вклад и границы раскрытия',text:'Назвать подтверждённый вклад и необходимую информацию, не публикуя лишние персональные сведения.',covers:['trust','privacy'],principles:['care','fairness']}
];
export function protectionFor(option,mitigation){return {primaryCovered:mitigation.covers.includes(option.risk),uncertaintyCovered:mitigation.covers.includes('uncertainty'),procedureCovered:mitigation.covers.includes('procedure')};}
