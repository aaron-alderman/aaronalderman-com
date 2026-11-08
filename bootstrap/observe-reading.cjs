'use strict';
// Read-only browser observation transport. Plans and all pass/fail decisions
// are Encounter-owned. This driver emits typed REL measurements, never pages,
// application source, assertions, thresholds or a serialized programme.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const rel=require('./rel-values.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let observationBrowser=null;
async function observe(){
 const root=path.resolve(__dirname,'..');
 const manifest=rel.parse(await fs.readFile(path.join(root,'bootstrap/publication.rel'),'utf8'));
 const output=path.join(root,manifest.find(f=>f.s==='local'&&f.p==='output').o);
 const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4218';
 const destination=process.env.QA_CAPTURE||path.join(root,'source/assurance/browser-capture.rel');
 const screenshots=process.env.QA_SCREENSHOTS;
 const observationDirectory=path.join(path.dirname(destination),'observations');await fs.mkdir(observationDirectory,{recursive:true});
 async function observationRecord(kind,value){const id=kind+'-'+value.route.replace(/[^a-z0-9-]/g,'-');const name=id+'.rel',bytes=rel.encode(value);await fs.writeFile(path.join(observationDirectory,name),bytes);return {route:value.route,...(value.profile?{profile:value.profile}:{}),path:'source/assurance/observations/'+name,sha256:sha(bytes)};}
 const policyBytes=await fs.readFile(path.join(root,'source/assurance/experience.encounter'));
 const values=require('./ports/value.cjs').valuePorts(),numbers=require('./ports/browser-effects.cjs').computationalPorts();
 const planPorts={'text.replaceAll':values['text.replaceAll'],'record.put':values['record.put'],'number.calculate':numbers['number.calculate']};
 const front=require('./encounter-source-front.cjs').createFrontDoor({ports:planPorts,profiles:{observation:Object.keys(planPorts)},basis:'reading-observation-plan'});
 const candidate=front.hydrate('source/assurance/experience.encounter',policyBytes.toString('utf8'));
 const admission=front.admit(front.link([candidate],{roots:['experience.plan']}),{profile:'observation',entries:['experience.plan']});
 const execution=await front.run(admission,'experience.plan',{input:{}}),plan=execution.value,planBytes=rel.encode(plan);
 const playwright=require(process.env.PLAYWRIGHT_PATH||'playwright');
 const browser=await playwright.chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 observationBrowser=browser;
 const capture={protocol:'aaronalderman/reading-experience-observations/2',capturedAt:new Date().toISOString(),origin,browser:browser.version(),planSha256:sha(planBytes),observerSha256:sha(await fs.readFile(__filename)),policySourceSha256:sha(policyBytes),planAdmission:admission.receipt,planUsage:execution.usage,bindings:{},snapshots:[],journeys:[],language:[]};
 async function inventory(dir,prefix=''){const names=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const n=prefix+e.name;if(e.isDirectory())names.push(...await inventory(path.join(dir,e.name),n+'/'));else names.push(n);}return names;}
 const files=await inventory(output),requestedDependencies=new Set();
 function track(page){page.on('response',response=>{const url=new URL(response.url());if(url.origin!==origin||response.status()!==200)return;let name=decodeURIComponent(url.pathname.slice(1));if(name===''||name.endsWith('/'))name+='index.html';requestedDependencies.add(name);});}
 for(const file of files.filter(f=>plan.routes.some(r=>r.path===f)||/\.(?:css|js)$/.test(f)))capture.bindings[file]=sha(await fs.readFile(path.join(output,file)));
 if(screenshots)await fs.mkdir(screenshots,{recursive:true});
 async function settle(page){await page.waitForLoadState('load');await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=="lazy"||i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0).map(i=>i.decode().catch(()=>{})));});await page.waitForTimeout(plan.settleMs);}
 // This function only reads host properties. The policy interprets them.
 function snapshotInBrowser({plan,route,profile,state='default',textSelector=null,textLimit=null}){
  const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const rgba=s=>{const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const n=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);return n.length===3?[...n,1]:n;};
  const cssPath=e=>{if(e.id)return '#'+e.id;const p=e.parentElement;return p?cssPath(p)+'>'+e.tagName.toLowerCase()+':nth-child('+([...p.children].indexOf(e)+1)+')':e.tagName.toLowerCase();};
  const paint=e=>{const layers=[];for(let p=e;p;p=p.parentElement){const c=getComputedStyle(p);layers.push({rgba:rgba(c.backgroundColor),image:c.backgroundImage,opacity:Number(c.opacity),filter:c.filter,blend:c.mixBlendMode});}return {foreground:rgba(getComputedStyle(e).color),layers};};
  const text=e=>{const c=getComputedStyle(e);return {path:cssPath(e),tag:e.tagName,text:(e.innerText||e.textContent||'').trim(),fontSize:parseFloat(c.fontSize),fontWeight:parseFloat(c.fontWeight),paint:paint(e),state};};
  const visible=e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const texts=[...document.querySelectorAll(textSelector||plan.textSelectors)].filter(visible);
  const blocks=[...document.querySelectorAll(plan.blockSelectors)].filter(visible);
  const images=[...document.querySelectorAll(plan.imageSelector)].map(e=>({src:e.getAttribute('src'),complete:e.complete,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,rect:rect(e),frame:rect(e.parentElement),fit:getComputedStyle(e).objectFit}));
  return {route:route.path,profile:profile.id,url:location.href,viewport:{width:innerWidth,height:innerHeight},readyState:document.readyState,fontStatus:document.fonts.status,spacingApplied:!!document.querySelector('#reading-spacing-override'),document:{clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},texts:texts.slice(0,textLimit||plan.maxTexts).map(text),truncatedTexts:texts.length>plan.maxTexts,blocks:blocks.slice(0,plan.maxBlocks).map(e=>{const c=getComputedStyle(e);return {path:cssPath(e),tag:e.tagName,text:(e.innerText||'').trim().slice(0,240),clientWidth:e.clientWidth,clientHeight:e.clientHeight,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,overflowX:c.overflowX,overflowY:c.overflowY,fontSize:parseFloat(c.fontSize),lineHeight:parseFloat(c.lineHeight)||0,letterSpacing:parseFloat(c.letterSpacing)||0,wordSpacing:parseFloat(c.wordSpacing)||0,paragraphGap:parseFloat(c.marginBlockEnd)||0};}),truncatedBlocks:blocks.length>plan.maxBlocks,images,imageRows:[...document.querySelectorAll(plan.imageObservationSelector)].map(e=>({...e.dataset})),imageStatus:document.querySelector(plan.imageStatusSelector)?.textContent||null};
 }
 await Promise.all(plan.profiles.map(async profile=>{
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},reducedMotion:plan.reducedMotion});
  for(const route of plan.routes){
   const page=await context.newPage();track(page);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' ['+m.location().url+']');});
   await page.goto(origin+'/'+route.path,{waitUntil:'load',timeout:plan.timeoutMs});await settle(page);
   if(profile.spacing){await page.addStyleTag({content:plan.spacingCSS});await page.evaluate(()=>document.querySelector('style:last-of-type').id='reading-spacing-override');await page.waitForTimeout(plan.settleMs);}
   // Existing diagnostic events remeasure after a declared spacing mutation.
   await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForTimeout(plan.settleMs);
   if(await page.locator(plan.imageStatusSelector).count())await page.waitForFunction(plan=>document.querySelectorAll(plan.imageObservationSelector).length===document.querySelectorAll(plan.imageSelector).length,plan,{timeout:plan.timeoutMs});
   const s=await page.evaluate(snapshotInBrowser,{plan,route,profile});
   const hoverTarget=page.locator(plan.hoverSelector).first(),hoverCount=await page.locator(plan.hoverSelector).count();
   s.hoverObservation={matched:hoverCount,visible:hoverCount>0&&await hoverTarget.isVisible(),observed:false,actionError:null};
   if(s.hoverObservation.visible){try{await hoverTarget.hover({timeout:plan.timeoutMs});await page.waitForTimeout(plan.settleMs);const hover=await page.evaluate(snapshotInBrowser,{plan,route,profile,state:'hover',textSelector:plan.hoverSelector,textLimit:1});s.texts.push(...hover.texts);s.hoverObservation.observed=hover.texts.length>0;}catch(error){s.hoverObservation.actionError=String(error);}await page.mouse.move(plan.pointerRest.x,plan.pointerRest.y);}
   s.errors=errors;s.errorSink=await page.locator('[data-temple-errors]').allTextContents();capture.snapshots.push(await observationRecord(profile.id,s));
   if(screenshots){const key=profile.id+'-'+route.path.replace(/[^a-z0-9-]/g,'_');await page.screenshot({path:path.join(screenshots,key+'-top.png')});await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(plan.settleMs);await page.screenshot({path:path.join(screenshots,key+'-bottom.png')});}
   await page.close();console.log(profile.id+' '+route.path);
  }await context.close();
 }));
 const context=await browser.newContext({viewport:{width:plan.profiles[0].width,height:plan.profiles[0].height},reducedMotion:'reduce'});
 for(const route of plan.routes){
  const page=await context.newPage();track(page);await page.goto(origin+'/'+route.path,{waitUntil:'load',timeout:plan.timeoutMs});await settle(page);
  const observedKeys=[];await page.exposeFunction('recordObservedKey',event=>observedKeys.push(event));
  await page.evaluate(()=>{window.__observedKeys=[];window.__focusPaint=new WeakMap();document.addEventListener('keydown',e=>{const event={key:e.key,trusted:e.isTrusted};window.__observedKeys.push(event);window.recordObservedKey(event);},true);document.addEventListener('focusin',e=>{const c=getComputedStyle(e.target);window.__focusPaint.set(e.target,[c.color,c.backgroundColor,c.borderColor,c.outline,c.boxShadow].join('|'));},true);});
  const j={route:route.path,origin,skip:route.skip,next:route.next,homePaths:plan.homePaths,returnSelector:plan.returnSelector,events:[],focuses:[],foundSkip:false,skipTargetExists:await page.locator(route.skip).count()>0,foundReturn:false,afterSkip:{hash:''},afterReturn:{origin:'',path:''},exploration:{found:false,events:[],after:{origin:'',path:''}}};
  async function focusObservation(){return page.evaluate(({points,selector})=>{const e=document.activeElement,c=getComputedStyle(e),r=e.getBoundingClientRect(),rgba=s=>{const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const n=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);return n.length===3?[...n,1]:n;},layers=[];for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);layers.push({rgba:rgba(s.backgroundColor),image:s.backgroundImage,opacity:Number(s.opacity),filter:s.filter,blend:s.mixBlendMode});}const hits=points.map(([x,y])=>{const hit=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);return {ownsHit:!!hit&&(hit===e||e.contains(hit))};});return {component:e.matches(selector),documentFocused:document.hasFocus(),path:e.id?'#'+e.id:e.tagName.toLowerCase(),tag:e.tagName,text:(e.innerText||e.getAttribute('aria-label')||'').trim(),fontSize:parseFloat(c.fontSize),fontWeight:parseFloat(c.fontWeight),paint:{foreground:rgba(c.color),layers},rect:{width:r.width,height:r.height},points:hits,state:'keyboard-focus',outlineWidth:parseFloat(c.outlineWidth),outlineStyle:c.outlineStyle,boxShadow:c.boxShadow,focusVisible:e.matches(':focus-visible'),beforePaint:window.__focusPaint.get(e)||null,afterPaint:[c.color,c.backgroundColor,c.borderColor,c.outline,c.boxShadow].join('|')};},{points:plan.focusPoints,selector:plan.focusSelector});}
  async function reach(selector,href){for(let n=0;n<plan.maxTabs;n++){await page.keyboard.press('Tab');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const f=await focusObservation();j.focuses.push(f);if(await page.evaluate(({selector,href})=>{const e=document.activeElement;return href?e.tagName==='A'&&e.getAttribute('href')===href:e.matches(selector)||!!e.closest(selector);},{selector,href})){await page.keyboard.press('Enter');await page.waitForTimeout(plan.settleMs);return true;}}return false;}
  j.foundSkip=await reach(null,route.skip);j.afterSkip=await page.evaluate(()=>({hash:location.hash}));
  j.foundReturn=await reach(plan.returnSelector,null);j.events=observedKeys.slice();j.afterReturn=await page.evaluate(()=>({origin:location.origin,path:location.pathname}));
  if(route.next){await page.goto(origin+'/'+route.path,{waitUntil:'load',timeout:plan.timeoutMs});await settle(page);const start=observedKeys.length;await page.evaluate(()=>{window.__focusPaint=new WeakMap();document.addEventListener('keydown',e=>window.recordObservedKey({key:e.key,trusted:e.isTrusted}),true);});j.exploration.found=await reach(route.next.selector,null);j.exploration.events=observedKeys.slice(start);j.exploration.after=await page.evaluate(()=>({origin:location.origin,path:location.pathname}));}
  capture.journeys.push(await observationRecord('keyboard',j));await page.close();console.log('keyboard '+route.path);
 }
 const languageContext=await browser.newContext({viewport:{width:1280,height:800},javaScriptEnabled:false});
 for(const file of files.filter(f=>f.endsWith('.html'))){const page=await languageContext.newPage();await page.goto(origin+'/'+file,{waitUntil:'domcontentloaded',timeout:plan.timeoutMs});const data=await page.evaluate(plan=>{const main=document.querySelector('main')||document.querySelector('[role=main]');const blocks=main?[...main.querySelectorAll(plan.languageSelectors)].filter(e=>!e.closest(plan.languageExclude)).slice(0,plan.languageMaxBlocks).map(e=>(e.innerText||'').trim()):[];const text=blocks.join(' ');return {text,blocks,sentences:text.split(new RegExp(plan.languageSentencePattern)),links:main?[...main.querySelectorAll('a')].slice(0,plan.languageMaxLinks).map(e=>(e.innerText||'').trim()):[],foundMain:!!main};},plan);capture.language.push({route:file,sourceSha256:sha(await fs.readFile(path.join(output,file))),...data});await page.close();}
 for(const name of requestedDependencies)if(files.includes(name))capture.bindings[name]=sha(await fs.readFile(path.join(output,name)));
 await languageContext.close();await context.close();await browser.close();await fs.writeFile(destination,rel.encode(capture));console.log('Raw REL observations: '+destination);
}
if(require.main===module)observe().catch(async error=>{console.error(error);if(observationBrowser)await observationBrowser.close();process.exitCode=1;}).finally(()=>require('./isolated-regexp.cjs').nodeRegexp().close());
module.exports={observe};
