export const round=(n,d=1)=>Math.round(n*10**d)/10**d;
export const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
export function weightedMean(groups){const total=groups.reduce((n,g)=>n+g.count,0);return round(groups.reduce((n,g)=>n+g.count*g.value,0)/total);}
export function headline(sc){const h=sc.headline,change=(h.after-h.before)/h.before*100;return {...h,change:round(change),positive:h.direction==='up'?change>0:change<0};}
export function nativeMetric(metric,index,baseline){if(metric.removed)return null;const shift=index-baseline,sign=metric.direction==='down'?-1:1;const value=metric.anchor*(1+sign*shift/150);return round(clamp(value,0,metric.unit==='%'?100:metric.unit==='балла'?5:Infinity));}
export function nativeOutcome(sc,index){const sign=sc.outcome.direction==='down'?-1:1,shift=index-sc.baseline.real;if(sc.outcome.unit==='%'&&sign===1)return round(clamp(sc.outcome.now+(shift>=0?(100-sc.outcome.now)*shift/(100-sc.baseline.real):sc.outcome.now*shift/sc.baseline.real)));return round(clamp(sc.outcome.now*(1+sign*shift/140),0,sc.outcome.unit==='%'?100:Infinity));}
