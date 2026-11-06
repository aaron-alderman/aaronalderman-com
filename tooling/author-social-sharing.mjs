// Authoring only: retained raster art + REL metadata, rendered by process algebra.
// Run after other page authoring helpers. No post-build HTML rewriting.
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p)),save=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const one=(s,p)=>['one',s,p],L=(...x)=>['list',...x];
const entries={
 home:{title:'Aaron Alderman — Inside the mind of a modern-day sourcerer.',description:'Explore Aaron Alderman’s ideas, software, research and stories—and the reasons, evidence and philosophy behind them.',alt:'Aaron Alderman. Inside the mind of a modern-day sourcerer. Ideas, systems and the reasons behind them. A lamplit stone observatory opens onto branching paths and a golden sea.'},
 temple:{title:'Temple — A foundation for accountable change',description:'An execution kernel for proposed changes, explicit rules and authority, with recorded acceptance or refusal.',alt:'Temple. A foundation for accountable change. Explicit rules, checked changes and recorded outcomes. A golden lantern hangs within a stone arch.'},
 sourcery:{title:'Sourcery — Software that shows its work',description:'Software creation from explicit meaning, governed changes and accountable decisions.',alt:'Sourcery. Software that shows its work. Explicit meaning and accountable decisions. A painted broom rises through rose-coloured sparks.'},
 claimipedia:{title:'Claimipedia — Shared evidence. Inspectable disagreement.',description:'Versioned claims, evidence and explicit review methods, with assumptions and conclusions kept distinct.',alt:'Claimipedia. Shared evidence. Inspectable disagreement. Claims, evidence and review methods. An open book supports three overlapping teal glass lenses.'},
 worldwright:{title:'Worldwright — Stories with more than one way through',description:'A storytelling and authoring product in development: connected worlds readers can explore along different paths.',alt:'Worldwright. Stories with more than one way through. Storytelling and authoring, in development. A blue celestial globe sits within a brass stand.'}
};
const facts=[],fact=(s,p,o)=>facts.push([s,p,String(o)]),manifest=[];
for(const [slug,copy]of Object.entries(entries)){
 const s='sharing.'+slug,path='assets/sharing/'+slug+'-purpose-v1.png',bytes=fs.readFileSync(path),width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 for(const [p,o]of Object.entries({...copy,image:'https://aaronalderman.com/'+path,width,height,type:'image/png'}))fact(s,p,o);
 fact('asset.sharing.'+slug,'isa','PublicationAsset');fact('asset.sharing.'+slug,'path',path);
 if(['temple','sourcery'].includes(slug))fact('ms.'+slug+'.index.html','sharing',s);
 manifest.push({slug,path,width,height,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),...copy});
}
fs.writeFileSync('source/social-sharing.rel',facts.map(row=>'('+row.map(JSON.stringify).join(', ')+')').join('\n')+'\n');
const fields={'og:title':'title','og:description':'description','og:image':'image','og:image:secure_url':'image','og:image:alt':'alt','og:image:width':'width','og:image:height':'height','og:image:type':'type','twitter:title':'title','twitter:description':'description','twitter:image':'image','twitter:image:alt':'alt'};
const meta=(key,value)=>({tag:'meta',attrs:{[key.startsWith('og:')?'property':'name']:key,content:value},children:L()});
// The original-document projection retains film-poster metadata on film pages.
const projection=read('algebra/microsite-projection.process.json'),plan=projection.queries['source.metadata'][0].value;
for(let i=plan.length-1;i>0;i--)if(Array.isArray(plan[i])&&plan[i][0]==='if'&&JSON.stringify(plan[i][1])===JSON.stringify(['optional','$msDocument','sharing']))plan.splice(i,1);
for(const [key,p]of Object.entries(fields)){
 const fallback=plan.find(n=>n?.tag==='meta'&&(n.attrs.property??n.attrs.name)===key);
 const bound=['if',['optional','$msDocument','sharing'],one(one('$msDocument','sharing'),p),fallback?one('$msDocument',key):null];
 if(fallback)fallback.attrs.content=bound;
 else plan.push(['if',['optional','$msDocument','sharing'],meta(key,one(one('$msDocument','sharing'),p)),null]);
}
save('algebra/microsite-projection.process.json',projection);
function bindDocument(value,slug){
 if(!value||typeof value!=='object')return;
 if(value.tag==='head'){
  value.children=value.children.filter(n=>!n?.tag||n.tag!=='meta'||(!Object.hasOwn(fields,n.attrs?.property??n.attrs?.name)&&(n.attrs?.property??n.attrs?.name)!=='twitter:card'));
  for(const [key,p]of Object.entries(fields))value.children.push(meta(key,one('sharing.'+slug,p)));
  value.children.push(meta('twitter:card','summary_large_image'));
 }
 Object.values(value).forEach(v=>Array.isArray(v)?v.forEach(n=>bindDocument(n,slug)):bindDocument(v,slug));
}
for(const [file,query,slug]of [['algebra/claimipedia.process.json','claimipedia.build','claimipedia'],['algebra/front-doors.process.json','frontdoors.worldwright','worldwright']]){const module=read(file);bindDocument(module.queries[query],slug);save(file,module);}
// Personal homepage metadata is distinct from the encounter pages and hero art.
const isHome=['eq','$canonical',one('site','origin')];
function bindHome(value){
 if(!value||typeof value!=='object')return;
 if(value.tag==='head'){
  value.children=value.children.filter(n=>!(Array.isArray(n)&&n[0]==='if'&&JSON.stringify(n[1])===JSON.stringify(isHome)));
  for(const [key,p]of Object.entries(fields)){
   const existing=value.children.find(n=>n?.tag==='meta'&&(n.attrs.property??n.attrs.name)===key);
   if(existing){let fallback=existing.attrs.content;if(Array.isArray(fallback)&&fallback[0]==='if'&&JSON.stringify(fallback[1])===JSON.stringify(isHome))fallback=fallback[3];existing.attrs.content=['if',isHome,one('sharing.home',p),fallback];}
   else value.children.push(['if',isHome,meta(key,one('sharing.home',p)),null]);
  }
 }
 Object.values(value).forEach(v=>Array.isArray(v)?v.forEach(bindHome):bindHome(v));
}
const publication=read('algebra/publication.process.json');bindHome(publication.queries['publication.document']);save('algebra/publication.process.json',publication);
for(const f of ['bootstrap/site.json','bootstrap/microsites-preview.json']){const m=read(f);m.sources=[...new Set([...m.sources,'source/social-sharing.rel'])];save(f,m);}
save('source/social-sharing.json',{protocol:'worldwright/purpose-sharing/1',authoring:'node tooling/author-social-sharing.mjs (after other page authoring)',source:'New original raster cards using the project’s painted emblems and personal observatory artwork as reference.',meaningSource:'source/purpose-edition.json',owners:{facts:'source/social-sharing.rel',originalMicrositeProjection:'algebra/microsite-projection.process.json',otherPages:['algebra/claimipedia.process.json','algebra/front-doors.process.json','algebra/publication.process.json']},scope:'Personal homepage and project landing pages. Original film pages retain their film posters; encounter-page imagery and homepage hero art are unchanged.',cache:'New versioned image URLs; third-party platforms may retain their own cached previews.',images:manifest});
