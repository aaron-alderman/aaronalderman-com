// Generic I/O host. Policy and transaction sequencing live in the main algebra.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {lower}=require('../bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('../bootstrap/temple-seed.cjs'),{valuePorts}=require('../bootstrap/ports/value.cjs'),{computationalPorts}=require('../bootstrap/ports/browser-effects.cjs'),{createProcessCompiler}=require('../bootstrap/ports/process-source.cjs'),{invoke}=require('../bootstrap/ports/programme.cjs');
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function checked(base,file) {
 const target=path.resolve(base,file),relative=path.relative(base,target);
 if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Path escapes authoring root');
 let current=base;
 for(const segment of relative.split(path.sep)){current=path.join(current,segment);if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())throw Error('Authoring refuses symlinks');}
 return target;
}
const read=file=>fs.readFileSync(checked(root,file));
const json=file=>JSON.parse(read(file));
export function fingerprint(base,file){const target=checked(base,file);return fs.existsSync(target)?digest(fs.readFileSync(target)):null;}
function observe(base,file){
 const target=checked(base,file);
 if(!fs.existsSync(target))return {exists:false,sha256:null,text:null};
 const bytes=fs.readFileSync(target),text=bytes.toString('utf8');
 if(!Buffer.from(text).equals(bytes))throw Error('Text authoring refuses non-UTF8 bytes: '+file);
 return {exists:true,sha256:digest(bytes),text};
}
const compiler=frontend=>createProcessCompiler({read:async file=>read(file).toString('utf8'),digest},frontend);
const compile=input=>lower({compiler:json('algebra/lowering.process.json'),definitions:json('algebra/operators.expression.json'),primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit:json('source/authoring-contract.json').budget});
export async function loadAuthorModel(contract=json('source/authoring-contract.json')){
 const queries={...json(contract.process).queries},sources=[],inputs=new Map();
 for(const selection of contract.processSources){
  const text=read(selection.file).toString('utf8'),frontend=await createProcessCompiler({read:async file=>{const bytes=read(file);inputs.set(file,digest(bytes));return bytes.toString('utf8');},digest},selection.frontend),compiled=await frontend.compile(selection.file,text);
  for(const [name,steps]of Object.entries(compiled.surface.queries)){if(Object.hasOwn(queries,name))throw Error('Duplicate authoring query: '+name);queries[name]=steps;}
  sources.push({file:selection.file,sha256:digest(text),frontend:selection.frontend,frontendIdentity:frontend.identity});
 }
 const model=await compile({entry:'author.run',queries}),admission=await compile(json('algebra/admission.process.json'));
 for(const entry of ['admit.model','admit.effects'])await invoke({model:admission,entry,input:{target:model,profile:json('bootstrap/kernel-profile.json'),grants:contract.grants},ports:valuePorts(),limit:contract.budget});
 return {model,sources,inputs};
}
// Standard npm prerequisite: no lookup in project build directories or caches.
function command(tool,args){
 if(!Array.isArray(args)||args.some(a=>typeof a!=='string'))throw Error('Command arguments must be strings');
 if(tool==='node')return [process.execPath,args];
 if(tool==='npm'){
  const cli=process.env.npm_execpath??path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
  if(!fs.existsSync(cli))throw Error('Run author through npm run author (Node and npm are required).');
  return [process.execPath,[cli,...args]];
 }
 throw Error('Unsupported native command tool: '+tool);
}
function git(args){const r=spawnSync('git',['-c','safe.directory='+root,...args],{cwd:root,encoding:'utf8'});if(r.status!==0)throw Error(r.error?.message??r.stderr??'git failed');return r.stdout;}
export async function author(request){
 const contractBytes=read('source/authoring-contract.json'),contract=JSON.parse(contractBytes),processBytes=read(contract.process),mechanismBytes=read('tooling/author.mjs');
 const {model,sources,inputs}=await loadAuthorModel(contract);
 const workspace=checked(root,'.build/authoring');fs.mkdirSync(workspace,{recursive:true});
 const lock=path.join(workspace,'lock'),fd=fs.openSync(lock,'wx'),snapshots=new Map(),observations=new Map();let stage;
 const ports={...valuePorts(),...computationalPorts(),
  'document.observe':({file})=>{const value=observe(root,file);if(observations.has(file)&&observations.get(file)!==value.sha256)throw Error('Observed input changed: '+file);observations.set(file,value.sha256);return value;},
  'document.entries':({directory})=>fs.readdirSync(checked(root,directory),{withFileTypes:true}).map(e=>({name:e.name,kind:e.isFile()?'file':e.isDirectory()?'directory':'other'})),
  'process.compile':async({frontend,file,text})=>(await compiler(frontend)).compile(file,text),
  'process.lower':({model})=>compile(model),
  'publication.stage':({changes})=>{
   stage=fs.mkdtempSync(path.join(workspace,'candidate-'));
   function copy(relative){const from=checked(root,relative),to=checked(stage,relative),stat=fs.lstatSync(from);if(stat.isDirectory()){fs.mkdirSync(to,{recursive:true});for(const child of fs.readdirSync(from))copy(relative+'/'+child);}else{const bytes=fs.readFileSync(from);snapshots.set(relative,digest(bytes));fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes);}}
   for(const directory of contract.inputDirectories)copy(directory);
   for(const file of contract.inputFiles)copy(file);
   for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.test.mjs')))copy(file);
   const controls=[[contract.process,digest(processBytes)],['source/authoring-contract.json',digest(contractBytes)],['tooling/author.mjs',digest(mechanismBytes)],...sources.map(s=>[s.file,s.sha256]),...inputs];
   for(const [file,hash]of controls)if(snapshots.get(file)!==hash)throw Error('Authoring control changed while staging: '+file);
   for(const [file,hash]of observations){if(observe(root,file).sha256!==hash)throw Error('Observed input changed while staging: '+file);if(snapshots.has(file)&&snapshots.get(file)!==hash)throw Error('Observed staged input differs: '+file);snapshots.set(file,hash);}
   for(const change of changes){
    const current=observe(root,change.file);
    if(current.sha256!==change.beforeSha256)throw Error('Source changed while staging: '+change.file);
    if(snapshots.has(change.file)&&snapshots.get(change.file)!==current.sha256)throw Error('Staged predecessor differs: '+change.file);
    snapshots.set(change.file,current.sha256);
    const target=checked(stage,change.file);
    if(change.text===null){if(fs.existsSync(target))fs.unlinkSync(target);}else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,change.text);}
   }
   return {id:path.relative(root,stage).replaceAll('\\','/')};
  },
  'checkout.stage':({excludeRoots})=>{
   const status=git(['status','--porcelain','--untracked-files=normal']),revision=git(['rev-parse','HEAD']).trim(),clean=status.trim()==='';
   if(!clean)return {clean,revision,status};
   const evidence=fs.mkdtempSync(path.join(os.tmpdir(),'encounter-clean-')),archive=checked(evidence,'checkout.tar');
   git(['archive','--format=tar','--output='+archive,revision]);stage=checked(evidence,'checkout');fs.mkdirSync(stage);
   const result=spawnSync('tar',['-xf',archive,'-C',stage],{encoding:'utf8'});if(result.status!==0)throw Error(result.error?.message??result.stderr);
   // The archive preserves tracked generated output as evidence. Remove only
   // explicitly selected roots in this fresh temporary checkout before testing.
   for(const file of excludeRoots){const target=checked(stage,file);if(fs.existsSync(target)){if(path.resolve(stage)!==path.join(evidence,'checkout'))throw Error('Unexpected clean root');fs.rmSync(target,{recursive:true});}}
   const excluded=Object.fromEntries(excludeRoots.map(file=>[file,!fs.existsSync(checked(stage,file))]));
   return {clean,revision,root:stage,archiveSha256:digest(fs.readFileSync(archive)),excludedRoots:excludeRoots,excludedBuild:excluded['.build'],excludedDependencies:excluded.node_modules,excludedOutput:excluded.dist};
  },
  'publication.validate':({commands,receiptPath})=>{
   const runs=commands.map(({tool,args})=>{const [binary,argv]=command(tool,args),r=spawnSync(binary,argv,{cwd:stage,encoding:'utf8',maxBuffer:16*1024*1024});return {command:[tool,...args],status:r.status,stdout:r.stdout??'',stderr:r.stderr??'',error:r.error?.message??null};});
   const log=checked(stage,'validation.json');fs.writeFileSync(log,JSON.stringify(runs,null,2)+'\n');
   const receipt=checked(stage,receiptPath);return {runs,log,receipt:fs.existsSync(receipt)?JSON.parse(fs.readFileSync(receipt,'utf8')):null};
  },
  'document.commit':({changes})=>{
   for(const [file,hash]of snapshots)if(fingerprint(root,file)!==hash)throw Error('Validated input changed: '+file);
   const originals=changes.map(c=>({file:c.file,...observe(root,c.file)})),written=[];
   try{for(const change of changes){const target=checked(root,change.file);if(change.text===null)fs.unlinkSync(target);else{fs.mkdirSync(path.dirname(target),{recursive:true});const temporary=target+'.authoring-tmp';fs.writeFileSync(temporary,change.text,{flag:'wx'});try{fs.renameSync(temporary,target);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}}written.push(change.file);}}
   catch(error){for(const original of originals)if(written.includes(original.file)){const target=checked(root,original.file);if(original.exists)fs.writeFileSync(target,original.text);else if(fs.existsSync(target))fs.unlinkSync(target);}throw error;}
   return {files:changes.map(c=>({file:c.file,beforeSha256:c.beforeSha256,afterSha256:c.text===null?null:digest(c.text)}))};
  },
  'receipt.write':({value,file})=>{
   const receipt={...value,processSha256:digest(processBytes),sources,contractSha256:digest(contractBytes),mechanismSha256:digest(mechanismBytes),candidate:stage};
   const target=checked(stage,'authoring-receipt.json');fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');
   if(file){const destination=checked(root,file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(receipt,null,2)+'\n');}
   return {path:target,...receipt};
  }
 };
 try{return (await invoke({model,entry:'author.run',input:{request,contract},ports,limit:contract.budget})).value;}
 finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(process.argv.length!==3)throw Error('Usage: npm run author -- proposal.json (or - for stdin)');console.log(JSON.stringify(await author(JSON.parse(fs.readFileSync(process.argv[2]==='-'?0:process.argv[2],'utf8'))),null,2));}
 catch(error){console.error(error.stack);process.exitCode=1;}
}
