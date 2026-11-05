import {createSession} from './engine.js';
const ready=fetch('./fixture.json').then(r=>{if(!r.ok)throw Error('The pinned fixture could not load. Reload to try again.');return r.json();}).then(createSession);
ready.catch(()=>{});
self.onmessage=async({data})=>{
 try{const session=await ready;if(!['state','edit'].includes(data.method))throw Error('Unknown session operation.');const value=await session[data.method](data.request);self.postMessage({id:data.id,value});}
 catch(error){self.postMessage({id:data.id,error:error.message});}
};
