export const movement=e=>['access','formal'].includes(e.type);
export function available(s,e,{known=true}={}){return (!known||s.knownEdges.includes(e.id))&&!s.closedEdges.includes(e.id)&&!(s.blocked[e.id]>s.turn)&&(!e.requiresGatekeeper||s.gates.includes(e.requiresGatekeeper));}
export function road(s,from,to,{known=true}={}){return s.scenario.edges.filter(e=>e.from===from&&e.to===to&&movement(e)&&available(s,e,{known})).sort((a,b)=>a.noiseCost-b.noiseCost)[0];}
export function shortest(s,{from='you',known=false,initial=false,formal=false,endorsed=false}={}){
  const queue=[[from]],visited=new Set([from]);while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===s.scenario.decider)return path;
    for(const e of s.scenario.edges.filter(e=>e.from===last&&movement(e)&&(!formal||e.type==='formal')&&(initial?e.open:available(s,e,{known}))&&(!endorsed||e.to!==s.scenario.decider||s.scenario.edges.some(push=>push.from===last&&push.to===e.to&&['trust','expert'].includes(push.type)))))if(!visited.has(e.to)){visited.add(e.to);queue.push([...path,e.to]);}
  }return null;
}
export function endorsers(s){return s.scenario.nodes.filter(n=>s.carriers[n.id]).flatMap(n=>s.scenario.edges.filter(e=>e.from===n.id&&e.to===s.scenario.decider&&['trust','expert'].includes(e.type)&&available(s,e)).map(e=>({id:n.id,name:n.name,type:e.type,push:e.strength*((s.attitudes[n.id]+1)/2)*(e.type==='expert'&&s.scenario.topicRelevant?1.15:1)})));}
export function decisionState(value){return value>=.6?'готов подписать':value>=.4?'склоняется':value>=.2?'готов обсуждать':value>=0?'сомневается':'не рассматривает';}
export function attitudeLabel(value){return value>=.6?'за':value>=.2?'скорее за':value>=-.1?'нейтрален':value>=-.5?'скептичен':'против';}
export function interestLabel(value){return value>=.75?'высокий':value>=.45?'средний':'низкий';}
export function noiseStage(s){return s.noise>=s.scenario.thresholds[1]+5?3:s.noise>=s.scenario.thresholds[1]?2:s.noise>=s.scenario.thresholds[0]?1:0;}
