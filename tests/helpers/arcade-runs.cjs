const ids=['hybrid','meeting','ethics','change','telephone','versions','metrics','flow','sprint','influence'];
const modules=Object.fromEntries(ids.map(id=>[id,require('../../assets/arcade/'+id+'.js')]));

// Real actions produce the saved terminal states used by backup and final-screen checks.
function finishedGame(id,seed='backup-'+id){
  const game=modules[id];let state=game.create(seed);
  const act=(type,value)=>{state=game.act(state,{type,value});};
  const note=()=>act('note','Проверяю факт, рабочий критерий и следующий шаг, прежде чем объяснять решение.');
  switch(id){
    case 'hybrid':act('run');act('run');break;
    case 'meeting':
      for(const [person,question] of [['it','constraint'],['finance','constraint'],['ops','fact'],['legal','constraint'],['owner','authority']]){act('person',person);act('ask',question);}
      act('owner','owner');act('commit');break;
    case 'ethics':
      for(const source of ['rule','deadline','connection','privacy'])act('inspect',source);
      act('allocation',state.variant?'a':'b');act('criterion','deadline');act('influence','independent');act('disclosure','criterion');note();act('decide');break;
    case 'change':
      act('observe');act('measure','example');for(let i=0;i<4;i++)act('round');break;
    case 'telephone':
      for(const channel of ['email','meeting','email','document','meeting']){act('channel',channel);act('send');}break;
    case 'versions':
      for(const source of ['signatures','dates','copy','receipt'])act('inspect',source);
      act('file','v3');act('breakpoint',state.variant?'understanding':'delivery');act('remedy',state.variant?'clarify':'deliver');note();act('resolve');break;
    case 'metrics':
      act('inspect','denominator');act('inspect','unfinished');act('channel','all');act('pending',true);act('conclusion','hypothesis');act('next','users');note();act('decide');break;
    case 'flow':for(let i=0;i<20;i++)act('tick');break;
    case 'sprint':for(let i=1;i<=3;i++){act('select','task-'+i);act('sprint');}break;
    case 'influence':
      for(const source of ['resource','information','authority','application']){
        act('observe',source);const observation=game.observations.find(o=>o.id===source);
        for(const field of ['from','to','kind'])act(field,observation[field]);act('edge');
      }
      for(const person of ['lead','it','anna','ops'])act('coalition',person);act('implement');break;
    default:throw new Error('Unknown game: '+id);
  }
  return state;
}
module.exports={ids,modules,finishedGame};
