import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {loadAuthorModel,checked,fingerprint} from './tooling/author.mjs';
const require=createRequire(import.meta.url),{invoke}=require('./bootstrap/ports/programme.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{computationalPorts}=require('./bootstrap/ports/browser-effects.cjs');
const {createProcessCompiler}=require('./bootstrap/ports/process-source.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const contract=read('source/authoring-contract.json'),{model}=await loadAuthorModel(contract);
const original={protocol:'temple/surface-process-module/1',queries:{example:[{let:'result',value:42}]}};
const json='algebra/example.process.json',source='source/example.encounter',frontend=contract.migration.frontends[0],before=JSON.stringify(original),text='a candidate source',hash=sha(before);
const migration={protocol:'worldwright/source-migration/1',apply:true,transitions:[{json,source,frontend,beforeSha256:hash,frontendSha256:sha('frontend'),text}]};
function fixture(options={}){
 const selected=structuredClone(contract);selected.editable.push(json);selected.owners.applicationProcesses.push(json);
 const files=new Map([['source/authoring-contract.json',JSON.stringify(selected)],[json,before],[frontend,'frontend'],...selected.migration.manifests.map(file=>[file,JSON.stringify({modules:[json,'other.json'],processModules:[],unchanged:true})]),['.build/old.cjs','// exact historical evidence\r\n']]);
 if(options.files)for(const [file,value]of options.files)files.set(file,value);
 const calls=[];
 const ports={...valuePorts(),...computationalPorts(),
  'document.observe':({file})=>files.has(file)?{exists:true,text:files.get(file),sha256:sha(files.get(file))}:{exists:false,text:null,sha256:null},
  'document.entries':()=>[{name:'old.cjs',kind:'file'},{name:'unique.log',kind:'file'},{name:'directory.cjs',kind:'directory'}],
  'process.compile':()=>({surface:options.surface??original,sourceHash:sha(text)}),
  'process.lower':({model})=>{calls.push(['lower',model]);return options.differentLowering&&calls.filter(c=>c[0]==='lower').length===2?{different:true}:model;},
  'publication.stage':args=>{calls.push(['stage',args]);return {id:'candidate'};},
  'publication.validate':({commands})=>{calls.push(['validate',commands]);return options.validation??{ok:true,runs:commands.map(command=>({command:[command.tool,...command.args],status:0,error:null}))};},
  'document.commit':args=>{calls.push(['commit',args]);return {files:args.changes};},
  'checkout.stage':()=>options.checkout??{clean:true,revision:'revision',excludedBuild:true,excludedDependencies:true,excludedOutput:true},
  'receipt.write':args=>{calls.push(['receipt',args]);return args.value;}
 };
 return {files,calls,contract:selected,async run(request,entry='author.run',extra={}){return (await invoke({model,entry,input:{request,contract:selected,...extra},ports,limit:contract.budget})).value;}};
}
test('source ownership switches only after ordered module and lowering correspondence, then validation',async()=>{
 const f=fixture(),result=await f.run(migration),changes=f.calls.find(c=>c[0]==='stage')[1].changes;
 assert.deepEqual(f.calls.map(c=>c[0]),['lower','lower','stage','validate','commit','receipt']);assert.equal(result.applied,true);
 assert.equal(changes.find(c=>c.file===json).text,null);assert.equal(changes.find(c=>c.file===source).beforeSha256,null);
 const archive=changes.find(c=>c.file.startsWith(contract.migration.archiveRoot));assert.equal(archive.text,before);assert.ok(archive.file.includes(hash));
 for(const file of contract.migration.manifests){const manifest=JSON.parse(changes.find(c=>c.file===file).text);assert.deepEqual(manifest.modules,['other.json']);assert.deepEqual(manifest.processModules,[{file:source,output:json,frontend}]);assert.equal(manifest.unchanged,true);}
 const next=JSON.parse(changes.find(c=>c.file==='source/authoring-contract.json').text);assert.ok(!next.editable.includes(json));assert.ok(next.editable.includes(source));assert.deepEqual(next.grants,contract.grants);assert.equal(next.budget,contract.budget);
});
test('stale, ambiguous, undeclared and non-corresponding migrations cannot stage',async()=>{
 const cases=[
  [{...migration,transitions:[]},{},'MIGRATE-001'],
  [{...migration,transitions:[{...migration.transitions[0],beforeSha256:'stale'}]},{},'MIGRATE-007'],
  [{...migration,transitions:[{...migration.transitions[0],frontendSha256:'stale'}]},{},'MIGRATE-008'],
  [{...migration,transitions:[{...migration.transitions[0],frontend:'undeclared'}]},{},'MIGRATE-006'],
  [{...migration,transitions:[{...migration.transitions[0],source:'source/../escape.encounter'}]},{},'MIGRATE-005'],
  [migration,{files:[[source,'existing owner']]},'MIGRATE-009'],
  [migration,{surface:{...original,queries:{different:[]}}},'MIGRATE-011'],
  [migration,{differentLowering:true},'MIGRATE-013'],
  [{...migration,transitions:[migration.transitions[0],migration.transitions[0]]},{},'MIGRATE-004'],
  [migration,{files:[[contract.migration.manifests[0],JSON.stringify({modules:[],processModules:[]})]]},'MIGRATE-014'],
  [migration,{files:[[contract.migration.manifests[0],JSON.stringify({modules:[json],processModules:[{file:source,output:json}]})]]},'MIGRATE-015']
 ];
 for(const [request,options,code]of cases){const f=fixture(options);await assert.rejects(f.run(request),new RegExp(code));assert.ok(!f.calls.some(c=>c[0]==='stage'),code);}
});
test('all six retained predecessors pass the actual authoring algebra, shared frontend and whole-module lowerer',async()=>{
 const entries=read('source/process-authoring/batch-02/ledger.json').entries;
 const selected=structuredClone(contract),files=new Map(),transitions=[];
 for(const entry of entries){
  selected.editable.push(entry.json);selected.owners.applicationProcesses.push(entry.json);
  const original=fs.readFileSync(entry.oracle,'utf8'),frontendBytes=fs.readFileSync(entry.frontend,'utf8');
  files.set(entry.json,original);files.set(entry.frontend,frontendBytes);
  transitions.push({json:entry.json,source:entry.source,frontend:entry.frontend,beforeSha256:sha(original),frontendSha256:sha(frontendBytes),text:fs.readFileSync(entry.candidate,'utf8')});
 }
 files.set('source/authoring-contract.json',JSON.stringify(selected));
 for(const file of selected.migration.manifests)files.set(file,JSON.stringify({modules:entries.map(e=>e.json),processModules:[]}));
 const ports={...valuePorts(),...computationalPorts(),
  'document.observe':({file})=>files.has(file)?{exists:true,sha256:sha(files.get(file)),text:files.get(file)}:{exists:false,sha256:null,text:null},
  'process.compile':async({frontend,file,text})=>(await createProcessCompiler({read:async file=>fs.readFileSync(file,'utf8'),digest:sha},frontend)).compile(file,text),
  'process.lower':({model})=>lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:model,mode:'model',ports:valuePorts(),limit:contract.budget})
 };
 const result=(await invoke({model,entry:'author.migration.prepare',input:{contract:selected,request:{protocol:'worldwright/source-migration/1',apply:false,transitions}},ports,limit:contract.budget})).value;
 assert.equal(result.evidence.length,6);assert.ok(result.evidence.every(e=>e.orderedJson&&e.loweredEquality));
 assert.equal(result.changes.filter(c=>c.text===null).length,6);
 const next=JSON.parse(result.changes.find(c=>c.file===selected.migration.manifests[0]).text);assert.deepEqual(next.modules,[]);assert.equal(next.processModules.length,6);
});
test('acceptance matches command identity, count, exit status and error rather than PASS strings or ok flags',async()=>{
 const commands=(await fixture().run({},'author.commands'));
 const good=commands.map(c=>({command:[c.tool,...c.args],status:0,error:null}));
 for(const runs of [[],good.slice(1),good.map((r,i)=>i===0?{...r,status:1,stdout:'PASS all checks'}:r),good.map((r,i)=>i===0?{...r,error:'failed to launch'}:r),good.map((r,i)=>i===0?{...r,command:['unrelated']}:r)]){
  const f=fixture({validation:{ok:true,runs}});await assert.rejects(f.run(migration),/AUTHOR-011/);assert.ok(!f.calls.some(c=>c[0]==='commit'));
 }
});
test('retirement preserves exact helper bytes before deletion and ignores logs/directories',async()=>{
 const f=fixture(),result=await f.run({protocol:'worldwright/retire-helpers/1',apply:true}),changes=f.calls.find(c=>c[0]==='stage')[1].changes;
 const contents=f.files.get('.build/old.cjs'),archived=changes[0];assert.equal(archived.text,contents);assert.ok(archived.file.includes(sha(contents)));assert.deepEqual(changes[1],{file:'.build/old.cjs',beforeSha256:sha(contents),text:null});
 const index=JSON.parse(changes.at(-1).text);assert.equal(index.items.length,1);assert.equal(index.items[0].sha256,sha(contents));assert.equal(changes.length,3);
});
test('archive collisions refuse retirement and source switching before validation',async()=>{
 const name=contract.retirement.archiveRoot+'/'+sha('// exact historical evidence\r\n')+'-old.cjs.txt';
 const f=fixture({files:[[name,'different bytes']]});await assert.rejects(f.run({protocol:'worldwright/retire-helpers/1',apply:true}),/RETIRE-002/);assert.ok(!f.calls.some(c=>c[0]==='stage'));
 const archive=contract.migration.archiveRoot+'/'+hash+'-example.process.json.txt',g=fixture({files:[[archive,'different bytes']]});await assert.rejects(g.run(migration),/MIGRATE-016/);
});
test('clean verification requires a clean revision and absent build, installed dependencies and generated output',async()=>{
 for(const [checkout,code]of [[{clean:false},'CLEAN-001'],[{clean:true,excludedBuild:false,excludedDependencies:true,excludedOutput:true},'CLEAN-002']]){const f=fixture({checkout});await assert.rejects(f.run({protocol:'worldwright/clean-verification/1'}),new RegExp(code));assert.ok(!f.calls.some(c=>c[0]==='validate'));}
 const f=fixture(),receipt=await f.run({protocol:'worldwright/clean-verification/1'});assert.equal(receipt.protocol,'worldwright/clean-checkout-receipt/1');assert.ok(!f.calls.some(c=>c[0]==='commit'));const commands=f.calls.find(c=>c[0]==='validate')[1];assert.equal(commands[0].tool,'npm');assert.equal(commands[0].args[0],'ci');assert.equal(commands[1].args[0],'bootstrap/run.cjs');
});
test('normal verification has no .build input and does not rewrite presentation evidence',()=>{
 assert.deepEqual([...contract.checks].sort(),fs.readdirSync('.').filter(f=>f.endsWith('.test.mjs')).sort(),'Every repository test belongs to the declared verification set');
 assert.equal(read('package.json').scripts.test,'npm run test:portable');assert.equal(read('package.json').scripts['test:portable'],'node --test '+contract.checks.join(' '));
 const helper=fs.readFileSync('tooling/read-process-fixture.cjs','utf8');assert.ok(!helper.includes('.build'));assert.ok(!helper.includes('BATCH_PROCESS_LEG'));
 const file='source/microsites/presentation-correspondence.json',before=fs.readFileSync(file);
 const result=spawnSync(process.execPath,['tooling/verify-microsite-presentation.mjs','dist'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).pages.length,4);assert.deepEqual(fs.readFileSync(file),before);assert.equal(read('package.json').devDependencies.parse5,'7.3.0');
 assert.throws(()=>checked(process.cwd(),'../outside'),/escapes/);
});
test('snapshot comparison hashes binary input bytes and distinguishes an absent creation target',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'encounter-binary-snapshot-')),bytes=Buffer.from([0,255,128,1,254]),file='input.png';
 fs.writeFileSync(path.join(directory,file),bytes);assert.equal(fingerprint(directory,file),sha(bytes));assert.equal(fingerprint(directory,'not-created.txt'),null);
 fs.writeFileSync(path.join(directory,file),Buffer.from([0,255,128,2,254]));assert.notEqual(fingerprint(directory,file),sha(bytes));
 fs.unlinkSync(path.join(directory,file));fs.rmdirSync(directory);
});
test('retired helpers remain hashed evidence with no active executable counterpart',()=>{
 assert.ok(fs.existsSync(contract.retirement.index),'Retirement evidence must accompany the repaired workflow');
 const evidence=read(contract.retirement.index);assert.ok(evidence.items.length>0);
 for(const item of evidence.items){assert.equal(sha(fs.readFileSync(item.archive)),item.sha256);assert.ok(item.archive.endsWith('.txt'));assert.ok(!fs.existsSync(item.original));}
});
