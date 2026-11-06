import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{readProcessFixture:read}=require('./tooling/read-process-fixture.cjs'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const {parseRel}=require('./bootstrap/ports/rel-codec.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const catalogue=read('source/hierarchy.json'),evidence=read('source/hierarchy-evidence.json');
const surface={entry:'hierarchy.parse',queries:{...read('algebra/source.process.json').queries,...Object.fromEntries(Object.entries(read('algebra/hierarchy.process.json').queries).filter(([n])=>['hierarchy.parse','hierarchy.shared'].includes(n)))}};
const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:surface,mode:'model',ports:valuePorts(),limit:20000000});
const run=async(entry,eventInput)=>(await invoke({model,entry,input:{eventInput},ports:valuePorts(),limit:20000000})).value;

test('the homepage hierarchy preserves the author order and routes every tool to its own microsite',()=>{
 const groups=Object.fromEntries(['foundation','platform','application','progress','tool'].map(g=>[g,catalogue.items.filter(i=>i.group===g).map(i=>i.name)]));
 assert.deepEqual(groups,{foundation:['Temple'],platform:['Sourcery'],application:['Claimipedia','Claimipedia Science'],progress:['Worldwright','Kingdom','World Modelling','Tradie','Foundry','Creator Studio'],tool:['Encounter','Mission Control','The Field','SuperCRM','Timesheet','Workgarden','Harborboard','Relationship Manager']});
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
 const programme=read('algebra/hierarchy.process.json');const boot=JSON.stringify(programme.queries['hierarchy.viewer.boot']);assert.ok(boot.includes('sp.present'));assert.ok(boot.includes('html.serialize'));assert.ok(!Object.keys(programme.queries).some(n=>/editor|patch|mutat/.test(n)));assert.equal(read('bootstrap/site.json').executionBudget,20000000);
});

test('the admitted viewer highlights source and its actual sharing definition with separate exact hash bases',async()=>{
 const {computationalPorts}=require('./bootstrap/ports/browser-effects.cjs'),manifest=read('bootstrap/site.json'),queries=Object.assign({},...manifest.modules.map(f=>read(f).queries),...(manifest.processModules??[]).map(s=>read('dist/'+s.output).queries));
 const bundle=queries['hierarchy.viewer.build'].find(s=>s.port==='runtime.bundle').args,names=[...bundle.queries[1].slice(1),...bundle.queries[2].slice(1)];
 const viewer=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry:'hierarchy.viewer.boot',queries:Object.fromEntries(names.map(n=>[n,queries[n]]))},mode:'model',ports:valuePorts(),limit:20000000});
 const effects=[];await invoke({model:viewer,entry:'hierarchy.viewer.boot',input:{data:{presentation:read('source/encounter/presentation.json'),processes:read('algebra/hierarchy.process.json').queries}},ports:{...valuePorts(),...computationalPorts(),'browser.property':({ref})=>ref==='#hierarchy-language'?'rel':'("example", "pack", "pack.shared")','browser.write':x=>{effects.push(x);return true},'browser.content':x=>{effects.push(x);return true}},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000});
 const source=effects.find(x=>x.ref==='#hierarchy-source'),definition=effects.find(x=>x.ref==='#hierarchy-process');assert.ok(source.html.includes('example'));assert.ok(definition.html.includes('hierarchy.shared'));assert.ok(definition.html.includes('hTarget'));assert.ok(effects.some(x=>x.ref==='#hierarchy-source-hash'));
});

test('the opening fold has three illustrated entrances and moves questions and applications to their own destinations',()=>{
 const home=fs.readFileSync('dist/index.html','utf8'),hero=home.match(/<section class="hero home-entrance-fold"[\s\S]*?<\/section>/)?.[0];assert.ok(hero);
 assert.equal((hero.match(/class="begin-door"/g)||[]).length,3);
 for(const [href,label]of [['questions-sourcerer.html','Questions'],['gate.html','Threads'],['atlas.html','Atlas / Map']]){assert.ok(hero.includes('href="'+href+'"'));assert.ok(hero.includes('<h2>'+label+'</h2>'));}
 assert.equal((hero.match(/assets\/atlas\//g)||[]).length,3);assert.ok(!hero.includes('data-item='));assert.ok(home.indexOf('data-item="temple"')>home.indexOf('</section>'));
 assert.ok(!home.includes('class="section first-trails"'));assert.ok(!home.includes('class="section atlas-portal"'));assert.equal((home.match(/class="hierarchy-section home-fold /g)||[]).length,4);
 const questions=fs.readFileSync('dist/questions.html','utf8');assert.ok(questions.includes('live like Jesus?'));for(const slug of ['laboratory','kenosis','care'])assert.ok(questions.includes('href="places/'+slug+'.html"'));
 const science=fs.readFileSync('dist/claimipedia-science/index.html','utf8');assert.ok(science.includes('<h1>Claimipedia Science</h1>'));assert.ok(science.includes('First use case'));assert.ok(science.includes('Relational Geometry Programme'));assert.ok(science.includes('href="https://aaron-alderman.github.io/spin23-relational-geometry/"'));
 const item=catalogue.items.find(i=>i.id==='worldwright');assert.equal(item.icon.tag,'svg');assert.ok(fs.existsSync('dist/relational-geometry/index.html'));
});

test('Mission Control is a first-class Sourcery tool, linked from Science, with inspected sources and native workflow disclosure',()=>{
 const home=fs.readFileSync('dist/index.html','utf8'),mission=fs.readFileSync('dist/mission-control/index.html','utf8'),science=fs.readFileSync('dist/claimipedia-science/index.html','utf8');
 assert.ok(home.includes('data-item="mission-control"'));assert.ok(home.includes('class="scroll-invitation"'));assert.ok(home.includes('href="#microsites"'));assert.ok(home.includes('There’s more beneath the surface.'));assert.ok(home.includes('aria-label="Explore Mission Control"'));assert.ok(home.includes('aria-label="Inspect Mission Control"'));
 assert.ok(mission.includes('<h1>Mission Control</h1>'));assert.ok(mission.includes('internal job system'));assert.ok(mission.includes('<details class="mission-workflow">'));assert.ok(mission.includes('<summary>How Mission Control works</summary>'));assert.ok(!mission.includes('<script'));
 assert.ok(science.includes('href="../mission-control/"'));assert.ok(science.includes('Agent-assisted research'));
 const bindings=evidence.bindings.filter(b=>b.item==='mission-control');assert.equal(bindings.length,2);assert.ok(bindings.some(b=>b.origin.endsWith('research-mission-control.mjs')));assert.ok(fs.readFileSync('dist/inspection/mission-control.html','utf8').includes('Research Mission Control adapter source'));
 const icon=catalogue.items.find(i=>i.name==='Claimipedia Science').icon;assert.ok(icon.attrs.class.includes('science-emblem'));
});

test('purpose types distinguish all cards while Creator Studio completes six developing entries',()=>{const items=catalogue.items,home=fs.readFileSync('dist/index.html','utf8'),types=read('source/card-types.json').types;assert.equal(items.filter(i=>i.group==='progress').length,6);for(const item of items){assert.ok(types[item.type],item.id);assert.equal(item.typeLabel,types[item.type].label);assert.ok(home.includes('data-type="'+item.type+'"'));}const science=items.find(i=>i.id==='relational-geometry');assert.equal(science.icon.tag,'img');assert.ok(science.icon.attrs.src.endsWith('.png'));for(const asset of read('source/entry-card-art.json').assets){const b=fs.readFileSync('dist/'+asset.path);assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b[25],6);assert.equal(sha(b),asset.sha256);}const studio=fs.readFileSync('dist/creator-studio/index.html','utf8');assert.ok(studio.includes('<h1>Creator Studio</h1>'));assert.ok(studio.includes('still taking shape'));assert.ok(studio.includes('href="../encounter/"'));});

test('lived questions retain a personal Christian centre and open the bounded Field encounter',()=>{
 const questions=fs.readFileSync('dist/questions.html','utf8'),field=fs.readFileSync('dist/the-field/index.html','utf8');
 assert.ok(questions.includes('live like Jesus?'));
 assert.equal((questions.match(/class="q-question"/g)||[]).length,6);
 assert.ok(questions.includes('href="the-field/#encounter"'));
 assert.ok(questions.includes('assets/questions/open-workshop-daylight-v2.png'));
 assert.ok(questions.includes('class="footer-stewardship"'));
 const source=read('source/hierarchy-evidence/the-field-0.json');
 for(const action of source.actions){assert.ok(field.includes('id="choice-'+action.id+'"'));}
 assert.equal((field.match(/class="field-choice"/g)||[]).length,source.actions.length);
 assert.equal((field.match(/class="field-consequences"/g)||[]).length,5);
 for(const label of ['Right now','Between people','What this could make normal','What remains uncertain'])assert.equal(field.split('>'+label+'<').length-1,5,label);
 assert.ok(field.includes('authored possibilities, not predictions'));
 assert.ok(field.includes('does not assess your standing'));
 assert.ok(!field.includes('<script'));
 assert.ok(field.includes('id="microsite-return"'));
 assert.equal(sha(fs.readFileSync('source/hierarchy-evidence/the-field-0.json')),read('source/questions-correspondence.json').encounterSource.sha256);
});


test('another side changes the question destination and label through the algebra for every role',async()=>{
 const programme=read('algebra/publication.process.json'),facts=parseRel(fs.readFileSync('source/hierarchy.rel','utf8'));
 const themes=facts.filter(f=>f.p==='isa'&&f.o==='IdentityTheme').map(f=>Object.fromEntries(['key','label','copy','image','questionHref','questionCopy'].map(p=>[p,facts.find(x=>x.s===f.s&&x.p===p)?.o])));
 assert.deepEqual(themes.map(t=>t.key),['sourcerer','author','dad','christian']);
 assert.equal(new Set(themes.map(t=>t.questionHref)).size,4);
 const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry:'identity.change',queries:{'identity.change':programme.queries['identity.change']}},mode:'model',ports:valuePorts(),limit:20000000});
 const {computationalPorts}=require('./bootstrap/ports/browser-effects.cjs');
 for(const current of themes){const choices=themes.filter(t=>t.key!==current.key);for(let i=0;i<choices.length;i++){
  const effects=[],chosen=choices[i];
  await invoke({model,entry:'identity.change',input:{data:{themes}},ports:{...valuePorts(),...computationalPorts(),'state.get':()=>current.key,'state.set':x=>{effects.push(x);return true},'random.values':()=>[(i+.1)/choices.length],'browser.attribute':x=>{effects.push(x);return true},'browser.write':x=>{effects.push(x);return true}},limit:20000000});
  assert.ok(effects.some(x=>x.ref==='#first-trails'&&x.name==='href'&&x.value===chosen.questionHref));
  assert.ok(effects.some(x=>x.ref==='#identity-question-copy'&&x.value===chosen.questionCopy));
  assert.ok(effects.some(x=>x.ref==='body'&&x.value===chosen.key));
 }}
 const home=fs.readFileSync('dist/index.html','utf8');assert.ok(home.includes('href="questions-sourcerer.html"'));assert.ok(home.includes('How do I build software that earns trust?'));
 for(const theme of themes){const html=fs.readFileSync('dist/'+theme.questionHref,'utf8');assert.ok(html.includes('<h1'));assert.ok(html.includes('Questions from another side'));for(const other of themes)assert.ok(html.includes('href="'+other.questionHref+'"'));}
 const dad=fs.readFileSync('dist/questions-dad.html','utf8');assert.ok(dad.includes('present as Dad?'));assert.ok(!dad.includes('live like Jesus?'));assert.ok(!dad.includes('>Father'));
 const author=fs.readFileSync('dist/questions-author.html','utf8');assert.ok(author.includes('the people who enter my stories?'));assert.ok(author.includes('href="worldwright/"'));assert.ok(author.includes('href="creator-studio/"'));
 const sourcerer=fs.readFileSync('dist/questions-sourcerer.html','utf8');assert.ok(sourcerer.includes('software that earns trust?'));assert.ok(sourcerer.includes('href="sourcery/"'));assert.ok(sourcerer.includes('href="temple/"'));
 for(const file of ['questions-dad.html','questions-author.html','questions-sourcerer.html']){const html=fs.readFileSync('dist/'+file,'utf8');assert.equal((html.match(/class="q-question"/g)||[]).length,4);assert.ok(!html.includes('<script'));assert.ok(html.includes('rel="canonical" href="https://aaronalderman.com/'+file+'"'));for(const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)){if(!/^https?:/.test(m[1])){const target=m[1].split(/[?#]/)[0];assert.ok(fs.existsSync('dist/'+target),file+': '+target);}}}
});
