import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {parse,parseFragment} from 'parse5';
const require=createRequire(import.meta.url),read=f=>JSON.parse(fs.readFileSync(f)),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const {lower}=require('./bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const surface=read('algebra/stylesheet.process.json'),contract=read('source/stylesheets/contract.json');
const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{...surface,queries:{...surface.queries,'html.escape':read('algebra/html.process.json').queries['html.escape']},entry:'stylesheet.render'},mode:'model',ports:valuePorts(),limit:20000000});
const render=async input=>(await invoke({model,entry:'stylesheet.render',input:{input},ports:valuePorts(),limit:20000000})).value;
const projectActivities=async bindings=>(await invoke({model,entry:'stylesheet.activities',input:{input:read(contract.inline.htmlOwner)},ports:{...valuePorts(),'file.copy':()=>true,'file.read':()=>JSON.stringify(bindings??read(contract.inline.source))},limit:20000000})).value;

test('all stylesheet trees reproduce their outputs and keep captured comparison bytes intact',async()=>{
 for(const sheet of contract.stylesheets){
  const source=fs.readFileSync(sheet.source),fixture=fs.readFileSync(sheet.comparison),projected=await render(JSON.parse(source).root);
  assert.equal(sha(fixture),sheet.sha256,sheet.comparison);
  if(sha(source)===sheet.capturedTreeSha256)assert.equal(projected,fixture.toString('utf8'),sheet.source+' capture correspondence');
  for(const output of sheet.outputs)assert.equal(fs.readFileSync('dist/'+output,'utf8'),projected,output);
 }
});

test('editing a structured declaration changes its projection',async()=>{
 const declaration={kind:'decl',property:'gap',between:':',value:'20px',important:'',semicolon:';'};
 const root={kind:'root',children:[{kind:'rule',selector:'.reader-header',between:'',after:'',ownSemicolon:'',children:[declaration]}]};
 assert.equal(await render(root),'.reader-header{gap:20px;}');declaration.value='37px';
 assert.equal(await render(root),'.reader-header{gap:37px;}');
});

test('unknown or opaque stylesheet nodes are refused rather than copied as raw CSS',async()=>{
 for(const kind of ['raw','text','stylesheet','javascript'])await assert.rejects(render({kind,text:'body{color:red}'}),/CSS-001/);
 for(const field of ['before','after'])await assert.rejects(render({kind:'root',children:[],[field]:'body{color:red}'}),/CSS-003/);
 const writes=[];
 await assert.rejects(invoke({model,entry:'stylesheet.build',input:{},ports:{...valuePorts(),'file.copy':()=>true,'file.read':()=>JSON.stringify({protocol:'raw-css/1',root:{kind:'raw'}}),'file.write':args=>writes.push(args)},limit:20000000}),/CSS-002/);assert.deepEqual(writes,[]);
});

test('every published stylesheet has an algebra owner and no captured CSS is an active build input',()=>{
 const receipt=read('dist/build-receipt.json'),author=read('source/authoring-contract.json');
 const actual=Object.keys(receipt.artifacts).filter(f=>f.endsWith('.css')).sort(),owned=[...contract.stylesheets.flatMap(s=>s.outputs),...Object.keys(contract.existingProjections)].sort();
 assert.deepEqual(actual,owned);assert.ok(!Object.keys(receipt.sources).some(f=>f.endsWith('.css')));
 for(const sheet of contract.stylesheets){assert.equal(receipt.sources[sheet.source],sha(fs.readFileSync(sheet.source)));assert.ok(author.editable.includes(sheet.source));assert.ok(!receipt.sources[sheet.comparison]);}
 assert.ok(!author.editable.includes('source/reader/reader.css'));assert.ok(author.editable.includes(contract.renderer));
 assert.equal(receipt.sources[contract.inline.source],sha(fs.readFileSync(contract.inline.source)));assert.ok(author.editable.includes(contract.inline.source));assert.ok(!receipt.sources[contract.inline.comparison]);
 assert.deepEqual(receipt.nativeSources,read('source/publication-contract.json').nativeSuccessor.sha256);assert.equal(receipt.execution.limit,20000000);assert.ok(receipt.execution.totalSteps<receipt.execution.limit);
});

test('inline artwork styles are projected by algebra with exact correspondence for the captured source version',async()=>{
 const original=read(contract.inline.comparison),input=read(contract.inline.htmlOwner),bindings=read(contract.inline.source),projected=await projectActivities();let count=0;
 const unchanged=sha(fs.readFileSync(contract.inline.source))===contract.inline.capturedTreeSha256&&sha(fs.readFileSync(contract.inline.htmlOwner))===contract.inline.capturedHtmlSha256;
 assert.equal(sha(fs.readFileSync(contract.inline.comparison)),contract.inline.sha256);
 for(const [id,activity]of Object.entries(input.activities)){
  const expected=new Set((bindings.bindings[id]??[]).map(b=>b.placeholder));
  const visit=node=>{for(const attribute of node.attrs??[])if(attribute.name==='style'){assert.match(attribute.value,/^__CSS_\w+_\d+__$/);assert.ok(expected.delete(attribute.value),id);count++;}assert.notEqual(node.tagName,'style',id+' has no opaque style block');for(const child of node.childNodes??[])visit(child);if(node.content)visit(node.content);};visit(parseFragment(activity.html));assert.equal(expected.size,0,id+' has no unused binding');
  if(unchanged)assert.equal(projected.activities[id].html,original.activities[id].html,id);
 }
 assert.equal(count,Object.values(bindings.bindings).reduce((n,items)=>n+items.length,0));if(unchanged)assert.equal(count,contract.inline.capturedBindings);
});

test('reader and workshop document templates cannot introduce raw CSS blocks or attributes',()=>{
 for(const file of ['source/reader/document.html','source/reader/activity.html','source/workshop/document.html']){
  const visit=node=>{assert.notEqual(node.tagName,'style',file);assert.ok(!(node.attrs??[]).some(a=>a.name==='style'),file);for(const child of node.childNodes??[])visit(child);if(node.content)visit(node.content);};visit(parse(fs.readFileSync(file,'utf8')));
 }
});

test('inline declaration edits use HTML attribute escaping',async()=>{
 const bindings=read(contract.inline.source),declaration=bindings.bindings.sourcery[0].declarations[0];
 declaration.property='background-image';declaration.value='url("x&y")';
 const projected=await projectActivities(bindings);assert.ok(projected.activities.sourcery.html.includes('style="background-image:url(&quot;x&amp;y&quot;)"'));
});

test('the published activity runtime receives fully projected artwork rather than CSS placeholders',async()=>{
 const source=fs.readFileSync('dist/reader/activity-runtime.js','utf8'),prefix='\nconst model=hydrateSnapshot(',start=source.indexOf(prefix);assert.ok(start>=0);
 const literal=source.slice(start+prefix.length).match(/^"(?:[^"\\]|\\.)*"/)[0],runtime=JSON.parse(JSON.parse(literal)),projected=await projectActivities();
 for(const [id,activity]of Object.entries(projected.activities))assert.equal(runtime.data.activities[id].html,activity.html,id);
});
