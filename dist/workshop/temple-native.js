// Exact native body from bootstrap/temple-seed.cjs
/* Pure Temple seed: bounded surface-process evaluator.
 * Native functionality is supplied only through injected ports.
 * No application, DOM construction, CSS, signup or assurance programme lives here.
 * Control/value semantics derive from Claimipedia's surface-process interpreter.
 */
'use strict';

function createKernel(ports = {}, limit = 2000000) {
  if (!Number.isSafeInteger(limit) || limit < 1) throw Error('Invalid execution budget [TEMPLE-K002]');
  let ticks = 0;
  const exhausted = Object.assign(Error('Execution budget exceeded'), {code:'TEMPLE-K001'});
  const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
  const name = key => {
    if (typeof key !== 'string' || forbidden.has(key)) throw Error('Invalid binding');
    return key;
  };
  const tick = () => { if (++ticks > limit) throw exhausted; };
  function reference(path, env) {
    if (!/^\$[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_-]+)*$/.test(path)) throw Error('Invalid process reference');
    let result = env;
    for (const key of path.slice(1).split('.')) {
      name(key);
      if (!result || typeof result !== 'object') throw Error('Unknown reference: ' + path);
      const descriptor = Object.getOwnPropertyDescriptor(result, key);
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) throw Error('Unknown reference: ' + path);
      result = descriptor.value;
    }
    return result;
  }
  function evaluate(x, env) {
    tick();
    if (typeof x === 'string' && x.startsWith('$')) return reference(x, env);
    if (x && typeof x === 'object' && !Array.isArray(x))
      return Object.fromEntries(Object.entries(x).map(([k, v]) => [name(k), evaluate(v, env)]));
    if (!Array.isArray(x)) return x;
    if (!x.length) return [];
    const [op, ...args] = x, v = i => evaluate(args[i], env);
    switch (op) {
      case 'fold': {
        const items=v(0), item=name(args[1]), accumulator=name(args[2]);
        if (!Array.isArray(items) || item===accumulator) throw Error('Invalid expression fold');
        let result=v(3);
        for (const value of items) result=evaluate(args[4],{...env,[item]:value,[accumulator]:result});
        return result;
      }
      case 'let': return evaluate(args[2],{...env,[name(args[0])]:v(1)});
      case 'raise': throw Error(v(0));
      case 'isArray': return Array.isArray(v(0));
      case 'list': return args.map(a => evaluate(a, env));
      case 'append': {
        const a = v(0), b = v(1);
        if (!Array.isArray(a) || !Array.isArray(b)) throw Error('append requires arrays');
        return a.concat(b);
      }
      case 'eq': return JSON.stringify(v(0)) === JSON.stringify(v(1));
      case 'includes': return v(0).includes(v(1));
      case 'if': return evaluate(args[v(0) ? 1 : 2], env);
      case 'count': return v(0).length;
      case 'at': {const value=v(0),key=v(1);return value==null?undefined:Object.getOwnPropertyDescriptor(Object(value),key)?.value;}
      case 'concat': return args.map(a => evaluate(a, env)).join('');
      case 'add': return Number(v(0)) + Number(v(1));
      case 'range': {
        const length = v(0);
        if (!Number.isSafeInteger(length) || length < 0 || length > limit) throw Error('Invalid bounded range');
        return Array.from({length}, (_, i) => i + 1);
      }
      case 'distinct': return [...new Set(v(0))];
      default: throw Error('Unknown algebra operation: ' + String(op));
    }
  }
  async function run(program, env) {
    if (!Array.isArray(program)) throw Error('Process must be an array');
    for (const step of program) {
      tick();
      const kinds = ['let', 'assert', 'when', 'each', 'fold', 'call', 'port', 'try'].filter(k => Object.hasOwn(step, k));
      if (kinds.length !== 1) throw Error('Unknown or ambiguous process statement');
      switch (kinds[0]) {
        case 'let': env[name(step.let)] = evaluate(step.value, env); break;
        case 'assert': if (!evaluate(step.assert, env)) throw Error(step.message); break;
        case 'when': if (evaluate(step.when, env)) await run(step.then, env); break;
        case 'each':
          for (const item of evaluate(step.each, env)) await run(step.steps, {...env, [name(step.as)]: item});
          break;
        case 'fold': {
          let accumulator = evaluate(step.initial, env);
          for (const item of evaluate(step.fold, env)) {
            const local = {...env, [name(step.as)]: item, [name(step.accumulator)]: accumulator};
            await run(step.steps, local);
            accumulator = evaluate(step.yield, local);
          }
          env[name(step.into)] = accumulator;
          break;
        }
        case 'call':
          if (!Object.hasOwn(env.model.queries, step.call)) throw Error('Unknown process: ' + step.call);
          await run(env.model.queries[step.call], env); break;
        case 'port':
          if (!Object.hasOwn(ports, step.port)) throw Error('Unknown host port: ' + step.port);
          env[name(step.into)] = await ports[step.port](evaluate(step.args, env), env); break;
        case 'try':
          try { await run(step.try, env); }
          catch (error) {
            if (error === exhausted) throw error;
            env[name(step.error)] = {name: error.name, message: error.message};
            await run(step.catch, env);
          }
          break;
      }
    }
    return env;
  }
  return {evaluate,run,get usage(){return {steps:ticks,limit};}};
}

createKernel.operators=Object.freeze(['fold','let','raise','isArray','list','append','eq','includes','if','count','at','concat','add','range','distinct']);

// Exact native body from bootstrap/ports/value.cjs
'use strict';

function valuePorts() {
  // JSON transport refuses lossy host values; evaluator-internal absence is not JSON.
  const transport=(value,seen=new Set())=>{
    if(value===null || typeof value==='string' || typeof value==='boolean')return;
    if(typeof value==='number' && Number.isFinite(value))return;
    if(!value || typeof value!=='object' || seen.has(value))throw Error('Nonportable JSON value [TEMPLE-V001]');
    const array=Array.isArray(value), descriptors=Object.getOwnPropertyDescriptors(value);
    if(!array && ![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error('Nonportable JSON record [TEMPLE-V001]');
    const keys=Reflect.ownKeys(value).filter(key=>!(array && key==='length'));
    if(array && (keys.length!==value.length || keys.some((key,index)=>key!==String(index))))throw Error('Nonportable JSON array [TEMPLE-V001]');
    seen.add(value);
    for(const key of keys){
      const descriptor=descriptors[key];
      if(typeof key!=='string' || !descriptor.enumerable || !Object.hasOwn(descriptor,'value'))throw Error('Nonportable JSON field [TEMPLE-V001]');
      transport(descriptor.value,seen);
    }
    seen.delete(value);
  };
  return {
    'value.describe': ({value}) => {
      const object=value!==null && typeof value==='object';
      const descriptors=object?Object.getOwnPropertyDescriptors(value):{};
      return {type:typeof value,array:Array.isArray(value),null:value===null,
        plain:object && [Object.prototype,null].includes(Object.getPrototypeOf(value)),
        finite:typeof value==='number' && Number.isFinite(value),
        dataOnly:Reflect.ownKeys(descriptors).every(key=>typeof key==='string' && Object.hasOwn(descriptors[key],'value') && (descriptors[key].enumerable || (Array.isArray(value) && key==='length'))),
        dense:!Array.isArray(value) || (Object.keys(value).length===value.length && Object.keys(value).every((key,index)=>key===String(index)))};
    },
    'json.parse': ({text}) => {const value=JSON.parse(text);transport(value);return value;},
    'json.stringify': ({value,space}) => {transport(value);return JSON.stringify(value,null,space);},
    'value.string': ({value}) => String(value),
    'value.type': ({value}) => typeof value,
    'record.entries': ({value}) => Object.entries(value),
    'record.fromEntries': ({entries}) => Object.fromEntries(entries),
    'record.put': ({record,key,value}) => Object.assign(Object.create(null),record,{[key]:value}),
    'value.freeze': ({value}) => {
      const freeze=item=>{if(item&&typeof item==='object'&&!Object.isFrozen(item)){Object.values(item).forEach(freeze);Object.freeze(item);}return item;};
      return freeze(value);
    },
    'record.get': ({record, key}) => record != null && Object.hasOwn(record, key) ? record[key] : null,
    'text.replaceAll': ({value, search, replacement}) => value.replaceAll(search, replacement),
    'text.split': ({value, pattern}) => value.split(new RegExp(pattern)),
    'text.join': ({values, separator}) => values.join(separator),
    'text.slice': ({value,start,end}) => value.slice(start,end),
    'text.indexOf': ({value,search,from}) => value.indexOf(search,from),
    // Native collation observation only; ordering policy stays in algebra.
    'text.compare': ({left,right}) => left.localeCompare(right),
    'text.trim': ({value}) => value.trim(),
    'text.lowerCase': ({value}) => value.toLowerCase(),
    'text.matches': ({value, pattern, flags}) => new RegExp(pattern, flags).test(value),
  };
}


// Exact native body from bootstrap/ports/kernel.cjs
'use strict';

// Invocation mechanics only. Compilation, admission, target selection and
// application policy remain authored programmes. Both ports use the dispatch's
// existing kernel, so nested work consumes the same budget and fault identity.
function kernelPorts(resolveKernel) {
  return {
    'kernel.evaluate': ({expression,bindings}) => resolveKernel().evaluate(expression,bindings),
    'kernel.invoke': async ({query,input},env) => {
      if (!Object.hasOwn(env.model.queries,query)) throw Error('Unknown admitted process: '+query);
      const local={...env,eventInput:input??{}};
      await resolveKernel().run(env.model.queries[query],local);
      return Object.hasOwn(local,'result') ? local.result : null;
    },
    'kernel.execute': async ({model,entry,input},env) => {
      if(!model||!Object.hasOwn(model.queries??{},entry))throw Error('Unknown candidate process: '+entry);
      const local={...env,model,eventInput:input??{}};
      await resolveKernel().run(model.queries[entry],local);
      return Object.hasOwn(local,'result')?local.result:null;
    },
  };
}


// Exact native body from bootstrap/ports/programme.cjs
'use strict';


// Generic invocation bridge. Admission and language semantics live in algebra.
async function invoke({model,entry,input={},ports,limit=20000000,nested=[]}) {
  let kernel;
  const bridge=kernelPorts(()=>kernel);
  const selected=Object.fromEntries(nested.map(name=>{if(!Object.hasOwn(bridge,name))throw Error('Unknown kernel bridge grant: '+name);return [name,bridge[name]]}));
  kernel=createKernel({...ports,...selected},limit);
  const env={...input,model};
  await kernel.run(model.queries[entry],env);
  return {value:env.result,usage:kernel.usage};
}


export {createKernel,valuePorts,kernelPorts,invoke};
