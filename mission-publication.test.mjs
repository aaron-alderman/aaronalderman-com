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
const routes=['index.html','mission/index.html','writing/index.html','writing/power-must-serve-life/index.html',...['sourcerer','author','dad','christian'].map(id=>'worlds/'+id+'/index.html')];
const expected=[['The mission','/mission/'],['Thoughts','/writing/'],['My Mind','/']];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

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
 assert.equal(attr(mission.find(n=>n.tagName==='h1'),'aria-label'),'AI and superintelligence must serve life.');
 assert.ok(mission.some(n=>text(n)==='I believe'));
 assert.ok(mission.some(n=>n.tagName==='img'&&attr(n,'src')==='/assets/scroll/power-to-life-v1.webp'));
 const scroll=page('writing/power-must-serve-life/index.html');
 assert.equal(scroll.filter(n=>n.tagName==='section').length,18);
 assert.equal(scroll.filter(n=>n.tagName==='table').length,5);
 assert.equal(scroll.filter(n=>attr(n,'id')?.startsWith('note-')).length,17);
 assert.ok(scroll.some(n=>n.tagName==='h1'&&text(n)==='Power Must Serve Life'));
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
