'use strict';
// Generic Encounter test discovery and reporting. Every test and fixture is
// source hydrated and admitted by the existing Encounter compiler/front door.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),{mechanisms}=require('./test-mechanisms.cjs');
const {createFrontDoor}=require('./encounter-source-front.cjs');
const machine=require('./source-policy-machine.cjs').getSourcePolicyMachine();
async function main(filters=process.argv.slice(2)){
  const directory=path.join(root,'verification/tests');
  const files=fs.readdirSync(directory).filter(f=>f.endsWith('.encounter')).sort();
  const sources=files.map(file=>({file:'verification/tests/'+file,text:fs.readFileSync(path.join(directory,file),'utf8')}));
  const digest=text=>require('node:crypto').createHash('sha256').update(text).digest('hex');
  const snapshot=[...sources.map(s=>({file:s.file,sha256:digest(s.text)})),...machine.identities,
    ...['bootstrap/foundation.rel','bootstrap/publication.rel'].map(file=>({file,sha256:digest(fs.readFileSync(path.join(root,file)))}))];
  const names=sources.flatMap(s=>{const compiled=machine.compile(s.file,s.text).value;if(!compiled.ok)throw Error(s.file+': '+require('node:util').inspect(compiled.diagnostic));return Object.keys(compiled.surface.queries);});
  const selected=names.filter(name=>name.startsWith('test.')&&(!filters.length||filters.some(filter=>name.includes(filter)))).sort();
  if(!selected.length)throw Error('No Encounter tests selected');
  let failures=0;
  console.log('TAP version 13');
  console.log('# policy basis '+machine.basis);
  console.log('# canonical declaration '+snapshot.at(-1).sha256);
  const ports=mechanisms(),front=createFrontDoor({ports,profiles:{test:Object.keys(ports)},basis:'encounter-test-runner'});
  const handle=front.admit(front.link(sources.map(s=>front.hydrate(s.file,s.text))),{profile:'test',entries:names});
  for(const [index,name]of selected.entries()){
    try{
      ports['mechanism.reset']();
      await front.run(handle,name,{input:{snapshot}});
      console.log('ok '+(index+1)+' - '+name);
    }catch(error){failures++;console.log('not ok '+(index+1)+' - '+name);console.log('  ---\n  context: '+JSON.stringify(ports['diagnostic.read']())+'\n  message: '+String(error.stack??error).replaceAll('\n','\n    ')+'\n  ...');}
  }
  console.log('1..'+selected.length);console.log('# tests '+selected.length+'\n# pass '+(selected.length-failures)+'\n# fail '+failures);
  process.exitCode=failures?1:0;
}
function run(filters){return main(filters).finally(()=>require('./isolated-regexp.cjs').nodeRegexp().close());}
module.exports={run};
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
