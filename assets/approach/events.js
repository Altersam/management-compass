import {clamp,round} from './generator.js';
export const eventChoices={
  delay:[['wait','Ждать штатного исполнения','Сохранить расходы сейчас; зависимые работы могут остановиться.'],['fast','Найти резервный маршрут','Дороже, но часть ожидания можно снять.'],['split','Разделить зависимую работу','Умеренные расходы и частичное ожидание.']],
  capacity:[['wait','Дождаться возвращения','Сохранить состав команды; доступная мощность временно меньше.'],['fast','Подключить временный ресурс','Оплатить замену и быстрее восстановить работу.'],['split','Перераспределить приоритеты','Часть мощности восстановится; другие обязательства подождут.']],
  change:[['adapt','Пересмотреть план сейчас','Потратить ресурс на уточнение и ограничить будущий передел.'],['freeze','Сохранить исходный объём','Меньше изменения сейчас; часть новых ожиданий останется за границами результата.'],['probe','Проверить рабочий пример','Умеренные затраты на проверку; часть решения остаётся открытой.']],
  quality:[['adapt','Исправить затронутую часть сейчас','Раннее исправление займёт ресурс, но ограничит зависимые ошибки.'],['defer','Продолжить до контрольной точки','Сэкономить на внеплановой проверке; ошибка может распространиться.'],['probe','Проверить зависимые части','Выделить ресурс на диагностику перед масштабным исправлением.']],
  formal:[['adapt','Перепроверить комплект сейчас','Подготовить основания и исправить несоответствие раньше.'],['defer','Закрыть замечание при приёмке','Отложить расход сейчас; поздний возврат может затронуть больше готового.'],['probe','Подготовить подтверждения по критичным частям','Снять часть неопределённости ограниченной проверкой.']],
  budget:[['scope','Пересмотреть объём и приоритеты','Сохранить лимит ценой части первоначального результата.'],['absorb','Использовать подготовленный резерв','Сохранить объём; ресурс защиты от следующих событий уменьшится.'],['probe','Пересобрать смету и последовательность','Проверить возможности экономии, принимая стоимость перепланирования.']]
};
export function chooseEvent(run,event,choice,c){
  if(!eventChoices[event.kind].some(([id])=>id===choice))throw new Error('Вариант события не найден.');
  const v=event.severity,addCost=f=>{run.cost+=c.budget*f*v;},cover=days=>{const used=Math.min(run.reserve,days);run.reserve-=used;run.wait+=days-used;};
  if(event.kind==='delay'||event.kind==='capacity'){
    if(choice==='fast'){addCost(.07);cover(.2*v);}
    if(choice==='split'){addCost(.025);cover(.8*v);}
    if(choice==='wait')cover(1.8*v);
  }else if(event.kind==='budget'){
    if(choice==='scope'){run.valueCap=Math.max(55,run.valueCap-12*v);run.target=Math.max(65,run.target-8*v);}
    if(choice==='absorb'){addCost(.09);run.reserve=Math.max(0,run.reserve-.7*v);}
    if(choice==='probe'){addCost(.045);run.wait+=.35*v;}
  }else {
    if(choice==='freeze'){run.valueCap=Math.max(50,run.valueCap-13*v);addCost(.005);}
    else {
      const exposure=v*(event.kind==='formal'?(2+7*c.regulation*(1-run.parameters.upfront)):event.kind==='quality'?5+5*c.defectCost:4+6*c.volatility);
      if(choice==='adapt'){addCost(.035);run.pendingError+=exposure*.3;run.forceCheck=true;}
      if(choice==='probe'){addCost(.018);run.pendingError+=exposure*.55;run.unknowns=clamp(run.unknowns-.08);run.forceCheck=true;}
      if(choice==='defer'){run.pendingError+=exposure;run.unknowns=clamp(run.unknowns+.1*v);}
    }
  }
  run.responses.push({week:run.week,id:event.id,title:event.title,choice});run.cost=round(run.cost);run.pending=null;
}
