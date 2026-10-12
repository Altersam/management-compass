import {archetypes} from './archetypes.js';
import {mean,round} from './pilot.js';
import {validateCase} from './case-validator.js';
export function seedHash(seed){let h=2166136261;for(const char of String(seed))h=Math.imul(h^char.charCodeAt(0),16777619);return h>>>0;}
function rng(seed){let n=seedHash(seed);return ()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(r,items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const names=['Обычный запрос','Запрос с расчётом','Новый получатель','Повторное обращение','Сведения двух групп','Срочный запрос','Рабочий пример','Сложный случай'];
export function generateCasebook(seed){
  const choose=rng(seed),archetype=archetypes[Math.floor(choose()*archetypes.length)];
  for(let attempt=0;attempt<30;attempt++){
    const r=rng(seed+'#'+attempt),between=(a,b)=>round(a+r()*(b-a)),n=5+Math.floor(r()*4);
    const cases=Array.from({length:n},(_,i)=>{
      const events=[
        {stage:'request',type:'admin',duration:between(.12,.25)},
        {stage:'register',type:'admin',duration:between(.25,.5)},
        {stage:'decision',type:'admin',duration:between(.15,.3)},
        {stage:'execute',type:'work',duration:between(1.4,2.1)},
        {stage:'approve',type:'admin',duration:between(.15,.35)},
        {stage:'dispatch',type:'admin',duration:between(.12,.3)},
        {stage:'receive',type:'admin',duration:between(.1,.2)}
      ];
      if(i<Math.ceil(n*.7)||r()>.4){
        const duration=between(...archetype.generator.range),stage=archetype.trueStage;
        if(archetype.generator.mechanism==='wait')events.splice(events.findIndex(e=>e.stage===stage),0,{stage,type:'wait',duration,cause:archetype.id});
        else events.splice(-1,0,{stage:'receive',type:'rework',duration:round(duration*.3),cause:archetype.id},{stage:'execute',type:'rework',duration:round(duration*.7),cause:archetype.id});
      }
      events.splice(3,0,{stage:'execute',type:'wait',duration:between(.35,.7)});
      if(i<2)events.splice(-1,0,{stage:'dispatch',type:'rework',duration:between(.15,.35)});
      return {id:'case-'+(i+1),name:names[i],events:events.map((e,j)=>({...e,id:'event-'+j}))};
    });
    const reportedCycle=round(cases.reduce((v,c)=>v+c.events.filter(e=>e.type==='work').reduce((s,e)=>s+e.duration,0),0)/n);
    const sourceInfo=[['chronology','Хронология дел','Отметки времени и последовательность событий',2],['interview','Интервью команды','Как участники принимают и передают работу',2],['metric','Методика отчёта','Границы измерения и состав показателя',2],['calendar','Рабочий журнал','Отметки начала и окончания подготовки',2],['registration','Журнал регистрации','Как запрос поступает в систему',2],['documents','Выборка документов','Какие исправления встречались в ответах',3]];
    const texts=[...archetype.keyEvidence,...archetype.neutralEvidence,...archetype.decoys];
    const sources=shuffle(r,sourceInfo.map(([id,name,description,cost],i)=>({id,name,description,cost,facts:[{
      id:id+'-fact',source:id,text:texts[i],kind:i<2?'key':i<4?'neutral':'decoy',
      refCase:i<2?cases[i].id:i===4?cases[0].id:i===5?cases[1].id:null,
      refEvent:i<2?cases[i].events.find(e=>e.cause===archetype.id)?.id:i===4?cases[0].events.find(e=>e.stage==='register').id:i===5?cases[1].events.find(e=>e.stage==='dispatch'&&e.type==='rework')?.id:null
    }]})));
    const interventions=shuffle(r,[...archetype.effectiveInterventions,'priority','automate_registration','faster_work','change_metric']);
    const budget=sources.reduce((v,s)=>v+s.cost,0)-(1+Math.floor(r()*3));
    const book={seed:String(seed),generatorVersion:2,archetype,cases,sources,interventions,budget,reportedCycle,realCycle:mean(cases),generationAttempt:attempt};
    if(validateCase(book).valid)return book;
  }
  throw new Error('Не удалось собрать проверяемое дело.');
}
export const newSeed=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);
export const caseIdentifier=seed=>seedHash(seed).toString(16).toUpperCase().padStart(8,'0').slice(-4);
