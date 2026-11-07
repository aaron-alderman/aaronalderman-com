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
  'document.entries':()=>options.entries??[{name:'old.cjs',kind:'file'},{name:'unique.log',kind:'file'},{name:'directory.cjs',kind:'directory'}],
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
 const f=fixture(),receipt=await f.run({protocol:'worldwright/clean-verification/1'});assert.equal(receipt.protocol,'worldwright/clean-checkout-receipt/1');assert.ok(!f.calls.some(c=>c[0]==='commit'));const commands=f.calls.find(c=>c[0]==='validate')[1];assert.equal(commands[0].tool,'npm');assert.equal(commands[0].args[0],'ci');assert.equal(commands.filter(c=>c.args[0]==='bootstrap/run.cjs').length,2);assert.ok(commands.some(c=>c.args[0]==='tooling/assess-reading-experience.mjs'&&c.args.includes('--check')));
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

function provenanceFixture(options={}){
 const file='source/questions.rel',old='old REL',next='new REL';
 const proposal={protocol:'worldwright/authoring-proposal/1',apply:false,changes:[{file,beforeSha256:sha(old),text:next}],...options.proposal};
 const raw=options.raw??':100644 100644 '+ 'a'.repeat(40)+' '+'b'.repeat(40)+' M\t'+file+'\n';
 const f=fixture({entries:options.entries??[],files:[[file,old],['.build/provenance/candidate/'+file,options.actual??next],['.build/provenance/candidate/source/authoring/requests/release.proposal',JSON.stringify(proposal)],['.build/provenance/changes.raw',raw]]});
 return {...f,runGate:()=>f.run({protocol:'worldwright/provenance-gate/1',candidate:'.build/provenance/candidate',diff:'.build/provenance/changes.raw',claimedReceipt:{ok:true,approved:true}})};
}
test('publication provenance replays authority and exact bytes without trusting claimed receipts',async()=>{
 const f=provenanceFixture(),r=await f.runGate();assert.equal(r.status,'source-plan-replayed');assert.deepEqual(r.files,['source/questions.rel']);assert.ok(!f.calls.some(c=>['commit','stage','validate'].includes(c[0])));
 for(const [options,code]of [[{actual:'unplanned bytes'},'PROVENANCE-011'],[{proposal:{apply:true}},'PROVENANCE-002'],[{entries:[{name:'escape.mjs',kind:'file'}]},'PROVENANCE-001']])await assert.rejects(provenanceFixture(options).runGate(),new RegExp(code));
 for(const file of ['tooling/reading-experience-observer.mjs','algebra/unowned-image.process.json','algebra/microsite-return.process.json','verification/claimed-approved.json','.github/workflows/pages.yml']){const raw=':100644 100644 '+'a'.repeat(40)+' '+'b'.repeat(40)+' M\t'+file+'\n';await assert.rejects(provenanceFixture({raw}).runGate(),/PROVENANCE-010/);}
 const noProposal=provenanceFixture();noProposal.files.delete('.build/provenance/candidate/source/authoring/requests/release.proposal');await assert.rejects(noProposal.runGate(),/PROVENANCE-005/);
 const omitted=provenanceFixture({raw:':100644 100644 '+'a'.repeat(40)+' '+'b'.repeat(40)+' M\tdist/questions.html\n'});await assert.rejects(omitted.runGate(),/PROVENANCE-012/);
});

function imageEvidenceFixture(change=()=>{}){
 const specs=[['main',6],['christian',6],['dad',4],['sourcerer',4],['author',4],['counterexample-broken',4],['counterexample-size',4]],profiles=['desktop','zoom-200-equivalent','zoom-400-equivalent','text-spacing'];
 const capture={protocol:'worldwright/reading-experience-observations/1',provenance:{evidenceFamily:'test-fixture-not-browser-evidence'},snapshots:specs.flatMap(([id,expected])=>profiles.map(profile=>{
  const rows=Array.from({length:expected},(_,i)=>({n:i+1,kind:'illustration',fit:'cover',loaded:id!=='counterexample-broken',nw:id==='counterexample-broken'?0:1000,nh:id==='counterexample-broken'?0:1500,w:id==='counterexample-size'&&i===1?140:profile==='desktop'?92:65,h:profile==='desktop'?130:96,bounds:true,size:!(id==='counterexample-size'&&i===1),known:true}));
  const failed=rows.filter(r=>!r.loaded||!r.size).length,summary={protocol:'images/1',observed:expected,expected,failed,complete:true};
  return {route:'assurance/images/'+id+'.html',profile,readyState:'complete',fontStatus:'loaded',truncatedBlocks:false,blocks:[{path:'[id="image-assurance-status"]',text:JSON.stringify(summary)},...rows.map((r,i)=>({path:'row-'+i,text:JSON.stringify(r)}))]};
 }))};change(capture);
 const committed=[],ports={...valuePorts(),...computationalPorts(),'document.observe':({file})=>{let text;if(file==='tooling/assurance/reading-experience-capture.json')text=JSON.stringify(capture);else if(file==='tooling/assurance/reading-experience-evidence.json')text=JSON.stringify({browserInput:{capture}});else if(file==='source/assurance/image-verification.encounter')text=fs.readFileSync(file,'utf8');else return {exists:false,sha256:null,text:null};return {exists:true,text,sha256:sha(text)};},'document.commit':({changes})=>{committed.push(...changes);return {files:changes};}};
 return {committed,async run(){return (await invoke({model,entry:'author.run',input:{contract,request:{protocol:'worldwright/images-verify/1'}},ports,limit:contract.budget})).value;}};
}
test('image evidence verifies individual observations and rejects false summaries and lost counterexamples',async()=>{
 const good=imageEvidenceFixture(),report=await good.run();assert.equal(report.status,'browser-observed');assert.equal(report.cases.length,28);assert.equal(report.counts.counterexamplesRejected,8);assert.equal(good.committed.length,1);
 const row=(s,i)=>JSON.parse(s.blocks[i+1].text),save=(s,i,r)=>s.blocks[i+1].text=JSON.stringify(r),summary=s=>JSON.parse(s.blocks[0].text),saveSummary=(s,r)=>s.blocks[0].text=JSON.stringify(r);
 const cases=[
  [c=>c.snapshots.pop(),'IMAGE-EVIDENCE-003'],
  [c=>c.snapshots[0].blocks.pop(),'IMAGE-EVIDENCE-006'],
  [c=>{const s=c.snapshots[0],r=row(s,0);r.loaded=false;r.nw=0;save(s,0,r);},'IMAGE-EVIDENCE-008'],
  [c=>{const s=c.snapshots[0],r=row(s,0);r.w=140;r.size=false;save(s,0,r);const h=summary(s);h.failed=1;saveSummary(s,h);},'IMAGE-EVIDENCE-009'],
  [c=>{const s=c.snapshots.find(s=>s.route.includes('counterexample-size')),r=row(s,1);r.w=s.profile==='desktop'?92:65;r.size=true;save(s,1,r);const h=summary(s);h.failed=0;saveSummary(s,h);},'IMAGE-EVIDENCE-010']
 ];for(const [change,code]of cases)await assert.rejects(imageEvidenceFixture(change).run(),new RegExp(code));
});
