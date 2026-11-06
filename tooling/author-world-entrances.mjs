// Authoring only: illustrations, cards and the placeholder become process/REL.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {parseRel}=createRequire(import.meta.url)('../bootstrap/ports/rel-codec.cjs');
const read=f=>JSON.parse(fs.readFileSync(f)),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const L=(...x)=>['list',...x],C=(...x)=>['concat',...x],one=(s,p)=>['one',s,p],E=(tag,attrs={},...children)=>({tag,attrs,children:L(...children)}),el=(tag,cls,...children)=>E(tag,cls?{class:cls}:{},...children);
const icon=(slug,prefix='')=>E('img',{src:prefix+'assets/world-emblems/'+slug+'-v1.png',class:'world-emblem',width:128,height:128,alt:'',decoding:'async','aria-hidden':'true'});
let facts=parseRel(fs.readFileSync('source/front-doors.rel','utf8'),'front-doors');
const add=(s,p,o)=>{const f=facts.find(f=>f.s===s&&f.p===p);if(f)f.o=o;else facts.push({s,p,o,pol:'is'});};
const worlds=[
 ['temple','Temple','gold','A foundation for accountable change.','An execution kernel for systems governed by explicit rules. Proposed changes are checked against rules and authority, with a record of acceptance or refusal.','Illustrated by a lamp, a gate and a checkable history.','Engineering & philosophy'],
 ['sourcery','Sourcery','rose','Software that shows its work.','An approach to creating software from explicit meaning. People and AI propose changes; declared rules and accountable decisions govern what takes effect.','Illustrated by a fable, proposals and a decision ledger.','Engineering & philosophy'],
 ['claimipedia','Claimipedia','sage','Shared evidence. Inspectable disagreement.','A framework for versioned claims, evidence and explicit review methods. Keep assumptions and conclusions distinct, so disagreement can be examined and revised.','Illustrated by three methods reading the same evidence.','Engineering & philosophy'],
 ['worldwright','Worldwright','blue','Compose stories people find their own way through.','A storytelling and authoring product in development. Connect people, ideas, sources and scenes into worlds readers can explore along different paths.','This personal expedition is its first composition.','In preparation']
];
for(const [slug,name,light,note,description,detail,statusLabel]of worlds){const s='microsite.entry.'+slug;for(const [p,o]of Object.entries({isa:'PublishedMicrosite',name,light,note,description,detail,statusLabel,href:slug+'/',status:slug==='worldwright'?'placeholder':'published',icon:JSON.stringify(icon(slug))}))add(s,p,o);}
for(const [slug]of worlds){const path='assets/world-emblems/'+slug+'-v1.png';add('file.'+path,'isa','PublicationAsset');add('file.'+path,'path',path);}
add('page.worldwright','isa','StandalonePage');add('page.worldwright','canonical','https://aaronalderman.com/worldwright/');
facts=facts.filter(f=>!f.s.startsWith('entrances.style.'));
let index=0;function style(selector,declarations,context){const s='entrances.style.'+(++index);add(s,'isa','StyleRule');add(s,'projection','main');add(s,'selector',selector);if(context)add(s,'context',context);for(const [p,value]of Object.entries(declarations)){const d=s+'.'+p;facts.push({s,p:'declaration',o:d,pol:'is'});add(d,'property',p);add(d,'value',value);}}
const rules={
 '.hero-content':{'max-width':'860px',width:'100%'},'.hero-microsites':{'max-width':'820px',margin:'34px 0 26px'},
 '.microsite-menu':{'grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'16px'},
 '.microsite-link':{position:'relative',isolation:'isolate',overflow:'hidden',display:'flex','flex-direction':'column',gap:'0',padding:'25px 26px 22px','min-height':'322px','border-radius':'18px',background:'linear-gradient(145deg,color-mix(in srgb,var(--world-color) 13%,#131a25),#0b111cef)','box-shadow':'0 18px 40px #0003,inset 0 1px 0 #ffffff0c',transition:'transform .35s ease,border-color .35s ease,box-shadow .35s ease'},
 '.microsite-link::before':{content:'""',position:'absolute',right:'-60px',top:'-80px',width:'260px',height:'260px','border-radius':'50%',border:'1px solid color-mix(in srgb,var(--world-color) 17%,transparent)','box-shadow':'0 0 0 26px #ffffff02,0 0 0 60px #ffffff02','z-index':'-1'},
 '.microsite-link[data-world="blue"]':{'--world-color':'#9ebee9'},
 '.world-card-top':{display:'flex','justify-content':'space-between','align-items':'center',gap:'12px',margin:'0 0 16px'},
 '.world-emblem':{width:'96px',height:'96px','object-fit':'contain','flex-shrink':'0','filter':'drop-shadow(0 5px 12px #0005)',transition:'transform .65s cubic-bezier(.2,.8,.2,1),filter .65s ease','transform-origin':'50% 65%'},
 '.world-card-status':{'font-size':'9px','letter-spacing':'.1em','text-transform':'uppercase',color:'#e1dcd1',padding:'5px 8px',border:'1px solid #ffffff20','border-radius':'20px'},
 '.microsite-link strong':{'font-size':'31px','letter-spacing':'-.025em','line-height':'1.15',margin:'0 0 8px'},
 '.world-card-note':{'font-family':'var(--serif)','font-size':'16px',color:'var(--world-color)',margin:'0 0 14px','line-height':'1.4'},
 '.world-card-description':{'font-size':'13px',color:'#d4d7df','line-height':'1.7',margin:'0 0 19px','max-width':'340px'},
 '.world-card-detail':{'font-size':'10px',color:'#b9c2cf',margin:'auto 0 14px','letter-spacing':'.015em'},
 '.world-card-action':{display:'flex','justify-content':'space-between','align-items':'center','font-size':'11px',color:'#f4eddf','border-top':'1px solid #ffffff1c','padding-top':'13px'},
 '.world-card-action span:last-child':{'font-size':'19px',color:'var(--world-color)',transition:'transform .3s ease'},
 '.microsite-link:hover,.microsite-link:focus-visible':{transform:'translateY(-4px)','box-shadow':'0 22px 50px #0006,inset 0 1px 0 #ffffff18'},
 '.microsite-link:hover .world-card-action span:last-child':{transform:'translate(3px,-3px)'},
 '.worldwright-placeholder':{'max-width':'1000px',margin:'auto',padding:'90px 7%','text-align':'center'},
 '.worldwright-placeholder>.world-emblem':{width:'150px',height:'150px',margin:'0 auto 26px',color:'#9ebee9'},
 '.worldwright-placeholder h1':{'font-size':'clamp(48px,8vw,88px)','letter-spacing':'-.04em'},
 '.worldwright-placeholder .lead':{'font-size':'clamp(22px,3vw,32px)','font-family':'var(--serif)',color:'#c9d9ee'},
 '.worldwright-placeholder p':{'max-width':'640px',margin:'0 auto 25px'},
 '.worldwright-links':{display:'flex',gap:'16px','flex-wrap':'wrap','justify-content':'center',margin:'35px 0'},
 '.worldwright-placeholder::before':{content:'""',position:'fixed',inset:'0','z-index':'-1',background:'radial-gradient(ellipse at 50% 20%,#30496765,transparent 65%),radial-gradient(ellipse at 80% 80%,#7c573a30,transparent 60%)'}
};for(const [s,d]of Object.entries(rules))style(s,d);
style('.microsite-menu',{'grid-template-columns':'1fr'},'(max-width: 560px)');style('.microsite-link',{'min-height':'0',padding:'22px'},'(max-width: 560px)');
style('.microsite-link::before',{transition:'transform .8s ease,border-color .8s ease'});
style('.microsite-link::after',{content:'""',position:'absolute',inset:'0',background:'linear-gradient(115deg,transparent 20%,#ffffff09 45%,transparent 70%)',transform:'translateX(-110%)',transition:'transform .85s ease','pointer-events':'none','z-index':'-1'});
style('.microsite-link:is(:hover,:focus-visible)::after',{transform:'translateX(110%)'});
style('.microsite-link:is(:hover,:focus-visible)::before',{transform:'rotate(15deg) scale(1.12)','border-color':'color-mix(in srgb,var(--world-color) 40%,transparent)'});
style('.microsite-link:is(:hover,:focus-visible) .world-emblem',{filter:'drop-shadow(0 0 18px color-mix(in srgb,var(--world-color) 45%,transparent))',transform:'translateY(-5px) scale(1.08)'});
style('.microsite-link[data-world="rose"]:is(:hover,:focus-visible) .world-emblem',{transform:'translate(6px,-7px) rotate(-9deg) scale(1.08)'});
style('.microsite-link[data-world="sage"]:is(:hover,:focus-visible) .world-emblem',{transform:'translateY(-3px) rotate(3deg) scale(1.1)'});
style('.microsite-link[data-world="blue"]:is(:hover,:focus-visible) .world-emblem',{transform:'translateY(-5px) rotate(8deg) scale(1.08)'});
style('.microsite-link,.microsite-link::before,.microsite-link::after,.microsite-link .world-emblem,.world-card-action span:last-child',{transition:'none !important',animation:'none !important',transform:'none !important'},'(prefers-reduced-motion: reduce)');
fs.writeFileSync('source/front-doors.rel',facts.map(f=>'('+[f.s,f.p,f.o].map(JSON.stringify).join(', ')+')').join('\n')+'\n');
const module=read('algebra/front-doors.process.json');
module.queries['frontdoors.home']=[{fold:['subjects','isa','PublishedMicrosite'],as:'world',accumulator:'cards',initial:L(),steps:[{port:'json.parse',args:{text:one('$world','icon')},into:'emblem'}],yield:['append','$cards',L(E('a',{class:'microsite-link',href:one('$world','href'),'data-world':one('$world','light')},el('div','world-card-top','$emblem',el('span','world-card-status',one('$world','statusLabel'))),E('strong',{},one('$world','name')),el('p','world-card-note',one('$world','note')),el('p','world-card-description',one('$world','description')),el('p','world-card-detail',one('$world','detail')),el('div','world-card-action',E('span',{},C('Explore ',one('$world','name'))),E('span',{'aria-hidden':'true'},'↗'))))],into:'cards'},{let:'result',value:E('nav',{class:'hero-microsites',id:'microsites','aria-label':'Microsites'},el('p','eyebrow','Explore the worlds'),el('div','microsite-menu','$cards'))}];
const doc=E('html',{lang:'en'},E('head',{},E('meta',{charset:'utf-8'}),E('meta',{name:'viewport',content:'width=device-width, initial-scale=1'}),E('title',{},'Worldwright — A world taking shape'),E('meta',{name:'description',content:'A storytelling and authoring product in development: compose worlds readers can find their own way through.'}),E('link',{rel:'canonical',href:'https://aaronalderman.com/worldwright/'}),E('link',{rel:'stylesheet',href:'../expedition.css?v=worlds-3'}),...Object.entries({'og:type':'website','og:title':'Worldwright — A world taking shape','og:description':'Connected stories, authored worlds and reader journeys.','og:url':'https://aaronalderman.com/worldwright/','og:image':'https://aaronalderman.com/assets/sourcerer-threshold.png','twitter:card':'summary_large_image'}).map(([property,content])=>E('meta',{property,content}))),E('body',{},E('a',{href:'#main',class:'skip'},'Skip to content'),E('header',{class:'masthead'},E('a',{class:'brand',href:'../index.html'},'Aaron Alderman'),E('nav',{'aria-label':'Worldwright'},E('a',{href:'../index.html#microsites'},'Explore the worlds'),E('a',{href:'../gate.html'},'Reading paths'))),E('main',{id:'main',class:'worldwright-placeholder'},icon('worldwright','../'),el('p','eyebrow','Worldwright / In preparation'),E('h1',{},'A world taking shape.'),el('p','lead','A storytelling product for worlds with more than one way through.'),E('p',{},'Worldwright is being developed as an environment for authoring and presenting connected stories. A world holds the people, ideas, events and sources; a composition arranges encounters and passages; a journey is the route a reader actually takes.'),E('p',{},'Its guiding idea is that an author can shape a meaningful experience while leaving readers room to choose, question and return. This personal expedition is the first composition. The wider authoring product remains in development. This is a placeholder for the Worldwright microsite.'),el('nav','worldwright-links',...['Temple','Sourcery','Claimipedia'].map(name=>E('a',{class:'button',href:'../'+name.toLowerCase()+'/'},name+' ↗'))),E('a',{href:'../gate.html'},'Follow a thread through the corpus →'))));
module.queries['frontdoors.worldwright']=[{let:'input',value:doc},{call:'html.serialize'},{port:'file.write',args:{path:'worldwright/index.html',text:C('<!doctype html>\n','$result')},into:'_'}];save('algebra/front-doors.process.json',module);
const pub=read('algebra/publication.process.json');if(!pub.queries['publication.build'].some(s=>s.call==='frontdoors.worldwright'))pub.queries['publication.build'].splice(3,0,{call:'frontdoors.worldwright'});save('algebra/publication.process.json',pub);
const rel='source/expedition.rel';fs.writeFileSync(rel,fs.readFileSync(rel,'utf8').replace(/"stylesheetVersion", "worlds-[0-9]+"/,'"stylesheetVersion", "worlds-3"'));

await import('./author-capabilities.mjs');
