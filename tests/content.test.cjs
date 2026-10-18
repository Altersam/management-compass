const {test}=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
test('content lint passes',()=>{const out=execFileSync(process.execPath,[path.join(__dirname,'../scripts/lint-content.cjs')]).toString();assert.match(out,/passed/);});
test('public files include the app, fonts and redirects but no stray files',()=>{
  const {publicFiles}=require('../scripts/public-files.cjs');const files=publicFiles(path.resolve(__dirname,'..'));
  for(const f of ['index.html','assets/app.js','assets/styles.css','assets/games/kit.js','content/topics.js','modules/module-01.html','trainer.html'])assert.ok(files.includes(f),f);
  assert.ok(files.some(f=>f.endsWith('.woff2')));
});
