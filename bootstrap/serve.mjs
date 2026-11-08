import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rel from './rel-values.cjs';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const declaration=rel.parse(await readFile(path.join(directory,'bootstrap/publication.rel'),'utf8'));
const outputs=declaration.filter(f=>f.s==='local'&&f.p==='output');
if(outputs.length!==1)throw Error('Unique canonical publication output required');
const root=path.join(directory,process.env.WORLDWRIGHT_ROOT||outputs[0].o);
const port=Number(process.env.WORLDWRIGHT_PORT||4186);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.rel':'text/plain; charset=utf-8','.encounter':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 let filename=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(filename!==root&&!filename.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 let info=await stat(filename);if(info.isDirectory()){filename=path.join(filename,'index.html');info=await stat(filename);}if(!info.isFile())throw Error('Not a file');
 const body=await readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);
}catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
