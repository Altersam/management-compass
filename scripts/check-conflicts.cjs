const fs=require('node:fs');
const path=require('node:path');

function markerLines(text){
  return text.split(/\r?\n/).flatMap((line,index)=>
    /^(?:<{7}(?:\s|$)|={7}\s*$|>{7}(?:\s|$)|\|{7}(?:\s|$))/.test(line)?[index+1]:[]);
}

function findConflicts(root){
  const skip=new Set(['.git','node_modules','site','test-results','playwright-report']);
  const problems=[];
  function visit(directory){
    for(const item of fs.readdirSync(directory,{withFileTypes:true})){
      if(skip.has(item.name))continue;
      const file=path.join(directory,item.name);
      if(item.isDirectory())visit(file);
      else if(item.isFile()&&/\.(html|css|js|cjs|md|json|ya?ml)$/.test(item.name)){
        const lines=markerLines(fs.readFileSync(file,'utf8'));
        if(lines.length)problems.push({file:path.relative(root,file),lines});
      }
    }
  }
  visit(root);return problems;
}

function assertClean(root){
  const problems=findConflicts(root);
  if(problems.length)throw new Error(`Unresolved merge markers: ${problems.map(p=>`${p.file}:${p.lines.join(',')}`).join('; ')}`);
}

if(require.main===module){
  try{assertClean(path.resolve(__dirname,'..'));console.log('No unresolved merge markers.');}
  catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={markerLines,findConflicts,assertClean};
