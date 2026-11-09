'use strict';
// Read-only source inspection; no native application parser or admission path.
function parseEncounter(text,file='inspection.encounter',observe=false){
  const machine=require('./source-policy-machine.cjs').getSourcePolicyMachine(),crypto=require('node:crypto');
  machine.compute('foundation.sourceBounds',{file,text});
  const identity=crypto.createHash('sha256').update(text).digest('hex');
  const hydrated=machine.compute('foundation.hydrate',{text,file,expectedTextSha256:identity,expectedBasis:machine.basis}).value;
  return observe?hydrated.inspection:hydrated.surface;
}
module.exports={parseEncounter};
