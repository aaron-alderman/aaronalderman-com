// Explicit editorial successor to the captured originals. Application rendering
// still belongs to REL/process algebra; this script only authors source data.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {parse,parseFragment} from '../.build/authoring-deps/node_modules/parse5/dist/index.js';
if(fs.existsSync('source/microsites/editorial-successor.json')){console.log('The editorial successor is already applied. Author a separate successor for further changes.');process.exit(0);}
const {parseRel}=createRequire(import.meta.url)('../bootstrap/ports/rel-codec.cjs');
const file='source/microsites/presentation.rel',facts=parseRel(fs.readFileSync(file,'utf8'),file),coordinates=JSON.parse(fs.readFileSync('source/microsites/source-coordinates.json')).nodes;
const starts=new Map(coordinates.filter(v=>v[1]==='sourceStart').map(([id,,n])=>[id,Number(n)]));
const patches=[],text=n=>n.value??(n.childNodes??[]).map(text).join(''),tidy=s=>s.replace(/\s+/g,' ').trim();
const trees=new Map();
function tree(page){if(!trees.has(page)){const [site,...parts]=page.split('/');trees.set(page,parse(fs.readFileSync(`source/microsites/${site}/oracle/${parts.join('/')}`,'utf8'),{sourceCodeLocationInfo:true}));}return trees.get(page);}
function select(page,tag,match){const found=[];function walk(n){if(n.tagName===tag&&match(n))found.push(n);(n.childNodes??[]).forEach(walk);}walk(tree(page));if(found.length!==1)throw Error(`${page} ${tag}: expected one target, got ${found.length}`);return found[0];}
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
function edit(page,tag,match,changes){const node=select(page,tag,match);patches.push({page,sourceStart:node.sourceCodeLocation.startOffset,beforeText:tidy(text(node)),...changes});}
const copy=(page,tag,startsWith,html)=>edit(page,tag,n=>tidy(text(n)).startsWith(startsWith),{html});
const main='temple/index.html',film='temple/films/index.html';
for(const page of [main,film]){
 copy(page,'span','Sourcery','Temple');
 edit(page,'a',n=>attr(n,'class')==='wordmark',{attributes:{'aria-label':page===main?'Temple, back to the top':'Temple, back to The Covenant'}});
}
copy(main,'title','The Covenant','The Covenant · Temple');copy(film,'title','The Film','The Film · Temple');
edit(main,'p',n=>tidy(text(n))==='Sourcery · Temple',{html:'Temple · the foundation'});
copy(main,'p','Claimipedia · the library','Claimipedia · the library');
copy(main,'p','AI contributions arrive as proposals.','Claimipedia’s design treats AI contributions as proposals for human review.');
copy(main,'li','Temple3 is a v0.1 laboratory.','<b>This gate is an educational miniature.</b> Its witnesses belong to this page; they do not certify a production platform or independently audit Temple.');
copy(main,'li','101 of 101 checks','<b>The original laboratory reported qualification checks.</b> Those results describe that prototype, rather than the current state of every Temple implementation.');
copy(main,'li','Three implementations','<b>The original laboratory compared three implementations</b> — JavaScript, Python and Rust. Shared design lineage means correlated mistakes remain possible.');
copy(main,'li','486 hostile cases','<b>Adversarial cases</b> were used to compare implementations and expose differences in how they judged the same proposals.');
copy(main,'li','Two Temples','<b>An original two-Temple demonstration</b> explored federation and recovery. It was a laboratory exercise, not a production networking or security system.');
copy(main,'li','Today, Sourcery','<b>This published edition</b> runs the miniature through process algebra. The wider corpus holds the design notes and implementation history.');
copy(main,'td','Enforced in Claimipedia today.','An explicit human-review boundary in Claimipedia’s documented design.');
copy(main,'td','A draft public-good charter; not yet adopted.','A draft public-good charter in the source material; this page does not establish its adoption.');
copy(main,'p','No cameras and no stock footage:','No cameras and no stock footage: a sky computed pixel by pixel, lights that leave trails, the commandments set in type, and a drone synthesised from sine waves. This edition retains the original procedural film and verifies the published files against their captured hashes.');
copy(main,'h2','The Ark is unsealed. Watch it being sealed.','Explore the foundation. Follow the evidence.');
copy(main,'p','The commandments are candidates. They will be tested,','Read the candidate commandments, explore the working miniature, and follow the research in the wider corpus.');
copy(main,'button','Follow the Ark','Where to go next');
copy(main,'p','Thank you. Claimipedia opens soon','Continue through the <a href="../gate.html">corpus gate</a>, or explore <a href="../sourcery/">Sourcery’s story</a>. This page does not collect contact details.');
copy(film,'p','A trailer rendered entirely from code:','A trailer rendered entirely from code: a sky computed pixel by pixel, lights that leave trails, the commandments set in type, and a drone synthesised from sine waves and noise. This edition preserves the original film, its captions and its recorded provenance.');
copy(film,'span','The Covenant · 41 seconds · 1280','The Covenant · 41 seconds · 1280×720 · retained from the original procedural film.');
copy(film,'p','The film is a separate pipeline beside the site.','The original film was made with a separate rendering pipeline. A choreography file set the scenes, lights, sparks and chimes; Python, ffmpeg and headless Chrome produced the picture and sound. This edition retains the rendered files and their manifest.');
copy(film,'p','Every file below carries the hash','The manifest records the original files and the source hash reported by their rendering pipeline. This edition checks the retained file bytes against the captured hashes. It does not rerun or independently verify that original rendering pipeline.');
copy(film,'p','A speculative design. The film was rendered','A speculative design, retained from the original procedural film. The published media are checked against their captured file hashes.');
copy('sourcery/films/index.html','p','The pipeline hashes its own sources','The original pipeline recorded hashes for its sources and rendered files. This edition preserves the film and checks its published bytes against the captured file hashes; it does not rerun the original rendering pipeline.');
for(const page of [main,film,'sourcery/index.html','sourcery/films/index.html']){
 const depth=page.includes('/films/')?'../../':'../',temple=page.startsWith('temple/')?(page.includes('/films/')?'../':'./'):depth+'temple/',sourcery=page.startsWith('sourcery/')?(page.includes('/films/')?'../':'./'):depth+'sourcery/';
 edit(page,'footer',()=>true,{appendHtml:`<p class="fine ecosystem-links"><a href="${depth}gate.html">Corpus gate</a> · <a href="${temple}">Temple</a> · <a href="${sourcery}">Sourcery</a> · <a href="${depth}">Aaron Alderman</a></p>`});
}
let next=0;
function grammar(node,page){const id=`ms.editorial.${page}.${++next}`;const record=node.nodeName==='#text'?{kind:'text',text:node.value}:{kind:'element',tag:node.tagName,attributes:node.attrs.map(({name,value})=>({name,value})),children:(node.childNodes??[]).map(n=>grammar(n,page))};facts.push({s:id,p:'description',o:JSON.stringify(record),pol:'is'});return id;}
for(const patch of patches){const prefix='ms.'+patch.page.split('/')[0]+'.'+patch.page.split('/').slice(1).join('/');const fact=facts.find(f=>f.p==='description'&&f.s.startsWith(prefix+'.n')&&starts.get(f.s)===patch.sourceStart);if(!fact)throw Error('Missing source coordinate for '+JSON.stringify(patch));const record=JSON.parse(fact.o);if(patch.html!==undefined)record.children=parseFragment(patch.html).childNodes.map(n=>grammar(n,patch.page));if(patch.appendHtml)record.children.push(...parseFragment(patch.appendHtml).childNodes.map(n=>grammar(n,patch.page)));for(const [name,value]of Object.entries(patch.attributes??{})){record.attributes??=[];const a=record.attributes.find(a=>a.name===name);if(a)a.value=value;else record.attributes.push({name,value});}fact.o=JSON.stringify(record);patch.subject=fact.s;}
for(const fact of facts)if(fact.s.startsWith('ms.temple.')&&['og:title','twitter:title'].includes(fact.p))fact.o=fact.o.replace('Sourcery','Temple');
fs.writeFileSync(file,facts.map(f=>'('+[f.s,f.p,f.o].map(JSON.stringify).join(', ')+')').join('\n')+'\n');
fs.writeFileSync('source/microsites/editorial-successor.json',JSON.stringify({protocol:'worldwright/microsite-editorial-successor/1',reason:'Author-requested Temple identity, accurate edition prose and self-contained ecosystem navigation. Captured originals remain unchanged.',patches},null,2)+'\n');
console.log(JSON.stringify({editorialChanges:patches.length}));
