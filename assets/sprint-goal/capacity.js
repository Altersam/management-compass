import {round} from './random.js';
export const wipProfiles={1:{factor:.92,title:'Фокус',text:'Одна задача за другой. Меньше переключений, но отдельные специалисты могут ждать.'},2:{factor:1,title:'Сбалансированный поток',text:'Две задачи одновременно: умеренная параллельность и небольшие переключения.'},3:{factor:.87,title:'Турбулентность',text:'Больше параллели, меньше мощности на каждую задачу; выше риск хвоста.'},4:{factor:.72,title:'Перегруз',text:'Команда выглядит занятой, но переключения уменьшают завершённость. События сбивают сильнее.'}};
export function estimatedCapacity(s){return s.scenario.capacity+(s.sprint===2?s.investment+s.scenario.transition.capacityDelta:0)-s.cancellationCost;}
export function remaining(s,id){const t=s.tasks.find(t=>t.id===id);return Math.max(0,t.size-(s.progress[id]||0));}
export const load=s=>round(s.selected.reduce((n,id)=>n+remaining(s,id),0));
export const tailLoad=s=>round(s.tail.filter(id=>s.selected.includes(id)).reduce((n,id)=>n+remaining(s,id),0));
export function startCapacity(s){return round(Math.max(8,(estimatedCapacity(s)+s.cancellationCost)*s.scenario.actualFactors[s.sprint-1]*wipProfiles[s.wip].factor-s.cancellationCost));}
export function activeTasks(s){return s.selected.filter(id=>!s.done.includes(id)).slice(0,s.wip);}
