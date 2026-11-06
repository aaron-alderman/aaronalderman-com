const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {createProcessCompiler}=require('../bootstrap/ports/process-source.cjs'),{createKernel}=require('../bootstrap/temple-seed.cjs'),{lower}=require('../bootstrap/ports/algebra-lower.cjs'),{invoke}=require('../bootstrap/ports/programme.cjs'),{valuePorts}=require('../bootstrap/ports/value.cjs'),{computationalPorts}=require('../bootstrap/ports/browser-effects.cjs');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),host={read:async f=>fs.readFileSync(f,'utf8'),digest:sha};
const text=fs.readFileSync('source/process-authoring/candidate.encounter','utf8'),target=read('source/process-authoring/bootstrap.json');
const ready=(async()=>{const compiler=await createProcessCompiler(host,'bootstrap/process-frontend.json'),compiled=await compiler.compile('source/process-authoring/candidate.encounter',text);return{compiler,compiled};})();
const lowerModel=input=>lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit:20000000});
test('whole-module source compiles to exact ordered JSON with no profile or implicit entrypoint',async()=>{
 const {compiled}=await ready;assert.equal(JSON.stringify(compiled.surface),JSON.stringify(target));assert.equal(Object.keys(compiled.surface.queries).length,23);assert.equal(compiled.admitted,false);assert.equal(compiled.scope,'supplied-core-process-candidate');assert.ok(compiled.steps<20000000);assert.equal(compiled.tokens.map(t=>t.text).join(''),text);
});
test('every actual statement has an original-coordinate source origin',async()=>{
 const {compiled}=await ready;const expected=[];function walk(body,pointer){body.forEach((s,i)=>{const p=pointer+'/'+i;expected.push(p);for(const k of ['then','steps','try','catch'])if(s[k])walk(s[k],p+'/'+k);});}for(const [name,body]of Object.entries(target.queries))walk(body,'/queries/'+name);
 const statements=compiled.origins.filter(o=>o.kind==='statement');assert.deepEqual(statements.map(o=>o.pointer).sort(),expected.sort());for(const o of compiled.origins){assert.ok(o.start>=0&&o.end>=o.start&&o.end<=text.length,JSON.stringify(o));}
});
test('the entire lowered module is identical through the existing lowerer',async()=>{
 const {compiled}=await ready;assert.deepEqual(await lowerModel({entry:'sp.present',queries:compiled.surface.queries}),await lowerModel({entry:'sp.present',queries:target.queries}));
});
test('JSON and readable-source legs agree on real documents, formatting, faults and ordered effects',async()=>{
 const {compiled}=await ready,all=Object.assign({},...read('bootstrap/site.json').modules.map(f=>read(f).queries),...read('bootstrap/site.json').processModules.map(s=>read('dist/'+s.output).queries)),bundle=all['hierarchy.viewer.build'].find(s=>s.port==='runtime.bundle').args,names=bundle.queries.slice(1).flatMap(x=>x.slice(1));
 const models=await Promise.all([target,compiled.surface].map(m=>lowerModel({entry:'md.preview',queries:Object.fromEntries(names.map(n=>[n,m.queries[n]??all[n]]))})));
 const presentation=read('source/encounter/presentation.json');
 const cases=[['sp.role',{text:'##',language:'markdown'}],['source.lex',{text:'fold list() as x; a starts list():\r\n  yield $a → a\r\n',language:'process'}],['sp.scan',{text:'("a", "isa", "Thing")\n',language:'rel'}],['md.preview',{text:'# A\n\n| Name | Value |\n| --- | --- |\n| **one** | `two` |\n\n[unsafe](javascript:alert)'}],['md.preview',{text:fs.readFileSync('source/hierarchy-evidence/worldwright-0.md','utf8')}],['sp.expression',{value:['and',['eq','$x',1],['eq','$y','long '.repeat(25)]],depth:0}],['sp.moduleView',{module:target,name:'sp.scan'}],['md.preview',{text:'x'.repeat(160001)}]];
 for(const [entry,eventInput]of cases){const results=[];for(const model of models){const trace=[],raw={...valuePorts(),...computationalPorts()},ports=Object.fromEntries(Object.entries(raw).map(([name,fn])=>[name,async args=>{if(entry!=='sp.moduleView'&&entry!=='md.preview')trace.push([name,args]);return fn(args);} ]));try{const r=await invoke({model,entry,input:{...presentation,eventInput},ports,nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000});results.push({value:r.value,trace});}catch(e){results.push({fault:e.message,trace});}}assert.deepEqual(results[0],results[1],entry);}
});
test('the successor changes only the declared lexer separator and safe record-key formatting',()=>{
 const oracle=read('source/process-authoring/oracle.json');for(const name of Object.keys(oracle.queries))if(!['source.split','sp.expression'].includes(name))assert.deepEqual(target.queries[name],oracle.queries[name],name);
});
test('malformed control syntax, unsafe names, unknown operators and mismatched profile refuse',async()=>{
 const {compiler}=await ready,header='process-module "temple/surface-process-module/1"\nprofile "encounter/shared-source-module/2"\nprocess probe:\n';
 for(const body of ['  fold list() as x; a starts list():\n    let x = 1\n','  assert true\n  otherwise "bad"\n','  try:\n    let x = 1\n  catch e:\n','  call constructor\n','  let x = mystery()\n','  let x = "$literal"\n','\tlet x = 1\n','  yield 1 → x\n','  let x = 1 trailing\n'])await assert.rejects(compiler.compile('refusal.encounter',header+body));
 await assert.rejects(compiler.compile('refusal.encounter',(header+'  let x = 1\n').replace('shared-source-module/2','other')));
});
test('compiler identity refuses changed dependencies before compilation',async()=>{
 await assert.rejects(createProcessCompiler({read:async f=>(await host.read(f))+(f==='algebra/language-process.process.json'?' ':''),digest:sha},'bootstrap/process-frontend.json'),/source drift/);
});

test('linking traverses folds and error handlers and refuses undeclared calls or effects',async()=>{
 const {compiler,compiled}=await ready;
 const all=Object.assign({},...read('bootstrap/site.json').modules.map(f=>read(f).queries),compiled.surface.queries);
 assert.equal((await compiler.link(compiled.surface,all)).value.ok,true);
 for(const programme of [[{call:'missing'}],[{fold:['list'],as:'x',accumulator:'a',initial:0,steps:[{port:'file.write',args:{},into:'x'}],yield:'$a',into:'a'}],[{try:[{let:'x',value:1}],error:'e',catch:[{call:'missing'}]}]])await assert.rejects(compiler.link({queries:{probe:programme}},all));
});

test('a readable source edit changes execution through the existing lowerer and kernel',async()=>{
 const {compiler}=await ready,header='process-module "temple/surface-process-module/1"\nprofile "encounter/shared-source-module/2"\nprocess probe:\n  assert false\n    otherwise "';
 for(const message of ['first source','edited source']){const compiled=await compiler.compile('edited.encounter',header+message+'"\n'),model=await lowerModel({entry:'probe',queries:compiled.surface.queries});await assert.rejects(invoke({model,entry:'probe',input:{},ports:valuePorts(),limit:20000000}),new RegExp(message));}
});

test('the authority switch selects Encounter exclusively and binds generated JSON to its source hash',()=>{
 const manifest=read('bootstrap/site.json'),spec=manifest.processModules[0],contract=read('source/authoring-contract.json'),receipt=read('dist/build-receipt.json');
 assert.equal(spec.file,'source/encounter/source-algebra.encounter');assert.ok(!manifest.modules.includes(spec.output));assert.ok(contract.editable.includes(spec.file));assert.ok(!contract.editable.includes(spec.output));assert.ok(!fs.existsSync(spec.output),'No independently editable root JSON cache');
 assert.equal(receipt.processLanguage[0].sourceHash,sha(fs.readFileSync(spec.file)));assert.equal(receipt.processLanguage[0].moduleHash,sha(fs.readFileSync('dist/'+spec.output)));assert.ok(!receipt.sources[spec.output]);assert.ok(receipt.processLanguage[0].linkSteps>0);
});

test('Inspect displays exact authored characters using compiler ranges rather than regenerated notation',async()=>{
 const {compiler}=await ready,authText='process-module "temple/surface-process-module/1"\nprofile "encounter/shared-source-module/2"\n\nprocess   probe:\n  let answer = 42\n',compiled=await compiler.compile('exact.encounter',authText);
 const all=Object.assign({},...read('bootstrap/site.json').modules.map(f=>read(f).queries),target.queries),bundle=all['hierarchy.viewer.build'].find(s=>s.port==='runtime.bundle').args,names=bundle.queries.slice(1).flatMap(x=>x.slice(1)),model=await lowerModel({entry:'hierarchy.module.select',queries:Object.fromEntries(names.map(n=>[n,all[n]]))}),effects=[];
 await invoke({model,entry:'hierarchy.module.select',input:{data:{presentation:read('source/encounter/presentation.json'),sourceModule:compiled.surface,authorText:authText,sourceOrigins:compiled.origins}},ports:{...valuePorts(),...computationalPorts(),'browser.property':()=> 'probe','browser.content':x=>{effects.push(x);return true},'browser.write':x=>{effects.push(x);return true}},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000});
 assert.ok(effects.find(x=>x.ref==='#module-readable').html.replace(/<[^>]*>/g,'').includes('process   probe'));assert.ok(effects.find(x=>x.ref==='#module-pointer').value.includes('source-algebra.encounter'));
});

