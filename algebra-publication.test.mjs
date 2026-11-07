// Verification only: this file is outside the application/native execution closure.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {scenes} from './retained/world.js';
import {readingFor,wordMeanings} from './retained/reading-guide.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=p=>fs.readFile(path.join(root,p),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const contract=JSON.parse(await read('source/publication-contract.json'));
const receipt=JSON.parse(await read('dist/build-receipt.json'));
const {parseRel}=createRequire(import.meta.url)('./bootstrap/ports/rel-codec.cjs');
const siteFacts=parseRel(await read('source/expedition.rel'));
const stylesheetVersion=siteFacts.find(f=>f.s==='site'&&f.p==='stylesheetVersion').o;
const meta=(html,key)=>[...html.matchAll(/<meta\s+([^>]+)>/g)].map(m=>m[1]).find(a=>a.includes(`property="${key}"`)||a.includes(`name="${key}"`))?.match(/content="([^"]*)"/)?.[1];

test('every encounter has a crawler-readable canonical page and complete sharing metadata',async()=>{
 const titles=new Set();
 for(const [id,scene]of Object.entries(scenes)){
  const html=await read(`dist/places/${id}.html`),r=readingFor(id,scene),url=`https://aaronalderman.com/places/${id}.html`;
  assert.ok(html.includes(`<h1>${escape(r.title.replaceAll('\n',' '))}</h1>`),id);
  assert.ok(html.includes(`rel="canonical" href="${url}"`),id);
  assert.equal(meta(html,'og:url'),url);assert.equal(meta(html,'og:description'),escape(r.lead));
  assert.equal(meta(html,'twitter:card'),'summary_large_image');assert.equal(meta(html,'twitter:title'),meta(html,'og:title'));
  assert.equal(meta(html,'twitter:image'),meta(html,'og:image'));assert.ok(meta(html,'og:image:alt'));
  assert.ok(html.includes('src="../atlas-runtime.js?v=journey-1" defer'));assert.ok(!html.match(/<script[^>]*>[^<]+/),id+' has no inline application logic');
  for(const paragraph of [...r.body,...scene.body])assert.ok(html.includes(escape(paragraph)),id+' preserves its reading and full explanation');
  for(const word of r.words){assert.ok(html.includes(escape(word)));assert.ok(html.includes(escape(wordMeanings[word])));}
  for(const choice of scene.choices)assert.ok(html.includes(`href="${choice.to}.html"`),id+' retains '+choice.to);
  titles.add(meta(html,'og:title'));
 }
 assert.equal(titles.size,40);
 const home=await read('dist/index.html');assert.ok(home.includes('Inside the mind'));assert.ok(home.includes('sourcerer.'));assert.ok(home.includes('Built with Worldwright.io'));
});

test('the social image is a real correctly described bitmap; sitemap includes all canonical pages',async()=>{
 const b=await fs.readFile(path.join(root,'dist/assets/sourcerer-threshold.png'));
 assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16),1672);assert.equal(b.readUInt32BE(20),941);
 assert.ok(b.length<5_000_000);
 const xml=await read('dist/sitemap.xml'),urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 const expected=['','mission/','writing/','writing/power-must-serve-life/','writing/faith-with-open-hands/','assurance/','assurance/identities/','assurance/accessibility/','assurance/internationalisation/','assurance/maturity/','assurance/rendered-layout/','roadmap/','gate.html','atlas.html','questions.html','questions-sourcerer.html','questions-author.html','questions-dad.html','relational-geometry/','inspection/source-algebra.html',...Object.keys(scenes).map(id=>`places/${id}.html`),...['temple','temple/films','sourcery','sourcery/films','claimipedia','worldwright','encounter','kingdom','world-modelling','creativity','the-field','the-field/correction'].map(slug=>slug+'/')].map(route=>'https://aaronalderman.com/'+route);
 for(const room of JSON.parse(await read('source/reading/rooms.json')).rooms)expected.push(room.essay.canonical);
 for(const item of JSON.parse(await read('source/hierarchy.json')).items)for(const route of [item.href,'inspection/'+item.id+'.html']){const url='https://aaronalderman.com/'+route;if(!expected.includes(url))expected.push(url);}
 for(const identity of ['sourcerer','author','dad','christian'])for(const route of ['index.html','threads.html','atlas.html','questions.html',...Object.keys(scenes).map(id=>`places/${id}.html`)])expected.push(`https://aaronalderman.com/worlds/${identity}/${route}`);
 assert.deepEqual([...urls].sort(),expected.sort());assert.equal(new Set(urls).size,urls.length);
 assert.ok(xml.includes('https://aaronalderman.com/claimipedia/'));
 assert.ok(xml.includes('https://aaronalderman.com/gate.html'));
 for(const id of Object.keys(scenes))assert.ok(xml.includes(`https://aaronalderman.com/places/${id}.html`));
});

test('all local links and assets in the new static pages resolve within the publication',async()=>{
 for(const file of ['index.html','gate.html','atlas.html','claimipedia/index.html',...Object.keys(scenes).map(id=>`places/${id}.html`)]){
  const html=await read('dist/'+file);
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
   const href=match[1];if(/^(?:https?:|#)/.test(href))continue;
   const route=new URL(href,'https://publication.invalid/'+file).pathname.replace(/^\/+/, '');
   let target=path.resolve(root,'dist',decodeURIComponent(route));
   assert.ok(target===path.join(root,'dist')||target.startsWith(path.join(root,'dist')+path.sep),file+': '+href);
   if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');
   assert.ok((await fs.stat(target)).isFile(),file+': '+href);
  }
 }
});

test('historical oracle bytes, passive resources and declared mechanism successors remain pinned',async()=>{
 for(const [file,hash]of Object.entries(contract.compatibilityOrigin.sha256)){
  assert.equal(sha(await fs.readFile(path.join(root,file))),hash,file+' source');
  if(/\.(?:m?js)$|\/regenerate\.cjs$/.test(file)){await assert.rejects(fs.stat(path.join(root,'dist',file)),{code:'ENOENT'});continue;}
  if(contract.stylesheetSuccessor&&JSON.parse(await read(contract.stylesheetSuccessor.contract)).stylesheets.some(sheet=>sheet.outputs.includes(file)))continue;
  if(contract.readerWorkshopSuccessor.replacedDocuments.includes(file))continue;
  assert.equal(sha(await fs.readFile(path.join(root,'dist',file))),hash,file+' output');
  const original=file.slice('retained/'.length);
  if(original!=='CNAME')assert.equal(sha(await fs.readFile(path.join(root,'dist',original==='index.html'?'reader.html':original))),hash,original+' compatibility URL');
 }
 for(const [file,hash]of Object.entries(contract.nativeOrigin.sha256))if(!contract.nativeSuccessor.changed.includes(file))assert.equal(sha(await fs.readFile(path.join(root,file))),hash,file);
 assert.equal(sha(await fs.readFile(path.join(root,'source/microsites/predecessor-native/runtime.cjs'))),contract.nativeOrigin.sha256['bootstrap/hosts/runtime.cjs']);
 assert.equal(sha(await fs.readFile(path.join(root,contract.nativeSuccessor.predecessor))),contract.nativeSuccessor.predecessorSha256);
 assert.deepEqual(receipt.nativeSources,contract.nativeSuccessor.sha256);assert.equal(sha(await fs.readFile(path.join(root,contract.atlasStorageSuccessor.predecessor))),contract.atlasStorageSuccessor.predecessorSha256);
 assert.deepEqual(contract.nativeSuccessor.changed,['bootstrap/hosts/runtime.cjs','bootstrap/ports/node.cjs','bootstrap/run.cjs']);assert.deepEqual(contract.nativeSuccessor.added,['bootstrap/ports/browser-effects.cjs','bootstrap/ports/process-source.cjs']);
 for(const predecessor of Object.values(contract.readerWorkshopSuccessor.predecessors))assert.equal(sha(await fs.readFile(path.join(root,predecessor.path))),predecessor.sha256);
 assert.equal(contract.readerWorkshopSuccessor.seedUnchanged,true);
});

test('algebra owns the publication with the existing admission rules, ports and budget',async()=>{
 assert.equal(receipt.assurance.places,40);assert.equal(receipt.assurance.sourceNotes,29);
 assert.equal(receipt.execution.limit,20_000_000);assert.ok(receipt.execution.totalSteps<20_000_000);
 assert.equal(receipt.admission.passes,31);assert.deepEqual(receipt.mjsImports,[]);
 for(const file of ['source/expedition.rel','source/presentation.rel','algebra/publication.process.json','source/gateway.rel','source/gateway-presentation.rel','algebra/gateway.process.json'])assert.equal(receipt.sources[file],sha(await fs.readFile(path.join(root,file))));
 for(const [file,hash]of Object.entries(receipt.artifacts))if(/\.(?:js|mjs|cjs)$/.test(file)){
  if(['temple/runtime.js','temple/early.js','sourcery/runtime.js','claimipedia/runtime.js','encounter/runtime.js','atlas-runtime.js','identity-runtime.js','inspection/runtime.js','assurance/rendered-runtime.js','roadmap/runtime.js',...contract.readerWorkshopSuccessor.runtimes].includes(file)){assert.ok((await read('dist/'+file)).includes('const model=hydrateSnapshot('));continue;}
  const retained=file.startsWith('retained/')?file:'retained/'+file;
  assert.equal(hash,contract.compatibilityOrigin.sha256[retained],file+' is unchanged compatibility code');
 }
 const css=await read('dist/expedition.css');assert.ok(css.includes(':focus-visible'));assert.ok(css.includes('(prefers-reduced-motion: reduce)'));assert.ok(css.includes('@keyframes arrival{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}'));
 assert.ok(css.includes('arrival 1.2s ease-out both'));assert.ok(!css.includes('infinite'));
});

test('reading paths connect the guided journey to research while microsites keep their own entrances',async()=>{
 const html=await read('dist/gate.html'),home=await read('dist/index.html');
 assert.equal(meta(html,'og:url'),'https://aaronalderman.com/gate.html');
 assert.equal(meta(html,'twitter:card'),'summary_large_image');
 assert.ok(!html.includes('<script'));
 assert.ok(html.includes('https://aaron-alderman.github.io/spin23-relational-geometry/edition-3/library/'));
 for(const name of ['Executable meaning','Software &amp; agency','Claims &amp; evidence','Stories &amp; encounters','Faith &amp; responsibility','Open questions','Shared worlds'])assert.ok(html.includes('>'+name+'</a></h3>'),name);
 assert.equal((html.match(/class="corpus-door"/g)||[]).length,7);
 assert.equal((html.match(/>Suggested reading path</g)||[]).length,3);
 assert.ok(html.includes('they do not define future microsites'));
 assert.ok(home.includes('href="/worlds/sourcerer/threads.html"'));
 assert.ok(html.includes('id="path-claimipedia"'));
 assert.ok(!html.includes('href="temple/index.html"'));assert.ok(!html.includes('href="sourcery/index.html"'));
 for(const id of Object.keys(scenes))assert.ok((await read(`dist/places/${id}.html`)).includes('href="../gate.html" class="gate-nav"'),id+' can reach the corpus');
 const provenance=JSON.parse(await read('source/gateway-provenance.json'));
 assert.deepEqual(provenance.sourceIntent.names,['Temple','Sourcery','Claimipedia','Worldright','Kingdom','The Field','World']);
 assert.deepEqual(provenance.interpretation.proposedReadingPaths,['Kingdom','The Field','World']);
});

test('the homepage presents the hierarchy and preserves existing project entrances',async()=>{
 const home=await read('dist/index.html');
 for(const id of ['foundation','applications','taking-shape','tooling'])assert.ok(home.includes('id="'+id+'"'));
 for(const href of ['temple/','sourcery/','claimipedia/','claimipedia-science/','worldwright/','kingdom/','world-modelling/','tradie/','foundry/','encounter/','the-field/','supercrm/','timesheet/','workgarden/','harborboard/','relationship-manager/'])assert.ok(home.includes('href="'+href+'"'),href);
 assert.equal((home.match(/class="hierarchy-inspect"/g)||[]).length,18);
 assert.ok(!home.includes('hero-capabilities'));assert.ok(home.includes('expedition.css?v='+stylesheetVersion));
 const stub=await read('dist/claimipedia/index.html');assert.equal(meta(stub,'og:url'),'https://aaronalderman.com/claimipedia/');assert.ok(stub.includes('runtime.js?v=review-1'));
});

test('Claimipedia has its own three-lens identity with accessible sections, local assets and quiet motion',async()=>{
 const html=await read('dist/claimipedia/index.html'),css=await read('dist/claimipedia/claimipedia.css');
 assert.equal((html.match(/class="claim-lens /g)||[]).length,3);
 assert.ok(!css.includes('@media@media'));assert.ok(css.includes('@media(max-width: 760px){.review-results{grid-template-columns:1fr;}}'));
 for(const id of ['example','review-evidence','review-results','review-announcement'])assert.ok(html.includes('id="'+id+'"'));
 for(const id of ['world','knowing','doing','idea','inquiry','main'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('Claimipedia, back to the top'));assert.ok(!html.includes('class="masthead"'));
 assert.ok(css.includes('(prefers-reduced-motion: reduce)'));assert.ok(css.includes('animation:none !important'));assert.ok(css.includes('@keyframes arrival'));assert.ok(!css.includes('infinite'));
 for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){const file=path.resolve(root,'dist/claimipedia',match[1]);assert.ok((await fs.stat(file)).isFile());}
 const motif=JSON.parse(await read('source/claimipedia-motif.json'));assert.equal(sha(await fs.readFile(path.join(root,'dist',motif.landscape.path))),motif.landscape.sha256);
 assert.equal(meta(html,'og:image'),'https://aaronalderman.com/assets/sharing/claimipedia-purpose-v1.png');
});

test('purpose-first sharing cards have real raster bytes and consistent server-visible metadata',async()=>{
 const sharing=JSON.parse(await read('source/social-sharing.json'));
 assert.equal(sharing.images.length,5);
 for(const card of sharing.images){
  const html=await read(card.slug==='home'?'dist/index.html':'dist/'+card.slug+'/index.html'),bytes=await fs.readFile(path.join(root,'dist',card.path));
  assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(sha(bytes),card.sha256);
  assert.equal(bytes.readUInt32BE(16),card.width);assert.equal(bytes.readUInt32BE(20),card.height);
  assert.ok(card.width/card.height>1.85&&card.width/card.height<1.96);
  assert.equal(meta(html,'og:image'),'https://aaronalderman.com/'+card.path);assert.equal(meta(html,'twitter:image'),meta(html,'og:image'));
  for(const [key,value]of Object.entries({'og:title':card.title,'og:description':card.description,'og:image:alt':card.alt,'og:image:width':String(card.width),'og:image:height':String(card.height),'og:image:type':'image/png','twitter:image:alt':card.alt}))assert.equal(meta(html,key),escape(value),card.slug+' '+key);
  for(const key of ['og:image','twitter:image','twitter:card'])assert.equal((html.match(new RegExp('(?:name|property)="'+key+'"','g'))||[]).length,1,card.slug+' '+key+' is unambiguous');
 }
});

test('a fresh algebra build reproduces every publication artifact',async()=>{
 const result=spawnSync(process.execPath,['bootstrap/run.cjs','.', 'verify-build','bootstrap/site.json'],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const repeated=JSON.parse(await read('verify-build/build-receipt.json'));
 assert.deepEqual(repeated,receipt);
 for(const [file,hash]of Object.entries(receipt.artifacts))assert.equal(sha(await fs.readFile(path.join(root,'verify-build',file))),hash,file);
});

test('navigation/layout discovery covers the complete generated HTML artifact set',async()=>{
 const report=JSON.parse(await read('dist/assurance/navigation-layout.json'));
 const expected=Object.keys(receipt.artifacts).filter(p=>p.endsWith('.html')).sort();
 assert.deepEqual(report.pages.map(p=>p.route).sort(),expected,'Every HTML publishing effect must register its route in the algebra; unregistered output blocks release');
 assert.equal(report.pageCount,expected.length);
 const registered=JSON.parse(await read('dist/assurance/generated-pages.json'));
 assert.deepEqual(Object.keys(registered).filter(p=>p.endsWith('.css')).sort(),Object.keys(receipt.artifacts).filter(p=>p.endsWith('.css')).sort());
 assert.equal(report.geometryUnmeasured,report.pages.filter(p=>p.geometry.status!=='measured').length);
 assert.ok(report.pages.every(p=>['measured','needs-browser-evidence'].includes(p.geometry.status)));
 assert.equal(new Set(report.pages.map(p=>p.route)).size,expected.length);
 assert.ok((await read('dist/assurance/index.html')).includes('navigation-layout/'));
});

test('navigation/layout algebra distinguishes defects, review candidates and opaque examples',async()=>{
 const require=createRequire(import.meta.url),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs'),{indexFacts}=require('./bootstrap/ports/fact-index.cjs');
 const json=async f=>JSON.parse(await read(f)),q=(await json('algebra/publication.process.json')).queries,entry='assurance.surface.scan';
 const model=await lower({compiler:await json('algebra/lowering.process.json'),definitions:await json('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries:{[entry]:q[entry],'microsite.return.inspectHome':q['microsite.return.inspectHome']}},mode:'model',ports:valuePorts(),limit:20000000});
 const factIndex=await indexFacts(createKernel(valuePorts(),20000000),await json('algebra/fact-index.process.json'),[{s:'site',p:'origin',o:'https://aaronalderman.com/'}]);
 const scan=async html=>(await invoke({model,entry,input:{factIndex,eventInput:{route:'assurance/maturity/index.html',html}},ports:{...valuePorts(),'url.resolve':({href,route})=>{const base=new URL(route,'https://temple.invalid/'),u=new URL(href,base);return{external:u.origin!==base.origin,route:u.pathname.slice(1),fragment:u.hash.slice(1)}}},limit:20000000})).value;
 const header='<header><a aria-label="Aaron Alderman" href="/">Aaron Alderman</a></header>',widget='<a id="microsite-return" href="/">Back to Aaron Alderman</a>',style='<link rel="stylesheet" href="../../assets/microsite-return.css?v=return-2">';
 assert.deepEqual((await scan(header+widget+style)).findings.map(f=>f.rule),['navigation.redundant-home-return']);
 assert.deepEqual((await scan(header+style)).findings.map(f=>f.rule),['layout.orphan-return-reservation']);
 assert.equal((await scan('<body style="padding-bottom:80px">')).findings[0].status,'undecided');
 for(const html of [header,'<header>Temple</header>'+widget+style,'<!--'+widget+'-->'+header,'<script>'+widget+'</script>'+header,'<body style="padding-bottom:0px">','<SCRIPT>'+widget+'</SCRIPT>'+header,"<div title='<a id=\"microsite-return\">'>Example</div>"+header])assert.equal((await scan(html)).findings.length,0,html);
 assert.equal((await scan(header)).geometry.status,'needs-browser-evidence');
 const published=JSON.parse(await read('dist/assurance/navigation-layout.json')),self=published.pages.find(p=>p.route==='assurance/navigation-layout/index.html');
 const finalSelf=await scan(await read('dist/assurance/navigation-layout/index.html'));
 const {geometry:staticGeometry,...staticSelf}=finalSelf,{geometry:measuredGeometry,...reportedSelf}=self;
 assert.deepEqual({...staticSelf,route:self.route},reportedSelf,'Final source observations are stable; browser geometry has independent receipts');

 const cssEntry='assurance.surface.stylesheet',cssModel=await lower({compiler:await json('algebra/lowering.process.json'),definitions:await json('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry:cssEntry,queries:{[cssEntry]:q[cssEntry]}},mode:'model',ports:valuePorts(),limit:20000000});
 for(const [css,status]of [['body{padding-bottom:80px}','undecided'],['body:has(> .microsite-return){padding-bottom:80px}','not-observed'],['/*body{padding-bottom:80px}*/','not-observed'],['body{padding-bottom:0px}','not-observed']])assert.equal((await invoke({model:cssModel,entry:cssEntry,input:{eventInput:{route:'test.css',css}},ports:valuePorts(),limit:20000000})).value.status,status,css);

});

test('rendered assurance covers both viewports, binds current artifacts and replays the admitted algebra',async()=>{
 const {createRenderedAssessor}=await import('./tooling/assess-rendered-layout.mjs');
 const published=JSON.parse(await read('dist/assurance/rendered-layout.json')),snapshots=JSON.parse(await read('dist/assurance/rendered-observations.json'));
 const assessor=await createRenderedAssessor(),observationPlan=(await assessor.plan()).value;
 assert.equal((await assessor.acceptPlan(published.observationPlan)).value.ok,true);
 const planSha=sha(JSON.stringify(published.observationPlan));
 const expected=Object.keys(receipt.artifacts).filter(p=>p.endsWith('.html')).flatMap(route=>['desktop','mobile'].map(profile=>route+'|'+profile)).sort();
 assert.deepEqual(snapshots.map(s=>s.route+'|'+s.profile).sort(),expected,'Every generated route needs exactly one observation at each declared width');
 for(const s of snapshots){assert.equal(s.planSha256,planSha,'The captured browser observation plan must match the algebra');assert.equal(new URL(s.url).pathname,'/'+s.route);assert.equal(s.viewport.width,s.profile==='desktop'?1280:390);assert.equal(s.viewport.height,s.profile==='desktop'?800:844);assert.equal(s.readyState,'complete',s.route);assert.equal(s.fontStatus,'loaded',s.route);}
 for(const [file,hash]of Object.entries(receipt.artifacts).filter(([file])=>/\.(html|css|js|svg|png|webp|jpg|jpeg|woff|woff2)$/.test(file)))assert.equal(published.bindings[file],hash,'Browser evidence is stale for '+file+'; remeasure affected routes before release');
 assert.equal(published.observerSha256,sha((await read('tooling/rendered-browser-observer.mjs')).replace(/\r\n/g,'\n')));
 const replay=await assessor.report(snapshots,published.observationPlan);
 assert.equal(published.policySha256,assessor.policySha256);assert.deepEqual(published.report,JSON.parse(JSON.stringify(replay.value)));
 assert.equal(published.report.observationCount,expected.length);
 assert.ok(published.report.assessments.every(a=>a.status==='measured'));
 const sourceFindings=published.report.findings.filter(f=>f.route==='assurance/navigation-layout/index.html'&&f.finding.text==='Source findings');
 for(const profile of ['desktop','mobile'])assert.ok(sourceFindings.some(f=>f.profile===profile&&f.finding.rule==='structure.heading-content-rail'),'Source findings rail aberration must remain captured at '+profile);
 assert.ok(published.report.findings.some(f=>f.finding.text==='Stylesheet space reservations'&&f.finding.rule==='structure.heading-only-region'));
 assert.ok(published.report.findings.some(f=>f.route!=='assurance/navigation-layout/index.html'),'The audit must seek other pages, not only the supplied example');
 const navigation=JSON.parse(await read('dist/assurance/navigation-layout.json'));assert.equal(navigation.geometryUnmeasured,0);assert.ok(navigation.pages.every(p=>p.geometry.status==='measured'));
 assert.ok((await read('dist/assurance/navigation-layout/index.html')).includes('<section class="assurance-products"><h2>Source findings</h2>'),'The example remains unfixed for discernment');
});

test('rendered geometry rules do not depend on a supplied heading title or assume every gap is waste',async()=>{
 const {createRenderedAssessor}=await import('./tooling/assess-rendered-layout.mjs'),assessor=await createRenderedAssessor(),snapshots=JSON.parse(await read('dist/assurance/rendered-observations.json'));
 const observed=snapshots.find(s=>s.route==='assurance/navigation-layout/index.html'&&s.profile==='desktop'),renamed=structuredClone(observed),heading=renamed.headings.find(h=>h.text==='Source findings');heading.text='An unrelated section title';
 const duplicated=structuredClone(observed);for(const region of duplicated.regions)region.contentRects.push(...region.contentRects);
 assert.deepEqual((await assessor.assess(duplicated)).value,(await assessor.assess(observed)).value,'Content-edge deduplication preserves the verdict');
 const original=await assessor.assess(observed),variant=await assessor.assess(renamed);assert.deepEqual(variant.value.findings.map(f=>f.rule),original.value.findings.map(f=>f.rule));
 const peers=renamed.headings.filter(h=>h.rank===heading.rank&&h.rect.left>0);heading.rect={...heading.rect,left:peers[0].rect.left,right:peers[0].rect.right,width:peers[0].rect.width};
 const aligned=await assessor.assess(renamed);assert.ok(!aligned.value.findings.some(f=>f.rule==='structure.heading-content-rail'&&f.node===heading.path));
 const overflow=structuredClone(observed);overflow.document.scrollWidth=overflow.viewport.width+24;assert.ok((await assessor.assess(overflow)).value.findings.some(f=>f.rule==='layout.document-horizontal-overflow'));
 const reserve=structuredClone(observed);reserve.footer={path:'footer',rect:{bottom:reserve.document.scrollHeight-80}};reserve.returnWidget=true;assert.ok(!(await assessor.assess(reserve)).value.findings.some(f=>f.rule==='layout.document-trailing-space'));
 reserve.returnWidget=false;assert.ok((await assessor.assess(reserve)).value.findings.some(f=>f.rule==='layout.document-trailing-space'));
 const unsettled=structuredClone(observed);unsettled.fontStatus='loading';assert.equal((await assessor.assess(unsettled)).value.status,'incomplete');
 const published=JSON.parse(await read('dist/assurance/rendered-layout.json')),thresholdReplay=structuredClone(published.observationPlan);thresholdReplay.thresholds.inset+=4;assert.equal((await assessor.acceptPlan(thresholdReplay)).value.ok,true);
 thresholdReplay.groups.headings='h1';assert.equal((await assessor.acceptPlan(thresholdReplay)).value.ok,false);
 await assert.rejects(assessor.report(snapshots,thresholdReplay),/RENDERED-PLAN/);

});

// Roadmap invariants run within the contract's declared publication test entry.
await import('./tooling/roadmap-tests.mjs');
