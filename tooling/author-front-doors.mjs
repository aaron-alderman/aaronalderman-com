// Authoring helpers emit REL and process programmes; no browser code is added.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {parseRel}=createRequire(import.meta.url)('../bootstrap/ports/rel-codec.cjs');
const read=f=>JSON.parse(fs.readFileSync(f)),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const L=(...v)=>['list',...v],C=(...v)=>['concat',...v],one=(s,p)=>['one',s,p],E=(tag,attrs={},...children)=>({tag,attrs,children:L(...children)}),el=(tag,cls,...children)=>E(tag,cls?{class:cls}:{},...children);
const facts=[],fact=(s,p,o)=>facts.push([s,p,o]);
for(const [slug,name,symbol,note,light]of [['temple','Temple','⌂','Law, change and the witness.','gold'],['sourcery','Sourcery','✦','Magic that shows its work.','rose'],['claimipedia','Claimipedia','◈','Claims, evidence and honest disagreement.','sage']]){
 const s='microsite.entry.'+slug;for(const [p,o]of Object.entries({isa:'PublishedMicrosite',name,symbol,note,light,href:slug+'/',status:slug==='claimipedia'?'stub':'published'}))fact(s,p,o);
}
fact('page.claimipedia','isa','StandalonePage');fact('page.claimipedia','canonical','https://aaronalderman.com/claimipedia/');
let index=0;
function style(selector,declarations,media){const id='frontdoors.style.'+(++index);fact(id,'isa','StyleRule');fact(id,'projection','main');fact(id,'selector',selector);if(media)fact(id,'context',media);for(const [property,value]of Object.entries(declarations)){const d=id+'.d'+facts.length;fact(id,'declaration',d);fact(d,'property',property);fact(d,'value',value);}}
style('.hero-microsites',{margin:'26px 0 22px','max-width':'680px'});
style('.hero-microsites>.eyebrow',{'font-size':'10px','letter-spacing':'.18em',margin:'0 0 10px',color:'#e4d6bb'});
style('.microsite-menu',{display:'grid','grid-template-columns':'repeat(auto-fit,minmax(145px,1fr))',gap:'10px'});
style('.microsite-link',{'--world-color':'#e6bc79',display:'flex','flex-direction':'column',gap:'7px',padding:'17px 18px',border:'1px solid color-mix(in srgb,var(--world-color) 48%,transparent)','border-radius':'14px',background:'linear-gradient(150deg,color-mix(in srgb,var(--world-color) 13%,#111624),#0c111bd9)',color:'#f4eddf','text-decoration':'none','box-shadow':'0 8px 28px #0003',transition:'border-color .2s ease,background .2s ease'});
style('.microsite-link[data-world="rose"]',{'--world-color':'#eda8b7'});style('.microsite-link[data-world="sage"]',{'--world-color':'#a5d8bf'});
style('.microsite-link:hover,.microsite-link:focus-visible',{'border-color':'var(--world-color)',background:'linear-gradient(150deg,color-mix(in srgb,var(--world-color) 24%,#111624),#111624)'});
style('.microsite-link .world-symbol',{color:'var(--world-color)','font-size':'23px','line-height':'1'});
style('.microsite-link strong',{'font-family':'var(--serif)','font-size':'23px','font-weight':'400'});
style('.microsite-link small',{color:'#d1d1d6','font-size':'12px','line-height':'1.5'});
style('.hero',{padding:'48px 7% 60px'},'(min-width: 1001px)');
style('.hero h1',{'font-size':'clamp(54px,6vw,92px)'},'(min-width: 1001px)');
style('.claimipedia-stub',{position:'relative',overflow:'hidden','text-align':'center',padding:'70px 24px 80px',background:'radial-gradient(ellipse at 50% 38%,#3a315b65,transparent 64%)'});
style('.claimipedia-stub h1',{'font-size':'clamp(48px,8vw,92px)',margin:'16px 0','letter-spacing':'-.04em'});
style('.claimipedia-stub h2',{'font-size':'clamp(27px,4vw,43px)','font-weight':'400',color:'#cde3d6',margin:'0 0 22px'});
style('.claimipedia-stub .stub-copy',{'max-width':'560px',margin:'0 auto 24px','font-size':'18px','line-height':'1.8',color:'#c8c5d3'});
style('.claimipedia-art',{display:'block',width:'min(100%,680px)',height:'auto',margin:'0 auto 22px'});
style('.stub-status',{display:'inline-block',margin:'0 0 12px',padding:'7px 13px',border:'1px solid #a5d8bf5c','border-radius':'100px',color:'#cde3d6','font-size':'12px','letter-spacing':'.08em'});
style('.stub-links',{display:'flex','flex-wrap':'wrap',gap:'22px',justifyContent:'center',margin:'28px 0 0'});
style('.microsite-menu',{'grid-template-columns':'1fr'},'(max-width: 520px)');
style('.microsite-link',{display:'grid','grid-template-columns':'30px 1fr',gap:'3px 10px',padding:'12px 15px'},'(max-width: 520px)');
style('.microsite-link .world-symbol',{'grid-row':'1 / 3','align-self':'center'},'(max-width: 520px)');
style('.microsite-link strong',{'font-size':'21px'},'(max-width: 520px)');
const gradients=['rose','sage','gold'].map((name,i)=>E('linearGradient',{id:'claim-light-'+name,x1:'0%',y1:'0%',x2:'0%',y2:'100%'},E('stop',{offset:'0%','stop-color':['#e9a4ba','#a5d8bf','#e6bc79'][i],'stop-opacity':'.55'}),E('stop',{offset:'100%','stop-color':['#e9a4ba','#a5d8bf','#e6bc79'][i],'stop-opacity':'0'})));
const art=E('svg',{class:'claimipedia-art',viewBox:'0 0 720 330',role:'img','aria-label':'Three lamps cast different colours of light onto one open book.'},E('defs',{},...gradients),...['rose','sage','gold'].map((color,i)=>E('g',{},E('path',{d:`M${180+i*180} 58 L${120+i*125} 278 L${330+i*110} 278 Z`,fill:'url(#claim-light-'+color+')'}),E('path',{d:`M${180+i*180} 0 V38`,stroke:'#a99a86','stroke-width':1}),E('rect',{x:165+i*180,y:38,width:30,height:44,rx:10,fill:'#181b2b',stroke:['#e9a4ba','#a5d8bf','#e6bc79'][i],'stroke-width':1.5}),E('circle',{cx:180+i*180,cy:60,r:7,fill:['#e9a4ba','#a5d8bf','#e6bc79'][i]}))),E('path',{d:'M170 247 Q270 212 360 243 Q450 212 550 247 L536 294 Q446 263 360 288 Q274 263 184 294 Z',fill:'#171d2b',stroke:'#d8c7a0','stroke-width':1.5}),E('path',{d:'M360 243 V288 M205 253 Q276 235 335 253 M211 265 Q280 247 335 265 M385 253 Q444 235 515 253 M385 265 Q440 247 509 265',fill:'none',stroke:'#d8c7a0','stroke-width':1,opacity:'.6'}));
const queries={
 'frontdoors.home':[{let:'result',value:E('nav',{class:'hero-microsites',id:'microsites','aria-label':'Microsites'},el('p','eyebrow','Explore the worlds'),el('div','microsite-menu',['map',['subjects','isa','PublishedMicrosite'],'world',E('a',{class:'microsite-link',href:one('$world','href'),'data-world':one('$world','light')},E('span',{class:'world-symbol','aria-hidden':'true'},one('$world','symbol')),E('strong',{},one('$world','name')),E('small',{},one('$world','note')))]))}],
 'frontdoors.claimipedia':[{call:'claimipedia.build'}]
};
save('algebra/front-doors.process.json',{protocol:'temple/surface-process-module/1',queries});fs.writeFileSync('source/front-doors.rel',facts.map(v=>'('+v.map(JSON.stringify).join(', ')+')').join('\n')+'\n');
const p=read('algebra/publication.process.json'),home=p.queries['publication.home'].find(s=>s.let==='result');
const hero=home.value[1].children.find(v=>v?.attrs?.class==='hero-content');hero.children=hero.children.filter(v=>v?.attrs?.class!=='button gate-primary'&&v!=='$micrositeNav');hero.children.splice(4,0,'$micrositeNav');
const trailButton=hero.children.find(v=>v?.attrs?.href==='#first-trails');trailButton.children=L('Follow an idea ↓');
p.queries['publication.home']=[{call:'frontdoors.home'},{let:'micrositeNav',value:'$result'},home];
const threshold=home.value.find(v=>v?.attrs?.class==='threshold');threshold.children=L(el('p','eyebrow','Inside the corpus'),E('h2',{},'Follow a thread.'),E('p',{},'Questions connect across the worlds. Follow an idea through the research, sources and unfinished work behind it.'),E('a',{href:'gate.html',class:'button'},'Explore the reading paths ↗'),el('p','image-note','An imagined landscape of inquiry. The evidence lives in the source notes.'));
function navLabels(value){if(!value||typeof value!=='object')return;if(value.tag==='a'&&value.attrs?.class==='gate-nav')value.children=L('Reading paths ↗');Object.values(value).forEach(v=>Array.isArray(v)?v.forEach(navLabels):navLabels(v));}navLabels(p.queries['publication.document']);
if(!p.queries['publication.build'].some(s=>s.call==='frontdoors.claimipedia'))p.queries['publication.build'].splice(2,0,{call:'frontdoors.claimipedia'});
const sitemapIndex=p.queries['publication.build'].findIndex(s=>s.port==='file.write'&&s.args.path==='sitemap.xml');if(!p.queries['publication.build'].some(s=>s.let==='sitemap'&&JSON.stringify(s).includes('StandalonePage')))p.queries['publication.build'].splice(sitemapIndex,0,{let:'sitemap',value:['fold',['subjects','isa','StandalonePage'],'page','xml','$sitemap',C('$xml','<url><loc>',one('$page','canonical'),'</loc></url>')]});save('algebra/publication.process.json',p);
for(const file of ['bootstrap/site.json','bootstrap/microsites-preview.json']){const m=read(file);m.modules=[...new Set([...m.modules,'algebra/front-doors.process.json'])];m.sources=[...new Set([...m.sources,'source/front-doors.rel'])];save(file,m);}
const gatewayFile='source/gateway.rel',g=parseRel(fs.readFileSync(gatewayFile,'utf8'),gatewayFile),set=(s,p,o)=>{const f=g.find(f=>f.s===s&&f.p===p);if(f)f.o=o;else g.push({s,p,o});};
set('gateway','title','Follow a thread.');set('gateway','description','Reading paths through Aaron Alderman’s research, sources, stories and open questions.');set('gateway','invitation','Follow an idea through the collected work: its sources, disagreements and unfinished questions. For the project microsites, return to the worlds on the homepage.');
const names={temple:'Executable meaning',sourcery:'Software & agency',claimipedia:'Claims & evidence',worldwright:'Stories & encounters',kingdom:'Faith & responsibility',field:'Open questions',world:'Shared worlds'};for(const [slug,name]of Object.entries(names))set('door.'+slug,'readingName',name);
set('door.temple','href','https://aaron-alderman.github.io/spin23-relational-geometry/edition-3/library/corpus/programmes/programme-algebra/index.html');set('door.temple','label','Read the algebra notes');set('door.temple','secondaryHref','workshop/index.html');set('door.temple','secondaryLabel','Try the working example');
set('door.sourcery','href','https://aaron-alderman.github.io/spin23-relational-geometry/edition-3/library/corpus/programmes/sourcery-platform-replacement/index.html');set('door.sourcery','label','Explore the software research');set('door.worldwright','href','index.html#atlas');set('door.worldwright','label','Explore the story map');
fs.writeFileSync(gatewayFile,g.map(f=>'('+[f.s,f.p,f.o].map(JSON.stringify).join(', ')+')').join('\n')+'\n');
const gateway=read('algebra/gateway.process.json');gateway.queries['gateway.build'].find(s=>s.let==='pageTitle').value='Reading paths — Aaron Alderman';
const view=gateway.queries['gateway.view'][0].value,gateHero=view[1],hall=view[2];gateHero.children[1].children=L('Aaron Alderman / Inside the corpus');gateHero.children[2].children=L('Follow a ',E('em',{},'thread.'));hall.children[1].children[1].children=L('Questions, sources, connections');hall.children[1].children[2].children=L('Choose a reading path.');hall.children[1].children[3].children=L('These paths follow ideas across the corpus. Each offers a research starting point and a smaller encounter to think with.');
const card=hall.children[2].children[3];card.attrs.id=C('path-',one('$door','slug'));card.children.find(v=>v?.tag==='h3').children[1].children=L(one('$door','readingName'));
hall.children[3].children=L('The paths through faith, open questions and shared worlds are editorial invitations; they do not define future microsites.');
const bottom=view[3].children[2].children[2];bottom.attrs.href='index.html#microsites';bottom.children=L('Explore the project microsites →');save('algebra/gateway.process.json',gateway);
