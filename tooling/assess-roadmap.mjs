// Offline admission and replay only. Work selection and workflow policy live in algebra.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{createKernel}=require('../bootstrap/temple-seed.cjs'),{valuePorts}=require('../bootstrap/ports/value.cjs'),{computationalPorts}=require('../bootstrap/ports/browser-effects.cjs'),{lower}=require('../bootstrap/ports/algebra-lower.cjs'),{invoke}=require('../bootstrap/ports/programme.cjs');
const defaultRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function createRoadmapAssessor({root=defaultRoot,publication}={}){
 const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),source=publication??read('algebra/publication.process.json'),names=['roadmap.collect','roadmap.derive'],queries=Object.fromEntries(names.map(n=>[n,source.queries[n]]));
 if(names.some(n=>!queries[n]))throw Error('Roadmap algebra is not declared');
 const limit=read('bootstrap/site.json').executionBudget,compile=input=>lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit});
 const model=await compile({entry:'roadmap.derive',queries}),admission=await compile(read('algebra/admission.process.json')),profile=read('bootstrap/kernel-profile.json'),grants=read('bootstrap/ports.json').profiles.readerBrowser;
 for(const entry of ['admit.model','admit.effects'])await invoke({model:admission,entry,input:{profile,target:model,grants},ports:valuePorts(),limit});
 const available={...valuePorts(),...computationalPorts()},ports=Object.fromEntries(Object.entries(available).filter(([name])=>grants.includes(name)));
 return {derive:eventInput=>invoke({model,entry:model.entry,input:{eventInput},ports,limit})};
}
