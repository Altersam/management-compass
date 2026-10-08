const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2),index=args.indexOf('--port');
const port=Number(index>=0?args[index+1]:4173);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
function publicPath(relative){return /^[a-z0-9-]+\.html$/i.test(relative)||/^modules\/module-\d{2}\.html$/.test(relative)||/^assets\/[a-z0-9-]+\.(js|css|svg|ico)$/.test(relative);}
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Method not allowed');return;}
  let relative;
  try { relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html'; } catch(_){res.writeHead(400);res.end('Bad request');return;}
  if(!publicPath(relative)){res.writeHead(404);res.end('Not found');return;}
  const file=path.join(root,relative);
  fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);});
});
server.on('error',e=>{console.error(`Cannot start on 127.0.0.1:${port}: ${e.message}`);process.exit(1);});
server.listen(port,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${port}`;console.log(`Management Compass: ${url}\nCtrl+C to stop. Data stays in your browser.`);
  if(args.includes('--open')){let child;if(process.platform==='win32')child=spawn('cmd.exe',['/c','start','',url],{stdio:'ignore'});else child=spawn(process.platform==='darwin'?'open':'xdg-open',[url],{stdio:'ignore'});child.on('error',()=>console.log(`Open ${url} in your browser.`));child.unref();}
});
