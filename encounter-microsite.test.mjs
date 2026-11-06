import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {readProcessFixture:read}=require('./tooling/read-process-fixture.cjs');
const {createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs'),{computationalPorts}=require('./bootstrap/ports/browser-effects.cjs');
const manifest=read('bootstrap/site.json'),all=Object.assign({},...manifest.modules.map(f=>read(f).queries),...(manifest.processModules??[]).map(s=>read('dist/'+s.output).queries)),args=read('algebra/encounter.process.json').queries['encounter.build'].find(s=>s.port==='runtime.bundle').args;
const names=[...args.queries[1].slice(1),...args.queries[2].slice(1)],surface={entry:'encounter.demo.boot',queries:Object.fromEntries(names.map(n=>[n,all[n]]))};
const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:surface,mode:'model',ports:valuePorts(),limit:20000000});
const inputs=read('source/encounter/example.json'),presentation=read('source/encounter/presentation.json'),data={inputs,presentation,processes:all};const run=(entry,eventInput,extra={},ports={})=>invoke({model,entry,input:{eventInput,data,...extra},ports:{...valuePorts(),...computationalPorts(),...ports},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000});
const prepared=()=>run('ec.prepare',inputs).then(r=>r.value),panels=async candidate=>(await run('ec.run',{candidate})).value;

test('microsite and every declared event root admit against the existing kernel and grants',async()=>{
 const target={...model,entry:'roots',queries:{...model.queries,roots:names.map(call=>({call}))}};
 for(const entry of ['admit.model','admit.effects']){const r=await run(entry,{}, {target,profile:inputs.profile,grants:read('bootstrap/ports.json').profiles.encounterBrowser});assert.equal(r.value.ok,true);}
});
test('the live title edit uses the original patch contract and updates exactly its source-derived views',async()=>{
 const original=await prepared(),before=await panels(original),changed=(await run('encounter.demo.change',{candidate:original,value:'The part I missed'})).value;
 const page=changed.projections.find(x=>x.output.type==='Page'),web=changed.projections.find(x=>x.output.type==='WebLink'),row=changed.projections.find(x=>x.output.type==='MainframeRow');
 assert.equal(page.values['P.title'],'The part I missed');assert.equal(row.values['N.label'],'The part I missed');assert.equal(web.values['N.label'],'The story');assert.match(changed.candidate.inputs.factText,/The part I missed/);assert.equal(original.inputs.factText,inputs.factText);assert.deepEqual(await panels(original),before);
 assert.equal(changed.destination.kind,'source');
});
test('wrong value types and fields without a declared inverse route refuse',async()=>{
 const candidate=await prepared(),projection=(await panels(candidate)).find(x=>x.output.type==='Page');
 await assert.rejects(run('encounter.demo.change',{candidate,value:42}),/EC-E010/);
 await assert.rejects(run('ec.patch',{candidate,projection,field:'P.route',value:'elsewhere.html'}),/EC-E011/);
 assert.equal(candidate.inputs.factText,inputs.factText);
});
test('every inspector selection exposes the current exact text and a shared highlighted projection',async()=>{
 const candidate=await prepared();for(const selection of ['meaning','facts','contract','process','inspector']){
 const source=(await run('encounter.demo.source',{candidate,selection})).value;
 assert.equal(source.hash,await computationalPorts()['digest.sha256']({text:source.text}));
 const view=await run('sp.present',{text:source.text,file:source.file,language:source.language,theme:'dark',expectedHash:source.hash,lineNumbers:true,selectedLine:null,origin:{file:source.file}},{...presentation});
 const text=t=>typeof t==='string'?t:(t.children??[]).map(text).join('');assert.equal(text(view.value.tree),source.text);if(selection==='process')assert.match(source.text,/ec.patch/);
 }
 const changed=(await run('encounter.demo.change',{candidate,value:'A different account'})).value;
 const source=(await run('encounter.demo.source',{candidate:changed.candidate,selection:'facts'})).value;assert.match(source.text,/A different account/);
});
test('boot, edit, inspection and reset share one session and preserve the accepted candidate on refusal',async()=>{
 const state=new Map(),effects=[],values={'#encounter-title':'A changed title'};
 const ports={'state.get':({key})=>state.get(key),'state.set':({key,value})=>state.set(key,value),'browser.on':()=>true,'browser.property':({ref,name})=>values[ref],'browser.write':x=>{effects.push(x);if(x.name==='value')values[x.ref]=x.value;return true},'browser.attribute':x=>{effects.push(x);return true},'browser.content':x=>{effects.push(x);return true}};
 await run('encounter.demo.boot',{}, {},ports);values['#encounter-title']='A changed title';await run('encounter.demo.apply',{}, {},ports);assert.match(state.get('candidate').inputs.factText,/A changed title/);assert.equal(state.get('selection'),'facts');assert.ok(effects.some(x=>x.ref==='#encounter-source'&&x.html.includes('A changed title')));
 const accepted=state.get('candidate');values['#encounter-title']=false;await run('encounter.demo.apply',{}, {},ports);assert.deepEqual(state.get('candidate'),accepted);assert.match(state.get('notice'),/Refused/);
 await run('encounter.demo.reset',{}, {},ports);assert.equal(state.get('candidate').inputs.factText,inputs.factText);
});
test('the source owners reuse the retained compiler and leave the original microsites intact',()=>{
 for(const name of ['types','compiler','runtime'])assert.deepEqual(read('algebra/encounter-code-'+name+'.process.json'),read('retained/workshop/sources/algebra/encounter-code-'+name+'.process.json'));
 for(const file of ['temple/index.html','sourcery/index.html','claimipedia/index.html'])assert.ok(fs.existsSync('dist/'+file));
 assert.equal(manifest.executionBudget,20000000);assert.equal(args.grantProfile,'encounterBrowser');
});
