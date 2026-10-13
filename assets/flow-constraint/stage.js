import {crowdingFactor} from './wip.js';
export function capacity(s,st){const absent=s.eventEffect?.id==='absence'&&s.tick>=s.eventEffect.from&&s.tick<=s.eventEffect.to&&s.eventEffect.stageId===st.id?2:0;return Math.max(1,st.currentCapacity-absent)*crowdingFactor(s);}
export function nextActive(s,index){for(let i=index+1;i<s.stages.length;i++)if(!s.stages[i].removed)return s.stages[i];return null;}
export function observedState(st){if(st.removed)return 'Пропущен';if(st.last.policyBlocked)return 'Блокирован правилом';if(st.last.blocked)return 'Блокирован';if(!st.queue.length&&st.last.processed===0)return 'Голоден';if(st.queue.length>st.last.before)return 'Очередь растёт';return 'Работает';}
