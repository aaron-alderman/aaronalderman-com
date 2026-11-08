'use strict';
const {observeHtml:observe}=require('./markup-observation.cjs');
const {observeXml}=require('./xml-observer.cjs');
function admitMarkup(text,options={},gate){
  const policy=require('./source-policy-machine.cjs').getSourcePolicyMachine();
  const decide=(query,input)=>gate?gate.authorize(query,input):policy.compute(query,input).value;
  decide('surface.source',{text});
  const root=options.xml?observeXml(text):observe(text);
  return decide('surface.tree',{root,xml:Boolean(options.xml),base:options.base??'https://publication.invalid/',frame:Boolean(options.frame),mode:options.mode??'stage',artifacts:options.artifacts??{},projectionIssued:Boolean(options.projectionIssued),sourceAsset:Boolean(options.sourceAsset)});
}
module.exports={observe,admitMarkup};
