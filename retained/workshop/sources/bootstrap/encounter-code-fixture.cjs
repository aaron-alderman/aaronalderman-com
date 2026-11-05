'use strict';
// Test fixture only: the application compiler and assurance remain process algebra.
const fs=require('node:fs'),path=require('node:path');
const {createKernel}=require('./temple-seed.cjs'),{lower}=require('./ports/algebra-lower.cjs'),{valuePorts}=require('./ports/value.cjs'),{invoke}=require('./ports/programme.cjs');
const root=path.join(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),load=file=>JSON.parse(read(file));
async function fixture(){
  const files=['source','fact-index','lowering','admission','html','encounter-code-types','encounter-code-compiler','encounter-code-runtime'];
  const surface={entry:'ec.prepare',queries:Object.assign({},...files.map(file=>load('algebra/'+file+'.process.json').queries))};
  const definitions=load('algebra/operators.expression.json'),primitives=Array.from(createKernel.operators),profile=load('bootstrap/kernel-profile.json');
  const model=await lower({compiler:load('algebra/lowering.process.json'),definitions,primitives,input:surface,mode:'model',ports:valuePorts()});
  const inputs={codeText:read('source/experiment/story.encounter'),factText:read('source/experiment/story.rel'),contractText:read('source/experiment/contracts.rel'),definitions,primitives,profile};
  const call=async(entry,eventInput,extra={})=>invoke({model,entry,input:{eventInput,...extra},ports:valuePorts(),nested:['kernel.invoke','kernel.execute','kernel.evaluate']});
  return {model,inputs,call,prepare:async changes=>(await call('ec.prepare',{...inputs,...changes})).value,run:async candidate=>(await call('ec.run',{candidate})).value};
}
module.exports={fixture};
if(require.main===module)fixture().then(async f=>{const p=await f.call('ec.prepare',f.inputs);console.log('prepare',p.usage);const r=await f.run(p.value);console.log(JSON.stringify(r,null,2));}).catch(e=>{console.error(e);process.exitCode=1});
