/* Sequential design-stage gate. Full diagnostics are printed on failure. */
const {spawnSync}=require('node:child_process');
const env={...process.env,CI:'true'};
for(const command of ['npm test','npm run lint:content','npm run test:browser','npm run build','git diff --check']){
  const [bin,...args]=command.split(' '),result=spawnSync(process.platform==='win32'?process.env.ComSpec:bin,process.platform==='win32'?['/d','/s','/c',command]:args,{cwd:require('node:path').resolve(__dirname,'..'),env,encoding:'utf8',maxBuffer:16*1024*1024});
  const output=(result.stdout||'')+(result.stderr||'');
  if(result.status!==0){console.log(output);console.error(command+' FAILED',result.error||'');process.exit(result.status||1);}
  console.log(command+' — OK '+(output.match(/\d+ passed[^\r\n]*|ℹ tests \d+/)?.[0]||''));
}
