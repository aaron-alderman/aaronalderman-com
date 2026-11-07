import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const {lower}=require('./bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const current=read('algebra/html.process.json');
const predecessor=structuredClone(current); predecessor.queries['html.escape']=[{"port":"value.string","args":{"value":"$input"},"into":"escaped"},{"fold":["list",["list","&","&amp;"],["list","<","&lt;"],["list",">","&gt;"],["list","\"","&quot;"]],"as":"replacement","accumulator":"escaped","initial":"$escaped","steps":[{"port":"text.replaceAll","args":{"value":"$escaped","search":["at","$replacement",0],"replacement":["at","$replacement",1]},"into":"escaped"}],"yield":"$escaped","into":"result"}];
async function compile(surface){return lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{entry:'html.escape',queries:surface.queries},mode:'model',ports:valuePorts(),limit:20000000});}
const [now,prior]=await Promise.all([compile(current),compile(predecessor)]);
const run=(model,entry,input)=>invoke({model,entry,input:{input},ports:valuePorts(),limit:2000000});
test('fixed-order escaping preserves the predecessor for text, markup and nonstring values',async()=>{
 const values=['','plain prose','<script>alert("x")</script>','A & B < C > D','&lt; &amp; &quot;','"quoted"',null,0,42,false,['a','b'],{a:'b'}];
 for(let i=0;i<50;i++)values.push(String.fromCharCode(32+i)+'<&>"'+String.fromCharCode(90-i));
 for(const input of values){const a=await run(now,'html.escape',input),b=await run(prior,'html.escape',input);assert.equal(a.value,b.value);assert.ok(a.usage.steps<b.usage.steps);}
});
test('complete element serialization keeps attributes and text escaped with less work',async()=>{
 const input={tag:'p',attrs:{title:'A & B "quoted"'},children:['Before < after & ',{tag:'em',attrs:{},children:['a > b']}]};
 const a=await run(now,'html.serialize',input),b=await run(prior,'html.serialize',input);assert.equal(a.value,b.value);assert.ok(a.usage.steps<b.usage.steps);
});
test('serialization still refuses event handlers and executable URL schemes',async()=>{
 for(const attrs of [{onclick:'bad()'},{href:'javascript:alert(1)'},{src:'data:text/html,bad'}])await assert.rejects(run(now,'html.serialize',{tag:'a',attrs,children:['example']}),/Invalid HTML attribute|Unsafe URL/);
});

test('publication child rendering preserves scalar, nested, CSS and unsafe-input behaviour',async()=>{
 const publication=read('algebra/publication.process.json');
 const queries={...current.queries,'publication.escape':publication.queries['publication.escape'],'publication.serialize':publication.queries['publication.serialize']};
 const previous=structuredClone({queries});
 const objectSteps=previous.queries['publication.serialize'][2].then[2].then;
 const children=objectSteps.find(s=>s.when&&s.then?.[0]?.fold).then[0];
 children.steps[2].then=[{call:'publication.serialize'}];
 const [optimized,baseline]=await Promise.all([compile({queries}),compile(previous)]);
 const examples=[
  {tag:'div',attrs:{title:'A & B "quoted"'},children:['a & b',null,false,{tag:'em',children:['inside < >']},['nested',{tag:'br'}],0]},
  {tag:'p',children:'scalar <b>'},
  {tag:'p',children:{tag:'b',children:['one child']}},
  {tag:'style',children:['x::before{content:"</sty','le><script>"}']},
  {tag:'img',attrs:{src:'/safe.png'},children:[{tag:'script',children:['ignored']}]}
 ];
 let saved=0;
 for(const input of examples){const a=await run(optimized,'publication.serialize',input),b=await run(baseline,'publication.serialize',input);assert.equal(a.value,b.value);saved+=b.usage.steps-a.usage.steps;}
 assert.ok(saved>0,'ordinary child arrays avoid the redundant generic dispatch');
 for(const input of [
  {tag:'a',attrs:{onclick:'bad()'},children:['example']},
  {tag:'a',attrs:{href:'javascript:bad()'},children:['example']},
  {tag:'style',children:[{tag:'b',children:['bad']}]}
 ])for(const model of [optimized,baseline])await assert.rejects(run(model,'publication.serialize',input),/Invalid HTML attribute|Unsafe URL|Style content/);
});
