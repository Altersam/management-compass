const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {readings,additionalDiagrams}=require('../content/theory-depth.js'),{theoryGuide}=require('../content/theory-guide.js');
const context={};context.window=context;
for(const name of ['content','knowledge','visuals'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/'+name+'.js'),'utf8'),context);
const visuals=context.Visuals;
for(const {diagram:d} of readings)visuals.register(d.id,d.title,d.kind,d.points,d.note);
for(const d of additionalDiagrams)visuals.register(d.id,d.title,d.kind,d.points,d.note);
test('every discovered diagram exists, expands into readable SVG and maps to the same topic reading',()=>{
  assert.equal(theoryGuide.length,10);const ids=[];
  for(const guide of theoryGuide){assert.equal(readings.filter(r=>r.topic===guide.id).length,2);
    for(const id of guide.diagrams){assert.ok(visuals.definitions[id],id);const markup=visuals.render(id);assert.match(markup,/role="img"/);assert.match(markup,/Показать графическую схему/);ids.push(...[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));}
    for(const id of guide.readings)assert.ok(readings.some(r=>r.id===id&&r.topic===guide.id),id);
  }
  assert.equal(new Set(ids).size,ids.length,'repeated graphical forms keep unique accessible IDs');
  assert.equal(theoryGuide.reduce((n,g)=>n+g.diagrams.length,0),70);
});
test('expanded source-based readings keep canonical techniques and question storage intact',()=>{
  const chapter=context.HANDBOOK.chapters.find(c=>c.id===8);
  assert.deepEqual(Array.from(chapter.techniques,t=>t.id),['process','improvement','sipoc']);
  for(const item of readings){assert.ok(item.paragraphs.every(text=>text.length>150),item.id);assert.ok(item.diagram.points.every(([label,detail])=>label&&detail.length>20),item.id);}
});
