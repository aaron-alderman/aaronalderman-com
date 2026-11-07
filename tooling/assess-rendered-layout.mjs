// Offline transport/admission/replay only. Layout rules live in the source algebra.
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
const require=createRequire(import.meta.url),{createKernel}=require('../bootstrap/temple-seed.cjs'),{valuePorts}=require('../bootstrap/ports/value.cjs'),{computationalPorts}=require('../bootstrap/ports/browser-effects.cjs'),{lower}=require('../bootstrap/ports/algebra-lower.cjs'),{invoke}=require('../bootstrap/ports/programme.cjs');
const defaultRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function createRenderedAssessor({root=defaultRoot,publication}={}){
 const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),source=publication??read('algebra/publication.process.json'),names=['assurance.rendered.plan','assurance.rendered.acceptPlan','assurance.rendered.classify','assurance.rendered.project','assurance.rendered.report'],queries=Object.fromEntries(Object.entries(source.queries).filter(([n])=>names.includes(n)));
 if(Object.keys(queries).length!==names.length)throw Error('Rendered assurance algebra is not declared');
 const compiler=read('algebra/lowering.process.json'),definitions=read('algebra/operators.expression.json'),limit=read('bootstrap/site.json').executionBudget;
 const compile=input=>lower({compiler,definitions,primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit});
 const model=await compile({entry:'assurance.rendered.report',queries}),admission=await compile(read('algebra/admission.process.json')),profile=read('bootstrap/kernel-profile.json'),grants=read('bootstrap/ports.json').profiles.workshopBrowser;
 for(const entry of ['admit.model','admit.effects'])await invoke({model:admission,entry,input:{profile,target:model,grants},ports:valuePorts(),limit});
 const available={...valuePorts(),...computationalPorts()},ports=Object.fromEntries(Object.entries(available).filter(([name])=>grants.includes(name)));
 const execute=(entry,eventInput)=>invoke({model,entry,input:{eventInput},ports,limit});
 return{policySha256:crypto.createHash('sha256').update(JSON.stringify(queries)).digest('hex'),plan:()=>execute('assurance.rendered.plan',{}),project:snapshots=>execute('assurance.rendered.project',{snapshots}),assess:snapshot=>execute('assurance.rendered.classify',snapshot),acceptPlan:plan=>execute('assurance.rendered.acceptPlan',{plan}),report:(snapshots,capturedPlan)=>execute('assurance.rendered.report',{snapshots,capturedPlan})};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [input,planFile,output]=process.argv.slice(2);if(!input||!planFile||!output)throw Error('Usage: node tooling/assess-rendered-layout.mjs observations.json captured-plan.json report.json');
 const assessor=await createRenderedAssessor(),result=await assessor.report(JSON.parse(fs.readFileSync(input,'utf8')),JSON.parse(fs.readFileSync(planFile,'utf8')));fs.writeFileSync(output,JSON.stringify({policySha256:assessor.policySha256,execution:result.usage,report:result.value},null,2)+'\n');console.log(JSON.stringify({readings:result.value.observationCount,findings:result.value.findingCount,steps:result.usage.steps}));
}
