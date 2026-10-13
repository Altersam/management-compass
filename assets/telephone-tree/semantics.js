export const slotLabels={goal:'Цель',deadline:'Срок',owner:'Владелец',criteria:'Критерий результата',constraint:'Ограничение',priority:'Приоритет',context:'Контекст'};
export const stateMeta={intact:{symbol:'●',label:'Сохранено',value:1},blurry:{symbol:'◐',label:'Размыто',value:.6},lost:{symbol:'○',label:'Потеряно',value:0},replaced:{symbol:'!',label:'Подменено',value:.15},restored:{symbol:'↺',label:'Восстановлено',value:1},phantom:{symbol:'+',label:'Фантомное требование',value:0},rejected:{symbol:'×',label:'Исключено из поручения',value:1},absent:{symbol:'—',label:'Не было в источнике',value:1}};
export function snapshot(s,label){return {label,cells:structuredClone(s.packet),received:structuredClone(s.packet),recoveries:[],step:s.step};}
export function semanticText(slot,state,scenario){
  if(state==='lost')return 'Эта часть поручения не передана.';
  if(state==='intact'||state==='restored')return scenario.original[slot];
  return (state==='replaced'?scenario.replacements:scenario.blurry)[slot];
}
