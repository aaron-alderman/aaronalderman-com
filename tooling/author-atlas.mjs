// Authoring notation only. The atlas and its homepage entrance are process plans;
// artwork and presentation declarations are ordinary REL publication sources.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const {parseRel}=createRequire(import.meta.url)('../bootstrap/ports/rel-codec.cjs');
const read=p=>JSON.parse(fs.readFileSync(p)),save=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const L=(...x)=>['list',...x],C=(...x)=>['concat',...x],one=(s,p)=>['one',s,p],E=(tag,attrs={},...children)=>({tag,attrs,children:L(...children)}),el=(tag,cls,...children)=>E(tag,cls?{class:cls}:{},...children),map=(x,a,v)=>['map',x,a,v];
const facts=[],put=(s,p,o)=>facts.push([s,p,String(o)]);
put('page.atlas','isa','StandalonePage');put('page.atlas','canonical','https://aaronalderman.com/atlas.html');
const assets=[];
for(const slug of ['overview','unseen','human','boundary']){const path='assets/atlas/'+slug+'-v1.png',bytes=fs.readFileSync(path);put('asset.atlas.'+slug,'isa','PublicationAsset');put('asset.atlas.'+slug,'path',path);assets.push({slug,path,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
const art=assets[0];put('atlas','image',art.path);put('atlas','imageWidth',art.width);put('atlas','imageHeight',art.height);
for(const [i,slug]of ['unseen','human','boundary'].entries()){put('territory.'+slug,'atlasSlug',slug);put('territory.'+slug,'atlasNumber','0'+(i+1));put('territory.'+slug,'atlasImage','assets/atlas/'+slug+'-v1.png');}
let n=0;function style(selector,declarations,context){const s='atlas.style.'+(++n);put(s,'isa','StyleRule');put(s,'projection','main');put(s,'selector',selector);if(context)put(s,'context',context);for(const [property,value]of Object.entries(declarations)){const d=s+'.'+property;put(s,'declaration',d);put(d,'property',property);put(d,'value',value);}}
const rules={
 '.atlas-page':{background:'radial-gradient(ellipse at 15% 8%,#21334b60,transparent 40%),#0c111b'},
 '.atlas-heading':{'max-width':'1000px',margin:'0 auto',padding:'65px 7% 36px','text-align':'center'},
 '.atlas-heading h1':{'font-size':'clamp(44px,6vw,82px)','letter-spacing':'-.045em',margin:'16px 0 22px','line-height':'1.07'},
 '.atlas-heading .lead':{'max-width':'620px',margin:'auto',color:'#c7cdd6','font-size':'17px','line-height':'1.8'},
 '.atlas-overview':{position:'relative',width:'92%','max-width':'1440px',margin:'0 auto 18px',border:'1px solid #d8b47755','border-radius':'100px 100px 18px 18px',overflow:'hidden',background:'#101d2a','box-shadow':'0 25px 90px #0006'},
 '.atlas-overview>img':{display:'block',width:'100%',height:'auto','aspect-ratio':'2.4','object-fit':'cover'},
 '.atlas-beacons':{position:'absolute',inset:'0'},
 '.atlas-beacon':{position:'absolute',left:'17%',top:'43%',display:'flex','flex-direction':'column',gap:'2px','min-width':'160px',padding:'13px 18px',background:'#101a29ed',border:'1px solid #b5dcf580','border-radius':'8px',color:'#ecf4ff','text-decoration':'none','box-shadow':'0 8px 25px #0008',transition:'transform .35s ease,background .35s ease'},
 '.atlas-beacon::before':{content:'""',position:'absolute',left:'calc(50% - 4px)',top:'-17px',width:'8px',height:'8px',background:'#d7b97a','border-radius':'50%','box-shadow':'0 0 0 5px #d7b97a30,0 0 22px #f5ce8a'},
 '.atlas-beacon[data-light="human"]':{left:'45%',top:'61%','border-color':'#dca5b485'},'.atlas-beacon[data-light="boundary"]':{left:'73%',top:'33%','border-color':'#bea7ec85'},
 '.atlas-beacon span':{'font-family':'var(--serif)','font-size':'20px'},'.atlas-beacon small':{'font-size':'10px',color:'#c1cad8','letter-spacing':'.04em'},
 '.atlas-beacon:hover,.atlas-beacon:focus-visible':{transform:'translateY(-5px)',background:'#202c40'},
 '.atlas-map-note':{width:'86%','max-width':'1100px',margin:'20px auto 45px','text-align':'center',color:'#aeb9c8','font-size':'12px'},
 '.atlas-route-key':{display:'flex','justify-content':'center','flex-wrap':'wrap',gap:'10px 28px','font-size':'11px',color:'#ddc69f',margin:'25px 0 0'},
 '.atlas-territory':{'--territory-light':'#a4cef2',width:'86%','max-width':'1240px',margin:'0 auto 65px','scroll-margin-top':'30px'},
 '.atlas-territory[data-light="human"]':{'--territory-light':'#e6b0bd'},'.atlas-territory[data-light="boundary"]':{'--territory-light':'#c4b5ef'},
 '.atlas-territory-header':{display:'grid','grid-template-columns':'1.2fr 1fr',gap:'38px','align-items':'center','margin-bottom':'24px'},
 '.atlas-territory-header>img':{width:'100%',height:'auto','aspect-ratio':'2','object-fit':'cover','border-radius':'12px',border:'1px solid #ffffff26'},
 '.atlas-territory-header .eyebrow':{color:'var(--territory-light)'},'.atlas-territory-header h2':{'font-size':'clamp(32px,4vw,52px)','letter-spacing':'-.03em',margin:'0 0 13px'},
 '.atlas-territory-question':{'font-size':'18px',color:'#eee2d0',margin:'0 0 12px'},'.atlas-territory-note':{'font-size':'14px',color:'#b9c2d0',margin:'0'},
 '.atlas-places':{display:'grid','grid-template-columns':'repeat(3,minmax(0,1fr))',gap:'12px','list-style':'none',padding:'0',margin:'0'},
 '.atlas-place':{height:'100%',display:'grid','grid-template-columns':'28px 1fr 16px',gap:'12px',padding:'19px 17px',border:'1px solid #ffffff20','border-radius':'8px',background:'linear-gradient(135deg,#ffffff05,#ffffff01)','text-decoration':'none',transition:'border-color .25s ease,background .25s ease,transform .25s ease'},
 '.atlas-place:hover,.atlas-place:focus-visible':{'border-color':'var(--territory-light)',background:'#ffffff08',transform:'translateY(-2px)'},
 '.atlas-place-number':{'font-family':'monospace','font-size':'11px',color:'var(--territory-light)','padding-top':'4px'},
 '.atlas-place strong':{display:'block','font-family':'var(--serif)','font-size':'21px','font-weight':'400','line-height':'1.25',color:'#efe6d8','margin-bottom':'8px'},
 '.atlas-place small':{display:'block','font-size':'12px','line-height':'1.65',color:'#b9c3d2'},'.atlas-place-arrow':{color:'var(--territory-light)','font-size':'15px'},
 '.atlas-closing':{width:'86%','max-width':'850px',margin:'0 auto',padding:'0 0 70px','text-align':'center'},'.atlas-closing h2':{'font-size':'clamp(28px,4vw,42px)'},'.atlas-closing p':{color:'#b9c3d2','font-size':'15px'},
 '.atlas-portal':{display:'grid','grid-template-columns':'1fr 1fr',gap:'42px','align-items':'center'},'.atlas-portal img':{display:'block',width:'100%',height:'auto','aspect-ratio':'2','object-fit':'cover','border-radius':'80px 12px 12px 12px',border:'1px solid #d8b47755'},
 '.atlas-portal h2':{'font-size':'clamp(32px,4vw,52px)','letter-spacing':'-.025em'},'.atlas-portal p:not(.eyebrow)':{color:'#b9c3d2','max-width':'520px'},
 '.atlas-overview:target':{outline:'2px solid #d8b477'},
};for(const [s,d]of Object.entries(rules))style(s,d);
style('.atlas-territory-header,.atlas-portal',{'grid-template-columns':'1fr',gap:'24px'},'(max-width: 760px)');
style('.atlas-places',{'grid-template-columns':'repeat(2,minmax(0,1fr))'},'(max-width: 900px)');
style('.atlas-places',{'grid-template-columns':'1fr'},'(max-width: 540px)');
style('.atlas-overview',{'border-radius':'32px 32px 12px 12px'},'(max-width: 760px)');
style('.atlas-beacons',{position:'static',display:'grid','grid-template-columns':'repeat(3,minmax(0,1fr))',gap:'8px',padding:'14px'},'(max-width: 760px)');
style('.atlas-beacon,.atlas-beacon[data-light="human"],.atlas-beacon[data-light="boundary"]',{position:'static','min-width':'0',padding:'10px 8px'},'(max-width: 760px)');
style('.atlas-beacon span',{'font-size':'16px'},'(max-width: 760px)');style('.atlas-beacon::before',{display:'none'},'(max-width: 760px)');
style('.atlas-heading',{padding:'42px 7% 28px'},'(max-width: 540px)');
style('.atlas-beacon,.atlas-place',{transition:'none',transform:'none !important'},'(prefers-reduced-motion: reduce)');
const overviewImage=E('img',{src:one('atlas','image'),alt:'An imagined island links a blue observatory range, a rose woodland and violet highlands with golden trails.',width:art.width,height:art.height,fetchpriority:'high',decoding:'async'});
const beacons=map(['subjects','isa','Territory'],'t',E('a',{class:'atlas-beacon',href:C('#',one('$t','atlasSlug')),'data-light':one('$t','light')},E('span',{},one('$t','name')),E('small',{},C(['count',['objects','$t','place']],' places · Explore ↗'))));
const territories=map(['subjects','isa','Territory'],'t',E('section',{class:'atlas-territory',id:one('$t','atlasSlug'),'data-light':one('$t','light'),'aria-labelledby':C('title-',one('$t','atlasSlug'))},
 el('div','atlas-territory-header',E('img',{src:one('$t','atlasImage'),alt:'',loading:'lazy',decoding:'async',width:1600,height:800}),el('div',null,el('p','eyebrow',C('Territory ',one('$t','atlasNumber'),' / ',['count',['objects','$t','place']],' places')),E('h2',{id:C('title-',one('$t','atlasSlug'))},one('$t','name')),el('p','atlas-territory-question',one('$t','question')),el('p','atlas-territory-note',one('$t','note')))),
 E('ul',{class:'atlas-places'},map(['objects','$t','place'],'p',E('li',{},E('a',{class:'atlas-place',href:C('places/',one('$p','slug'),'.html')},E('span',{class:'atlas-place-number','aria-hidden':'true'},one('$p','chapter')),E('span',{},E('strong',{},['or',['optional','$p','atlasLabel'],one('$p','region')]),E('small',{},one('$p','title'))),E('span',{class:'atlas-place-arrow','aria-hidden':'true'},'↗')))))));
const body=L(E('section',{class:'atlas-heading'},el('p','eyebrow','Aaron Alderman / An atlas of ideas'),E('h1',{},'The world keeps opening.'),el('p','lead','Forty places. Three territories. More than one way through. Start with a question, follow a connection, and return with a different view.')),
 E('nav',{'aria-label':'Choose a territory',class:'atlas-overview',id:'map'},overviewImage,el('div','atlas-beacons',beacons)),
 el('div','atlas-map-note',E('p',{},'An imagined geography for real questions. The landscape is an illustration; the routes organise themes, not physical locations or scientific equivalences.'),el('div','atlas-route-key',E('span',{},'01 / Choose a territory'),E('span',{},'02 / Follow a question'),E('span',{},'03 / Leave room to return'))),
 territories,E('section',{class:'atlas-closing'},el('p','eyebrow','Your route is your own'),E('h2',{},'A map offers possibilities.'),E('p',{},'Some connections became useful. Some broke. Both remain part of this world. There is no required order, and no need to reach every place.'),E('a',{href:'gate.html',class:'button'},'Explore the research reading paths ↗')));
const imageURL=C(one('site','origin'),one('atlas','image'));
const doc=E('html',{lang:'en'},E('head',{},E('meta',{charset:'utf-8'}),E('meta',{name:'viewport',content:'width=device-width, initial-scale=1'}),E('title',{},'The atlas — Aaron Alderman'),E('meta',{name:'description',content:'An illustrated atlas of forty places across science, human experience and responsible power. Find your own way through Aaron Alderman’s world.'}),E('link',{rel:'canonical',href:'https://aaronalderman.com/atlas.html'}),E('link',{rel:'stylesheet',href:'expedition.css?v=atlas-1'}),E('link',{rel:'icon',href:'assets/personal-mark.svg',type:'image/svg+xml'}),...Object.entries({'og:type':'website','og:title':'The world keeps opening — Aaron Alderman’s atlas','og:description':'Forty places. Three territories. More than one way through.','og:url':'https://aaronalderman.com/atlas.html','og:image':imageURL,'og:image:width':one('atlas','imageWidth'),'og:image:height':one('atlas','imageHeight'),'og:image:alt':'A painted island connects an observatory range, a woodland of lanterns and violet highlands through golden trails.','twitter:card':'summary_large_image','twitter:title':'The world keeps opening — Aaron Alderman’s atlas','twitter:description':'Forty places. Three territories. More than one way through.','twitter:image':imageURL}).map(([key,content])=>E('meta',{[key.startsWith('og:')?'property':'name']:key,content}))),E('body',{class:'atlas-page'},E('a',{class:'skip',href:'#main'},'Skip to the atlas'),E('header',{class:'masthead'},E('a',{class:'brand',href:'index.html'},'Aaron Alderman'),E('nav',{'aria-label':'Atlas navigation'},E('a',{href:'index.html#microsites'},'The worlds'),E('a',{href:'#map'},'The map'),E('a',{href:'gate.html'},'Reading paths ↗'))),E('main',{id:'main'},body),E('footer',{},E('div',{class:'section'},E('a',{href:'index.html'},'← Return to Aaron Alderman'),E('p',{},'An illustrated entrance to the work. Sources and limits stay with each question.')))));
save('algebra/atlas.process.json',{protocol:'temple/surface-process-module/1',queries:{'atlas.build':[{let:'input',value:doc},{call:'html.serialize'},{port:'file.write',args:{path:'atlas.html',text:C('<!doctype html>\n','$result')},into:'_'}]}});
fs.writeFileSync('source/atlas.rel',facts.map(row=>'('+row.map(JSON.stringify).join(', ')+')').join('\n')+'\n');
const publication=read('algebra/publication.process.json'),home=publication.queries['publication.home'].find(s=>s.let==='result');
const portal=E('section',{class:'section atlas-portal',id:'atlas'},E('a',{href:'atlas.html','aria-label':'Explore the illustrated atlas'},E('img',{src:one('atlas','image'),alt:'An illustrated island with three territories and branching golden trails.',loading:'lazy',width:art.width,height:art.height})),el('div',null,el('p','eyebrow','The atlas / Forty places to explore'),E('h2',{},'The world keeps opening.'),E('p',{},'Leave the front door behind. Follow a question through the unseen, the human and the boundary—three territories with many possible paths.'),E('a',{class:'button',href:'atlas.html'},'Explore the atlas ↗')));
const old=home.value.findIndex(n=>n?.attrs?.id==='atlas');if(old<0)throw Error('Missing atlas homepage entrance');home.value[old]=portal;
function routes(v){if(typeof v==='string')return v.replaceAll('../index.html#atlas','../atlas.html').replaceAll('index.html#atlas','atlas.html');if(Array.isArray(v))return v.map(routes);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,routes(x)]));return v;}
const routed=routes(publication);if(!routed.queries['publication.build'].some(s=>s.call==='atlas.build'))routed.queries['publication.build'].splice(4,0,{call:'atlas.build'});save('algebra/publication.process.json',routed);
for(const file of ['bootstrap/site.json','bootstrap/microsites-preview.json']){const m=read(file);m.modules=[...new Set([...m.modules,'algebra/atlas.process.json'])];m.sources=[...new Set([...m.sources,'source/atlas.rel'])];save(file,m);}
const rel='source/expedition.rel';fs.writeFileSync(rel,fs.readFileSync(rel,'utf8').replace(/"stylesheetVersion", "[^"]+"/,'"stylesheetVersion", "atlas-1"'));
const gfile='source/gateway.rel',g=fs.readFileSync(gfile,'utf8').replace('"index.html#atlas"','"atlas.html"');fs.writeFileSync(gfile,g);
save('source/atlas-art.json',{protocol:'worldwright/atlas-art/1',owners:{page:'algebra/atlas.process.json',facts:'source/atlas.rel',homepage:'algebra/publication.process.json'},artwork:'Original generated PNG illustrations. Imagined narrative geography, not real geography or a scientific map.',navigation:'All forty place names, questions and links remain semantic HTML. Illustrated territory markers lead to native section anchors. The old homepage #atlas fragment remains a portal.',images:assets});
