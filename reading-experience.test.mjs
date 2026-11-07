import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'parse5';
import {createRequire} from 'node:module';
import {createExperienceAssessor,read,sha,artifactBindings,observerSha256,prosePages,assertExperienceReplay} from './tooling/assess-reading-experience.mjs';
const assessor=await createExperienceAssessor(),policy=read('source/assurance/reading-experience.json');
const require=createRequire(import.meta.url),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{lower}=require('./bootstrap/ports/algebra-lower.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const rgb=(r,g,b,a=1)=>[r,g,b,a],layer=(rgba,image='none',opacity=1)=>({rgba,image,opacity,filter:'none',blend:'normal'});
const text=(foreground=rgb(0,0,0),layers=[layer(rgb(255,255,255))],fontSize=16)=>({path:'h1',tag:'H1',state:'initial',text:'Fixture text',fontSize,fontWeight:400,paint:{foreground,layers}});
test('rendered contrast evaluates observed paint and refuses unsupported paint certainty',async()=>{
 const run=t=>assessor.run('experience.contrast',t);
 const high=await run(text());assert.equal(high.status,'passed');assert.equal(high.ratio,21);
 const low=await run(text(rgb(119,119,119)));assert.equal(low.status,'failed');assert.ok(low.ratio<4.5);assert.equal(low.minimum,4.5);
 assert.equal((await run(text(rgb(119,119,119),undefined,24))).status,'passed');
 for(const t of [text(rgb(0,0,0,.5)),text(rgb(0,0,0),[layer(rgb(255,255,255),'linear-gradient(white,black)')]),text(rgb(0,0,0),[layer(rgb(255,255,255), 'none',.7)]),text(rgb(0,0,0),[layer(rgb(255,255,255,.5))]),text(rgb(0,0,0),[layer(null)]),text(rgb(0,0,0),[layer(rgb(255,255,255)),layer(rgb(0,0,0),'none',.5)])])assert.equal((await run(t)).status,'needs-review');
 const behind=await run(text(rgb(0,0,0),[layer(rgb(255,255,255)),layer(rgb(0,0,0),'url(art.png)')]));assert.equal(behind.status,'passed','An opaque foreground surface isolates imagery behind it');
});
test('zoom rules detect horizontal loss and concealed title overflow without condemning all scrolling',async()=>{
 const base={document:{clientWidth:320,scrollWidth:320},texts:[text()],blocks:[],truncatedTexts:false,truncatedBlocks:false};
 let r=await assessor.run('experience.snapshot',base);assert.ok(!r.some(f=>f.status==='failed'));
 r=await assessor.run('experience.snapshot',{...base,document:{clientWidth:320,scrollWidth:340}});assert.ok(r.some(f=>f.rule==='zoom.document-overflow'&&f.status==='failed'));
 const clipped={path:'h1',text:'A clipped title',clientWidth:300,scrollWidth:300,clientHeight:40,scrollHeight:90,overflowX:'visible',overflowY:'hidden'};
 r=await assessor.run('experience.snapshot',{...base,blocks:[clipped]});assert.ok(r.some(f=>f.rule==='zoom.clipped-content'));
 r=await assessor.run('experience.snapshot',{...base,blocks:[{...clipped,overflowY:'auto'}]});assert.ok(!r.some(f=>f.rule==='zoom.clipped-content'));
 r=await assessor.run('experience.snapshot',{...base,truncatedBlocks:true});assert.ok(r.some(f=>f.rule==='coverage.observer-limit'&&f.status==='needs-review'));
});
test('text-spacing coverage checks computed values as well as the requested override',async()=>{
 const block={path:'p',tag:'P',text:'A readable paragraph.',fontSize:16,lineHeight:24,letterSpacing:1.92,wordSpacing:2.56,paragraphGap:32,clientWidth:300,scrollWidth:300,clientHeight:100,scrollHeight:100,overflowX:'visible',overflowY:'visible'};
 const snapshot={spacingApplied:true,document:{clientWidth:320,scrollWidth:320},texts:[text()],blocks:[block],truncatedTexts:false,truncatedBlocks:false};
 let r=await assessor.run('experience.snapshot',snapshot);assert.ok(r.some(f=>f.rule==='zoom.spacing-override'&&f.status==='passed'));
 for(const changed of [{letterSpacing:0},{wordSpacing:0},{lineHeight:null},{paragraphGap:0}]){r=await assessor.run('experience.snapshot',{...snapshot,blocks:[{...block,...changed}]});assert.ok(r.some(f=>f.rule==='zoom.spacing-override'&&f.status==='needs-review'));}
});
function journey(){return {route:'fixture.html',origin:'http://fixture',skip:'#main',returnSelector:'a.home',foundSkip:true,skipTargetExists:true,afterSkip:{hash:'#main',path:'/fixture.html'},foundReturn:true,afterReturn:{origin:'http://fixture',path:'/'},events:[{key:'Tab',trusted:true},{key:'Enter',trusted:true}],focuses:[{...text(),path:'a.home',text:'Home',points:[{ownsHit:true}],outlineWidth:2,outlineStyle:'solid',boxShadow:'none',beforePaint:{color:'black'},afterPaint:{color:'black'},focusVisible:true}]};}
test('keyboard journeys require trusted input, visible focus and the declared destination',async()=>{
 const run=s=>assessor.run('experience.keyboard',{journey:s,plan:{homePaths:['/']},route:{next:null}});
 assert.ok((await run(journey())).every(f=>f.status==='passed'));
 for(const change of [s=>s.events.forEach(e=>e.trusted=false),s=>s.events=s.events.filter(e=>e.key==='Tab'),s=>s.afterSkip.hash='#elsewhere',s=>s.afterReturn.path='/wrong']){const s=journey();change(s);assert.ok((await run(s)).some(f=>f.status==='failed'));}
 const hidden=journey();hidden.focuses[0].points=[{ownsHit:false}];assert.ok((await run(hidden)).some(f=>f.rule==='keyboard.focus-obscured'&&f.status==='failed'));
 const uncertain=journey();uncertain.focuses[0].outlineWidth=0;uncertain.focuses[0].outlineStyle='none';assert.ok((await run(uncertain)).some(f=>f.rule==='keyboard.focus-indicator'&&f.status==='needs-review'));
});
test('the first browser run’s native-control counterexamples retain honest review boundaries',async()=>{
 const fixture=read('tooling/assurance/fixtures/first-browser-edge-cases.json');assert.equal(fixture.evidenceFamily,'github-actions:42391940007:1');
 const video=await assessor.run('experience.contrast',{...fixture.video,state:'keyboard-focus'});assert.equal(video.status,'needs-review');assert.equal(video.ratio,null);assert.match(video.evidence,/native control/);
 const j=journey();j.focuses=[fixture.hiddenInput];const r=await assessor.run('experience.keyboard',{journey:j,plan:{homePaths:['/']},route:{next:null}});assert.ok(r.some(f=>f.rule==='keyboard.focus-obscured'&&f.status==='needs-review'));assert.ok(!r.some(f=>f.status==='failed'));
});
test('absent browser evidence never becomes a browser pass; changed bindings refuse replay',async()=>{
 const input={policy,planSha256:'plan',observerSha256:'observer',bindings:{'fixture.html':'hash'},capture:null};
 const pending=await assessor.run('experience.report',input);assert.equal(pending.status,'needs-browser-evidence');assert.equal(pending.counts.passed,0);assert.equal(pending.counts.missing,policy.plan.routes.length*(policy.plan.profiles.length+1));
 for(const key of ['planSha256','observerSha256','bindings']){const capture={protocol:'worldwright/reading-experience-observations/1',planSha256:'plan',observerSha256:'observer',bindings:{'fixture.html':'hash'},snapshots:[],journeys:[]};capture[key]=key==='bindings'?{}:'stale';await assert.rejects(assessor.run('experience.report',{...input,capture}),/stale/);}
});
test('the repaired Temple and Claimipedia spacing cases are explicit release gates',async()=>{
 assert.deepEqual(policy.requiredPasses.filter(r=>r.rule==='zoom.document-overflow').map(r=>[r.route,r.profile,r.rule]),[['temple/index.html','text-spacing','zoom.document-overflow'],['claimipedia/index.html','text-spacing','zoom.document-overflow']]);
 const report={status:'browser-observed',counts:{routes:20,missing:0,failed:0},regressionChecks:policy.requiredPasses.map(r=>({...r,status:'passed'}))};
 assert.equal((await assessor.run('experience.gate',report)).ok,true);
 for(const status of ['failed','needs-browser-evidence','needs-review']){const changed=structuredClone(report);changed.regressionChecks[0].status=status;assert.equal((await assessor.run('experience.gate',changed)).ok,false,status);}
});

function cardImage(changes={}){return {path:'card img',src:'fixture.png',purpose:'illustration',focus:'center',complete:true,naturalWidth:1000,naturalHeight:1500,rect:{left:20,top:20,right:112,bottom:150,width:92,height:130},frame:{left:0,top:0,right:400,bottom:300},hasFrame:true,contentWidth:90,contentHeight:128,fit:'cover',position:'50% 50%',borderWidth:1,...changes};}
test('image assurance distinguishes a valid crop, a failed load, distortion and frame overflow',async()=>{
 const run=image=>assessor.run('experience.image',{image,policy:policy.plan.images});
 assert.ok((await run(cardImage())).every(r=>r.status==='passed'));
 for(const [changes,rule]of [[{naturalWidth:0,naturalHeight:0},'images.loaded'],[{fit:'fill',contentWidth:200,contentHeight:100},'images.distortion'],[{rect:{left:-5,top:20,right:112,bottom:150}},'images.bounds'],[{fit:'contain'},'images.purpose-framing'],[{borderWidth:0},'images.purpose-framing'],[{position:'85% 50%'},'images.purpose-framing']])assert.equal((await run(cardImage(changes))).find(r=>r.rule===rule).status,'failed',rule);
 assert.equal((await run(cardImage({complete:false,naturalWidth:0,naturalHeight:0}))).find(r=>r.rule==='images.loaded').status,'needs-review');
 assert.equal((await run(cardImage({purpose:'unclassified'}))).find(r=>r.rule==='images.purpose-framing').status,'needs-review');
 assert.ok((await run(cardImage({fit:'fill',contentWidth:100,contentHeight:150}))).some(r=>r.rule==='images.distortion'&&r.status==='passed'),'Proportionate fill is not distortion');
});
test('image purposes survive reordering and missing observations cannot satisfy the release gate',async()=>{
 const illustration=cardImage(),emblem=cardImage({path:'emblem img',purpose:'emblem',fit:'contain',borderWidth:0});
 const run=(images,changes={})=>assessor.run('experience.images',{snapshot:{images,truncatedImages:false,...changes},policy:policy.plan.images,expected:2});
 for(const images of [[illustration,emblem],[emblem,illustration]])assert.ok((await run(images)).every(r=>r.status==='passed'));
 for(const images of [[],[illustration],[illustration,cardImage({fit:'contain'})]])assert.equal((await run(images)).at(-1).status,'failed');
 assert.equal((await run([illustration,emblem],{truncatedImages:true})).at(-1).status,'failed');
 const wrongSize=structuredClone(emblem);wrongSize.rect.width=96;wrongSize.rect.right=116;assert.equal((await run([illustration,wrongSize])).find(r=>r.rule==='images.consistent-size'&&r.path==='emblem img').status,'failed');
 const combined=await assessor.run('experience.snapshot',{snapshot:{images:[illustration,emblem],truncatedImages:false,document:{clientWidth:320,scrollWidth:320},texts:[text()],blocks:[],truncatedTexts:false,truncatedBlocks:false},imagePolicy:policy.plan.images,requiredImageCount:2});assert.ok(combined.some(r=>r.rule==='contrast.rendered-pair'));assert.ok(combined.some(r=>r.rule==='images.required-frames'&&r.status==='passed'));assert.equal(combined.filter(r=>r.rule==='images.loaded').length,2);
 const required=policy.requiredPasses.filter(r=>r.rule==='images.required-frames');assert.equal(required.length,20);assert.equal(new Set(required.map(r=>r.route)).size,5);
 const report={status:'browser-observed',counts:{routes:21,missing:0,failed:0},regressionChecks:policy.requiredPasses.map(r=>({...r,status:'passed'}))};report.regressionChecks.at(-1).status='needs-review';assert.equal((await assessor.run('experience.gate',report)).ok,false);
});
test('all five published Questions variants declare image purposes without positional styling',()=>{
 for(const route of policy.plan.routes.filter(r=>r.requiredImageCount)){
  const cards=[];function visit(n){const attrs=Object.fromEntries((n.attrs??[]).map(a=>[a.name,a.value]));if(n.tagName==='a'&&attrs.class==='q-question'){assert.equal(attrs['data-image-frame'],'question-card');const img=n.childNodes.find(c=>c.tagName==='img');cards.push(Object.fromEntries(img.attrs.map(a=>[a.name,a.value])));}for(const c of n.childNodes??[])visit(c);}
  visit(parse(fs.readFileSync('dist/'+route.path,'utf8')));assert.equal(cards.length,route.requiredImageCount);
  for(const card of cards){assert.equal(card['data-image-purpose'],card.src.includes('/world-emblems/')?'emblem':'illustration');assert.equal(card['data-image-focus'],card.src.endsWith('open-workshop-daylight-v2.png')?'right':'center');}
 }
 const css=fs.readFileSync('dist/expedition.css','utf8');assert.ok(!css.includes('.q-question:nth-child'));assert.ok(!css.includes('.q-question:last-child>img'));assert.ok(css.includes('[data-image-purpose="emblem"]'));
});
test('the bound browser report carries image verdicts through to the release gate',async()=>{
 const configuration=structuredClone(policy);configuration.plan.routes=[{path:'fixture.html',skip:'#main',next:null,requiredImageCount:2}];configuration.plan.profiles=configuration.plan.profiles.slice(0,1);configuration.requiredPasses=[{route:'fixture.html',profile:'desktop',rule:'images.required-frames'}];
 const viewport=configuration.plan.profiles[0],snapshot={route:'fixture.html',url:'http://fixture/fixture.html',profile:viewport.id,viewport:{width:viewport.width,height:viewport.height},readyState:'complete',fontStatus:'loaded',spacingApplied:false,document:{clientWidth:1280,scrollWidth:1280},blocks:[],texts:[text()],truncatedTexts:false,truncatedBlocks:false,images:[cardImage(),cardImage({path:'second img',purpose:'emblem',fit:'contain',borderWidth:0})],truncatedImages:false};
 const capture={protocol:'worldwright/reading-experience-observations/1',origin:'http://fixture',planSha256:'plan',observerSha256:'observer',bindings:{},snapshots:[snapshot],journeys:[journey()]};
 const run=()=>assessor.run('experience.report',{policy:configuration,planSha256:'plan',observerSha256:'observer',bindings:{},capture});
 let report=await run();assert.equal(report.counts.failed,0);assert.equal(report.assessments.filter(r=>r.rule==='images.loaded').length,2);assert.equal((await assessor.run('experience.gate',report)).ok,true);
 snapshot.images[1].fit='cover';report=await run();assert.equal(report.regressionChecks[0].status,'failed');assert.equal((await assessor.run('experience.gate',report)).ok,false);
});
test('a complete fixture report keeps every route and preserves normalized assessment identities',async()=>{
 const configuration=structuredClone(policy);configuration.plan.routes=[{path:'fixture.html',skip:'#main',next:null},{path:'second.html',skip:'#main',next:null}];configuration.plan.profiles=configuration.plan.profiles.slice(0,1);
 const viewport=configuration.plan.profiles[0],snapshots=configuration.plan.routes.map(r=>({route:r.path,url:'http://fixture/'+r.path,profile:viewport.id,viewport:{width:viewport.width,height:viewport.height},readyState:'complete',fontStatus:'loaded',spacingApplied:false,document:{clientWidth:1280,scrollWidth:1280},blocks:[],texts:[text()],truncatedTexts:false,truncatedBlocks:false}));
 const journeys=configuration.plan.routes.map(r=>({...journey(),route:r.path}));
 const capture={protocol:'worldwright/reading-experience-observations/1',origin:'http://fixture',planSha256:'plan',observerSha256:'observer',bindings:{},snapshots,journeys};
 const r=await assessor.run('experience.report',{policy:configuration,planSha256:'plan',observerSha256:'observer',bindings:{},capture});
 assert.equal(r.counts.missing,0);assert.equal(r.counts.failed,0);assert.deepEqual([...new Set(r.assessments.map(a=>a.route))],['fixture.html','second.html']);assert.equal(r.assessments.length,14);assert.ok(r.assessments.every(a=>a.profile));assert.ok(r.assessments.some(a=>a.profile==='keyboard'&&a.ratio===21));
 snapshots[0].url='http://fixture/wrong.html';await assert.rejects(assessor.run('experience.report',{policy:configuration,planSha256:'plan',observerSha256:'observer',bindings:{},capture}),/URL differs/);
});
test('plain-language prompts and dated reader evidence remain distinct',async()=>{
 const configuration=structuredClone(policy),page={route:'fixture.html',sourceSha256:'current',text:'Kenotic love needs an explanation.',sentences:['Kenotic love needs an explanation.'],links:['Click here']};
 const input={policy:configuration,pages:[page]};let r=await assessor.run('language.report',input);assert.equal(r.counts.candidates,2);assert.equal(r.counts.reviewed,0);
 const receipt={route:page.route,sourceSha256:'current',scope:'plain-language/1',verdict:'supported',reviewer:'Fixture reviewer',observedAt:'2026-11-07',method:'Reader paraphrase fixture',readerParaphrase:'The work concerns self-emptying love.'};
 configuration.language.reviews=[receipt];r=await assessor.run('language.report',input);assert.equal(r.counts.reviewed,1);assert.equal(r.counts.candidates,2,'A page-level review does not silently erase individual prompts');
 receipt.sourceSha256='old';assert.equal((await assessor.run('language.report',input)).counts.reviewed,0);
 input.pages=[{...page,text:'A short introduction.',sentences:['A short introduction.'],links:[]}];configuration.language.reviews=[];r=await assessor.run('language.report',input);assert.equal(r.counts.candidates,0);assert.equal(r.counts.reviewed,0);assert.equal(r.counts.review,1,'Zero automatic prompts never establishes human understanding');
});
test('report transport tolerance preserves exact verdicts and thresholds',()=>{
 const report={assessments:[{ratio:5,minimum:4.5,status:'passed'}],findings:[]},ulp=structuredClone(report);ulp.assessments[0].ratio+=1e-14;assert.doesNotThrow(()=>assertExperienceReplay(ulp,report));
 for(const edit of [r=>r.assessments[0].status='failed',r=>r.assessments[0].minimum=3,r=>r.assessments[0].ratio+=1e-8]){const changed=structuredClone(report);edit(changed);assert.throws(()=>assertExperienceReplay(changed,report));}
});
test('the admitted report presenter renders both tracks and escapes supplied prose',async()=>{
 const entry='assurance.experience.boot',queries={...read('algebra/html.process.json').queries,[entry]:read('algebra/publication.process.json').queries[entry]},model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry,queries},mode:'model',ports:valuePorts(),limit:20000000});
 for(const protocol of ['worldwright/plain-language-report/1','worldwright/reading-experience-report/1']){
  let rendered='';const report={protocol,status:'needs-review',scope:'Fixture scope',boundary:'Fixture limits',counts:{routes:1,passed:0,failed:0,review:1,missing:1,candidates:1,reviewed:0},findings:[{route:'fixture.html',profile:'opening',rule:'fixture.review',status:'needs-review',evidence:'Review this passage.',text:'<script>unsafe()</script>'}]};
  await invoke({model,entry,input:{},ports:{...valuePorts(),'browser.read':()=>({attributes:{href:'../fixture.json'}}),'asset.text':({url})=>{assert.equal(url,'../fixture.json');return JSON.stringify(report);},'browser.content':({ref,html})=>{assert.equal(ref,'#experience-results');rendered=html;return true;}},limit:20000000});
  assert.ok(rendered.includes('Current evidence'));assert.ok(rendered.includes('&lt;script&gt;'));assert.ok(!rendered.includes('<script>'));assert.ok(rendered.includes('fixture.html'));
 }
});
test('published tracks bind current inputs, replay admitted policy and expose their evidence limits',async()=>{
 const e=read('tooling/assurance/reading-experience-evidence.json');assert.equal(e.policySha256,assessor.policySha256);assert.deepEqual(e.policy,assessor.source);assert.deepEqual(e.configuration,policy);assert.equal(e.planSha256,sha(JSON.stringify(e.plan)));assert.equal(e.observerSha256,observerSha256());assert.deepEqual(e.browserInput.bindings,artifactBindings());assert.deepEqual(e.languageInput.pages,prosePages(policy));assert.deepEqual(e.browserInput.capture,read('tooling/assurance/reading-experience-capture.json'));
 assertExperienceReplay(await assessor.run('experience.report',e.browserInput),e.browser);assertExperienceReplay(await assessor.run('language.report',e.languageInput),e.language);
 assert.deepEqual(read('dist/assurance/reading-experience.json'),e.browser);assert.deepEqual(read('dist/assurance/plain-language.json'),e.language);
 for(const slug of ['reading-experience','plain-language']){const html=fs.readFileSync('dist/assurance/'+slug+'/index.html','utf8');assert.ok(html.includes('id="experience-download"'));assert.ok(html.includes('experience-runtime.js'));assert.ok(html.includes('id="experience-results"'));}
 assert.equal(read('bootstrap/site.json').executionBudget,20000000);
});
