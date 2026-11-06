import fs from 'node:fs';
import {createRequire} from 'node:module';
import {parseFragment} from '../.build/authoring-deps/node_modules/parse5/dist/index.js';
const {parseRel}=createRequire(import.meta.url)('../bootstrap/ports/rel-codec.cjs');
const file='source/microsites/presentation.rel',facts=parseRel(fs.readFileSync(file,'utf8'),file),editorialFile='source/microsites/editorial-successor.json',editorial=JSON.parse(fs.readFileSync(editorialFile));
let next=0;
function description(id){return facts.find(f=>f.s===id&&f.p==='description');}
function grammar(node,page){const id='ms.ecosystem.claimipedia.'+page+'.'+(++next);const record=node.nodeName==='#text'?{kind:'text',text:node.value}:{kind:'element',tag:node.tagName,attributes:node.attrs.map(({name,value})=>({name,value})),children:(node.childNodes??[]).map(n=>grammar(n,page))};facts.push({s:id,p:'description',o:JSON.stringify(record)});return id;}
for(const patch of editorial.patches.filter(p=>p.appendHtml)){
 if(patch.appendHtml.includes('>Claimipedia</a>'))continue;
 const prefix=patch.page.includes('/films/')?'../../':'../';
 patch.appendHtml=patch.appendHtml.replace('>Sourcery</a> · ','>Sourcery</a> · <a href="'+prefix+'claimipedia/">Claimipedia</a> · ');
 const footerFact=description(patch.subject),footer=JSON.parse(footerFact.o);
 const i=footer.children.findIndex(id=>{const n=JSON.parse(description(id).o);return n.attributes?.some(a=>a.name==='class'&&a.value.includes('ecosystem-links'));});
 if(i<0)throw Error('Missing ecosystem navigation');
 footer.children[i]=grammar(parseFragment(patch.appendHtml).childNodes[0],patch.page);footerFact.o=JSON.stringify(footer);
}
editorial.homepageSuccessor='Project microsites now live on the homepage; the corpus gate contains reading paths. Claimipedia has a published stub and is included in all microsite ecosystem footers.';
fs.writeFileSync(file,facts.map(f=>'('+[f.s,f.p,f.o].map(JSON.stringify).join(', ')+')').join('\n')+'\n');
fs.writeFileSync(editorialFile,JSON.stringify(editorial,null,2)+'\n');
