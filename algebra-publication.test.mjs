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
 const expected=['','gate.html','atlas.html','questions.html','relational-geometry/',...Object.keys(scenes).map(id=>`places/${id}.html`),...['temple','temple/films','sourcery','sourcery/films','claimipedia','worldwright','encounter','kingdom','world-modelling','creativity','the-field'].map(slug=>slug+'/')].map(route=>'https://aaronalderman.com/'+route);
 for(const item of JSON.parse(await read('source/hierarchy.json')).items)for(const route of [item.href,'inspection/'+item.id+'.html']){const url='https://aaronalderman.com/'+route;if(!expected.includes(url))expected.push(url);}
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
   let target=path.resolve(root,'dist',path.dirname(file),href.split(/[?#]/)[0]);
   assert.ok(target.startsWith(path.join(root,'dist')+path.sep),file+': '+href);
   if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');
   assert.ok((await fs.stat(target)).isFile(),file+': '+href);
  }
 }
});

test('compatibility bytes and the explicit Temple mechanism predecessor/successor remain pinned',async()=>{
 for(const [file,hash]of Object.entries(contract.compatibilityOrigin.sha256)){
  assert.equal(sha(await fs.readFile(path.join(root,file))),hash,file+' source');
  assert.equal(sha(await fs.readFile(path.join(root,'dist',file))),hash,file+' output');
  const original=file.slice('retained/'.length);
  if(original!=='CNAME')assert.equal(sha(await fs.readFile(path.join(root,'dist',original==='index.html'?'reader.html':original))),hash,original+' compatibility URL');
 }
 for(const [file,hash]of Object.entries(contract.nativeOrigin.sha256))if(!contract.nativeSuccessor.changed.includes(file))assert.equal(sha(await fs.readFile(path.join(root,file))),hash,file);
 assert.equal(sha(await fs.readFile(path.join(root,'source/microsites/predecessor-native/runtime.cjs'))),contract.nativeOrigin.sha256['bootstrap/hosts/runtime.cjs']);
 assert.equal(sha(await fs.readFile(path.join(root,contract.nativeSuccessor.predecessor))),contract.nativeSuccessor.predecessorSha256);
 assert.deepEqual(receipt.nativeSources,contract.nativeSuccessor.sha256);assert.equal(sha(await fs.readFile(path.join(root,contract.atlasStorageSuccessor.predecessor))),contract.atlasStorageSuccessor.predecessorSha256);
 assert.deepEqual(contract.nativeSuccessor.changed,['bootstrap/hosts/runtime.cjs']);assert.deepEqual(contract.nativeSuccessor.added,['bootstrap/ports/browser-effects.cjs']);
});

test('algebra owns the publication with the existing admission rules, ports and budget',async()=>{
 assert.equal(receipt.assurance.places,40);assert.equal(receipt.assurance.sourceNotes,29);
 assert.equal(receipt.execution.limit,20_000_000);assert.ok(receipt.execution.totalSteps<20_000_000);
 assert.equal(receipt.admission.passes,19);assert.deepEqual(receipt.mjsImports,[]);
 for(const file of ['source/expedition.rel','source/presentation.rel','algebra/publication.process.json','source/gateway.rel','source/gateway-presentation.rel','algebra/gateway.process.json'])assert.equal(receipt.sources[file],sha(await fs.readFile(path.join(root,file))));
 for(const [file,hash]of Object.entries(receipt.artifacts))if(/\.(?:js|mjs|cjs)$/.test(file)){
  if(['temple/runtime.js','temple/early.js','sourcery/runtime.js','claimipedia/runtime.js','encounter/runtime.js','atlas-runtime.js','inspection/runtime.js'].includes(file)){assert.ok((await read('dist/'+file)).includes('const model=hydrateSnapshot('));continue;}
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
 assert.ok(home.includes('href="gate.html"'));
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
 assert.equal((home.match(/class="hierarchy-inspect"/g)||[]).length,17);
 assert.ok(!home.includes('hero-capabilities'));assert.ok(home.includes('expedition.css?v=polish-1'));
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
