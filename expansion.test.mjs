import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {scenes,sources,territories} from './retained/world.js';
import {regions,coverage} from './retained/expansion.js';
import {renderWorldEncounter} from './retained/world-encounters.js';
import {sourceReceipts} from './retained/source-receipts.js';
import {allowedPairs,positivePairs,inflatePair,decodeRepetition,weightedOptions,memoryTrace,coarseCells,reportedRates} from './retained/world-models.js';
const root=path.dirname(fileURLToPath(import.meta.url));
test('each of the ten identified areas has a distinct, sourced and rendered entrance and continuation',()=>{
 assert.equal(regions.length,10);
 const all=new Set();
 for(const region of regions){
  assert.ok(region.scenes.length>=2);
  assert.ok(territories.some(t=>t.id===region.light));
  for(const id of region.scenes){
   assert.ok(!all.has(id));all.add(id);const s=scenes[id];assert.equal(s.area,region.id);assert.ok(s.body.length>=3);assert.ok(s.body.join(' ').length>=450);assert.ok(sources[s.source]);
   const rendered=renderWorldEncounter(s);assert.ok(rendered.includes('world-encounter'),id);assert.ok(!rendered.includes('undefined'),id);
   assert.ok(s.choices.some(c=>region.scenes.includes(c.to)),`${id} has no nearby continuation`);
  }
  for(const [id,label] of region.routes){assert.ok(scenes[id]);assert.ok(label);}
 }
 assert.equal(all.size,21);assert.equal(Object.keys(scenes).length,40);
 assert.deepEqual(coverage.map(c=>c.area),regions.map(r=>r.id));
});
test('every selected corpus source is bundled byte-for-byte with its exact hash',()=>{
 for(const [key,source] of Object.entries(sources)){
  if(!source.path)continue;
  const receipt=sourceReceipts[key];assert.ok(receipt,key);assert.equal(receipt.path,source.path);
  const original=fs.readFileSync(path.resolve(root,'../..',source.path)),bundled=fs.readFileSync(path.join(root,'dist/retained',receipt.href));
  assert.deepEqual(bundled,original,key);assert.equal(bundled.length,receipt.bytes);
  assert.equal(crypto.createHash('sha256').update(bundled).digest('hex'),receipt.sha256,key);
 }
 const audit=JSON.parse(fs.readFileSync(path.join(root,'dist/retained/coverage.json')));
 assert.equal(audit.sceneCount,Object.keys(scenes).length);assert.equal(audit.bundledSourceCount,Object.keys(sourceReceipts).length);
});
test('optional readings have explicit scope and do not gate a scientific route',()=>{
 const optional=regions.find(r=>r.id==='meaning');assert.equal(optional.optional,true);
 for(const id of optional.scenes){assert.equal(scenes[id].source==='meanings'||scenes[id].source==='texts',true);assert.ok(sources[scenes[id].source].note.match(/assum|literary|fulfilment/i));}
 const visited=new Set(),visit=id=>{if(optional.scenes.includes(id)||visited.has(id))return;visited.add(id);for(const c of scenes[id].choices)visit(c.to);};
 for(const id of ['observation','care','kenosis'])visit(id);
 for(const region of regions.filter(r=>!r.optional))for(const id of region.scenes)assert.ok(visited.has(id),`optional reading gates ${id}`);
});
test('the finite compatibility example exposes its exact allowed set',()=>{
 assert.equal(allowedPairs(0).length,1);assert.equal(allowedPairs(4).length,15);assert.equal(allowedPairs(8).length,25);
 for(const [a,b] of allowedPairs(3))assert.ok(a+b<=3);
});
test('the pattern counter applies the declared integer action without treating ornament as evidence',()=>{
 assert.deepEqual(inflatePair(0),[1,1]);assert.deepEqual(inflatePair(1),[3,2]);assert.deepEqual(inflatePair(3),[21,13]);assert.deepEqual(inflatePair(5),[144,89]);
});
test('positive-response admission agrees with the smallest eigenvalue on every displayed matrix',()=>{
 for(let c=0;c<=4;c++)for(let x=0;x<=4;x++)for(let y=0;y<=4;y++){
  const eigenvalue=(x+y-Math.sqrt((x-y)**2+4*c*c))/2;
  assert.equal(positivePairs(c).some(([a,b])=>a===x&&b===y),eigenvalue>=-1e-12);
 }
 assert.equal(positivePairs(0).length,25);assert.equal(positivePairs(1).length,16);assert.equal(positivePairs(4).length,1);
});
test('the repetition-code claim holds over both original bits and all eight received words',()=>{
 for(const original of [0,1])for(let word=0;word<8;word++){
  const bits=[word&1,(word>>1)&1,(word>>2)&1],errors=bits.filter(b=>b!==original).length;
  assert.equal(decodeRepetition(bits)===original,errors<=1);
 }
});
test('the numerical memory illustration remains finite and changes when coupling is removed',()=>{
 const coupled=memoryTrace(true),uncoupled=memoryTrace(false);assert.equal(coupled.length,101);assert.equal(uncoupled.length,101);
 assert.equal(coupled[0].x,uncoupled[0].x);assert.equal(coupled[0].h,1.2);
 assert.ok(coupled.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.h)&&p.x>=0&&p.h>=0));
 assert.ok(coupled.at(-1).x>uncoupled.at(-1).x+.01);
});
test('block aggregation preserves total while discarding within-block arrangements',()=>{
 for(const size of [1,2,4]){const cells=coarseCells(size);assert.equal(cells.length,16/(size*size));assert.equal(cells.reduce((sum,c)=>sum+c.total,0),8);}
 assert.ok(coarseCells(2).every(c=>c.mean===.5));
});
test('the ranking desk discloses a reversible arithmetic preference rather than changing the options',()=>{
 assert.deepEqual(weightedOptions(0),{a:2,b:8});assert.deepEqual(weightedOptions(50),{a:5,b:5});assert.deepEqual(weightedOptions(100),{a:8,b:2});
});
test('reported rate cards retain the source decimals and their model-local intermediate optimum',()=>{
 const source=fs.readFileSync(path.join(root,'dist/retained',sourceReceipts.instrument.href),'utf8');
 for(const r of reportedRates){assert.ok(source.includes(r.overlap.toFixed(6)));assert.ok(source.includes(r.loss.toFixed(6)));}
 assert.equal(reportedRates.reduce((best,r)=>r.overlap>best.overlap?r:best).rate,8);
});
