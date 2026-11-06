import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const {createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{computationalPorts}=require('./bootstrap/ports/browser-effects.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const proposal=process.env.DOCUMENT_PROPOSAL?read(process.env.DOCUMENT_PROPOSAL):null;
const source=p=>{const change=proposal?.changes.find(c=>c.file===p);return change?JSON.parse(change.text):read(p==='algebra/encounter-source.process.json'?'dist/'+p:p)};
const queries=Object.assign({},...read('bootstrap/site.json').modules.map(p=>source(p).queries),...read('bootstrap/site.json').processModules.map(s=>source(s.output).queries));
const names=[...queries['hierarchy.viewer.build'].find(s=>s.port==='runtime.bundle').args.queries.slice(1).flatMap(x=>x.slice(1))];
const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry:'md.preview',queries:Object.fromEntries(names.map(n=>[n,queries[n]]))},mode:'model',ports:valuePorts(),limit:20000000});
const policy=source('source/encounter/presentation.json');
const run=async(entry,eventInput)=>(await invoke({model,entry,input:{...policy,eventInput,input:eventInput},ports:{...valuePorts(),...computationalPorts()},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000})).value;
const html=async(text)=>run('html.serialize',await run('md.preview',{text}));
test('real Worldwright Markdown projects headings, two tables, strong text and honest source-relative links',async()=>{
 const tree=await run('md.preview',{text:fs.readFileSync('source/hierarchy-evidence/worldwright-0.md','utf8')});
 const out=await run('html.serialize',tree);
 assert.ok(out.includes('<h1>Worldwright storytelling exposition</h1>'));
 assert.equal((out.match(/<table>/g)||[]).length,2);
 assert.ok(out.includes('<strong>Date:</strong>'));assert.ok(out.includes('<th scope="col">Document</th>'));
 assert.ok(out.includes('href="https://aaron-alderman.github.io/halloween-monster-hunt/"'));
 assert.ok(out.includes('[source: symmetry-exposition.md]'));assert.ok(!out.includes('href="symmetry-exposition.md"'));
});
test('Markdown projection preserves fenced blank lines, lists, quotes and literal unsafe markup',async()=>{
 const out=await html('# Title\n\n- one\n- two\n\n1. first\n2. second\n\n> quote\n\n```json\n{"x":1}\n\n{"y":2}\n```\n\n<script>alert(1)</script> [bad](javascript:alert)');
 assert.ok(out.includes('<ul><li>one</li><li>two</li></ul>'));assert.ok(out.includes('<ol><li>first</li><li>second</li></ol>'));
 assert.ok(out.includes('<blockquote>quote</blockquote>'));assert.ok(out.includes('md-code'));
 assert.ok(out.includes('&lt;script&gt;'));assert.ok(!out.includes('<script>'));assert.ok(!out.includes('href="javascript:'));
});
test('shared Markdown lexer preserves every source code unit and gives syntax real roles',async()=>{
 const text=fs.readFileSync('source/hierarchy-evidence/worldwright-0.md','utf8');
 const tokens=await run('source.lex',{text,language:'markdown'});assert.equal(tokens.tokens.map(t=>t.text).join(''),text);
 assert.equal(await run('sp.role',{text:'##',language:'markdown'}),'keyword');
 assert.equal(await run('sp.role',{text:'[word](https://example.com)',language:'markdown'}),'reference');
 const rendered=await run('sp.present',{text,file:'README.md',language:'auto',theme:'dark',expectedHash:crypto.createHash('sha256').update(text).digest('hex'),lineNumbers:true,selectedLine:null,origin:{scope:'test'}});
 assert.equal(rendered.language,'markdown');assert.equal(rendered.segments.map(s=>s.text).join(''),text);assert.ok(rendered.segments.some(s=>s.role==='keyword'));assert.ok(rendered.segments.some(s=>s.role==='reference'));assert.equal(rendered.diagnostic,null);
});
test('readable expression layout breaks long groups without modifying its input model',async()=>{
 const value=['and',['eq','$a','first'],['eq','$b','a long value '.repeat(8)],['eq','$c',true]],before=JSON.stringify(value);
 const out=await run('sp.expression',{value,depth:0});assert.ok(out.includes('\n  eq('));assert.equal(JSON.stringify(value),before);
 assert.equal(await run('sp.expression',{value:['eq','$a',1],depth:0}),'eq($a, 1)');
});
test('Markdown projection refuses documents outside its declared bounds',async()=>{
 await assert.rejects(run('md.preview',{text:'x'.repeat(160001)}),/MD-BOUND/);
 await assert.rejects(run('md.preview',{text:'x\n'.repeat(2001)}),/MD-LINES/);
});

test('every source query has a readable definition and exact structural statement coordinates',async()=>{
 const module=source('algebra/encounter-source.process.json'),before=JSON.stringify(module);
 const forms=new Set();
 for(const [name,programme]of Object.entries(module.queries)){
  const view=await run('sp.moduleView',{module,name});assert.ok(view.text.startsWith('process '+name+':\n  '));assert.equal(view.pointer,'/queries/'+name);
  const expected=[];function walk(body,pointer){body.forEach((st,i)=>{const keys=['let','assert','port','call','when','fold','each','try'].filter(k=>Object.hasOwn(st,k));assert.equal(keys.length,1);expected.push({form:keys[0],pointer:pointer+'/'+i});for(const child of ['then','steps','try','catch'])if(Object.hasOwn(st,child))walk(st[child],pointer+'/'+i+'/'+child);});}walk(programme,view.pointer);
  assert.deepEqual(view.statements,expected,name);view.forms.forEach(f=>forms.add(f));
 }
 assert.deepEqual([...forms].sort(),['assert','call','fold','let','port','try','when']);assert.equal(JSON.stringify(module),before);
 const scanner=await run('sp.moduleView',{module,name:'sp.scan'});assert.ok(scanner.text.includes('try:\n'));assert.ok(scanner.text.includes('catch predicateFault:\n'));
});

test('readable module inspection refuses missing queries and does not execute source effects',async()=>{
 const module={protocol:'temple/surface-process-module/1',queries:{probe:[{port:'forbidden.effect',args:{},into:'ignored'}]}};
 const view=await run('sp.moduleView',{module,name:'probe'});assert.ok(view.text.includes('port forbidden.effect'));
 await assert.rejects(run('sp.moduleView',{module,name:'missing'}),/SP-MODULE/);
 await assert.rejects(run('sp.moduleView',{module:{...module,protocol:'unknown'},name:'probe'}),/SP-MODULE/);
 await assert.rejects(run('sp.structure',{programme:[{unknown:true}],pointer:'/queries/probe',depth:0}),/SP-STRUCTURE/);
});

test('the module selector projects the bound query through the shared presenter using read-only DOM effects',async()=>{
 const module=source('algebra/encounter-source.process.json'),effects=[];
 await invoke({model,entry:'hierarchy.module.select',input:{data:{presentation:policy,sourceModule:module}},ports:{...valuePorts(),...computationalPorts(),'browser.property':()=> 'md.preview','browser.write':x=>{effects.push(x);return true},'browser.content':x=>{effects.push(x);return true}},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000});
 assert.ok(effects.find(x=>x.ref==='#module-readable').html.includes('md.preview'));assert.ok(effects.find(x=>x.ref==='#module-coordinates').html.includes('/queries/md.preview/'));
 assert.ok(effects.find(x=>x.ref==='#module-pointer').value.includes('algebra/encounter-source.process.json'));
});

test('the standalone module page replaces the raw-JSON entrance and states the authoring boundary',()=>{
 if(proposal)return; // The authoritative build is checked after the transaction stages it.
 const page=fs.readFileSync('dist/inspection/source-algebra.html','utf8'),worldwright=fs.readFileSync('dist/inspection/worldwright.html','utf8');
 assert.ok(worldwright.includes('href="source-algebra.html"'));assert.ok(page.includes('id="module-query"'));
 for(const name of Object.keys(source('algebra/encounter-source.process.json').queries))assert.ok(page.includes('value="'+name+'"'));
 assert.ok(page.includes('Readable Encounter source is authoritative'));assert.ok(page.includes('Download generated JSON'));
});

