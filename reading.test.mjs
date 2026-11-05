import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scenes,sources} from './dist/retained/world.js';
import {readings,wordMeanings,sourceGuides,sourceTitles,readingFor,activityInstructions} from './dist/retained/reading-guide.js';
import {renderWorldEncounter} from './dist/retained/world-encounters.js';
test('every stop has an authored reading and every offered term has a definition',()=>{
 assert.deepEqual(Object.keys(readings).sort(),Object.keys(scenes).sort());
 for(const [id,scene]of Object.entries(scenes)){
  const r=readingFor(id,scene);assert.ok(r.lead&&r.title,id);assert.ok(r.body.length,id);
  for(const word of r.words)assert.ok(wordMeanings[word],id+': '+word);
  if(scene.encounter&&!['horizon'].includes(scene.encounter))assert.ok(activityInstructions[id],id);
 }
 assert.equal(readingFor('personal',scenes.personal).body,scenes.personal.body);
});
test('all sources have a plain introduction while original research and full source notes remain available',async()=>{
 assert.deepEqual(Object.keys(sourceGuides).sort(),Object.keys(sources).sort());
 assert.deepEqual(Object.keys(sourceTitles).sort(),Object.keys(sources).sort());
 const app=await readFile(new URL('./dist/retained/app.js',import.meta.url),'utf8');
 assert.ok(app.includes('s.body.map('));assert.ok(app.includes('escape(source.note)'));
 assert.ok(app.includes('Read the fuller explanation'));assert.ok(app.includes('Read the original source'));
});
test('rate cards explain the same reported values as rounded percentages',()=>{
 const html=renderWorldEncounter(scenes.cost);
 assert.ok(html.includes('98.77%'));assert.ok(html.includes('1.59%'));
 assert.ok(html.includes('How much returns in the wanted form'));
});
