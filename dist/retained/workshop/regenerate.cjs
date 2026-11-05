// Rebuild the model from the bundled semantic owners; no external checkout or packages.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const root=path.join(__dirname,'sources'),load=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
(async()=>{
 const {fixture}=require(path.join(root,'bootstrap/encounter-code-fixture.cjs'));
 const {lower}=require(path.join(root,'bootstrap/ports/algebra-lower.cjs'));
 const {valuePorts}=require(path.join(root,'bootstrap/ports/value.cjs'));
 const {listing}=await import(pathToFileURL(path.join(__dirname,'listing.js')).href);
 const f=await fixture(),lab=load('algebra/lab.process.json');
 const added={entry:'lab.snapshot',queries:{...load('algebra/language.process.json').queries,...lab.queries}};
 const lowered=await lower({compiler:load('algebra/lowering.process.json'),definitions:f.inputs.definitions,primitives:f.inputs.primitives,input:added,mode:'model',ports:valuePorts()});
 Object.assign(f.model.queries,lowered.queries);
 await f.call('admit.model',{}, {target:f.model,profile:f.inputs.profile});
 const original=await f.prepare();
 const previous=JSON.parse(fs.readFileSync(path.join(__dirname,'fixture.json'),'utf8'));
 const hashes=previous.hashes.map(({file})=>({file,hash:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));
 const runtime=load('algebra/encounter-code-runtime.process.json').queries;
 const runtimeListings={resolve:listing(runtime['ec.resolve']),patch:listing(runtime['ec.patch']),corePatch:listing(f.model.queries['ec.patch']),serialize:listing(f.model.queries['html.serialize']),live:listing(lab.queries['lab.edit'])};
 fs.writeFileSync(path.join(__dirname,'fixture.json'),JSON.stringify({model:f.model,original,hashes,runtimeListings}));
 const projections=await f.run(original),page=projections.find(p=>p.output.type==='Page');
 fs.writeFileSync(path.join(__dirname,'encounter-story.html'),(await f.call('html.serialize',{}, {input:page.output.tree})).value);
 console.log('Recompiled and admitted the bundled source. Reload the example to use it.');
})().catch(e=>{console.error(e);process.exitCode=1;});
