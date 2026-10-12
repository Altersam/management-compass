import {clamp,round} from './random.js';
export const reached=(criterion,value)=>criterion.higher?value>=criterion.target:value<=criterion.target;
export const achieved=(scenario,values)=>scenario.criteria.filter((c,i)=>reached(c,values[i])).length;
export function distanceProgress(c,value){return clamp((value-c.initial)/(c.target-c.initial));}
export function applyEffects(values,task,scenario,multiplier=1){
  return values.map((value,i)=>{const c=scenario.criteria[i],next=Math.max(0,value+(c.target-c.initial)*task.effects[i]*multiplier);return c.unit==='шт.'?Math.round(next):round(c.unit==='%'?Math.min(100,next):next);});
}
export function deteriorate(values,scenario,index){const next=[...values],c=scenario.criteria[index];next[index]=round(next[index]-(c.target-c.initial)*.05);if(c.unit==='шт.')next[index]=Math.ceil(next[index]);return next;}
