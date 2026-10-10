/* The build and local server share exactly the same public-file boundary. */
const fs=require('node:fs'),path=require('node:path');
const folders=['assets','content','modules'];
function publicPath(relative){
  return /^[a-z0-9-]+\.html$/i.test(relative)||/^modules\/module-\d{2}\.html$/.test(relative)||/^(?:assets|content)\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(js|css|svg|ico)$/.test(relative);
}
function publicFiles(root){
  const files=[];
  function visit(directory,prefix=''){
    for(const item of fs.readdirSync(directory,{withFileTypes:true})){
      const relative=prefix+item.name,file=path.join(directory,item.name);
      if(item.isSymbolicLink())throw new Error(`Public symlink is not allowed: ${relative}`);
      if(item.isDirectory()){
        if(!/^[a-z0-9-]+$/.test(item.name)||prefix.startsWith('modules/'))throw new Error(`Unexpected public directory: ${relative}`);
        visit(file,relative+'/');
      }else if(item.isFile()){
        if(!publicPath(relative))throw new Error(`Unexpected public file: ${relative}`);
        files.push(relative);
      }else throw new Error(`Unexpected public entry: ${relative}`);
    }
  }
  for(const item of fs.readdirSync(root,{withFileTypes:true})){
    if(item.name.endsWith('.html')){
      if(!item.isFile()||!publicPath(item.name))throw new Error(`Unexpected page: ${item.name}`);
      files.push(item.name);
    }
  }
  for(const folder of folders)if(fs.existsSync(path.join(root,folder))){
    if(fs.lstatSync(path.join(root,folder)).isSymbolicLink())throw new Error(`Public symlink is not allowed: ${folder}`);
    visit(path.join(root,folder),folder+'/');
  }
  return files.sort();
}
function resolvePublicFile(root,relative){
  if(!publicPath(relative))return null;
  let current=root;
  for(const segment of relative.split('/')){
    current=path.join(current,segment);
    const stat=fs.lstatSync(current);
    if(stat.isSymbolicLink())return null;
  }
  return fs.statSync(current).isFile()?current:null;
}
module.exports={publicPath,publicFiles,resolvePublicFile};
