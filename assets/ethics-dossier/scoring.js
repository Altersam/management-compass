import {issueLabels} from './documents.js';
import {principles} from './principles.js';
import {protectionFor} from './mitigations.js';
const clamp=n=>Math.max(0,Math.min(1,n));
export function documentVerdict(s,doc){
  const checked=s.documents[doc.id].checked;
  if(!checked)return {id:doc.id,status:'○ не проверен',quality:.48,why:'В момент решения источник не прошёл доступную проверку.'};
  const quality={NONE:.98,BIAS:.9,INCOMPLETE:.62,CONTEXT_MISSING:.65,CHERRY_PICKING:.55,OUTDATED:.2,PROCEDURAL:.15,HEARSAY:.25,CONFLICT:.25}[doc.issue];
  const conflictResolved=doc.issue==='CONFLICT'&&doc.conflictsWith.some(id=>s.documents[id]?.checked);
  return {id:doc.id,status:issueLabels[doc.issue],quality:conflictResolved?.15:quality,why:doc.checkResult.text};
}
export function scoreDecision(s){
  const scenario=s.scenario,option=scenario.options.find(o=>o.id===s.decision),mitigation=scenario.mitigations.find(m=>m.id===s.mitigation);if(!option||!mitigation)return null;
  const basis=s.basis.map(id=>scenario.documents.find(d=>d.id===id)),verdicts=basis.map(d=>documentVerdict(s,d));
  const sourceQuality=verdicts.reduce((n,v)=>n+v.quality,0)/verdicts.length;
  const relevance=basis.filter(d=>d.supports.includes(option.id)).length/basis.length;
  const basisQuality=sourceQuality*.8+relevance*.2;
  const keyDocs=scenario.documents.filter(d=>d.critical),keyChecked=keyDocs.filter(d=>s.documents[d.id].checked).length;
  const checkedBasis=basis.filter(d=>s.documents[d.id].checked).length;
  const investigation=clamp(keyChecked/2)*.65+checkedBasis/basis.length*.35;
  const protection=protectionFor(option,mitigation);
  const alignment=s.principles.reduce((sum,k)=>sum+(option.profile[k]+(mitigation.principles.includes(k)?1:0)),0)/s.principles.length/10;
  const safeguard=protection.primaryCovered?1:protection.uncertaintyCovered?.85:.55;
  const noticedConflict=s.documents.advocate.checked;
  const procedure=(noticedConflict?.7:.4)+(protection.procedureCovered?.3:.1);
  const uncertainty=protection.uncertaintyCovered?1:protection.primaryCovered?.85:.5;
  const processQuality=basisQuality*.6+investigation*.4;
  const decisionQuality=clamp(alignment)*.45+safeguard*.3+relevance*.25;
  const points=basisQuality*30+investigation*20+clamp(alignment)*15+safeguard*15+clamp(procedure)*10+uncertainty*10;
  return {grade:points>=85?'A':points>=70?'B':points>=55?'C':points>=38?'D':'F',verdicts,alignment:alignment>=.75?'Высокая':alignment>=.55?'Частичная':'Требует объяснения',processQuality:processQuality>=.8?'Надёжная опора':processQuality>=.6?'Есть оговорки':'Хрупкая опора',decisionQuality:decisionQuality>=.8?'Согласованная конструкция':decisionQuality>=.6?'Есть компромиссы':'Недостаточно защищено',noticedConflict,protected:protection.primaryCovered||protection.uncertaintyCovered,
    insights:[basisQuality<.6?'Выбранное основание содержит непроверенные или скомпрометированные сведения. Удачный исход не заменит их проверки.':'Основание можно объяснить проверенными фактами и явными оговорками.',noticedConflict?'Интерес автора замечен. Он не делает подтверждённый факт ложным автоматически.':'Интерес автора не проверялся; нельзя считать рекомендацию независимой.',protection.primaryCovered?'Защита направлена на основной риск выбранного варианта; она имеет собственную цену.':'Защита полезна, но не полностью закрывает основной риск выбранной конструкции.','Оценка относится к доступной тогда информации. Скрытый будущий исход в формулу не входит.']};
}
