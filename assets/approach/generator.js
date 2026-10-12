import {domains} from './contexts.js';
export function hash(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function randomFrom(seed){let n=hash(seed);return ()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const round=n=>Math.round(n*100)/100;
export const newSeed=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+String(globalThis.performance?.now?.()||0);
export const identifier=seed=>hash(seed).toString(16).toUpperCase().padStart(8,'0').slice(-4);
export function generateProject(seed){
  const r=randomFrom(seed),d=domains[Math.floor(r()*domains.length)],jitter=(n,amp)=>round(clamp(n+(r()*2-1)*amp,.12,.97));
  const project={domain:d.id,domainName:d.name,title:d.titles[Math.floor(r()*d.titles.length)],description:d.note,weeks:Math.max(6,Math.round(d.weeks*(.85+r()*.3))),budget:Math.round(d.budget*(.85+r()*.3)),unknowns:jitter(d.signals[0],.18),volatility:jitter(d.signals[1],.2),defectCost:jitter(d.signals[2],.14),regulation:jitter(d.signals[3],.15),maturity:jitter(d.signals[4],.2),feedbackAccess:jitter(d.signals[5],.2)};
  const count=r()>.55?3:2,available=d.events.map((_,i)=>i),weeks=[];
  const events=Array.from({length:count},(_,i)=>{
    const index=available.splice(Math.floor(r()*available.length),1)[0];
    let week;do{week=2+Math.floor(r()*(project.weeks-3));}while(weeks.includes(week));weeks.push(week);
    const [title,text,kind]=d.events[index];return {id:d.id+'-'+index,week,title,text,kind,severity:round(.65+r()*.55)};
  }).sort((a,b)=>a.week-b.week);
  return {project,events};
}
