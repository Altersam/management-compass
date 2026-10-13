import {clamp} from './metric.js';
export function measurement(s){const metric=s.scenario.metrics.find(m=>m.id===s.metricId),guard=s.scenario.guards.find(g=>g.id===s.guardId);return {metric,guard};}
export function guardDetection(sc,guard,mode){const covered=guard.detectsGamingModes.includes(mode.id);return clamp((covered?guard.sensitivity:guard.relatedModes.includes(mode.id)?guard.sensitivity*.55:.03)*(1-guard.falsePositiveRisk),0,1);}
export function compatibility(sc,metric,guard){const list=metric.possibleGamingModes.map(id=>sc.gamingModes.find(m=>m.id===id));return list.reduce((n,mode)=>n+guardDetection(sc,guard,mode),0)/list.length;}
export function designQuality(s){const {metric,guard}=measurement(s);return {main:metric.removed?0:metric.outcomeAlignment*metric.coverage,guard:metric.removed?0:compatibility(s.scenario,metric,guard)};}
