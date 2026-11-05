import {invoke} from './temple-native.js';
import {fmt,listing,diff} from './listing.js';

// Browser-session retention and presentation only. Source mutation is exclusively ec.patch.
export async function createSession(bundle){
 const {model,original,hashes}=bundle;
 const {valuePorts}=await import('./temple-native.js');
 const ports=valuePorts();
 const call=(entry,eventInput,extra={})=>invoke({model,entry,input:{eventInput,...extra},ports,nested:['kernel.invoke','kernel.execute','kernel.evaluate']});
 await call('admit.model',{}, {target:model,profile:original.inputs.profile});
 let candidate=original,revision=0,receipt=null,tail=Promise.resolve();
 const displayRuntime=bundle.runtimeListings;
 async function snapshot(c=candidate,v=revision,r=receipt){
  const measured=await call('lab.snapshot',{candidate:c});
  const panels=measured.value.rendered,web=panels.find(p=>p.projection.output.type==='WebLink'),page=panels.find(p=>p.projection.output.type==='Page');
  return {revision:v,title:page.projection.output.values['P.title'],webLabel:web.projection.output.values['W.text'],panels,
   sources:{facts:c.inputs.factText,encounter:c.inputs.codeText,contracts:c.inputs.contractText},
   algebra:{navigation:listing(c.model.queries['code.story.view.experiment.nav.story']),web:listing(c.model.queries['code.story.representation.WebLink']),row:listing(c.model.queries['code.story.representation.MainframeRow']),...displayRuntime},
   pure:[...Object.entries(c.model.queries['code.story.view.experiment.nav.story'].find(s=>s.let==='ecViewValues').value).map(([name,value])=>({name,expression:fmt(value),value:web.projection.base[name]})),{name:'Unique edit-route selection · lowered',expression:fmt(model.queries['ec.patch'].find(s=>s.let==='ecRoutes').value),value:'ec.patch requires exactly one matching declared route.'}],receipt:r,usage:measured.usage,hashes};
 }
 let current=await snapshot();
 async function apply(request){
  if(!Number.isSafeInteger(request.revision)||request.revision!==revision)throw Error('LAB-STALE: This view is out of date. Reload the current state before editing.');
  const measured=await call('lab.edit',{candidate,kind:request.kind,value:request.value}),result=measured.value;
  const nextReceipt={kind:request.kind,value:request.value,basis:revision,destination:result.destination,
   factDiff:diff(candidate.inputs.factText,result.candidate.inputs.factText),codeDiff:diff(candidate.inputs.codeText,result.candidate.inputs.codeText),
   reason:'Change one visible value at its declared semantic owner.',target:request.kind==='title'?'TheStory / S.Title':'experiment.nav.story / experiment.WebMainMenu / N.label',goal:'Reproduce the requested value through the existing checked projection.',usage:measured.usage};
  const next=await snapshot(result.candidate,revision+1,nextReceipt);
  candidate=result.candidate;revision++;receipt=nextReceipt;current=next;return current;
 }
 return {state:()=>current,edit:request=>{const action=tail.then(()=>apply(request));tail=action.catch(()=>{});return action;}};
}
