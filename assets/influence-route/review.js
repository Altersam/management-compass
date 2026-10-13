export function routeText(s){
  const name=id=>s.scenario.nodes.find(n=>n.id===id).name;let text='Вы';
  for(const h of s.routeHistory)text+=(h.kind==='move'?' → ':h.kind==='ghost'?' ⇢ ':' ━╳→ ')+name(h.to)+(h.kind==='move'?'':h.kind==='ghost'?' (призрак)':' (передача не состоялась)');
  return text;
}
export function diagnoses(s){
  const formal=s.routeHistory.filter(h=>h.kind==='move'&&s.scenario.edges.find(e=>e.id===h.edge)?.type==='formal').length,notes=[];
  if(formal)notes.push('На формальную вертикаль ушло '+formal+' передач. Она доставляла материалы, но сама не добавляла рекомендации.');
  if(s.result.endorserNames.length)notes.push(s.result.endorserNames.join(', ')+': носители были подготовлены до комнаты решения. Их рекомендации поступили по реальным связям доверия или экспертизы.');
  if(s.officialRequests)notes.push('Официальные запросы подняли внимание оппонента. Прослеживаемость не заменила содержательной опоры.');
  if(s.opponent.neutralized.length)notes.push('Оппонент снял готовность носителя. Сама дорога сохранилась, поэтому повторный брифинг ещё мог вернуть носительство.');
  if(s.opponent.actionsTaken.some(a=>a.edge))notes.push('Сильный шум позволил оппоненту перекрыть известную дорогу. Восстановление контакта требовало отдельного хода и жетона капитала.');
  if(s.ghostAttempts)notes.push('Неподтверждённые предположения о прямом доступе потратили ходы, не переместив решение.');
  if(s.decider.overpushPenalty)notes.push('Для CEO суммарная поддержка стала давлением. Дополнительный союзник ухудшил исход вместо усиления решения.');
  if(!notes.length)notes.push('Сам факт прибытия к решающему не создал рекомендации. Сторонник, носитель и человек, открывающий дверь, выполняют разные функции.');
  return notes;
}
