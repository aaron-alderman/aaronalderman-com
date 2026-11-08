'use strict';
// Read-only filesystem/receipt audit. Prints evidence; never authors application
// content, invokes a generator, grants authority, or changes publication inputs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),rel=require('../bootstrap/rel-values.cjs');
const read=f=>fs.readFileSync(path.join(root,f));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(directory,prefix=''){
  return fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>{
    if(e.name==='.git')return [];
    const file=prefix+e.name,full=path.join(directory,e.name);
    if(e.isSymbolicLink())throw Error('Catalogue refuses to follow links: '+file);
    return e.isDirectory()?walk(full,file+'/'):[file];
  });
}
function catalogue(){
  const manifest=read('bootstrap/publication.rel'),facts=rel.parse(manifest.toString('utf8'));
  const selected=p=>facts.filter(f=>f.s==='local'&&f.p===p).map(f=>f.o);
  const outputs=selected('output');if(outputs.length!==1)throw Error('Unique output required');
  const output=outputs[0],dirs=fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory()&&e.name.startsWith('.local-')).map(e=>e.name).sort();
  // During a concurrent build the selected output may not be sealed yet. Never
  // substitute a prior receipt silently: report both the selection and evidence.
  const completed=[];
  for(const dir of dirs){const receipts=path.join(root,dir,'receipts');if(!fs.existsSync(receipts))continue;
    for(const id of fs.readdirSync(receipts)){const file=dir+'/receipts/'+id+'/execution.rel';if(fs.existsSync(path.join(root,file)))completed.push({file,dir,mtime:fs.statSync(path.join(root,file)).mtimeMs});}}
  completed.sort((a,b)=>b.mtime-a.mtime);
  const evidence=completed.find(r=>r.dir===output)??completed[0];
  const receipt=evidence?rel.decode(read(evidence.file).toString('utf8')):{sources:{},basisSources:{},artifacts:{}};
  const modules=new Set(selected('module')),factSources=new Set(selected('factSource'));
  const foundation=new Set(rel.parse(read('bootstrap/foundation.rel').toString('utf8')).filter(f=>f.s==='foundation'&&f.p==='module').map(f=>f.o));
  const resourceSubjects=new Set(selected('resource'));
  const resources=new Set(facts.filter(f=>f.p==='source'&&resourceSubjects.has(f.s)).map(f=>f.o));
  const all=walk(root),files=all.filter(f=>!dirs.some(dir=>f.startsWith(dir+'/')));
  const role=f=>{
    if(f==='verification/site-catalogue.rel')return 'catalogue-snapshot';
    if(f.startsWith('source/authoring-predecessors/'))return 'retired-native-generator';
    if(f.startsWith('source/stylesheets/predecessors/'))return 'retired-stylesheet-predecessor';
    if(foundation.has(f))return 'pinned-foundation-Encounter';
    if(modules.has(f))return 'selected-Encounter';
    if(receipt.basisSources?.[f])return 'native-trust-basis';
    if(factSources.has(f))return 'selected-REL-facts';
    if(/\.html?$/.test(f))return receipt.sources?.[f]?'HTML-template-read-by-build':'HTML-comparison-evidence';
    if(resources.has(f))return 'declared-resource';
    if(receipt.sources?.[f])return 'receipt-recorded-input';
    if(f.startsWith('verification/')||/\.test\.cjs$/.test(f))return 'verification';
    if(f==='bootstrap/serve.mjs')return 'local-preview-server';
    if(/\.(cjs|mjs|js)$/.test(f)&&f.startsWith('bootstrap/'))return 'bootstrap-support';
    if(f.startsWith('source/')||f.startsWith('algebra/'))return 'unselected-source-or-evidence-review';
    if(/^(assets|temple|sourcery|retained|LICENSES)\//.test(f))return 'asset-or-retained-material-review';
    return 'repository-document-or-configuration';
  };
  return {manifest,facts,output,dirs,evidence,receipt,all,files,role,modules,factSources,resources,resourceSubjects};
}
function main(){
  if(process.argv[2]==='--check')return require('../bootstrap/test.cjs').run(['test.boundary']).catch(error=>{console.error(error);process.exitCode=1;});
  const c=catalogue(),mode=process.argv[2]??'--summary';
  const rows=[],put=(s,p,o)=>rows.push({s,p,o:String(o)});
  put('catalogue','authority','Non-atomic read-only local observation, not admission policy or independent verification. Unselected does not mean unnecessary.');
  put('catalogue','capturedAt',new Date().toISOString());
  put('catalogue','selectedOutput',c.output);put('catalogue','manifestSha256',sha(c.manifest));
  put('catalogue','executionReceipt',c.evidence?.file??'none');
  put('catalogue','receiptMatchesSelectedOutput',c.evidence?.dir===c.output);
  const groups={};let drift=0;
  for(const file of c.files){
    // A snapshot cannot contain its own hash. It is explicitly excluded.
    if(file==='verification/site-catalogue.rel')continue;
    const bytes=read(file),hash=sha(bytes),role=c.role(file);groups[role]=(groups[role]??0)+1;
    put(file,'role',role);put(file,'bytes',bytes.length);put(file,'sha256',hash);
    if(c.receipt.sources?.[file]){const matches=c.receipt.sources[file]===hash;put(file,'matchesRecordedInput',matches);if(!matches)drift++;}
  }
  for(const dir of c.dirs){const files=c.all.filter(f=>f.startsWith(dir+'/'));put(dir,'role',dir===c.output?'selected-build-output':'prior-or-incomplete-build-output');put(dir,'files',files.length);put(dir,'bytes',files.reduce((n,f)=>n+fs.statSync(path.join(root,f)).size,0));put(dir,'htmlFiles',files.filter(f=>/\.html?$/.test(f)).length);}
  if(mode==='--rel'){process.stdout.write(rel.print(rows));return;}
  if(mode==='--routes'){
    const routes=Object.keys(c.receipt.artifacts??{}).filter(f=>/\.html?$/.test(f)).sort();
    process.stdout.write(rel.print([{s:'routes',p:'executionReceipt',o:c.evidence?.file??'none'},...routes.flatMap(file=>{
      const bytes=read(c.evidence.dir+'/'+file),title=bytes.toString('utf8').match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'';
      return [{s:file,p:'title',o:title},{s:file,p:'sha256',o:sha(bytes)},{s:file,p:'matchesArtifactReceipt',o:String(sha(bytes)===c.receipt.artifacts[file])}];
    })]));return;
  }
  if(mode!=='--summary'&&mode!=='--check')throw Error('Use --summary, --rel, --routes or --check');
  console.log('Selected output: '+c.output+'\nEvidence: '+(c.evidence?.file??'none')+'\nEvidence is for selected output: '+(c.evidence?.dir===c.output)+'\nRecorded inputs changed since receipt: '+drift+'\nNon-output file roles:\n'+Object.entries(groups).map(([k,v])=>'  '+k+': '+v).join('\n'));
  console.log('Build directories:\n'+c.dirs.map(dir=>{const f=c.all.filter(f=>f.startsWith(dir+'/'));return '  '+dir+': '+f.length+' files, '+f.filter(p=>/\.html?$/.test(p)).length+' HTML';}).join('\n'));

}
if(require.main===module)main();
module.exports={catalogue};
