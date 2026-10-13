import {templates} from './templates.js';
import {randomFrom} from '../sprint-goal/random.js';
import {processModel} from './process.js';
import {profile} from './distortion.js';
import {round,weightedMean} from './metric.js';
const shuffle=(list,r)=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function generateScenario(seed){
  const r=randomFrom(seed),t=templates[Math.floor(r()*templates.length)],variation=Math.floor(r()*3),process=processModel(t,variation),format=text=>text.replace(/\{(total|excluded|pending|bad|counted|fast|slow)\}/g,(_,key)=>String(process[key]));
  if(t.id==='support')process.bad=[12,15,18][variation];
  const [headlineTitle,before,after,unit,direction]=t.headline,[outcomeTitle,outcomeBefore,outcomeNow,outcomeUnit,outcomeDirection]=t.outcome;
  const sc={templateId:t.id,title:t.title,variationId:variation,variationText:['Обычный поток и новая премия за показатель.','Сложные случаи сосредоточены в отдельном контуре; проверка результата запаздывает.','Усиленный план показателя, другой состав наблюдаемых случаев.'][variation],input:t.input,stage:t.stage,process,headline:{title:headlineTitle,before:round(before),after:round(after*(1+(variation-1)*.015)),unit,direction},outcome:{title:outcomeTitle,before:outcomeBefore,now:outcomeNow,unit:outcomeUnit,direction:outcomeDirection},patterns:[...t.patterns],root:t.root,secondary:t.secondary,context:t.context[variation%2],staff:t.staff,decoy:t.decoys[variation%2],distortion:profile(t),baseline:{real:46+variation*2,gaming:32+variation*5},layers:t.layers.map(([title,text,effect],i)=>({id:'layer-'+i,title,text:format(text),effect})),distribution:[],gamingModes:[],metrics:[],guards:[]};
  sc.process.boundaryMode=['support','sales','education','nps','university','logistics','clinic','legal','grants','uptime'].includes(t.id)?'excluded':'reinterpreted';
  if(t.id==='support')sc.headline.after=weightedMean(process.groups.filter(g=>g.included));
  else sc.headline.after=round(before+(after-before)*(1+(variation-1)*.06));
  if(sc.headline.unit==='%')sc.headline.after=Math.min(99.99,sc.headline.after);
  if(t.id==='support')sc.distribution=process.groups.map(g=>({...g,unit:'мин.'}));
  else sc.distribution=[{id:'typical',count:process.counted,label:'Остальная группа исследуемой когорты',value:null,included:true,unit:''},{id:'hidden',count:process.excluded,label:sc.layers[0].title,value:null,included:sc.process.boundaryMode!=='excluded',unit:''}];
  sc.caseCards=t.cards.map((text,i)=>({id:t.id+'-'+(1800+variation*100+i),title:t.unit+' #'+(1800+variation*100+i),lines:text.split('|'),group:i===0?'excluded':i===1?'bad':i===2?'pending':'counted'}));sc.caseCards=shuffle(sc.caseCards,r).slice(0,3);sc.cardPool=t.cards.map((text,i)=>({id:t.id+'-'+(1800+variation*100+i),title:t.unit+' #'+(1800+variation*100+i),lines:text.split('|'),group:i===0?'excluded':i===1?'bad':i===2?'pending':'counted'}));
  sc.context=format(sc.context);
  if(t.id==='support')sc.context=sc.context.replace('быстрых по 12 минут','быстрых со средним 12 минут').replace('сложных по 50 минут','сложных со средним 50 минут');
  const facts=[sc.layers[0].text,t.outcome[0]+': '+outcomeBefore+' → '+outcomeNow+' '+outcomeUnit+'. '+sc.layers[1].text,sc.context,sc.staff,sc.decoy];
  sc.probes=shuffle([
    {id:'scope',title:t.checks[0],cost:1,source:'Реестр и правило расчёта',role:'key',reveals:['layer-0'],exhibits:['scope'],evidenceFor:['root'],evidenceAgainst:['success'],fact:facts[0]},
    {id:'result',title:t.checks[1],cost:1,source:'Независимый результат получателя',role:'key',reveals:['layer-1'],exhibits:['outcome'],evidenceFor:['outcome','secondary'],evidenceAgainst:['success'],fact:facts[1]},
    {id:'cases',title:'Открыть три реальных случая',cost:1,source:'Первичные записи случаев',role:'key',reveals:['layer-0'],exhibits:['cards'],evidenceFor:['root','secondary'],evidenceAgainst:['success'],fact:'Выборка из трёх записей. Она показывает механизм, но не оценивает его распространённость во всём потоке.'},
    {id:'context',title:t.checks[2],cost:1,source:'Сопоставимый срез процесса',role:'support',reveals:['layer-2'],exhibits:['context','distribution'],evidenceFor:['secondary'],evidenceAgainst:[],fact:facts[2]},
    {id:'staff',title:t.checks[3],cost:1,source:'Разговор с участником процесса',role:'support',reveals:['layer-0'],exhibits:['staff'],evidenceFor:['root'],evidenceAgainst:[],fact:facts[3]},
    {id:'comparison',title:t.checks[4+variation%2],cost:1,source:'Сопоставление условий работы',role:'decoy',reveals:[],exhibits:['decoy'],evidenceFor:['contextOnly'],evidenceAgainst:[],fact:facts[4]}
  ],r);
  sc.diagnoses=shuffle([{id:'cause',title:t.root,kind:'root'},{id:'effect',title:t.secondary,kind:'secondary'},{id:'partial',title:t.partial,kind:'partial'},{id:'other',title:'Основная причина — '+t.checks[4+variation%2].replace(/^(Сравнить|Проверить|Посчитать) /,'').toLowerCase()+'.',kind:'wrong'},{id:'success',title:'Рост отчётного показателя означает, что реальный результат улучшился.',kind:'wrong'}],r);
  const modeIds=[...t.modes,t.id+'_alternative'],secondaryText=t.behaviour[1];sc.gamingModes=modeIds.map((id,i)=>({id,ease:[.6,.48,.68][i]+r()*.08,payoff:[.9,.65,.75][i],text:i<2?t.behaviour[i]:'Новый обход альтернативного показателя: '+secondaryText,detected:i<2?t.behaviour[i]+' Случай возвращён в границу контроля.':'Независимое наблюдение не принимает формальное выполнение вместо результата.'}));
  const old={id:'previous',title:headlineTitle,description:'Сохранить исходное правило расчёта и прежнюю границу процесса.',outcomeAlignment:.18,gameability:.88,lag:0,coverage:process.counted/100,possibleGamingModes:[modeIds[0]],anchor:sc.headline.after,unit,direction};
  const altIsTime=/^Время/.test(t.measures[1]),altIsCost=/стоимость/i.test(t.measures[1]),altUnit=altIsTime?'дней':altIsCost?'тыс. ₽':'%',altDirection=altIsTime||altIsCost?'down':'up';
  sc.metrics=shuffle([old,{id:'resultMeasure',title:t.measures[0],description:'Описывать результат всего исходного потока; требовать подтверждения получателя.',outcomeAlignment:.92,gameability:.34+r()*.04,lag:t.lag,coverage:.98,possibleGamingModes:[modeIds[0],modeIds[1]],anchor:outcomeNow,unit:outcomeUnit,direction:outcomeDirection},
    {id:'alternative',title:t.measures[1],description:t.measures[2],outcomeAlignment:t.altAlignment+(variation-1)*.025,gameability:.4,lag:Math.max(0,t.lag-1),coverage:.9,possibleGamingModes:[modeIds[1],modeIds[2]],anchor:altIsTime?30:altIsCost?120:65,unit:altUnit,direction:altDirection},
    {...old,id:'target',title:'Усилить план: '+headlineTitle.toLowerCase(),description:'Поднять требование к исходному показателю и премировать за превышение.',outcomeAlignment:.1,gameability:.99,coverage:old.coverage,possibleGamingModes:[modeIds[0],modeIds[1]]},
    {...old,id:'remove',title:'Отказаться от измерения результата',description:'Снять числовой сигнал, не вводя наблюдаемой замены.',removed:true,outcomeAlignment:0,gameability:0,coverage:0}
  ],r);
  sc.guards=shuffle([{id:'integrity',title:t.guards[0],description:'Отдельная проверка способа получения результата; это сигнал для разбора, а не цель для максимизации.',detectsGamingModes:[modeIds[0],modeIds[1]],relatedModes:[],sensitivity:.94,falsePositiveRisk:.035},
    {id:'independent',title:t.guards[1],description:'Сверять независимый следующий этап, полноту потока или устойчивость результата.',detectsGamingModes:[modeIds[1],modeIds[2]],relatedModes:[modeIds[0]],sensitivity:.91,falsePositiveRisk:.04},
    {id:'activity',title:t.guards[2],description:'Использовать объём действий как дополнительное наблюдение.',detectsGamingModes:[],relatedModes:[],sensitivity:.15,falsePositiveRisk:.08}
  ],r);
  sc.metrics.find(m=>m.id==='resultMeasure').possibleGamingModes=[modeIds[0]];
  sc.guards.find(g=>g.id==='integrity').detectsGamingModes=[modeIds[0]];
  if(t.id==='development')sc.guards.find(g=>g.id==='integrity').title='Мутационный скор и независимый реестр production-дефектов';
  // Every shown sample contains two mechanism-bearing records and one contrasting record.
  sc.caseCards=[sc.cardPool[0],sc.cardPool[1+variation%2],sc.cardPool[3+variation%3]];
  return sc;
}
