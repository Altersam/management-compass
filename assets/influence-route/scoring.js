import {shortest,endorsers,noiseStage} from './navigation.js';
export function score(s,kind){
  const best=shortest(s,{initial:true,endorsed:true}),moves=s.routeHistory.filter(h=>h.kind==='move').length,ideal=best?best.length-1:3;
  const push=s.decider.accumulatedPush,components={route:30*Math.min(1,ideal/Math.max(ideal,moves+s.officialRequests*2)),endorsement:20*Math.min(1,push/.65),quiet:15*(1-Math.min(1,s.noise/(s.scenario.thresholds[1]+5))),capital:15*s.politicalCapital/5,time:10*s.turnsLeft/s.scenario.turns,map:10*Math.max(0,1-s.ghostAttempts/3)};
  let quality=Object.values(components).reduce((a,b)=>a+b,0)-s.opponent.actionsTaken.filter(a=>a.edge).length*5-s.opponent.neutralized.length*2-s.officialRequests*3;
  if(kind!=='success')quality=Math.min(39,quality*.5);quality=Math.max(0,Math.min(100,Math.round(quality)));
  return {kind,quality,grade:quality>=86?'A':quality>=72?'B':quality>=56?'C':quality>=40?'D':'F',components,bestRoute:best,known:s.knownEdges.length,total:s.scenario.edges.length,endorserNames:endorsers(s).map(e=>e.name),noiseStage:noiseStage(s)};
}
