import {randomFrom} from '../sprint-goal/random.js';
export function task(seed,id,createdAt,{stage='outside',urgent=.2,typical=.5}={}){const r=randomFrom(seed+'#task#'+id);return {id:'F'+String(id).padStart(4,'0'),createdAt,age:0,priority:r()<urgent?'urgent':'normal',typical:r()<typical,reworkCount:0,currentStage:stage,blocked:false,completed:false,availableAt:0,lastMovedAt:-1,latentRisk:false};}
export function ageAll(s){for(const t of [...s.outside,...s.stages.flatMap(st=>st.queue)]){t.age=(s.tick-t.createdAt)/4;t.blocked=false;}}
