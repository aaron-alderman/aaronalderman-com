const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {createProcessCompiler}=require('../bootstrap/ports/process-source.cjs'),{createKernel}=require('../bootstrap/temple-seed.cjs'),{lower}=require('../bootstrap/ports/algebra-lower.cjs'),{invoke}=require('../bootstrap/ports/programme.cjs'),{valuePorts}=require('../bootstrap/ports/value.cjs'),{computationalPorts}=require('../bootstrap/ports/browser-effects.cjs');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),ledger=read('source/process-authoring/batch-02/ledger.json'),host={read:async f=>fs.readFileSync(f,'utf8'),digest:sha};
const lowerModel=input=>lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit:20000000});
const ready=(async()=>{const results=[];for(const entry of ledger.entries){const compiler=await createProcessCompiler(host,entry.frontend),text=fs.readFileSync(entry.candidate,'utf8'),compiled=await compiler.compile(entry.candidate,text);results.push({entry,compiler,text,compiled,oracle:read(entry.oracle)});}return results;})();
for(const pinned of ledger.entries){
 test(pinned.name+': exact ordered JSON, whole lowered module and all original-coordinate statements',async()=>{
  const {entry,compiled,oracle,text}= (await ready).find(r=>r.entry.name===pinned.name);assert.equal(sha(fs.readFileSync(entry.oracle)),entry.originalSha256);assert.equal(JSON.stringify(compiled.surface),JSON.stringify(oracle));assert.equal(compiled.admitted,false);assert.ok(compiled.steps<20000000);assert.equal(compiled.tokens.map(t=>t.text).join(''),text);
  const entrypoint=Object.keys(oracle.queries)[0];assert.deepEqual(await lowerModel({entry:entrypoint,queries:oracle.queries}),await lowerModel({entry:entrypoint,queries:compiled.surface.queries}));
  const expected=[];function walk(body,pointer){body.forEach((s,i)=>{const p=pointer+'/'+i;expected.push(p);for(const k of ['then','steps','try','catch'])if(s[k])walk(s[k],p+'/'+k);});}for(const[name,body]of Object.entries(oracle.queries))walk(body,'/queries/'+name);
  assert.deepEqual(compiled.origins.filter(o=>o.kind==='statement').map(o=>o.pointer).sort(),expected.sort());assert.equal(compiled.origins.filter(o=>o.kind==='process-definition').length,entry.queries);for(const o of compiled.origins)assert.ok(o.start>=0&&o.end>=o.start&&o.end<=text.length);
 });
}
test('all six explicit effect profiles link against the same supplied application closure',async()=>{
 const batch=await ready,m=read('bootstrap/site.json'),all=Object.assign({},...m.modules.map(f=>read(f).queries),...m.processModules.map(s=>read('dist/'+s.output).queries),...batch.map(r=>r.compiled.surface.queries));
 for(const {entry,compiler,compiled}of batch){assert.equal((await compiler.link(compiled.surface,all)).value.ok,true);const p=read(entry.profile);assert.deepEqual(p.directPorts,entry.directPorts);assert.deepEqual(p.operators,entry.operators);}
});
test('each is profile-gated and preserves binding, ordered effects and non-accumulating scope',async()=>{
 const batch=await ready,temple=batch.find(r=>r.entry.name==='microsite-temple-ui'),header='process-module "temple/surface-process-module/1"\nprofile "'+read(temple.entry.profile).name+'"\nprocess probe:\n',body='  let before = "kept"\n  each list("a", "b") as item:\n    port browser.write { ref = "#probe"; name = "textContent"; value = $item } → ignored\n    let before = $item\n  let result = $before\n';
 const compiled=await temple.compiler.compile('each.encounter',header+body),model=await lowerModel({entry:'probe',queries:compiled.surface.queries}),calls=[];
 const result=await invoke({model,entry:'probe',input:{},ports:{...valuePorts(),'browser.write':args=>{calls.push(args);return true;}},limit:20000000});assert.equal(result.value,'kept');assert.deepEqual(calls.map(c=>c.value),['a','b']);
 const old=await createProcessCompiler(host,'bootstrap/process-frontend.json');await assert.rejects(old.compile('refusal.encounter',(header+body).replace(read(temple.entry.profile).name,read('source/process-authoring/profile.json').name)));
 for(const bad of ['  each list() as item:\n','  each list() as constructor:\n    let x = 1\n','  each list() item:\n    let x = 1\n','  each list() as item:\n   let x = 1\n'])await assert.rejects(temple.compiler.compile('refusal.encounter',header+bad));
});
test('module-specific profiles refuse foreign source profiles, effects and undeclared callees',async()=>{
 const batch=await ready,source=batch.find(r=>r.entry.name==='source'),temple=batch.find(r=>r.entry.name==='microsite-temple-ui');
 await assert.rejects(source.compiler.compile(temple.entry.candidate,temple.text));
 await assert.rejects(source.compiler.link({queries:{probe:[{port:'browser.write',args:{},into:'ignored'}]}},{}));
 await assert.rejects(temple.compiler.link({queries:{probe:[{each:['list'],as:'x',steps:[{call:'missing'}]}]}},{}));
});
test('JSON and candidate UI legs preserve ordered DOM/state effects, recipe values and crypto refusal',async()=>{
 const batch=await ready,m=read('bootstrap/site.json'),original=Object.assign({},...m.modules.map(f=>read(f).queries),...m.processModules.map(s=>read('dist/'+s.output).queries),...batch.map(r=>r.oracle.queries)),candidate={...original,...Object.assign({},...batch.map(r=>r.compiled.surface.queries))};
 const roots=['ui.sourcery.init','ui.temple.init','ui.temple.recipe','ui.temple.preview','lamp.createWorld'];
 function closure(all){const pending=[...roots],selected={};function visit(body){for(const s of body){if(s.call)pending.push(s.call);if(s.port==='kernel.invoke')pending.push(s.args.query);for(const k of ['then','steps','try','catch'])if(s[k])visit(s[k]);}}while(pending.length){const name=pending.pop();if(Object.hasOwn(selected,name))continue;assert.equal(typeof name,'string');assert.ok(all[name],name);selected[name]=all[name];visit(all[name]);}return selected;}
 const models=await Promise.all([original,candidate].map(all=>lowerModel({entry:roots[0],queries:closure(all)}))),configuration=read('source/microsites/temple/config.json');
 const results=[];for(const model of models){const state=new Map([['configuration',structuredClone(configuration)]]),trace=[],ports={...valuePorts(),...computationalPorts(),'state.get':({key})=>{trace.push(['get',key]);return state.get(key)},'state.set':({key,value})=>{trace.push(['set',key,structuredClone(value)]);state.set(key,value);return true},'browser.environment':()=>({crypto:true,reduced:false,width:900,height:700}),'browser.read':({ref})=>{trace.push(['read',ref]);return {value:ref.includes('preset')?'tend':ref.includes('identity')?'steward':ref==='#note-text'?'A note.':'',checked:false,disabled:false,attributes:{}}},'browser.select':({selector})=>{trace.push(['select',selector]);return selector==='.preset'?configuration.presets.map(p=>({ref:'preset-'+p.id,attributes:{'data-preset':p.id}})):[]},'clock.read':()=>1000};
 for(const entry of batch.filter(r=>r.entry.name.includes('ui')).flatMap(r=>r.entry.directPorts).filter(n=>n.startsWith('browser.')))if(!ports[entry])ports[entry]=args=>{trace.push([entry,structuredClone(args)]);return true};
 const call=async(entry,eventInput={},extra={})=>invoke({model,entry,input:{eventInput},ports:{...ports,...extra},nested:['kernel.invoke'],limit:20000000});
 await call('ui.sourcery.init');const recipe=(await call('ui.temple.recipe')).value;await call('ui.temple.init',{}, {'browser.environment':()=>({crypto:false,reduced:false})});await call('ui.temple.init');results.push({recipe,state:[...state],trace});}
 assert.deepEqual(results[0],results[1]);assert.ok(results[0].trace.some(c=>c[0]==='browser.class'));assert.ok(results[0].trace.some(c=>c[0]==='select'&&c[1]==='.preset'));
});
test('the pre-switch JSON owner or post-switch Encounter owner is explicit, never a fallback',async()=>{
 const batch=await ready,m=read('bootstrap/site.json'),contract=read('source/authoring-contract.json');
 for(const {entry,compiler}of batch){const owner=m.processModules.find(s=>s.output===entry.json);if(!owner){assert.ok(m.modules.includes(entry.json));assert.equal(sha(fs.readFileSync(entry.json)),entry.originalSha256);continue;}
  assert.equal(owner.file,entry.source);assert.ok(!m.modules.includes(entry.json));assert.ok(!fs.existsSync(entry.json));assert.ok(contract.editable.includes(entry.source));assert.ok(!contract.editable.includes(entry.json));const compiled=await compiler.compile(entry.source,fs.readFileSync(entry.source,'utf8'));assert.equal(JSON.stringify(compiled.surface),JSON.stringify(read('dist/'+entry.json)));const receipt=read('dist/build-receipt.json').processLanguage.find(r=>r.output===entry.json);assert.equal(receipt.sourceHash,sha(fs.readFileSync(entry.source)));assert.equal(receipt.moduleHash,sha(fs.readFileSync('dist/'+entry.json)));}
});
module.exports={ready};
