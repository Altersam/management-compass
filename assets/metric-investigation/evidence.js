export function evidenceQuality(s){
  const probes=s.opened.map(id=>s.scenario.probes.find(p=>p.id===id)),root=probes.some(p=>p.role==='key'&&p.evidenceFor.includes('root')),outcome=probes.some(p=>p.evidenceFor.includes('outcome')),types=new Set(probes.filter(p=>p.role!=='decoy').map(p=>p.source)),decoys=probes.filter(p=>p.role==='decoy').length;
  return {root,outcome,independent:types.size>=2,decoys,value:Math.max(0,(root?.4:0)+(outcome?.35:0)+(types.size>=2?.25:0)-decoys*.12)};
}
export function resultForProbe(sc,probe){return {id:probe.id,title:probe.title,source:probe.source,text:probe.fact,evidenceFor:[...probe.evidenceFor],evidenceAgainst:[...probe.evidenceAgainst]};}
