'use strict';
// Verification-only owner resolution. No parsing grammar or execution policy.
const fs=require('node:fs');
function readProcessFixture(file){
 const path=file.replace(/^\.\//,''),manifest=JSON.parse(fs.readFileSync('bootstrap/site.json','utf8'));
 if(process.env.BATCH_PROCESS_LEG==='candidate'){
  const ledger=JSON.parse(fs.readFileSync('source/process-authoring/batch-02/ledger.json','utf8')),entry=ledger.entries.find(e=>e.json===path);
  if(entry)return JSON.parse(fs.readFileSync('.build/batch-02-compiled/'+entry.name+'.json','utf8'));
 }
 const owner=manifest.processModules?.find(s=>s.output===path);
 return JSON.parse(fs.readFileSync(owner?'dist/'+path:path,'utf8'));
}
module.exports={readProcessFixture};
