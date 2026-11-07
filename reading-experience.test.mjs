import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
 assert.deepEqual(policy.requiredPasses.map(r=>[r.route,r.profile,r.rule]),[['temple/index.html','text-spacing','zoom.document-overflow'],['claimipedia/index.html','text-spacing','zoom.document-overflow']]);
 const report={status:'browser-observed',counts:{routes:20,missing:0,failed:0},regressionChecks:policy.requiredPasses.map(r=>({...r,status:'passed'}))};
 assert.equal((await assessor.run('experience.gate',report)).ok,true);
 for(const status of ['failed','needs-browser-evidence','needs-review']){const changed=structuredClone(report);changed.regressionChecks[0].status=status;assert.equal((await assessor.run('experience.gate',changed)).ok,false,status);}
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
