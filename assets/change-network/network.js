export const topologies=['hierarchy','distributed','two_camps','hub_and_spoke','fragmented','expert_network'];
export const topologyNames={hierarchy:'Иерархия',distributed:'Несколько центров',two_camps:'Два лагеря',hub_and_spoke:'Общий центр',fragmented:'Фрагменты с мостами',expert_network:'Профессиональная сеть'};
export function generateNetwork(count,topology,r,variant){
  const positions=Array.from({length:count},(_,i)=>{const angle=-Math.PI/2+i*Math.PI*2/count;return {x:400+Math.cos(angle)*285,y:285+Math.sin(angle)*195};});
  if(topology==='hub_and_spoke')positions[0]={x:400,y:285};
  if(topology==='hierarchy'){positions[0]={x:400,y:60};for(let i=1;i<count;i++){const row=i<3?1:2,number=row===1?i-1:i-3,total=row===1?2:count-3;positions[i]={x:100+number*600/Math.max(1,total-1),y:row===1?210:420};}}
  if(topology==='two_camps'||topology==='fragmented'){const split=Math.ceil(count/2);for(let i=0;i<count;i++){const camp=i<split?0:1,index=camp?i-split:i,total=camp?count-split:split,angle=-Math.PI/2+index*Math.PI*2/total;positions[i]={x:(camp?590:210)+Math.cos(angle)*120,y:280+Math.sin(angle)*170};}}
  const edges=[],used=new Set();
  const add=(from,to,type,weight)=>{if(from===to||used.has(from+'-'+to))return;used.add(from+'-'+to);edges.push({id:'edge-'+edges.length,from:'node-'+from,to:'node-'+to,type,weight,hidden:false});};
  if(topology==='hierarchy'){for(let i=1;i<count;i++)add(i<3?0:i%2?1:2,i,'formal',.75);}
  else if(topology==='hub_and_spoke'){for(let i=1;i<count;i++){add(0,i,i%2?'expert':'formal',.85);add(i,0,'dependency',.22);}}
  else if(topology==='two_camps'||topology==='fragmented'){
    const split=Math.ceil(count/2);for(let i=1;i<split;i++){add(0,i,'formal',.75);add(i,0,'informal',.3);}for(let i=split+1;i<count;i++){add(split,i,'formal',.75);add(i,split,'informal',.3);}add(split-1,split,'informal',topology==='two_camps'?.55:.25);add(split,split-1,'dependency',.3);
  }else {for(let i=0;i<count;i++){add(i,(i+1)%count,topology==='expert_network'?'expert':'formal',.55);add(i,(i+2)%count,'informal',.42);}}
  // A named peer connects centres. Strong directed outgoing influence need not be reciprocal.
  const hub=topology==='hierarchy'?count-1:topology==='hub_and_spoke'?0:variant===1?Math.ceil(count/2):count-1;
  for(let i=0;i<count;i++)if(i!==hub)add(hub,i,'informal',.62+r()*.16);
  const candidates=edges.filter(e=>e.type==='informal'&&e.from==='node-'+hub);
  if(candidates.length)candidates[Math.floor(r()*candidates.length)].hidden=true;
  if(variant===2&&candidates.length>1)candidates.find(e=>!e.hidden).hidden=true;
  const conflictFrom=topology==='two_camps'?0:1,conflictTo=topology==='two_camps'?Math.ceil(count/2):Math.min(3,count-1);add(conflictFrom,conflictTo,'conflict',.35);
  return {positions,edges,hub};
}
