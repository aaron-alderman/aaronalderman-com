import fs from 'node:fs';
import crypto from 'node:crypto';
const read=f=>JSON.parse(fs.readFileSync(f)),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const inventory=read('source/microsites/function-inventory.json');
const groups={
 'temple/assets/gate.js':[['$','browser.select'],['wait','ui.temple.animateStage'],['esc','html.escape'],['labelOf','ui.temple.label'],['renderChoices','ui.temple.init'],['recipe','ui.temple.recipe'],['renderStages','ui.temple.stages'],['el','html.serialize'],['drawTree','ui.temple.tree'],['yOf','ui.temple.treeY'],['hot','ui.temple.tree'],['renderTemple','ui.temple.render'],['renderCovenant','ui.temple.covenant'],['journalItems','ui.temple.journal'],['renderJournal','ui.temple.journal'],['emitJournal','ui.temple.chain'],['updatePreview','ui.temple.preview'],['lesson','ui.temple.lesson'],['onPropose','ui.temple.propose'],['showLines','ui.temple.replayLine'],['setReplayBusy','ui.temple.replayBusy'],['onReplay','ui.temple.replay'],['onForge','ui.temple.replay'],['restore','ui.temple.restore'],['init','ui.temple.init']],
 'temple/assets/films.js':[['esc','html.escape'],['seekable','media.seek.contains'],['openAsBlob','media.seek.prepare'],['seekTo','media.seek.click'],['initScreens','media.screens.init'],['syncSound','media.sound.sync'],['initProvenance','media.provenance']],
 'temple/assets/lamp.js':[['covenant','configuration.covenants'],['deepCovenant','configuration.covenants'],['createTemple','lamp.createWorld'],['findCell','lamp.findCell'],['cellsByKey','lamp.cellsByKey'],['presetAvailability','lamp.availability'],['honestClaim','lamp.applyUnchecked'],['flip','address.flip'],['buildProposal','lamp.buildProposal'],['propose','lamp.propose'],['freshTemple','lamp.freshTemple'],['replay','lamp.replay'],['forge','lamp.forge'],['covenantSize','lamp.measure']],
 'temple/assets/kernel.js':[['canonical','canonical.encode'],['isCanonical','canonical.is'],['sha256','digest.sha256'],['identify','canonical.identify'],['digestOf','address.digest'],['short','address.short'],...['L','R','EQ','NOT','ALL','ANY'].map(n=>[n,'configuration.covenants']),['measure','lamp.measure'],['walk','lamp.measure'],['readPath','lamp.readPath'],['truthy','lamp.evaluateNode'],['evaluate','lamp.evaluate'],['ev','lamp.evaluateNode'],['render','lamp.render'],['cellId','lamp.cellId'],['merkle','lamp.merkle'],['stateRoot','lamp.stateRoot'],['cloneState','record.clone'],['checkCanonical','lamp.checkCanonical'],['judge','lamp.judge'],['fail','lamp.judge'],['cells','lamp.namedCells'],['commit','lamp.commit']],
 'sourcery/assets/js/witness.js':[['sha256Bytes','digest.sha256'],['toHex','digest.sha256'],['encode','digest.sha256'],['sha256HexSync','digest.sha256'],['sha256Hex','digest.sha256'],['canonical','canonical.encode'],['short','ui.short']],
 'sourcery/assets/js/story.js':[['rand','motion.flood.rand'],['broomCount','motion.flood.render'],['computeProgress','motion.flood.scroll'],['waveD','motion.flood.wave'],['render','motion.flood.render'],['frame','motion.flood.frame'],['setRunning','motion.flood.running'],['onScroll','motion.flood.scroll']],
 'sourcery/assets/js/spell.js':[['cap','sourcery.draft'],['plural','sourcery.draft'],['subjectOf','sourcery.subject'],['refusals','sourcery.draft'],['draft','sourcery.draft'],['el','html.serialize'],['section','ui.sourcery.proposal'],['head','sourcery.proposal'],['summon','ui.sourcery.summon'],['askWhy','ui.sourcery.askWhy'],['send','ui.sourcery.enter'],['decide','ui.sourcery.decide'],['renderLedger','ui.sourcery.ledger'],['verify','ui.sourcery.verify'],['tamper','ui.sourcery.tamper']]
};
const modules=['html','microsite-values','microsite-lamp','microsite-sourcery','microsite-ui','microsite-temple-ui','microsite-motion','microsite-temple-motion','microsite-media'];
const queries=Object.assign({},...modules.map(n=>read('algebra/'+n+'.process.json').queries));
function filmOwner(line){return line<111?'motion.sky':line<126?'motion.temple.reveal':line<167?'motion.temple.scenes':line<187?'motion.stone':line<239?'ui.temple.chain':line<381?'motion.constellation':'motion.temple.follow';}
const entries=inventory.files.flatMap(file=>file.functions.map(fn=>{
 const key=file.site+'/'+file.path;
 const ancestors=file.functions.filter(p=>p.start<fn.start&&p.end>=fn.end&&p.name!=='(callback)').sort((a,b)=>(a.end-a.start)-(b.end-b.start));
 const name=fn.name==='(callback)'?ancestors[0]?.name:fn.name;
 let owner=groups[key]?.find(([n])=>n===name)?.[1];
 if(key==='temple/assets/film.js')owner=filmOwner(fn.line);
 if(!owner&&key==='sourcery/assets/js/story.js')owner='motion.sourcery.init';
 if(!owner&&fn.name==='(callback)')owner=key.endsWith('spell.js')?'ui.sourcery.init':key.endsWith('gate.js')?'ui.temple.init':key.endsWith('films.js')?'media.screens.init':key.endsWith('witness.js')?'digest.sha256':null;
 if(!owner)throw Error('Unmapped original function: '+key+':'+fn.line);
 const candidates=Object.keys(queries).filter(n=>n===owner||n.startsWith(owner+'.'));
 const kind=owner.startsWith('configuration.')?'source-data':candidates.length?'process-query':'generic-mechanism';
 return {site:file.site,path:file.path,sourceSha256:file.sha256,...fn,owner,kind,queries:candidates};
}));
fs.writeFileSync('source/microsites/function-correspondence.json',JSON.stringify({protocol:'worldwright/microsite-function-correspondence/1',scope:'Implementation correspondence, not an assertion of exhaustive behavioural proof. Anonymous callbacks inherit the containing responsibility. Native primitives are explicit mechanisms; source-domain constructors are retained configuration data.',entries},null,2)+'\n');
const contractPath='source/publication-contract.json',contract=read(contractPath);
contract.owners.mechanisms='Existing Temple seed, lowering and admission, with an explicitly pinned generic browser-effects successor';
contract.boundaries=contract.boundaries.map(v=>v==='New page policy runs through Temple algebra; no new application JavaScript is introduced.'?'New page and microsite application policy runs through Temple algebra; generated browser bundles execute those programmes. Original microsite application scripts remain verification-only.':v);
const receipt=read('microsite-preview/build-receipt.json');
contract.nativeSuccessor={reason:'Generic browser observations, scheduling, geometry effects, numeric mechanisms and SHA-256 fallback required to recompose the original microsites through algebra.',predecessor:'source/microsites/predecessor-native/publication-contract.json',predecessorSha256:sha('source/microsites/predecessor-native/publication-contract.json'),changed:['bootstrap/hosts/runtime.cjs'],added:['bootstrap/ports/browser-effects.cjs'],sha256:Object.fromEntries(Object.keys(receipt.nativeSources).map(f=>[f,sha(f)]))};
fs.writeFileSync(contractPath,JSON.stringify(contract,null,2)+'\n');
const ports=read('bootstrap/ports.json'),used=new Set();
function scan(v){if(v&&typeof v==='object'){if(v.port)used.add(v.port);Object.values(v).forEach(scan);}}
scan(queries);used.add('browser.select');used.add('state.set');used.add('kernel.invoke');
ports.profiles.micrositesBrowser=[...used].sort();fs.writeFileSync('bootstrap/ports.json',JSON.stringify(ports,null,2)+'\n');
