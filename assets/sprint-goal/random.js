export function hash(seed){let n=2166136261;for(const c of String(seed))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function randomFrom(seed){let n=hash(seed);return ()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export const round=n=>Math.round(n*100)/100;
export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function shuffle(items,r){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export const newSeed=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+String(globalThis.performance?.now?.()||0);
export const identifier=seed=>hash(seed).toString(16).toUpperCase().padStart(8,'0').slice(-4);
