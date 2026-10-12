export function scoreInvestigation(s,book){
  const last=s.pilots.at(-1),facts=book.sources.flatMap(source=>source.facts),selected=(last?.evidence||s.selectedEvidence||[]).map(id=>facts.find(f=>f.id===id)).filter(Boolean);
  if(!last)return {grade:null,selected,stageMatched:false,supports:0,corrected:false};
  const supports=selected.filter(f=>f.kind==='key').length,stageMatched=last.hypothesis.stage===book.archetype.trueStage,effective=book.archetype.effectiveInterventions.includes(last.intervention);
  const corrected=s.pilots.length===2&&last.result.delta>s.pilots[0].result.delta+.5;
  const trap=last.intervention==='change_metric';
  const points=(stageMatched?25:0)+Math.min(25,supports*12.5)+(effective?20:trap?0:8)+Math.min(20,Math.max(0,last.result.delta/book.realCycle)*60)+(corrected?8:0)+(s.spent<=book.budget-2?7:4);
  return {grade:points>=80?'A':points>=65?'B':points>=42?'C':'D',selected,stageMatched,supports,corrected,trap,effective};
}
