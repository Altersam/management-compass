import {initial,clone,clamp,random,assertPlaying,record,button,select,summary,basicValid} from './common.js';
export const stations=[{id:'input',name:'Вход',capacity:4,cost:30},{id:'check',name:'Проверка',capacity:2,cost:40},{id:'process',name:'Обработка',capacity:4,cost:50},{id:'approval',name:'Согласование',capacity:3,cost:35}];
export const ticker={type:'tick',ms:1200};
export function create(seed='flow-1'){return {...initial(seed),queues:[[],[],[],[]],outside:[],done:[],people:[1,1,1,1],selected:'check',wip:12,checkEnabled:true,spent:0,budget:4000,nextId:1,errors:0,rework:0};}
export const inside=s=>s.queues.reduce((n,q)=>n+q.length,0);
export function act(state,a){assertPlaying(state);const s=clone(state);
  if(a.type==='station'){if(!stations.some(x=>x.id===a.value))throw new Error('Этап не найден.');s.selected=a.value;}
  else if(a.type==='wip'){if(![4,8,12,20].includes(Number(a.value)))throw new Error('Лимит не найден.');s.wip=Number(a.value);}
  else if(a.type==='check')s.checkEnabled=Boolean(a.value);
  else if(a.type==='upgrade'){const i=stations.findIndex(x=>x.id===s.selected);if(s.people[i]>=3||s.spent+80>s.budget)throw new Error('Ресурс нельзя добавить.');s.people[i]++;s.spent+=80;}
  else if(a.type==='tick'){
    s.turn++;s.spent+=stations.reduce((n,x,i)=>n+x.cost*s.people[i],0)-(s.checkEnabled?0:stations[1].cost*s.people[1]);
    for(let i=0;i<3;i++)s.outside.push({id:s.nextId++,born:s.turn,defect:random(s)<0.2,verified:false,returns:0});
    while(s.outside.length&&inside(s)<s.wip)s.queues[0].push(s.outside.shift());
    // Reverse processing prevents a request crossing every station in one tick.
    for(let stage=3;stage>=0;stage--){const cap=stage===1&&!s.checkEnabled?20:stations[stage].capacity*s.people[stage],work=s.queues[stage].splice(0,cap);
      for(const item of work){
        if(stage===1&&s.checkEnabled&&item.defect){item.defect=false;item.returns++;s.rework++;s.queues[0].push(item);continue;}
        if(stage===1&&s.checkEnabled)item.verified=true;
        if(stage===3){if(item.defect)s.errors++;s.done.push({...item,finished:s.turn});}else s.queues[stage+1].push(item);
      }
    }
    if(s.turn===20||s.spent>=s.budget)s.phase='ended';
  }else throw new Error('Действие не найдено.');record(s,a,a.type==='tick'?'Поток прошёл следующий интервал':'Условия потока изменены');return s;
}
export function validate(s){return basicValid(s)&&s.turn<=20&&Array.isArray(s.queues)&&s.queues.length===4&&s.queues.every(Array.isArray)&&Array.isArray(s.outside)&&Array.isArray(s.done)&&Array.isArray(s.people)&&s.people.length===4&&s.people.every(n=>Number.isInteger(n)&&n>=1&&n<=3)&&stations.some(x=>x.id===s.selected)&&[4,8,12,20].includes(s.wip)&&typeof s.checkEnabled==='boolean'&&Number.isFinite(s.spent)&&s.spent>=0&&s.budget===4000;}
export function render(s){return `<div class="flow-kpis"><span>Интервал ${s.turn}/20</span><span>Расход ${s.spent}/4000</span><span>Выдано ${s.done.length}</span><span>Незавершено ${inside(s)+s.outside.length}</span></div><p>По три новых запроса за интервал. Объекты двигаются по цепочке; возвраты снова занимают вход.</p><div class="flow-line">${stations.map((x,i)=>`<article class="flow-station ${s.selected===x.id?'selected':''}">${button('station',`<b>${x.name}</b><span>${s.people[i]} человек · мощность ${i===1&&!s.checkEnabled?'без проверки':x.capacity*s.people[i]}</span>`,`data-value="${x.id}" aria-pressed="${s.selected===x.id}"`)}<div class="request-dots" role="img" aria-label="Очередь ${x.name}: ${s.queues[i].length} заявок">${s.queues[i].slice(0,24).map(item=>`<i title="Заявка ${item.id}">${item.id}</i>`).join('')}</div><span>${s.queues[i].length} в очереди</span></article>`).join('')}</div><div class="flow-outside"><b>${s.outside.length} ещё не допущены в процесс</b><p>Ограничение WIP не уничтожает входящие обязательства: внешняя очередь остаётся видимой.</p></div><div class="arcade-form">${select('wip','Лимит одновременно начатых запросов',[[4,'4'],[8,'8'],[12,'12'],[20,'20']],s.wip)}<label class="check-row"><input type="checkbox" name="check" ${s.checkEnabled?'checked':''}> Сохранять проверку качества</label>${button('upgrade','Добавить человека на '+stations.find(x=>x.id===s.selected).name+' · 80 + дневной расход')}${button('tick','Следующий интервал','class="button primary"')}</div>`;}
export function report(s){const lead=s.done.length?s.done.reduce((n,x)=>n+x.finished-x.born+1,0)/s.done.length:0;return summary([['Выдано',s.done.length],['Ошибки',s.errors],['Полный срок закрытых',lead.toFixed(1)+' интервала'],['Незавершено',inside(s)+s.outside.length]],['В этой модели пропускную способность ограничивала проверка; усиление другого участка само по себе не сняло очередь.',s.checkEnabled?'Проверка занимала время, но перехватывала дефекты до выдачи.':'Удаление проверки ускорило видимый поток и пропустило дефекты к получателю.','Средний срок закрытых не описывает оставшееся незавершённое; внешняя очередь WIP тоже обязательство.']);}
