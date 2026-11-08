'use strict';
// Generic local Encounter host. The REL manifest selects sources, grants and
// an entry. All transformation/composition work belongs to those sources.
// Outputs are staged, never installed or deployed by this host.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const rel=require('./rel-values.cjs');
const {createFrontDoor}=require('./encounter-source-front.cjs');
const policy=require('./source-policy-machine.cjs').getSourcePolicyMachine();
const decide=(query,input,gate)=>gate?gate.authorize(query,input):policy.compute(query,input).value;
const parseEncounter=(text,file)=>policy.compute('foundation.hydrate',{text,file,expectedBasis:policy.basis,expectedTextSha256:digest(text)}).value.surface;
const {valuePorts}=require('./ports/value.cjs');
const {computationalPorts}=require('./ports/browser-effects.cjs');
const {createSourceRuntime}=require('./hosts/source-runtime.cjs');
const {admitMarkup,observe}=require('./markup-observer.cjs');
const digest=text=>crypto.createHash('sha256').update(text).digest('hex');
async function main(manifestPath){
  const root=await fs.realpath(path.resolve(__dirname,'..'));
  function relative(value,gate){
    decide('host.path',{value},gate);
    const resolved=path.resolve(root,...value.split('/')),fromRoot=path.relative(root,resolved);if(!fromRoot||fromRoot==='..'||fromRoot.startsWith('..'+path.sep)||path.isAbsolute(fromRoot))throw Error('Local path escapes root');return value;
  }
  async function checked(value,gate){relative(value,gate);let current=root;for(const part of value.split('/')){current=path.join(current,part);const st=await fs.lstat(current).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(st?.isSymbolicLink())throw Error('Local source/output links are forbidden');}return current;}
  decide('host.relPath',{value:manifestPath});
  const utf8=bytes=>new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
  const manifestText=utf8(await fs.readFile(await checked(manifestPath))),facts=rel.parse(manifestText);
  const many=p=>facts.filter(f=>f.s==='local'&&f.p===p).map(f=>f.o);
  const declaration=decide('host.declaration',{facts}),aliases=declaration.aliases;
  const modules=declaration.modules,entries=declaration.entries,grants=many('grant'),inputs=many('input').map(name=>relative(name)),output=declaration.output;
  const origin=declaration.origin;
  const projection=require('./projection-transport.cjs').projectionTransport({authorize:(query,input,gate)=>decide(query,input,gate),hash:digest,clone:value=>rel.decode(rel.encode(value))});
  const outputRoot=await checked(output),sources=Object.create(null),artifacts=Object.create(null),projectedArtifacts=Object.create(null),runtimeCodes=new Set(),assetCodes=new Set(),assetSources=new Set();sources[manifestPath]=digest(manifestText);
  {const prior=await fs.readdir(outputRoot).catch(e=>{if(e.code==='ENOENT')return [];throw e;});if(prior.length)throw Error('Use a fresh isolated publication output');}
  async function assertZeroJson(){async function scan(directory){for(const entry of await fs.readdir(directory,{withFileTypes:true})){if(directory===root&&entry.name==='.git')continue;if(entry.isSymbolicLink())throw Error('Links cannot enter the publication closure');const name=path.join(directory,entry.name);if(entry.isDirectory())await scan(name);else decide('host.inventory',{name:path.relative(root,name)});}}await scan(root);}
  await assertZeroJson();
  const withinInput=(name,gate)=>decide('host.input',{name,inputs},gate);
  const readBytes=async(name,gate)=>{relative(name,gate);const actual=aliases[name]?.source??name;withinInput(actual,gate);const file=await checked(actual,gate),stat=await fs.stat(file);if(!stat.isFile())throw Error('Regular file required');decide('host.bytes',{bytes:stat.size},gate);const bytes=await fs.readFile(file);decide('host.bytes',{bytes:bytes.length},gate);const hash=digest(bytes);if(sources[actual]&&sources[actual]!==hash)throw Error('Input changed during execution: '+actual);sources[actual]=hash;return bytes;};
  const read=async(name,gate)=>utf8(await readBytes(name,gate));
  const writeBytes=async(name,bytes,gate,sourceAsset=false)=>{
    relative(name,gate);if(!Buffer.isBuffer(bytes))throw Error('Byte buffer required');
    const type=decide('host.classify',{name},gate);
    const knownAsset=sourceAsset||assetCodes.has(digest(bytes));
    projection.admitOutput({name,bytes:bytes.length,text:(type.markup||name.endsWith('.css'))?utf8(bytes):null,issuedRuntime:runtimeCodes.has(digest(bytes)),sourceAsset:knownAsset},gate);
    if(type.rel)rel.parse(utf8(bytes));
    if(type.markup)admitMarkup(utf8(bytes),{xml:type.xml,projectionIssued:Boolean(projection.identity(utf8(bytes))),sourceAsset:knownAsset,base:new URL(name,origin+'/').href,mode:'stage'},gate);
    const target=await checked(output+'/'+name,gate);await fs.mkdir(path.dirname(target),{recursive:true});
    const existing=await fs.readFile(target).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(existing&&!existing.equals(bytes)&&(!Object.hasOwn(artifacts,name)||artifacts[name]!==digest(existing)))throw Error('Staging output already differs: '+name);
    await fs.writeFile(target,bytes);artifacts[name]=digest(bytes);
    const projected=(type.markup||name.endsWith('.css'))?projection.identity(utf8(bytes)):null;
    if(projected)projectedArtifacts[name]={kind:projected.kind,sha256:artifacts[name],treeSha256:digest(rel.encode(projected.tree)),policyBasis:policy.basis};else delete projectedArtifacts[name];
    if(type.value){if(resources[name]!==artifacts[name])valueCache.delete(name);resources[name]=artifacts[name];}return true;
  };
  const write=async(name,text,gate)=>{if(typeof text!=='string')throw Error('Text output required');return writeBytes(name,Buffer.from(text),gate);};
  const readOutput=async(name,gate)=>{relative(name,gate);const target=await checked(output+'/'+name,gate),stat=await fs.stat(target);if(!stat.isFile())throw Error('Regular output file required');decide('host.bytes',{bytes:stat.size},gate);return utf8(await fs.readFile(target));};
  const resources=Object.create(null),valueCache=new Map();
  for(const [name,alias]of Object.entries(aliases))if(alias.kind==='value'){const text=await read(name);resources[name]=digest(text);valueCache.set(name,rel.decode(text));}else if(alias.kind==='asset'){resources[name]=digest(await readBytes(name));assetCodes.add(resources[name]);}
  console.log('Declared resources read; compiling '+modules.length+' Encounter sources.');
  const staticRead=async(text,gate)=>{
    const plan=gate.authorize('host.static',{text,resources});if(plan.literal)return rel.decodeData(text);
    const name=plan.file;if(!valueCache.has(name)){const body=Object.hasOwn(artifacts,name)?await readOutput(name,gate):await read(name,gate);if(digest(body)!==resources[name])throw Error('Static resource identity changed');valueCache.set(name,rel.decode(body));}
    const value=valueCache.get(name);return plan.fragment===null?value:gate.authorize('host.fragment',{value,fragment:plan.fragment});
  };
  const ports={...valuePorts(),...computationalPorts()};
  Object.assign(ports,{
    'scalar.quote':({value})=>rel.quote(value),'scalar.unquote':({text})=>rel.atom(text),
    'rel.encode':({value})=>rel.encode(value),'rel.decode':({text})=>rel.decode(text),
    'value.encode':({value})=>rel.literal(value),
    'rel.facts':({text})=>rel.parse(text),'rel.print':({facts})=>rel.print(facts),
    'static.read':({text},env,gate)=>staticRead(text,gate),
    'encounter.inspect':({text,file},env,gate)=>gate.observe(file,text).module,
    'encounter.observe':({text,file},env,gate)=>gate.observe(file,text),
    'markup.observe':({text,fragment=false})=>observe(text,{fragment}),
    'projection.render':(args,env,gate)=>projection.render(args,gate),
    'projection.combine':(args,env,gate)=>projection.combine(args,gate),
    'projection.tree':async({path:name},env,gate)=>{const text=await readOutput(name,gate),entry=projection.identity(text);gate.authorize('projection.output',{issued:Boolean(entry)});return rel.decode(rel.encode(entry.tree));},
    'projection.resolve':({text},env,gate)=>{const entry=projection.identity(text);gate.authorize('projection.output',{issued:Boolean(entry)});return rel.decode(rel.encode(entry.tree));},
    'artifact.list':()=>Object.entries(artifacts).map(([path,sha256])=>({path,sha256})),
    'artifact.identity':({path:name},env,gate)=>{relative(name,gate);if(!Object.hasOwn(artifacts,name))throw Error('Unknown staged artifact: '+name);const sha256=artifacts[name];return {path:name,sha256,integrity:'sha256-'+Buffer.from(sha256,'hex').toString('base64'),issuedRuntime:runtimeCodes.has(sha256)};},
    'source.resources':()=>Object.keys(resources).map(path=>({path,sha256:resources[path]})),
    'source.modules':()=>sourceCatalogue.map(s=>({file:s.file,sha256:s.sha256,queries:s.queries})),
    'digest.sha256':({text})=>digest(text),'source.read':({path:name},env,gate)=>read(name,gate),
    'source.list':async(args,env,gate)=>{const result=[];async function visit(name){const target=await checked(name,gate),st=await fs.stat(target);if(st.isDirectory()){for(const child of(await fs.readdir(target)).sort())await visit(name+'/'+child);}else if(st.isFile())result.push(name);}for(const input of inputs)await visit(input);return result;},
    'file.write':({path:name,text},env,gate)=>write(name,text,gate),
    'file.read':({path:name},env,gate)=>readOutput(name,gate),
    'file.copy':async({path:name},env,gate)=>{const bytes=await readBytes(name,gate),asset=assetSources.has(name)||aliases[name]?.kind==='asset';if(asset)assetCodes.add(digest(bytes));return writeBytes(name,bytes,gate,asset);},
    'file.remove':async({path:name},env,gate)=>{relative(name,gate);const target=await checked(output+'/'+name,gate);const st=await fs.lstat(target).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(!st)return true;if(!st.isFile()||!Object.hasOwn(artifacts,name))throw Error('Cannot remove an unowned staged artifact');await fs.unlink(target);delete artifacts[name];delete projectedArtifacts[name];return true;},
    'url.resolve':({href,route})=>{const base=new URL(route,'https://temple.invalid/'),target=new URL(href,base);return {external:target.origin!==base.origin,route:decodeURIComponent(target.pathname.slice(1)),fragment:decodeURIComponent(target.hash.slice(1))};}
  });
  // The bootstrap foundation is explicit; it is never sourced from retired files.
  const loaded=require('./native-loader.cjs').loadedIdentities();
  const foundation=Object.keys(loaded);
  const basisSources=Object.create(null);for(const name of foundation)basisSources[name]=loaded[name];
  const basis=digest(rel.encode({native:basisSources,policy:policy.basis})),sourceCatalogue=[];
  for(const name of modules){const text=await read(name);sourceCatalogue.push({file:name,text,sha256:digest(text),queries:Object.keys(parseEncounter(text,name).queries)});}
  const staticFacts=[],owners=new Map();for(const name of declaration.factSources){const text=await read(name);for(const f of rel.parse(text)){const key=rel.print([{s:f.s,p:f.p,o:''}]);decide('host.factOwner',{previous:owners.get(key)??null,current:name});owners.set(key,name);staticFacts.push(f);}}
  for(const name of decide('projection.assetSources',{facts:staticFacts}))assetSources.add(name);
  const profiles=declaration.profileSource?valueCache.get(declaration.profileSource).profiles:{};
  ports['runtime.bundle']=createSourceRuntime({sources:sourceCatalogue,facts:staticFacts,profiles,basis,resources,projection,issue:code=>runtimeCodes.add(digest(code)),publishSource:(name,text,gate)=>write(name,text,gate)});
  const front=createFrontDoor({profiles:{local:grants},ports,basis}),candidates=sourceCatalogue.map(s=>front.hydrate(s.file,s.text));
  const admissionPlan=decide('host.admissionPlan',{entries,hasFacts:Boolean(staticFacts.length),selected:many('query').length?many('query'):null}),phaseHandles=new Map(),cohortReceipts=[];
  for(const cohort of admissionPlan){
    const linked=front.link(candidates,cohort.selected?{queries:cohort.selected}:{roots:cohort.roots}),handle=front.admit(linked,{profile:'local',entries:cohort.entries});
    const factSnapshot=staticFacts.length?await front.index(handle,{facts:staticFacts}):null;
    cohortReceipts.push({entries:cohort.entries,admission:handle.receipt,factIndex:factSnapshot?.receipt??null});
    for(const entry of cohort.entries)phaseHandles.set(entry,{handle,factSnapshot});
  }
  const admissionText=rel.encode(cohortReceipts.map(({entries,admission})=>({entries,admission})),'PublicationAdmissionReceipts'),factIndexText=rel.encode(cohortReceipts.map(({entries,factIndex})=>({entries,factIndex})),'PublicationFactIndexReceipts');
  await fs.mkdir(outputRoot,{recursive:true});
  console.log('Source-owned admission and fact indexing passed for '+cohortReceipts.length+' bounded phase cohorts.');
  const phases=[];
  for(const entry of entries){
    const {handle,factSnapshot}=phaseHandles.get(entry);
    console.log('Executing '+entry);const before=policy.measurements;
    const result=await front.run(handle,entry,{input:{argument:process.argv[3]??null},factSnapshot,bindings:{spPolicy:{referenceSigil:'$'}}});
    const policyChecks=Object.fromEntries(Object.entries(policy.measurements).map(([query,after])=>{
      const prior=before[query]??{calls:0,sharedCaller:0,totalSteps:0};
      return [query,{calls:after.calls-prior.calls,sharedCaller:after.sharedCaller-prior.sharedCaller,steps:after.totalSteps-prior.totalSteps}];
    }).filter(([,change])=>change.calls));
    console.log(entry+': '+result.usage.steps+' steps');phases.push({entry,usage:result.usage,policyChecks,admissions:result.admissions??[],result:result.value??null});
  }
  console.log('Admitting final artifact identities and surfaces.');
  for(const name of Object.keys(artifacts)){
    if(digest(await fs.readFile(await checked(output+'/'+name)))!==artifacts[name])throw Error('Artifact changed before final admission: '+name);
    const type=decide('host.classify',{name});if(type.markup){const text=await readOutput(name);admitMarkup(text,{xml:type.xml,sourceAsset:assetCodes.has(artifacts[name]),projectionIssued:Boolean(projection.identity(text)),base:new URL(name,origin+'/').href,mode:'final',artifacts:Object.fromEntries(Object.entries(artifacts).map(([path,sha256])=>[path,{sha256,issuedRuntime:runtimeCodes.has(sha256),issuedProjection:projectedArtifacts[path]?.kind??null,integrity:'sha256-'+Buffer.from(sha256,'hex').toString('base64')}]))});}
  }
  for(const [name,expected]of Object.entries({...basisSources,...sources,...Object.fromEntries(policy.identities.map(s=>[s.file,s.sha256]))})){if(digest(await fs.readFile(await checked(name)))!==expected)throw Error('Source or foundation changed before receipt: '+name);}
  if(require('./source-policy-machine.cjs').loadSourcePolicyDescriptor().basis!==policy.basis)throw Error('Foundation declaration or pinned static parameters changed before receipt');
  await assertZeroJson();
  {async function inventory(directory,prefix=''){for(const item of await fs.readdir(directory,{withFileTypes:true})){const name=prefix+item.name;if(item.isSymbolicLink())throw Error('Output link refused');if(item.isDirectory())await inventory(path.join(directory,item.name),name+'/');else if(!item.isFile()||!Object.hasOwn(artifacts,name))throw Error('Unowned publication artifact: '+name);}}await inventory(outputRoot);}
  const receiptDirectory='receipts/'+digest(rel.encode({argument:process.argv[3]??null,basis,admissionSha256:digest(admissionText),sources}));
  await write(receiptDirectory+'/admission.rel',admissionText);await write(receiptDirectory+'/fact-index.rel',factIndexText);await write(receiptDirectory+'/execution.rel',rel.encode({basis,basisSources,policyBasis:policy.basis,policySources:policy.identities,policyChecks:policy.measurements,bootstrapTrustRoot:{node:process.version,launcher:'bootstrap/launch.cjs',loaderFunctionSha256:digest(require('./native-loader.cjs').start.toString()),scope:'Node and the launcher/loader are the explicit native bootstrap trust root; loaded basis modules are hashed from the exact bytes compiled'},zeroJsonFiles:0,environment:{node:process.version,platform:process.platform,architecture:process.arch},manifest:manifestPath,argument:process.argv[3]??null,sources,artifacts,projectedArtifacts,projectionProtocol:decide('projection.contract',null).protocol,phaseAdmissions:cohortReceipts,phases}));
  console.log('Local Encounter execution completed: '+output+' (bounded phase steps: '+phases.map(p=>p.usage.steps).join(', ')+'). No installation or publication.');
}
module.exports={main};
if(require.main===module)throw Error('Use node bootstrap/launch.cjs: publication requires captured native bytes.');







