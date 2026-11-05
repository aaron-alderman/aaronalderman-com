const worker=new Worker(new URL('./session-worker.js',import.meta.url),{type:'module'});
const pending=new Map();let serial=0;
const fail=message=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error(message));}pending.clear();};
worker.onerror=()=>fail('The local example could not start. Reload to try again.');
worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;pending.delete(data.id);clearTimeout(p.timer);data.error?p.reject(Error(data.error)):p.resolve(data.value);};
function rpc(method,request){return new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error('The example did not finish. Reload before making another change.'));},30000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,method,request});});}
function bindPreview(frame,data,panels){
 // Native presentation boundary for a checked, declared page-open descriptor.
 frame.addEventListener('load',()=>frame.contentDocument.addEventListener('click',event=>{
  const open=data.projection.output.events.find(e=>e.open&&event.target.closest(e.selector));
  if(!open)return;
  event.preventDefault();const page=panels.find(p=>p.projection.view===open.open);
  if(!page)throw Error('LAB-OPEN: This declared page has no current projection. Reopen the example.');
  frame.srcdoc=page.html;
 }));
}
window.storyLab={state:()=>rpc('state'),edit:request=>rpc('edit',request),bindPreview,sourceURL:file=>'./sources/'+file};
await import('./app.js');
