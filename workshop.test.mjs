import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {createSession} from './retained/workshop/engine.js';
import * as native from './retained/workshop/temple-native.js';
import {scenes,sources} from './retained/world.js';
import {regions} from './retained/expansion.js';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const bundle=()=>JSON.parse(read('./retained/workshop/fixture.json'));
test('the historical workshop oracle preserves its exact kernel and native function bodies',()=>{
 const require=createRequire(import.meta.url);
 for(const [name,file]of [['createKernel','bootstrap/temple-seed.cjs'],['valuePorts','bootstrap/ports/value.cjs'],['kernelPorts','bootstrap/ports/kernel.cjs'],['invoke','bootstrap/ports/programme.cjs']]){
  const original=require('./retained/workshop/sources/'+file)[name];assert.equal(native[name].toString(),original.toString(),name);
 }
});
test('workshop is a connected tour stop with real static resources',()=>{
 assert(scenes.sourcery.choices.some(c=>c.to==='workshop'));assert.equal(scenes.workshop.source,'authorship');
 assert(fs.existsSync(new URL('./dist/retained/'+scenes.workshop.experience.href,import.meta.url)));
 assert(fs.existsSync(new URL('./dist/retained/'+sources.authorship.url,import.meta.url)));
 assert.match(sources.authorship.note,/not establish independent verification/);
});
test('all unaffected scenes retain the captured content of the other changes',()=>{
 const receipt=JSON.parse(read('./preservation-receipt.json'));
 assert.equal(Object.keys(scenes).length,receipt.newSceneCount+regions.flatMap(r=>r.scenes).length);
 // The historical receipt remains unchanged. Only explicitly marked additive
 // editorial passages are removed for comparison with that earlier basis.
 for(const scene of receipt.unchangedScenes){const current={...scenes[scene.id],choices:scenes[scene.id].choices.filter(c=>!c.expansion)};assert.equal(crypto.createHash('sha256').update(JSON.stringify(current)).digest('hex'),scene.sha256,scene.id);}
});
test('portable engine preserves source/overlay ownership and unchanged-state refusals',async t=>{
 const b=bundle(),original=JSON.stringify(b.original),s=await createSession(b),first=s.state();
 await t.test('starts from the checked fixture',()=>{assert.equal(first.title,'What happened');assert.equal(first.webLabel,'The story');assert.equal(first.panels.length,3);});
 const title=await s.edit({revision:0,kind:'title',value:'A shared story'});
 await t.test('source edit updates page and row, preserving overlay',()=>{assert.equal(title.title,'A shared story');assert.equal(title.webLabel,'The story');assert.equal(title.sources.encounter,first.sources.encounter);assert(title.panels.find(p=>p.projection.output.type==='MainframeRow').html.includes('A shared story'));});
 const overlay=await s.edit({revision:1,kind:'web-label',value:'Our < story & "hope"'});
 await t.test('overlay edits its literal and escapes generated markup',()=>{assert.equal(overlay.title,title.title);assert.equal(overlay.sources.facts,title.sources.facts);assert.equal(overlay.receipt.destination.kind,'literal');assert(overlay.panels.find(p=>p.projection.output.type==='WebLink').html.includes('Our &lt; story &amp; &quot;hope&quot;'));});
 for(const [kind,value,pattern]of [['title','',/EC-T007/],['title',{},/EC-E010/],['unknown','text',/LAB-E001/]])await t.test('refuse '+pattern,async()=>{await assert.rejects(s.edit({revision:2,kind,value}),pattern);assert.deepEqual(s.state(),overlay);});
 await t.test('stale basis refuses',async()=>{await assert.rejects(s.edit({revision:0,kind:'title',value:'Stale'}),/LAB-STALE/);assert.deepEqual(s.state(),overlay);});
 await t.test('original fixture is unchanged',()=>assert.equal(JSON.stringify(b.original),original));
 await t.test('new session starts independently',async()=>assert.equal((await createSession(bundle())).state().title,'What happened'));
});
test('portable execution agrees with direct native fixture execution for the same edits',async()=>{
 const require=createRequire(import.meta.url),{fixture}=require('./retained/workshop/sources/bootstrap/encounter-code-fixture.cjs');
 const {lower}=require('./retained/workshop/sources/bootstrap/ports/algebra-lower.cjs'),{valuePorts}=require('./retained/workshop/sources/bootstrap/ports/value.cjs');
 const modelFile=name=>JSON.parse(read('./retained/workshop/sources/algebra/'+name+'.process.json'));
 const f=await fixture(),lab=modelFile('lab'),added={entry:'lab.snapshot',queries:{...modelFile('language').queries,...lab.queries}};
 const lowered=await lower({compiler:modelFile('lowering'),definitions:f.inputs.definitions,primitives:f.inputs.primitives,input:added,mode:'model',ports:valuePorts()});
 Object.assign(f.model.queries,lowered.queries);
 await f.call('admit.model',{}, {target:f.model,profile:f.inputs.profile});
 let candidate=await f.prepare();const browser=await createSession(bundle());
 for(const request of [{revision:0,kind:'title',value:'Same source'},{revision:1,kind:'web-label',value:'Same overlay'}]){
  candidate=(await f.call('lab.edit',{...request,candidate})).value.candidate;
  const a=(await f.call('lab.snapshot',{candidate})).value,b=await browser.edit(request);
  assert.equal(b.sources.facts,candidate.inputs.factText);assert.equal(b.sources.encounter,candidate.inputs.codeText);assert.deepEqual(b.panels,a.rendered);
 }
});
