import {bestTool} from './barriers.js';
import {applyIntervention} from './interventions.js';
import {influenceFrames} from './influence.js';
import {metrics} from './adoption.js';
// A feasibility witness for the generator, never exposed as a recommended answer.
export function witnessScenario(scenario){
  const s={scenario,nodes:structuredClone(scenario.nodes),edges:scenario.edges.map(e=>({...e,revealed:!e.hidden})),actionsLeft:scenario.actionsPerWave,selected:scenario.hub,pilotNode:null,interventions:[],messages:[],wave:1};
  for(let wave=1;wave<=4;wave++){
    s.wave=wave;s.actionsLeft=scenario.actionsPerWave;
    if(wave===1){s.selected=scenario.hub;for(const id of ['diagnose',bestTool(s.nodes.find(n=>n.id===s.selected)),'champion'])applyIntervention(s,id);}
    let guard=0;while(s.actionsLeft>=2&&guard++<10){const n=[...s.nodes].filter(n=>!n.resolved).sort((a,b)=>b.influence-a.influence||a.adoption-b.adoption)[0];if(!n)break;s.selected=n.id;if(!n.barrierKnown)applyIntervention(s,'diagnose');applyIntervention(s,bestTool(n));}
    s.nodes=influenceFrames(s).map(f=>f.after);
  }
  for(let i=0;i<2;i++)s.nodes=influenceFrames(s,{withdrawn:true}).map(f=>f.after);
  const result=metrics(s.nodes,scenario.threshold);return {feasible:result.accepted>=Math.ceil(s.nodes.length*.6),accepted:result.accepted,touched:s.nodes.filter(n=>n.touched).length};
}
