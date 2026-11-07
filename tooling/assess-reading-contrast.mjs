// IO, admission and replay only. Source selection, contrast and currency policy live in algebra.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{createKernel}=require('../bootstrap/temple-seed.cjs'),{valuePorts}=require('../bootstrap/ports/value.cjs'),{computationalPorts}=require('../bootstrap/ports/browser-effects.cjs'),{lower}=require('../bootstrap/ports/algebra-lower.cjs'),{invoke}=require('../bootstrap/ports/programme.cjs'),{parseRel}=require('../bootstrap/ports/rel-codec.cjs'),{indexFacts}=require('../bootstrap/ports/fact-index.cjs');
export const policyNames=['assurance.contrast.input','assurance.contrast.luminance','assurance.contrast.ratio','assurance.contrast.evaluate','assurance.contrast.currentness'];
const defaultRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Transcendental floating-point results can differ by one ULP between engines.
// Only the reported ratio has a transport tolerance; verdicts, thresholds,
// colour bindings and all other evidence fields must still agree exactly.
export function assertContrastReplay(actual,expected){
 const replay=JSON.parse(JSON.stringify(actual));
 assert.equal(replay.cases.length,expected.cases.length);
 for(let i=0;i<replay.cases.length;i++){
  const a=replay.cases[i].ratio,b=expected.cases[i].ratio;
  assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-12,'Contrast ratio replay exceeds floating-point transport tolerance');
  replay.cases[i].ratio=b;
 }
 assert.deepEqual(replay,expected);
}
export async function createContrastAssessor({root=defaultRoot,publication}={}){
 const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),source=publication??read('algebra/publication.process.json'),queries=Object.fromEntries(policyNames.map(n=>[n,source.queries[n]])),site=read('bootstrap/site.json'),limit=site.executionBudget;
 const compile=input=>lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit});
 const model=await compile({entry:'assurance.contrast.evaluate',queries}),admission=await compile(read('algebra/admission.process.json')),profile=read('bootstrap/kernel-profile.json'),grants=read('bootstrap/ports.json').profiles.workshopBrowser;
 for(const entry of ['admit.model','admit.effects'])await invoke({model:admission,entry,input:{profile,target:model,grants},ports:valuePorts(),limit});
 const facts=site.sources.flatMap(file=>parseRel(fs.readFileSync(path.join(root,file),'utf8'))),factIndex=await indexFacts(createKernel(valuePorts(),limit),read('algebra/fact-index.process.json'),facts);
 const available={...valuePorts(),...computationalPorts()},ports=Object.fromEntries(Object.entries(available).filter(([name])=>grants.includes(name)));
 const execute=(entry,eventInput)=>invoke({model,entry,input:{eventInput,factIndex},ports,limit});
 return {queries,policySha256:crypto.createHash('sha256').update(JSON.stringify(queries)).digest('hex'),input:()=>execute('assurance.contrast.input',{reading:read('source/reading/rooms.json'),faith:read('source/faith/reading.json')}),evaluate:input=>execute('assurance.contrast.evaluate',input),ratio:pair=>execute('assurance.contrast.ratio',pair),currentness:input=>execute('assurance.contrast.currentness',input)};
}
export function artifactEvidence(root=defaultRoot){
 const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),receipt=read('dist/build-receipt.json'),capture=read('tooling/assurance/browser-evidence.json'),currentBindings={};
 // Match the original browser receipt's document/media dependency family; evidence
 // JSON is deliberately not its own fingerprint input.
 const assets=Object.keys(receipt.artifacts).filter(f=>/\.(html|css|js|svg|png|webp|jpg|jpeg|woff|woff2)$/.test(f));
 for(const file of new Set([...Object.keys(capture.bindings),...assets])){const p=path.join(root,'dist',file);if(fs.existsSync(p))currentBindings[file]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
 return {capturedBindings:capture.bindings,currentBindings,routes:Object.keys(receipt.artifacts).filter(f=>f.endsWith('.html'))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const assessor=await createContrastAssessor(),inputs=(await assessor.input()).value,baselinePath=path.join(defaultRoot,'tooling/assurance/contrast-baseline.json');
 if(process.argv.includes('--capture-baseline')){if(fs.existsSync(baselinePath))throw Error('An existing baseline must not be overwritten');fs.writeFileSync(baselinePath,JSON.stringify({protocol:'worldwright/contrast-source-baseline/1',basis:'Authored styles at the user-reported dark-on-dark regression; not a browser colour observation.',inputs},null,2)+'\n');console.log('Retained original authored contrast inputs');}
 else{
  const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8')),current=(await assessor.evaluate(inputs)).value,before=(await assessor.evaluate(baseline.inputs)).value,currencyInput=artifactEvidence(),currentness=(await assessor.currentness(currencyInput)).value;
  const report={protocol:'worldwright/contrast-evidence/1',policySha256:assessor.policySha256,policy:assessor.queries,current:{inputs,report:current},baseline:{...baseline,report:before},currencyInput,currentness};
  const output=path.join(defaultRoot,'tooling/assurance/contrast-evidence.json');
  if(process.argv.includes('--check')){const stored=JSON.parse(fs.readFileSync(output,'utf8'));assertContrastReplay(report.current.report,stored.current.report);assertContrastReplay(report.baseline.report,stored.baseline.report);report.current.report=stored.current.report;report.baseline.report=stored.baseline.report;assert.deepEqual(report,stored,'Contrast evidence is stale; replay the algebra before publishing');}
  else fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({before:before.failed,after:current.failed,review:current.review,browserColours:current.browserColourEvidence}));
 }
}
