// Verification only: this file is outside the application/native execution closure.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {scenes} from './retained/world.js';
import {readingFor,wordMeanings} from './retained/reading-guide.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=p=>fs.readFile(path.join(root,p),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const contract=JSON.parse(await read('source/publication-contract.json'));
const receipt=JSON.parse(await read('dist/build-receipt.json'));
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
  assert.ok(!html.includes('<script'),id+' works without parent-page JavaScript');
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
 const xml=await read('dist/sitemap.xml');assert.equal((xml.match(/<loc>/g)||[]).length,47);
 assert.ok(xml.includes('https://aaronalderman.com/claimipedia/'));
 assert.ok(xml.includes('https://aaronalderman.com/gate.html'));
 for(const id of Object.keys(scenes))assert.ok(xml.includes(`https://aaronalderman.com/places/${id}.html`));
});

test('all local links and assets in the new static pages resolve within the publication',async()=>{
 for(const file of ['index.html','gate.html','claimipedia/index.html',...Object.keys(scenes).map(id=>`places/${id}.html`)]){
  const html=await read('dist/'+file);
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
   const href=match[1];if(/^(?:https?:|#)/.test(href))continue;
   let target=path.resolve(root,'dist',path.dirname(file),href.split('#')[0]);
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
 assert.deepEqual(receipt.nativeSources,contract.nativeSuccessor.sha256);
 assert.deepEqual(contract.nativeSuccessor.changed,['bootstrap/hosts/runtime.cjs']);assert.deepEqual(contract.nativeSuccessor.added,['bootstrap/ports/browser-effects.cjs']);
});

test('algebra owns the publication with the existing admission rules, ports and budget',async()=>{
 assert.equal(receipt.assurance.places,40);assert.equal(receipt.assurance.sourceNotes,29);
 assert.equal(receipt.execution.limit,20_000_000);assert.ok(receipt.execution.totalSteps<20_000_000);
 assert.equal(receipt.admission.passes,11);assert.deepEqual(receipt.mjsImports,[]);
 for(const file of ['source/expedition.rel','source/presentation.rel','algebra/publication.process.json','source/gateway.rel','source/gateway-presentation.rel','algebra/gateway.process.json'])assert.equal(receipt.sources[file],sha(await fs.readFile(path.join(root,file))));
 for(const [file,hash]of Object.entries(receipt.artifacts))if(/\.(?:js|mjs|cjs)$/.test(file)){
  if(['temple/runtime.js','temple/early.js','sourcery/runtime.js'].includes(file)){assert.ok((await read('dist/'+file)).includes('const model=hydrateSnapshot('));continue;}
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
 assert.ok(home.includes('Explore the reading paths'));
 assert.ok(html.includes('id="path-claimipedia"'));
 assert.ok(!html.includes('href="temple/index.html"'));assert.ok(!html.includes('href="sourcery/index.html"'));
 for(const id of Object.keys(scenes))assert.ok((await read(`dist/places/${id}.html`)).includes('href="../gate.html" class="gate-nav"'),id+' can reach the corpus');
 const provenance=JSON.parse(await read('source/gateway-provenance.json'));
 assert.deepEqual(provenance.sourceIntent.names,['Temple','Sourcery','Claimipedia','Worldright','Kingdom','The Field','World']);
 assert.deepEqual(provenance.interpretation.proposedReadingPaths,['Kingdom','The Field','World']);
});

test('the homepage links directly to published microsites and Claimipedia has an honest standalone stub',async()=>{
 const home=await read('dist/index.html'),menu=home.match(/<nav class="hero-microsites"[\s\S]*?<\/nav>/)?.[0];assert.ok(menu);
 assert.equal((menu.match(/<a /g)||[]).length,3);
 for(const [name,href]of [['Temple','temple/'],['Sourcery','sourcery/'],['Claimipedia','claimipedia/']])assert.ok(menu.includes(`href="${href}"`)&&menu.includes(`<strong>${name}</strong>`));
 assert.ok(!menu.includes('gate.html'));assert.ok(!menu.includes('github.io'));
 const stub=await read('dist/claimipedia/index.html');assert.ok(stub.includes('<h1 id="claimipedia-title">Claimipedia</h1>'));assert.ok(stub.includes('Microsite in preparation'));assert.ok(stub.includes('href="../gate.html#path-claimipedia"'));assert.equal(meta(stub,'og:url'),'https://aaronalderman.com/claimipedia/');assert.ok(!stub.includes('<script'));
});

test('a fresh algebra build reproduces every publication artifact',async()=>{
 const result=spawnSync(process.execPath,['bootstrap/run.cjs','.', 'verify-build','bootstrap/site.json'],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const repeated=JSON.parse(await read('verify-build/build-receipt.json'));
 assert.deepEqual(repeated,receipt);
 for(const [file,hash]of Object.entries(receipt.artifacts))assert.equal(sha(await fs.readFile(path.join(root,'verify-build',file))),hash,file);
});
