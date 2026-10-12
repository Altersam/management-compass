import {round} from './random.js';
export function eventOptions(event){
  if(event.kind==='tempt')return [['take','Взять в спринт',`Добавить ${event.units} ед. заметной работы. Вклад в цель не подтверждён.`],['decline','Сохранить фокус','Объяснить отказ и оставить ресурс задачам под цель.']];
  if(event.kind==='capacity')return [['accept','Принять потерю мощности','Сохранить обязательства; вероятность хвоста возрастёт.'],['replan','Перепланировать ресурс','Потратить часть мощности на координацию и смягчить потерю.']];
  return [['fix','Проверить проблему сейчас','Отдать часть ёмкости на защиту результата.'],['ignore','Продолжить текущий план','Сохранить ресурс сейчас; риск может проявиться на Review.']];
}
export function resolveEvent(s,event,choice){
  if(!eventOptions(event).some(([id])=>id===choice))throw new Error('Вариант события не найден.');
  if(event.kind==='tempt'&&choice==='take'){
    const id='extra-'+event.id;s.tasks.push({id,name:event.title,size:event.units,kind:'visible',effects:[0,0,0],targets:[],requires:null,availableSprint:s.sprint,window:null,investment:0,signal:'Вклад в цель не подтверждён',visible:true});s.progress[id]=0;s.selected.push(id);
  }
  if(event.kind==='capacity'||event.kind==='urgent'&&choice==='fix'){
    const loss=event.units*(event.kind==='capacity'&&choice==='replan'?.45:1)*(1+(s.wip-2)*.12);
    s.run.capacity=round(Math.max(s.run.work+1,s.run.capacity-loss));
  }
  if(event.kind==='urgent'&&choice==='ignore')s.run.ignored.push(event.criterion);
  s.run.responses.push({id:event.id,day:event.day,kind:event.kind,title:event.title,choice});s.run.pending=null;
  const latest=s.run.rows.at(-1);latest.capacity=s.run.capacity;latest.message='Решение принято; продолжите спринт и наблюдайте последствия.';
}
