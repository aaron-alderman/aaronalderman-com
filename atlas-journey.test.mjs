import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{browserEffects}=require('./bootstrap/ports/browser-effects.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs');
const key='worldwright.atlas.seen.v1';
const code=fs.readFileSync('dist/atlas-runtime.js','utf8').replace(/startBrowser\(model,factIndex,grants\)\.catch[^\n]+/,'')+'\nglobalThis.capture={model,createKernel};';
const context=vm.createContext({console});vm.runInContext(code,context);const {model,createKernel}=context.capture;
function memory(){const values=new Map();return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
async function session(storage,{current=null,atlas=true,small=false}={}){
 const state=new Map(),text={},hidden={},attributes=[],classes=[],bindings=[];const effects=browserEffects({document:{},window:{},storage},()=>{});
 const links=model.data.ids.flatMap(id=>[0,1].map(index=>({ref:{id,index},attributes:{'data-atlas-id':id}})));
 const ports={...valuePorts(),...effects,'state.get':({key})=>state.get(key),'state.set':({key,value})=>state.set(key,value),'dom.exists':({selector})=>selector==='#atlas-memory'?atlas:current!==null,'dom.attribute':()=>current,'dom.hidden':({selector,value})=>hidden[selector]=value,'dom.text':({selector,text:value})=>text[selector]=value,'dom.on':()=>true,'browser.on':args=>{bindings.push(args);return bindings.length;},'browser.mediaQuery':()=>small,'browser.cancel':()=>true,'browser.select':()=>links,'browser.attribute':args=>attributes.push(args),'browser.class':args=>classes.push(args)};
 const run=async(query,eventInput={})=>createKernel(ports,2_000_000).run(model.queries[query],{model,data:model.data,eventInput});
 await run('atlas.journey.boot');return {run,state,text,hidden,attributes,classes,bindings};
}
test('algebra remembers actual destination visits, deduplicates them and restores the map',async()=>{
 const storage=memory();let s=await session(storage);assert.equal(s.text['#atlas-progress'],'0 of 40 places seen');assert.equal(storage.getItem(key),null);
 await session(storage,{current:'personal',atlas:false});assert.equal(storage.getItem(key),'personal');
 await session(storage,{current:'personal',atlas:false});assert.equal(storage.getItem(key),'personal');
 await session(storage,{current:'calibration',atlas:false});s=await session(storage);assert.equal(s.text['#atlas-progress'],'2 of 40 places seen');assert.equal(s.attributes.filter(x=>x.name==='data-seen'&&x.value==='true').length,4);
 await session(storage,{current:'not-a-place',atlas:false});assert.equal(storage.getItem(key),'personal\ncalibration');
 storage.setItem(key,'care');await s.run('atlas.seen.refresh');assert.equal(s.text['#atlas-progress'],'1 of 40 places seen');assert.equal(s.state.get('seen')[0],'care');
});
test('reset clears only the atlas key and all seen labels',async()=>{
 const storage=memory();storage.setItem('unrelated.preference','keep');storage.setItem(key,'personal\ncare');const s=await session(storage);await s.run('atlas.seen.reset');assert.equal(storage.getItem(key),null);assert.equal(storage.getItem('unrelated.preference'),'keep');assert.equal(s.state.get('seen').length,0);assert.match(s.text['#atlas-progress'],/0 of 40/);assert.equal(s.attributes.slice(-160).filter(x=>x.name==='data-seen'&&x.value==='true').length,0);
});
test('untrusted saved text is bounded and restricted to known places',async()=>{
 const storage=memory();storage.setItem(key,'personal\n<script>\npersonal\ncare\nconstructor\n');const s=await session(storage);assert.deepEqual([...s.state.get('seen')],['personal','care']);storage.setItem(key,'x'.repeat(4097));const fresh=await session(storage);assert.equal(fresh.state.get('seen').length,0);assert.match(fresh.text['#atlas-storage-note'],/unavailable/);
});
test('blocked storage stays nonfatal and reports the limit honestly',async()=>{
 const denied={getItem(){throw Error('SecurityError');},setItem(){throw Error('QuotaExceededError');},removeItem(){throw Error('SecurityError');}};
 const s=await session(denied,{current:'personal',atlas:false});assert.deepEqual([...s.state.get('seen')],['personal']);assert.match(s.text['#atlas-visit-note'],/couldn’t save/);const a=await session(denied);assert.match(a.text['#atlas-storage-note'],/unavailable/);await a.run('atlas.seen.reset');assert.equal(a.state.get('seen').length,0);
});
test('previews are dismissible and every pin has an ordinary link and readable label',async()=>{
 const s=await session(memory());await s.run('atlas.pin.dismiss',{event:{key:'Escape'},matched:{ref:{id:'care'},attributes:{'data-atlas-id':'care'}}});assert.equal(s.classes.at(-1).value,true);await s.run('atlas.pin.reveal',{matched:{ref:{id:'care'},attributes:{'data-atlas-id':'care'}}});assert.equal(s.classes.at(-1).value,false);
 const html=fs.readFileSync('dist/atlas.html','utf8');assert.equal((html.match(/class="atlas-pin"/g)||[]).length,40);assert.equal((html.match(/class="atlas-pin-tip"/g)||[]).length,40);assert.ok(html.includes('Reset seen places'));assert.ok(html.includes('atlas-runtime.js?v=journey-1'));assert.ok(!html.match(/\son[a-z]+=/));
});

test('mobile taps preview a place before exploration, with no false seen mark',async()=>{const storage=memory(),s=await session(storage,{small:true});assert.ok(s.bindings.some(b=>b.event==='click'&&b.preventDefault&&b.delegate==='.atlas-pin'));await s.run('atlas.pin.preview',{matched:{ref:{id:'care'},attributes:{'data-atlas-id':'care'}}});assert.equal(s.text['#atlas-preview-title'],'Care');assert.equal(s.text['#atlas-preview-question'],'Remember to care.');assert.ok(s.attributes.some(a=>a.name==='href'&&a.value==='places/care.html'));assert.equal(storage.getItem(key),null);assert.equal(s.hidden['#atlas-preview-link'],false);});

test('a destination restored from browser history marks itself again after a reset',async()=>{const storage=memory(),s=await session(storage,{current:'personal',atlas:false});storage.removeItem(key);await s.run('atlas.journey.resume');assert.equal(storage.getItem(key),'personal');});

// Homepage identity programmes use the same admitted browser kernel.
{
const require=createRequire(import.meta.url);
const {valuePorts}=require('./bootstrap/ports/value.cjs');
const {computationalPorts}=require('./bootstrap/ports/browser-effects.cjs');
const code=fs.readFileSync('dist/identity-runtime.js','utf8').replace(/startBrowser\(model,factIndex,grants\)\.catch[^\n]+/,'')+'\nglobalThis.capture={model,createKernel};';
const context=vm.createContext({console});vm.runInContext(code,context);
const {model,createKernel}=context.capture;
test('each identity can randomly reach every other identity without an immediate repeat',async()=>{
 assert.deepEqual(Array.from(model.data.themes,t=>t.key),['sourcerer','author','dad','christian']);
 for(const current of model.data.themes){
  const reached=new Set();
  for(const random of [0,.5,.999999999]){
   const state=new Map([['identity',current.key]]),writes={},attributes={};
   const ports={...valuePorts(),...computationalPorts({random:()=>random}),
    'state.get':({key})=>state.get(key),'state.set':({key,value})=>state.set(key,value),
    'browser.attribute':({ref,name,value})=>attributes[ref+':'+name]=value,
    'browser.write':({ref,name,value})=>writes[ref+':'+name]=value};
   await createKernel(ports,model.budget).run(model.queries['identity.change'],{model,data:model.data});
   const next=state.get('identity');assert.notEqual(next,current.key);reached.add(next);
   assert.equal(attributes['body:data-identity'],next);
   assert.equal(attributes['#identity-background:src'],model.data.themes.find(t=>t.key===next).image);
   assert.equal(writes['#identity-word:textContent'],next+'.');
   assert.equal(writes['#identity-copy:textContent'],model.data.themes.find(t=>t.key===next).copy);
   assert.match(writes['#identity-status:textContent'],new RegExp('Current theme: '+next));
  }
  assert.equal(reached.size,3);
 }
});
test('the homepage provides a native keyboard button and an announced theme status',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');
 assert.match(html,/<button[^>]*id="identity-switch"/);
 assert.match(html,/aria-label="Discover another side of Aaron: change the theme"/);
 assert.match(html,/id="identity-status"[^>]*aria-live="polite"/);
 assert.match(html,/src="identity-runtime.js\?v=identity-questions-worlds-3" defer/);
 assert.match(html,/<img[^>]*id="identity-background"/);
});
test('every identity publishes its own distinct image and preloads it through the homepage algebra',()=>{
 const html=fs.readFileSync('dist/index.html','utf8'),images=model.data.themes.map(t=>t.image);
 assert.equal(new Set(images).size,4);
 assert.equal(images[0],'assets/sourcerer-threshold.png');
 const hashes=images.map(image=>{
  const bytes=fs.readFileSync('dist/'+image);
  assert.equal(bytes.subarray(1,4).toString(),'PNG');
  assert.ok(html.includes('src="'+image+'"'));
  return require('node:crypto').createHash('sha256').update(bytes).digest('hex');
 });
 assert.equal(new Set(hashes).size,4);
});

}
