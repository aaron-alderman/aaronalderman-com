// Verification-only parser; excluded from both build and browser closures.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse,parseFragment} from 'parse5';
const output=process.argv[2]??'dist',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const declared=JSON.parse(fs.readFileSync('source/microsites/presentation-correspondence.json'));
const pages=[];
for(const site of ['temple','sourcery'])for(const file of ['index.html','films/index.html']){
 const source=`source/microsites/${site}/oracle/${file}`,target=`${site}/${file}`;
 const original=fs.readFileSync(source),generated=fs.readFileSync(path.join(output,target));
 let originalFavicon;
 function normalize(node,reference){
  if(node.tagName==='script')return null;
  const attrs=Object.fromEntries((node.attrs??[]).map(a=>[(a.prefix?a.prefix+':':'')+a.name,a.value]));
  if(node.tagName==='link'&&attrs.rel==='canonical')return null;
  if(node.tagName==='meta'&&/^(og:|twitter:)/.test(attrs.property??attrs.name??''))return null;
  if(node.tagName==='link'&&attrs.rel==='icon'){
   if(reference)originalFavicon=decodeURIComponent(attrs.href.slice(attrs.href.indexOf(',')+1));
   else assert.equal(fs.readFileSync(path.resolve(output,path.dirname(target),attrs.href),'utf8'),originalFavicon);
   attrs.href='same-source-favicon';
  }
  const children=[];
  for(const child of node.childNodes??[]){const value=normalize(child,reference);if(!value)continue;if(value.node==='#text'&&children.at(-1)?.node==='#text')children.at(-1).text+=value.text;else children.push(value);}
  return {node:node.nodeName,...(node.value!==undefined?{text:node.value}:{}),...(node.data!==undefined?{comment:node.data}:{}),...(node.tagName?{namespace:node.namespaceURI,attributes:attrs}:{}),...(children.length?{children}:{})};
 }
 const reference=parse(original.toString(),{sourceCodeLocationInfo:true});
 const edits=JSON.parse(fs.readFileSync('source/microsites/editorial-successor.json')).patches.filter(p=>p.page===target);
 const targets=new Map();function collect(n){if(n.tagName&&n.sourceCodeLocation)targets.set(n.sourceCodeLocation.startOffset,n);(n.childNodes??[]).forEach(collect);}collect(reference);
 const text=n=>n.value??(n.childNodes??[]).map(text).join('');
 for(const edit of edits){const node=targets.get(edit.sourceStart);assert.ok(node);assert.equal(text(node).replace(/\s+/g,' ').trim(),edit.beforeText);}
 for(const edit of edits){const node=targets.get(edit.sourceStart);if(edit.html!==undefined)node.childNodes=parseFragment(edit.html).childNodes;if(edit.appendHtml)node.childNodes.push(...parseFragment(edit.appendHtml).childNodes);for(const [name,value]of Object.entries(edit.attributes??{})){const a=node.attrs.find(a=>a.name===name);if(a)a.value=value;else node.attrs.push({name,value});}}

 let document=generated.toString();
 const additions=declared.pages.find(page=>page.path===target)?.navigationAddition;
 assert.ok(additions,target+' has declared navigation provenance');
 for(const insertion of [additions.headInsertion,additions.bodyInsertion]) {
  assert.equal(document.split(insertion).length,2,target+' has exactly one declared insertion');
  document=document.replace(insertion,'');
 }
 assert.equal(hash(document),additions.priorOutputSha256,target+' preserves the declared predecessor');
 const expected=normalize(reference,true),actual=normalize(parse(document),false);
 assert.deepEqual(actual,expected,target+' preserves the complete original parsed document after the declared script/favicon/metadata deployment substitutions');
 pages.push({path:target,source,sourceSha256:hash(original),outputSha256:hash(generated),normalizedDOMSha256:hash(JSON.stringify(expected))});
}
const sheets=[];
for(const [site,file]of [['temple','assets/covenant.css'],['sourcery','assets/css/story.css']]){
 const source=`source/microsites/${site}/oracle/${file}`,target=`${site}/${file}`,a=fs.readFileSync(source),b=fs.readFileSync(path.join(output,target));assert.deepEqual(b,a);sheets.push({path:target,source,sha256:hash(a)});
}
const receipt={protocol:'worldwright/microsite-presentation-correspondence/1',parser:'parse5@7.3.0',editorialSuccessorSha256:hash(fs.readFileSync('source/microsites/editorial-successor.json')),scope:'Every document node, attribute, text, comment and namespace after the explicit author-requested editorial successor; original scripts replaced by admitted process runtime, favicon URI externalized without changing its bytes, canonical/social metadata added for the new host. Both complete stylesheets byte-identical.',pages,sheets};
console.log(JSON.stringify(receipt,null,2));
