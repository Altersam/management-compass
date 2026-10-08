const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'site');
require('./check-conflicts.cjs').assertClean(root);
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const file of fs.readdirSync(root))if(file.endsWith('.html'))fs.copyFileSync(path.join(root,file),path.join(out,file));
for(const folder of ['assets','modules']){
  fs.mkdirSync(path.join(out,folder),{recursive:true});
  for(const file of fs.readdirSync(path.join(root,folder))){
    if(!/\.(html|css|js|svg|ico)$/.test(file))throw new Error(`Unexpected public file: ${folder}/${file}`);
    fs.copyFileSync(path.join(root,folder,file),path.join(out,folder,file));
  }
}
console.log('Static site prepared in site/. Only reference pages and local assets are included.');
