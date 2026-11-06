// Authoring-only correction; the layout and document bindings remain algebra/REL.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {parseRel}=createRequire(import.meta.url)('../bootstrap/ports/rel-codec.cjs');
const file='source/presentation.rel',facts=parseRel(fs.readFileSync(file,'utf8'),file);
const put=(s,p,o)=>{const f=facts.find(f=>f.s===s&&f.p===p);if(f)f.o=o;else facts.push({s,p,o,pol:'is'});};
put('style.141','declaration','style.141.display');put('style.141.display','property','display');put('style.141.display','value','block !important');
fs.writeFileSync(file,facts.map(f=>'('+[f.s,f.p,f.o].map(JSON.stringify).join(', ')+')').join('\n')+'\n');
const moduleFile='algebra/publication.process.json',module=JSON.parse(fs.readFileSync(moduleFile));
function version(v){if(typeof v==='string')return v.replace('../activity.css"','../activity.css?v=layout-2"').replace('../retained/activity.html#','../retained/activity.html?v=layout-2#');if(Array.isArray(v))return v.map(version);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,version(x)]));return v;}
fs.writeFileSync(moduleFile,JSON.stringify(version(module),null,2)+'\n');
