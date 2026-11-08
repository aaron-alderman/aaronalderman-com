'use strict';
// Mechanical Node loader: hash the exact captured bytes passed to _compile.
// The launcher/loader and Node are the explicit bootstrap trust root.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module');
const identities=new Map();let active=false;
function start(){
  if(active)throw Error('Native loader already active');active=true;
  const root=path.resolve(__dirname,'..'),original=Module._extensions['.js'];
  Module._extensions['.js']=function loaded(module,file){
    const relative=path.relative(root,file);
    if(relative.startsWith('..')||path.isAbsolute(relative))return original(module,file);
    const bytes=fs.readFileSync(file),source=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
    const sha256=crypto.createHash('sha256').update(bytes).digest('hex');identities.set(relative.split(path.sep).join('/'),sha256);
    module._compile(source,file);
  };
  return require('./local.cjs').main(process.argv[2]??'bootstrap/publication.rel');
}
function loadedIdentities(){if(!active)throw Error('Publication requires the captured-byte native loader');return Object.fromEntries(identities);}
module.exports={start,loadedIdentities};
