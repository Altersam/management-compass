(function(root){
  'use strict';
  const tasks=[
    {id:'external',title:'Ответ по обязательному сроку',minutes:90},
    {id:'analysis',title:'Разобраться с повторяющимися возвратами',minutes:120},
    {id:'meeting',title:'Встреча без обязательного решения',minutes:60},
    {id:'team',title:'Подготовить распределение работы команды',minutes:90},
    {id:'requests',title:'Ответить на обычные запросы',minutes:180}
  ];
  function initial(topic,practice=false){
    const values={
      1:{plan:Object.fromEntries(tasks.map(t=>[t.id,'today'])),burst:practice,interruptions:6,focus:false,notify:false},
      2:{point:4,check:'sent',late:true,dependency:practice?1:2},
      3:{level:0,experience:practice?1:3,risk:practice?3:1,newTask:practice,bounds:false},
      4:{path:[],practice},
      5:{parts:['context','fact','request','options','recommendation','deadline'],channel:'email',tone:'neutral',extra:false,ambiguous:practice},
      6:{owner:'coordinator',action:'meeting',variants:false,cost:false,limited:practice},
      7:{version:practice?'old':'new',delivered:false,understood:false,executed:false,accepted:false},
      8:{incoming:40,people:2,minutes:15,hours:4,returns:20,approvals:1,improvement:'none'},
      9:{group:practice?'access':'leader',help:'training',leader:false},
      10:{scope:'system',open:false,view:'time',conclusion:'success',evidence:'none'}
    };
    return {revision:2,...values[topic]};
  }
  const metric=(label,value,unit='')=>({label,value,unit});
  function evaluate(topic,s){
    let metrics=[],story=[],visual={};
    if(topic===1){
      const plan=s.plan||{};const own=tasks.filter(t=>plan[t.id]==='today');
      const delegated=tasks.filter(t=>plan[t.id]==='delegate');const later=tasks.filter(t=>plan[t.id]==='later');
      const switching=s.focus?10:Number(s.interruptions)*7;
      const used=own.reduce((n,t)=>n+t.minutes,0)+delegated.length*10+(s.burst?45:0)+switching;
      const over=Math.max(0,used-300);
      metrics=[metric('Есть времени',300,'мин'),metric('Займёт этот план',used,'мин'),metric('Не помещается',over,'мин')];
      story.push(over?`К вечеру ${over} минут работы останутся незавершёнными. Скорость не отменяет того, что вы уже приняли больше обязательств, чем помещается в день.`:'Этот план помещается в день. Но проверьте, кому досталась перенесённая или переданная работа.');
      if(plan.external!=='today')story.push('Обязательный ответ вытеснен: сначала нужно согласовать, кто обеспечит внешний срок.');
      if(later.length&&!s.notify)story.push('Вы освободили время, но получатели ещё ждут обещанного. Без уведомления перенос станет неожиданной задержкой.');
      if(plan.analysis==='later')story.push('Проверка причин возвратов снова отложена. Завтра похожие запросы вернутся: важная несрочная работа постепенно становится авралом.');
      if(delegated.length)story.push('Передача требует десяти минут на условия задачи в этом примере. Если у коллег нет ресурса, очередь лишь переместится.');
      if(!s.focus&&s.interruptions>2)story.push('Короткие переключения выглядят безобидно, но в этом дне они съедают время восстановления контекста.');
      visual={segments:tasks.map(t=>({...t,choice:plan[t.id]})),used,over,switching};
    }
    if(topic===2){
      const timely=Number(s.point)<=Number(s.dependency)&&s.check==='ready';
      const discovered=timely?Number(s.point):Math.max(Number(s.point),s.check==='sent'?4:0);
      const room=Math.max(0,5-discovered);
      metrics=[metric('Сведения нужны','день '+s.dependency),metric('Проблема видна','день '+discovered),metric('Время на реакцию',room,'дн.')];
      story.push(timely?'Вы проверили не отправку запроса, а готовность нужных данных. Задержка видна до того, как начнётся зависимая работа.':'Отправка запроса выглядит как хороший статус. Но отсутствие пригодного ответа проявится позже, когда зависимая работа уже должна быть готова.');
      story.push(room>=2?'Есть время обсудить запасной источник или меньший достаточный объём.':'Теперь приходится менять обещание получателю или переделывать готовый текст. Контроль фиксирует последствия, но почти не даёт времени повлиять.');
      visual={point:Number(s.point),dependency:Number(s.dependency),discovered,timely};
    }
    if(topic===3){
      const level=Number(s.level),experience=Number(s.experience),risk=Number(s.risk);
      const effectiveExperience=s.newTask?Math.min(1,experience):experience;
      const requests=[12,9,6,2,1][level];
      const unsupported=level>=3&&(!s.bounds||effectiveExperience<2||risk>=3);
      metrics=[metric('Вопросов к руководителю',requests,'за день'),metric('Рабочие границы',s.bounds?'названы':'не названы'),metric('Сложность','риск '+risk)];
      story.push(level===0?'Сегодня вы защитили качество, делая всё сами. Завтра команда снова будет ждать: самостоятельность не появляется без попытки.':level<3?'Появилась возможность предложить или согласовать решение. Если каждый типовой вопрос всё равно требует вашей подписи, очередь согласований сохранится.':'Обычные вопросы перестали ждать руководителя. Это освобождает время, но не отменяет границ для новых и рискованных случаев.');
      story.push(unsupported?'А теперь появляется нестандартный случай. Без подходящего навыка или ясного права на решение самостоятельность создаёт ошибки либо неформальные остановки.':'Поддержка соответствует этой задаче. Проверьте на следующем случае, какие решения сотрудник уже может принимать сам.');
      visual={level,unsupported,effectiveExperience,requests};
    }
    if(topic===4){
      const path=s.path||[];metrics=[metric('Что известно',['просьба','срок','личная связь','решение'][Math.min(path.length,3)])];
      story=path.length?[ethics[Math.min(path.length-1,2)].choices.find(c=>c.id===path[path.length-1])?.effect||'Сначала восстановите факты.']:['На просьбу знакомого легко отреагировать по личному отношению. Пока вы ещё не знаете, есть ли рабочее основание для исключения.'];
      visual={path};
    }
    if(topic===5){
      const parts=s.parts||[];const requestAt=parts.indexOf('request');const missing=['request','deadline'].filter(p=>!parts.includes(p));
      const channelFit=s.ambiguous?['call','meeting'].includes(s.channel):['email','chat'].includes(s.channel);
      metrics=[metric('Где просьба',requestAt<0?'не найдена':requestAt+1),metric('Что не хватает',missing.length?'действия или срока':'основа есть'),metric('Формат',channelFit?'подходит задаче':'стоит изменить')];
      story.push(missing.length?'Получатель узнал историю, но не может назвать, что должен сделать или когда ответить. Скорее всего, он попросит уточнение.':requestAt>1?'Просьба есть, но спрятана после контекста. При быстром чтении письмо легко принять за информацию, а не запрос на выбор.':'Получатель быстро видит действие и срок. Контекст ниже помогает принять решение, а не угадывать вашу просьбу.');
      if(s.tone==='pressure')story.push('Давление может вызвать быстрый ответ, но участник будет защищаться. Обоснование лучше связывать с рабочей потребностью, а не с угрозой.');
      if(s.extra)story.push('Шесть дополнительных фрагментов истории увеличивают чтение. Сохраните ссылку на детали, а в тексте оставьте то, без чего нельзя выбрать.');
      if(!channelFit)story.push(s.ambiguous?'В письменном обмене стороны продолжают защищать разные трактовки. Короткий диалог поможет выяснить их, после чего итог можно зафиксировать.':'Совещание или звонок дают живой контакт, но здесь отнимают время ради ясного типового выбора.');
      if(!parts.includes('context')&&!parts.includes('fact'))story.push('Действие названо, но без основания адресат не знает, почему выбирать нужно именно сейчас.');
      visual={parts,channelFit};
    }
    if(topic===6){
      const prepared=s.variants&&s.cost;const authorized=s.owner==='sponsor';const decision=authorized&&s.action==='options'&&prepared;
      metrics=[metric('Можно изменить приоритет',authorized?'да':'нет'),metric('Содержание запроса',prepared?'варианты и цена':'нужны основания'),metric('Эксперт',decision?'ресурс согласован':'занят другим делом')];
      story.push(s.action==='meeting'?'Встреча прояснила позиции. Но на следующий день эксперт всё ещё занят: участники не получили права снять его предыдущее поручение.':s.action==='pressure'?'Эксперт понял срочность, но другое обязательство не исчезло. Возможно, он даст обещание, которое физически не сможет выполнить.':!authorized?'Подготовленный запрос полезен, но адресат не вправе изменить конкурирующий приоритет. Найдите того, кому принадлежит этот выбор.':!prepared?'Адресат имеет нужное право, но не видит цену вариантов. Ему придётся заново выяснять последствия вместо решения.':'Спонсор выбрал вариант, потому что понимает последствия для обеих задач. Теперь обновите передачу данных и сообщите сторонам новые обязательства.');
      if(s.limited)story.push('У IT появилось второе внешнее обязательство. Вариант с полным объёмом нужно сравнить с поэтапным выпуском, а не обещать ещё один ресурс без проверки.');
      visual={authorized,decision,prepared};
    }
    if(topic===7){
      const chain=[true,true,s.version==='new',s.delivered,s.understood,s.executed,s.accepted];
      const first=chain.findIndex(v=>!v);
      metrics=[metric('Подписано','да'),metric('Действующая версия',s.version==='new'?'передана':'не у всех'),metric('Результат',first<0?'принят':'ещё не принят')];
      story.push(s.version==='old'?'Коллега выполнил действия по прежней инструкции. Подпись новой версии не изменила его способ работы, потому что версия не дошла.':!s.delivered?'Документ существует, но у исполнителя нет подтверждённого сообщения. «Отправлено» пока говорит только о действии отправителя.':!s.understood?'Получатель подтвердил чтение. Но он считает, что нужен черновик, а вы ждёте согласованный ответ: получение не равно пониманию.':!s.executed?'Ожидания уточнены, действие ещё впереди. Понимание не является подтверждением исполнения.':!s.accepted?'Ответ подготовлен. Пока получатель не проверил его пригодность, закрывать обязательство рано.':'Новая версия дошла, смысл понят, действие выполнено и результат принят. Теперь решение действительно работает.');
      visual={chain,first};
    }
    if(topic===8){
      const returned=Math.max(0,Number(s.returns)-(s.improvement==='input'?12:0));
      const minutes=Math.max(1,Number(s.minutes)-(s.improvement==='typing'?3:0));
      const capacity=Number(s.people)*Number(s.hours)*60/minutes;
      const load=Number(s.incoming)*(1+returned/100);
      const growth=Math.max(0,Math.round(load-capacity));
      const waiting=Math.max(0,Number(s.approvals)*1440-(s.improvement==='handoff'?720:0));
      metrics=[metric('Обработка',minutes,'мин'),metric('Ожидание',waiting,'мин'),metric('Рост очереди',growth,'в день'),metric('Возвраты',returned,'%')];
      story.push(waiting>minutes*20?'В этой цепочке основное время уходит не на работу, а на ожидание. Быстрее печатать полезно, но общий срок почти не изменится.':'Ожидание стало короче. Теперь проверьте, не перенесли ли ограничение на следующий этап.');
      if(growth>0)story.push(`В условном потоке ежедневно прибавляется около ${growth} необработанных запросов. Возвраты тоже потребляют мощность: команда работает, а очередь растёт.`);
      if(s.improvement==='input')story.push('Более понятный вход уменьшил повторную обработку. Но проверьте, не стало ли человеку слишком сложно подать запрос.');
      if(s.improvement==='handoff')story.push('Передача стала быстрее в этом примере. Прежде чем убирать проверку, выясните, какой риск она защищала.');
      visual={capacity,load,growth,waiting,returned,minutes};
    }
    if(topic===9){
      const needs={purpose:'meaning',skill:'training',access:'access',leader:'rules',convenience:'support'};
      const fit=s.help===needs[s.group];const supported=fit&&(s.group!=='leader'||s.leader);
      const active=supported?17:fit?8:5;
      metrics=[metric('Знают о запуске',20,'чел.'),metric('Действуют по-новому',active,'из 20'),metric('Барьер',supported?'снят в этой группе':'остался')];
      story.push(supported?'Участники смогли выполнить реальную операцию, а не только пройти инструктаж. Теперь проверьте, сохраняется ли практика на следующей неделе.':s.help==='training'&&s.group!=='skill'?'Инструкцию посмотрели ещё раз. Но причина была не в знании: доступ, смысл или привычный обход остались прежними.':s.group==='leader'?'Начальник продолжает принимать личные сообщения. Старый канал быстрее и получает поддержку, поэтому люди выбирают его рационально.':'Поддержка не попала в причину. Сначала выясните, что мешает именно этой группе, не угадывая её мотивы по активности.');
      visual={active,supported,group:s.group};
    }
    if(topic===10){
      const all=s.scope==='all';const minutes=all?26:12;const repeats=all?31:25;const visible=all?100:60;
      metrics=[metric('Средний ответ',minutes,'мин'),metric('Повторные обращения',repeats,'%'),metric('Видимые запросы',visible,'из 100'),metric('Не закрыты',s.open?18:'не включены')];
      story.push(!all?'На экране только 60 запросов новой системы. Остальные могли уйти в письма или вообще не дойти до отправки: видимая скорость ещё не описывает весь сервис.':'После добавления обходных каналов преимущество скорости стало меньше. Определение выборки изменило впечатление от цифры.');
      if(!s.open)story.push('Незакрытые заявки исключены из среднего. Самые долгие случаи поэтому не ухудшают показанную скорость.');
      story.push(s.conclusion==='success'?'Если сейчас сократить поддержку, можно усилить скрытую потерю доступа. Для такого вывода пока недостаточно одной метрики.':s.evidence==='feedback'?'Разговоры с теми, кто не завершил запрос, помогут проверить альтернативу: неудобство формы, исчезновение потребности или новый самостоятельный способ.':'Сомнение полезно, но нужен следующий факт: кто не дошёл, что ему помешало и был ли вопрос решён.');
      visual={minutes,repeats,visible,all};
    }
    return {metrics,story,visual};
  }
  const ethics=[
    {title:'Просьба знакомого',info:'Коллега, с которым вы дружите, просит провести его заявку вне очереди. Остальные ждут.',choices:[
      {id:'facts',text:'Сначала выяснить причину срочности',effect:'Вы ещё не обещали исключение. Появляется важный факт: у заявки есть внешний обязательный срок.'},
      {id:'friend',text:'Помочь, раз человек надёжный',effect:'Вопрос решается быстро для одного человека. Остальные замечают: очередь зависит от знакомства, а не понятного основания.'},
      {id:'equal',text:'Оставить всё строго по очереди',effect:'Порядок одинаков для всех. Но позже выясняется внешний срок: одинаковое решение при разных обстоятельствах может причинить лишний ущерб.'}]},
    {title:'Появился внешний срок',info:'Есть обязательный срок сегодня. Такое же правило срочности должно быть доступно любой заявке. Представитель поставщика — ваш близкий знакомый.',choices:[
      {id:'independent',text:'Применить общий критерий и передать оценку без личного влияния',effect:'Срочность объясняется правилом, а личная связь отделяется от выбора. Объективность защищена без обвинения человека.'},
      {id:'promise',text:'Самому ускорить, не обсуждая знакомство',effect:'Срок может быть соблюдён. Но участники не смогут отличить правило от личного влияния — доверие к процедуре уменьшится.'},
      {id:'accuse',text:'Остановить заявку из-за самой личной связи',effect:'Связь требует проверки влияния, а не автоматически доказывает нарушение. Клиент может потерять срок без установленного основания.'}]},
    {title:'Как объяснить очередь',info:'Вам нужно сообщить другим участникам причину изменения очереди. В материалах есть личные сведения заявителя.',choices:[
      {id:'criteria',text:'Объяснить критерий срочности без личных подробностей',effect:'Люди видят правило и возможность заявить похожее обстоятельство. Личные сведения остаются у тех, кому они нужны для решения.'},
      {id:'everything',text:'Разослать материалы целиком для прозрачности',effect:'Контекст стал полнее, но ненужные личные сведения вышли за круг рассмотрения. Прозрачность критерия не требовала такого раскрытия.'},
      {id:'silence',text:'Сообщить только, что решение принято',effect:'Сведения защищены, но очередность выглядит произвольной. Можно раскрыть основание и процедуру, не раскрывая личные детали.'}]}
  ];
  root.SituationsEngine={tasks,initial,evaluate,ethics};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.SituationsEngine;
})(typeof globalThis!=='undefined'?globalThis:window);
