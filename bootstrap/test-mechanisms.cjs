'use strict';
// Read-only test transport. Scenarios, callbacks, expected values and assertions
// live in Encounter. No eval, JavaScript test loader or scenario dispatch here.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const rel=require('./rel-values.cjs'),{createKernel}=require('./temple-seed.cjs');
const {synchronousSeed}=require('./seed-sync.cjs');
const root=path.resolve(__dirname,'..');
function mechanisms(){
  const objects=new Map(),trace=[];let serial=0,ports,context=null;
  const keep=value=>{const id=++serial;objects.set(id,value);return {nativeHandle:id};};
  const resolve=value=>{
    if(value&&typeof value==='object'){
      if(Object.keys(value).length===1&&Object.hasOwn(value,'nativeHandle')){if(!objects.has(value.nativeHandle))throw Error('Foreign test handle');return objects.get(value.nativeHandle);}
      if(Array.isArray(value))return value.map(resolve);
      return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,resolve(item)]));
    }return value;
  };
  const snapshot=value=>{
    if(value===undefined)return null;
    if(typeof value==='function')return keep(value);
    if(Buffer.isBuffer(value))return [...value];
    if(value instanceof Error)return {name:value.name,message:value.message,code:value.code??null,execution:value.execution??null};
    if(value&&typeof value==='object'){
      if(Array.isArray(value))return value.map(snapshot);
      return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,snapshot(item)]));
    }return value;
  };
  const finish=(value,retain)=>retain?keep(value):snapshot(value);
  const invoke=args=>{
    const target=resolve(args.target),keys=args.method?args.method.split('.'):[];
    let owner=target;for(const key of keys.slice(0,-1))owner=owner[key];
    const fn=keys.length?owner[keys.at(-1)]:target;
    const result=args.construct?Reflect.construct(fn,resolve(args.args??[])):Reflect.apply(fn,keys.length?owner:undefined,resolve(args.args??[]));
    return result&&typeof result.then==='function'?result.then(value=>finish(value,args.keep)):finish(result,args.keep);
  };
  ports={
    ...require('./ports/value.cjs').valuePorts(),...require('./ports/browser-effects.cjs').computationalPorts(),
    'mechanism.reset':()=>{objects.clear();trace.length=0;serial=0;context=null;return true;},
    'diagnostic.context':({value})=>{context=value;return null;},
    'diagnostic.read':()=>context,
    'mechanism.load':({module})=>{
      const builtins={Object,Array,Buffer,Math,Number,String,URL,Symbol,Reflect,Map};
      if(Object.hasOwn(builtins,module))return keep(builtins[module]);
      if(module.startsWith('node:'))return keep(require(module));
      const file=path.resolve(__dirname,module);if(!file.startsWith(__dirname+path.sep)||/test\.(?:cjs|mjs|js)$/.test(file))throw Error('Only bootstrap mechanisms may be loaded');
      return keep(require(file));
    },
    'mechanism.call':invoke,
    'mechanism.import':async({code})=>keep(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))),
    'mechanism.attempt':({operation})=>{try{const result=invoke(operation);return result&&typeof result.then==='function'?result.then(value=>({ok:true,value}),error=>({ok:false,error:snapshot(error)})):{ok:true,value:result};}catch(error){return {ok:false,error:snapshot(error)};}},
    'mechanism.get':({target,key,keep:retain})=>finish(resolve(target)[key],retain),
    'mechanism.set':({target,key,value})=>{resolve(target)[key]=resolve(value);return true;},
    'mechanism.object':({value,merge=[]})=>keep(Object.assign(resolve(value??{}),...merge.map(resolve))),
    'mechanism.copy':({target})=>snapshot(resolve(target)),
    'value.encode-observation':({value})=>JSON.stringify(resolve(value)),
    'mechanism.callback':({query,bindings={},async:asynchronous=false},env)=>{
      const model=env.model;
      if(!Object.hasOwn(model.queries,query))throw Error('Callback must name an admitted Encounter programme');
      return keep((...args)=>{
        trace.push({query,args:args.map(value=>typeof value==='function'?'[function]':snapshot(value))});
        const local={model,...bindings,args:args.map(keep)},kernel=asynchronous?createKernel(ports,20000000):synchronousSeed(createKernel,ports,20000000);
        const result=kernel.run(model.queries[query],local);
        return asynchronous?result.then(()=>resolve(local.result)):resolve(local.result);
      });
    },
    'mechanism.trace':()=>snapshot(trace),
    'mechanism.ports':({groups=['value','computation'],extra={}})=>{
      const noop=()=>{};let result={};
      for(const group of groups){
        if(group==='value')Object.assign(result,require('./ports/value.cjs').valuePorts());
        else if(group==='computation')Object.assign(result,require('./ports/browser-effects.cjs').computationalPorts());
        else if(group==='browser')Object.assign(result,require('./ports/browser.cjs').browserPorts({},noop),require('./ports/browser-effects.cjs').browserEffects({document:{}},noop));
        else if(group==='rel')Object.assign(result,{'value.encode':({value})=>rel.literal(value),'rel.encode':({value})=>rel.encode(value),'rel.decode':({text})=>rel.decode(text),'scalar.quote':({value})=>rel.quote(value),'scalar.unquote':({text})=>rel.atom(text),'rel.facts':({text})=>rel.parse(text),'rel.print':({facts})=>rel.print(facts),'static.read':({text})=>rel.decodeData(text),'encounter.inspect':({text,file})=>require('./encounter-syntax.cjs').parseEncounter(text,file)});
        else throw Error('Unknown mechanical port group');
      }return keep(Object.assign(result,resolve(extra)));
    },
    'file.read':({file})=>fs.readFileSync(path.resolve(root,file),'utf8'),
    'file.bytes':({file})=>[...fs.readFileSync(path.resolve(root,file))],
    'file.digest':({file})=>crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,file))).digest('hex'),
    'file.exists':({file})=>fs.existsSync(path.resolve(root,file)),
    'file.stat':({file})=>{const s=fs.statSync(path.resolve(root,file));return {size:s.size,directory:s.isDirectory()};},
    'file.list':({directory='.',recursive=false,details=false})=>{
      const walk=(dir,prefix)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.name==='.git'?[]:entry.isDirectory()?(recursive?walk(path.join(dir,entry.name),prefix+entry.name+'/'):[]):[details?{file:prefix+entry.name,link:entry.isSymbolicLink()}:prefix+entry.name]);
      return walk(path.resolve(root,directory),'');
    },
    'digest.sha256':({text,bytes})=>crypto.createHash('sha256').update(bytes?Buffer.from(bytes):text).digest('hex'),
    'rel.read':({file})=>rel.parse(fs.readFileSync(path.resolve(root,file),'utf8')),
    'rel.parse':({text})=>rel.parse(text),
    'rel.decode':({text,kind})=>rel.decode(text,kind),
    'rel.encode':({value,kind})=>rel.encode(value,kind),
    'scalar.quote':({value})=>rel.quote(value),
    'process.node':({args})=>{const r=require('node:child_process').spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:64000000,timeout:180000});return {status:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message??null};},
    'process.git':({args})=>{const r=require('node:child_process').spawnSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,maxBuffer:64000000});if(r.status!==0)throw Error(r.stderr.toString());return r.stdout.toString();},
    'environment.get':({name,fallback=null})=>process.env[name]??fallback,
    'markup.observe':({text})=>{
      const convert=n=>({tag:n.tagName||'',attrs:n.attrs||[],text:n.nodeName==='#text'?n.value:'',children:(n.childNodes||[]).map(convert)});
      return convert(require('./vendor/node_modules/parse5/index.js').parse(text));
    },
    'url.observe':({value,base})=>{const u=new URL(value,base);return {href:u.href,pathname:u.pathname,hash:u.hash,search:u.search};},
    'uri.decode':({value})=>decodeURIComponent(value),
  };
  return ports;
}
module.exports={mechanisms};
