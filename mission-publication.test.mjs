import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'parse5';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const walk=node=>[node,...(node.childNodes??[]).flatMap(walk)];
const attr=(node,key)=>node.attrs?.find(a=>a.name===key)?.value;
const text=node=>node.value??(node.childNodes??[]).map(text).join('');
const page=route=>walk(parse(fs.readFileSync('dist/'+route,'utf8')));
const routes=['index.html','mission/index.html','writing/index.html','writing/power-must-serve-life/index.html','writing/faith-with-open-hands/index.html',...['sourcerer','author','dad','christian'].map(id=>'worlds/'+id+'/index.html')];
const expected=[['The mission','/mission/'],['Thoughts','/writing/'],['My Mind','/']];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

test('the Christian reading room introduces the essay and preserves three illustrated paths',()=>{
 const nodes=page('worlds/christian/threads.html');
 assert.ok(nodes.some(n=>attr(n,'class')==='faith-threads'));
 assert.equal(text(nodes.find(n=>n.tagName==='h1')),'Faith, with open hands.');
 const cards=nodes.filter(n=>attr(n,'class')==='identity-thread');
 assert.equal(cards.length,3);
 for(const card of cards){const image=walk(card).find(n=>n.tagName==='img');assert.ok(image);assert.equal(attr(image,'alt'),'');assert.equal(walk(card).filter(n=>n.tagName==='li').length,3);}
 assert.ok(nodes.some(n=>n.tagName==='a'&&attr(n,'href')==='/writing/faith-with-open-hands/'));
 for(const identity of ['dad','author','sourcerer'])assert.ok(!fs.readFileSync('dist/worlds/'+identity+'/threads.html','utf8').includes('class="faith-threads"'));
 const css=fs.readFileSync('dist/expedition.css','utf8');
 assert.ok(css.includes('body:has(.faith-threads),body[data-light="faith-reading"]{color-scheme:light;'));
 assert.ok(css.includes('.faith-threads .identity-thread:hover .faith-thread-art{transform:none;}'));
});

test('the faith essay has complete readings, accurate sharing metadata and resolvable navigation',()=>{
 const route='writing/faith-with-open-hands/index.html',nodes=page(route),base=new URL(route,'https://aaronalderman.com/');
 for(const id of ['god','jesus','bible','christianity','other-religions','practice','sources'])assert.ok(nodes.some(n=>n.tagName==='section'&&attr(n,'id')===id),id);
 assert.equal(text(nodes.find(n=>n.tagName==='h1')),'Faith, with open hands.');
 assert.equal(attr(nodes.find(n=>n.tagName==='meta'&&attr(n,'property')==='og:type'),'content'),'article');
 assert.equal(attr(nodes.find(n=>n.tagName==='meta'&&attr(n,'property')==='og:image'),'content'),'https://aaronalderman.com/assets/identities/optimized/christian-questions-v2.webp');
 for(const node of nodes){const href=attr(node,'href');if(!href)continue;const url=new URL(href,base);if(url.origin!==base.origin)continue;const file='dist/'+url.pathname.slice(1)+(url.pathname.endsWith('/')?'index.html':'');assert.ok(fs.existsSync(file),href);if(url.hash){const target=walk(parse(fs.readFileSync(file,'utf8')));assert.ok(target.some(n=>attr(n,'id')===decodeURIComponent(url.hash.slice(1))),href);}}
 assert.ok(fs.readFileSync('dist/writing/index.html','utf8').includes('/writing/faith-with-open-hands/'));
 assert.ok(fs.readFileSync('dist/sitemap.xml','utf8').includes('https://aaronalderman.com/writing/faith-with-open-hands/'));
});

test('the faith essay publishes exact corpus sources and remains within the admitted build budget',()=>{
 const essay=read('source/faith/reading.json'),receipt=read('dist/build-receipt.json');
 assert.equal(essay.sources.length,4);
 for(const source of essay.sources){assert.equal(hash(fs.readFileSync(source.path)),source.sha256);assert.equal(hash(fs.readFileSync('dist/'+source.path)),source.sha256);const origin=path.resolve('C:/Users/aaron/grand-theory',source.origin);if(fs.existsSync(origin))assert.equal(hash(fs.readFileSync(origin)),source.sha256);}
 assert.equal(receipt.sources['source/faith/reading.json'],hash(fs.readFileSync('source/faith/reading.json')));
 assert.equal(receipt.artifacts[essay.path],hash(fs.readFileSync('dist/'+essay.path)));
 assert.equal(receipt.execution.limit,20000000);assert.ok(receipt.execution.totalSteps<receipt.execution.limit);
});

test('the full publication has three actual header links and preserves the expedition',()=>{
 for(const route of routes){
  const nodes=page(route),nav=nodes.find(n=>n.tagName==='nav'&&attr(n,'aria-label')==='Main navigation');
  const links=walk(nav).filter(n=>n.tagName==='a');
  assert.deepEqual(links.map(n=>[text(n),attr(n,'href')]),expected,route);
  assert.ok(attr(links[0],'class').split(' ').includes('mission-nav'),route);
  assert.equal(nodes.filter(n=>n.tagName==='h1').length,1,route);
 }
 const home=page('index.html');
 assert.ok(home.some(n=>attr(n,'id')==='identity-switch'));
 assert.ok(home.some(n=>attr(n,'id')==='microsites'));
 assert.ok(!home.some(n=>attr(n,'class')==='mission-invitation'));
 const model=read('algebra/publication.process.json');
 assert.ok(!Object.hasOwn(model.queries,'publication.scroll.preview'));
 assert.ok(!model.queries['identity.change'].some(s=>['#identity-threads-nav','#identity-map-nav'].includes(s.args?.ref)));
});

test('mission, thoughts and the scroll work as script-free reading destinations',()=>{
 for(const route of routes.slice(1,4)){
  const nodes=page(route),ids=nodes.map(n=>attr(n,'id')).filter(Boolean);
  assert.equal(nodes.filter(n=>n.tagName==='script').length,0,route);
  assert.equal(ids.length,new Set(ids).size,route);
  for(const n of nodes.filter(n=>['a','img','link'].includes(n.tagName))){
   const target=attr(n,'href')??attr(n,'src');
   if(!target||/^(?:https?:|mailto:)/.test(target))continue;
   const url=new URL(target,'https://local.invalid/'+route);
   const local=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
   assert.ok(fs.existsSync(path.join('dist',local)),route+': '+target);
   if(url.pathname==='/'+route&&url.hash)assert.ok(ids.includes(decodeURIComponent(url.hash.slice(1))),target);
  }
 }
 const mission=page('mission/index.html');
 assert.equal(attr(mission.find(n=>n.tagName==='h1'),'aria-label'),'AI must serve life.');
 assert.ok(mission.some(n=>text(n)==='I believe'));
 assert.ok(mission.some(n=>n.tagName==='img'&&attr(n,'src')==='/assets/scroll/power-to-life-v1.webp'));
 const scroll=page('writing/power-must-serve-life/index.html');
 assert.equal(scroll.filter(n=>n.tagName==='section').length,18);
 assert.equal(scroll.filter(n=>n.tagName==='table').length,5);
 assert.equal(scroll.filter(n=>attr(n,'id')?.startsWith('note-')).length,17);
 assert.equal(attr(scroll.find(n=>n.tagName==='h1'),'aria-label'),'AI must serve life.');
 assert.ok(scroll.some(n=>attr(n,'class')==='crayon-revision scroll-crayon-revision'&&text(n)==='AI'));
 assert.ok(scroll.some(n=>n.tagName==='img'&&attr(n,'src')==='/assets/scroll/agency-triptych-v1.webp'));
 assert.ok(scroll.some(n=>n.tagName==='p'&&text(n).includes('Draft for review')));
});

test('release evidence binds the new routes to the full unchanged-budget build',()=>{
 const receipt=read('dist/build-receipt.json');
 assert.equal(read('bootstrap/site.json').entry,'publication.build');
 assert.equal(receipt.execution.limit,20000000);
 assert.ok(receipt.execution.totalSteps<receipt.execution.limit);
 for(const file of ['source/front-doors.rel','source/expedition.rel','source/hierarchy.rel','algebra/publication.process.json','assets/scroll/power-to-life-v1.webp'])assert.equal(receipt.sources[file],hash(fs.readFileSync(file)),file);
 for(const file of routes.slice(0,4))assert.equal(receipt.artifacts[file],hash(fs.readFileSync('dist/'+file)),file);
 for(const route of ['mission/','writing/','writing/power-must-serve-life/'])assert.ok(fs.readFileSync('dist/sitemap.xml','utf8').includes('https://aaronalderman.com/'+route),route);
 assert.ok(!fs.readFileSync('dist/sitemap.xml','utf8').includes('https://aaronalderman.com/mind/'));
});
