import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),read=f=>JSON.parse(fs.readFileSync(f));
const {lower}=require('./bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{computationalPorts}=require('./bootstrap/ports/browser-effects.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const queries={...read('algebra/html.process.json').queries,...read('algebra/claimipedia-review.process.json').queries};
const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{queries,entry:'claim.review.compare'},mode:'model',ports:valuePorts()});
const configuration=read('source/claimipedia-example.json');
const run=async(query,input)=>(await invoke({model,entry:query,input:{eventInput:input},ports:{...valuePorts(),...computationalPorts()},nested:['kernel.invoke']})).value;
test('all 48 bounded reviews correspond to the original Claimipedia evaluator',async()=>{
 for(const expected of read('source/claimipedia-correspondence.json').vectors){
  const method=configuration.methods.find(m=>m.id===expected.method);
  const actual=await run('claim.review.method',{method,evidence:configuration.evidence,selected:expected.selected});
  for(const key of ['method','result','support','challenge','independentSources'])assert.equal(actual[key],expected[key],JSON.stringify({key,expected,actual}));
 }
});
test('reasoning exposes failed conditions, omitted evidence and the equal-weight blind spot',async()=>{
 const selected=configuration.evidence.map(e=>e.id),results=await run('claim.review.compare',{configuration,selected});
 assert.deepEqual(results.map(r=>r.result),['Accepted','Conflicted','Undecided']);
 assert.equal(results[0].rows[3].admitted,false);
 assert.ok(results[0].rows[3].trials[0].checks.some(c=>c.field==='retracted'&&!c.passed));
 assert.equal(results[1].rows[3].admitted,true);
 assert.equal(results[2].independentSources,2);
 assert.equal(results[2].support,900000);
 const empty=await run('claim.review.compare',{configuration,selected:[]});
 assert.ok(empty.every(r=>r.result==='Undecided'&&r.rows.every(e=>!e.selected&&!e.admitted)));
 const row=await run('claim.review.item',{method:configuration.methods[0],evidence:configuration.evidence[2],selected});
 assert.ok(row.trials[0].checks.some(c=>c.field==='retracted'&&c.actual==='not recorded'&&!c.passed));
});
