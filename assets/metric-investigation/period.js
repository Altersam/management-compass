import {measurement,compatibility} from './measurement.js';
import {adaptGaming} from './gaming.js';
import {diagnosisQuality} from './diagnosis.js';
import {clamp,round,nativeMetric,nativeOutcome} from './metric.js';
export function firstRow(s){const {metric}=measurement(s),sc=s.scenario;return {period:0,reported:metric.removed?null:sc.baseline.real+sc.baseline.gaming*(1-metric.outcomeAlignment)*.55,real:sc.baseline.real,gaming:sc.baseline.gaming,damage:0,modeId:null,reportedNative:metric.removed?null:metric.anchor,outcomeNative:sc.outcome.now,text:'Новая система введена; это исходное наблюдение до следующего периода.'};}
export function simulatePeriod(s){
  const sc=s.scenario,{metric,guard}=measurement(s),previous=s.rows.at(-1),period=previous.period+1,adapt=adaptGaming(sc,metric,guard,previous,period),diagnosis=diagnosisQuality(s),fit=compatibility(sc,metric,guard);
  const effort=metric.removed?.5:metric.outcomeAlignment*metric.coverage*(7+diagnosis*3),loss=metric.removed?2:adapt.value/100*(7+metric.gameability*6)*sc.distortion.damage*(1+sc.distortion.downstream*.12),correction=adapt.detection*4.5;
  const delayed=metric.lag>0&&period<=metric.lag?.5:1,latent=previous.damage*(sc.distortion.latency?period>sc.distortion.latency?.55:.15:.35),inspectionCost=metric.removed?0:guard.falsePositiveRisk*2,real=clamp(previous.real+effort*delayed+correction-loss-latent-inspectionCost),damage=metric.removed?previous.damage*.6:(previous.damage*.55+(1-fit)*adapt.value/100*2.5);
  const reported=metric.removed?null:clamp(previous.reported+(real-previous.real)*metric.outcomeAlignment+4+(adapt.value-previous.gaming)*.35+adapt.value*(1-fit)*metric.gameability*.06);
  const baseline=s.rows[0].reported;return {period,reported:reported===null?null:round(reported),real:round(real),gaming:round(adapt.value),damage:round(damage,3),modeId:adapt.modeId,reportedNative:nativeMetric(metric,reported,baseline),outcomeNative:nativeOutcome(sc,real),text:adapt.text};
}
export const statusLabels={restored:'Метрика восстановлена',migrated:'Goodhart мигрировал',partial:'Частичная коррекция',confidence:'Ложная уверенность',lost:'Руль потерян'};
export function periodStatus(s){const first=s.rows[0],last=s.rows.at(-1),{metric}=measurement(s),gain=last.real-first.real;if(metric.removed)return 'lost';if(gain>=10&&last.gaming<35)return 'restored';if(metric.outcomeAlignment>=.65&&last.gaming>first.gaming+8)return 'migrated';if(gain>2)return 'partial';return 'confidence';}
