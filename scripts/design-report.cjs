/* Read-only editorial inventory. Reports never reject the release for word frequency. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),{publicFiles}=require('./public-files.cjs');
const root=path.resolve(__dirname,'..');
const {publicPath}=require('./public-files.cjs');
function strings(source){
  const found=[];let i=0;
  function scan(expression=false){let braces=0;
    while(i<source.length){const c=source[i];
      if(c==='/'&&source[i+1]==='/'){i=source.indexOf('\n',i+2);if(i<0)i=source.length;continue;}
      if(c==='/'&&source[i+1]==='*'){const end=source.indexOf('*/',i+2);i=end<0?source.length:end+2;continue;}
      if(c==='/'&&/[=(,:!\[;?]/.test(source.slice(0,i).trim().at(-1)||'')){i++;let bracket=false;while(i<source.length){const v=source[i++];if(v==='\\'){i++;continue;}if(v==='[')bracket=true;if(v===']')bracket=false;if(v==='/'&&!bracket)break;}while(/[a-z]/i.test(source[i]||''))i++;continue;}
      if(c==='"'||c==="'"){const quote=c;let value='';i++;while(i<source.length){const v=source[i++];if(v==='\\'){value+=source[i++]||'';continue;}if(v===quote)break;value+=v;}if(/[а-яё]/i.test(value))found.push(value);continue;}
      if(c==='`'){let value='';i++;while(i<source.length){const v=source[i++];if(v==='\\'){value+=source[i++]||'';continue;}if(v==='`')break;if(v==='$'&&source[i]==='{'){if(/[а-яё]/i.test(value))found.push(value);value='';i++;scan(true);continue;}value+=v;}if(/[а-яё]/i.test(value))found.push(value);continue;}
      if(expression&&c==='}'&&braces===0){i++;return;}if(c==='{')braces++;if(c==='}')braces--;i++;
    }
  }scan();return found;
}
const clean=str=>str.replace(/<[^>]*(?:>|$)/g,' ').replace(/^["'>]+/,'').replace(/\s+/g,' ').trim();
function report(revision){
  const files=revision?execFileSync('git',['ls-tree','-r','--name-only','-z',revision],{cwd:root,encoding:'utf8'}).split('\0').filter(file=>publicPath(file)):publicFiles(root),texts=[],headings=[],leads=[],technical=[],radii=new Set();let pills=0;
  for(const file of files){const source=revision?execFileSync('git',['show',revision+':'+file],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,file),'utf8');
    if(file.endsWith('.css')){for(const m of source.matchAll(/border-radius\s*:\s*([^;}]+)/g)){radii.add(m[1].trim());if(/(?:99|999|50%)/.test(m[1]))pills++;}continue;}
    if(!/\.(html|js)$/.test(file))continue;
    for(const str of file.endsWith('.html')?[source.replace(/<head[\s\S]*?<\/head>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'')]:strings(source)){const text=clean(str);texts.push(...str.split(/<\/?(?:h[1-6]|p|li|dt|dd|label|button|a|summary|noscript|nav|section|div|main|article)[^>]*>/gi).map(clean).filter(t=>/[а-яё]/i.test(t)));
      for(const m of str.matchAll(/<h[23][^>]*>([^<]+)<\/h[23]>/g))headings.push(m[1]);
      for(const m of str.matchAll(/<p[^>]*class="[^"]*(?:lead|intro)[^"]*"[^>]*>([^<]+)<\/p>/g))leads.push(m[1]);
      if(/localStorage|dataVersion|revision|namespace|migration|storage key|JSON format|profile ID|\bseed\b|\bengine\b/i.test(text)&&!file.includes('course-ui'))technical.push({file,text:text.slice(0,180)});
    }
  }
  const duplicate=values=>{const map=new Map();for(const value of values)map.set(value,(map.get(value)||0)+1);return [...map].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]);};
  const words=texts.join(' ').toLowerCase().match(/[а-яё]+/g)||[],counts=new Map();for(const word of words)if(word.length>4)counts.set(word,(counts.get(word)||0)+1);
  const terms=['выберите','проверьте','попробуйте','следующий шаг','рабоч','ситуаци','инструмент','реальн','понятн','подход','наблюдайте','помогает','позволяет','открыть'];
  const phrases=[];for(const text of texts){const w=text.toLowerCase().match(/[а-яё]+/g)||[];for(let i=0;i<w.length-2;i++)phrases.push(w.slice(i,i+3).join(' '));}
  return {method:'Static public HTML and Cyrillic JS string/template segments. Dynamic expressions are omitted; repeated phrasing in different learning contexts is advisory.',frequencies:Object.fromEntries(terms.map(term=>[term,texts.join(' ').toLowerCase().split(term).length-1])),topWords:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,20),topRepeatedPhrases:duplicate(phrases).slice(0,20),duplicateSentences:duplicate(texts.flatMap(t=>t.split(/(?<=[.!?])\s+/)).filter(t=>t.length>=35)).slice(0,20),duplicateHeadings:duplicate(headings),duplicateLeads:duplicate(leads),technical,radii:[...radii].sort(),pillDeclarations:pills};
}
function copies(){const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean),refs=publicFiles(root).filter(file=>/\.(html|js|css)$/.test(file)).map(file=>({file,text:fs.readFileSync(path.join(root,file),'utf8')}));return tracked.filter(file=>/ \(\d+\)|(?:copy|backup)/i.test(file)).map(file=>{const original=file.replace(/ \(\d+\)/g,''),exists=fs.existsSync(path.join(root,original)),hash=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');return {file,original,identical:exists&&hash(file)===hash(original),references:refs.filter(ref=>ref.text.includes(file)||ref.text.includes(encodeURI(file))).map(ref=>ref.file)};});}
if(require.main===module)console.log(JSON.stringify(process.argv.includes('--copies')?copies():report(process.argv.find(arg=>arg.startsWith('--revision='))?.split('=')[1]),null,2));
module.exports={report,copies,strings};
