import {barriers,interventions} from './barriers.js';
import {clamp} from '../sprint-goal/random.js';
import {stable} from './adoption.js';
const add=(n,k,delta)=>{n[k]=clamp(n[k]+delta,0,100);};
export function applyIntervention(s,id){
  const action=interventions[id],n=s.nodes.find(n=>n.id===s.selected);if(!action||!n)throw new Error('Вмешательство не найдено.');if(s.actionsLeft<action.cost)throw new Error('Действия волны закончились.');
  if(id==='diagnose'&&n.barrierKnown)throw new Error('Причина уже выяснена.');
  s.actionsLeft-=action.cost;const known=n.barrierKnown,used=n.uses[id]||0,diminish=1/(1+used*.55);let fit=barriers[n.barrier].tools.includes(id);n.uses[id]=used+1;
  let message='';
  if(id==='diagnose'){
    n.barrierKnown=true;add(n,'trust',4);add(n,'latentResistance',-2);for(const e of s.edges)if(e.from===n.id||e.to===n.id)e.revealed=true;message=`${n.name}: выяснилось — ${barriers[n.barrier].name.toLowerCase()}.`;
  }else{
    n.touched=true;
    if(id==='champion'){
      fit=stable(n,s.scenario.threshold);
      if(fit){n.champion=true;add(n,'support',8);message=`${n.name}: принятая практика получила проводника для соседних групп.`;}
      else {add(n,'trust',-9);add(n,'latentResistance',8);message=`${n.name}: назначение проводником не совпало с собственным принятием; доверие снизилось.`;}
    }else if(id==='pressure'){
      add(n,'compliance',24*diminish);add(n,'adoption',14*diminish);
      const ready=n.resolved&&n.trust>=60&&n.commitment>=55&&n.latentResistance<35;
      if(ready){add(n,'commitment',5*diminish);add(n,'fatigue',3);message=`${n.name}: короткий срок помог готовой группе завершить переход.`;}
      else {add(n,'commitment',-13);add(n,'trust',-10);add(n,'latentResistance',18);add(n,'fatigue',10);message=`${n.name}: контроль поднял формальное выполнение, но не снял барьер.`;}
    }else{
      const gain=(fit?24:6)*diminish;add(n,'support',gain*.7);add(n,'commitment',gain);add(n,'trust',(fit?10:2)*diminish);add(n,'latentResistance',-(fit?17:3)*diminish);add(n,'adoption',(fit?8:2)*diminish);
      if(id==='resource'){add(n,'capacity',34*diminish);add(n,'fatigue',-24*diminish);for(const e of s.edges.filter(e=>e.type==='conflict'&&e.from===n.id)){const other=s.nodes.find(x=>x.id===e.to);add(other,'latentResistance',4);}}
      if(id==='train'){add(n,'capability',(fit?34:5)*diminish);add(n,'fatigue',fit?6:15);if(n.barrier==='capacity'||n.barrier==='status'){add(n,'trust',-6);add(n,'latentResistance',9);}}
      if(id==='involve'){add(n,'capacity',-4);add(n,'trust',5*diminish);}
      if(id==='example'){add(n,'trust',10*diminish);}
      if(id==='pilot'){n.pilot=true;s.pilotNode=n.id;add(n,'capability',12*diminish);add(n,'fatigue',5);for(const other of s.nodes.filter(x=>x.id!==n.id))add(other,'latentResistance',2);}
      if(id==='process'){n.processModel=true;add(n,'capability',8*diminish);add(n,'capacity',-3);}
      if(fit){n.resolved=true;message=`${n.name}: вмешательство сняло часть реального барьера. Следующая волна покажет распространение.`;}
      else message=`${n.name}: инструмент дал ограниченный сдвиг; основной барьер мог остаться.`;
      if(used>=2){add(n,'fatigue',8);message=`${n.name}: повторное воздействие дало меньше эффекта и увеличило усталость.`;}
    }
  }
  s.interventions.push({wave:s.wave,node:n.id,action:id,fit,knownBefore:known,usedBefore:used});s.messages.push(message);return s;
}
