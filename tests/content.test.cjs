const {test}=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
test('content lint passes',()=>{const out=execFileSync(process.execPath,[path.join(root,'scripts/lint-content.cjs')]).toString();assert.match(out,/passed/);});
test('public files include the app, course, fonts and redirects',()=>{
  const {publicFiles}=require('../scripts/public-files.cjs');const files=publicFiles(root);
  for(const f of ['index.html','assets/app.js','assets/practice.js','assets/blocks.js','assets/styles.css','assets/games/kit.js','content/course.js','content/course/t10.js','content/faq.js','modules/module-01.html','trainer.html'])assert.ok(files.includes(f),f);
  assert.ok(files.some(f=>f.endsWith('.woff2')));
});
test('practice engine checks every exercise type',async()=>{
  const {check}=await import(path.join(root,'assets/practice.js'));
  const {course}=await import(path.join(root,'content/course.js'));
  for(const e of course.flatMap(u=>u.lessons.flatMap(l=>l.ex))){
    const right={tf:e.ok,choice:e.ok,case:e.ok,fill:e.ok,multi:e.ok,order:e.items&&e.items.map((x,i)=>i),match:true,classify:true}[e.t];
    assert.equal(check(e,right),true,e.q);
    if(e.t==='multi')assert.equal(check(e,e.ok.slice(1)),false);
    if(e.t==='order')assert.equal(check(e,[...right].reverse()),false);
    if(['choice','case','fill'].includes(e.t))assert.equal(check(e,(e.ok+1)%e.opts.length),false);
    if(e.t==='tf')assert.equal(check(e,!e.ok),false);
  }
});
test('streak counts consecutive days up to today or yesterday',async()=>{
  const {streakOf}=await import(path.join(root,'assets/ui.js'));
  const now=new Date(2026,9,18);
  assert.equal(streakOf(['2026-10-16','2026-10-17','2026-10-18'],now),3);
  assert.equal(streakOf(['2026-10-16','2026-10-17'],now),2);
  assert.equal(streakOf(['2026-10-15'],now),0);
});
