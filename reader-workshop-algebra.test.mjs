import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import crypto from 'node:crypto';
import * as originalModels from './retained/world-models.js';
import {calibrationReading} from './retained/encounter-data.js';
import {createSession} from './retained/workshop/engine.js';
import {sourceReceipts} from './retained/source-receipts.js';
const require=createRequire(import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,import.meta.url)));
const {lower}=require('./bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{computationalPorts}=require('./bootstrap/ports/browser-effects.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const manifest=read('bootstrap/site.json'),queries=Object.assign({},...manifest.modules.map(f=>read(f).queries));
const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{queries,entry:'workshop.boot'},mode:'model',ports:valuePorts(),limit:20000000});
const data=read('source/reader/activities.json');
const portable=value=>JSON.parse(JSON.stringify(value));
const run=async(entry,eventInput,extra={})=>(await invoke({model,entry,input:{data,eventInput,...extra},ports:{...valuePorts(),...computationalPorts()},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000})).value;

test('migrated finite models reproduce every slider setting and bit pattern',async()=>{
 for(let angle=0;angle<=90;angle++)assert.equal(await run('reader.model.calibration',{angle}),calibrationReading(angle));
 for(let value=0;value<=8;value++)assert.deepEqual(await run('reader.model.pairs',{mode:'budget',value}),originalModels.allowedPairs(value));
 for(let value=0;value<=4;value++)assert.deepEqual(await run('reader.model.pairs',{mode:'positive',value}),originalModels.positivePairs(value));
 for(let step=0;step<=5;step++)assert.deepEqual(await run('reader.model.inflate',{step}),originalModels.inflatePair(step));
 for(let value=0;value<8;value++){const bits=[value&1,(value>>1)&1,(value>>2)&1];assert.equal(await run('reader.model.decode',{bits}),originalModels.decodeRepetition(bits));}
 for(let percent=0;percent<=100;percent++){const actual=await run('reader.model.weights',{percent}),expected=originalModels.weightedOptions(percent);for(const field of ['a','b'])assert.equal(actual[field].toFixed(2),expected[field].toFixed(2));}
 for(const block of [1,2,4])assert.deepEqual(await run('reader.model.coarse',{block}),originalModels.coarseCells(block));
});
test('both numerical memory trajectories and all plotted coordinates retain exact predecessor results',async()=>{
 for(const coupled of [true,false]){
  const original=originalModels.memoryTrace(coupled),actual=await run('reader.model.memory',{coupled});assert.deepEqual(actual,original);
  for(const coordinate of ['x','h'])assert.equal(await run('reader.model.line',{samples:actual,coordinate}),original.map((p,i)=>`${i?'L':'M'}${(25+p.t*39).toFixed(2)},${(215-p[coordinate]*135).toFixed(2)}`).join(' '));
 }
});
test('algebra-owned workshop sessions reproduce source edits, overlays, generated HTML and refusal boundaries',async()=>{
 const inputs=read('source/encounter/example.json'),candidate=await run('ec.prepare',inputs),original=await createSession(read('retained/workshop/fixture.json'));
 let snapshot=await run('workshop.snapshot',{candidate,revision:0,receipt:null});
 assert.equal(snapshot.title,original.state().title);assert.equal(snapshot.webLabel,original.state().webLabel);assert.deepEqual(portable(snapshot.panels),portable(original.state().panels));
 for(const request of [{revision:0,kind:'title',value:'A shared <story> & "hope"'},{revision:1,kind:'web-label',value:'Our <local> label & "link"'}]){
  const prior=snapshot;snapshot=await run('workshop.change',{snapshot,request});const expected=await original.edit(request);
  assert.deepEqual(portable(snapshot.panels),portable(expected.panels));assert.deepEqual(snapshot.sources,expected.sources);assert.equal(snapshot.receipt.factDiff,expected.receipt.factDiff);assert.equal(snapshot.receipt.codeDiff,expected.receipt.codeDiff);
  if(request.kind==='web-label')assert.equal(snapshot.sources.facts,prior.sources.facts);else assert.equal(snapshot.sources.encounter,prior.sources.encounter);
 }
 const accepted=JSON.stringify(snapshot);
 for(const [request,code]of [[{revision:0,kind:'title',value:'stale'},/LAB-STALE/],[{revision:2,kind:'title',value:''},/EC-T007/],[{revision:2,kind:'title',value:{}},/EC-E010/],[{revision:2,kind:'unknown',value:'value'},/LAB-E001/]]){await assert.rejects(run('workshop.change',{snapshot,request}),code);assert.equal(JSON.stringify(snapshot),accepted);}
 assert.equal((await run('workshop.snapshot',{candidate:await run('ec.prepare',inputs),revision:0,receipt:null})).title,'What happened');
});
test('forty activity source documents retain controls and contain no executable source',()=>{
 assert.equal(Object.keys(data.activities).length,40);
 for(const activity of Object.values(data.activities)){assert.ok(activity.html);assert.ok(!/<script\b|\son\w+\s*=/i.test(activity.html),activity.id);}
});

test('the published execution graph contains only admitted bundles and generic native mechanisms',()=>{
 const receipt=read('dist/build-receipt.json'),contract=read('source/publication-contract.json');
 const allowed=new Set(['temple/runtime.js','temple/early.js','sourcery/runtime.js','claimipedia/runtime.js','encounter/runtime.js','atlas-runtime.js','inspection/runtime.js',...contract.readerWorkshopSuccessor.runtimes]);
 for(const file of Object.keys(receipt.artifacts)){
  if(!/\.(?:m?js|html)$/.test(file))continue;
  const content=fs.readFileSync(new URL('dist/'+file,import.meta.url),'utf8');
  if(/\.(?:m?js)$/.test(file)){assert.ok(allowed.has(file),file);assert.ok(content.includes('const model=hydrateSnapshot('),file);assert.ok(!/\beval\s*\(|new Function\s*\(/.test(content),file);}
  if(!file.endsWith('.html'))continue;
  const base=content.match(/<base\s+href="([^"]+)"/)?.[1]??'./',documentURL=new URL(file,'https://publication.invalid/'),baseURL=new URL(base,documentURL);
  for(const match of content.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
   if(/type="application\/(?:ld\+)?json"/.test(match[1]))continue;
   const src=match[1].match(/\bsrc="([^"]+)"/)?.[1];assert.ok(src,file+' has no inline application script');
   const url=new URL(src,baseURL);assert.equal(url.origin,documentURL.origin,file+' has no external application script');assert.ok(allowed.has(url.pathname.slice(1)),file+': '+src);
  }
 }
 for(const predecessor of read('source/reader/migration.json').predecessors){assert.ok(!receipt.sources[predecessor.path],predecessor.path+' is not a build dependency');assert.ok(!receipt.artifacts[predecessor.path],predecessor.path+' is not published');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(predecessor.path,import.meta.url))).digest('hex'),predecessor.sha256);}
 assert.deepEqual(read('source/reader/source-receipts.json'),sourceReceipts);
 const profiles=read('bootstrap/ports.json').profiles;
 for(const name of ['readerBrowser','activityBrowser','workshopBrowser'])assert.ok(!profiles[name].some(port=>/^(?:file\.|mail\.|http\.)/.test(port)),name);
 assert.ok(!profiles.workshopBrowser.some(port=>port.startsWith('storage.')),'workshop has no persistent storage grant');
});
