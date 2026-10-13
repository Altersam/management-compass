import {templates} from './templates.js';
import {decisionProfiles} from './principles.js';
import {generateDocuments} from './documents.js';
import {mitigations} from './mitigations.js';
import {validateScenario} from './validator.js';
import {randomFrom,shuffle} from '../sprint-goal/random.js';
const names=['Анна','Ирина','Ольга','Марина','Денис','Павел','Алексей','Роман','Вера','Олег','Наталья','Сергей'];
const futureImpacts={bonus:['negative','positive'],director:['mixed','negative'],supplier:['negative','positive'],grant:['mixed','negative'],promotion:['mixed','positive'],reduction:['negative','positive'],training:['mixed','positive'],discipline:['mixed','negative'],delivery:['negative','mixed'],authorship:['positive','positive'],complaint:['mixed','positive'],deadline:['positive','mixed'],equipment:['positive','negative'],curriculum:['mixed','mixed'],'ai-work':['mixed','mixed'],'department-budget':['mixed','mixed'],launch:['negative','mixed'],'connected-hire':['mixed','positive'],overtime:['mixed','negative'],'weak-unit':['mixed','mixed'],teacher:['mixed','mixed'],data:['negative','mixed'],reference:['mixed','positive'],sponsor:['mixed','positive']};
export function generateScenario(seed){
  const choose=randomFrom(seed),template=templates[Math.floor(choose()*templates.length)],variant=Math.floor(choose()*3);
  for(let attempt=0;attempt<20;attempt++){
    const r=randomFrom(seed+'#'+attempt),picked=shuffle(names,r),params={a:picked[0],b:picked[1],authors:picked.slice(2,6),amount:(3+Math.floor(r()*18))*50000,pct:105+Math.floor(r()*36),day:15+Math.floor(r()*10),month:['марта','апреля','мая','июня'][Math.floor(r()*4)]};
    const format=text=>String(text).replace(/\{(a|b|amount|pct)\}/g,(_,key)=>key==='amount'?params.amount.toLocaleString('ru-RU'):String(params[key])).replace(params.a+' выполнил',params.a+': выполнено');
    const risks=['procedure','fairness','performance','uncertainty'];
    const options=shuffle(template.options.map(([name,plus,minus],i)=>({id:'option_'+['a','b','c','d'][i],name,plus,minus,risk:risks[i],profile:{...decisionProfiles[i]},longTerm:[`Первоначальный быстрый результат сохранил часть пользы, но потребовал объяснять последствия другим участникам.`,`Поддержка участников стала устойчивее, но цена меньшего немедленного результата осталась.`,`Проверяемая процедура создала прецедент для следующих случаев; цена задержки не была нулевой.`,`Промежуточные данные позволили уточнить условия. Контроль и временный статус остались отдельной нагрузкой.`][i]})),r);
    const futureIndex=Math.floor(r()*template.future.length),impact=futureImpacts[template.id][futureIndex];
    const scenario={templateId:template.id,title:template.title,domain:template.domain,variation:variant,variationText:format(template.variations[variant]),context:format(template.context),decisionDate:`${params.day} ${params.month}`,archetypes:[...template.archetypes],checks:2+Math.floor(r()*3),documents:shuffle(generateDocuments(template,variant,params,r,format),r),options,mitigations:structuredClone(mitigations),future:{id:'future-'+futureIndex,text:template.future[futureIndex],impact,favourable:impact==='positive',unavailableAtDecision:true},generationAttempt:attempt};
    if(validateScenario(scenario).valid)return scenario;
  }throw new Error('Не удалось собрать непротиворечивое этическое дело.');
}
