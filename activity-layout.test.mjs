import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {scenes} from './retained/world.js';
test('every embedded activity keeps its artwork visible independently of reader breakpoints',()=>{
 const css=fs.readFileSync('dist/activity.css','utf8');
 const rule=css.match(/\.art-panel\{([^}]+)\}/)?.[1];
 assert.ok(rule?.includes('display:block !important;'),'embedded artwork must override the reader’s narrow personal-page hide rule');
 assert.ok(fs.readFileSync('retained/style.css','utf8').includes('.scene.personal .art-panel{display:none}'),'retain the original reader CSS; the embed owns its override');
 assert.ok(fs.readFileSync('dist/retained/activity.html','utf8').includes('../activity.css?v=layout-2'));
 for(const id of Object.keys(scenes)){
  const html=fs.readFileSync('dist/places/'+id+'.html','utf8');
  assert.ok(html.includes('../retained/activity.html?v=algebra-1#'+id),id+' requests the corrected embed document');
  assert.ok(html.includes('loading="lazy"'),id+' retains deferred loading');
 }
});
