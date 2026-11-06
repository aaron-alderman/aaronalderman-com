// Independent original-source correspondence checks. Verification-only imports
// below are excluded from the application/native runtime closure.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as original from './source/microsites/temple/oracle/assets/lamp.js';
import * as originalKernel from './source/microsites/temple/oracle/assets/kernel.js';
const require=createRequire(import.meta.url);
const {lower}=require('./bootstrap/ports/algebra-lower.cjs');
const {createKernel}=require('./bootstrap/temple-seed.cjs');
const {valuePorts}=require('./bootstrap/ports/value.cjs');
const {computationalPorts}=require('./bootstrap/ports/browser-effects.cjs');
const {invoke}=require('./bootstrap/ports/programme.cjs');
const {readProcessFixture:read}=require('./tooling/read-process-fixture.cjs');
const configuration=read('./source/microsites/temple/config.json');
const queries=Object.assign({},...['html','microsite-values','microsite-lamp','microsite-sourcery','microsite-ui','microsite-temple-ui','microsite-motion','microsite-temple-motion','microsite-media'].map(name=>read('./algebra/'+name+'.process.json').queries));
const model=await lower({compiler:read('./algebra/lowering.process.json'),definitions:read('./algebra/operators.expression.json'),primitives:createKernel.operators,input:{queries,entry:'lamp.createWorld'},mode:'model',ports:valuePorts()});
const run=async(query,input,ports={})=> (await invoke({model,entry:query,input:{eventInput:input},ports:{...valuePorts(),...computationalPorts(),...ports},nested:['kernel.invoke']})).value;
const normalize=value=>value instanceof Map?Object.fromEntries([...value].map(([k,v])=>[k,normalize(v)])):Array.isArray(value)?Array.from(value,normalize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v)])):value;
const recipe=(preset,identity='steward',extra={})=>({preset,identity,stale:false,falseClaim:false,note:'A faithful note.',...extra});

test('SHA-256 fallback agrees with Web Crypto for Unicode and padding boundaries',async()=>{
 const fallback=computationalPorts({crypto:null})['digest.sha256'];
 for(const text of ['', 'abc', 'é𐐀 & < >', ...[55,56,63,64,65,127,128].map(n=>'x'.repeat(n))]){
  assert.equal(await fallback({text,fallback:true}),await computationalPorts()['digest.sha256']({text}));
 }
 await assert.rejects(()=>fallback({text:'secure-only'}),/Web Crypto unavailable/);
});

function gateOracle(){
 const source=fs.readFileSync(new URL('./source/microsites/temple/oracle/assets/gate.js',import.meta.url),'utf8');
 const children=[];
 const context=vm.createContext({Map,Set,document:{getElementById(){return {replaceChildren(){children.length=0;},append(node){children.push(node);}};},createElementNS(ns,tag){return {tag,attrs:{},setAttribute(k,v){this.attrs[k]=String(v);},set textContent(value){this.text=String(value);}};}},matchMedia:()=>({matches:false}),digestOf:originalKernel.digestOf});
 const body=source.replace(/import\s*\{[\s\S]*?\}\s*from\s*'[^']+';/g,'');
 vm.runInContext(body.slice(0,body.indexOf('init().catch'))+'\nglobalThis.drawing={draw:drawTree,reset:function(v){seenDigests=new Set(v);},lesson:lesson,setWorld:function(v){world=v;}};',context);
 return {context,drawing:context.drawing,children};
}
const drawnNode=node=>({tag:node.tag,attrs:Object.fromEntries(Object.entries(node.attrs).filter(([,v])=>v!==null&&v!==undefined&&v!==false).map(([k,v])=>[k,String(v)])),...((node.children?.length||node.text!==undefined)?{text:node.text??node.children.join('')}:{})});
test('Temple Merkle drawing geometry, order, labels and fresh highlights match original SVG effects',async()=>{
 const oracle=gateOracle();let world=await original.createTemple(),actual=await run('lamp.createWorld',{configuration}),seen=[];
 for(const input of [null,recipe('tend'),recipe('note','visitor'),recipe('amend'),recipe('refill')]){
  if(input){await original.propose(world,input);actual=(await run('lamp.propose',{world:actual,recipe:input,configuration})).world;}
  for(const fresh of [false,true]){
   oracle.drawing.reset(seen);oracle.drawing.draw(world.temple.tree,world.temple.root,world.temple.state.predicateId,fresh);
   const tree=await run('ui.temple.tree',{tree:actual.temple.tree,root:actual.temple.root,predicateId:actual.temple.state.predicateId,fresh,seen});
   assert.deepEqual(tree.nodes.map(drawnNode),normalize(oracle.children.map(drawnNode)));
   seen=tree.seen;
  }
 }
});

test('Temple explanatory lessons match every preset, identity and refusal branch in the source',async()=>{
 const oracle=gateOracle();
 for(const amended of [false,true])for(const preset of original.PRESETS)for(const identity of original.IDENTITIES)for(const falseClaim of [false,true]){
  const world=await original.createTemple();if(amended)await original.propose(world,recipe('amend'));
  const before=world.registry.get(world.temple.state.predicateId).title,input=recipe(preset.id,identity.id,{falseClaim}),{result}=await original.propose(world,input);
  oracle.drawing.setWorld(world);
  const actual=await run('ui.temple.lesson',{recipe:input,verdict:normalize(result),beforeTitle:before,activeTitle:world.registry.get(world.temple.state.predicateId).title});
  assert.deepEqual(actual,normalize(oracle.drawing.lesson(input,result,before)));
 }
});

test('Sourcery flood scatter, waves and broom poses match original motion at sampled frames',async()=>{
 const story=fs.readFileSync(new URL('./source/microsites/sourcery/oracle/assets/js/story.js',import.meta.url),'utf8');
 const node=()=>({attrs:{},style:{},children:[],setAttribute(k,v){this.attrs[k]=String(v);},appendChild(v){this.children.push(v);}});
 const front=node(),back=node(),foam=node(),layer=node();
 const context=vm.createContext({document:{createElementNS:node},scene:{querySelectorAll:()=>[],querySelector:()=>({})},broomLayer:layer,reduce:false,waveFront:front,waveBack:back,foam});
 const body=story.slice(story.indexOf('    var NS ='),story.indexOf('    var running ='));
 vm.runInContext(body+';globalThis.flood={brooms:brooms,wave:waveD,render:render,set:function(p,r){progress=p;reduce=r;},getLevel:function(){return level;}};',context);
 const expected=context.flood;
 const brooms=await run('motion.flood.scatter',{});
 assert.deepEqual(brooms,normalize(expected.brooms.map(({el,...b})=>b)));
 for(const time of [0,0.125,2.7,100])for(const baseY of [592,400.13]){
  const args={baseY,amp:7.5,len:260,phase:0,time};
  assert.equal(await run('motion.flood.wave',args),expected.wave(baseY,7.5,260,0,time));
 }
 const state=new Map([['floodBrooms',brooms],['floodLevel',592],['floodShown',0]]),attributes=new Map();
 const elements=brooms.map((_,i)=>({ref:'broom'+i}));
 const ports={'state.get':({key})=>state.get(key),'state.set':({key,value})=>{state.set(key,value);return true;},'browser.attribute':({ref,name,value})=>{attributes.set(ref+'.'+name,String(value));return true;},'browser.select':({selector})=>selector==='#flood-brooms > g'?elements:[],'browser.style':()=>true,'browser.write':()=>true};
 for(const [progress,reduced,time]of [[0,false,0],[0.4,false,0.2],[0.72,true,0],[1,false,23.12],[0.2,false,50]]){
  expected.set(progress,reduced);expected.render(time);state.set('floodProgress',progress);state.set('reduced',reduced);
  await run('motion.flood.render',{time},ports);
  assert.equal(state.get('floodLevel'),expected.getLevel());
  assert.equal(attributes.get('#wave-front.d'),front.attrs.d);assert.equal(attributes.get('#wave-back.d'),back.attrs.d);assert.equal(attributes.get('#wave-foam.d'),foam.attrs.d);
  for(let i=0;i<state.get('floodShown');i++)assert.equal(attributes.get('broom'+i+'.transform'),expected.brooms[i].el.attrs.transform);
 }
});

function canvasCapture(){
 const commands=[];
 const context=new Proxy({createRadialGradient(...args){const record={kind:'gradient',id:'gradient',args,stops:[]};commands.push(record);return {record,addColorStop(offset,color){record.stops.push([offset,color]);}};}},{get(obj,key){return key in obj?obj[key]:(...args)=>commands.push({kind:'call',name:key,args});},set(obj,key,value){commands.push(value?.record?{kind:'set',name:key,gradient:'gradient'}:{kind:'set',name:key,value});obj[key]=value;return true;}});
 return {context,commands};
}
const rng=()=>{let seed=12345;return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};};
test('Temple sky scatter, twinkle, parallax, motes and respawn match original canvas effects',async()=>{
 const film=fs.readFileSync(new URL('./source/microsites/temple/oracle/assets/film.js',import.meta.url),'utf8');
 const capture=canvasCapture(),canvas={getContext:()=>capture.context},random=rng(),originalRandom=rng();
 const math=Object.create(Math);math.random=originalRandom;
 const window={innerWidth:900,innerHeight:700,devicePixelRatio:1.5,scrollY:0};
 const context=vm.createContext({document:{getElementById:()=>canvas},window,Math:math,clamp01:v=>Math.max(0,Math.min(1,v))});
 const body=film.slice(film.indexOf('  const canvas =',film.indexOf('function initSky()')),film.indexOf('  seed();'));
 vm.runInContext('(function(){'+body+';globalThis.sky={seed,draw,state:()=>({stars,motes,w,h}),setMotes:value=>{motes=value;}};})();',context);
 context.sky.seed();const expected=normalize(context.sky.state());
 const state=new Map(),ports={'state.get':({key})=>state.get(key),'state.set':({key,value})=>{state.set(key,value);return true;},'browser.environment':()=>({width:900,height:700,dpr:1.5}),'canvas.draw':()=>true,'random.values':({count})=>Array.from({length:count},random)};
 await run('motion.sky.seed',{},ports);
 assert.deepEqual(state.get('skyStars'),expected.stars);assert.deepEqual(state.get('skyMotes'),expected.motes);
 for(const [time,scroll,still]of [[0,0,true],[32,100,false],[2000,1200,false],[2001,1200,true]]){
  capture.commands.length=0;window.scrollY=scroll;context.sky.draw(time,still);
  const plan=await run('motion.sky.plan',{size:state.get('skySize'),stars:state.get('skyStars'),motes:state.get('skyMotes'),time,scroll,still},ports);state.set('skyMotes',plan.motes);
  assert.deepEqual(plan.commands,normalize(capture.commands));assert.deepEqual(normalize(plan.motes),normalize(context.sky.state().motes));
 }
 // Exercise both replacement boundaries, retaining the same random stream on
 // each side. Ordinary sampled frames above do not reach either boundary.
 const forced=normalize(state.get('skyMotes').slice(0,2));forced[0].age=1;forced[1].y=0;
 context.sky.setMotes(structuredClone(forced));capture.commands.length=0;context.sky.draw(3000,false);
 const replacement=await run('motion.sky.plan',{size:state.get('skySize'),stars:state.get('skyStars'),motes:structuredClone(forced),time:3000,scroll:window.scrollY,still:false},ports);
 assert.deepEqual(normalize(replacement.motes),normalize(context.sky.state().motes));assert.deepEqual(replacement.commands,normalize(capture.commands));
 assert.ok(replacement.motes.every(m=>m.age===0&&m.y===706));
});

test('Temple constellation geometry, glow, sparks and rings match original canvas effects',async()=>{
 const film=fs.readFileSync(new URL('./source/microsites/temple/oracle/assets/film.js',import.meta.url),'utf8'),capture=canvasCapture();
 const originalRandom=rng(),random=rng(),math=Object.create(Math);math.random=originalRandom;
 const context=vm.createContext({document:{getElementById:()=>({getContext:()=>capture.context})},Math:math});
 const start=film.indexOf('  const canvas =',film.indexOf('function initConstellation()')),end=film.indexOf('  function frame(t)',start);
 vm.runInContext('(function(){'+film.slice(start,end)+';w=900;h=440;globalThis.constellation={draw,state:()=>({sparks,rings,nextSpark})};})();',context);
 let state={size:{width:900,height:440},sparks:[],rings:[],nextSpark:0};
 for(const [time,still]of [[0,true],[100,false],[500,false],[2000,false],[2800,false],[4000,false],[5000,false],[0,true]]){
  capture.commands.length=0;context.constellation.draw(time,still);
  const plan=await run('motion.constellation.plan',{...state,time,still},{'random.values':({count})=>Array.from({length:count},random)});
  const commands=plan.commands.map(c=>c.kind==='gradient'?{...c,id:'gradient'}:c.gradient?{...c,gradient:'gradient'}:c);
  assert.deepEqual(commands,normalize(capture.commands));
  const expected=normalize(context.constellation.state());assert.deepEqual(plan.sparks,expected.sparks);assert.deepEqual(plan.rings,expected.rings);assert.equal(plan.nextSpark,expected.nextSpark);
  state={...state,sparks:plan.sparks,rings:plan.rings,nextSpark:plan.nextSpark};
 }
});

test('reduced motion and hidden documents draw still frames without scheduling animation',async()=>{
 for(const env of [{reduced:true,hidden:false},{reduced:false,hidden:true}]){
  const state=new Map([['skyFrame',10],['skySize',{width:800,height:600}],['skyStars',[]],['skyMotes',[]],['constellationFrame',11],['constellationVisible',true],['constellationSize',{width:800,height:400}],['constellationSparks',[]],['constellationRings',[]],['constellationNext',0]]),draws=[];
  const ports={'state.get':({key})=>state.get(key),'state.set':({key,value})=>state.set(key,value),'browser.cancel':()=>true,'browser.environment':()=>({...env,scrollY:0}),'browser.frame':()=>assert.fail('A quiet document must not schedule an animated frame'),'canvas.draw':args=>draws.push(args)};
  await run('motion.sky.start',{},ports);await run('motion.constellation.start',{},ports);
  assert.equal(draws.length,2);assert.equal(draws[0].ref,'#sky');assert.equal(draws[1].ref,'#constellation');
 }
});

test('film seeking preserves range endpoints and the metadata/blob fallback sequence',async()=>{
 const source=fs.readFileSync(new URL('./source/microsites/temple/oracle/assets/films.js',import.meta.url),'utf8');
 const context=vm.createContext({});vm.runInContext(source.slice(source.indexOf('const seekable ='),source.indexOf('async function openAsBlob'))+'globalThis.check=seekable;',context);
 for(const ranges of [[],[[0,5]],[[0,1],[3,8]]])for(const time of [0,1,2,3,5,8,9]){
  const video={seekable:{length:ranges.length,start:i=>ranges[i][0],end:i=>ranges[i][1]}};
  assert.equal(await run('media.seek.contains',{ranges,time}),context.check(video,time));
 }
 const state=new Map(),effects=[],video={readyState:0,muted:true,volume:0,currentSrc:'https://example.test/film.mp4',seekable:[]};
 const ports={'state.get':({key})=>state.get(key),'state.set':({key,value})=>state.set(key,value),'media.read':()=>video,'media.write':args=>{effects.push(args);video[args.name]=args.value;},'media.load':()=>effects.push('load'),'media.play':()=>effects.push('play'),'browser.focus':()=>true,'asset.blobURL':()=> 'blob:retained-film'};
 const ref={handle:1};await run('media.seek.click',{video:ref,matched:{attributes:{'data-seek':'18.8'}}},ports);assert.equal(state.get('seek.1').phase,'metadata');assert.ok(effects.includes('load'));assert.ok(!effects.includes('play'));
 video.readyState=1;await run('media.seek.loaded',{video:ref},ports);assert.equal(state.get('seek.1').phase,'blob');assert.equal(video.src,'blob:retained-film');assert.equal(video.muted,true);
 video.currentSrc=video.src;await run('media.seek.loaded',{video:ref},ports);assert.equal(video.currentTime,18.8);assert.ok(effects.includes('play'));assert.equal(state.get('seek.1'),null);
});

test('Temple genesis identities, canonical bytes, state roots and Merkle levels match the original',async()=>{
 const expected=await original.createTemple(),actual=await run('lamp.createWorld',{configuration});
 assert.deepEqual(normalize(actual),normalize(expected));
 for(const value of [null,true,false,'quotes " & < >',{'z':'last','a':['é','𐐀',null,false]}]){
  assert.equal(await run('canonical.encode',{value,numbers:false}),originalKernel.canonical(value));
 }
 for(const covenant of configuration.covenants){
  assert.deepEqual(await run('lamp.measure',{node:covenant.ast}),originalKernel.measure(covenant.ast));
  assert.equal(await run('lamp.render',{node:covenant.ast,indent:''}),originalKernel.render(covenant.ast));
 }
});

test('every preset, identity and false-root choice reproduces the original proposal, verdict and witness',async()=>{
 for(const preset of original.PRESETS)for(const identity of original.IDENTITIES)for(const falseClaim of [false,true]){
  const expected=await original.createTemple(),actual=await run('lamp.createWorld',{configuration});
  const input=recipe(preset.id,identity.id,{falseClaim});
  const e=await original.propose(expected,input),a=await run('lamp.propose',{world:actual,recipe:input,configuration});
  assert.deepEqual(normalize(a.proposal),normalize(e.proposal),preset.id+'/'+identity.id+' proposal');
  assert.deepEqual(normalize(a.result),normalize(e.result),preset.id+'/'+identity.id+' verdict');
  assert.deepEqual(normalize(a.world),normalize(expected),preset.id+'/'+identity.id+' world');
 }
});

test('amendment, refusals, stale basis, replay and both forgeries preserve the exact history boundary',async()=>{
 const expected=await original.createTemple();let actual=await run('lamp.createWorld',{configuration});
 const inputs=[recipe('tend'),recipe('note','emissary'),recipe('tend','visitor'),recipe('amend'),recipe('tend','visitor'),recipe('refill','steward',{stale:true}),recipe('amend-beyond'),recipe('note','visitor',{note:'\u0000\u007f  another note  '})];
 for(const input of inputs){const e=await original.propose(expected,input),a=await run('lamp.propose',{world:actual,recipe:input,configuration});actual=a.world;assert.deepEqual(normalize(a.result),normalize(e.result),JSON.stringify(input));}
 assert.deepEqual(normalize(actual),normalize(expected));
 assert.deepEqual(await run('lamp.replay',{world:actual,journal:actual.journal,publishedHead:actual.temple.root,configuration}),await original.replay(expected,expected.journal,expected.temple.root));
 for(const mode of ['edit','rewrite']){
  const e=await original.forge(expected,mode),a=await run('lamp.forge',{world:actual,mode,configuration});
  assert.deepEqual(normalize(a),normalize(e),mode+' forged history');
  assert.deepEqual(await run('lamp.replay',{world:actual,journal:a.journal,publishedHead:actual.temple.root,configuration}),await original.replay(expected,e.journal,expected.temple.root),mode+' verification');
 }
});

// Expose the original private model functions while leaving their policy and
// templates unchanged. Only DOM rendering after the model result is intercepted.
function sourceryOracle(){
 const spell=fs.readFileSync(new URL('./source/microsites/sourcery/oracle/assets/js/spell.js',import.meta.url),'utf8');
 const witness=fs.readFileSync(new URL('./source/microsites/sourcery/oracle/assets/js/witness.js',import.meta.url),'utf8');
 const nodes=new Map();
 const fixedTime='2026-11-06T01:02:03.456Z';
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:[fixedTime]));}}
 const context=vm.createContext({window:{crypto:globalThis.crypto,isSecureContext:true},TextEncoder,Date:FixedDate,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);}}});
 vm.runInContext(witness,context);
 const rendering=spell.indexOf('/* ---------- Rendering ---------- */');
 const summonStart=spell.indexOf('  function summon(text)');
 const summonEnd=spell.indexOf("    stage.innerHTML = '';",summonStart);
 const head=spell.slice(spell.indexOf('  function head()'),spell.indexOf('  var BROOM_SVG'));
 const declarations=spell.slice(0,rendering)+head+spell.slice(summonStart,summonEnd)+'return {draft:p,proposal:proposal,broomNo:broomNo,hash:W.sha256HexSync(W.canonical(proposal))};}\n';
 const decisionStart=spell.indexOf('  function decide(verdict, note)');
 const decision=spell.slice(decisionStart,spell.indexOf('        renderLedger();',decisionStart)).replace('    ready.then(', '    return ready.then(')+'return {record:record,witness:witness,ledger:ledger};});});}\n';
 const verifyStart=spell.indexOf('  function verify()');
 const verify=spell.slice(verifyStart,spell.indexOf('  function tamper()',verifyStart)).replace('    Promise.all(checks).then(', '    return Promise.all(checks).then(');
 const tamper=spell.slice(spell.indexOf('  function tamper()'),spell.indexOf('  /* ---------- Wiring ---------- */'));
 vm.runInContext(declarations+'var lastMarks=null;function renderLedger(marks){lastMarks=marks;}\n'+decision+verify+tamper+'globalThis.oracle={draft:draft,summon:summon,decide:decide,verify:verify,tamper:tamper,setCurrent:function(value){current=value;},setPrevious:function(value){ledger=value===\"genesis\"?[]:[{witness:value}];},state:function(){return {ledger:ledger,originalRecord:tampered,marks:lastMarks,message:result.textContent};},witness:W};})();',context);
 return context.oracle;
}

test('Sourcery intent classification and all proposal templates match the original source',async()=>{
 const oracle=sourceryOracle(),configuration=read('./source/microsites/sourcery/config.json');
 const subjects=['the dogs','our tools','my garden','your bookings','each pump','the','our cats and kittens'];
 const intents=[
  'Something new, please.','Track when the dogs last went out. No emails or messages.',
  'Who borrowed our tools?','Orders over $ 1,250.50 need approval.',
  'How many supplies are in stock?','Schedule the bookings without calls.',
  'Keep a list of the tasks.','Review the claim and its evidence.',
  'Never share; do not reorder; without tracking.',
  ...subjects.flatMap(s=>['Track when '+s+' were fed','Who has '+s+'?','Count '+s,'Book '+s,'A list for '+s,'Check the claim about '+s]),
 ];
 for(const text of intents){
  const expected=normalize(oracle.draft(text));
  assert.deepEqual(normalize(await run('sourcery.draft',{text,configuration})),expected,text);
  for(const previous of ['genesis','0123456789abcdef'.repeat(4)]){
   oracle.setPrevious(previous);
   assert.deepEqual(normalize(await run('sourcery.proposal',{text,previous,configuration})),normalize(oracle.summon(text)),text+' proposal');
  }
 }
});

test('Sourcery sealing, returns, witness verification, tampering and restoration match the original',async()=>{
 const oracle=sourceryOracle(),configuration=read('./source/microsites/sourcery/config.json');let ledger=[];
 const at='2026-11-06T01:02:03.456Z';
 for(const [index,text]of ['Track when our dogs were fed.','Who borrowed the tools?','Orders over $50 need approval.','Review the claim and evidence.'].entries()){
  const previous=ledger.length?ledger.at(-1).witness:'genesis',verdict=index%2?'returned':'sealed',note=index%2?'Ask me first.':'';
  const current=await run('sourcery.proposal',{text,previous,configuration});
  oracle.setCurrent(oracle.summon(text));
  const expected=await oracle.decide(verdict,note),actual=await run('sourcery.decide',{ledger,current,verdict,note,at});
  assert.deepEqual(normalize(actual),normalize(expected));ledger=actual.ledger;
  await oracle.verify();const verified=await run('sourcery.verify',{ledger});
  assert.deepEqual(normalize(verified.marks),normalize(oracle.state().marks));assert.equal(verified.message,oracle.state().message);
 }
 let originalRecord=null;
 for(let i=0;i<2;i++){
  oracle.tamper();const actual=await run('sourcery.tamper',{ledger,originalRecord});ledger=actual.ledger;originalRecord=actual.originalRecord;
  assert.deepEqual(normalize(ledger),normalize(oracle.state().ledger));assert.deepEqual(normalize(originalRecord),normalize(oracle.state().originalRecord));assert.equal(actual.message,oracle.state().message);
  await oracle.verify();const actualVerification=await run('sourcery.verify',{ledger});assert.deepEqual(normalize(actualVerification.marks),normalize(oracle.state().marks));assert.equal(actualVerification.message,oracle.state().message);
 }
});
