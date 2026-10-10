import {stages,scenarios} from './data.js';
// Eight working hours are one day in this model. No calendar time is mixed into the report.
export const hoursPerDay=8;
export const sum=(items,key)=>items.reduce((n,item)=>n+(item[key]||0),0);
const round=value=>Math.round(value*100)/100;
function seedNumber(seed){let n=2166136261;for(const char of String(seed))n=Math.imul(n^char.charCodeAt(0),16777619);return n>>>0;}
function next(rng){rng.n=(rng.n+0x6D2B79F5)>>>0;let t=rng.n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
export function createCasebook(seed='case-01'){
  const rng={n:seedNumber(seed)},known={'case-01':0,'case-02':1,'case-03':2};
  const scenario=scenarios[Object.hasOwn(known,String(seed))?known[String(seed)]:Math.floor(next(rng)*scenarios.length)];
  const cases=Array.from({length:5},(_,i)=>{
    const complex=![0,3].includes(i),jitter=Math.floor(next(rng)*5)/4;
    const flow=stages.map((stage,index)=>({stage:stage.id,work:[0.25,0.5,0.5,3,1,0.25,0.25][index],wait:[0,1,2,1,6+jitter,0.5,1][index],rework:0}));
    const fault={input:0,permission:0,version:0};
    if(complex){
      const strength=1+i*0.15+jitter*0.2;
      if(scenario.id==='intake'){fault.input=round(28*strength);flow[1].wait+=fault.input;flow[1].rework=2+i*0.5;}
      if(scenario.id==='authority'){fault.permission=round(38*strength);flow[2].wait+=fault.permission;}
      if(scenario.id==='version'){fault.version=round(26*strength);flow[3].wait+=fault.version;flow[3].rework=7+i;flow[6].wait+=6;}
    }
    return {id:'case-'+(i+1),name:['Обычный запрос','Запрос с расчётом','Ответ с исключением','Повторный типовой случай','Сведения двух групп'][i],complex,flow,fault,included:!complex,firstUsable:!(complex&&scenario.id==='version'),usedVersion:complex&&scenario.id==='version'?1:2,inputComplete:!(complex&&scenario.id==='intake'),returns:complex&&scenario.id!=='authority'?2:0};
  });
  return {seed:String(seed),scenario,cases};
}
export function trace(item){
  let cursor=0;
  return item.flow.map(segment=>{const start=cursor;cursor+=segment.wait+segment.work+segment.rework;return {...segment,start:round(start),end:round(cursor)};});
}
export function metrics(cases){
  const totals=cases.map(item=>sum(item.flow,'work')+sum(item.flow,'wait')+sum(item.flow,'rework'));
  const included=cases.filter(item=>item.included);
  // Published metric starts at the decision stage and ends on dispatch. Complex cases are outside it.
  const reported=included.map(item=>sum(item.flow.slice(2,6),'work')+sum(item.flow.slice(2,6),'wait')+sum(item.flow.slice(2,6),'rework'));
  const byStage=Object.fromEntries(stages.map(stage=>[stage.id,{
    work:round(sum(cases.map(item=>item.flow.find(s=>s.stage===stage.id)),'work')/cases.length),
    wait:round(sum(cases.map(item=>item.flow.find(s=>s.stage===stage.id)),'wait')/cases.length),
    rework:round(sum(cases.map(item=>item.flow.find(s=>s.stage===stage.id)),'rework')/cases.length)
  }]));
  return {days:round(totals.reduce((n,v)=>n+v,0)/cases.length/hoursPerDay),reportedDays:round(reported.reduce((n,v)=>n+v,0)/reported.length/hoursPerDay),work:round(cases.reduce((n,item)=>n+sum(item.flow,'work'),0)/cases.length),wait:round(cases.reduce((n,item)=>n+sum(item.flow,'wait'),0)/cases.length),rework:round(cases.reduce((n,item)=>n+sum(item.flow,'rework'),0)/cases.length),usable:cases.filter(item=>item.firstUsable).length,returns:sum(cases,'returns'),included:included.length,total:cases.length,byStage};
}
export function pilotCases(book,intervention){
  return book.cases.map(item=>{
    const next=structuredClone(item);
    if(intervention==='input'){
      next.flow[1].work+=1;
      if(next.fault.input){next.flow[1].wait-=next.fault.input*0.85;next.flow[1].rework*=0.25;next.returns=1;next.inputComplete=true;}
    }else if(intervention==='bounds'){
      next.flow[2].work+=0.5;next.flow[4].work+=0.25;
      if(next.fault.permission)next.flow[2].wait-=next.fault.permission*0.8;
    }else if(intervention==='version'){
      next.flow[3].work+=0.75;next.flow[6].work+=0.5;
      if(next.fault.version){next.flow[3].wait-=next.fault.version*0.8;next.flow[3].rework*=0.15;next.flow[6].wait-=5;next.returns=1;next.firstUsable=true;next.usedVersion=2;}
    }
    return next;
  });
}
export function compare(book,intervention){
  const afterCases=pilotCases(book,intervention),before=metrics(book.cases),after=metrics(afterCases);
  return {before,after,daysSaved:round(before.days-after.days),cases:book.cases.map((item,i)=>({id:item.id,before:round(trace(item).at(-1).end/hoursPerDay),after:round(trace(afterCases[i]).at(-1).end/hoursPerDay),usableBefore:item.firstUsable,usableAfter:afterCases[i].firstUsable}))};
}
