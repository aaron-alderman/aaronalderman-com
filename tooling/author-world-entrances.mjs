// Authoring only: illustrations, cards and the placeholder become process/REL.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {parseRel}=createRequire(import.meta.url)('../bootstrap/ports/rel-codec.cjs');
const read=f=>JSON.parse(fs.readFileSync(f)),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const L=(...x)=>['list',...x],C=(...x)=>['concat',...x],one=(s,p)=>['one',s,p],E=(tag,attrs={},...children)=>({tag,attrs,children:L(...children)}),el=(tag,cls,...children)=>E(tag,cls?{class:cls}:{},...children);
const path=d=>E('path',{d}),circle=(cx,cy,r)=>E('circle',{cx,cy,r});
const icons={
 temple:[path('M12 66h56M18 61h44M24 56V26l16-14 16 14v30M30 56V30l10-9 10 9v26M35 49h10V35H35zM40 7V3M40 63v10'),path('M38 43q-4-5 2-10 6 5 2 10z'),circle(40,40,17)],
 sourcery:[path('M17 63 57 23M23 57l-8-1-7 12 9 4 11-9zM47 12l3-9 3 9 9 3-9 3-3 9-3-9-9-3zM65 44l2-6 2 6 6 2-6 2-2 6-2-6-6-2zM21 22v8M17 26h8M28 68q23 3 35-20'),circle(31,14,2),circle(64,65,2)],
 claimipedia:[circle(28,34,19),circle(40,34,19),circle(52,34,19),path('M12 61q14-10 28 0 14-10 28 0v9q-14-10-28 0-14-10-28 0zM40 61v9M24 30l6 4-6 4M50 30l6 4-6 4')],
 worldwright:[circle(40,35,25),E('ellipse',{cx:40,cy:35,rx:11,ry:25}),path('M15 35h50M20 21q20 12 40 0M20 49q20-12 40 0M6 67h68M19 67v-7h42v7M40 5V1M10 9l6 6M64 15l6-6M40 35l8-8'),circle(40,35,4)]
};
const icon=slug=>E('svg',{viewBox:'0 0 80 80',class:'world-emblem',fill:'none',stroke:'currentColor','stroke-width':1.25,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'},...icons[slug]);
let facts=parseRel(fs.readFileSync('source/front-doors.rel','utf8'),'front-doors');
const add=(s,p,o)=>{const f=facts.find(f=>f.s===s&&f.p===p);if(f)f.o=o;else facts.push({s,p,o,pol:'is'});};
const worlds=[
 ['temple','Temple','gold','Law, change and the witness.','Enter a living system of promises. Tend its lamp, test a rule, and see why some changes are welcomed while others are refused.','A lamp to tend · A history to inspect','Interactive microsite'],
 ['sourcery','Sourcery','rose','Magic that shows its work.','Give an idea to a small fleet of broomsticks. Watch it become a proposal, decide what happens, then inspect the trail it leaves behind.','An idea to cast · A decision to witness','Interactive microsite'],
 ['claimipedia','Claimipedia','sage','Shared evidence. Different ways of knowing.','Bring one claim into the light of three review methods. Change the evidence and discover why their conclusions can disagree.','Evidence to explore · Reasons to compare','Interactive microsite'],
 ['worldwright','Worldwright','blue','A framework for worlds that keep opening.','The supporting platform behind these experiences: bringing ideas, stories and working systems into a common language. A new world is taking shape.','A place for the platform · More to come','In preparation']
];
for(const [slug,name,light,note,description,detail,statusLabel]of worlds){const s='microsite.entry.'+slug;for(const [p,o]of Object.entries({isa:'PublishedMicrosite',name,light,note,description,detail,statusLabel,href:slug+'/',status:slug==='worldwright'?'placeholder':'published',icon:JSON.stringify(icon(slug))}))add(s,p,o);}
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
 '.world-emblem':{width:'64px',height:'64px',color:'var(--world-color,#b8cef0)','flex-shrink':'0','filter':'drop-shadow(0 0 12px color-mix(in srgb,var(--world-color,#b8cef0) 30%,transparent))'},
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
style('.microsite-link,.world-card-action span:last-child',{transition:'none',transform:'none !important'},'(prefers-reduced-motion: reduce)');
style('.microsite-link',{animation:'arrival .7s ease-out both'},'(prefers-reduced-motion: no-preference)');
fs.writeFileSync('source/front-doors.rel',facts.map(f=>'('+[f.s,f.p,f.o].map(JSON.stringify).join(', ')+')').join('\n')+'\n');
const module=read('algebra/front-doors.process.json');
module.queries['frontdoors.home']=[{fold:['subjects','isa','PublishedMicrosite'],as:'world',accumulator:'cards',initial:L(),steps:[{port:'json.parse',args:{text:one('$world','icon')},into:'emblem'}],yield:['append','$cards',L(E('a',{class:'microsite-link',href:one('$world','href'),'data-world':one('$world','light')},el('div','world-card-top','$emblem',el('span','world-card-status',one('$world','statusLabel'))),E('strong',{},one('$world','name')),el('p','world-card-note',one('$world','note')),el('p','world-card-description',one('$world','description')),el('p','world-card-detail',one('$world','detail')),el('div','world-card-action',E('span',{},C('Explore ',one('$world','name'))),E('span',{'aria-hidden':'true'},'↗'))))],into:'cards'},{let:'result',value:E('nav',{class:'hero-microsites',id:'microsites','aria-label':'Microsites'},el('p','eyebrow','Explore the worlds'),el('div','microsite-menu','$cards'))}];
const doc=E('html',{lang:'en'},E('head',{},E('meta',{charset:'utf-8'}),E('meta',{name:'viewport',content:'width=device-width, initial-scale=1'}),E('title',{},'Worldwright — A world taking shape'),E('meta',{name:'description',content:'The supporting platform behind a growing family of worlds. A Worldwright microsite is taking shape.'}),E('link',{rel:'canonical',href:'https://aaronalderman.com/worldwright/'}),E('link',{rel:'stylesheet',href:'../expedition.css?v=worlds-2'}),...Object.entries({'og:type':'website','og:title':'Worldwright — A world taking shape','og:description':'The supporting platform behind a growing family of worlds.','og:url':'https://aaronalderman.com/worldwright/','og:image':'https://aaronalderman.com/assets/sourcerer-threshold.png','twitter:card':'summary_large_image'}).map(([property,content])=>E('meta',{property,content}))),E('body',{},E('a',{href:'#main',class:'skip'},'Skip to content'),E('header',{class:'masthead'},E('a',{class:'brand',href:'../index.html'},'Aaron Alderman'),E('nav',{'aria-label':'Worldwright'},E('a',{href:'../index.html#microsites'},'Explore the worlds'),E('a',{href:'../gate.html'},'Reading paths'))),E('main',{id:'main',class:'worldwright-placeholder'},icon('worldwright'),el('p','eyebrow','Worldwright / In preparation'),E('h1',{},'A world taking shape.'),el('p','lead','A supporting platform for ideas that become worlds.'),E('p',{},'Temple, Sourcery and Claimipedia are distinct experiences. Worldwright is the supporting platform: a place to bring their shared language, tools and possibilities into view.'),E('p',{},'This is a placeholder for the future Worldwright microsite. For now, explore the worlds already open, or follow the research behind them.'),el('nav','worldwright-links',...['Temple','Sourcery','Claimipedia'].map(name=>E('a',{class:'button',href:'../'+name.toLowerCase()+'/'},name+' ↗'))),E('a',{href:'../gate.html'},'Follow a thread through the corpus →'))));
module.queries['frontdoors.worldwright']=[{let:'input',value:doc},{call:'html.serialize'},{port:'file.write',args:{path:'worldwright/index.html',text:C('<!doctype html>\n','$result')},into:'_'}];save('algebra/front-doors.process.json',module);
const pub=read('algebra/publication.process.json');if(!pub.queries['publication.build'].some(s=>s.call==='frontdoors.worldwright'))pub.queries['publication.build'].splice(3,0,{call:'frontdoors.worldwright'});save('algebra/publication.process.json',pub);
const rel='source/expedition.rel';fs.writeFileSync(rel,fs.readFileSync(rel,'utf8').replace('"stylesheetVersion", "worlds-1"','"stylesheetVersion", "worlds-2"'));
