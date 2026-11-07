// Admission, inert HTML projection, hashes and file IO. All assessment policy is algebra-owned.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';
const require=createRequire(import.meta.url),{createKernel}=require('../bootstrap/temple-seed.cjs'),{valuePorts}=require('../bootstrap/ports/value.cjs'),{computationalPorts}=require('../bootstrap/ports/browser-effects.cjs'),{lower}=require('../bootstrap/ports/algebra-lower.cjs'),{invoke}=require('../bootstrap/ports/programme.cjs');
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
export const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
export function assertExperienceReplay(actual,expected){
 const a=JSON.parse(JSON.stringify(actual));
 for(const key of ['assessments','findings'])for(let i=0;i<(a[key]??[]).length;i++){
  const x=a[key][i],y=expected[key]?.[i];
  if(typeof x.ratio==='number'&&typeof y?.ratio==='number'){assert.ok(Math.abs(x.ratio-y.ratio)<=1e-12,'Ratio transport differs beyond floating-point tolerance');x.ratio=y.ratio;}
 }
 assert.deepEqual(a,expected);
}
export async function createExperienceAssessor(){
 const source=read('algebra/reading-experience.process.json'),limit=read('bootstrap/site.json').executionBudget;
 const compile=input=>lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit});
 const model=await compile(source),admission=await compile(read('algebra/admission.process.json')),profile=read('bootstrap/kernel-profile.json'),grants=read('bootstrap/ports.json').profiles.workshopBrowser;
 for(const entry of ['admit.model','admit.effects'])await invoke({model:admission,entry,input:{profile,target:model,grants},ports:valuePorts(),limit});
 const available={...valuePorts(),...computationalPorts()},ports=Object.fromEntries(Object.entries(available).filter(([name])=>grants.includes(name)));
 const run=async(entry,eventInput)=>(await invoke({model,entry,input:{eventInput},ports,limit})).value;
 return {source,policySha256:sha(JSON.stringify(source)),run};
}
export function artifactBindings(){
 const receipt=read('dist/build-receipt.json');
 return Object.fromEntries(Object.keys(receipt.artifacts).filter(f=>/\.(html|css|js|svg|png|webp|jpg|jpeg|woff2?)$/.test(f)).map(f=>[f,sha(fs.readFileSync(path.join(root,'dist',f)))]));
}
export function prosePages(policy){
 const files=Object.keys(read('dist/build-receipt.json').artifacts).filter(f=>f.endsWith('.html'));
 return files.map(route=>{
  const bytes=fs.readFileSync(path.join(root,'dist',route)),tree=parse(bytes.toString()),blocks=[],links=[];
  const ignored=new Set(['pre','code','script','style','nav','textarea','svg','template']);
  const text=n=>ignored.has(n.tagName)?'':n.nodeName==='#text'?n.value:(n.childNodes??[]).map(text).join(' ');
  let foundMain=false;
  function visit(n,inMain=false){if(ignored.has(n.tagName))return;inMain||=n.tagName==='main';if(n.tagName==='main')foundMain=true;
   if(inMain&&['h1','h2','h3','p','li','figcaption'].includes(n.tagName)&&blocks.length<policy.language.maxBlocks){const s=text(n).replace(/\s+/g,' ').trim();if(s)blocks.push(s);}
   if(inMain&&n.tagName==='a'&&links.length<policy.language.maxLinks){const s=text(n).replace(/\s+/g,' ').trim();if(s)links.push(s);}
   for(const c of n.childNodes??[])visit(c,inMain);
  }visit(tree);
  return {route,sourceSha256:sha(bytes),foundMain,blocks,links,text:blocks.join('\n'),sentences:blocks.flatMap(s=>s.split(/[.!?]+(?:\s+|$)/).map(s=>s.trim()).filter(Boolean))};
 });
}
export function observerSha256(){return sha(fs.readFileSync(path.join(root,'tooling/reading-experience-observer.mjs'),'utf8').replace(/\r\n/g,'\n'));}
export async function assessExperience({captureFile,check=false}={}){
 const assessor=await createExperienceAssessor(),policy=read('source/assurance/reading-experience.json'),plan=await assessor.run('experience.plan',{policy}),bindings=artifactBindings(),planSha256=sha(JSON.stringify(plan));
 const capture=captureFile?JSON.parse(fs.readFileSync(captureFile,'utf8')):read('tooling/assurance/reading-experience-capture.json');
 const browserInput={policy,policySha256:assessor.policySha256,planSha256,observerSha256:observerSha256(),bindings,capture},pages=prosePages(policy),languageInput={policy,policySha256:assessor.policySha256,pages};
 const browser=await assessor.run('experience.report',browserInput),language=await assessor.run('language.report',languageInput);
 const evidence={protocol:'worldwright/reading-experience-evidence/1',policySha256:assessor.policySha256,policy:assessor.source,configuration:policy,plan,planSha256,observerSha256:browserInput.observerSha256,browserInput,languageInput,browser,language};
 const output=path.join(root,'tooling/assurance/reading-experience-evidence.json');
 if(check){const stored=JSON.parse(fs.readFileSync(output,'utf8'));assertExperienceReplay(evidence.browser,stored.browser);assert.deepEqual(evidence.language,stored.language);evidence.browser=stored.browser;assert.deepEqual(evidence,stored,'Reading experience evidence is stale; replay the admitted assessor.');}
 else fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
 return evidence;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const captureAt=process.argv.indexOf('--capture'),captureFile=captureAt>=0?process.argv[captureAt+1]:undefined;
 const r=await assessExperience({captureFile,check:process.argv.includes('--check')});
 console.log(JSON.stringify({browser:r.browser.counts,language:r.language.counts}));
 if(process.argv.includes('--require-browser')){const assessor=await createExperienceAssessor(),gate=await assessor.run('experience.gate',r.browser);if(!gate.ok)process.exitCode=1;}
}
