'use strict';
// Fixed mechanical bootstrap packaging. Policy remains fetched Encounter source.
const rel=require('./rel-values.cjs');
const {syntaxMechanisms}=require('./seed-source-reader.cjs');
const {sourceFrontMechanisms}=require('./encounter-source-front.cjs');
const {policyMechanisms}=require('./source-policy-machine.cjs');
const {synchronousSeed}=require('./seed-sync.cjs');
const {createKernel}=require('./temple-seed.cjs');
const {regexpTask,trustedRegexObservations,isolatedRegexp}=require('./isolated-regexp.cjs');
const {valuePorts}=require('./ports/value.cjs'),{computationalPorts}=require('./ports/browser-effects.cjs');
function emitFoundation({module=true}={}){
  return "'use strict';\n"+
    'const rel=('+rel.relMechanisms.toString()+')();\n'+valuePorts.toString()+'\n'+computationalPorts.toString()+'\n'+createKernel.toString()+'\n'+
    'createKernel.operators=Object.freeze(rel.decode('+rel.quote(rel.encode([...createKernel.operators]))+'));\n'+
    'const {parseEncounter:readSeed}=('+syntaxMechanisms.toString()+')({atom:rel.atom});\n'+
    synchronousSeed.toString()+'\n'+policyMechanisms.toString()+'\n'+sourceFrontMechanisms.toString()+'\n'+regexpTask.toString()+'\n'+trustedRegexObservations.toString()+'\n'+isolatedRegexp.toString()+'\n'+
    'function createPolicy(descriptor,observations,hash){return policyMechanisms({readSeed,createKernel,synchronousSeed,rel,valuePorts,numberCalculate:computationalPorts()["number.calculate"],hash,regexObservations:trustedRegexObservations()}).sourcePolicyMachine(descriptor,observations);}\n'+
    'function createCompiler(hash,policy,regexp){return sourceFrontMechanisms({createKernel,rel,policy,hash,regexp}).createFrontDoor;}\n'+
    (module?'export {rel,readSeed,createCompiler,createPolicy};\n':'');
}
module.exports={emitFoundation};
