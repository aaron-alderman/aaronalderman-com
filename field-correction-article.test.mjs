import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'parse5';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const article=read('source/the-field/correction-article.json');
const output='dist/the-field/correction/index.html';
const html=fs.readFileSync(output,'utf8');
const document=parse(html);
const attrs=n=>Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
const nodes=[];
function collect(n){nodes.push(n);for(const c of n.childNodes||[])collect(c);}
collect(document);
const text=n=>n.value??(n.childNodes||[]).map(text).join('');
const tagged=tag=>nodes.filter(n=>n.tagName===tag);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

test('the essay belongs to the Field entrance and site discovery',()=>{
 const field=fs.readFileSync('dist/the-field/index.html','utf8');
 assert.match(field,/href="correction\/"/);
 assert.match(field,/Read the essay and worked example/);
 assert.ok(fs.readFileSync('dist/sitemap.xml','utf8').includes(article.canonical));
 assert.equal(attrs(tagged('link').find(n=>attrs(n).rel==='canonical')).href,article.canonical);
 assert.ok(tagged('a').some(n=>attrs(n).href==='../../questions.html'));
 assert.ok(tagged('a').some(n=>attrs(n).class==='brand'&&text(n)==='Aaron Alderman'));
});

test('a script-free reader has a contents entry for each section and working local destinations',()=>{
 assert.equal(tagged('script').length,0);
 const ids=nodes.map(n=>attrs(n).id).filter(Boolean);
 assert.equal(ids.length,new Set(ids).size);
 assert.equal(article.sections.length,15);
 const toc=tagged('nav').find(n=>attrs(n)['aria-label']==='Article contents');
 assert.ok(toc);
 for(const section of article.sections){
  assert.ok(ids.includes(section.id),section.id);
  assert.ok(text(toc).includes(section.title),section.title);
  assert.ok(tagged('h2').some(n=>attrs(n).id===section.id+'-heading'&&text(n)===section.title));
 }
 for(const n of [...tagged('a'),...tagged('img'),...tagged('link')]){
  const target=attrs(n).href??attrs(n).src;
  if(!target||/^(https?:|mailto:)/.test(target))continue;
  const url=new URL(target,'https://local.invalid/the-field/correction/');
  const file=path.join('dist',decodeURIComponent(url.pathname));
  const destination=fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
  assert.ok(fs.existsSync(destination),target);
  if(url.hash&&destination===output)assert.ok(ids.includes(decodeURIComponent(url.hash.slice(1))),target);
 }
});

test('the visual direction remains in artwork and presentation rather than the argument',()=>{
 const main=tagged('article').find(n=>attrs(n).class==='field-essay-body');
 const body=text(main);
 for(const fragment of ['Imagine a quiet room','Return now to the luminous architecture','The room is still warm','the light does not call their departure'])assert.ok(!body.includes(fragment),fragment);
 assert.ok(body.includes('A remedy can answer a real injustice'));
 assert.ok(body.includes('You do not have to accept this framework'));
 assert.equal(tagged('math').length,9);
 assert.equal(tagged('details').filter(n=>attrs(n).class==='field-math').length,9);
 assert.ok(tagged('img').some(n=>attrs(n).src===article.hero));
 const css=fs.readFileSync('dist/the-field/correction/article.css','utf8');
 assert.ok(css.includes('background:#faf7ef'));
 assert.ok(css.includes('overflow-x:auto'));
 assert.ok(css.includes('@media (max-width: 600px)'));
});

test('published outcome counts agree with the selected-result record and retain their limits',()=>{
 const selected=read('source/the-field/correction-results.json');
 const rows=tagged('tbody')[0].childNodes.filter(n=>n.tagName==='tr');
 assert.equal(rows.length,7);
 for(let i=0;i<rows.length;i++){
  const cells=rows[i].childNodes.filter(n=>n.tagName==='td');
  for(let c=0;c<2;c++){
   const count=c===0?selected.policies[i].preservedA:selected.policies[i].preservedB;
   assert.equal(text(cells[c+1]),`${count.toLocaleString('en-US')} of ${selected.designPointsPerCaseAndPolicy.toLocaleString('en-US')}`);
  }
 }
 for(const phrase of ['12 synthetic periods','not probabilities of success','not a promise of perpetual solvency','both rules to fail','do not have to accept this framework'])assert.ok(text(document).includes(phrase),phrase);
 assert.equal(sha(fs.readFileSync('dist/source/the-field/correction-results.json')),sha(fs.readFileSync('source/the-field/correction-results.json')));
 assert.ok(!fs.existsSync('assets/the-field/correction-research-v1.zip'));
 assert.ok(!fs.existsSync('dist/assets/the-field/correction-research-v1.zip'));
 assert.ok(!fs.existsSync('assets/the-field/research'));
 assert.ok(!html.includes('Download the worked research packet'));
});

test('article content and stylesheet have admitted source owners without changing native mechanisms',()=>{
 const receipt=read('dist/build-receipt.json');
 assert.equal(receipt.sources['source/the-field/correction-article.json'],sha(fs.readFileSync('source/the-field/correction-article.json')));
 assert.equal(receipt.sources['algebra/hierarchy.process.json'],sha(fs.readFileSync('algebra/hierarchy.process.json')));
 assert.equal(receipt.artifacts['the-field/correction/index.html'],sha(fs.readFileSync(output)));
 assert.ok(read('source/stylesheets/contract.json').stylesheets.some(s=>s.source==='source/stylesheets/field-correction.json'&&s.outputs.includes('the-field/correction/article.css')));
 assert.deepEqual(receipt.nativeSources,read('source/publication-contract.json').nativeSuccessor.sha256);
});
