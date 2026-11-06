// Authoring notation only. The existing publication algebra renders both lists.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {parseRel}=createRequire(import.meta.url)('../bootstrap/ports/rel-codec.cjs');
const file='source/front-doors.rel',facts=parseRel(fs.readFileSync(file,'utf8'),file);
const put=(s,p,o)=>{const f=facts.find(f=>f.s===s&&f.p===p);if(f)f.o=o;else facts.push({s,p,o});};
// Encounter remains available as a live example, but is not a product card.
put('microsite.entry.encounter','isa','CapabilitySet');
const capabilities=[
 ['microsite.entry.encounter','Encounter','encounter/','Inspect meaning, sources and declared routes for change.'],
 ['capability.kingdom','Kingdom','gate.html#path-kingdom','Explore faith, restraint and responsibility.'],
 ['capability.world-modelling','World Modelling','places/representation.html','Examine how a model represents a world, and what it leaves out.'],
 ['capability.creativity','Creativity','places/tiling.html','Explore patterns, possibilities and making.'],
 ['capability.field','The Field','gate.html#path-field','Follow open questions and ways to test them.']
];
for(const [id,name,href,description]of capabilities)for(const [p,o]of Object.entries({isa:'CapabilitySet',name,href,description}))put(id,p,o);
let i=0;
function style(selector,declarations,context){const s='capabilities.style.'+(++i);put(s,'isa','StyleRule');put(s,'projection','main');put(s,'selector',selector);if(context)put(s,'context',context);for(const [p,value]of Object.entries(declarations)){const d=s+'.'+p;facts.push({s,p:'declaration',o:d});put(d,'property',p);put(d,'value',value);}}
// Each rule has several declaration edges, so emit those edges directly.
for(let n=facts.length-1;n>=0;n--)if(facts[n].s.startsWith('capabilities.style.'))facts.splice(n,1);
style('.hero-capabilities',{'max-width':'820px',margin:'0 0 28px',padding:'20px 0 0','border-top':'1px solid #ffffff26'});
style('.hero-capabilities .eyebrow',{'font-size':'10px','letter-spacing':'.18em',color:'#e4d6bb',margin:'0 0 8px'});
style('.capability-intro',{'font-size':'12px','line-height':'1.6',color:'#c0c8d4',margin:'0 0 12px'});
style('.capability-list',{display:'flex','flex-wrap':'wrap',gap:'8px 22px','list-style':'none',padding:'0',margin:'0'});
style('.capability-list a',{display:'inline-flex','align-items':'center',gap:'9px',padding:'5px 0',color:'#e7dfd0','font-size':'15px','text-decoration':'none','border-bottom':'1px solid #ffffff30'});
style('.capability-list a:hover,.capability-list a:focus-visible',{color:'#f2c782','border-color':'#f2c782'});
style('.capability-arrow',{'font-size':'12px',color:'#b8b5ad'});
style('.capability-list',{'column-gap':'18px'},'(max-width: 560px)');
fs.writeFileSync(file,facts.map(f=>'('+[f.s,f.p,f.o].map(JSON.stringify).join(', ')+')').join('\n')+'\n');
const L=(...x)=>['list',...x],one=(s,p)=>['one',s,p],E=(tag,attrs={},...children)=>({tag,attrs,children:L(...children)});
const moduleFile='algebra/front-doors.process.json',module=JSON.parse(fs.readFileSync(moduleFile));
const home=module.queries['frontdoors.home'];
// Preserve the product-card fold and its original nav. Re-running is idempotent.
const previous=home.at(-1).value;
const products=previous.attrs?.class==='hero-entrances'?previous.children[1]:previous;
home.at(-1).value=E('div',{class:'hero-entrances'},products,
 E('nav',{class:'hero-capabilities','aria-label':'Capabilities'},
  E('p',{class:'eyebrow'},'Capabilities'),
  E('p',{class:'capability-intro'},'Ways of working that connect across the projects.'),
  E('ul',{class:'capability-list'},['map',['subjects','isa','CapabilitySet'],'capability',
   E('li',{},E('a',{href:one('$capability','href'),title:one('$capability','description')},one('$capability','name'),E('span',{class:'capability-arrow','aria-hidden':'true'},'↗')))])));
fs.writeFileSync(moduleFile,JSON.stringify(module,null,2)+'\n');
const expedition='source/expedition.rel';
fs.writeFileSync(expedition,fs.readFileSync(expedition,'utf8').replace(/"stylesheetVersion", "[^"]+"/,'"stylesheetVersion", "capabilities-1"'));
