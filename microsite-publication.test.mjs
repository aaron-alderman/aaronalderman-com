import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'parse5';
import {createRequire} from 'node:module';
const root=new URL('.',import.meta.url),read=f=>fs.readFileSync(new URL(f,root)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const receipt=json('source/microsites/presentation-correspondence.json');
test('all four recomposed documents retain their independently compared source structure and reading',()=>{
 assert.equal(sha(read('source/microsites/editorial-successor.json')),receipt.editorialSuccessorSha256);
 assert.equal(receipt.pages.length,4);
 for(const page of receipt.pages){assert.equal(sha(read(page.source)),page.sourceSha256);assert.equal(sha(read('dist/'+page.path)),page.outputSha256);const html=read('dist/'+page.path).toString();if(page.navigationAddition){const n=page.navigationAddition;assert.equal(sha(html.replace(n.headInsertion,'').replace(n.bodyInsertion,'')),n.priorOutputSha256,page.path+' retains predecessor content');assert.ok(n.bodyInsertion.includes('Back to Aaron Alderman'));assert.ok(!n.bodyInsertion.includes('<script'));}assert.ok(html.includes('rel="canonical"'));assert.ok(html.includes('property="og:image"'));assert.ok(html.includes('name="twitter:card"'));}
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

test('project pages use their header home link or one algebra-owned return widget',()=>{
 const routes=new Set(json('source/hierarchy.json').items.map(item=>item.href).filter(href=>href.endsWith('/')));
 for(const route of ['creativity/','relational-geometry/','temple/films/','sourcery/films/']) routes.add(route);
 assert.equal(routes.size,24);
 for(const route of routes){
  const html=read('dist/'+route+'index.html').toString();
  const nodes=n=>[n,...(n.childNodes??[]).flatMap(nodes)],all=nodes(parse(html)),header=all.find(n=>n.tagName==='header'),brand=header&&nodes(header).find(n=>n.tagName==='a'),attrs=Object.fromEntries((brand?.attrs??[]).map(a=>[a.name,a.value]));
  if(attrs['aria-label']==='Aaron Alderman'){
   assert.ok(['/','/index.html'].includes(new URL(attrs.href,'https://aaronalderman.com/'+route).pathname),route);
   assert.ok(!html.includes('id="microsite-return"'),route+' already has a header return');
   assert.ok(!html.includes('assets/microsite-return.css'),route+' needs no widget spacing stylesheet');
   continue;
  }
  assert.equal((html.match(/id="microsite-return"/g)||[]).length,1,route);
  const anchor=html.match(/<a\b[^>]*id="microsite-return"[^>]*>[\s\S]*?<\/a>/)?.[0];
  assert.ok(anchor,route);
  assert.ok(anchor.includes('data-site="'+route.split('/')[0]+'"'),route+' keeps film and root themes together');
  const base=new URL(route,'https://aaronalderman.com/');
  assert.equal(new URL(anchor.match(/href="([^"]+)"/)[1],base).href,'https://aaronalderman.com/index.html#microsites',route);
  assert.ok(anchor.includes('Back to Aaron Alderman’s main website'),route);
  const sheet=html.match(/href="([^"]*microsite-return\.css[^\"]*)"/)[1];
  assert.equal(new URL(sheet,base).pathname,'/assets/microsite-return.css',route);
 }
 assert.ok(!read('dist/index.html').toString().includes('id="microsite-return"'));
 const css=read('dist/assets/microsite-return.css').toString();
 for(const fragment of ['position:fixed','min-height:44px',':focus-visible','prefers-reduced-motion'])assert.ok(css.includes(fragment),fragment);
 assert.match(css,/body:has\(>\s*\.microsite-return\)\s*\{\s*padding-bottom:\s*80px;?\s*\}/,'space belongs only to pages that contain the widget');
 assert.ok(!/(?:^|\})body\{padding-bottom:80px/.test(css),'no unconditional body padding');
 for(const route of ['assurance/','assurance/maturity/','assurance/identities/','assurance/accessibility/','assurance/internationalisation/','mission/','writing/','writing/power-must-serve-life/']){const html=read('dist/'+route+'index.html').toString();assert.ok(html.includes('aria-label="Aaron Alderman"'));assert.ok(!html.includes('id="microsite-return"'),route);assert.ok(!html.includes('assets/microsite-return.css'),route);}
});

test('return eligibility requires the actual named header anchor and a local personal home destination',async()=>{
 const require=createRequire(import.meta.url),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs'),{indexFacts}=require('./bootstrap/ports/fact-index.cjs');
 const entry='return.test.inspect',queries=json('algebra/publication.process.json').queries;
 const model=await lower({compiler:json('algebra/lowering.process.json'),definitions:json('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries:{[entry]:[{call:'microsite.return.inspectHome'},{let:'result',value:{html:'$result',hasHome:'$returnHasHome'}}],'microsite.return.inspectHome':queries['microsite.return.inspectHome']}},mode:'model',ports:valuePorts(),limit:20000000});
 const facts=[{s:'site',p:'origin',o:'https://aaronalderman.com/'},{s:'identity.author',p:'isa',o:'IdentityTheme'},{s:'identity.author',p:'homeRoute',o:'worlds/author/index.html'}],factIndex=await indexFacts(createKernel(valuePorts(),20000000),json('algebra/fact-index.process.json'),facts);
 const inspect=async html=>{const result=await invoke({model,entry,input:{factIndex,result:html,returnDocument:'assurance/maturity/index.html'},ports:{...valuePorts(),'url.resolve':({href,route})=>{const base=new URL(route,'https://temple.invalid/'),target=new URL(href,base);return{external:target.origin!==base.origin,route:decodeURIComponent(target.pathname.slice(1)),fragment:target.hash.slice(1)};}},limit:20000000});assert.equal(result.value.html,html,'inspection leaves the page bytes unchanged');return result.value.hasHome;};
 const header=href=>'<header><a aria-label="Aaron Alderman" href="'+href+'">Aaron <span>Alderman</span></a></header>';
 for(const href of ['../../index.html','/','/index.html','https://aaronalderman.com/#microsites','/worlds/author/index.html'])assert.equal(await inspect(header(href)),true,href);
 for(const html of [header('https://example.com/'),header('http://['),header('/wrong.html'),'<p>Aaron Alderman</p>','<footer><a aria-label="Aaron Alderman" href="/">Aaron Alderman</a></footer>',header('/').replace('Aaron Alderman','Temple'),'<header><a title=\'aria-label="Aaron Alderman"\' href="/">Other brand</a></header>',header('/').replace('href="/"','href="/" href="/wrong.html"'),'<!--'+header('/')+'-->','<SCRIPT>'+header('/')+'</SCRIPT>'])assert.equal(await inspect(html),false,html);
});
