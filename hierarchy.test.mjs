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

test('identity assurance distinguishes declared invariance, missing connections and equal world values',async()=>{
 const queries=read('algebra/publication.process.json').queries;
 const entry='identity.assurance.classify';
 const compiled=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries:{[entry]:queries[entry]}},mode:'model',ports:valuePorts(),limit:20000000});
 const classify=async input=>(await invoke({model:compiled,entry,input:{eventInput:input},ports:valuePorts(),limit:20000000})).value;
 const p={id:'hero',area:'Opening',label:'Image',intent:'identity',resolver:'theme',field:'image',target:'#hero',sink:'src',read:'$chosen.image',subjectRead:'$t',reason:'World imagery',next:'Restore mapping',source:'fixture'};
 const input={identities:['sourcerer','author','dad','christian'],policies:[p],worlds:['sourcerer','author','dad','christian'].map(key=>({key,values:{hero:'same.webp'}})),bindings:[{port:'browser.attribute',args:{ref:'#hero',name:'src',value:'$chosen.image'}}],themeFields:{image:['one','$t','image']}};
 assert.equal((await classify(input))[0].status,'identity-mapped','equal values do not imply invariance');
 for(const mutate of [x=>x.worlds[0].values.hero=null,x=>delete x.worlds[0].values.hero,x=>x.worlds.pop(),x=>x.worlds.push(x.worlds[0]),x=>x.bindings=[],x=>x.themeFields={},x=>x.themeFields.image=['one','$wrong','image'],x=>x.bindings[0].args.value='$chosen.imageWrong',x=>x.bindings.push({port:'browser.attribute',args:{ref:'#hero',name:'src',value:'wrong.webp'}})]){
  const changed=structuredClone(input);mutate(changed);assert.equal((await classify(changed))[0].status,'missing');
 }
 const undecided=structuredClone(input);undecided.policies[0].intent='undecided';assert.equal((await classify(undecided))[0].status,'undecided');
 const invariant=structuredClone(input);invariant.policies[0].intent='invariant';invariant.bindings=[];assert.equal((await classify(invariant))[0].status,'intentionally-invariant');
 invariant.policies[0].reason='';assert.equal((await classify(invariant))[0].status,'missing','invariance requires a reason');
 invariant.policies[0].reason='Shared across these four identities';invariant.bindings=input.bindings;assert.equal((await classify(invariant))[0].status,'missing','an invariant policy conflicts with an identity writer');
 const unknown=structuredClone(input);unknown.bindings.push({port:'browser.write',args:{ref:'#new-copy',name:'textContent',value:'$chosen.copy'}});assert.equal((await classify(unknown)).find(r=>r.target==='#new-copy').status,'undecided');
});

test('generated identity assurance keeps navigation gaps visible and covers every catalogue entry',()=>{
 const report=JSON.parse(fs.readFileSync('dist/assurance/identity-mappings.json','utf8'));
 assert.equal(report.protocol,'worldwright/identity-assurance/1');
 assert.deepEqual(report.identities,['sourcerer','author','dad','christian']);
 const row=id=>report.rows.find(r=>r.id===id);
 for(const id of ['threads.context','atlas.context']){assert.equal(row(id).status,'identity-mapped',id);assert.equal(row(id).destinationBound,true,id);}
 for(const id of ['hero.image','questions.route','threads.image','atlas.image','appearance.--identity-bg','apps.filter','apps.perspective','apps.accessible','collection.application.title'])assert.equal(row(id).status,'identity-mapped',id);
 for(const item of catalogue.items)assert.ok(['identity-mapped','missing'].includes(row('app.'+item.id).status),item.id);
 assert.equal(row('brand').status,'intentionally-invariant');
 assert.equal(new Set(report.rows.map(r=>r.id)).size,report.rows.length);
 assert.equal(report.summary.reduce((sum,s)=>sum+s.count,0),report.rows.length);
 const html=fs.readFileSync('dist/assurance/index.html','utf8');
 assert.ok(html.includes('Where does each world reach?'));assert.ok(html.includes('identity-mappings.json'));assert.ok(!html.match(/<script/));
 assert.ok(fs.readFileSync('dist/index.html','utf8').includes('href="assurance/"'));
 assert.ok(fs.readFileSync('dist/sitemap.xml','utf8').includes('https://aaronalderman.com/assurance/'));
});

test('the eight decisions distinguish scoped invariants from identity mappings with four-world evidence',()=>{
 const report=JSON.parse(fs.readFileSync('dist/assurance/identity-mappings.json','utf8')),decisions=JSON.parse(fs.readFileSync('dist/assurance/identity-decisions.json','utf8')).decisions;
 const invariant=['nav.routes','section.headings','cards.style','footer'],mapped=['metadata','typography','aesthetics','questions.article'];
 for(const id of [...invariant,...mapped]){const row=report.rows.find(r=>r.id===id),proof=decisions[id];assert.equal(row.status,invariant.includes(id)?'intentionally-invariant':'identity-mapped',id);assert.equal(proof.ok,true,id);assert.equal(proof.worlds.length,4,id);assert.equal(new Set(proof.worlds.map(w=>w.identity)).size,4);assert.ok(proof.worlds.every(w=>w.ok&&w.outputs.every(o=>o.ok)),id);assert.ok(proof.scope.length>30);assert.ok(row.reason.length>30);}
 assert.match(decisions.aesthetics.humanReview,/Required/);assert.match(decisions.aesthetics.boundary,/not inferred/);
 assert.equal(report.rows.filter(r=>!r.id.startsWith('discovered:')&&['missing','undecided'].includes(r.status)).length,0);
 assert.ok(report.rows.some(r=>r.id.startsWith('discovered:')&&r.status==='undecided'));
 const css=fs.readFileSync('dist/expedition.css','utf8');assert.ok(css.includes('--q-paper:#f3f7ef;'));assert.ok(css.includes('--q-action:#365c40;'));assert.ok(!css.includes('infinite'));
 const author=fs.readFileSync('dist/worlds/author/questions.html','utf8');assert.ok(author.includes('content="#f3f7ef"'));assert.ok(author.includes('rel="canonical" href="https://aaronalderman.com/worlds/author/questions.html"'));assert.ok(author.includes('href="/expedition.css?v='+fs.readFileSync('source/expedition.rel','utf8').match(/"stylesheetVersion", "([^"]+)"/)[1]+'"'));
});

test('a declared decision stays missing without complete, matching per-identity verification',async()=>{
 const entry='identity.assurance.classify',queries=read('algebra/publication.process.json').queries,compiled=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries:{[entry]:queries[entry]}},mode:'model',ports:valuePorts(),limit:20000000});
 const identities=['sourcerer','author','dad','christian'];const policy={id:'footer',area:'Footer',label:'Common footer',intent:'invariant',resolver:'declaration',field:'',target:'',sink:'',read:'',subjectRead:'',reason:'The same person owns all four perspectives.',next:'Restore evidence',source:'fixture'};
 const input={policies:[policy],identities,worlds:identities.map(key=>({key,values:{footer:null}})),bindings:[],themeFields:{},reviewEvidence:{footer:{id:'footer',intent:'invariant',ok:true,scope:'Four identity footers',boundary:'Structural checks only',humanReview:'Declared intent',worlds:identities.map(identity=>({identity,value:'Shared owner and destinations',ok:true,outputs:[]}))}}};
 const classify=async value=>(await invoke({model:compiled,entry,input:{eventInput:value},ports:valuePorts(),limit:20000000})).value;
 assert.equal((await classify(input))[0].status,'intentionally-invariant');
 for(const mutate of [x=>delete x.reviewEvidence,x=>x.reviewEvidence.footer.ok=false,x=>x.reviewEvidence.footer.worlds.pop(),x=>x.reviewEvidence.footer.worlds[0].ok=false,x=>x.reviewEvidence.footer.worlds[1]=x.reviewEvidence.footer.worlds[0],x=>x.reviewEvidence.footer.intent='identity',x=>x.reviewEvidence.footer.id='metadata']){const broken=structuredClone(input);mutate(broken);assert.equal((await classify(broken))[0].status,'missing');}
});

test('the actual review algebra detects an Author palette regression and incorrect Questions canonical metadata',async()=>{
 const {indexFacts}=require('./bootstrap/ports/fact-index.cjs'),source=read('algebra/publication.process.json').queries,entry='review.test';
 const compiled=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries:{[entry]:[{call:'identity.assurance.review'},{let:'result',value:'$reviewEvidence'}],'identity.assurance.review':source['identity.assurance.review'],'identity.journey.check':source['identity.journey.check'],'html.escape':read('algebra/html.process.json').queries['html.escape']}},mode:'model',ports:valuePorts(),limit:20000000});
 const facts=read('bootstrap/site.json').sources.flatMap(file=>parseRel(fs.readFileSync(file,'utf8'))),factIndex=await indexFacts(createKernel(valuePorts(),20000000),read('algebra/fact-index.process.json'),facts);
 const themeFields=source['identity.runtime.build'].find(s=>s.into==='identityThemes').yield[2][1],input={factIndex,change:source['identity.change'],themeFields,catalogue:read('source/hierarchy.json'),journeyEvidence:JSON.parse(fs.readFileSync('dist/assurance/identity-journeys.json','utf8'))};
 const review=async mode=>(await invoke({model:compiled,entry,input,ports:{...valuePorts(),'file.write':()=>true,'file.read':({path:file})=>{let text=fs.readFileSync('dist/'+file,'utf8');if(mode==='palette'&&file==='expedition.css')text=text.replaceAll('--q-paper:#f3f7ef;','--q-paper:#faf6fc;');if(mode==='canonical'&&file==='worlds/author/questions.html')text=text.replace('rel="canonical" href="https://aaronalderman.com/worlds/author/questions.html"','rel="canonical" href="https://aaronalderman.com/questions-author.html"');if(mode==='legacy-art'&&file==='worlds/author/questions.html')text=text.replaceAll('assets/identities/cards/author-questions-v1.webp','assets/questions/author-daylight-v1.png');return text;}},limit:20000000})).value;
 const baseline=await review('ok');assert.ok(Object.values(baseline).every(p=>p.ok));const palette=await review('palette');assert.equal(palette.aesthetics.ok,false);assert.equal(palette['questions.article'].ok,false);assert.equal(palette.footer.ok,true);const canonical=await review('canonical');assert.equal(canonical.metadata.ok,false);assert.equal(canonical.typography.ok,true);const art=await review('legacy-art');assert.equal(art.aesthetics.ok,false);assert.equal(art.metadata.ok,false);assert.equal(art['questions.article'].ok,false);
});

test('every identity has distinct Threads content, Map highlights and complete reading returns',async()=>{
 const {parse}=await import('parse5'),all=n=>[n,...(n.childNodes??[]).flatMap(all)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value,text=n=>(n.value??'')+(n.childNodes??[]).map(text).join('');
 const facts=parseRel(fs.readFileSync('source/hierarchy.rel','utf8')),field=(s,p)=>facts.find(f=>f.s===s&&f.p===p)?.o;
 const places=parseRel(fs.readFileSync('source/expedition.rel','utf8')).filter(f=>f.p==='isa'&&f.o==='Place').map(f=>f.s.slice(6));
 const evidence=JSON.parse(fs.readFileSync('dist/assurance/identity-journeys.json','utf8'));
 assert.equal(evidence.worlds.length,4);const titles=new Set();
 for(const key of ['sourcerer','author','dad','christian']){
  const prefix=`worlds/${key}/`,subject='identity.'+key,world=evidence.worlds.find(w=>w.identity===key);
  for(const kind of ['threads','map','home','questions'])assert.equal(world[kind].ok,true,key+' '+kind);
  assert.equal(world.readings.length,40);assert.ok(world.readings.every(r=>r.ok));
  const threads=all(parse(fs.readFileSync('dist/'+prefix+'threads.html','utf8'))),map=all(parse(fs.readFileSync('dist/'+prefix+'atlas.html','utf8')));
  const h1=threads.find(n=>n.nodeName==='h1');assert.equal(text(h1),field(subject,'threadsTitle'));titles.add(text(h1));
  assert.equal(threads.filter(n=>attr(n,'class')==='identity-thread').length,3);
  assert.ok(map.some(n=>n.nodeName==='h1'&&text(n)===field(subject,'mapTitle')));
  const pins=map.filter(n=>attr(n,'class')==='atlas-pin');assert.equal(pins.length,40);assert.ok(pins.some(n=>attr(n,'data-identity-recommended')==='true'));
  for(const pin of pins)assert.equal(attr(pin,'href'),'/'+prefix+'places/'+attr(pin,'data-atlas-id')+'.html');
  const home=all(parse(fs.readFileSync('dist/'+prefix+'index.html','utf8')));assert.equal(attr(home.find(n=>n.nodeName==='body'),'data-initial-identity'),key);assert.equal(attr(home.find(n=>attr(n,'id')==='identity-background'),'src'),'/'+field(subject,'image'));
  for(const route of ['threads.html','atlas.html','index.html','questions.html',...places.map(id=>'places/'+id+'.html')]){
   const html=fs.readFileSync('dist/'+prefix+route,'utf8'),nodes=all(parse(html));
   assert.equal(attr(nodes.find(n=>n.nodeName==='body'),'data-identity'),key);
   for(const kind of ['index','threads','atlas'])assert.ok(nodes.some(n=>n.nodeName==='a'&&attr(n,'href')==='/'+prefix+kind+'.html'),key+' '+route+' returns to '+kind);
   for(const n of nodes){for(const attribute of ['href','src']){const href=attr(n,attribute);if(!href||/^(https?:|#|data:)/.test(href))continue;const url=new URL(href,'https://publication.invalid/'+prefix+route);const target=path.join('dist',decodeURIComponent(url.pathname));assert.ok(fs.existsSync(target),prefix+route+' → '+href);}}
  }
  for(const id of places){const shared=all(parse(fs.readFileSync('dist/places/'+id+'.html','utf8'))).find(n=>attr(n,'class')==='reading'),reading=all(parse(fs.readFileSync('dist/'+prefix+'places/'+id+'.html','utf8')));assert.equal(text(reading.find(n=>attr(n,'class')==='reading')),text(shared),key+' '+id+' preserves source reading');assert.ok(reading.some(n=>attr(n,'data-shared-exit')==='true'&&attr(n,'href')==='https://aaronalderman.com/places/'+id+'.html'));}
 }
 assert.equal(titles.size,4);
});

test('assurance refuses a wired route when destination evidence or identity returns are missing',async()=>{
 const p=read('algebra/publication.process.json'),entry='identity.assurance.classify',compiled=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries:{[entry]:p.queries[entry]}},mode:'model',ports:valuePorts(),limit:20000000});
 const policy={id:'threads.context',area:'Threads',label:'Destination',intent:'identity',resolver:'theme',field:'threadsHref',target:'#threads',sink:'href',read:'$chosen.threadsHref',subjectRead:'$identitySubject',reason:'Carry identity',next:'Restore destination',source:'fixture'};
 const input={policies:[policy],identities:['sourcerer','author','dad','christian'],worlds:['sourcerer','author','dad','christian'].map(key=>({key,values:{'threads.context':'/worlds/'+key+'/threads.html'}})),bindings:[{args:{ref:'#threads',name:'href',value:'$chosen.threadsHref'}}],themeFields:{threadsHref:['one','$identitySubject','threadsHref']},journeyChecks:{'threads.context':false}};
 const classify=async x=>(await invoke({model:compiled,entry,input:{eventInput:x},ports:valuePorts(),limit:20000000})).value;
 assert.equal((await classify(input))[0].status,'missing');input.journeyChecks['threads.context']=true;assert.equal((await classify(input))[0].status,'identity-mapped');
 const checkEntry='identity.journey.check',checkModel=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry:checkEntry,queries:{[checkEntry]:p.queries[checkEntry]}},mode:'model',ports:valuePorts(),limit:20000000});
 const html=fs.readFileSync('dist/worlds/author/threads.html','utf8'),expected=['data-identity="author"','href="/worlds/author/atlas.html"','Follow the life between the lines.'];
 const check=async value=>(await invoke({model:checkModel,entry:checkEntry,input:{eventInput:{html:value,expected}},ports:valuePorts(),limit:20000000})).value;
 assert.equal((await check(html)).ok,true);for(const fragment of expected)assert.equal((await check(html.replaceAll(fragment,''))).ok,false,fragment);
});

test('the algebra preserves query strings, fragments and explicit shared exits while carrying identity',async()=>{
 const {indexFacts}=require('./bootstrap/ports/fact-index.cjs'),{createNodeHost}=require('./bootstrap/ports/node.cjs'),entry='identity.journey.rebase';
 const facts=parseRel(fs.readFileSync('source/hierarchy.rel','utf8')).filter(f=>f.s==='identity.author'),factIndex=await indexFacts(createKernel(valuePorts(),20000000),read('algebra/fact-index.process.json'),facts);
 const compiled=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries:{[entry]:read('algebra/publication.process.json').queries[entry]}},mode:'model',ports:valuePorts(),limit:20000000});
 const host=await createNodeHost({root:process.cwd(),output:'.build/identity-link-verification'});
 const html='<a href="../atlas.html#map">Map</a><a href="revision.html">Next</a><iframe src="../retained/activity.html?v=algebra-1#care"></iframe><a href="#local">Here</a><a href="https://aaronalderman.com/places/care.html">Shared</a>';
 const result=(await invoke({model:compiled,entry,input:{factIndex,eventInput:{html,route:'places/care.html',identity:'identity.author'}},ports:{...valuePorts(),...host.ports},limit:20000000})).value;
 for(const fragment of ['href="/worlds/author/atlas.html#map"','href="/worlds/author/places/revision.html"','src="/retained/activity.html?v=algebra-1#care"','href="#local"','href="https://aaronalderman.com/places/care.html"'])assert.ok(result.includes(fragment),fragment);
});

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
 for(const [href,label]of [['/worlds/sourcerer/questions.html','Questions'],['/worlds/sourcerer/threads.html','Threads'],['/worlds/sourcerer/atlas.html','Atlas / Map']]){assert.ok(hero.includes('href="'+href+'"'));assert.ok(hero.includes('<h2>'+label+'</h2>'));}
 assert.equal((hero.match(/id="identity-card-(?:questions|threads|atlas)"/g)||[]).length,3);assert.ok(!hero.includes('data-item='));assert.ok(home.indexOf('data-item="temple"')>home.indexOf('</section>'));
 assert.ok(!home.includes('class="section first-trails"'));assert.ok(!home.includes('class="section atlas-portal"'));assert.equal((home.match(/class="hierarchy-section home-fold /g)||[]).length,4);
 const questions=fs.readFileSync('dist/questions.html','utf8');assert.ok(questions.includes('live like Jesus?'));for(const slug of ['laboratory','kenosis','care'])assert.ok(questions.includes('href="places/'+slug+'.html"'));
 const science=fs.readFileSync('dist/claimipedia-science/index.html','utf8');assert.ok(science.includes('<h1>Claimipedia Science</h1>'));assert.ok(science.includes('First use case'));assert.ok(science.includes('Relational Geometry Programme'));assert.ok(science.includes('href="https://aaron-alderman.github.io/spin23-relational-geometry/"'));
 const item=catalogue.items.find(i=>i.id==='worldwright');assert.equal(item.icon.tag,'svg');assert.ok(fs.existsSync('dist/relational-geometry/index.html'));
});

test('homepage bitmap emblems are deferred, size-bounded WebP thumbnails',()=>{
 const emblems=catalogue.items.filter(item=>item.icon?.tag==='img');
 assert.ok(emblems.length>0);
 let total=0;
 for(const item of emblems){
  const {src,loading}=item.icon.attrs;
  assert.equal(loading,'lazy',item.id);
  assert.match(src,/^assets\/world-emblems\/optimized\/.*\.webp$/);
  const bytes=fs.readFileSync('dist/'+src);total+=bytes.length;
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');
  assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  assert.ok(bytes.length<80_000,item.id+' stays within the emblem budget');
 }
 assert.ok(total<250_000,'all homepage bitmap emblems stay below 250 kB');
});

test('Mission Control is a first-class Sourcery tool, linked from Science, with inspected sources and native workflow disclosure',()=>{
 const home=fs.readFileSync('dist/index.html','utf8'),mission=fs.readFileSync('dist/mission-control/index.html','utf8'),science=fs.readFileSync('dist/claimipedia-science/index.html','utf8');
 assert.ok(home.includes('data-item="mission-control"'));assert.ok(home.includes('class="scroll-invitation"'));assert.ok(home.includes('href="#microsites"'));assert.ok(home.includes('There’s more beneath the surface.'));assert.ok(home.includes('aria-label="Explore Mission Control"'));assert.ok(home.includes('aria-label="Inspect Mission Control"'));
 assert.ok(mission.includes('<h1>Mission Control</h1>'));assert.ok(mission.includes('internal job system'));assert.ok(mission.includes('<details class="mission-workflow">'));assert.ok(mission.includes('<summary>How Mission Control works</summary>'));assert.ok(!mission.includes('<script'));
 assert.ok(science.includes('href="../mission-control/"'));assert.ok(science.includes('Agent-assisted research'));
 const bindings=evidence.bindings.filter(b=>b.item==='mission-control');assert.equal(bindings.length,2);assert.ok(bindings.some(b=>b.origin.endsWith('research-mission-control.mjs')));assert.ok(fs.readFileSync('dist/inspection/mission-control.html','utf8').includes('Research Mission Control adapter source'));
 const icon=catalogue.items.find(i=>i.name==='Claimipedia Science').icon;assert.ok(icon.attrs.class.includes('science-emblem'));
});

test('purpose types distinguish all cards while Creator Studio completes six developing entries',()=>{const items=catalogue.items,home=fs.readFileSync('dist/index.html','utf8'),types=read('source/card-types.json').types;assert.equal(items.filter(i=>i.group==='progress').length,6);for(const item of items){assert.ok(types[item.type],item.id);assert.equal(item.typeLabel,types[item.type].label);assert.ok(home.includes('data-type="'+item.type+'"'));}const science=items.find(i=>i.id==='relational-geometry');assert.equal(science.icon.tag,'img');assert.ok(science.icon.attrs.src.endsWith('.webp'));for(const asset of read('source/entry-card-art.json').assets){const b=fs.readFileSync('dist/'+asset.path);assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b[25],6);assert.equal(sha(b),asset.sha256);}const studio=fs.readFileSync('dist/creator-studio/index.html','utf8');assert.ok(studio.includes('<h1>Creator Studio</h1>'));assert.ok(studio.includes('still taking shape'));assert.ok(studio.includes('href="../encounter/"'));});

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
 const programme=read('algebra/publication.process.json'),vm=require('node:vm'),context=vm.createContext({console});
 const code=fs.readFileSync('dist/identity-runtime.js','utf8').replace(/startBrowser\(model,factIndex,grants\)\.catch[^\n]+/,'')+'\nglobalThis.capture=model;';vm.runInContext(code,context);
 const themes=JSON.parse(JSON.stringify(context.capture.data.themes));
 assert.deepEqual(themes.map(t=>t.key),['sourcerer','author','dad','christian']);
 assert.equal(new Set(themes.map(t=>t.questionHref)).size,4);
 const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry:'identity.change',queries:{'identity.change':programme.queries['identity.change']}},mode:'model',ports:valuePorts(),limit:20000000});
 const {computationalPorts}=require('./bootstrap/ports/browser-effects.cjs');
 for(const current of themes){const choices=themes.filter(t=>t.key!==current.key);for(let i=0;i<choices.length;i++){
  const effects=[],chosen=choices[i];
  await invoke({model,entry:'identity.change',input:{data:{themes}},ports:{...valuePorts(),...computationalPorts(),'state.get':()=>current.key,'state.set':x=>{effects.push(x);return true},'random.values':()=>[(i+.1)/choices.length],'browser.attribute':x=>{effects.push(x);return true},'browser.write':x=>{effects.push(x);return true},'browser.content':x=>{effects.push(x);return true}},limit:20000000});
  assert.ok(effects.some(x=>x.ref==='#first-trails'&&x.name==='href'&&x.value===chosen.questionWorldHref));
  assert.ok(effects.some(x=>x.ref==='#identity-question-copy'&&x.value===chosen.questionCopy));
  assert.ok(effects.some(x=>x.ref==='body'&&x.value===chosen.key));
  for(const card of ['questions','threads','atlas'])assert.ok(effects.some(x=>x.ref==='#identity-card-'+card&&x.name==='src'&&x.value==='/'+chosen[card+'Image']));
 }}
 const home=fs.readFileSync('dist/index.html','utf8');assert.ok(home.includes('href="/worlds/sourcerer/questions.html"'));assert.ok(home.includes('How do I build software that earns trust?'));
 for(const theme of themes){const html=fs.readFileSync('dist/'+theme.questionHref,'utf8');assert.ok(html.includes('<h1'));assert.ok(html.includes('Questions from another side'));for(const other of themes)assert.ok(html.includes('href="'+other.questionWorldHref+'"'));}
 const dad=fs.readFileSync('dist/questions-dad.html','utf8');assert.ok(dad.includes('present as Dad?'));assert.ok(!dad.includes('live like Jesus?'));assert.ok(!dad.includes('>Father'));
 const author=fs.readFileSync('dist/questions-author.html','utf8');assert.ok(author.includes('the people who enter my stories?'));assert.ok(author.includes('href="worldwright/"'));assert.ok(author.includes('href="creator-studio/"'));
 const sourcerer=fs.readFileSync('dist/questions-sourcerer.html','utf8');assert.ok(sourcerer.includes('software that earns trust?'));assert.ok(sourcerer.includes('href="sourcery/"'));assert.ok(sourcerer.includes('href="temple/"'));
 for(const file of ['questions-dad.html','questions-author.html','questions-sourcerer.html']){const html=fs.readFileSync('dist/'+file,'utf8');assert.equal((html.match(/class="q-question"/g)||[]).length,4);assert.ok(!html.includes('<script'));assert.ok(html.includes('rel="canonical" href="https://aaronalderman.com/'+file+'"'));for(const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)){if(!/^https?:/.test(m[1])){const target=m[1].split(/[?#]/)[0];assert.ok(fs.existsSync('dist/'+target),file+': '+target);}}}
});

test('four Questions worlds have their own admitted PNG, sharing metadata and readable algebra palettes',()=>{
 const art=read('source/questions-identity-art.json'),source=parseRel(fs.readFileSync('source/questions.rel','utf8'));
 const route={christian:'questions.html',dad:'questions-dad.html',sourcerer:'questions-sourcerer.html',author:'questions-author.html'};
 const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 assert.equal(art.assets.length,4);assert.equal(new Set(art.assets.map(a=>a.sha256)).size,4);
 for(const asset of art.assets){
  const bytes=fs.readFileSync('dist/'+asset.path),html=fs.readFileSync('dist/'+route[asset.role],'utf8');
  assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(sha(bytes),asset.sha256);assert.equal(bytes.readUInt32BE(16),asset.width);assert.equal(bytes.readUInt32BE(20),asset.height);
  const hero=source.find(f=>f.s==='identity.'+asset.role&&f.p==='questionHero')?.o,alt=source.find(f=>f.s==='identity.'+asset.role&&f.p==='questionHeroAlt')?.o;
  assert.ok(html.includes('data-question-identity="'+asset.role+'"'));assert.ok(html.includes('class="q-hero-art" src="'+hero+'"'));
  for(const key of ['og:image','twitter:image'])assert.ok(html.includes(key+'" content="https://aaronalderman.com/'+hero+'"'));
  if(asset.role==='author'){const active=fs.readFileSync('dist/'+hero);assert.equal(active.subarray(0,4).toString(),'RIFF');assert.equal(active.subarray(8,12).toString(),'WEBP');assert.ok(active.length<400_000);assert.equal(sha(active),source.find(f=>f.s==='identity.author'&&f.p==='questionHeroSha256')?.o);}else assert.equal(hero,asset.path);
  const palette=Object.fromEntries(Object.keys(asset.palette).map(name=>[name,source.find(f=>f.s==='questions.palette.'+asset.role+'.'+name&&f.p==='value')?.o]));
  assert.ok(html.includes('name="theme-color" content="'+palette.paper+'"'));
  assert.ok(html.includes('og:image:alt" content="'+alt+'"'));
  for(const [name,value] of Object.entries(palette)){assert.ok(value,name+' has an active REL value');if(asset.role!=='author')assert.equal(value,asset.palette[name]);}
  for(const background of ['paper','surface','wash'])for(const token of ['ink','muted','accent','action'])assert.ok(contrast(palette[token],palette[background])>=4.5,asset.role+' '+token+' on '+background+' contrast');
  assert.ok(contrast('#ffffff',palette.action)>=4.5,asset.role+' button contrast');
  assert.ok(contrast(palette.focus,palette.paper)>=3,asset.role+' focus contrast');
 }
 const css=fs.readFileSync('dist/expedition.css','utf8');for(const asset of art.assets){assert.ok(css.includes('body[data-question-identity="'+asset.role+'"]'));assert.ok(css.includes('--q-paper:'+source.find(f=>f.s==='questions.palette.'+asset.role+'.paper'&&f.p==='value')?.o));}
 assert.ok(css.includes('prefers-reduced-motion: reduce'));assert.ok(css.includes('var(--q-focus)'));
 const field=fs.readFileSync('dist/the-field/index.html','utf8');assert.ok(field.includes('assets/questions/open-workshop-daylight-v2.png'));assert.ok(!field.includes('data-question-identity='));
 const programmes=read('algebra/publication.process.json');assert.ok(JSON.stringify(programmes.queries['publication.styles']).includes('questionColour'));assert.equal(read('bootstrap/site.json').executionBudget,20000000);
});

test('each homepage perspective curates real projects without changing their purpose or maturity',async()=>{
 const {parseFragment}=await import('parse5'),vm=require('node:vm'),context=vm.createContext({console});
 vm.runInContext(fs.readFileSync('dist/identity-runtime.js','utf8').replace(/startBrowser\(model,factIndex,grants\)\.catch[^\n]+/,'')+'\nglobalThis.capture=model;',context);
 const themes=JSON.parse(JSON.stringify(context.capture.data.themes)),all=tree=>[tree,...(tree.childNodes??[]).flatMap(all)],attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value,text=node=>(node.value??'')+(node.childNodes??[]).map(text).join('');
 const expected={sourcerer:['claimipedia','relational-geometry'],christian:['the-field','relationship-manager','claimipedia'],dad:['relationship-manager','the-field','workgarden'],author:['encounter','the-field','claimipedia']};
 const shapes={sourcerer:['worldwright','kingdom','world-modelling','tradie','foundry','creator-studio'],christian:['kingdom','worldwright','creator-studio'],dad:['creator-studio','worldwright','kingdom'],author:['worldwright','creator-studio','world-modelling']};
 const headlines=new Set();
 for(const theme of themes){
  const nodes=all(parseFragment(theme.catalogueHTML)),sections=nodes.filter(n=>n.nodeName==='section'),cards=nodes.filter(n=>n.nodeName==='article'),directory=nodes.find(n=>attr(n,'id')==='all-projects');
  assert.equal(sections.length,4);assert.ok(directory);assert.equal(all(directory).filter(n=>n.nodeName==='a').length,catalogue.items.length);
  assert.ok(!theme.catalogueHTML.includes('id="microsites"'));
  const ids=nodes.map(n=>attr(n,'id')).filter(Boolean);assert.equal(new Set(ids).size,ids.length);
  const section=key=>sections.find(n=>attr(n,'data-collection')===key),items=n=>all(n).filter(n=>n.nodeName==='article').map(n=>attr(n,'data-item'));
  assert.deepEqual(items(section('foundation')),['temple','sourcery']);assert.deepEqual(items(section('application')),expected[theme.key]);assert.deepEqual(items(section('progress')),shapes[theme.key]);
  headlines.add(text(all(section('application')).find(n=>n.nodeName==='h2')));
  assert.equal(new Set(cards.map(n=>attr(n,'data-item'))).size,cards.length);
  for(const card of cards){const id=attr(card,'data-item'),original=catalogue.items.find(x=>x.id===id);assert.ok(original);assert.equal(attr(card,'data-type'),original.type);assert.equal(attr(card,'data-perspective'),theme.key);assert.ok(text(card).includes(original.description),theme.key+' '+id+' definition');assert.ok(text(card).includes(original.status),theme.key+' '+id+' maturity');assert.ok(all(card).some(n=>n.nodeName==='a'&&attr(n,'href')==='/'+original.href));assert.ok(all(card).some(n=>attr(n,'class')==='identity-card-note'&&text(n).length>20));}
  for(const img of nodes.filter(n=>n.nodeName==='img'))assert.ok(fs.existsSync('dist/'+attr(img,'src')),attr(img,'src'));
  for(const link of nodes.filter(n=>n.nodeName==='a')){const href=attr(link,'href');if(href&&!/^(https?:|#)/.test(href))assert.ok(fs.existsSync('dist/'+href.split('#')[0]),href);}
 }
 assert.equal(headlines.size,4);
 const home=fs.readFileSync('dist/index.html','utf8'),rootLinks=html=>html.replace(/(href|src)="(?!https?:|#|\/)([^\"]+)"/g,'$1="/$2"');assert.ok(rootLinks(home).includes(themes.find(t=>t.key==='sourcerer').catalogueHTML));assert.equal((home.match(/id="microsites"/g)||[]).length,1);assert.ok(home.includes('aria-controls="microsites"'));
 const css=fs.readFileSync('dist/expedition.css','utf8');for(const type of Object.keys(read('source/card-types.json').types))assert.ok(css.includes('#microsites.identity-catalogue .hierarchy-card[data-type="'+type+'"]'));
 const programme=read('algebra/publication.process.json');assert.ok(JSON.stringify(programme.queries['identity.runtime.build']).includes('identity.catalogue.view'));assert.ok(JSON.stringify(read('algebra/hierarchy.process.json').queries['hierarchy.home']).includes('identity.catalogue.view'));assert.equal(read('bootstrap/site.json').executionBudget,20000000);
});


test('algebra discovery finds undeclared nested page relationships without an element inventory',async()=>{
 const source=read('algebra/publication.process.json').queries,queries=Object.fromEntries(Object.entries(source).filter(([name])=>name.startsWith('identity.discovery.')));
 const entry='identity.discovery.scan',compiled=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries},mode:'model',ports:valuePorts(),limit:20000000});
 const scan=async html=>(await invoke({model:compiled,entry,input:{eventInput:{html}},ports:valuePorts(),limit:20000000})).value;
 const reconcile=async(observed,references)=>(await invoke({model:compiled,entry:'identity.discovery.reconcile',input:{eventInput:{observed,references}},ports:valuePorts(),limit:20000000})).value;
 const html=`<!doctype html><html><head><title>One world</title><meta name="description" content="A > B"></head><body><section id="catalogue"><article><p>Undeclared nested copy</p><a href='/new-destination' data-new="same">New route</a><img src="new.webp" alt="Same artwork" style="filter:sepia(1)"></article></section><button disabled>Press</button><script src="opaque.js"></script><style>.new {color:red}</style></body></html>`;
 const observed=await scan(html);assert.ok(observed.some(o=>o.sink==='textContent'&&o.value==='Undeclared nested copy'));for(const [sink,value]of [['href','/new-destination'],['src','new.webp'],['data-new','same'],['style','filter:sepia(1)'],['content','A > B'],['disabled',true]])assert.ok(observed.some(o=>o.sink===sink&&o.value===value),sink);
 assert.ok(observed.some(o=>o.sink==='opaque-content'&&o.tag==='script'));assert.ok(observed.some(o=>o.sink==='opaque-content'&&o.tag==='style'));assert.ok(new Set(observed.map(o=>o.ordinal)).size>8);
 const reconciled=await reconcile(observed,[{id:'container',target:'#catalogue',sink:'innerHTML'}]);assert.ok(reconciled.observations.every(o=>o.status==='undecided'),'declared ancestor does not cover descendants');
 const known=await reconcile(observed,[{id:'description',target:'head meta[name="description"]',sink:'content'}]);assert.equal(known.observations.filter(o=>o.status==='declared-reference').length,1);assert.ok(known.observations.filter(o=>o.sink==='href').every(o=>o.status==='undecided'));
 const same=await reconcile(await scan('<p>Same</p><p>Same</p><a href="same">Same</a>'),[]);assert.ok(same.observations.every(o=>o.status==='undecided'),'equality never supplies intent');assert.equal(same.observations.filter(o=>o.sink==='textContent').length,3);
 const duplicate=await scan('<a href="one" href="two">Both observations survive</a>');assert.deepEqual(duplicate.filter(o=>o.sink==='href').map(o=>o.value),['one','two']);
 const quoted=await scan(`<div title='a > b' data-empty="" tabindex=0>Text &amp; entities</div>`);assert.ok(quoted.some(o=>o.value==='a > b'));assert.ok(quoted.some(o=>o.sink==='data-empty'&&o.value===''));assert.ok(quoted.some(o=>o.sink==='tabindex'&&o.value==='0'));assert.ok(quoted.some(o=>o.value==='Text &amp; entities'));
});

test('published discovery covers complete home documents and retains all undecided evidence',()=>{
 const discovery=JSON.parse(fs.readFileSync('dist/assurance/identity-discovery.json','utf8')),report=JSON.parse(fs.readFileSync('dist/assurance/identity-mappings.json','utf8'));
 assert.equal(discovery.protocol,'worldwright/identity-discovery/1');assert.equal(discovery.pages.length,5);assert.deepEqual(discovery.pages.map(p=>p.identity),['root','sourcerer','author','dad','christian']);assert.ok(discovery.observed>4000);assert.ok(discovery.undecided>3000);assert.equal(discovery.pages.reduce((n,p)=>n+p.relationships,0),discovery.observed);assert.equal(discovery.pages.reduce((n,p)=>n+p.undecided,0),discovery.undecided);
 for(const page of discovery.pages){assert.equal(page.observations.length,page.relationships);assert.equal(page.observations.filter(o=>o.status==='undecided').length,page.undecided);assert.ok(page.observations.some(o=>o.tag==='meta'));assert.ok(page.observations.some(o=>o.sink==='textContent'&&o.value.includes('Aaron')));assert.ok(page.observations.some(o=>o.sink==='href'&&o.value.includes('assurance')));assert.ok(page.observations.some(o=>o.sink==='src'&&String(o.value).includes('identities')));assert.ok(page.observations.some(o=>o.sink==='data-item'));assert.ok(page.observations.every(o=>o.ordinal>0&&['undecided','declared-reference'].includes(o.status)));}
 const rows=report.rows.filter(r=>r.id.startsWith('discovered:'));assert.equal(rows.length,6);assert.ok(rows.every(r=>r.intent==='undecided'&&r.status==='undecided'));assert.equal(rows.reduce((n,r)=>n+r.discovery.reduce((m,e)=>m+e.count,0),0),discovery.undecided);assert.match(discovery.boundary,/not every corpus destination/);assert.match(discovery.method,/No equality/);assert.ok(fs.readFileSync('dist/assurance/index.html','utf8').includes('Discovered beyond the inventory'));assert.ok(fs.readFileSync('dist/assurance/index.html','utf8').includes('identity-discovery.json'));assert.equal(report.discovery.observed,discovery.observed);
});
