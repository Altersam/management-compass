import {round,shuffle} from './random.js';
export function generateBacklog(domain,r){
  const roles=['investment','strong','strong','window','support','support','investment','visible','visible'];
  const effects=[[0,.1,.18],[.3,.4,.12],[.55,.25,.45],[.2,.32,.35],[.1,.08,.2],[.08,.22,.12],[.04,.08,.08],[.01,0,0],[.01,0,0]];
  return shuffle(domain.tasks.map((name,i)=>({id:'task-'+(i+1),name,size:[4,6,6,6,3,3,3,3,4][i]+(r()>.75?1:0),kind:roles[i],effects:effects[i].map(v=>round(v*(.95+r()*.1))),targets:effects[i].flatMap((v,j)=>v>.05?[j]:[]),requires:i===1?'task-1':i===2?'task-2':null,availableSprint:i===2?2:1,window:i===3?1:null,investment:roles[i]==='investment'?1+Math.floor(r()*2):0,signal:roles[i]==='strong'||roles[i]==='window'?'Вероятно сильное':roles[i]==='support'?'Поддерживающее':roles[i]==='investment'?'Эффект прежде всего позже':'Вклад в цель не подтверждён',visible:roles[i]==='visible'})),r);
}
