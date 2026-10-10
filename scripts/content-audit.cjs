/* Read-only inventory of the legacy content, before the v3 migration. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function loadLegacy(){
  const context={};context.window=context;
  for(const name of ['content','knowledge','course-data','course-questions','learning-content','question-revision','case-revision']){
    vm.runInNewContext(fs.readFileSync(path.join(root,`assets/${name}.js`),'utf8'),context,{filename:name+'.js'});
  }
  return JSON.parse(JSON.stringify({handbook:context.HANDBOOK,course:context.COURSE,pedagogy:context.PEDAGOGY}));
}
function sentences(value,location='content',result=[]){
  if(typeof value==='string'){
    for(const text of value.split(/(?<=[.!?])\s+/)){
      const normalized=text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();
      if(normalized.length>=65)result.push({text,normalized,location});
    }
  }else if(value&&typeof value==='object'){
    for(const [key,item] of Object.entries(value))sentences(item,`${location}.${key}`,result);
  }
  return result;
}
function duplicates(content){
  const byText=new Map();
  for(const sentence of sentences(content)){
    const previous=byText.get(sentence.normalized)||[];previous.push(sentence);byText.set(sentence.normalized,previous);
  }
  return [...byText.values()].filter(group=>group.length>1);
}
if(require.main===module){
  const content=loadLegacy(),questions=Object.values(content.course.questions).flat();
  console.log(JSON.stringify({
    chapters:content.handbook.chapters.map(c=>({id:c.id,techniques:c.techniques.map(t=>t.id)})),
    questions:questions.length,blocks:Object.values(content.pedagogy.topics).flatMap(t=>t.blocks).length,
    correctPositions:questions.reduce((counts,q)=>(counts[q.answer]=(counts[q.answer]||0)+1,counts),{}),
    longestCorrect:questions.filter(q=>q.options[q.answer].text.length>Math.max(...q.options.filter((_,i)=>i!==q.answer).map(o=>o.text.length))).length,
    duplicateSentences:duplicates(content).map(group=>({text:group[0].text,locations:group.map(s=>s.location)}))
  },null,2));
}
module.exports={loadLegacy,sentences,duplicates};
