'use strict';
const $=s=>document.querySelector(s);
// Transport only: both hosts invoke the same algebra-owned edit and snapshot entries.
const transport=window.storyLab||{
 async state(){const r=await fetch('/api/state');if(!r.ok)throw Error('The example could not load. Refresh to try again.');return r.json();},
 async edit(request){const r=await fetch('/api/edit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});const d=await r.json();if(!r.ok)throw Error(d.error);return d;}
};
let state,activeTab='source',sourceHighlight=null;
const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const item=(title,text)=>{const d=node('div',undefined,'inspection-item');d.append(node('h3',title),node('pre',text));return d;};
function selectTab(name,focus=false){
 activeTab=name;document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===name;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
 document.querySelectorAll('[role=tabpanel]').forEach(p=>p.hidden=p.id!=='panel-'+name);
 if(focus)$('#tab-'+name).focus();
}
function routeFor(kind){const p=state.panels.find(p=>p.projection.output.type===(kind==='title'?'Page':'WebLink')).projection;return p.edits.find(e=>e.field===(kind==='title'?'P.title':'N.label')).destination;}
function routeText(r){return r.kind==='source'?`source/experiment/story.rel → TheStory / ${r.field}`:`source/experiment/story.encounter:${r.node.line} → WebMainMenu / N.label`}
function renderSource(){
 const pre=$('#source-code');pre.replaceChildren();const key=$('#source-file').value;
 state.sources[key].split(/\r?\n/).forEach((text,i)=>{const n=node('span',text||' ','source-line');if(sourceHighlight?.file===key&&sourceHighlight.line===i+1)n.classList.add('highlight');pre.append(n);});
 if(sourceHighlight?.file===key)pre.querySelector('.highlight')?.scrollIntoView({block:'nearest'});
}
function renderProcess(){$('#process-code').textContent=state.algebra[$('#process-file').value];}
function renderReceipt(){
 const area=$('#receipt');area.replaceChildren();const r=state.receipt;
 if(!r){area.append(node('h3','Nothing has changed yet.'),node('p','Apply either value to see the exact source diff and the checked route back.','panel-note'));return;}
 area.append(node('h3',`Revision ${r.basis} → ${state.revision} · ${r.kind==='title'?'story title':'web label'}`),node('p',routeText(r.destination),'receipt-route'));
 const dl=node('dl');for(const key of ['reason','target','goal'])dl.append(node('dt',key[0].toUpperCase()+key.slice(1)),node('dd',r[key]));area.append(dl);
 const grid=node('div',undefined,'receipt-grid');grid.append(item('story.rel',r.factDiff),item('story.encounter',r.codeDiff));area.append(grid);
 area.append(node('p',`Checked by ec.prepare → ec.run → forward-value equality, then serialized before accepting this session revision. Edit budget used: ${r.usage.steps??JSON.stringify(r.usage)}. No files were written.`,'panel-note'));
}
function renderDiagram(previous){
 const panel=type=>state.panels.find(p=>p.projection.output.type===type);
 const page=panel('Page'),web=panel('WebLink'),row=panel('MainframeRow');
 $('#fact-inline').textContent=state.sources.facts.split(/\r?\n/).find(s=>s.startsWith('("TheStory", "S.Title",'));
 $('#base-label').textContent=web.projection.base['N.label'];$('#row-label').textContent=row.projection.output.values['R.label'];
 $('#page-title').textContent=page.projection.output.values['P.title'];$('#page-route').textContent='P.route → '+page.projection.output.values['P.route'];$('#page-current').textContent=page.projection.output.values['P.title'];
 const contents=$('#content-inline');contents.replaceChildren();for(const s of page.projection.output.values['P.paragraphs'])contents.append(node('p',s));
 const route=routeFor('web-label');$('#overlay-inline').textContent=state.sources.encounter.split(/\r?\n/).slice(route.node.line-2,route.node.line+4).join('\n');
 const pure=$('#inline-pure');pure.replaceChildren();for(const v of state.pure.slice(0,2)){const d=item(v.name,v.expression);d.append(node('p','→ '+String(v.value),'value-chip'));pure.append(d);}
 for(const [id,key]of [['inline-navigation','navigation'],['inline-resolve','resolve'],['inline-serialize','serialize'],['inline-patch','patch']])$('#'+id).textContent=state.algebra[key];
 const open=new Set([...document.querySelectorAll('[data-details-key][open]')].map(d=>d.dataset.detailsKey));
 function output(type){
  const data=panel(type),card=node('article',undefined,'output '+(type==='WebLink'?'web-output':type==='MainframeRow'?'row-output':'page-output'));
  const heading=node('div',undefined,'output-heading'),old=previous?.panels.find(p=>p.projection.output.type===type);
  heading.append(node('strong',({WebLink:'Menu link',MainframeRow:'List row',Page:'Story page'})[type]),node('span',old?(old.html===data.html?'unchanged':'updated'):'generated HTML'));card.append(heading);
  const frame=node('iframe');frame.title=({WebLink:'Menu link',MainframeRow:'List row',Page:'Story page'})[type]+' preview';frame.setAttribute('sandbox','allow-same-origin');if(transport.bindPreview)transport.bindPreview(frame,data,state.panels);frame.srcdoc=data.html;card.append(frame);
  const html=node('details');html.dataset.detailsKey=type+'-html';html.open=open.has(html.dataset.detailsKey);html.append(node('summary','Read the generated HTML'),node('pre',data.html));card.append(html);
  if(type!=='Page'){const process=node('details');process.dataset.detailsKey=type+'-process';process.open=open.has(process.dataset.detailsKey);process.append(node('summary','Follow the representation algebra'),node('pre',state.algebra[type==='WebLink'?'web':'row']));card.append(process);}
  return card;
 }
 $('#diagram-outputs').replaceChildren(output('WebLink'),output('MainframeRow'));$('#diagram-page').replaceChildren(output('Page'));
 $('#diagram-receipt').replaceChildren(...[...$('#receipt').childNodes].map(n=>n.cloneNode(true)));
}
function render(previous){
 $('#revision').textContent=`CHANGES APPLIED: ${state.revision}`;$('#story-title').value=state.title;$('#web-label').value=state.webLabel;
 for(const [id,kind]of [['title-route','title'],['web-route','web-label']])$('#'+id).textContent=(kind==='title'?'Where this title is changed ↗':'Where this menu label is changed ↗');
 renderSource();renderProcess();renderReceipt();
 const pure=$('#pure-values');pure.replaceChildren();for(const v of state.pure){const d=item(v.name,v.expression);d.append(node('p',String(v.value),'value-chip'));pure.append(d);}
 const html=$('#html-values');html.replaceChildren();for(const p of state.panels){const d=item(p.projection.output.type,p.html);for(const e of p.projection.output.events){const description=e.open?`${e.selector} → open @${e.open}`:`${e.selector} → run ${e.run}(story: @${e.arguments.story})`;d.append(node('p',description,'panel-note'));}html.append(d);}
 const hashes=$('#hashes');hashes.replaceChildren();for(const h of state.hashes){const p=node('p',h.file+'\nSHA-256 '+h.hash);if(transport.sourceURL){const a=node('a','Read this source ↗','route-link');a.href=transport.sourceURL(h.file);a.target='_blank';a.rel='noopener';p.append(a);}hashes.append(p);}
 renderDiagram(previous);
}
function busy(on){document.querySelectorAll('form input, form button[type=submit]').forEach(n=>n.disabled=on);document.querySelector('.flow').setAttribute('aria-busy',String(on));}
async function load(){busy(true);try{state=await transport.state();render();$('#status').textContent='Ready. Try changing the story title in step 1.';}catch(e){$('#error').hidden=false;$('#error').textContent=e.message;}finally{busy(false);}}
async function apply(kind,value){
 $('#error').hidden=true;document.querySelectorAll('.form-error').forEach(n=>n.remove());busy(true);$('#status').textContent='Checking your change and updating the previews…';
 try{const data=await transport.edit({kind,value,revision:state.revision});
  const previous=state;state=data;sourceHighlight=null;render(previous);$('#status').textContent=`Change ${state.revision} applied. See what changed in steps 4 and 5.`;
 }catch(e){$('#status').textContent=`The change could not be applied. Your last accepted version is still shown.`;const error=node('p',!value.trim()?'Enter some text for the '+(kind==='title'?'story title.':'menu label.'):e.message,'form-error');error.setAttribute('role','alert');$(kind==='title'?'#title-form':'#web-form').append(error);}
 finally{busy(false);}
}
$('#title-form').addEventListener('submit',e=>{e.preventDefault();apply('title',$('#story-title').value);});
$('#web-form').addEventListener('submit',e=>{e.preventDefault();apply('web-label',$('#web-label').value);});
document.querySelectorAll('[data-tab]').forEach(b=>{b.addEventListener('click',()=>selectTab(b.dataset.tab));b.addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(b);let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();selectTab(tabs[n].dataset.tab,true);}});});
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{if(!state)return;const r=routeFor(b.dataset.route),key=r.kind==='source'?'facts':'encounter';$('#source-file').value=key;sourceHighlight={file:key,line:r.kind==='source'?state.sources.facts.split(/\r?\n/).findIndex(s=>s.startsWith('("TheStory", "'+r.field+'",'))+1:r.node.line};$('#technical').open=true;selectTab('source');renderSource();$('#source-code').scrollIntoView({behavior:'smooth',block:'center'});$('#panel-source').focus({preventScroll:true});}));
document.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>{if(!state)return;$('#technical').open=true;$('#source-file').value=b.dataset.source;sourceHighlight=null;selectTab('source');renderSource();$('#panel-source').focus();}));
$('#source-file').addEventListener('change',()=>{sourceHighlight=null;renderSource();});$('#process-file').addEventListener('change',renderProcess);
load();
