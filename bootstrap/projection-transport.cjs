'use strict';
// Mechanical identity transport only. Encounter defines the tree, renderer,
// variants, composition rules and output admission. Receipts cannot mint entries.
function projectionTransport({authorize,hash,clone,classes=[]}){
  const issued=new Map();
  const palette=new Set(classes);
  const remember=(text,entry)=>{issued.set(hash(text),{...entry,text});return text;};
  function render(args,gate){
    const decide=(query,input)=>authorize(query,input,gate);
    const packet=decide('projection.render',{kind:args.kind,tree:clone(args.tree),classes:[...palette]});
    for(const name of packet.classes)palette.add(name);
    return remember(packet.text,{kind:packet.kind,tree:packet.tree});
  }
  function combine(args,gate){
    const entries=args.parts.map(text=>issued.get(hash(text))??null);
    const packet=authorize('projection.combine',{kind:args.kind,parts:args.parts,entries:entries.map(entry=>entry?{kind:entry.kind,tree:entry.tree}:null)},gate);
    for(const name of packet.classes)palette.add(name);
    return remember(packet.text,{kind:packet.kind,tree:packet.tree});
  }
  function identity(text){const entry=issued.get(hash(text));return entry&&entry.text===text?entry:null;}
  function admitOutput({name,bytes,text,issuedRuntime=false,sourceAsset=false},gate){
    const entry=typeof text==='string'?identity(text):null;
    try{return authorize('host.output',{name,bytes,issuedRuntime,sourceAsset,issuedProjection:entry?.kind??null},gate);}
    catch(error){error.message+=' Output: '+name;throw error;}
  }
  return Object.freeze({render,combine,identity,admitOutput,classes:()=>[...palette]});
}
module.exports={projectionTransport};
