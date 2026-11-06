import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {loadAuthorModel} from './tooling/author.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,import.meta.url)));
const {lower}=require('./bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const contract=read('source/authoring-contract.json'),compile=input=>lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input,mode:'model',ports:valuePorts(),limit:contract.budget});
const {model}=await loadAuthorModel(contract);
const file='source/front-doors.rel',change={file,beforeSha256:'observed-hash',text:'replacement REL supplied as data'};
const request=(changes=[change],apply=false)=>({protocol:'worldwright/authoring-proposal/1',apply,changes});
async function run(proposal,options={}) {
 const calls=options.calls??[];
 const ports={...valuePorts(),'document.observe':()=>({sha256:'observed-hash',text:'old REL'}),
  'publication.stage':args=>{calls.push(['stage',args]);return {id:'candidate'};},
  'publication.validate':({commands})=>{calls.push(['validate']);return {ok:true,runs:commands.map(command=>({command:[command.tool,...command.args],status:options.valid===false?1:0,error:null})),log:'validation.json',receipt:{}};},
  'document.commit':args=>{calls.push(['commit',args]);return {files:args.changes};},
  'receipt.write':args=>{calls.push(['receipt']);return args.value;}};
 const result=await invoke({model,entry:options.entry??'author.run',input:{contract,request:proposal},ports,limit:contract.budget});
 return {value:result.value,calls};
}
test('the authoring policy admits with only its declared generic mechanisms',async()=>{
 const admission=await compile(read('algebra/admission.process.json'));
 for(const entry of ['admit.model','admit.effects'])await invoke({model:admission,entry,input:{target:model,profile:read('bootstrap/kernel-profile.json'),grants:contract.grants},ports:valuePorts(),limit:contract.budget});
});
test('previews validate without committing; apply commits the validated proposal before its receipt',async()=>{
 const preview=await run(request());assert.equal(preview.value.applied,false);assert.deepEqual(preview.calls.map(c=>c[0]),['stage','validate','receipt']);
 const applied=await run(request([change],true));assert.equal(applied.value.applied,true);assert.deepEqual(applied.calls.map(c=>c[0]),['stage','validate','commit','receipt']);assert.deepEqual(applied.calls[2][1].changes,[change]);
});
test('bad authority, stale and repeated edits, no-ops and malformed proposals refuse before staging',async()=>{
 for(const [proposal,code]of [
  [request([{...change,file:'bootstrap/run.cjs'}]),'AUTHOR-006'],
  [request([{...change,file:'../outside.rel'}]),'AUTHOR-006'],
  [request([{...change,file:contract.process}]),'AUTHOR-006'],
  [request([{...change,beforeSha256:'stale'}]),'AUTHOR-009'],
  [request([change,change]),'AUTHOR-007'],
  [request([{...change,text:'old REL'}]),'AUTHOR-010'],
  [request([{...change,text:42}]),'AUTHOR-008'],
  [request([{...change,text:''}]),'AUTHOR-008'],
  [request([]),'AUTHOR-004'],
  [{...request(),apply:'yes'},'AUTHOR-003'],
  [{...request(),protocol:'other'},'AUTHOR-002']
 ]){const calls=[];await assert.rejects(run(proposal,{calls}),new RegExp(code));assert.deepEqual(calls,[]);}
});
test('failed publication validation cannot reach the commit effect',async()=>{
 const calls=[];await assert.rejects(run(request([change],true),{valid:false,calls}),/AUTHOR-011/);assert.deepEqual(calls.map(c=>c[0]),['stage','validate']);
});
test('all build source owners remain editable; generator predecessors are inert and byte-identical',()=>{
 const manifest=read('bootstrap/site.json');for(const file of manifest.sources)assert.ok(contract.editable.includes(file),file);
 assert.ok(!contract.editable.some(f=>f.startsWith('bootstrap/')||f.startsWith('retained/')));
 assert.deepEqual(fs.readdirSync(new URL('tooling/',import.meta.url)).filter(f=>/^author-.*\.mjs$/.test(f)),[]);
 for(const item of read('source/authoring-predecessors.json').files){assert.ok(!fs.existsSync(new URL(item.file,import.meta.url)),item.file+' has no executable successor');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(item.archive,import.meta.url))).digest('hex'),item.sha256);}
});
