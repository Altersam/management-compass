import {stateMeta} from './semantics.js';
export function recover(s,id){
  const cell=s.packet[id];if(!cell||['intact','restored','rejected'].includes(cell.state))throw new Error('Эта ветка не требует восстановления.');if(s.clarifications<=0)throw new Error('Уточнения исчерпаны.');
  s.clarifications--;const before=cell.state;cell.fromState=before;
  if(id==='phantom'){cell.state='rejected';cell.current='Источник не поручал дополнительный материал.';}else{cell.state='restored';cell.current=s.scenario.original[id];}
  const latest=s.history.at(-1);latest.cells=structuredClone(s.packet);latest.recoveries.push({slot:id,before,after:cell.state});
  s.recoveries.push({slot:id,step:s.step,from:before,debtBefore:s.damageDebt[id]||0});
  s.messages.push(`${id==='phantom'?'Дополнение исключено':'Ветка восстановлена'} из источника. Ранее созданные планы не исчезли автоматически.`);
}
