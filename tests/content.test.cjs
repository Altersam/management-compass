const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/content.js'),'utf8'),context);
const data=context.window.HANDBOOK;
context.HANDBOOK=data;
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/knowledge.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/visuals.js'),'utf8'),context);
const visuals=context.window.Visuals;
test('source and documentation contain no unfinished merge markers',()=>{
  require('../scripts/check-conflicts.cjs').assertClean(root);
});
test('conflict guard detects normal and diff3 markers before publication',()=>{
  const {markerLines}=require('../scripts/check-conflicts.cjs');
  const broken=['before','<'.repeat(7)+' HEAD','left','|'.repeat(7)+' base','original','='.repeat(7),'right','>'.repeat(7)+' branch','after'].join('\n');
  assert.deepEqual(markerLines(broken),[2,4,6,8]);
  assert.deepEqual(markerLines('A comparison: left < right.\nA heading\n======= is mentioned inline.'),[]);
});
test('ten chapters have theory, actionable techniques, examples and reflection cases',()=>{
  assert.equal(data.chapters.length,10);assert.equal(data.cases.length,10);assert.equal(data.routes.length,8);
  for(const c of data.chapters){assert.equal(c.theory.length,3);assert.equal(c.techniques.length,3);assert.equal(c.faq.length,2);assert.ok(data.cases.some(k=>k.chapter===c.id));
    assert.ok(c.intro.length>100);assert.equal(c.theoryDetails.length,3);assert.equal(c.terms.length,3);
    assert.ok(c.theoryDetails.every(text=>text.length>150));
    for(const t of c.techniques){assert.equal(t.steps.length,5);assert.equal(t.fields.length,4);for(const k of ['name','when','why','example','mistake','check'])assert.ok(t[k].length>10);}
    for(const n of c.related)assert.ok(data.chapters.some(m=>m.id===n));
  }
  for(const c of data.cases){assert.equal(c.feedback.length,c.options.length);assert.ok(c.answer>=0&&c.answer<c.options.length);assert.ok(c.reflection);}
  assert.equal(new Set(data.cases.map(c=>c.id)).size,10);
});
test('every technique and chapter has a local, accessible visual explanation',()=>{
  for(const c of data.chapters){
    for(const key of [c.overviewVisual,c.coreVisual[0],...c.techniques.map(t=>t.visual)]){
      const definition=visuals.definitions[key];assert.ok(definition,`Missing ${key}`);
      assert.ok(definition.points.every(p=>p.label&&p.detail.length>20));
      assert.match(visuals.render(key),/<svg[^>]*role="img"/);
      assert.match(visuals.render(key),/aria-pressed="true"/);
    }
    assert.equal(new Set(c.techniques.map(t=>t.id)).size,c.techniques.length);
  }
  for(const id of ['paei','capi','lifecycle'])assert.ok(visuals.definitions[id]);
  const markup=visuals.render('priority')+visuals.render('priority');
  const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'Repeated diagram IDs must remain unique');
});
test('all public JavaScript parses and all local HTML links/scripts exist',()=>{
  const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'modules')).map(f=>'modules/'+f)];
  for(const f of fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,'assets',f),'utf8'),{filename:f});
  for(const f of files){const text=fs.readFileSync(path.join(root,f),'utf8');assert.match(text,/<html lang="ru"/);for(const match of text.matchAll(/(?:href|src)="([^"]+)"/g)){const link=match[1].split(/[?#]/)[0];if(!link||/^[a-z]+:/i.test(link))continue;assert.ok(fs.existsSync(path.resolve(path.dirname(path.join(root,f)),link)),`${f} -> ${link}`);}}
});
test('public content is generalised and has no PDF assets or external runtime dependency',()=>{
  const publicFiles=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...['assets','modules'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).map(f=>dir+'/'+f))];
  for(const f of publicFiles){assert.doesNotMatch(f,/\.(pdf|pptx?|docx)$/i);const text=fs.readFileSync(path.join(root,f),'utf8');assert.doesNotMatch(text,/Финансов[а-я]+ университет|DIRECTUM|регламент[а-я ]+университет/i);assert.doesNotMatch(text,/(?:src=["']https?:|@import\s+url|fetch\()/i);}
  for(const c of data.chapters)assert.ok(fs.existsSync(path.join(root,`modules/module-${String(c.id).padStart(2,'0')}.html`)));
});
