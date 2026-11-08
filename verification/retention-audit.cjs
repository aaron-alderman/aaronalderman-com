'use strict';
// Read-only retention and source-ownership audit. No application preparation,
// compilation, admission, filesystem writes, removal or publication.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {catalogue}=require('./site-catalogue.cjs'),rel=require('../bootstrap/rel-values.cjs');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const snapshots=new Set(['verification/site-catalogue.rel','verification/retention-register.rel']);
function audit(){
  const c=catalogue(),foundation=rel.parse(read('bootstrap/foundation.rel').toString('utf8'));
  const pinned=new Set(foundation.filter(f=>f.s==='foundation'&&f.p==='module').map(f=>f.o));
  const files=new Set(c.files),texts=new Map(),identities=new Map(),references=new Map();
  for(const file of c.files){
    if(snapshots.has(file))continue;
    const bytes=read(file);identities.set(file,{sha256:hash(bytes),bytes:bytes.length});
    if(/\.(?:rel|encounter|cjs|mjs|js|md|txt|html|css|yml)$/.test(file))texts.set(file,bytes.toString('utf8'));
  }
  const ref=(target,from)=>{if(files.has(target)&&target!==from){if(!references.has(target))references.set(target,new Set());references.get(target).add(from);}};
  for(const [from,text]of texts){
    for(const match of text.matchAll(/(?:source|algebra|bootstrap|assets|retained|temple|sourcery|tooling|verification|LICENSES)\/[a-zA-Z0-9_./@-]+/g)){
      let target=match[0];if(!files.has(target)&&target.endsWith('.'))target=target.slice(0,-1);ref(target,from);
    }
    for(const match of text.matchAll(/(?:require\s*\(\s*|from\s*)['"](\.[^'"]+)['"]/g))ref(path.posix.normalize(path.posix.join(path.posix.dirname(from),match[1])),from);
  }
  const css=rel.decode(read('source/stylesheets/contract.values.rel').toString('utf8')).stylesheets;
  const comparisons=new Map(css.map(s=>[s.comparison,s.source]));
  const alternate=new Set(['source/father/growing-up/preview.rel','source/reading-palette/projection.encounter','source/reading/reading-room.rel']);
  const docs={
    'AGENTS.md':['Controlling owner instructions and source boundary','AGENTS.md'],
    'README.md':['Current local publication and verification commands','bootstrap/publication.rel'],
    'WEBSITE-CATALOGUE.md':['Human directory, HTML, route and archive navigation','bootstrap/publication.rel'],
    'RETENTION-AUDIT.md':['Retention findings and canonical ownership map','bootstrap/publication.rel'],
    '.gitignore':['Exclude local staging, caches and personal state from Git','.gitignore'],
    '.gitattributes':['Repository text and binary handling','.gitattributes'],
    '.github/workflows/pages.yml':['Pages workflow through the canonical declaration, captured-byte build and Encounter checks; publishing changes owned by the other chat','.github/workflows/pages.yml'],
    '.github/workflows/authoring-provenance.yml':['Pull-request qualification through the canonical build and Encounter test runner','.github/workflows/authoring-provenance.yml'],
    'LICENSE.md':['Project licensing and attribution requirements','LICENSE.md'],
    'STEWARDSHIP.md':['Stewardship guidance, not executable publication policy','STEWARDSHIP.md'],
    'CHRISTIAN_STEWARDSHIP_COVENANT.md':['Voluntary covenant and its legal scope','CHRISTIAN_STEWARDSHIP_COVENANT.md'],
    'CNAME':['Published domain binding','CNAME'],'.nojekyll':['Static hosting marker','.nojekyll'],
    'bootstrap/serve.mjs':['Local preview of the declaration-selected output','bootstrap/publication.rel'],
    'bootstrap/publication.rel':['Sole canonical publication selection and output declaration','bootstrap/publication.rel'],
    'bootstrap/foundation.rel':['Pinned operative compiler, lowering and admission source identities','bootstrap/foundation.rel'],
    'bootstrap/launch.cjs':['Captured-byte Node entry for the generic publication host','bootstrap/launch.cjs'],
    'bootstrap/native-loader.cjs':['Capture exact native bytes loaded by the launcher','bootstrap/launch.cjs'],
    'source/admission/reconstitution.rel':['Historical boundary requirements and implementation obligations; not executable admission','AGENTS.md'],
    'source/reading-palette/README.md':['Reading design-system owner map and verification guidance','source/reading-palette/index.rel'],
    'source/microsites/RECOMPOSITION.md':['Historical correspondence account; legacy reproduction commands are superseded','README.md'],
    'assets/father/growing-up/provenance.rel':['Illustration origin, prompts, original/derivative identities','assets/father/growing-up/provenance.rel'],
    'assets/fonts/README.md':['Font origin and license guidance','assets/fonts/README.md'],
    'bootstrap/vendor/SOURCES.rel':['Parser package origins, versions and native-trust scope','bootstrap/vendor/SOURCES.rel']
  };
  function describe(file){
    const result=(purpose,owner,authority,disposition='retain')=>({purpose,owner,authority,disposition});
    if(file==='evidence/README.md')return result('Evidence boundary and interpretation guidance','bootstrap/publication.rel','Documentation; no execution authority');
    if(file==='evidence/relocations.rel')return result('Exact identities and physical mapping of the 97 separated historical records','bootstrap/publication.rel','Relocation receipt, not publication policy');
    if(file.startsWith('evidence/projection-components/'))return result('Retired HTML template retained for comparison with the common projection components','source/projection/components.rel','Historical comparison evidence; never a live template','retain-separated-evidence');
    if(file.startsWith('evidence/artwork/'))return result('Attributed generation or same-session encoding verification receipt','assets/father/growing-up/provenance.rel','Artwork provenance evidence; original claims and current byte verification remain distinct');
    if(file.startsWith('evidence/')){const original=file.slice('evidence/'.length),record=describe(original);return {...record,purpose:record.purpose+'; original logical location: '+original,disposition:'retain-separated-evidence'};}
    if(docs[file])return result(...docs[file],'Documentation, configuration or explicitly scoped mechanism');
    if(file==='source/algebra/fact-index.encounter')return result('Retired duplicate fact-index source; tests use the canonical production owner','algebra/fact-index/facts.index.encounter','Retired comparison copy','requires-review');
    if(file==='assets/father/growing-up/series-coastal-workshop-v1.png')return result('Verified original for the served series JPEG; original receipt and reproducible encoding relation are pinned in canonical provenance','assets/father/growing-up/provenance.rel','Original artwork retained for attribution and reproducible derivation');
    if(alternate.has(file))return result('Superseded standalone reading preview; retained only for historical qualification, not normal publication','bootstrap/publication.rel','Historical alternate composition; not a current source owner','retire-after-active-reading-work');
    if(pinned.has(file))return result('Operative compiler/admission/lowering source pinned by the foundation descriptor',file,'Encounter source selected by bootstrap/foundation.rel');
    if(c.modules.has(file))return result('Publication or browser programme: '+[...(texts.get(file)??'').matchAll(/^process\s+([\w.-]+):/gm)].map(m=>m[1]).join(', '),file,'Current Encounter source selected by bootstrap/publication.rel');
    if(file.startsWith('source/projection/')&&file.endsWith('.encounter'))return result('Concurrent common-projection definition/composition work; preserve for the other chat',file,'Unselected active work; not qualified by the completed retention-cleanup receipt','preserve-concurrent-work');
    if(comparisons.has(file))return result('Captured stylesheet used to compare structured CSS; edit the declared REL owner instead',comparisons.get(file),'Comparison evidence only');
    if(file==='algebra/operators.expression.values.rel')return result('Retained operator-table display/comparison data; operative laws are authored in Encounter','source/foundation/laws.encounter','Non-operative display table','separate-evidence-on-next-manifest-revision');
    if(file.startsWith('algebra/')&&file.endsWith('.rel'))return result('Retained process-model/coordinate comparison data; selected Encounter definitions generate current inspection models','bootstrap/publication.rel','Historical inspection data, never programme admission','separate-evidence-on-next-manifest-revision');
    if(file.startsWith('bootstrap/test-data/'))return result('Adversarial declaration/native-injection fixture for front-door refusal tests','verification/tests/front-door.encounter','Verification fixture only');
    if(file.startsWith('bootstrap/vendor/'))return result(/(?:LICENSE)$/.test(file)?'Required parser/dependency license text':'Pinned generic parser package member; retained package support, not application policy','bootstrap/vendor/SOURCES.rel','Third-party native mechanism or attribution');
    if(file.startsWith('bootstrap/')&&/\.cjs$/.test(file))return result(file.endsWith('.test.cjs')?'Regression verification: '+path.posix.basename(file):'Generic host, primitive/codec, mechanical effect or source-observation support: '+path.posix.basename(file),file,file.endsWith('.test.cjs')?'Read-only verification':c.receipt.basisSources?.[file]?'Receipt-recorded native trust basis':'Native launcher/wrapper support; outside application authorship');
    if(file.startsWith('bootstrap/')&&file.endsWith('.values.rel'))return result('Retained profiles/frontend/catalogue data used by inspection; not a second publication declaration','bootstrap/publication.rel','Display/inspection data; AGENTS.md and current declaration supersede old launch semantics');
    if(file.startsWith('source/assurance/historical-capture/'))return result('Attributed captured browser/layout evidence served by the assurance catalogue','algebra/publication/assurance.catalogue.build.encounter','Historical observation, not fresh qualification');
    if(file.startsWith('source/hierarchy-evidence/'))return result('Pinned external/project evidence for hierarchy and world descriptions','source/hierarchy-evidence.values.rel','Attributed supporting source, not programme authority');
    if(file.startsWith('source/process-authoring/')||file.startsWith('source/authoring/')||file==='source/authoring-contract.values.rel'||file==='source/authoring-predecessors.values.rel'||file.startsWith('source/retired-build-helpers/'))return result('Historical authoring/migration contract, request, oracle or retirement receipt; preserved for provenance and inspection','bootstrap/publication.rel','Historical evidence; current authoring follows AGENTS.md and selected Encounter sources','separate-evidence-on-next-manifest-revision');
    if(file==='source/microsites/temple/oracle/films/manifest.values.rel')return result('Captured original film manifest for correspondence; published counterpart has the same bytes','temple/films/manifest.values.rel','Comparison original, not current media owner');
    if(file.startsWith('source/microsites/')&&file.includes('/oracle/'))return result('Captured original microsite document, style or media manifest for correspondence','source/microsites/originals.values.rel','Comparison original, not current page source');
    if(file.startsWith('source/faith/sources/'))return result('Attributed reading source text for faith material','source/faith/reading.values.rel','Supporting content source');
    if(file.startsWith('source/values/'))return result('Typed REL value cell referenced from canonical fact sources; numeric filenames identify fact slots', [...(references.get(file)??[])].find(f=>c.factSources.has(f))??'bootstrap/publication.rel','Static content/value data, not executable source');
    if(file.startsWith('source/')&&/\.html$/.test(file))return result('Markup template read by the current publisher; composition/behaviour stays in selected Encounter',file,'Selected passive template');
    if(file.startsWith('source/')&&/\.(rel|txt)$/.test(file))return result(file.endsWith('.txt')?'Retained workshop explanatory text; old authoring commands are historical':'Canonical static content, presentation, contract or attributed evidence: '+file,file,file.endsWith('.txt')?'Published explanatory data; root README controls current commands':c.factSources.has(file)?'Selected REL facts':'Declared static REL resource; no execution authority');
    if(file.startsWith('assets/'))return result('Original or derivative publication asset, font or associated license: '+file,file,'Passive asset; provenance and license retained');
    if(/^(temple|sourcery)\//.test(file))return result('Retained microsite media, subtitle or media provenance: '+file,file,'Passive media/provenance');
    if(file==='retained/CNAME')return result('Domain marker inside the retained website; current domain changes belong to root CNAME','CNAME','Retained metadata copy');
    if(file==='retained/workshop/encounter-story.html')return result('Original story page kept as comparison evidence; current route is composed by Encounter','algebra/publication/publication.build.encounter','Historical comparison original, not a publication template');
    if(file.startsWith('retained/')&&file.endsWith('.html'))return result('Original retained page kept as comparison evidence; current routes are composed by Encounter','algebra/reader-workshop-publication/readerworkshop.build.encounter','Historical comparison original, not a publication template');
    if(file.startsWith('retained/'))return result('Retained passive workshop material, metadata or sandbox example',file,'Attributed retained asset/fixture, not the main application authoring path');
    if(file.startsWith('LICENSES/'))return result('Full text of a license referenced by retained sources and project attribution','LICENSE.md','Attribution/legal source');
    if(file.startsWith('tooling/'))return result('Captured browser evidence supporting the published assurance views','algebra/publication/assurance.catalogue.build.encounter','Historical verification evidence');
    if(file==='verification/compiler-boundary-audit.cjs')return result('Historical boundary audit and old-build inventory; current qualification uses source-policy-audit.cjs','verification/source-policy-audit.cjs','Historical reproducer, not current qualification');
    if(file.startsWith('verification/tests/')&&file.endsWith('.encounter'))return result('Encounter test scenarios, assertions or source-owned behavioural fixtures',file,'Compiled, hydrated and admitted by bootstrap/test.cjs; verification authority only');
    if(file.startsWith('verification/'))return result(/\.(cjs)$/.test(file)?'Descriptive inventory or Encounter check launcher: '+path.posix.basename(file):'Named local test, preservation, release or audit receipt: '+path.posix.basename(file),file,'Verification/evidence only; receipt date and scope control its claims');
    if(['completion-review.values.rel','preservation-receipt.values.rel'].includes(file))return result('Retained publication completion/preservation review displayed with assurance material',file,'Attributed review data, not admission policy');
    return result('No justified retention purpose found','NONE','Unclassified','requires-review');
  }
  const records=c.files.map(file=>({file,...describe(file),identity:identities.get(file),refs:[...(references.get(file)??[])].sort()}));
  const duplicates=[],crossImageNames=[];
  const imageOwners=[];
  // Foundation and application are distinct admitted images. Equal names
  // across those images do not establish competing owners within either image.
  for(const [image,selection]of [['publication',c.modules],['foundation',pinned]]){
    const owners=new Map();
    for(const file of selection)for(const m of (texts.get(file)??'').matchAll(/^process\s+([\w.-]+):/gm)){
      const prior=owners.get(m[1]);if(prior&&prior!==file)duplicates.push({image,query:m[1],owners:[prior,file]});else owners.set(m[1],file);
    }
    imageOwners.push(owners);
  }
  for(const [query,file]of imageOwners[0])if(imageOwners[1].has(query)&&imageOwners[1].get(query)!==file)crossImageNames.push({query,owners:[file,imageOwners[1].get(query)]});
  const selectedPaths=c.facts.filter(f=>f.s==='local'&&['module','factSource','input'].includes(f.p)||f.p==='source'&&c.resourceSubjects.has(f.s)).map(f=>f.o);
  const sourceOutputOverlap=selectedPaths.filter(f=>f===c.output||f.startsWith(c.output+'/')||f.startsWith('.local-'));
  for(const f of c.facts.filter(f=>f.s==='local'&&f.p==='input'))if(c.output.startsWith(f.o+'/'))sourceOutputOverlap.push('Output is nested under input root: '+f.o);
  const drift=Object.entries(c.receipt.sources??{}).filter(([f,h])=>identities.has(f)&&identities.get(f).sha256!==h).map(([f])=>f);
  const rewritten=Object.entries(c.receipt.sources??{}).filter(([f,h])=>c.receipt.artifacts?.[f]&&c.receipt.artifacts[f]!==h).map(([f])=>f);
  const byteGroups=new Map();
  for(const r of records)if(r.identity?.bytes){const group=byteGroups.get(r.identity.sha256)??[];group.push(r.file);byteGroups.set(r.identity.sha256,group);}
  const sameBytes=[...byteGroups.values()].filter(g=>g.length>1);
  return {c,records,duplicates,crossImageNames,sourceOutputOverlap,drift,rewritten,sameBytes};
}
function main(){
  if(process.argv[2]==='--check')return require('../bootstrap/test.cjs').run(['test.retention']).catch(error=>{console.error(error);process.exitCode=1;});
  const a=audit(),mode=process.argv[2]??'--summary',rows=[],put=(s,p,o)=>rows.push({s,p,o:String(o)});
  put('retention.audit','capturedAt',new Date().toISOString());put('retention.audit','authority','Non-atomic local verification only. Purpose records neither change publication selection nor prove minimality.');
  put('retention.audit','canonicalDeclaration','bootstrap/publication.rel');put('retention.audit','manifestSha256',hash(a.c.manifest));put('retention.audit','selectedOutput',a.c.output);put('retention.audit','executionReceipt',a.c.evidence?.file??'none');
  for(const r of a.records){put(r.file,'purpose',r.purpose);put(r.file,'sourceOfTruth',r.owner);put(r.file,'authority',r.authority);put(r.file,'disposition',r.disposition);if(r.disposition==='separate-evidence-on-next-manifest-revision')put(r.file,'proposedLocation','evidence/'+r.file);if(r.identity){put(r.file,'sha256',r.identity.sha256);put(r.file,'bytes',r.identity.bytes);}else put(r.file,'hashExclusion','Catalogue/register snapshot excluded to prevent self-reference');put(r.file,'recordedInput',!!a.c.receipt.sources?.[r.file]);put(r.file,'recordedArtifact',!!a.c.receipt.artifacts?.[r.file]);put(r.file,'textReferenceCount',r.refs.length);for(const from of r.refs.slice(0,5))put(r.file,'referencedBy',from);}
  for(const file of a.rewritten)put(file,'finding','Source/comparison bytes differ from generated artifact at the same relative output path. Output is not an editable source.');
  for(const item of a.crossImageNames)put(item.query,'separateImageOwners',item.owners.join(' | '));
  for(const group of a.sameBytes)for(const file of group.slice(1))put(file,'sameBytesAs',group[0]);
  for(const dir of a.c.dirs){put(dir,'purpose',dir===a.c.output?'Selected generated publication; preview and preservation tests use this output':dir==='.local-qualified-01'?'Historical boundary verification evidence; native reproducer retired':'Other chat output/staging or earlier fallback; protected from audit relocation');put(dir,'sourceOfTruth','bootstrap/publication.rel');put(dir,'authority','Generated output only; forbidden as authoring input');put(dir,'disposition','preserve-active-work-or-verification-dependency');}
  if(mode==='--rel'){process.stdout.write(rel.print(rows));return;}
  if(!['--summary','--check'].includes(mode))throw Error('Use --summary, --rel or --check');
  const counts={};for(const r of a.records)counts[r.disposition]=(counts[r.disposition]??0)+1;
  console.log('Files with retention records: '+a.records.length+'\nSelected output: '+a.c.output+'\nReceipt: '+a.c.evidence?.file+'\nCurrent receipt matches selection: '+(a.c.evidence?.dir===a.c.output)+'\nChanged recorded inputs: '+a.drift.length+'\nSource/output selection overlap: '+a.sourceOutputOverlap.length+'\nDuplicate selected Encounter process names: '+a.duplicates.length+'\nInput/output paths with different bytes: '+a.rewritten.length+'\nDispositions: '+Object.entries(counts).map(([k,v])=>k+'='+v).join(', '));
  for(const r of a.records.filter(r=>r.disposition==='requires-review'))console.log('UNCLASSIFIED '+r.file);

}
if(require.main===module)main();
module.exports={audit};
