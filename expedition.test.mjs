import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenes, sources, entrances, territories } from './retained/world.js';
import { encounterKinds, echoes, horizons, calibrationReading, projectionVisibility } from './retained/encounter-data.js';
const root=path.dirname(fileURLToPath(import.meta.url));
test('encounters and paths beyond a territory preserve real destinations and source identity',()=>{
 for(const id of Object.keys(encounterKinds))assert.ok(scenes[id],id);
 for(const [id,echo] of Object.entries(echoes)){
  assert.ok(scenes[id]);assert.ok(scenes[echo.after]);assert.ok(scenes[echo.to]);
 }
 for(const territory of territories){
  assert.ok(horizons[territory.id].length);
  for(const path of horizons[territory.id]){
   assert.ok(scenes[path.to]);assert.ok(path.reason.length);
   assert.ok(!territory.scenes.includes(path.to),'a path beyond should cross a territory');
  }
 }
});
test('the illustrative measuring axis resolves a vertical unit difference only as it rotates toward it',()=>{
 assert.equal(calibrationReading(0),0);
 assert.equal(calibrationReading(30),0.5);
 assert.equal(calibrationReading(90),1);
 assert.ok(calibrationReading(60)>calibrationReading(30));
});
test('lifting the map preserves the record while exposing conditions and limits separately',()=>{
 assert.deepEqual(projectionVisibility('surface'),{record:true,conditions:false,limits:false});
 assert.deepEqual(projectionVisibility('conditions'),{record:true,conditions:true,limits:false});
 assert.deepEqual(projectionVisibility('limits'),{record:true,conditions:true,limits:true});
});
test('territories locate each scene exactly once and reflective studies retain their declared material',()=>{
 const ids=territories.flatMap(t=>t.scenes);
 assert.equal(new Set(ids).size,ids.length,'a station appears in more than one territory');
 assert.deepEqual([...ids].sort(),Object.keys(scenes).sort());
 for(const scene of Object.values(scenes)){
  if(scene.art==='study'){assert.equal(scene.study.length,6);assert.ok(scene.study.every(s=>typeof s==='string'&&s.length));}
  if(scene.source==='reflection'){assert.notEqual(scene.personal,true);assert.ok(scene.pause);}
 }
});
test('all passages resolve, all scenes are reachable, and every scene has a route back',()=>{
 const visit=(id,seen=new Set())=>{if(seen.has(id))return seen;assert.ok(scenes[id],id);seen.add(id);for(const c of scenes[id].choices)visit(c.to,seen);return seen;};
 const all=new Set(entrances.flatMap(e=>[...visit(e.to)]));
 assert.equal(all.size,Object.keys(scenes).length);
 for(const id of Object.keys(scenes)){const reachable=visit(id);assert.ok(entrances.some(e=>reachable.has(e.to)),`${id} has no return route`);}
});
test('each scene retains source identity and every cited local corpus file exists',()=>{
 for(const scene of Object.values(scenes))assert.ok(sources[scene.source],scene.source);
 for(const source of Object.values(sources))if(source.path)assert.ok(fs.existsSync(path.resolve(root,'../..',source.path)),source.path);
});
test('personal passages are marked as personal and cannot be mistaken for model results',()=>{
 for(const id of ['personal','care']){assert.equal(scenes[id].source,'personal');assert.equal(scenes[id].personal,true);}
 const crossover=scenes.return.choices.find(c=>c.to==='personal');assert.equal(crossover.type,'Personal association');
 assert.match(sources.personal.note,/working|revision/);
 assert.match(sources.instrument.note,/not a replay/);
});
