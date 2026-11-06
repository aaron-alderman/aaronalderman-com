// Generic I/O host. Authoring authority and transaction sequencing live in algebra.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {lower}=require('../bootstrap/ports/algebra-lower.cjs');
const {createKernel}=require('../bootstrap/temple-seed.cjs');
const {valuePorts}=require('../bootstrap/ports/value.cjs');
const {invoke}=require('../bootstrap/ports/programme.cjs');
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const json=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));

// Physical containment is a native mechanism, independent of the authoring policy.
function checked(base,file) {
  const target=path.resolve(base,file),relative=path.relative(base,target);
  if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Path escapes authoring root');
  let current=base;
  for(const segment of relative.split(path.sep)) {
    current=path.join(current,segment);
    if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())throw Error('Authoring refuses symlinks');
  }
  return target;
}
const read=file=>fs.readFileSync(checked(root,file));

export async function author(request) {
  const contractBytes=read('source/authoring-contract.json');
  const contract=JSON.parse(contractBytes);
  const processBytes=read(contract.process),mechanismBytes=read('tooling/author.mjs');
  const surface=JSON.parse(processBytes);
  const model=await lower({compiler:json('algebra/lowering.process.json'),definitions:json('algebra/operators.expression.json'),primitives:createKernel.operators,input:{...surface,entry:'author.run'},mode:'model',ports:valuePorts(),limit:contract.budget});
  const admission=await lower({compiler:json('algebra/lowering.process.json'),definitions:json('algebra/operators.expression.json'),primitives:createKernel.operators,input:json('algebra/admission.process.json'),mode:'model',ports:valuePorts(),limit:contract.budget});
  for(const entry of ['admit.model','admit.effects'])await invoke({model:admission,entry,input:{target:model,profile:json('bootstrap/kernel-profile.json'),grants:contract.grants},ports:valuePorts(),limit:contract.budget});
  const workspace=checked(root,'.build/authoring');fs.mkdirSync(workspace,{recursive:true});
  const lock=path.join(workspace,'lock');
  const fd=fs.openSync(lock,'wx');
  let stage;
  const snapshots=new Map();
  const ports={...valuePorts(),
    'document.observe':({file})=>{const bytes=read(file);return {sha256:digest(bytes),text:bytes.toString('utf8')};},
    'publication.stage':({changes})=>{
      stage=fs.mkdtempSync(path.join(workspace,'candidate-'));
      function copy(relative) {
        const from=checked(root,relative),to=checked(stage,relative),stat=fs.lstatSync(from);
        if(stat.isDirectory()) {fs.mkdirSync(to,{recursive:true});for(const child of fs.readdirSync(from))copy(relative+'/'+child);}
        else {const bytes=fs.readFileSync(from);snapshots.set(relative,digest(bytes));fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes);}
      }
      for(const directory of contract.inputDirectories)copy(directory);
      for(const file of contract.inputFiles)copy(file);
      for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.test.mjs')))copy(file);
      for(const [file,bytes]of [[contract.process,processBytes],['source/authoring-contract.json',contractBytes],['tooling/author.mjs',mechanismBytes]]) {
        if(snapshots.get(file)!==digest(bytes))throw Error('Authoring control changed while staging: '+file);
      }
      // The staged predecessor must be the exact version the algebra observed.
      for(const change of changes) {
        if(snapshots.get(change.file)!==change.beforeSha256)throw Error('Source changed while staging: '+change.file);
        fs.writeFileSync(checked(stage,change.file),change.text);
      }
      return {id:path.relative(root,stage).replaceAll('\\','/')};
    },
    'publication.validate':()=>{
      const commands=[['bootstrap/run.cjs','.','dist','bootstrap/site.json'],['--test',...contract.checks]];
      const runs=commands.map(args=>{
        const result=spawnSync(process.execPath,args,{cwd:stage,encoding:'utf8',maxBuffer:8*1024*1024});
        return {command:['node',...args],status:result.status,stdout:result.stdout??'',stderr:result.stderr??'',error:result.error?.message??null};
      });
      fs.writeFileSync(path.join(stage,'validation.json'),JSON.stringify(runs,null,2)+'\n');
      return {ok:runs.every(r=>r.status===0),log:path.relative(root,path.join(stage,'validation.json')).replaceAll('\\','/'),receipt:runs[0].status===0?JSON.parse(fs.readFileSync(path.join(stage,'dist/build-receipt.json'),'utf8')):null};
    },
    'document.commit':({changes})=>{
      // Compare the entire validated input snapshot before any source write.
      for(const [file,hash]of snapshots)if(digest(read(file))!==hash)throw Error('Validated input changed: '+file);
      const originals=changes.map(c=>({file:c.file,bytes:read(c.file)}));
      const written=[];
      try {
        for(const change of changes) {
          const target=checked(root,change.file),temporary=target+'.authoring-tmp';
          fs.writeFileSync(temporary,change.text,{flag:'wx'});
          try {fs.renameSync(temporary,target);}finally {if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
          written.push(change.file);
        }
      }catch(error){for(const original of originals)if(written.includes(original.file))fs.writeFileSync(checked(root,original.file),original.bytes);throw error;}
      return {files:changes.map(c=>({file:c.file,beforeSha256:c.beforeSha256,afterSha256:digest(c.text)}))};
    },
    'receipt.write':({value})=>{
      const receipt={...value,processSha256:digest(processBytes),contractSha256:digest(contractBytes),mechanismSha256:digest(mechanismBytes),candidate:path.relative(root,stage).replaceAll('\\','/')};
      const file=path.join(stage,'authoring-receipt.json');fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n');
      return {path:path.relative(root,file).replaceAll('\\','/'),...receipt};
    }
  };
  try {return (await invoke({model,entry:'author.run',input:{request,contract},ports,limit:contract.budget})).value;}
  finally {fs.closeSync(fd);fs.unlinkSync(lock);}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    if(process.argv.length!==3)throw Error('Usage: node tooling/author.mjs proposal.json');
    console.log(JSON.stringify(await author(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2));
  }catch(error){console.error(error.stack);process.exitCode=1;}
}
