import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const {parseRel}=require('./bootstrap/ports/rel-codec.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const catalogue=read('source/hierarchy.json'),evidence=read('source/hierarchy-evidence.json');
const surface={entry:'hierarchy.parse',queries:{...read('algebra/source.process.json').queries,...Object.fromEntries(Object.entries(read('algebra/hierarchy.process.json').queries).filter(([n])=>['hierarchy.parse','hierarchy.shared'].includes(n)))}};
const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:surface,mode:'model',ports:valuePorts(),limit:20000000});
const run=async(entry,eventInput)=>(await invoke({model,entry,input:{eventInput},ports:valuePorts(),limit:20000000})).value;

test('the homepage hierarchy preserves the author order and routes every tool to its own microsite',()=>{
 const groups=Object.fromEntries(['foundation','platform','application','progress','tool'].map(g=>[g,catalogue.items.filter(i=>i.group===g).map(i=>i.name)]));
 assert.deepEqual(groups,{foundation:['Temple'],platform:['Sourcery'],application:['Claimipedia','Claimipedia Science'],progress:['Worldwright','Kingdom','World Modelling','Tradie','Foundry'],tool:['Encounter','The Field','SuperCRM','Timesheet','Workgarden','Harborboard','Relationship Manager']});
 const home=fs.readFileSync('dist/index.html','utf8');
 for(const item of catalogue.items){assert.ok(home.includes('data-item="'+item.id+'"'));assert.ok(home.includes('href="'+item.href+'"'));assert.ok(home.includes('href="inspection/'+item.id+'.html"'));assert.ok(fs.existsSync('dist/'+item.href+'index.html'));assert.ok(fs.existsSync('dist/inspection/'+item.id+'.html'));}
 assert.ok(!home.includes('Shared capabilities'));assert.ok(!home.includes('Proposed connections'));
});

test('source snapshots preserve their hashes and exact upstream lines when the recorded source is available',()=>{
 for(const binding of evidence.bindings){const bytes=fs.readFileSync(binding.file);assert.equal(sha(bytes),binding.snapshotSha256);const root=binding.sourceRoot==='sourcery'?'C:/Users/aaron/sourcery':binding.sourceRoot==='grand-theory'?'C:/Users/aaron/grand-theory':process.cwd();const origin=path.join(root,binding.origin);
  if(fs.existsSync(origin)){const original=fs.readFileSync(origin);assert.equal(sha(original),binding.sourceSha256,binding.origin);if(binding.kind==='rel'){const lines=original.toString('utf8').split(/\r?\n/);binding.lineMap.forEach((n,i)=>assert.equal(lines[n-1],binding.lines[i]));}else assert.deepEqual(bytes,original);}
  if(binding.kind==='rel'){assert.equal(bytes.toString('utf8'),binding.lines.join('\n')+'\n');assert.equal(binding.lines.length,binding.lineMap.length);}
 }
});

test('all published capability edges are extracted by the existing REL parser with exact source bindings',async()=>{
 const expected=[];
 for(const binding of evidence.bindings.filter(b=>b.kind==='rel')){const text=fs.readFileSync(binding.file,'utf8'),rows=await run('hierarchy.parse',{text,binding}),facts=parseRel(text,binding.file);assert.equal(rows.length,facts.length);
  rows.forEach((row,i)=>{assert.equal(row.subject,facts[i].s);assert.equal(row.relation,facts[i].p);assert.equal(row.target,facts[i].o);assert.equal(row.line,binding.lineMap[i]);assert.equal(row.text,binding.lines[i]);});expected.push(...rows);
 }
 assert.ok(expected.length>100);assert.deepEqual(read('dist/inspection/bindings.json').rows,expected);
});

test('sharing uses exact typed identity and counts each consumer once',async()=>{
 const rows=[{item:'a',relation:'pack',target:'same'},{item:'a',relation:'pack',target:'same'},{item:'b',relation:'pack',target:'same'},{item:'c',relation:'dependsOn',target:'same'},{item:'d',relation:'pack',target:'similar'}];
 assert.deepEqual(await run('hierarchy.shared',{rows,relation:'pack',target:'same'}),['a','b']);assert.deepEqual(await run('hierarchy.shared',{rows,relation:'dependsOn',target:'same'}),['c']);
 const actual=read('dist/inspection/bindings.json').rows;const peers=await run('hierarchy.shared',{rows:actual,relation:'pack',target:'pack.sourcery.workItemPlanning.v1'});assert.ok(peers.includes('harborboard'));assert.ok(peers.includes('supercrm'));assert.ok(!peers.includes('workgarden'));
});

test('malformed, unsupported and stale source-line bindings refuse rather than fabricating connections',async()=>{
 const binding={item:'a',id:'a',file:'example.rel',lineMap:[5],lines:['("a", "pack", "p")']};
 await assert.rejects(run('hierarchy.parse',{binding,text:'not a REL declaration'}),/HIERARCHY-001/);
 await assert.rejects(run('hierarchy.parse',{binding:{...binding,lines:['("a", "label", "p")']},text:'("a", "label", "p")'}),/HIERARCHY-002/);
 await assert.rejects(run('hierarchy.parse',{binding,text:'("a", "pack", "changed")'}),/HIERARCHY-004/);
 for(const lineMap of [[],[0],[-1]])await assert.rejects(run('hierarchy.parse',{binding:{...binding,lineMap},text:binding.lines[0]}),/HIERARCHY-003/);
 const rows=await run('hierarchy.parse',{binding:{...binding,lines:['("a", "pack", "changed")']},text:'("a", "pack", "changed")'});assert.equal(rows[0].target,'changed');
});

test('source inspection exposes receipts, consumers and honest missing edges with the existing source presenter',()=>{
 const work=fs.readFileSync('dist/inspection/harborboard.html','utf8');assert.ok(work.includes('pack.sourcery.workItemPlanning.v1'));assert.ok(work.includes('href="supercrm.html"'));assert.ok(work.includes('Upstream SHA-256'));assert.ok(work.includes('source line '));assert.ok(work.includes('src="runtime.js"'));
 const worldwright=fs.readFileSync('dist/inspection/worldwright.html','utf8');assert.ok(worldwright.includes('No shared capability identity is declared'));assert.ok(worldwright.includes('worldwright-storytelling/README.md'));assert.ok(!worldwright.includes('Proposed connections'));
 const programme=read('algebra/hierarchy.process.json');const boot=programme.queries['hierarchy.viewer.boot'];assert.ok(boot.some(s=>s.port==='kernel.invoke'&&s.args.query==='sp.present'));assert.ok(boot.some(s=>s.call==='html.serialize'));assert.ok(!Object.keys(programme.queries).some(n=>/editor|patch|mutat/.test(n)));assert.equal(read('bootstrap/site.json').executionBudget,20000000);
});

test('the admitted viewer highlights source and its actual sharing definition with separate exact hash bases',async()=>{
 const {computationalPorts}=require('./bootstrap/ports/browser-effects.cjs'),manifest=read('bootstrap/site.json'),queries=Object.assign({},...manifest.modules.map(f=>read(f).queries));
 const bundle=queries['hierarchy.viewer.build'].find(s=>s.port==='runtime.bundle').args,names=[...bundle.queries[1].slice(1),...bundle.queries[2].slice(1)];
 const viewer=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry:'hierarchy.viewer.boot',queries:Object.fromEntries(names.map(n=>[n,queries[n]]))},mode:'model',ports:valuePorts(),limit:20000000});
 const effects=[];await invoke({model:viewer,entry:'hierarchy.viewer.boot',input:{data:{presentation:read('source/encounter/presentation.json'),processes:read('algebra/hierarchy.process.json').queries}},ports:{...valuePorts(),...computationalPorts(),'browser.property':({ref})=>ref==='#hierarchy-language'?'rel':'("example", "pack", "pack.shared")','browser.write':x=>{effects.push(x);return true},'browser.content':x=>{effects.push(x);return true}},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000});
 const source=effects.find(x=>x.ref==='#hierarchy-source'),definition=effects.find(x=>x.ref==='#hierarchy-process');assert.ok(source.html.includes('example'));assert.ok(definition.html.includes('hierarchy.shared'));assert.ok(definition.html.includes('hTarget'));assert.ok(effects.some(x=>x.ref==='#hierarchy-source-hash'));
});

test('the opening fold has three illustrated entrances and moves questions and applications to their own destinations',()=>{
 const home=fs.readFileSync('dist/index.html','utf8'),hero=home.match(/<section class="hero home-entrance-fold"[\s\S]*?<\/section>/)?.[0];assert.ok(hero);
 assert.equal((hero.match(/class="begin-door"/g)||[]).length,3);
 for(const [href,label]of [['questions.html','Questions'],['gate.html','Threads'],['atlas.html','Atlas / Map']]){assert.ok(hero.includes('href="'+href+'"'));assert.ok(hero.includes('<h2>'+label+'</h2>'));}
 assert.equal((hero.match(/assets\/atlas\//g)||[]).length,3);assert.ok(!hero.includes('data-item='));assert.ok(home.indexOf('data-item="temple"')>home.indexOf('</section>'));
 assert.ok(!home.includes('class="section first-trails"'));assert.ok(!home.includes('class="section atlas-portal"'));assert.equal((home.match(/class="hierarchy-section home-fold /g)||[]).length,4);
 const questions=fs.readFileSync('dist/questions.html','utf8');assert.ok(questions.includes('<h1>Begin with a question.</h1>'));for(const slug of ['observation','kenosis','care'])assert.ok(questions.includes('href="places/'+slug+'.html"'));
 const science=fs.readFileSync('dist/claimipedia-science/index.html','utf8');assert.ok(science.includes('<h1>Claimipedia Science</h1>'));assert.ok(science.includes('First use case'));assert.ok(science.includes('Relational Geometry Programme'));assert.ok(science.includes('href="https://aaron-alderman.github.io/spin23-relational-geometry/"'));
 const item=catalogue.items.find(i=>i.id==='worldwright');assert.equal(item.icon.tag,'svg');assert.ok(fs.existsSync('dist/relational-geometry/index.html'));
});
