import {slotLabels} from './semantics.js';
import {channels} from './channels.js';
export function validateScenario(s){
  const errors=[],keys=Object.keys(slotLabels),ids=Object.keys(channels);
  if(keys.length<6||keys.length>8||keys.some(id=>!s.original[id]||!s.blurry[id]||!s.replacements[id]))errors.push('packet');
  if(s.critical.length<2||s.critical.some(id=>!keys.includes(id)))errors.push('critical');
  if(s.roles.length<5||ids.length<3)errors.push('route');
  if(s.events.length<1||s.events.length>2||s.events.some(e=>e.step<1||e.step>s.roles.length-2)||new Set(s.events.map(e=>e.step)).size!==s.events.length)errors.push('events');
  if(s.clarifications>=keys.length||s.resource>=2*(s.roles.length-1))errors.push('resource');
  const dominating=ids.some(a=>ids.filter(b=>b!==a).every(b=>channels[a].cost<=channels[b].cost&&keys.every(k=>channels[a].noise[k]<=channels[b].noise[k])));if(dominating)errors.push('dominant-channel');
  if(s.roles.some(role=>role.id!=='source'&&keys.some(k=>!Number.isFinite(role.bias[k])||role.bias[k]<0)))errors.push('role-filter');
  return {valid:!errors.length,errors};
}
