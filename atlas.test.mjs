import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {scenes} from './retained/world.js';
test('the independent illustrated atlas preserves all forty destinations and return paths',()=>{
 const atlas=fs.readFileSync('dist/atlas.html','utf8'),home=fs.readFileSync('dist/index.html','utf8');
 assert.ok(atlas.includes('The world keeps opening.'));assert.ok(atlas.includes('https://aaronalderman.com/atlas.html'));
 assert.equal((atlas.match(/class="atlas-place"/g)||[]).length,40);
 assert.equal((atlas.match(/class="atlas-territory"/g)||[]).length,3);
 assert.ok(home.includes('id="atlas"'));assert.ok(home.includes('href="atlas.html"'));assert.ok(!home.includes('class="atlas-place"'));assert.ok(!home.includes('class="section atlas"'));
 for(const id of Object.keys(scenes)){assert.ok(atlas.includes('href="places/'+id+'.html"'),id);assert.ok(fs.readFileSync('dist/places/'+id+'.html','utf8').includes('href="../atlas.html"'),id+' returns to the atlas');}
 for(const slug of ['unseen','human','boundary']){assert.ok(atlas.includes('href="#'+slug+'"'));assert.ok(atlas.includes('id="'+slug+'"'));}
 assert.ok(!atlas.includes('<script'));assert.ok(atlas.includes('An imagined geography for real questions'));
 const css=fs.readFileSync('dist/expedition.css','utf8');assert.ok(css.includes('.atlas-places'));assert.ok(css.includes('(prefers-reduced-motion: reduce)'));assert.ok(!css.includes('@media@media'));
 const art=JSON.parse(fs.readFileSync('source/atlas-art.json'));assert.equal(art.images.length,4);
 for(const asset of art.images){const bytes=fs.readFileSync('dist/'+asset.path);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
});
