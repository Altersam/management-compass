import {barriers} from './barriers.js';
import {topologies} from './network.js';
export function validateScenario(s){
  const errors=[],ids=new Set(s.nodes.map(n=>n.id));
  if(s.nodes.length<6||s.nodes.length>10||ids.size!==s.nodes.length||!topologies.includes(s.topology))errors.push('network-size');
  if(s.nodes.some(n=>!barriers[n.barrier]))errors.push('barrier');
  if(new Set(s.nodes.map(n=>n.barrier)).size<2)errors.push('barrier-diversity');
  if(!s.nodes.some(n=>n.support>=65)||!s.nodes.some(n=>n.support<50)||!s.nodes.some(n=>n.influence>=4))errors.push('roles');
  if(s.edges.some(e=>!ids.has(e.from)||!ids.has(e.to)||e.from===e.to||!['formal','informal','expert','dependency','conflict'].includes(e.type)))errors.push('edge');
  const seen=new Set([s.nodes[0].id]);let changed=true;while(changed){changed=false;for(const e of s.edges)if(seen.has(e.from)||seen.has(e.to)){if(!seen.has(e.from)||!seen.has(e.to))changed=true;seen.add(e.from);seen.add(e.to);}}
  if(seen.size!==s.nodes.length)errors.push('orphan');
  if(!s.edges.some(e=>e.hidden)||s.edges.filter(e=>e.hidden).length>2)errors.push('hidden-links');
  if(!s.edges.some(e=>e.from===s.hub&&e.weight>.6)||s.waves!==4||s.actionsPerWave<3||s.actionsPerWave>5)errors.push('strategy');
  if(s.templateId==='merge'&&(s.topology!=='two_camps'||!s.nodes.some(n=>n.barrier==='status')||!s.edges.some(e=>e.from!==e.to)))errors.push('merge-invariant');
  return {valid:!errors.length,errors};
}
