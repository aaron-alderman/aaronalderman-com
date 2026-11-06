'use strict';

const {createKernel} = require('../temple-seed.cjs');
const {valuePorts} = require('../ports/value.cjs');
const {browserPorts,reportBrowserError} = require('../ports/browser.cjs');
const {kernelPorts} = require('../ports/kernel.cjs');
const {workerPorts} = require('../ports/worker.cjs');
const {selectPorts} = require('../ports/register.cjs');
const {computationalPorts,browserEffects} = require('../ports/browser-effects.cjs');

function hydrateSnapshot(text) {
  return JSON.parse(text,(_,value)=>value&&typeof value==='object'?Object.freeze(value):value);
}

async function startBrowser(model, factIndex, grants) {
  const host = {document, fetch, state:new Map(),bindings:new Map(),mounts:new Map(), URL:globalThis.URL, Blob:globalThis.Blob, setTimeout:globalThis.setTimeout?.bind(globalThis), reportError:reportBrowserError};
  let pending=Promise.resolve();
  const dispatch = (query,eventInput) => {
    const result=pending.then(async()=>{
      let kernel;
      const ports = selectPorts({...browserPorts(host, dispatch),...valuePorts(),...computationalPorts(host),...browserEffects(host,dispatch),...kernelPorts(()=>kernel)}, grants);
      kernel=createKernel(ports,model.budget);const clock=globalThis.performance;
      const start=clock?.now?.();let succeeded=false;
      try {
        await kernel.run(model.queries[query], {model, factIndex, data:model.data,eventInput});
        succeeded=true;
      } finally {
        // Optional, bounded diagnostic observation; never changes execution or
        // masks its error. Keep only the latest measurement per declared query.
        try {
          const label='Temple '+query;
          if(clock?.measure&&start!==undefined){
            clock.clearMeasures(label);
            clock.measure(label,{start,end:clock.now(),detail:{succeeded,steps:kernel.usage.steps,limit:kernel.usage.limit}});
          }
        } catch {}
      }
    });
    pending=result.catch(()=>{});
    return result;
  };
  await dispatch(model.entry);
}

async function startWorker(model, factIndex, grants, request, secrets) {
  const host = {Response, FormData, fetch, btoa};
  const ports = selectPorts(workerPorts(host, valuePorts()), grants);
  const env = {model, factIndex, request, secrets};
  await createKernel(ports).run(model.queries[model.entry], env);
  return env.result;
}

function createRuntimePort(model, facts, profiles, makeIndex, admit) {
  return async ({entry, mode, queries, factSubjects, data, budget, grantProfile}) => {
    const grants = profiles[grantProfile??mode];
    if (!['browser','worker'].includes(mode) || !Array.isArray(grants)) throw Error('Unknown runtime profile');
    const selected = Object.fromEntries(queries.map(name => {
      if (!Object.hasOwn(model.queries, name)) throw Error('Missing runtime programme: ' + name);
      return [name, model.queries[name]];
    }));
    const runtimeModel = {queries:selected, entry,primitives:Array.from(createKernel.operators)};
    if(data!==undefined)runtimeModel.data=data;
    if(budget!==undefined)runtimeModel.budget=budget;
    if(admit){
      if(!Object.hasOwn(selected,entry))throw Error('Runtime entry is not selected');
      const roots='__temple_runtime_entrypoints';
      if(Object.hasOwn(selected,roots))throw Error('Reserved runtime entrypoint name');
      // Check the union of every declared event root once. The synthetic root is
      // admission input only; it is neither bundled nor executed by the runtime.
      const target={...runtimeModel,entry:roots,queries:{...selected,[roots]:queries.map(call=>({call}))}};
      await admit(target,'admit.model');
      await admit(target,'admit.effects',grants);
    }
    const runtimeFacts = facts.filter(f => factSubjects.includes(f.s));
    const factIndex=await makeIndex(runtimeFacts);
    // Validate the grant names before generating the bundle; creating factories has no effects.
    const available = mode === 'worker' ? workerPorts({},valuePorts()) : {...browserPorts({},()=>{}),...valuePorts(),...computationalPorts({}),...browserEffects({document:{}},()=>{}),...kernelPorts(()=>undefined)};
    selectPorts(available,grants);
    const common = createKernel.toString() + '\n' + selectPorts.toString() + '\n' + hydrateSnapshot.toString() +
      '\nconst model=hydrateSnapshot(' + JSON.stringify(JSON.stringify(runtimeModel)) + ');\nconst factIndex=hydrateSnapshot(' + JSON.stringify(JSON.stringify(factIndex)) + ')' +
      ';\nconst grants=' + JSON.stringify(grants) + ';\n';
    if (mode !== 'worker') return common + reportBrowserError.toString() + '\n' + kernelPorts.toString() + '\n' + valuePorts.toString() + '\n' + browserPorts.toString() + '\n' + computationalPorts.toString() + '\n' + browserEffects.toString() + '\n' + startBrowser.toString() + '\nstartBrowser(model,factIndex,grants).catch(error=>reportBrowserError(error,model.entry));\n';
    return common + valuePorts.toString() + '\n' + workerPorts.toString() + '\n' + startWorker.toString() +
      '\nexport default {fetch(request,secrets){return startWorker(model,factIndex,grants,request,secrets)}};\n';
  };
}

module.exports = {createRuntimePort};
