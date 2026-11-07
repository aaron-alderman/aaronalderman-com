// Isolated Linux CI test transport, never a controller for a user's desktop browser.
// The admitted plan owns routes, widths, input sequences, limits and selectors.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createExperienceAssessor,read,root,sha,artifactBindings,observerSha256,assessExperience} from './assess-reading-experience.mjs';
import {observeReadingExperience} from './reading-experience-observer.mjs';
if(process.platform!=='linux'||process.env.CI!=='true')throw Error('This harness runs only in isolated Linux CI; use the supported browser tools for desktop inspection.');
const assessor=await createExperienceAssessor(),policy=read('source/assurance/reading-experience.json'),plan=await assessor.run('experience.plan',{policy});
const output=path.join(root,'.build/reading-experience-ci');fs.mkdirSync(output,{recursive:true});
const profileRoot=path.join(root,'.build/reading-experience-profiles');fs.mkdirSync(profileRoot,{recursive:true});
const profile=fs.mkdtempSync(path.join(profileRoot,'chrome-')),port=4197,debug=9238,origin='http://127.0.0.1:'+port,children=[],delay=ms=>new Promise(r=>setTimeout(r,ms));
const start=(command,args,options={})=>{const child=spawn(command,args,{cwd:root,stdio:['ignore','ignore','pipe'],...options});children.push(child);child.stderr.on('data',data=>fs.appendFileSync(path.join(output,'transport.log'),data));return child;};
const capture={protocol:'worldwright/reading-experience-observations/1',origin,capturedAt:new Date().toISOString(),provenance:{issuer:'GitHub Actions isolated Chromium harness',commit:process.env.GITHUB_SHA??null,run:process.env.GITHUB_RUN_ID??null,attempt:process.env.GITHUB_RUN_ATTEMPT??null,evidenceFamily:'github-actions:'+process.env.GITHUB_RUN_ID+':'+process.env.GITHUB_RUN_ATTEMPT,conditions:plan.conditions},planSha256:sha(JSON.stringify(plan)),observerSha256:observerSha256(),bindings:artifactBindings(),browser:null,snapshots:[],journeys:[]};
let socket;const pending=new Map();let serial=0,activeEvents=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Protocol deadline: '+method));},plan.timeoutMs);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
const observe=(operation,extra={})=>evaluate('('+observeReadingExperience.toString()+')('+JSON.stringify({operation,plan,...extra})+')');
async function waitFor(test,label){const deadline=Date.now()+plan.timeoutMs;while(Date.now()<deadline){try{if(await test())return;}catch{}await delay(100);}throw Error('Readiness deadline: '+label);}
async function navigate(route){const url=origin+'/'+route;await send('Page.navigate',{url});await waitFor(()=>evaluate('location.href==='+JSON.stringify(url)+'&&document.readyState==="complete"'),'declared document');await evaluate('document.fonts.ready.then(()=>true)');await send('Input.dispatchMouseEvent',{type:'mouseMoved',...plan.conditions.pointerRest});await delay(plan.settleMs);}
async function press(input){await send('Input.dispatchKeyEvent',{type:'keyDown',...input});await send('Input.dispatchKeyEvent',{type:'keyUp',...input});await delay(20);}
async function seek(selector,focuses){for(let i=0;i<plan.keyboard.maxTabs;i++){await press(plan.keyboard.tab);const f=await observe('focus');focuses.push(f);if(await evaluate('document.activeElement.matches('+JSON.stringify(selector)+')'))return true;}return false;}
try{
 start(process.execPath,['serve.mjs'],{env:{...process.env,WORLDWRIGHT_PORT:String(port)}});
 start(process.env.CHROME_BIN??'google-chrome',['--headless=new','--disable-gpu','--no-sandbox','--remote-debugging-port='+debug,'--user-data-dir='+profile,'--no-first-run','about:blank']);
 await waitFor(async()=> (await fetch('http://127.0.0.1:'+debug+'/json/version')).ok,'isolated browser');
 const target=await(await fetch('http://127.0.0.1:'+debug+'/json/new?about:blank',{method:'PUT'})).json();
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const p=pending.get(message.id);if(!p)return;pending.delete(message.id);message.error?p.reject(Error(JSON.stringify(message.error))):p.resolve(message.result);}else if(message.method==='Runtime.bindingCalled'&&message.params.name==='__readingKeyEvent')activeEvents.push(JSON.parse(message.params.payload));});
 await send('Page.enable');await send('Runtime.enable');await send('Runtime.addBinding',{name:'__readingKeyEvent'});capture.browser=await send('Browser.getVersion');
 await send('Emulation.setEmulatedMedia',{features:plan.conditions.media});
 for(const route of plan.routes){
  for(const viewport of plan.profiles){
   await send('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:false});await navigate(route.path);
   if(viewport.spacing)await evaluate('(()=>{const s=document.createElement("style");s.id="reading-spacing-override";s.textContent='+JSON.stringify(plan.spacingCSS)+';document.head.append(s);return true;})()');
   await observe('prepare-images');await delay(plan.settleMs);const snapshot=await observe('snapshot',{route:route.path,profile:viewport.id,state:'initial'});
   const hover=await evaluate('(()=>{const n=document.querySelector('+JSON.stringify(plan.hoverSelector)+');if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
   if(hover){await send('Input.dispatchMouseEvent',{type:'mouseMoved',...hover});await delay(plan.settleMs);const hovered=await observe('snapshot',{route:route.path,profile:viewport.id,state:'hover'});snapshot.texts.push(...hovered.texts);}
   capture.snapshots.push(snapshot);
   const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,String(capture.snapshots.length).padStart(3,'0')+'.png'),Buffer.from(image.data,'base64'));
   // Frame screenshots expose below-the-fold image treatment without changing the published page.
   if(route.requiredImageCount){const frames=await evaluate('Array.from(document.querySelectorAll('+JSON.stringify(plan.images.frameSelector)+')).map(n=>{const r=n.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})');for(let i=0;i<frames.length;i++){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:frames[i]});fs.writeFileSync(path.join(output,String(capture.snapshots.length).padStart(3,'0')+'-card-'+(i+1)+'.png'),Buffer.from(shot.data,'base64'));}}
  }
  const viewport=plan.profiles[0];await send('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:false});await navigate(route.path);activeEvents=[];await observe('install-keyboard');
  const keyboardViewport=await evaluate('({width:innerWidth,height:innerHeight})'),focuses=[],skipSelector='a[href='+JSON.stringify(route.skip)+']',foundSkip=await seek(skipSelector,focuses);
  if(foundSkip)await press(plan.keyboard.enter);
  const afterSkip=await evaluate('({hash:location.hash,path:location.pathname})'),skipTargetExists=await evaluate('document.querySelector('+JSON.stringify(route.skip)+')!==null');
  const beforeReturnEvents=[...activeEvents];let exploration=null;
  if(route.next){await navigate(route.path);activeEvents=[];await observe('install-keyboard');const found=await seek(route.next.selector,focuses);if(found)await press(plan.keyboard.enter);await delay(plan.settleMs);exploration={found,events:[...activeEvents],after:await evaluate('({origin:location.origin,path:location.pathname})')};}
  await navigate(route.path);activeEvents=[];await observe('install-keyboard');const foundReturn=await seek(plan.keyboard.returnSelector,focuses);
  if(foundReturn)await press(plan.keyboard.enter);
  const returnEvents=[...activeEvents];await delay(plan.settleMs);
  const afterReturn=await evaluate('({origin:location.origin,path:location.pathname})');
  capture.journeys.push({route:route.path,origin,viewport:keyboardViewport,skip:route.skip,returnSelector:plan.keyboard.returnSelector,foundSkip,skipTargetExists,afterSkip,foundReturn,afterReturn,exploration,events:[...beforeReturnEvents,...returnEvents],focuses});
  fs.writeFileSync(path.join(output,'observations.partial.json'),JSON.stringify(capture,null,2)+'\n');
 }
 const file=path.join(output,'observations.json');fs.writeFileSync(file,JSON.stringify(capture,null,2)+'\n');
 // Persist raw evidence separately from its admitted classification.
 fs.writeFileSync(path.join(root,'tooling/assurance/reading-experience-capture.json'),JSON.stringify(capture,null,2)+'\n');
 const report=await assessExperience({captureFile:file});fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report.browser,null,2)+'\n');
 console.log(JSON.stringify({browser:report.browser.counts,language:report.language.counts}));
 // Findings remain visible review work; evidence completeness and binding are
 // release gates. Assertions inside the admitted report reject malformed data.
 const gate=await assessor.run('experience.gate',report.browser);if(!gate.ok)throw Error('Admitted browser evidence gate refused this release.');
}finally{for(const child of children)child.kill();socket?.close();}
