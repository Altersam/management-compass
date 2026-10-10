const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'site');
require('./check-conflicts.cjs').assertClean(root);
const files=require('./public-files.cjs').publicFiles(root);
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const relative of files){
  const destination=path.join(out,relative);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(path.join(root,relative),destination);
}
console.log('Static site prepared in site/. Only reference pages and local assets are included.');
