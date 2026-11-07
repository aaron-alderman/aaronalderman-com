import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRoadmapAssessor} from './assess-roadmap.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const input={topics:read('dist/assurance/topics.json'),identity:read('dist/assurance/identity-mappings.json'),source:read('dist/assurance/navigation-layout.json'),rendered:read('dist/assurance/rendered-layout.json'),workflow:read('dist/roadmap/workflow.json')};
const assessor=await createRoadmapAssessor(),derive=async value=>(await assessor.derive(value)).value;
const initial=await derive(input),target=initial.items.find(i=>i.origin==='rendered'),item=r=>r.items.find(i=>i.id===target.id);
function withoutTarget(){const value=structuredClone(input);value.rendered.report.findings=value.rendered.report.findings.filter(f=>'observation:'+JSON.stringify(['rendered',f.finding.rule,f.finding.node])!==target.id);return value;}
function receipt(record,extra={}){return {itemId:record.id,verificationKey:record.verificationKey,source:'/assurance/rendered-layout.json',issuer:'Test reviewer',observedAt:'2026-11-07',method:'Scoped verification fixture',verdict:'verified',...extra};}

test('roadmap is algebra-derived, scoped and groups observations without losing evidence',async()=>{
 assert.equal(initial.protocol,'worldwright/roadmap/1');
 assert.equal(initial.items.filter(i=>i.origin==='maturity').length,input.topics.roadmap.length);
 assert.equal(initial.items.filter(i=>i.origin==='identity').length,input.identity.rows.filter(r=>!['identity-mapped','intentionally-invariant'].includes(r.status)).length);
 const groups=new Set(input.rendered.report.findings.map(f=>JSON.stringify(['rendered',f.finding.rule,f.finding.node])));
 assert.equal(initial.items.filter(i=>i.origin==='rendered'&&i.active).length,groups.size);
 assert.equal(new Set(initial.items.map(i=>i.id)).size,initial.total);
 assert.ok(initial.items.every(i=>i.owner==='Unassigned'&&i.doneWhen&&i.nextAction&&i.evidence.length&&i.verificationKey));
 const twice=structuredClone(input);twice.rendered.report.findings.push(...structuredClone(twice.rendered.report.findings));
 const replay=await derive(twice);assert.deepEqual(replay.items.map(i=>i.id),initial.items.map(i=>i.id));assert.equal(item(replay).occurrences,target.occurrences*2);
 const gates=initial.items.filter(i=>i.kind==='evidence');assert.ok(new Set(gates.map(i=>i.product)).size>18);
 for(const gate of gates)for(const id of gate.dependsOn){const dependency=gates.find(i=>i.id===id);assert.equal(dependency.product,gate.product);assert.equal(dependency.topic,gate.topic);assert.ok(dependency.targetLevel<gate.targetLevel);}
 assert.deepEqual(input.topics,read('dist/assurance/topics.json'),'Workflow never changes maturity evidence');
});

test('disappearance is retained, completion needs scoped evidence, and recurrence reopens',async()=>{
 const gone=withoutTarget(),retained=item(await derive(gone));assert.equal(retained.active,false);assert.equal(retained.stage,'verification-required');
 gone.workflow.decisions=[{itemId:target.id,stage:'done',owner:'Test reviewer'}];assert.equal(item(await derive(gone)).stage,'verification-required');
 gone.workflow.receipts=[receipt(retained,{verificationKey:'stale'})];assert.equal(item(await derive(gone)).stage,'verification-required');
 gone.workflow.receipts=[receipt(retained)];assert.equal(item(await derive(gone)).stage,'done');
 const returned=structuredClone(input);returned.workflow=gone.workflow;assert.equal(item(await derive(returned)).stage,'verification-required');
});

test('authored ownership, blocking, acceptance and priority declarations are checked',async()=>{
 const value=structuredClone(input),decision={itemId:target.id,stage:'in-progress'};value.workflow.decisions=[decision];
 assert.equal(item(await derive(value)).stage,'triage');decision.owner='Assigned reviewer';assert.equal(item(await derive(value)).stage,'in-progress');
 decision.stage='blocked';assert.equal(item(await derive(value)).stage,'triage');decision.reason='Needs design intent';assert.equal(item(await derive(value)).stage,'blocked');
 decision.stage='accepted';assert.equal(item(await derive(value)).stage,'verification-required');value.workflow.receipts=[receipt(target,{verdict:'accepted',rationale:'Explicit scoped design decision'})];assert.equal(item(await derive(value)).stage,'accepted');
 decision.priority='unknown';const fallback=await derive(value);assert.equal(item(fallback).priority,target.priority);assert.equal(fallback.total,initial.total);
 decision.stage='nonsense';assert.equal(item(await derive(value)).stage,'triage');
 value.workflow.decisions.push({...decision});await assert.rejects(derive(value),/ROADMAP-DECISION/);
 const orphan=structuredClone(input);orphan.workflow.decisions=[{itemId:'nonexistent',stage:'done'}];assert.equal((await derive(orphan)).workflowIssues.length,1);
 const dependent=initial.items.find(i=>i.dependsOn.length);const blocked=structuredClone(input);blocked.workflow.decisions=[{itemId:dependent.id,owner:'Assigned reviewer',stage:'in-progress'}];assert.equal((await derive(blocked)).items.find(i=>i.id===dependent.id).stage,'blocked');
});

test('roadmap is indexed, uses an admitted runtime and exposes a portable work record',()=>{
 const page=fs.readFileSync('dist/roadmap/index.html','utf8'),index=fs.readFileSync('dist/assurance/index.html','utf8');
 assert.ok(index.includes('href="../roadmap/"'));assert.ok(page.includes('Inspect roadmap and todo'));assert.ok(page.includes('todo-json'));assert.ok(page.includes('runtime.js'));
 assert.ok(!page.includes('Back to Aaron Alderman'));assert.ok(fs.readFileSync('dist/roadmap/runtime.js','utf8').includes('const model=hydrateSnapshot('));
 assert.equal(input.workflow.protocol,'worldwright/roadmap-workflow/1');assert.ok(input.workflow.ledger.length>0);assert.deepEqual(input.workflow.decisions,[]);assert.deepEqual(input.workflow.receipts,[]);
});

test('the general roadmap accepts product plans independently of assurance and verifies revisions',async()=>{
 const value=structuredClone(input);value.workflow.work=[{id:'product-plan-fixture',product:'temple',title:'Declared product work',revision:'1',nextAction:'Implement the declared change.',doneWhen:'The intended outcome has scoped verification.',horizon:'next'}];
 const report=await derive(value),plan=report.items.find(i=>i.id==='planned:product-plan-fixture');assert.equal(report.total,initial.total+1);assert.equal(plan.origin,'planning');assert.equal(plan.kind,'plan');assert.equal(plan.stage,'todo');
 value.workflow.decisions=[{itemId:plan.id,stage:'done'}];assert.equal((await derive(value)).items.find(i=>i.id===plan.id).stage,'verification-required');
 value.workflow.receipts=[receipt(plan)];assert.equal((await derive(value)).items.find(i=>i.id===plan.id).stage,'done');
 value.workflow.work[0].revision='2';assert.equal((await derive(value)).items.find(i=>i.id===plan.id).stage,'verification-required');
 value.workflow.work.push({...value.workflow.work[0]});await assert.rejects(derive(value),/ROADMAP-PLAN/);
 assert.equal(input.workflow.intakes.length,2);assert.equal(input.workflow.work.length,0);
});
