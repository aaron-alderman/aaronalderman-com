// Verification-only parser; excluded from both build and browser closures.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse} from '../.build/authoring-deps/node_modules/parse5/dist/index.js';
const output=process.argv[2]??'microsite-preview',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
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
 const expected=normalize(parse(original.toString()),true),actual=normalize(parse(generated.toString()),false);
 assert.deepEqual(actual,expected,target+' preserves the complete original parsed document after the declared script/favicon/metadata deployment substitutions');
 pages.push({path:target,source,sourceSha256:hash(original),outputSha256:hash(generated),normalizedDOMSha256:hash(JSON.stringify(expected))});
}
const sheets=[];
for(const [site,file]of [['temple','assets/covenant.css'],['sourcery','assets/css/story.css']]){
 const source=`source/microsites/${site}/oracle/${file}`,target=`${site}/${file}`,a=fs.readFileSync(source),b=fs.readFileSync(path.join(output,target));assert.deepEqual(b,a);sheets.push({path:target,source,sha256:hash(a)});
}
const receipt={protocol:'worldwright/microsite-presentation-correspondence/1',parser:'parse5@7.3.0',scope:'Every document node, attribute, text, comment and namespace; original scripts replaced by admitted process runtime, favicon URI externalized without changing its bytes, canonical/social metadata added for the new host. Both complete stylesheets byte-identical.',pages,sheets};
fs.writeFileSync('source/microsites/presentation-correspondence.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({pages:pages.length,byteIdenticalStylesheets:sheets.length}));
