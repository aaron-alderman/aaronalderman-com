import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=new URL('.',import.meta.url),read=f=>fs.readFileSync(new URL(f,root)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const receipt=json('source/microsites/presentation-correspondence.json');
test('all four recomposed documents retain their independently compared source structure and reading',()=>{
 assert.equal(sha(read('source/microsites/editorial-successor.json')),receipt.editorialSuccessorSha256);
 assert.equal(receipt.pages.length,4);
 for(const page of receipt.pages){assert.equal(sha(read(page.source)),page.sourceSha256);assert.equal(sha(read('dist/'+page.path)),page.outputSha256);const html=read('dist/'+page.path).toString();assert.ok(html.includes('rel="canonical"'));assert.ok(html.includes('property="og:image"'));assert.ok(html.includes('name="twitter:card"'));}
});

test('microsite navigation and referenced resources stay inside the ecosystem and resolve, including fragments',()=>{
 for(const page of receipt.pages){
  const html=read('dist/'+page.path).toString(),base=new URL(page.path,'https://aaronalderman.com/');
  for(const match of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)){
   const url=new URL(match[1].replaceAll('&amp;','&'),base);assert.equal(url.origin,base.origin,page.path+': '+url.href);
   const relative=decodeURIComponent(url.pathname).replace(/^\//,''),file=(!relative||relative.endsWith('/'))?relative+'index.html':relative;
   assert.ok(fs.statSync(new URL('dist/'+file,root)).isFile(),page.path+': '+file);
   if(url.hash){const target=read('dist/'+file).toString(),id=decodeURIComponent(url.hash.slice(1));assert.ok(target.includes('id="'+id+'"'),page.path+': missing #'+id);}
  }
  assert.ok(html.includes('ecosystem-links'));assert.ok(html.includes('>Corpus gate</a>'));assert.ok(html.includes('>Temple</a>'));assert.ok(html.includes('>Sourcery</a>'));
 }
 for(const file of ['temple/index.html','temple/films/index.html']){const html=read('dist/'+file).toString();assert.ok(html.includes('<span>Temple</span>'));assert.ok(!html.includes('aria-label="Sourcery, back'));}
 const temple=read('dist/temple/index.html').toString();for(const obsolete of ['latest integrated qualification','101 of 101','486 hostile cases','Claimipedia opens soon','Enforced in Claimipedia today'])assert.ok(!temple.includes(obsolete));
 assert.ok(temple.includes('software that checks proposed changes against explicit rules and authority'));
 const sourcery=read('dist/sourcery/index.html').toString();assert.ok(sourcery.includes('Sourcery creates software from explicit descriptions'));assert.ok(sourcery.includes('broomsticks illustrate automation'));for(const obsolete of ['opening soon','opens soon','How Sourcery and Claimipedia work today.','Enforced in Claimipedia today'])assert.ok(!sourcery.includes(obsolete));
});
test('every captured microsite asset and both complete stylesheets retain their exact bytes',()=>{
 for(const sheet of receipt.sheets){assert.equal(sha(read(sheet.source)),sheet.sha256);assert.equal(sha(read('dist/'+sheet.path)),sheet.sha256);}
 const originals=json('source/microsites/originals.json');
 for(const item of originals.sources){assert.equal(sha(read(item.source)),item.sha256,item.source);if(item.kind==='asset')assert.equal(sha(read('dist/'+item.site+'/'+item.path)),item.sha256,item.path);}
});
test('original application JavaScript is an oracle only; shipping behaviour is algebra-owned',()=>{
 const build=json('dist/build-receipt.json');
 for(const file of ['temple/runtime.js','sourcery/runtime.js']){const bundle=read('dist/'+file).toString();assert.ok(bundle.includes('const model=hydrateSnapshot('));for(const declaration of ['function initSky(','function onPropose(','function summon(','function draft('])assert.ok(!bundle.includes(declaration));}
 for(const file of Object.keys(build.artifacts))assert.ok(!file.includes('/oracle/'));
 for(const item of json('source/microsites/originals.json').sources.filter(v=>v.kind==='js'))assert.ok(!Object.hasOwn(build.artifacts,item.site+'/'+item.path));
 const inventory=json('source/microsites/function-inventory.json'),correspondence=json('source/microsites/function-correspondence.json');assert.equal(correspondence.entries.length,inventory.files.reduce((n,f)=>n+f.functions.length,0));
 for(const entry of correspondence.entries)assert.ok(entry.owner);
 assert.equal(build.seedSha256,json('source/publication-contract.json').nativeOrigin.sha256['bootstrap/temple-seed.cjs']);assert.equal(build.execution.limit,20_000_000);
});
