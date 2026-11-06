// Authoring-only: reads a user-owned checkout; never copies its runtime.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=process.argv[2];if(!root)throw Error('Pass the original Claimipedia checkout path.');
const {parseRawFacts}=await import(pathToFileURL(root+'/../../node_modules/@temple2/platform-sdk/core/rel-core.mjs'));
const source=fs.readFileSync(root+'/domain.rel','utf8'),facts=parseRawFacts(source);
const values=(s,p)=>facts.filter(f=>f.s===s&&f.p===p&&f.pol!=='not').map(f=>f.o),one=(s,p)=>values(s,p)[0];
const ids=['evidence.northStudy','evidence.southDataset','evidence.communityTestimony','evidence.retractedStudy'];
const names=['North laboratory study','South laboratory dataset','Community observations','Retracted North study'];
const evidence=ids.map((id,i)=>({id,name:names[i],...Object.fromEntries(['evidenceType','direction','sourceActor','sourceCredentialed','sourceIndependent','peerReviewed','retracted'].map(p=>[p,one(id,p)??'not recorded']))}));
const methods=['credentialReview','equalEvidence','independentSource'].map((key,i)=>{
 const id='programVersion.'+key+'.1',threshold=Number(one(id,'acceptanceThreshold'));
 return {id,name:['Credentialed studies','Equal weight','Independent sources'][i],summary:['Only credentialed studies that have not been retracted count.','Every submitted item counts equally, including the retracted study.','Only independent, peer-reviewed studies and independent datasets count.'][i],threshold,thresholdUnits:threshold*1000000,minimum:Number(one(id,'minimumIndependentSources')),defaultDecision:one(id,'defaultDecision'),rules:values(id,'rule').map(r=>({id:r,priority:Number(one(r,'priority')),weight:Number(one(r,'weight')),units:Number(one(r,'weight'))*1000000,reason:one(r,'explanation'),conditions:values(r,'condition').map(c=>({field:one(c,'path').replace('evidence.',''),expected:one(c,'value')}))})).sort((a,b)=>b.priority-a.priority)};
});
const config={claim:'The North River restoration reduced mean nitrate concentration by at least 15 percent during 2025.',scope:'North River monitoring sites; 2025 compared with 2024.',claimVersion:'claimVersion.riverNitrate.1',evidence,methods};
fs.writeFileSync('source/claimipedia-example.json',JSON.stringify(config,null,2)+'\n');
const {evaluateClaim}=await import(pathToFileURL(root+'/runtime.mjs'));
const vectors=[];
for(let mask=0;mask<16;mask++)for(let i=0;i<3;i++){
 const selected=ids.filter((_,n)=>mask&(1<<n));
 const r=evaluateClaim(facts,{claim:'claim.riverNitrate',constitutionVersion:['constitutionVersion.credential.1','constitutionVersion.equal.1','constitutionVersion.independent.1'][i],snapshotTime:'2026-07-30T05:00:00.000Z',evidenceItems:selected,relationshipItems:[],simulated:true});
 vectors.push({selected,method:methods[i].id,result:r.result,support:Number(r.support)*1000000,challenge:Number(r.challenge)*1000000,independentSources:r.independentSources});
}
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(root+'/'+file)).digest('hex');
fs.writeFileSync('source/claimipedia-correspondence.json',JSON.stringify({protocol:'claimipedia/bounded-example-correspondence/1',scope:'Four fictional evidence items; three original methods; all 16 subsets. One source family, not independent scientific confirmation.',sourceFiles:{'domain.rel':hash('domain.rel'),'runtime.mjs':hash('runtime.mjs')},reproduce:'node tooling/capture-claimipedia-example.mjs <original-checkout>',vectors},null,2)+'\n');
