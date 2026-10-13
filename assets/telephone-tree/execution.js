import {stateMeta,slotLabels} from './semantics.js';
export function executionPlan(s){
  const severe=s.scenario.critical.filter(id=>['lost','replaced'].includes(s.packet[id].state)),weak=s.scenario.critical.filter(id=>s.packet[id].state==='blurry'),late=s.recoveries.filter(r=>r.step>=3&&r.debtBefore>=4),violation=['lost','replaced'].includes(s.packet.constraint.state);
  const received=s.packet.goal.current;
  const understood=s.packet.goal.state==='replaced'?s.scenario.replacements.goal:s.packet.goal.state==='lost'?'Конкретный объём цели не подтверждён.':s.packet.goal.current;
  const done=violation?`Работа начата без обязательной границы: ${s.scenario.replacements.constraint}.`:
    severe.includes('criteria')?'Подготовлен формально готовый результат, но пригодность по исходному критерию не подтверждена.':
    severe.includes('owner')?'Работа выполнена, но владелец приёмки не определён.':
    severe.includes('deadline')?'Работа начата без подтверждённого точного срока.':
    s.packet.phantom?.state==='phantom'?'Помимо исходной работы выполнен лишний презентационный объём.':
    late.length?'Исходная рамка дошла, но ранее составленные планы пришлось исправлять.':
    weak.length?'Результат подготовлен с дополнительным уточнением размытых условий.':'Работа выполнена в подтверждённых рамках и проверена по сохранённым критериям.';
  return [{stage:'Получил',text:received},{stage:'Понял',text:understood},{stage:'Сделал',text:done,violation,late:late.map(r=>r.slot),status:violation?'Обязательное ограничение нарушено':severe.length||late.length||weak.length||s.packet.phantom?.state==='phantom'?'Частично успешно':'Управленческий смысл сохранён'}];
}
