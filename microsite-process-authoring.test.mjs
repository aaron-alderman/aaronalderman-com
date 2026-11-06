import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {parse} from 'parse5';
const require=createRequire(import.meta.url),{createProcessCompiler}=require('./bootstrap/ports/process-source.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{computationalPorts}=require('./bootstrap/ports/browser-effects.cjs'),{readProcessFixture:read}=require('./tooling/read-process-fixture.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),ledger=read('source/process-authoring/batch-03/ledger.json');
const lowerModel=input=>lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit:20000000});
const ready=(async()=>{const results=[];for(const entry of ledger.entries){const compiler=await createProcessCompiler({read:async f=>fs.readFileSync(f,'utf8'),digest:sha},entry.frontend),text=fs.readFileSync(entry.candidate,'utf8'),compiled=await compiler.compile(entry.candidate,text);const archive='source/process-authoring/history/'+entry.originalSha256+'-'+entry.json.split('/').at(-1)+'.txt';const original=JSON.parse(fs.readFileSync(fs.existsSync(entry.json)?entry.json:archive,'utf8'));results.push({entry,compiler,text,compiled,original});}return results;})();
for(const entry of ledger.entries)test(entry.name+': ordered surface, complete lowering and original-coordinate coverage agree',async()=>{
 const {compiled,original,text}= (await ready).find(r=>r.entry.name===entry.name);assert.equal(JSON.stringify(compiled.surface),JSON.stringify(original));const name=Object.keys(original.queries)[0];assert.deepEqual(await lowerModel({entry:name,queries:compiled.surface.queries}),await lowerModel({entry:name,queries:original.queries}));assert.equal(compiled.tokens.map(t=>t.text).join(''),text);
 const statements=[];function visit(body,prefix){body.forEach((step,i)=>{const pointer=prefix+'/'+i;statements.push(pointer);for(const key of ['then','steps','try','catch'])if(step[key])visit(step[key],pointer+'/'+key);});}for(const[name,body]of Object.entries(original.queries))visit(body,'/queries/'+name);assert.deepEqual(compiled.origins.filter(o=>o.kind==='statement').map(o=>o.pointer).sort(),statements.sort());assert.equal(compiled.origins.filter(o=>o.kind==='process-definition').length,entry.queries);
});
test('batch frontends link against the supplied main closure and refuse foreign profiles and effects',async()=>{
 const batch=await ready,manifest=read('bootstrap/site.json'),queries=Object.assign({},...manifest.modules.map(f=>read(f).queries),...manifest.processModules.map(s=>read(s.output).queries),...batch.map(r=>r.compiled.surface.queries));
 for(const r of batch){assert.equal((await r.compiler.link(r.compiled.surface,queries)).value.ok,true);await assert.rejects(r.compiler.compile('foreign.encounter',r.text.replace(read(r.entry.profile).name,'unknown/profile')));await assert.rejects(r.compiler.link({queries:{bad:[{port:'file.remove',args:{},into:'ignored'}]}},queries));}
});
test('empty catch bodies are profile-gated; empty try bodies and malformed indentation still refuse',async()=>{
 const media=(await ready).find(r=>r.entry.name==='microsite-media'),profile=read(media.entry.profile),header='process-module "temple/surface-process-module/1"\nprofile '+JSON.stringify(profile.name)+'\nprocess probe:\n';
 const body='  try:\n    let x = 1\n  catch error:\n';
 const compiled=await media.compiler.compile('empty-catch.encounter',header+body);assert.deepEqual(compiled.surface.queries.probe[0].catch,[]);
 const previous=await createProcessCompiler({read:async f=>fs.readFileSync(f,'utf8'),digest:sha},'bootstrap/frontends/microsite-temple-ui.json');
 await assert.rejects(previous.compile('empty-catch.encounter',(header+body).replace(profile.name,read('source/process-authoring/batch-02/microsite-temple-ui.profile.json').name)),/must not be empty/);
 await assert.rejects(media.compiler.compile('empty-try.encounter',header+'  try:\n  catch error:\n    let x = 1\n'),/must not be empty/);
 await assert.rejects(media.compiler.compile('bad-indent.encounter',header+'  try:\n    let x = 1\n   catch error:\n'));
});
function find(node,predicate){if(predicate(node))return node;for(const child of node.childNodes??[]){const match=find(child,predicate);if(match)return match;}}
const attrs=node=>Object.fromEntries((node.attrs??[]).map(a=>[a.name,a.value])),text=node=>node.value??(node.childNodes??[]).map(text).join('');
function payload(page){const tree=parse(fs.readFileSync(page,'utf8'));return JSON.parse(text(find(tree,n=>attrs(n).id==='module-data')));}
test('ownership is singular and every selected readable module has a source-bound Inspect page',async()=>{
 const manifest=read('bootstrap/site.json'),contract=read('source/authoring-contract.json'),worldwright=fs.readFileSync('dist/inspection/worldwright.html','utf8'),receipt=read('dist/build-receipt.json');
 for(const selection of manifest.processModules){const shared=selection.output==='algebra/encounter-source.process.json',slug=selection.output.replace('algebra/','').replace('.process.json',''),page=shared?'source-algebra.html':'module-'+slug+'.html';assert.ok(worldwright.includes('href="'+page+'"'),page);const p=payload('dist/inspection/'+page);assert.equal(p.sourceFile,selection.file);assert.equal(p.moduleFile,selection.output);assert.equal(p.authorText,fs.readFileSync(selection.file,'utf8'));assert.equal(sha(p.authorText),p.sourceHash);assert.deepEqual(p.sourceModule,read(selection.output));for(const origin of p.sourceOrigins)assert.ok(origin.end<=p.authorText.length);
  assert.equal(receipt.processLanguage.find(e=>e.output===selection.output).sourceHash,sha(p.authorText));
 }
 for(const e of ledger.entries){const owner=manifest.processModules.find(s=>s.output===e.json);if(owner){assert.equal(owner.file,e.source);assert.ok(!manifest.modules.includes(e.json));assert.ok(!fs.existsSync(e.json));assert.ok(contract.editable.includes(e.source));assert.ok(!contract.editable.includes(e.json));assert.equal(fs.readFileSync(e.source,'utf8'),fs.readFileSync(e.candidate,'utf8'));}else{assert.ok(manifest.modules.includes(e.json));assert.equal(sha(fs.readFileSync(e.json)),e.originalSha256);}}
});
test('Inspect uses exact authored slices and refuses stale or undeclared source bindings without executing them',async()=>{
 const manifest=read('bootstrap/site.json'),all=Object.assign({},...manifest.modules.map(f=>read(f).queries),...manifest.processModules.map(s=>read(s.output).queries)),bundle=all['hierarchy.viewer.build'].find(s=>s.port==='runtime.bundle').args,names=bundle.queries.slice(1).flatMap(x=>x.slice(1)),model=await lowerModel({entry:'hierarchy.module.select',queries:Object.fromEntries(names.map(n=>[n,all[n]]))});
 for(const e of ledger.entries){const selection=manifest.processModules.find(s=>s.output===e.json);if(!selection)continue;const p=payload('dist/inspection/module-'+e.name+'.html'),name=Object.keys(p.sourceModule.queries).at(-1),effects=[];
  async function run(value=p,catalogue=[{moduleFile:p.moduleFile,sourceFile:p.sourceFile,sourceHash:p.sourceHash}]){return invoke({model,entry:'hierarchy.module.select',input:{data:{presentation:read('source/encounter/presentation.json'),sourceModule:read('algebra/encounter-source.process.json'),moduleCatalogue:catalogue}},ports:{...valuePorts(),...computationalPorts(),'browser.property':({ref})=>ref==='#module-data'?JSON.stringify(value):name,'browser.write':x=>{effects.push(x);return true},'browser.content':x=>{effects.push(x);return true}},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000});}
  await run();const range=p.sourceOrigins.find(o=>o.kind==='process-definition'&&o.pointer==='/queries/'+name),expected=p.authorText.slice(range.start,range.end);assert.equal(text(parse('<main>'+effects.find(x=>x.ref==='#module-readable').html+'</main>')),expected);assert.ok(effects.find(x=>x.ref==='#module-pointer').value.includes(e.source));effects.length=0;
  await assert.rejects(run({...p,authorText:p.authorText+' ' }),/INSPECT-SOURCE/);assert.equal(effects.length,0);await assert.rejects(run(p,[]),/INSPECT-OWNER/);
 }
});
