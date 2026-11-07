import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import crypto from 'node:crypto';
import {auditBrowserBundle} from './tooling/audit-browser-bundle.mjs';
import * as originalModels from './retained/world-models.js';
import {calibrationReading} from './retained/encounter-data.js';
import {createSession} from './retained/workshop/engine.js';
import {sourceReceipts} from './retained/source-receipts.js';
const require=createRequire(import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,import.meta.url)));
const {lower}=require('./bootstrap/ports/algebra-lower.cjs'),{createKernel}=require('./bootstrap/temple-seed.cjs'),{valuePorts}=require('./bootstrap/ports/value.cjs'),{computationalPorts,browserEffects}=require('./bootstrap/ports/browser-effects.cjs'),{invoke}=require('./bootstrap/ports/programme.cjs');
const manifest=read('bootstrap/site.json'),queries=Object.assign({},...manifest.modules.map(f=>read(f).queries),...(manifest.processModules??[]).map(s=>read('dist/'+s.output).queries));
const model=await lower({compiler:read('algebra/lowering.process.json'),definitions:read('algebra/operators.expression.json'),primitives:createKernel.operators,input:{queries,entry:'workshop.boot'},mode:'model',ports:valuePorts(),limit:20000000});
const data=read('source/reader/activities.json');
const portable=value=>JSON.parse(JSON.stringify(value));
const run=async(entry,eventInput,extra={})=>(await invoke({model,entry,input:{data,eventInput,...extra},ports:{...valuePorts(),...computationalPorts()},nested:['kernel.invoke','kernel.execute','kernel.evaluate'],limit:20000000})).value;

test('migrated finite models reproduce every slider setting and bit pattern',async()=>{
 for(let angle=0;angle<=90;angle++)assert.equal(await run('reader.model.calibration',{angle}),calibrationReading(angle));
 for(let value=0;value<=8;value++)assert.deepEqual(await run('reader.model.pairs',{mode:'budget',value}),originalModels.allowedPairs(value));
 for(let value=0;value<=4;value++)assert.deepEqual(await run('reader.model.pairs',{mode:'positive',value}),originalModels.positivePairs(value));
 for(let step=0;step<=5;step++)assert.deepEqual(await run('reader.model.inflate',{step}),originalModels.inflatePair(step));
 for(let value=0;value<8;value++){const bits=[value&1,(value>>1)&1,(value>>2)&1];assert.equal(await run('reader.model.decode',{bits}),originalModels.decodeRepetition(bits));}
 for(let percent=0;percent<=100;percent++){const actual=await run('reader.model.weights',{percent}),expected=originalModels.weightedOptions(percent);for(const field of ['a','b'])assert.equal(actual[field].toFixed(2),expected[field].toFixed(2));}
 for(const block of [1,2,4])assert.deepEqual(await run('reader.model.coarse',{block}),originalModels.coarseCells(block));
});
test('both numerical memory trajectories and all plotted coordinates retain exact predecessor results',async()=>{
 for(const coupled of [true,false]){
  const original=originalModels.memoryTrace(coupled),actual=await run('reader.model.memory',{coupled});assert.deepEqual(actual,original);
  for(const coordinate of ['x','h'])assert.equal(await run('reader.model.line',{samples:actual,coordinate}),original.map((p,i)=>`${i?'L':'M'}${(25+p.t*39).toFixed(2)},${(215-p[coordinate]*135).toFixed(2)}`).join(' '));
 }
});
test('algebra-owned workshop sessions reproduce source edits, overlays, generated HTML and refusal boundaries',async()=>{
 const inputs=read('source/encounter/example.json'),candidate=await run('ec.prepare',inputs),original=await createSession(read('retained/workshop/fixture.json'));
 let snapshot=await run('workshop.snapshot',{candidate,revision:0,receipt:null});
 assert.equal(snapshot.title,original.state().title);assert.equal(snapshot.webLabel,original.state().webLabel);assert.deepEqual(portable(snapshot.panels),portable(original.state().panels));
 for(const request of [{revision:0,kind:'title',value:'A shared <story> & "hope"'},{revision:1,kind:'web-label',value:'Our <local> label & "link"'}]){
  const prior=snapshot;snapshot=await run('workshop.change',{snapshot,request});const expected=await original.edit(request);
  assert.deepEqual(portable(snapshot.panels),portable(expected.panels));assert.deepEqual(snapshot.sources,expected.sources);assert.equal(snapshot.receipt.factDiff,expected.receipt.factDiff);assert.equal(snapshot.receipt.codeDiff,expected.receipt.codeDiff);
  if(request.kind==='web-label')assert.equal(snapshot.sources.facts,prior.sources.facts);else assert.equal(snapshot.sources.encounter,prior.sources.encounter);
 }
 const accepted=JSON.stringify(snapshot);
 for(const [request,code]of [[{revision:0,kind:'title',value:'stale'},/LAB-STALE/],[{revision:2,kind:'title',value:''},/EC-T007/],[{revision:2,kind:'title',value:{}},/EC-E010/],[{revision:2,kind:'unknown',value:'value'},/LAB-E001/]]){await assert.rejects(run('workshop.change',{snapshot,request}),code);assert.equal(JSON.stringify(snapshot),accepted);}
 assert.equal((await run('workshop.snapshot',{candidate:await run('ec.prepare',inputs),revision:0,receipt:null})).title,'What happened');
});
test('forty activity source documents retain controls and contain no executable source',()=>{
 assert.equal(Object.keys(data.activities).length,40);
 for(const activity of Object.values(data.activities)){assert.ok(activity.html);assert.ok(!/<script\b|\son\w+\s*=/i.test(activity.html),activity.id);}
});

test('the published execution graph contains only admitted bundles and generic native mechanisms',async()=>{
 const receipt=read('dist/build-receipt.json'),contract=read('source/publication-contract.json');
 const allowed=new Set(['temple/runtime.js','temple/early.js','sourcery/runtime.js','claimipedia/runtime.js','encounter/runtime.js','atlas-runtime.js','identity-runtime.js','inspection/runtime.js','assurance/rendered-runtime.js','roadmap/runtime.js',...contract.readerWorkshopSuccessor.runtimes]);
 for(const file of Object.keys(receipt.artifacts)){
  if(!/\.(?:m?js|html)$/.test(file))continue;
  const content=fs.readFileSync(new URL('dist/'+file,import.meta.url),'utf8');
  if(/\.(?:m?js)$/.test(file)){assert.ok(allowed.has(file),file);await auditBrowserBundle(content);}
  if(!file.endsWith('.html'))continue;
  const base=content.match(/<base\s+href="([^"]+)"/)?.[1]??'./',documentURL=new URL(file,'https://publication.invalid/'),baseURL=new URL(base,documentURL);
  for(const match of content.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
   if(/type="application\/(?:ld\+)?json"/.test(match[1]))continue;
   const src=match[1].match(/\bsrc="([^"]+)"/)?.[1];assert.ok(src,file+' has no inline application script');
   const url=new URL(src,baseURL);assert.equal(url.origin,documentURL.origin,file+' has no external application script');assert.ok(allowed.has(url.pathname.slice(1)),file+': '+src);
  }
 }
 for(const predecessor of read('source/reader/migration.json').predecessors){assert.ok(!receipt.sources[predecessor.path],predecessor.path+' is not a build dependency');assert.ok(!receipt.artifacts[predecessor.path],predecessor.path+' is not published');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(predecessor.path,import.meta.url))).digest('hex'),predecessor.sha256);}
 assert.deepEqual(read('source/reader/source-receipts.json'),sourceReceipts);
 const profiles=read('bootstrap/ports.json').profiles;
 for(const name of ['readerBrowser','activityBrowser','workshopBrowser'])assert.ok(!profiles[name].some(port=>/^(?:file\.|mail\.|http\.)/.test(port)),name);
 assert.ok(!profiles.workshopBrowser.some(port=>port.startsWith('storage.')),'workshop has no persistent storage grant');
});

test('whole-bundle auditing rejects extra executable code and altered native mechanisms',async()=>{
 const source=fs.readFileSync(new URL('dist/reader/runtime.js',import.meta.url),'utf8');
 await auditBrowserBundle(source);
 for(const tampered of ['globalThis.hiddenRule=true;\n'+source,source+'\nglobalThis.hiddenRule=true;',source.replace('function browserEffects(', 'function unexpectedEffects(')])await assert.rejects(auditBrowserBundle(tampered),/complete native envelope/);
 // Code-looking prose in snapshot data is inert and must not be mistaken for code.
 const {createRuntimePort}=require('./bootstrap/hosts/runtime.cjs');
 const inert=await createRuntimePort({queries:{boot:[]}},[],{browser:[]},async()=>({}))({entry:'boot',mode:'browser',queries:['boot'],factSubjects:[],data:{prose:'new Function("text"); eval("example")'}});
 await auditBrowserBundle(inert);
});

test('document observation executes supplied transformation plans without reader defaults',()=>{
 const calls=[],attributes=new Map([['data-url','asset.svg'],['href','#part']]);
 const node={remove:()=>calls.push('remove'),getAttribute:name=>attributes.get(name),setAttribute:(name,value)=>attributes.set(name,value)};
 const parsed={querySelectorAll:selector=>{calls.push(selector);return [node];},querySelector:selector=>({innerHTML:selector})};
 const ports=browserEffects({document:{},window:{URL,DOMParser:class{parseFromString(){return parsed;}}}},()=>{});
 const project=args=>ports['document.fragment']({html:'fixture',selector:'article',base:'https://example.test/docs/page.html',...args});
 assert.equal(project({}),'article');assert.deepEqual(calls,[]);
 project({removeSelectors:['aside'],urlAttributes:['data-url']});assert.deepEqual(calls,['aside','remove','[data-url]']);assert.equal(attributes.get('data-url'),'https://example.test/docs/asset.svg');
 project({urlAttributes:['href'],keepFragmentLinks:true});assert.equal(attributes.get('href'),'#part');
 project({urlAttributes:['href']});assert.equal(attributes.get('href'),'https://example.test/docs/page.html#part');
});

test('frame capability choice comes from algebra within the native script-free ceiling',()=>{
 const attributes=new Map(),frame={setAttribute:(key,value)=>attributes.set(key,value)};
 const ports=browserEffects({document:{querySelectorAll:()=>[frame]}},()=>{}),write=args=>ports['browser.frameContent']({ref:'#frame',html:'preview',...args});
 write({});assert.equal(attributes.get('sandbox'),'');
 write({sandbox:['allow-same-origin']});assert.equal(attributes.get('sandbox'),'allow-same-origin');
 assert.throws(()=>write({sandbox:['allow-scripts']}),/Unsupported frame capability/);assert.equal(attributes.get('sandbox'),'allow-same-origin');
 const walk=(value,port)=>!value||typeof value!=='object'?[]:[...(value.port===port?[value.args]:[]),...Object.values(value).flatMap(child=>walk(child,port))];
 const fragments=walk(read('algebra/reader-navigation.process.json'),'document.fragment');assert.equal(fragments.length,1);
 assert.deepEqual(fragments[0].removeSelectors,['list','script']);assert.deepEqual(fragments[0].urlAttributes,['list','href','src']);assert.equal(fragments[0].keepFragmentLinks,true);
 const frames=walk(read('algebra/workshop-session.process.json'),'browser.frameContent');assert.equal(frames.length,4);for(const args of frames)assert.deepEqual(args.sandbox,['list','allow-same-origin']);
 const contract=read('source/publication-contract.json'),successor=contract.nativePolicyAuditSuccessor;
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(successor.predecessor,import.meta.url))).digest('hex'),successor.predecessorSha256);
 assert.equal(successor.predecessorSha256,'0aff8087df6c6e7f1d8f83e20012a26e82d880a96b38f75e0385f562b5b37c49');
});

// Independent corpus-model vectors, recorded before migration; not browser application code.
const householdGolden=[["roles","none","constructive","abb8073f05bb24cd47ccdf89a3aeea5d9416ca709ec555cbedb33515090854da"],["roles","none","dismissal","abb8073f05bb24cd47ccdf89a3aeea5d9416ca709ec555cbedb33515090854da"],["roles","none","unkept","1fb93bd6b1a3b372017325ab40f801ad195081f8717aa8882ce09295e0f00c78"],["roles","none","repair","f668be1d1a4dc29ae4d31f4abbaf9c1d7aaef0f4345146b2dc11ad4153439f9f"],["roles","none","unknown","abb8073f05bb24cd47ccdf89a3aeea5d9416ca709ec555cbedb33515090854da"],["roles","values","constructive","933cf85d87f02e8b70c8b8f875428bc9b0c13acec28b80e2c106736f1ef08f2f"],["roles","values","dismissal","31be7df1981eb707031b3860aba64460873b157b8283b83b698dd7ffeaed8323"],["roles","values","unkept","1ce1d4195e78923f26c2a8baf21f16933bb27d844d00056bb875f026ae06723f"],["roles","values","repair","06f0d7041377a88a7ba9f32847d1c31482ac226927fd045d75acdcb12b63c56f"],["roles","values","unknown","abaae7323ad484114aa7095fda11a1e3dfab00cbb12d66779ab399618077281e"],["roles","capacity","constructive","20fee1e002cfcf58363685d0a66f5c6bb9251578c6106ae29a5b39c8c099c532"],["roles","capacity","dismissal","e0aef0dd87d543282c6b4687430b5d8802ea748880aa0b1516b19f582e1b6fa5"],["roles","capacity","unkept","c5d6c348aff6e713160436a1877bcad7766278da246862cb8e601737485fe31d"],["roles","capacity","repair","29207723c727e654624f602ae1f647bdebf6f909f9437ff7fcb2101a0c4a99b0"],["roles","capacity","unknown","4e68fbbcfc031199bac6383c05814f9e7b5e1d617b22a5bf5f22a8e582d18630"],["roles","demands","constructive","69fd358576f263123e7e9d2dfe471112e6a388fa21760105250eccd0c249a229"],["roles","demands","dismissal","69fd358576f263123e7e9d2dfe471112e6a388fa21760105250eccd0c249a229"],["roles","demands","unkept","eb2f5fe11e4854ec19856160e39966b561318de0570be89dac5e7a5d0dd3d205"],["roles","demands","repair","d647ae87abdcb476bcd6f3172b615cc7547f99406a3551355a2af7ccb3f0c449"],["roles","demands","unknown","69fd358576f263123e7e9d2dfe471112e6a388fa21760105250eccd0c249a229"],["roles","combined","constructive","009691439c50bd0bfcac47a583e5d47e45d89147659fc492784c06dce32db962"],["roles","combined","dismissal","f9aafa62b1bdb03df4e2dcfd0f680c3a4c4025b7c50ec18e82e9f6017ab2dc3a"],["roles","combined","unkept","eb1821798f0c67234ac9b1e14afcfaa4e0d92f3bccb56de99db0c855314d575e"],["roles","combined","repair","29035afe35b5074133d0903e06ce35a42485dc50f0ecb6f47fd11aeb0a873efd"],["roles","combined","unknown","810c04d82c70f3645793c97db24e8b4e916fc514bb36a111b8b20f7ef0453467"],["equal","none","constructive","e6154b8ac606bce98b9b21b1b008b0cb11711d5429b59c09c1237480b17b36f5"],["equal","none","dismissal","e6154b8ac606bce98b9b21b1b008b0cb11711d5429b59c09c1237480b17b36f5"],["equal","none","unkept","c3d84cc20095fd2d8ea0def9ed0c8d840300788d30e47de706a2b2f98b1d5fbf"],["equal","none","repair","c35282c115f2054dd381a7fe23ec673b77bd53a4ad840c952976934a1a93ed05"],["equal","none","unknown","e6154b8ac606bce98b9b21b1b008b0cb11711d5429b59c09c1237480b17b36f5"],["equal","values","constructive","c4a2530a687b7714ed10547be547bc7762903b1956ee10cc43e3f128d85580cc"],["equal","values","dismissal","c4a2530a687b7714ed10547be547bc7762903b1956ee10cc43e3f128d85580cc"],["equal","values","unkept","1f497e25cfe1f2dfd48a2faf4044be5fa43cd442f8ff9f723351a6681d42879b"],["equal","values","repair","5817fe7c3765954b04398a89bd65d6ac56b5f84e2073ae663a97eb6813071262"],["equal","values","unknown","c4a2530a687b7714ed10547be547bc7762903b1956ee10cc43e3f128d85580cc"],["equal","capacity","constructive","36ec3ea805a073f531a7c1a3e11e7020b9346adbc09a65ec432c4f73ecfec900"],["equal","capacity","dismissal","ea5a78863d37631c764a238ba8db40f744876366f8126851b260df643630aff8"],["equal","capacity","unkept","0c8836f8fd8a5aff61c31a0002def8eab30064c6cc47d3d3a6dac22d2237c210"],["equal","capacity","repair","5b3845495357d8f0d04904b6b74149cf4357eb87b1c89291e9ffa194072b6207"],["equal","capacity","unknown","c4836df84b18fd249e1c85c9576bf35f7bb2fe3a372924315b25906718836793"],["equal","demands","constructive","2ac7dc3c1363a834905de23fe2d52b76c7ebfcd2b2f2abb36bccad26793c3c78"],["equal","demands","dismissal","2ac7dc3c1363a834905de23fe2d52b76c7ebfcd2b2f2abb36bccad26793c3c78"],["equal","demands","unkept","69df354cf38d92ec546f324886b396d4c8dfd07d95a9a8c9660e13f57e5fb473"],["equal","demands","repair","4ea9437b130717c10e7532d97c66ed1477364c05e92761d3d2dc9acf66f6b77b"],["equal","demands","unknown","2ac7dc3c1363a834905de23fe2d52b76c7ebfcd2b2f2abb36bccad26793c3c78"],["equal","combined","constructive","12402c75b7855274f88b7c965b44cf3e4387c01393ca0594601f1c053aa2cc5a"],["equal","combined","dismissal","12402c75b7855274f88b7c965b44cf3e4387c01393ca0594601f1c053aa2cc5a"],["equal","combined","unkept","6b183de7b86e1ee91c1458fac0c288b266729ecf77d2bd6ab1f66f0716226c71"],["equal","combined","repair","6beacdce25ddb1fa860a3dfd9b784d9b44af2da5f6c248e0f4ce23b6d1b15e8c"],["equal","combined","unknown","f76cba5c2d223e1110e5427d93ee09f48cab39ff72dec23a644c198d6d71dc15"],["capacity","none","constructive","dbdc55f138c83b34cf23bffbe4d090bc4bf0c894816cddfbac0dd44043575263"],["capacity","none","dismissal","dbdc55f138c83b34cf23bffbe4d090bc4bf0c894816cddfbac0dd44043575263"],["capacity","none","unkept","617286678cdea2790d97864756959baa20e62e322ea39256208043ed33a4928c"],["capacity","none","repair","868eeebf1aed172459237bd484e17b70a11a2e72435db6d13d77c9078a0c9c54"],["capacity","none","unknown","dbdc55f138c83b34cf23bffbe4d090bc4bf0c894816cddfbac0dd44043575263"],["capacity","values","constructive","b627199fefb06c69e758a8adade16c42cd9404b2f5a374ecfbffe71947976231"],["capacity","values","dismissal","cf0105c636a9b6cfa5b5908f41806e572c35981cedf8a5e83a3e0f40728dc9e8"],["capacity","values","unkept","e0d953c8a9cadf89e4385f79e456546caea1e3efbade37c859e0651b6f65060e"],["capacity","values","repair","3dfb85ad9345246aefa78feb609132c1a86847c787e67254c77e91257da2a98f"],["capacity","values","unknown","5d9ee39a5d3c77606d8bfc51141912a61583dde4656a6e309a1203efdd22cce1"],["capacity","capacity","constructive","e3e380fd2f01db7b18ce462260ef8c8e96831db3a2e730542ad23e1414a5dbae"],["capacity","capacity","dismissal","3924db1e91418fbc46e806278ca76ae5fb6538931c154b46d1fa19b38bbd85bc"],["capacity","capacity","unkept","e3c9655c48c64e837f66c8d786d9ba506c6742f0aa5e279497ecebf2ebf2a29e"],["capacity","capacity","repair","daac14c14d03a57475eb10be82bd28c43e307899fbd27a8ed5786ca60fcb8f9a"],["capacity","capacity","unknown","c13c4b49913278d6b07d070341afa27878010c3460d7b18a370fa19a0981c1ba"],["capacity","demands","constructive","dcd6afe2f1c1fea10bc4517065cb8637effb6c5b1a59d6ec46efb1044f5f14c0"],["capacity","demands","dismissal","bd62489a70ab231129be498fc52dc498b7c472c5dcd37dc79fd64e773d8c989a"],["capacity","demands","unkept","279ed638193674fbf580829feeff8a42438426d3145e9b7e1e7a6ca279736fc2"],["capacity","demands","repair","e406136479c15c60b6142f7a41ffe7cd624617081df19fc4b226d42738f75b62"],["capacity","demands","unknown","d7feca9edac6a669a31bb1bd69349cc476406c820bc209f10ccbefc29cf9264d"],["capacity","combined","constructive","d45990c1bce1bfd433928169df978d2ba5f5ecaf28dd066ef68c5fb2a4a8798d"],["capacity","combined","dismissal","23968c4fdf4cf19192a9c8e54bf50489a0c9ca2bfe0b039a7f9ec9d12ae0e904"],["capacity","combined","unkept","273d4300939a1c5fd44328731c14f2240b1d3f3a5a981c74c5f3c58b7cc33e48"],["capacity","combined","repair","5eb3b5e39c5a68d65488c46bf114b675372b4bf6d30ee234822a6bf9977b0f32"],["capacity","combined","unknown","9e3bf8a558cfae153c494aeb8e66c7dc6dd720492a3d6dacd025b466fbde164a"],["alternating","none","constructive","a2578b01735e9aff518bd452397a953ffd6b301ebdd01c80372440b90d2f980f"],["alternating","none","dismissal","f8de93b5ab1c1886d4cc2c3ff59b20f0effd1f255f77b4cbedb23b9797e6cb6a"],["alternating","none","unkept","23ffc651c3ad9f587f38bbf04d163036f0fe345fbd82a23c96f086cf3f1bff53"],["alternating","none","repair","474e9ee2268668c15739d972a556baf9b7e44d42382f60847587cd44b7c2d05e"],["alternating","none","unknown","fb09f32984d22bf2092737bad14fd2d83aed346bd4e409c8a37a2c729ae69215"],["alternating","values","constructive","3a7b487fead8fd080e47ff5fc84ee8dbca67832f7198893575529d1c5f99bad3"],["alternating","values","dismissal","895930fe5738426bf20f3de1431ebbbb14d2d9dd4899f79e9479d7b62ef82469"],["alternating","values","unkept","2db6876898465bbe1e6d4a2f722c4c20728fe33f8eeaef56bab0152ca5437b1a"],["alternating","values","repair","d2ea7f9b89cf476401a3b23e52dc1964213bcebf8366730032bd97cd7b955dd5"],["alternating","values","unknown","609cf556ce127ec3433d65636aa431d0c8483e48840c982222a61b1594e9e21b"],["alternating","capacity","constructive","b759059d16cd81f6b4b018c9448205649b1059173119ac071d56c602a9f7b054"],["alternating","capacity","dismissal","b84bae12cd5dea4d6faed23e1c344ba9395a8b71f108d5e33a72e2899847bfea"],["alternating","capacity","unkept","f981acee3b568751b76b19f911c97187d88672922b91c4753319e69cdc10376c"],["alternating","capacity","repair","142c5a0a245a54900e95767ba8c60cca872e8a5b1c635777c51f5538e71d4c9f"],["alternating","capacity","unknown","c21cab05b37aa03adcbf2f93df29748bbcc57ed936ecefae7737331f909e2ea6"],["alternating","demands","constructive","36f665b00068b763163332c301f40bd4685001085976d05ee8fb7362ce57f792"],["alternating","demands","dismissal","2d3050fbfaa9f306fcca76b7faab8eaa19460f55e7e64cddc498a74860d9aae0"],["alternating","demands","unkept","4902663bd00b519965595d6020f59423eda6ba8f5400bd5e5af8ab1311aafaed"],["alternating","demands","repair","70ef10f4f05b794d70282437de214a64e840e03a39c6a888a08420683558a96a"],["alternating","demands","unknown","498781d3cd961562d65eb944ee09fe470ff4ae0ff788945efe00ca18c9a62c0f"],["alternating","combined","constructive","26b7a31d5294646a256c6b123cf8f374eb046d49a6a22f2e2bfaaf2cfa5e5f17"],["alternating","combined","dismissal","035b8a3ec540081bf09240058c3a7294fef093646a27b5c1062ab5dc96d2f15e"],["alternating","combined","unkept","a6c129aff5b09c0b9fb6f677f4aea5ac7b202327c1c64307fa598c09e7ec0ceb"],["alternating","combined","repair","6de878c75cc6f75200888c8883cd6e13eb8a81beee056e1838ee0f47b97cc959"],["alternating","combined","unknown","865b33c205a141b47df5eefe7bc1b4d135a0b17284a09c968ae113fcc76f496f"]];
test('household algebra preserves all 100 authored orientation/change/history trajectories',async()=>{
 const project=r=>r.history.map(x=>[x.shareA,x.reserve,x.backlog,x.willingnessClosing.A,x.willingnessClosing.B,x.review.status,x.review.requester,...x.people.flatMap(p=>[p.paid,p.domestic,p.free])]);
 for(const [orientation,change,profile,expected]of householdGolden){
  const scenario=await run('household.scenario',{orientation,change,profile,enabled:true});
  const actual=await run('household.run',{scenario,overrides:[]});
  const encoded=JSON.stringify(project(actual),(_,v)=>typeof v==='number'?Math.round(v*1e7)/1e7:v);
  assert.equal(crypto.createHash('sha256').update(encoded).digest('hex'),expected,scenario.id);
 }
});
test('household example has full Field chrome, accessible controls, linked claims and admitted runtime',()=>{
 const page=fs.readFileSync(new URL('dist/the-field/households/index.html',import.meta.url),'utf8'),inspect=fs.readFileSync(new URL('dist/the-field/households/inspect/index.html',import.meta.url),'utf8'),field=fs.readFileSync(new URL('dist/the-field/index.html',import.meta.url),'utf8');
 for(const text of ['household-root','hh-timeline','hh-person','hh-phase','mast','footer','../../reader/activity-runtime.js'])assert.ok(page.includes(text),text);
 assert.ok(!/<iframe|<script[^>]*>[^<]+/i.test(page));
 assert.equal((inspect.match(/id="hh-claim-\d+"/g)||[]).length,66);
 assert.ok(field.includes('households/'));
});

test('household GoG projection keeps common scales, discrete observations and exact selected data',async()=>{
 const rows=[];for(const person of ['A','B'])for(let period=1;period<=12;period++)rows.push({person,period,closing:person==='A'?(period-1)/11:1-(period-1)/11,opening:0.5});
 const input={view:data.household.chart,data:rows,width:340,period:5,changes:[5,9]},p=await run('household.gog.plan',input);
 assert.equal(p.facets.length,2);assert.equal(p.facets[0].points.length,12);assert.deepEqual(portable(p.facets[0].points[0]),{x:'38.00',y:'190.00',period:1,value:0});assert.equal(p.facets[0].points[11].x,'326.00');assert.equal(p.facets[0].points[11].y,'20.00');assert.equal(p.facets[1].points[0].y,'20.00');assert.equal(p.facets[1].points[11].y,'190.00');assert.equal(p.facets[0].selected.period,5);assert.deepEqual(p.changes.map(c=>c.period),[5,9]);await assert.rejects(run('household.gog.plan',{...input,view:{...data.household.chart,frame:'polar'}}),/HH-GOG-001/);
});
test('chart markers include custom temporal inputs, deduplicate changes and exclude whole-run rates',async()=>{
 const history=Array.from({length:12},(_,i)=>({period:i+1,appliedEvents:i===4?['values']:[],appliedExperienceEvents:i===8?['repair']:[]}));
 const overrides=[{scope:'person',phase:'after'},{scope:'experience',phase:'after'},{scope:'person',phase:'initial'},{scope:'rate',phase:'run'}];
 assert.deepEqual(await run('household.chart.changes',{history,overrides}),[1,5,9]);
 assert.deepEqual(await run('household.chart.changes',{history:history.map(r=>({...r,appliedEvents:[],appliedExperienceEvents:[]})),overrides:[{scope:'person',phase:'after'},{scope:'rate',phase:'run'}]}),[5]);
});
