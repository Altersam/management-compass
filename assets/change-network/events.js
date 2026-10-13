import {clamp as limit} from '../sprint-goal/random.js';
const clamp=n=>limit(n,0,100);
export const eventOptions={
  sabotage:[['diagnose','Выяснить причину','Разобрать реальную операцию и снять часть скрытого конфликта.'],['pressure','Усилить контроль','Повысить формальное выполнение, принимая цену недоверия.'],['pause','Снизить темп','Сохранить ресурс и дать пространство для пересмотра.']],
  overload:[['resource','Снять часть нагрузки','Восстановить ресурс и уменьшить усталость.'],['pause','Отложить часть перехода','Снизить темп без немедленного усиления требований.'],['pressure','Оставить жёсткий срок','Сохранить формальный темп, но риск ошибок остаётся.']],
  envy:[['explain','Объяснить критерии пилота','Назвать, почему выбран этот участок и как результат станет общим.'],['share','Передать практику соседям','Открыть совместную рабочую попытку и уменьшить разрыв.'],['ignore','Не менять план','Сохранить фокус пилота и принять напряжение соседей.']],
  rumor:[['explain','Публично уточнить смысл','Сделать границы изменения и известные факты доступными.'],['listen','Встретиться с доверенными участниками','Обсудить опасения через реальные центры влияния.'],['ignore','Не реагировать','Сохранить время, принимая риск распространения слуха.']]
};
export function selectEvent(s){
  if(s.events.length>=2)return null;
  const highest=key=>[...s.nodes].sort((a,b)=>b[key]-a[key])[0],lowest=key=>[...s.nodes].sort((a,b)=>a[key]-b[key])[0];
  for(const kind of s.scenario.eventOrder){if(s.events.some(e=>e.kind===kind))continue;let n;
    if(kind==='sabotage'){n=highest('latentResistance');if(n.latentResistance<62||n.compliance<40)continue;}
    if(kind==='overload'){n=highest('fatigue');if(n.fatigue<65)continue;}
    if(kind==='envy'){n=s.nodes.filter(n=>n.id!==s.pilotNode).sort((a,b)=>b.latentResistance-a.latentResistance)[0];if(!s.pilotNode||n.latentResistance<36)continue;}
    if(kind==='rumor'){n=lowest('trust');if(n.trust>38)continue;}
    const copy={sabotage:['Кивают, но работают по-старому','Публичное выполнение не стало внутренним обязательством.'],overload:['Группа не выдерживает темп','Усталость и текущая нагрузка мешают переходу.'],envy:['Соседи считают пилот привилегией','Доказательство работает, но его доступность вызывает напряжение.'],rumor:['Распространяется слух о сокращениях','Недоверие заполняет неопределённость вокруг изменения.']}[kind];
    return {id:kind+'-'+s.wave,kind,node:n.id,wave:s.wave,title:copy[0],text:n.name+': '+copy[1],choice:null};
  }return null;
}
export function resolveEvent(s,choice){
  const event=s.pendingEvent;if(!event||!eventOptions[event.kind].some(([id])=>id===choice))throw new Error('Вариант события недоступен.');const n=s.nodes.find(n=>n.id===event.node),add=(key,amount)=>{n[key]=clamp(n[key]+amount);};
  if(choice==='diagnose'||choice==='listen'){n.barrierKnown=true;add('trust',13);add('latentResistance',-17);for(const e of s.edges)if(e.from===n.id||e.to===n.id)e.revealed=true;}
  if(choice==='pressure'){add('compliance',20);add('commitment',-10);add('latentResistance',12);add('fatigue',6);}
  if(choice==='resource'){add('capacity',23);add('fatigue',-24);add('trust',8);if(n.barrier==='capacity')n.resolved=true;}
  if(choice==='pause'){add('fatigue',-14);add('capacity',10);add('trust',5);add('adoption',-4);}
  if(choice==='explain'){add('trust',9);add('latentResistance',-12);add('commitment',5);}
  if(choice==='share'){add('capability',12);add('trust',9);add('latentResistance',-10);add('commitment',8);}
  if(choice==='ignore'){add('trust',-4);add('latentResistance',8);}
  event.choice=choice;s.events.push(structuredClone(event));s.pendingEvent=null;s.messages.push(`${n.name}: реакция на событие выбрана; последствия войдут в следующие волны.`);
}
