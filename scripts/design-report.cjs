/* Read-only editorial inventory. Frequencies are signals, not CI failures. */
const fs=require('node:fs'),path=require('node:path'),{publicFiles}=require('./public-files.cjs');
const root=path.resolve(__dirname,'..');
function report(){
  const files=publicFiles(root),texts=[],headings=[],leads=[],technical=[],radii=new Set();let pills=0;
  for(const file of files){const source=fs.readFileSync(path.join(root,file),'utf8');
    if(file.endsWith('.css')){for(const m of source.matchAll(/border-radius\s*:\s*([^;}]+)/g)){radii.add(m[1].trim());if(/(?:99|999|50%)/.test(m[1]))pills++;}continue;}
    if(!/\.(html|js)$/.test(file))continue;
    const strings=file.endsWith('.html')?[source]:[...source.matchAll(/(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g)].map(m=>m[2]).filter(s=>/[А-Яа-яЁё]/.test(s));
    for(const str of strings){const text=str.replace(/<[^>]*>/g,' ').replace(/\$\{[^}]*\}/g,' ').replace(/\s+/g,' ').trim();if(text)texts.push(text);
      for(const m of str.matchAll(/<h[23][^>]*>([^<]+)<\/h[23]>/g))headings.push(m[1]);
      for(const m of str.matchAll(/<p[^>]*class="[^"]*(?:lead|intro)[^"]*"[^>]*>([^<]+)<\/p>/g))leads.push(m[1]);
      if(/localStorage|dataVersion|revision|namespace|migration|storage key|JSON format|profile ID|\bseed\b|\bengine\b/i.test(text)&&!file.includes('course-ui'))technical.push({file,text:text.slice(0,180)});
    }
  }
  const words=texts.join(' ').toLocaleLowerCase().match(/[а-яё]+/g)||[],counts=new Map();for(const word of words)if(word.length>4)counts.set(word,(counts.get(word)||0)+1);
  const duplicate=values=>{const map=new Map();for(const value of values)map.set(value,(map.get(value)||0)+1);return [...map].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]);};
  const terms=['выберите','проверьте','попробуйте','следующий шаг','рабоч','ситуаци','инструмент','реальн','понятн','подход','наблюдайте','помогает','позволяет','открыть'];
  return {method:'Public HTML and Cyrillic JS strings; dynamic template fragments may be incomplete. Counts include authored learning content. No internal object-key scan.',frequencies:Object.fromEntries(terms.map(term=>[term,texts.join(' ').toLowerCase().split(term).length-1])),topWords:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,20),topRepeatedPhrases:duplicate(texts.flatMap(t=>t.split(/(?<=[.!?])\s+/)).filter(t=>t.length>=24)).slice(0,20),duplicateHeadings:duplicate(headings),duplicateLeads:duplicate(leads),technical,radii:[...radii].sort(),pillDeclarations:pills};
}
if(require.main===module)console.log(JSON.stringify(report(),null,2));
module.exports={report};
