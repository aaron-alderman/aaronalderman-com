import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createRuntimePort}=require('../bootstrap/hosts/runtime.cjs');

// Decode data only, then reproduce the entire executable envelope from the
// pinned native factories. A snapshot marker alone cannot vouch for a script.
export async function auditBrowserBundle(source) {
  const snapshot=name=>{
    const prefix='\nconst '+name+'=hydrateSnapshot(';
    const start=source.indexOf(prefix);
    if(start<0)throw Error('Missing '+name+' snapshot');
    const literal=source.slice(start+prefix.length).match(/^"(?:[^"\\]|\\.)*"/);
    if(!literal)throw Error('Invalid '+name+' snapshot');
    return JSON.parse(JSON.parse(literal[0]));
  };
  const model=snapshot('model'),factIndex=snapshot('factIndex');
  const grantText=source.match(/\nconst grants=(\[[^\r\n]*\]);\r?\n/);
  if(!grantText)throw Error('Missing effect grants');
  const grants=JSON.parse(grantText[1]);
  const generate=createRuntimePort(model,[],{audit:grants},async()=>factIndex);
  const expected=await generate({entry:model.entry,mode:'browser',queries:Object.keys(model.queries),factSubjects:[],data:model.data,budget:model.budget,grantProfile:'audit'});
  if(source!==expected)throw Error('Browser bundle differs from the complete native envelope');
  return {entry:model.entry,queries:Object.keys(model.queries).length,grants};
}
