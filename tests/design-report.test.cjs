const {test}=require('node:test'),assert=require('node:assert/strict'),{strings}=require('../scripts/design-report.cjs');
test('copy inventory reads nested templates without counting engine code or escaped quotes as UI',()=>{
  const source="const esc=s=>s.replace(/[&<>\"']/g,''); const n={revision:1,seed:'internal'}; const view=`<label>${n.seed}<p>Проверьте ${n.revision?'Факт':'Причину'}.</p></label>`; // Скрытый комментарий";
  const result=strings(source);assert.ok(result.some(text=>text.includes('Проверьте')));assert.ok(result.includes('Факт'));assert.ok(result.includes('Причину'));assert.ok(result.every(text=>!text.includes('const n')&&!text.includes('revision:1')&&!text.includes('Скрытый комментарий')));
});
