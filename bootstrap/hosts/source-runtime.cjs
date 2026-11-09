'use strict';
// Generic projection of admitted Encounter source, never executable model data.
const rel=require('../rel-values.cjs');
const {emitFoundation}=require('../portable.cjs');
const {valuePorts}=require('../ports/value.cjs');
const {browserPorts,reportBrowserError}=require('../ports/browser.cjs');
const {computationalPorts,browserEffects}=require('../ports/browser-effects.cjs');
const {createFrontDoor}=require('../encounter-source-front.cjs');
const {getSourcePolicyMachine,loadSourcePolicyDescriptor}=require('../source-policy-machine.cjs');
const crypto=require('node:crypto');
const {markupMechanisms}=require('../markup-ceiling.cjs');
const {projectionTransport}=require('../projection-transport.cjs');

async function startSourceRuntime(packet){
  const hash=text=>computationalPorts()['digest.sha256.sync']({text});
  const strictText=async response=>new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await response.arrayBuffer());
  let front,handle,factSnapshot=null,pending=Promise.resolve();
  const state=new Map(),host={document,fetch,state,bindings:new Map(),mounts:new Map(),URL,Blob,setTimeout,reportError:reportBrowserError,markup:markupMechanisms().browser(document)};
  const dispatch=(query,input)=>{const task=pending.then(()=>front.run(handle,query,{input:input??null,factSnapshot,data:packet.data}));pending=task.catch(()=>{});return task;};
  const mechanics={...valuePorts(),...computationalPorts(host),...browserPorts(host,dispatch),...browserEffects(host,dispatch)};
  const readPinned=async(file,identity)=>{const response=await fetch(new URL('/'+file,document.baseURI));if(!response.ok)throw Error('Foundation source unavailable: '+file);const text=await strictText(response);if(hash(text)!==identity)throw Error('Foundation source identity mismatch: '+file);return text;};
  const policySources=[];
  for(const source of packet.policy.sources)policySources.push({file:source.file,text:await readPinned(source.file,source.sha256)});
  const policyBasis=hash(rel.encode({declaration:packet.policy.declaration,sources:packet.policy.sources}));
  if(policyBasis!==packet.policy.basis)throw Error('Foundation basis mismatch');
  const policy=createPolicy({sources:policySources,basis:policyBasis,limit:packet.policy.limit},{
    'markup.parse':({text})=>host.markup.parse(text),
    'url.observe':({value,base})=>{const url=new URL(value,base);return {href:url.href,origin:url.origin,protocol:url.protocol,path:decodeURIComponent(url.pathname.slice(1)),fragment:url.hash,search:url.search};},
    'text.replace':mechanics['text.replace'],'text.match':mechanics['text.match']
  },hash);
  const projection=projectionTransport({authorize:(query,input,gate)=>gate.authorize(query,input),hash,clone:value=>rel.decode(rel.encode(value)),classes:packet.projectionClasses});
  host.projection=projection;
  host.markup=markupMechanisms().browser(document,projection);
  const regexp=isolatedRegexp({makeWorker:()=>{
    const code='const task=('+regexpTask.toString()+');self.onmessage=event=>{const message=event.data;try{self.postMessage({id:message.id,value:task(message)});}catch(error){self.postMessage({id:message.id,error:{name:String(error.name),message:String(error.message)}});}};';
    const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'})),worker=new Worker(url);URL.revokeObjectURL(url);
    const messages=new Map(),errors=new Map();return {postMessage:value=>worker.postMessage(value),terminate:()=>worker.terminate(),onMessage:fn=>{const handler=event=>fn(event.data);messages.set(fn,handler);worker.addEventListener('message',handler);},offMessage:fn=>worker.removeEventListener('message',messages.get(fn)),onError:fn=>{const handler=event=>fn({message:event.message});errors.set(fn,handler);worker.addEventListener('error',handler);},offError:fn=>worker.removeEventListener('error',errors.get(fn))};
  }});
  const decode=async(text,gate)=>{
    const plan=gate.authorize('host.static',{text,resources:packet.resources});if(plan.literal)return rel.decodeData(text);
    const body=await readPinned(plan.file,packet.resources[plan.file]),value=rel.decode(body);
    return plan.fragment===null?value:gate.authorize('host.fragment',{value,fragment:plan.fragment});
  };
  Object.assign(mechanics,{
    'rel.encode':({value})=>rel.encode(value),'rel.decode':({text})=>rel.decode(text),
    'value.encode':({value})=>rel.literal(value),
    'rel.facts':({text})=>rel.parse(text),'rel.print':({facts})=>rel.print(facts),
    'scalar.quote':({value})=>rel.quote(value),'scalar.unquote':({text})=>rel.atom(text),
    'static.read':({text},env,gate)=>decode(text,gate),
    'asset.rel':({url},env,gate)=>decode(gate.authorize('host.asset',{url,base:document.baseURI}),gate),
    'encounter.inspect':({text,file},env,gate)=>gate.observe(file,text).module
  });
  mechanics['projection.render']=(args,env,gate)=>projection.render(args,gate);
  mechanics['projection.combine']=(args,env,gate)=>projection.combine(args,gate);
  mechanics['markup.observe']=({text})=>host.markup.parse(text);
  delete mechanics['asset.json'];
  const createFrontDoor=createCompiler(hash,policy,regexp);
  front=createFrontDoor({ports:mechanics,profiles:{runtime:packet.grants},basis:packet.basis,limit:packet.budget});
  const candidates=[];
  for(const source of packet.sources){const response=await fetch(new URL('/'+source.file,document.baseURI));if(!response.ok)throw Error('Encounter source unavailable: '+source.file);const text=await strictText(response);if(hash(text)!==source.sha256)throw Error('Encounter runtime source identity mismatch');candidates.push(front.hydrate(source.file,text));}
  const linked=front.link(candidates,{roots:packet.roots});handle=front.admit(linked,{profile:'runtime',entries:packet.entries});
  if(packet.facts.length)factSnapshot=await front.index(handle,{facts:packet.facts});
  await dispatch(packet.entry,null);
}
// Fixed adapters for browser APIs outside the document Encounter runtime.
function registerServiceWorker(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/service-worker.js').catch(error=>console.warn('Offline setup failed',error));
  }
}
function startServiceWorker({cacheName,cachePrefix,shell,home,start,offlineMessage}){
  const urls=new Set(shell.map(path=>new URL(path,self.location.origin).href));
  const cached=async request=>(await caches.open(cacheName)).match(request);
  self.addEventListener('install',event=>{
    event.waitUntil(caches.open(cacheName).then(cache=>
      cache.addAll(shell.map(path=>new Request(path,{cache:'reload'})))));
  });
  self.addEventListener('activate',event=>{
    event.waitUntil((async()=>{
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key.startsWith(cachePrefix)&&key!==cacheName).map(key=>caches.delete(key)));
      await self.clients.claim();
    })());
  });
  self.addEventListener('fetch',event=>{
    const {request}=event;
    const url=new URL(request.url);
    if(request.method!=='GET'||url.origin!==self.location.origin)return;
    if(request.mode==='navigate'){
      event.respondWith(fetch(request).catch(async()=>{
        if(url.pathname===start||url.pathname===home){
          const page=await cached(home);
          if(page)return page;
        }
        return new Response(offlineMessage,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }));
    }else if(urls.has(url.href)){
      event.respondWith(fetch(request).catch(async()=>await cached(request)??Response.error()));
    }
  });
}
function packagePwa(plan,issue){
  if(plan.kind==='client'){
    const script='('+registerServiceWorker.toString()+')();\n';
    issue(script);
    return {script,manifest:JSON.stringify(plan.manifest,null,2)+'\n'};
  }
  const adapter=startServiceWorker.toString(),cachePrefix='aaronalderman-shell-';
  const adapterRevision=crypto.createHash('sha256').update(adapter).digest('hex');
  const cacheName=cachePrefix+plan.revision+'-'+adapterRevision;
  const script='('+adapter+')('+JSON.stringify({...plan,cacheName,cachePrefix})+');\n';
  issue(script);
  return {script};
}
function createSourceRuntime({sources,facts,profiles,basis,resources={},issue,publishSource,projection}){
  const policy=getSourcePolicyMachine(),descriptor=loadSourcePolicyDescriptor();
  return async function bundle({entry,mode,queries,factSubjects=[],data=null,budget=2000000,grantProfile},env,gate){
    if(mode==='pwa')return packagePwa(gate.authorize('host.pwaRuntime',data),issue);
    const input={mode,budget,grantProfile:grantProfile??null,profiles,queries,entry,facts,factSubjects};
    const plan=gate?gate.authorize('host.runtime',input):policy.compute('host.runtime',input).value,profile=plan.profile;
    const mechanics={...valuePorts(),...computationalPorts({}),...browserPorts({},()=>{}),...browserEffects({document:{}},()=>{})};
    delete mechanics['asset.json'];
    for(const name of ['rel.encode','rel.decode','rel.facts','rel.print','scalar.quote','scalar.unquote','static.read','asset.rel','encounter.inspect','value.encode','projection.render','projection.combine','markup.observe'])mechanics[name]=()=>{throw Error('Browser mechanics do not execute during source qualification');};
    const runtimeFacts=plan.facts,roots=plan.roots;
    const options={ports:mechanics,profiles:{[profile]:profiles[profile]},basis};
    let admissionReceipt;
    if(gate)admissionReceipt=gate.qualify({options,sources,selection:{roots},admission:{profile,entries:queries}});
    else {const front=createFrontDoor(options);admissionReceipt=front.admit(front.link(sources.map(s=>front.hydrate(s.file,s.text)),{roots}),{profile,entries:queries}).receipt;}
    const receipt=rel.decode(admissionReceipt,'AdmissionReceipt'),needed=new Set(receipt.queries);
    const selected=sources.filter(source=>source.queries.some(name=>needed.has(name))).map(({file,sha256})=>({file,sha256}));
    if(!publishSource)throw Error('An explicit source publication mechanism is required');
    for(const selectedSource of selected){const source=sources.find(s=>s.file===selectedSource.file);if(crypto.createHash('sha256').update(source.text).digest('hex')!==source.sha256)throw Error('Runtime source changed');await publishSource(source.file,source.text,gate);}
    for(const source of descriptor.sources)await publishSource(source.file,source.text,gate);
    const policyPacket={basis:descriptor.basis,limit:descriptor.limit,declaration:descriptor.declaration,sources:policy.identities};
    const packet={basis,entry,entries:queries,roots,grants:plan.grants,budget,facts:runtimeFacts,data,sources:selected,resources,policy:policyPacket,projectionClasses:projection?.classes()??[]};
    const code='(async()=>{\n'+emitFoundation({module:false})+'\n'+projectionTransport.toString()+'\n'+markupMechanisms.toString()+'\n'+browserPorts.toString()+'\n'+reportBrowserError.toString()+'\n'+browserEffects.toString()+'\n'+startSourceRuntime.toString()+'\nawait startSourceRuntime(rel.decode('+rel.quote(rel.encode(packet))+'));\n})().catch(error=>{console.error(error);const sink=document.querySelector("[data-temple-errors]");if(sink)sink.textContent=String(error.message??error);});\n';
    if(issue)issue(code);return code;
  };
}
module.exports={createSourceRuntime};


