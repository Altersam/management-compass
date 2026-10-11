const {test}=require('node:test'),assert=require('node:assert/strict');
const H=require('../assets/arcade/hybrid.js');
test('comparison repeats the same conditions; changing feedback placement changes the loss rather than the label',()=>{
  let s=H.act(H.create('lab'),{type:'context',value:'discovery'});s=H.act(s,{type:'run'});s=H.act(s,{type:'run'});
  assert.deepEqual(s.runs[0].result,s.runs[1].result);assert.deepEqual(s.runs[0].pressure,s.runs[1].pressure);assert.equal(H.comparison(s).days,0);assert.ok(H.validate(s));
  let improved=H.act(H.create('lab'),{type:'context',value:'discovery'});improved=H.act(improved,{type:'run'});improved=H.act(improved,{type:'preset',value:'agile'});improved=H.act(improved,{type:'run'});
  assert.ok(H.comparison(improved).rework<0);assert.ok(improved.runs[1].result.quality>improved.runs[0].result.quality);assert.throws(()=>H.act(improved,{type:'run'}),/завершена/);
});
test('review needs a real sample and tests/gates must cover the last delivery',()=>{
  const empty=H.evaluate(['review','build','test','gate','release'],'report');assert.equal(empty.feedback,0);
  const once=H.evaluate(['prototype','review','build','test','release'],'discovery'),twice=H.evaluate(['prototype','review','review','build','test','release'],'discovery');
  assert.equal(twice.feedback,once.feedback);assert.equal(twice.uncertainty,once.uncertainty);assert.equal(twice.days,once.days+1,'repeating the same sample consumes time without new evidence');
  assert.equal(H.evaluate(['build','test','gate','build','release'],'report').viable,false);
  assert.equal(H.evaluate(['build','gate','test','release'],'report').approved,false);
  assert.equal(H.evaluate(H.presets.agile,'report').viable,false);
  assert.equal(H.evaluate(H.presets.waterfall,'report').viable,true);
  assert.equal(H.evaluate([...H.presets.waterfall,'research'],'report').viable,false);
  const expensive=H.evaluate(Array.from({length:10},()=> 'research').concat(['build','test','gate','release']),'report');assert.equal(expensive.within,false);assert.ok(expensive.spend>expensive.budget);
});
test('saved terminal results are validated and legacy attempts keep their original calculation',()=>{
  let legacy=H.create('old');delete legacy.modelVersion;legacy=H.act(legacy,{type:'run'});const earned=structuredClone(legacy.runs[0].result);legacy=H.act(legacy,{type:'run'});
  assert.ok(H.validate(legacy));assert.deepEqual(legacy.runs[0].result,earned);assert.equal(legacy.runs[1].pressure,undefined);
  assert.equal(H.report(legacy).metrics[0][1],legacy.runs[1].result.days+' / '+legacy.runs[1].result.deadline+' дней');
  let s=H.act(H.act(H.create('new'),{type:'run'}),{type:'run'});assert.ok(H.validate(s));
  const corrupt=structuredClone(s);corrupt.runs[0].result.days=0;assert.equal(H.validate(corrupt),false);
  const truncated=structuredClone(s);truncated.runs=[];assert.equal(H.validate(truncated),false);
  const malformed=structuredClone(s);malformed.runs=[null];assert.equal(H.validate(malformed),false);
  assert.throws(()=>H.act(H.create(),{type:'move',index:-1,delta:1}));
});
test('fifty seeds preserve model bounds, determinism and budget accounting in every context',()=>{
  for(let seed=0;seed<50;seed++)for(const context of H.contexts){
    let s=H.act(H.create('lab-'+seed),{type:'context',value:context.id});s=H.act(s,{type:'preset',value:'hybrid'});s=H.act(s,{type:'run'});assert.ok(H.validate(s));
    for(const r of [s.runs[0].result,s.runs[0].pressure]){assert.ok(Number.isFinite(r.days)&&r.days>0);assert.equal(r.spend,r.days*r.daily);assert.ok(r.quality>=0&&r.quality<=100);assert.ok(r.uncertainty>=0&&r.uncertainty<=1);assert.equal(r.days,r.trace.at(-1).end);}
    const copy=JSON.parse(JSON.stringify(s));assert.ok(H.validate(copy));assert.deepEqual(H.act(copy,{type:'run'}),H.act(s,{type:'run'}));
  }
});
