import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createContrastAssessor,artifactEvidence} from './tooling/assess-reading-contrast.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const assessor=await createContrastAssessor();
test('admitted contrast arithmetic handles extremes and the unrounded threshold',async()=>{
 for(const [foreground,background,expected] of [['#000000','#ffffff',21],['#ffffff','#ffffff',1],['#767676','#ffffff',4.542224959605253],['#777777','#ffffff',4.478089453577214]]){
  const r=(await assessor.ratio({foreground,background})).value;
  assert.ok(Math.abs(r.ratio-expected)<1e-10);assert.equal(r.passes,expected>=4.5);
 }
 await assert.rejects(assessor.ratio({foreground:'transparent',background:'#ffffff'}));
});
test('the original regression fails across three essays and current source evidence replays',async()=>{
 const proof=read('tooling/assurance/contrast-evidence.json'),inputs=(await assessor.input()).value;
 assert.deepEqual(proof.policy,assessor.queries);assert.equal(proof.policySha256,assessor.policySha256);
 assert.deepEqual(proof.current.inputs,JSON.parse(JSON.stringify(inputs)));
 const current=(await assessor.evaluate(inputs)).value,before=(await assessor.evaluate(proof.baseline.inputs)).value;
 assert.deepEqual(JSON.parse(JSON.stringify(current)),proof.current.report);assert.deepEqual(JSON.parse(JSON.stringify(before)),proof.baseline.report);
 assert.equal(before.failed,6);assert.equal(current.failed,0);assert.equal(current.review,0);assert.equal(current.cases.length,20);
 assert.deepEqual([...new Set(before.cases.filter(c=>c.status==='failed-source-contrast').map(c=>c.identity))].sort(),['author','dad','sourcerer']);
 assert.equal(current.browserColourEvidence,'not-collected');
 const broken=structuredClone(inputs);for(const r of broken.styles)if(r.selector.endsWith(' .masthead'))r.selector+=' a';
 const descendant=(await assessor.evaluate(broken)).value;
 assert.ok(descendant.failed>0,'Descendant colour declarations cannot satisfy a masthead surface contract');
 const rooms=read('source/reading/rooms.json');
 for(const room of rooms.rooms){const style=rooms.styles.find(s=>s.id==='reading.palette.'+room.key);assert.ok(style);for(const key of ['bg','text','muted','wash'])assert.equal(style.declarations.find(d=>d.property==='--reading-'+key)?.value,room.palette[key],'Palette intent must match authored CSS');}
 assert.deepEqual(proof.currencyInput,artifactEvidence());
 assert.deepEqual(proof.currentness,JSON.parse(JSON.stringify((await assessor.currentness(proof.currencyInput)).value)));
 assert.deepEqual(read('dist/assurance/contrast.json'),proof);
});
test('changed dependencies and new routes never inherit a current browser claim',async()=>{
 const input={capturedBindings:{'old.html':'same','site.css':'old'},currentBindings:{'old.html':'same','new.html':'new','site.css':'changed'},routes:['old.html','new.html']};
 const r=(await assessor.currentness(input)).value;
 assert.equal(r.byRoute['old.html'].status,'needs-browser-recapture');assert.equal(r.byRoute['new.html'].status,'needs-browser-recapture');
 assert.equal(r.browserColourEvidence,'not-collected');
});
