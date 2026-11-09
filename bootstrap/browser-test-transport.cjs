'use strict';
// Browser API emulation for executing actual emitted runtime bytes in Node.
// Selectors, nodes, source responses and all expectations come from Encounter.
// This is mechanism integration, not evidence of rendered-browser correctness.
const vm=require('node:vm'),{Worker:NodeWorker}=require('node:worker_threads');
async function execute({code,files,nodes,base='https://publication.invalid/'}){
  const faults=[],requests=[],blobs=new Map(),workers=[];
  class BrowserURL extends URL{
    static createObjectURL(blob){const key='blob:transport-'+blobs.size;blobs.set(key,blob);return key;}
    static revokeObjectURL(){}
  }
  class BrowserWorker{
    constructor(url){
      this.listeners={message:new Map(),error:new Map()};
      const blob=blobs.get(url);if(!blob)throw Error('Unknown worker bytes');
      this.ready=blob.text().then(bytes=>{
        // Browser worker bytes are the real issued regexp mechanism, not tests.
        this.worker=new NodeWorker('const {parentPort}=require("node:worker_threads");globalThis.self={postMessage:value=>parentPort.postMessage(value)};parentPort.on("message",data=>self.onmessage({data}));\n'+bytes,{eval:true});
        for(const [type,listeners]of Object.entries(this.listeners))for(const wrapper of listeners.values())this.worker.on(type,wrapper);
        return this.worker;
      });workers.push(this);
    }
    postMessage(value){this.ready.then(worker=>worker.postMessage(value));}
    addEventListener(type,fn){const wrapper=type==='message'?value=>fn({data:value}):error=>fn({message:error.message});this.listeners[type].set(fn,wrapper);this.worker?.on(type,wrapper);}
    removeEventListener(type,fn){const wrapper=this.listeners[type].get(fn);if(wrapper)this.worker?.off(type,wrapper);this.listeners[type].delete(fn);}
    terminate(){this.ready.then(worker=>worker.terminate());}
  }
  const document={baseURI:base,querySelector:selector=>nodes[selector]??null};
  const context={document,console:{error:error=>faults.push(String(error.message??error)),log:()=>{}},fetch:async url=>{
    const file=new URL(url).pathname.slice(1);requests.push(file);if(!Object.hasOwn(files,file))throw Error('Unavailable source response: '+file);
    const bytes=new TextEncoder().encode(files[file]);return {ok:true,arrayBuffer:async()=>bytes.buffer};
  },URL:BrowserURL,Blob,Worker:BrowserWorker,TextDecoder,TextEncoder,setTimeout,clearTimeout};
  try{await vm.runInNewContext(code,context,{timeout:15000});return {nodes,faults,requests};}
  finally{await Promise.all(workers.map(async worker=>(await worker.ready).terminate()));}
}
module.exports={execute};
