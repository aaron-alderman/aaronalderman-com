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
function selectPorts(available, grants) {
  if (!Array.isArray(grants) || new Set(grants).size !== grants.length) throw Error('Invalid native port grants');
  const selected = Object.create(null);
  for (const name of grants) {
    if (!Object.hasOwn(available, name) || typeof available[name] !== 'function') throw Error('Unavailable native port: ' + name);
    selected[name] = available[name];
  }
  return Object.freeze(selected);
}
function hydrateSnapshot(text) {
  return JSON.parse(text,(_,value)=>value&&typeof value==='object'?Object.freeze(value):value);
}
const model=hydrateSnapshot("{\"queries\":{\"atlas.seen.clean\":[{\"let\":\"clean\",\"value\":[\"distinct\",[\"if\",[\"isArray\",\"$candidate\"],[\"fold\",\"$candidate\",\"id\",\"__templeDerived1424\",[\"list\"],[\"if\",[\"includes\",\"$data.ids\",\"$id\"],[\"append\",\"$__templeDerived1424\",[\"list\",\"$id\"]],\"$__templeDerived1424\"]],[\"raise\",\"filter requires an array\"]]]}],\"atlas.seen.load\":[{\"port\":\"storage.read\",\"args\":{\"key\":\"worldwright.atlas.seen.v1\",\"maxLength\":4096},\"into\":\"stored\"},{\"port\":\"state.get\",\"args\":{\"key\":\"seen\"},\"into\":\"previous\"},{\"port\":\"text.split\",\"args\":{\"value\":[\"if\",\"$stored.value\",\"$stored.value\",\"\"],\"pattern\":\"\\\\n\"},\"into\":\"items\"},{\"let\":\"candidate\",\"value\":[\"if\",\"$stored.ok\",\"$items\",[\"fold\",[\"list\",\"$previous\",[\"list\"]],\"__templeDerived1425\",\"__templeDerived1426\",null,[\"if\",\"$__templeDerived1426\",\"$__templeDerived1426\",[\"if\",\"$__templeDerived1425\",\"$__templeDerived1425\",null]]]]},{\"call\":\"atlas.seen.clean\"},{\"port\":\"state.set\",\"args\":{\"key\":\"seen\",\"value\":\"$clean\"},\"into\":\"_\"},{\"port\":\"state.set\",\"args\":{\"key\":\"saved\",\"value\":\"$stored.ok\"},\"into\":\"_\"}],\"atlas.seen.save\":[{\"port\":\"state.get\",\"args\":{\"key\":\"seen\"},\"into\":\"seen\"},{\"port\":\"text.join\",\"args\":{\"values\":\"$seen\",\"separator\":\"\\n\"},\"into\":\"text\"},{\"port\":\"storage.write\",\"args\":{\"key\":\"worldwright.atlas.seen.v1\",\"value\":\"$text\"},\"into\":\"saved\"},{\"port\":\"state.set\",\"args\":{\"key\":\"saved\",\"value\":\"$saved.ok\"},\"into\":\"_\"}],\"atlas.seen.mark\":[{\"port\":\"state.get\",\"args\":{\"key\":\"seen\"},\"into\":\"seen\"},{\"let\":\"candidate\",\"value\":[\"append\",\"$seen\",[\"list\",\"$current\"]]},{\"call\":\"atlas.seen.clean\"},{\"port\":\"state.set\",\"args\":{\"key\":\"seen\",\"value\":\"$clean\"},\"into\":\"_\"},{\"call\":\"atlas.seen.save\"}],\"atlas.seen.paint\":[{\"port\":\"state.get\",\"args\":{\"key\":\"seen\"},\"into\":\"seen\"},{\"port\":\"browser.select\",\"args\":{\"selector\":\"[data-atlas-id]\"},\"into\":\"links\"},{\"each\":\"$links\",\"as\":\"link\",\"steps\":[{\"let\":\"id\",\"value\":[\"at\",\"$link.attributes\",\"data-atlas-id\"]},{\"let\":\"isSeen\",\"value\":[\"includes\",\"$seen\",\"$id\"]},{\"port\":\"browser.attribute\",\"args\":{\"ref\":\"$link.ref\",\"name\":\"data-seen\",\"value\":[\"if\",\"$isSeen\",\"true\",\"false\"]},\"into\":\"_\"},{\"port\":\"browser.attribute\",\"args\":{\"ref\":\"$link.ref\",\"name\":\"aria-label\",\"value\":[\"concat\",[\"at\",\"$data.labels\",\"$id\"],[\"if\",\"$isSeen\",\" — seen\",\"\"]]},\"into\":\"_\"}]},{\"port\":\"dom.exists\",\"args\":{\"selector\":\"#atlas-memory\"},\"into\":\"onAtlas\"},{\"when\":\"$onAtlas\",\"then\":[{\"port\":\"dom.hidden\",\"args\":{\"selector\":\"#atlas-memory\",\"value\":false},\"into\":\"_\"},{\"port\":\"dom.text\",\"args\":{\"selector\":\"#atlas-progress\",\"text\":[\"concat\",[\"count\",\"$seen\"],\" of 40 places seen\"]},\"into\":\"_\"},{\"port\":\"state.get\",\"args\":{\"key\":\"saved\"},\"into\":\"saved\"},{\"port\":\"dom.text\",\"args\":{\"selector\":\"#atlas-storage-note\",\"text\":[\"if\",\"$saved\",\"Remembered only in this browser. Pale green lights mark places you’ve opened.\",\"Browser storage is unavailable. Seen places are kept only while this page stays open.\"]},\"into\":\"_\"}]}],\"atlas.seen.refresh\":[{\"call\":\"atlas.seen.load\"},{\"call\":\"atlas.seen.paint\"}],\"atlas.seen.reset\":[{\"port\":\"storage.remove\",\"args\":{\"key\":\"worldwright.atlas.seen.v1\"},\"into\":\"removed\"},{\"port\":\"state.set\",\"args\":{\"key\":\"seen\",\"value\":[\"list\"]},\"into\":\"_\"},{\"port\":\"state.set\",\"args\":{\"key\":\"saved\",\"value\":\"$removed.ok\"},\"into\":\"_\"},{\"call\":\"atlas.seen.paint\"},{\"port\":\"dom.text\",\"args\":{\"selector\":\"#atlas-progress\",\"text\":\"Your map is clear. 0 of 40 places seen.\"},\"into\":\"_\"}],\"atlas.pin.dismiss\":[{\"when\":[\"eq\",\"$eventInput.event.key\",\"Escape\"],\"then\":[{\"port\":\"browser.class\",\"args\":{\"ref\":\"$eventInput.matched.ref\",\"name\":\"is-dismissed\",\"value\":true},\"into\":\"_\"}]}],\"atlas.pin.reveal\":[{\"port\":\"browser.class\",\"args\":{\"ref\":\"$eventInput.matched.ref\",\"name\":\"is-dismissed\",\"value\":false},\"into\":\"_\"},{\"call\":\"atlas.pin.preview\"}],\"atlas.journey.boot\":[{\"port\":\"state.set\",\"args\":{\"key\":\"seen\",\"value\":[\"list\"]},\"into\":\"_\"},{\"call\":\"atlas.journey.resume\"},{\"when\":\"$onAtlas\",\"then\":[{\"port\":\"dom.on\",\"args\":{\"selector\":\"#atlas-reset\",\"event\":\"click\",\"query\":\"atlas.seen.reset\"},\"into\":\"_\"},{\"port\":\"browser.on\",\"args\":{\"ref\":\"document\",\"event\":\"keydown\",\"delegate\":\".atlas-pin\",\"query\":\"atlas.pin.dismiss\"},\"into\":\"_\"},{\"port\":\"browser.on\",\"args\":{\"ref\":\"document\",\"event\":\"focusin\",\"delegate\":\".atlas-pin\",\"query\":\"atlas.pin.reveal\"},\"into\":\"_\"},{\"port\":\"browser.on\",\"args\":{\"ref\":\"document\",\"event\":\"pointerover\",\"delegate\":\".atlas-pin\",\"query\":\"atlas.pin.reveal\"},\"into\":\"_\"},{\"port\":\"browser.on\",\"args\":{\"ref\":\"window\",\"event\":\"storage\",\"query\":\"atlas.seen.refresh\"},\"into\":\"_\"},{\"call\":\"atlas.pin.mode\"},{\"port\":\"browser.on\",\"args\":{\"ref\":{\"media\":\"(max-width: 760px)\"},\"event\":\"change\",\"query\":\"atlas.pin.mode\"},\"into\":\"_\"}]},{\"port\":\"browser.on\",\"args\":{\"ref\":\"window\",\"event\":\"pageshow\",\"query\":\"atlas.journey.resume\"},\"into\":\"_\"}],\"atlas.pin.preview\":[{\"let\":\"id\",\"value\":[\"at\",\"$eventInput.matched.attributes\",\"data-atlas-id\"]},{\"when\":[\"includes\",\"$data.ids\",\"$id\"],\"then\":[{\"let\":\"place\",\"value\":[\"at\",[\"if\",[\"isArray\",\"$data.places\"],[\"fold\",\"$data.places\",\"p\",\"__templeDerived1455\",[\"list\"],[\"if\",[\"eq\",\"$p.id\",\"$id\"],[\"append\",\"$__templeDerived1455\",[\"list\",\"$p\"]],\"$__templeDerived1455\"]],[\"raise\",\"filter requires an array\"]],0]},{\"port\":\"dom.text\",\"args\":{\"selector\":\"#atlas-preview-title\",\"text\":\"$place.name\"},\"into\":\"_\"},{\"port\":\"dom.text\",\"args\":{\"selector\":\"#atlas-preview-question\",\"text\":\"$place.question\"},\"into\":\"_\"},{\"port\":\"browser.attribute\",\"args\":{\"ref\":\"#atlas-preview-link\",\"name\":\"href\",\"value\":[\"concat\",\"places/\",\"$id\",\".html\"]},\"into\":\"_\"},{\"port\":\"dom.hidden\",\"args\":{\"selector\":\"#atlas-preview-link\",\"value\":false},\"into\":\"_\"}]}],\"atlas.pin.mode\":[{\"port\":\"state.get\",\"args\":{\"key\":\"mobileClick\"},\"into\":\"binding\"},{\"when\":\"$binding\",\"then\":[{\"port\":\"browser.cancel\",\"args\":{\"id\":\"$binding\"},\"into\":\"_\"}]},{\"port\":\"state.set\",\"args\":{\"key\":\"mobileClick\",\"value\":null},\"into\":\"_\"},{\"port\":\"browser.mediaQuery\",\"args\":{\"query\":\"(max-width: 760px)\"},\"into\":\"small\"},{\"when\":\"$small\",\"then\":[{\"port\":\"browser.on\",\"args\":{\"ref\":\"document\",\"event\":\"click\",\"delegate\":\".atlas-pin\",\"preventDefault\":true,\"query\":\"atlas.pin.preview\"},\"into\":\"binding\"},{\"port\":\"state.set\",\"args\":{\"key\":\"mobileClick\",\"value\":\"$binding\"},\"into\":\"_\"}]}],\"atlas.journey.resume\":[{\"call\":\"atlas.seen.load\"},{\"port\":\"dom.exists\",\"args\":{\"selector\":\"[data-atlas-current]\"},\"into\":\"isPlace\"},{\"when\":\"$isPlace\",\"then\":[{\"port\":\"dom.attribute\",\"args\":{\"selector\":\"[data-atlas-current]\",\"name\":\"data-atlas-current\"},\"into\":\"current\"},{\"when\":[\"includes\",\"$data.ids\",\"$current\"],\"then\":[{\"call\":\"atlas.seen.mark\"},{\"port\":\"dom.hidden\",\"args\":{\"selector\":\"#atlas-visit-note\",\"value\":false},\"into\":\"_\"},{\"port\":\"state.get\",\"args\":{\"key\":\"saved\"},\"into\":\"saved\"},{\"port\":\"dom.text\",\"args\":{\"selector\":\"#atlas-visit-note\",\"text\":[\"if\",\"$saved\",\"✓ Seen on your map. Your visit is remembered in this browser.\",\"Your browser couldn’t save this visit. You can still explore every place.\"]},\"into\":\"_\"}]}]},{\"port\":\"dom.exists\",\"args\":{\"selector\":\"#atlas-memory\"},\"into\":\"onAtlas\"},{\"when\":\"$onAtlas\",\"then\":[{\"call\":\"atlas.seen.paint\"}]}]},\"entry\":\"atlas.journey.boot\",\"primitives\":[\"fold\",\"let\",\"raise\",\"isArray\",\"list\",\"append\",\"eq\",\"includes\",\"if\",\"count\",\"at\",\"concat\",\"add\",\"range\",\"distinct\"],\"data\":{\"ids\":[\"observation\",\"return\",\"instrument\",\"personal\",\"care\",\"contact\",\"kenosis\",\"sourcery\",\"monster\",\"calibration\",\"replay\",\"water\",\"discomfort\",\"listening\",\"restraint\",\"permission\",\"representation\",\"revision\",\"workshop\",\"possibility\",\"reachable\",\"memory\",\"erasure\",\"attention\",\"will\",\"stone\",\"preservation\",\"tiling\",\"code\",\"laboratory\",\"cost\",\"cosmos\",\"scale\",\"coexistence\",\"weights\",\"hiddenness\",\"hope\",\"texts\",\"commons\",\"closedpath\"],\"labels\":{\"observation\":\"Observation. What did the measurement miss?\",\"return\":\"The return. Back where you started. Something has changed.\",\"instrument\":\"The instrument. The change can be real. The detector can miss it.\",\"personal\":\"Love, separation and trust. I trusted the process.\",\"care\":\"Care. Remember to care.\",\"contact\":\"Contact & correction. Beautiful words. The wrong answer.\",\"kenosis\":\"Power & agency. If you could control everything, should you?\",\"sourcery\":\"Machines & agency. More help from machines. More say for people.\",\"monster\":\"The Monster trail. A matching number is only a clue.\",\"calibration\":\"The borrowed ruler. Before you trust the reading, check the ruler.\",\"replay\":\"The replay room. Can someone else check the result?\",\"water\":\"The water’s edge. The horse has a few questions.\",\"discomfort\":\"The inconvenient truth. Truth hurts. So can being wrong.\",\"listening\":\"The unasked question. What are they trying to do?\",\"restraint\":\"The open hand. Leaving room is still a choice.\",\"permission\":\"Three doors. I can. May I? Should I?\",\"representation\":\"The mapmaker’s debt. Every map leaves something out.\",\"revision\":\"The visible seam. Let the correction leave a seam.\",\"workshop\":\"The workshop. Can you follow a change?\",\"possibility\":\"The garden. What can exist together?\",\"reachable\":\"The far gate. Possible. Permitted. Still out of reach.\",\"memory\":\"The echo chamber. Gone from the picture. Still in the motion.\",\"erasure\":\"The erased distinction. A record can forget completely.\",\"attention\":\"The living canopy. The same clearing. A different field of attention.\",\"will\":\"The unfinished intention. An intention is not yet an action.\",\"stone\":\"The house of stone. One stone. Many histories.\",\"preservation\":\"The surviving trace. What survives is not everything that happened.\",\"tiling\":\"The patterned wall. Grow a pattern. Keep count.\",\"code\":\"The repair bench. Can a message survive a mistake?\",\"laboratory\":\"The working laboratory. How could we tell the explanations apart?\",\"cost\":\"The control ledger. Slower can cost more.\",\"cosmos\":\"The unfinished observatory. A larger sky. An unfinished explanation.\",\"scale\":\"The changing scale. Zoom out. What disappears?\",\"coexistence\":\"The crossing of paths. What changes when time is short?\",\"weights\":\"The weight of a choice. Who decides what matters?\",\"hiddenness\":\"The quiet horizon. Room for faith. Room for a question.\",\"hope\":\"The light beyond. Restoration without erasure.\",\"texts\":\"The reading room. A reading is not yet a prediction.\",\"commons\":\"The unfinished commons. Someone else can change the question.\",\"closedpath\":\"The retained refusal. A failed attempt can still help.\"},\"places\":[{\"id\":\"observation\",\"name\":\"Observation\",\"question\":\"What did the measurement miss?\"},{\"id\":\"return\",\"name\":\"The return\",\"question\":\"Back where you started. Something has changed.\"},{\"id\":\"instrument\",\"name\":\"The instrument\",\"question\":\"The change can be real. The detector can miss it.\"},{\"id\":\"personal\",\"name\":\"Love, separation and trust\",\"question\":\"I trusted the process.\"},{\"id\":\"care\",\"name\":\"Care\",\"question\":\"Remember to care.\"},{\"id\":\"contact\",\"name\":\"Contact & correction\",\"question\":\"Beautiful words. The wrong answer.\"},{\"id\":\"kenosis\",\"name\":\"Power & agency\",\"question\":\"If you could control everything, should you?\"},{\"id\":\"sourcery\",\"name\":\"Machines & agency\",\"question\":\"More help from machines. More say for people.\"},{\"id\":\"monster\",\"name\":\"The Monster trail\",\"question\":\"A matching number is only a clue.\"},{\"id\":\"calibration\",\"name\":\"The borrowed ruler\",\"question\":\"Before you trust the reading, check the ruler.\"},{\"id\":\"replay\",\"name\":\"The replay room\",\"question\":\"Can someone else check the result?\"},{\"id\":\"water\",\"name\":\"The water’s edge\",\"question\":\"The horse has a few questions.\"},{\"id\":\"discomfort\",\"name\":\"The inconvenient truth\",\"question\":\"Truth hurts. So can being wrong.\"},{\"id\":\"listening\",\"name\":\"The unasked question\",\"question\":\"What are they trying to do?\"},{\"id\":\"restraint\",\"name\":\"The open hand\",\"question\":\"Leaving room is still a choice.\"},{\"id\":\"permission\",\"name\":\"Three doors\",\"question\":\"I can. May I? Should I?\"},{\"id\":\"representation\",\"name\":\"The mapmaker’s debt\",\"question\":\"Every map leaves something out.\"},{\"id\":\"revision\",\"name\":\"The visible seam\",\"question\":\"Let the correction leave a seam.\"},{\"id\":\"workshop\",\"name\":\"The workshop\",\"question\":\"Can you follow a change?\"},{\"id\":\"possibility\",\"name\":\"The garden\",\"question\":\"What can exist together?\"},{\"id\":\"reachable\",\"name\":\"The far gate\",\"question\":\"Possible. Permitted. Still out of reach.\"},{\"id\":\"memory\",\"name\":\"The echo chamber\",\"question\":\"Gone from the picture. Still in the motion.\"},{\"id\":\"erasure\",\"name\":\"The erased distinction\",\"question\":\"A record can forget completely.\"},{\"id\":\"attention\",\"name\":\"The living canopy\",\"question\":\"The same clearing. A different field of attention.\"},{\"id\":\"will\",\"name\":\"The unfinished intention\",\"question\":\"An intention is not yet an action.\"},{\"id\":\"stone\",\"name\":\"The house of stone\",\"question\":\"One stone. Many histories.\"},{\"id\":\"preservation\",\"name\":\"The surviving trace\",\"question\":\"What survives is not everything that happened.\"},{\"id\":\"tiling\",\"name\":\"The patterned wall\",\"question\":\"Grow a pattern. Keep count.\"},{\"id\":\"code\",\"name\":\"The repair bench\",\"question\":\"Can a message survive a mistake?\"},{\"id\":\"laboratory\",\"name\":\"The working laboratory\",\"question\":\"How could we tell the explanations apart?\"},{\"id\":\"cost\",\"name\":\"The control ledger\",\"question\":\"Slower can cost more.\"},{\"id\":\"cosmos\",\"name\":\"The unfinished observatory\",\"question\":\"A larger sky. An unfinished explanation.\"},{\"id\":\"scale\",\"name\":\"The changing scale\",\"question\":\"Zoom out. What disappears?\"},{\"id\":\"coexistence\",\"name\":\"The crossing of paths\",\"question\":\"What changes when time is short?\"},{\"id\":\"weights\",\"name\":\"The weight of a choice\",\"question\":\"Who decides what matters?\"},{\"id\":\"hiddenness\",\"name\":\"The quiet horizon\",\"question\":\"Room for faith. Room for a question.\"},{\"id\":\"hope\",\"name\":\"The light beyond\",\"question\":\"Restoration without erasure.\"},{\"id\":\"texts\",\"name\":\"The reading room\",\"question\":\"A reading is not yet a prediction.\"},{\"id\":\"commons\",\"name\":\"The unfinished commons\",\"question\":\"Someone else can change the question.\"},{\"id\":\"closedpath\",\"name\":\"The retained refusal\",\"question\":\"A failed attempt can still help.\"}]},\"budget\":2000000}");
const factIndex=hydrateSnapshot("{\"protocol\":\"temple/fact-index/1\",\"objects\":{},\"subjects\":{},\"factCount\":0}");
const grants=["storage.read","storage.write","storage.remove","state.get","state.set","text.split","text.join","dom.exists","dom.attribute","dom.hidden","dom.text","dom.on","browser.select","browser.attribute","browser.on","browser.class","browser.mediaQuery","browser.cancel"];
function reportBrowserError(error,query) {
  // Generic host fault display. The document opts into a sink; no application
  // recovery, model mutation, retry or fresh execution budget is introduced.
  const sink=document.querySelector('[data-temple-errors]');
  if(sink)sink.textContent=error ? (query ? query+': ' : '')+String(error.message??error) : '';
  if(error)console.error(error);
}
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
function browserPorts(host, dispatch) {
  const {document, fetch, reportError} = host;
  const bindings=host.bindings??new Map();
  const mounts=host.mounts??new Map();
  const node = selector => { const result = document.querySelector(selector); if (!result) throw Error('Missing DOM target: ' + selector); return result; };
  return {
    'state.get': ({key}) => host.state.get(key),
    'state.set': ({key, value}) => {host.state.set(key,value);return true;},
    'dom.setValue': ({selector,value}) => {const target=node(selector);if(target.value!==value)target.value=value;return true;},
    'dom.readOnly': ({selector,value}) => {node(selector).readOnly=Boolean(value);return true;},
    'dom.selection': ({selector}) => {const target=node(selector);return {start:target.selectionStart??0,end:target.selectionEnd??0};},
    'dom.setSelection': ({selector,start,end}) => {node(selector).setSelectionRange(start,end);return true;},
    'dom.disabled': ({selector,value}) => {node(selector).disabled=Boolean(value);return true;},
    'dom.hidden': ({selector,value}) => {node(selector).hidden=Boolean(value);return true;},
    'dom.focus': ({selector}) => {node(selector).focus();return true;},
    'download.text': ({name,text}) => {
      const url=host.URL.createObjectURL(new host.Blob([text],{type:'text/plain;charset=utf-8'}));
      const link=document.createElement('a');link.href=url;link.download=name;
      document.body.appendChild(link);link.click();link.remove();
      host.setTimeout(()=>host.URL.revokeObjectURL(url),0);return true;
    },
    'dom.exists': ({selector}) => Boolean(document.querySelector(selector)),
    'dom.on': ({selector, event, query, preventDefault, input, observeEvent, preventKeys}) => { const target=node(selector);bindings.set(selector+'\0'+event,{selector,event,query,input:input??null,target});target.addEventListener(event, e => {
      if (preventDefault || preventKeys?.includes(e.key)) e.preventDefault();
      reportError(null);
      const observed=observeEvent?{...input,event:{key:e.key??'',code:e.code??'',ctrl:Boolean(e.ctrlKey),alt:Boolean(e.altKey),shift:Boolean(e.shiftKey),meta:Boolean(e.metaKey),target:e.target?.id??'',tag:e.target?.tagName??''}}:input;
      dispatch(query,observed).catch(error=>reportError(error,query));
    }); return true; },
    'dom.mount': ({selector,parent}) => {
      const target=node(selector);
      if(parent!==null){
        const destination=node(parent);
        if(destination===target||target.contains(destination))throw Error('Cannot mount a DOM region inside itself');
        if(!mounts.has(selector)){const marker=document.createComment('mounted region');target.parentNode.insertBefore(marker,target);mounts.set(selector,marker);}
        destination.appendChild(target);
      }else{
        const marker=mounts.get(selector);
        if(marker){if(!marker.parentNode)throw Error('The original DOM region is no longer present');marker.parentNode.insertBefore(target,marker);marker.remove();mounts.delete(selector);}
      }
      return true;
    },
    'dom.bindings': () => [...bindings.values()].filter(binding=>document.querySelector(binding.selector)===binding.target).map(({target,...binding})=>({...binding,label:target.getAttribute('aria-label')||Array.from(target.labels??[]).map(label=>label.textContent).join(' ')||(target.tagName==='DETAILS'?target.querySelector?.('summary')?.textContent:null)||target.textContent||binding.selector,visible:Boolean(target.getClientRects?.().length)})),
    'dom.value': ({selector}) => node(selector).value,
    'dom.checked': ({selector}) => node(selector).checked,
    'dom.attribute': ({selector, name}) => node(selector).getAttribute(name),
    'dom.setAttribute': ({selector, name, value}) => { node(selector).setAttribute(name, String(value)); return true; },
    'dom.classToggle': ({selector, name, value}) => { node(selector).classList.toggle(name, value); return true; },
    'dom.text': ({selector, text}) => { node(selector).textContent = text; return true; },
    'dom.content': ({selector, html}) => { const target=node(selector);for(const [key,binding]of bindings)if(binding.target!==target&&target.contains?.(binding.target))bindings.delete(key);target.innerHTML = html; return true; },
    'dom.reset': ({selector}) => { node(selector).reset(); return true; },
    'http.json': async ({url, method, body}) => {
      const response = await fetch(url, {method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
      const data = await response.json().catch(() => ({}));
      return {ok: response.ok, status: response.status, data};
    },
  };
}
function computationalPorts(host = {}) {
  // Standard SHA-256 primitive, retained from the captured witness mechanism.
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function sha256Bytes(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var len = bytes.length;
    var withOne = len + 1;
    var total = Math.ceil((withOne + 8) / 64) * 64;
    var buf = new Uint8Array(total);
    buf.set(bytes);
    buf[len] = 0x80;
    var bitLenHi = Math.floor(len / 0x20000000);
    var bitLenLo = (len * 8) >>> 0;
    var view = new DataView(buf.buffer);
    view.setUint32(total - 8, bitLenHi, false);
    view.setUint32(total - 4, bitLenLo, false);
    var W = new Uint32Array(64);
    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4, false);
      for (i = 16; i < 64; i++) {
        var x = W[i - 15], y = W[i - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    var out = new Uint8Array(32);
    var ov = new DataView(out.buffer);
    for (i = 0; i < 8; i++) ov.setUint32(i * 4, H[i], false);
    return out;
  }

  function toHex(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    return s;
  }

  function encode(text) {
    return new TextEncoder().encode(text);
  }

  function sha256HexSync(text) {
    return toHex(sha256Bytes(encode(text)));
  }


  return {
    'number.calculate': ({operation,values}) => {
      const xs=values.map(Number), [a,b]=xs;
      const operations={add:()=>xs.reduce((x,y)=>x+y,0),subtract:()=>a-b,multiply:()=>xs.reduce((x,y)=>x*y,1),divide:()=>a/b,remainder:()=>a%b,power:()=>a**b,min:()=>Math.min(...xs),max:()=>Math.max(...xs),floor:()=>Math.floor(a),ceil:()=>Math.ceil(a),round:()=>Math.round(a),abs:()=>Math.abs(a),sin:()=>Math.sin(a),cos:()=>Math.cos(a),uint32:()=>a>>>0,less:()=>a<b,lessEqual:()=>a<=b,greater:()=>a>b,greaterEqual:()=>a>=b};
      if(!Object.hasOwn(operations,operation))throw Error('Unknown numeric mechanism');
      const result=operations[operation]();if(typeof result==='number'&&!Number.isFinite(result))throw Error('Nonfinite numeric result');return result;
    },
    'number.format': ({value,digits}) => Number(value).toFixed(digits),
    'number.parse': ({value,radix}) => {const n=radix===undefined?Number(value):parseInt(value,radix);return Number.isFinite(n)?n:null;},
    'value.sort': ({values,mode}) => mode==='numeric'?[...values].sort((a,b)=>a-b):mode==='locale'?[...values].sort((a,b)=>String(a).localeCompare(String(b))):[...values].sort(),
    'text.upperCase': ({value}) => value.toUpperCase(),
    'text.replace': ({value,pattern,flags,replacement}) => value.replace(new RegExp(pattern,flags),replacement),
    'text.match': ({value,pattern,flags}) => {const m=new RegExp(pattern,flags).exec(value);return m?{text:m[0],groups:m.slice(1).map(v=>v??null),index:m.index}:null;},
    'text.matchAll': ({value,pattern,flags=''}) => [...value.matchAll(new RegExp(pattern,flags.includes('g')?flags:flags+'g'))].map(m=>({text:m[0],groups:m.slice(1).map(v=>v??null),index:m.index})),
    'text.utf8Length': ({value}) => new TextEncoder().encode(value).length,
    'digest.sha256': async ({text,fallback=false}) => {
      const crypto=host.crypto===undefined?globalThis.crypto:host.crypto;
      try {
        if(!crypto?.subtle)throw Error('Web Crypto unavailable');
        const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
        return toHex(new Uint8Array(digest));
      } catch(error) {if(!fallback)throw error;return sha256HexSync(text);}
    },
    'clock.read': () => ({iso:(host.date??(()=>new Date()))().toISOString(),monotonic:(host.performance??globalThis.performance).now()}),
    'random.values': ({count}) => Array.from({length:count},()=> (host.random??Math.random)()),
  };
}
function browserEffects(host,dispatch) {
  const doc=host.document, win=host.window??globalThis;
  const records=host.effects??(host.effects=new Map());const allocate=()=>{host.effectNext=(host.effectNext??0)+1;return host.effectNext;};
  const nodes=host.effectNodes??(host.effectNodes=new WeakMap());
  const element=ref=>{const spec=typeof ref==='string'?{selector:ref}:ref;if(spec.handle){const value=records.get(spec.handle)?.node;if(!value)throw Error('Expired DOM observation handle');return value;}const list=doc.querySelectorAll(spec.selector);const value=list[spec.index??0];if(!value)throw Error('Missing DOM observation target: '+spec.selector);return value;};
  const rect=value=>({x:value.x,y:value.y,top:value.top,bottom:value.bottom,left:value.left,right:value.right,width:value.width,height:value.height});
  const reference=el=>{let handle=nodes.get(el);if(!handle){handle=allocate();nodes.set(el,handle);records.set(handle,{kind:'node',node:el});}return {handle};};
  const target=spec=>spec==='window'?win:spec==='document'?doc:spec==='fonts'?doc.fonts:spec?.media?win.matchMedia(spec.media):element(spec);
  const describe=el=>({ref:reference(el),tag:el.tagName,attributes:Object.fromEntries([...el.attributes].map(a=>[a.name,a.value])),text:el.textContent,rect:rect(el.getBoundingClientRect()),value:el.value??null,checked:Boolean(el.checked),disabled:Boolean(el.disabled),hidden:Boolean(el.hidden)});
  const eventValue=e=>({type:e.type,key:e.key??'',code:e.code??'',matches:e.matches??null,timeStamp:e.timeStamp,clientX:e.clientX??0,clientY:e.clientY??0,target:e.target?.nodeType===1?describe(e.target):null});
  return {
    'storage.read': ({key,maxLength=65536}) => {try{const value=(host.storage??win.localStorage).getItem(key);if(value!==null&&value.length>maxLength)return {ok:false,value:null};return {ok:true,value};}catch{return {ok:false,value:null};}},
    'storage.write': ({key,value}) => {if(typeof value!=='string')throw Error('Storage requires text');try{(host.storage??win.localStorage).setItem(key,value);return {ok:true};}catch{return {ok:false};}},
    'storage.remove': ({key}) => {try{(host.storage??win.localStorage).removeItem(key);return {ok:true};}catch{return {ok:false};}},
    'browser.environment': () => ({width:win.innerWidth,height:win.innerHeight,dpr:win.devicePixelRatio??1,scrollX:win.scrollX,scrollY:win.scrollY,hidden:doc.hidden,visibility:doc.visibilityState,reduced:win.matchMedia('(prefers-reduced-motion: reduce)').matches,secure:win.isSecureContext,crypto:Boolean((host.crypto??win.crypto)?.subtle),intersection:typeof win.IntersectionObserver==='function'}),
    'browser.mediaQuery': ({query}) => win.matchMedia(query).matches,
    'browser.select': ({selector}) => [...doc.querySelectorAll(selector)].map(describe),
    'browser.read': ({ref}) => describe(element(ref)),
    'browser.relative': ({ref,relation,selector}) => {const el=element(ref);const found=relation==='parent'?el.parentElement:relation==='closest'?el.closest(selector):relation==='query'?el.querySelector(selector):null;if(!['parent','closest','query'].includes(relation))throw Error('Unknown DOM relationship');return found?describe(found):null;},
    'browser.property': ({ref,name}) => {const value=element(ref)[name];if(!['string','number','boolean'].includes(typeof value)&&value!==null)throw Error('Nonportable DOM property observation');return value;},
    'browser.write': ({ref,name,value}) => {const allowed=['value','checked','disabled','hidden','readOnly','tabIndex','textContent','className','open','max','min','title'];if(!allowed.includes(name))throw Error('Undeclared DOM property effect');element(ref)[name]=value;return true;},
    'browser.attribute': ({ref,name,value}) => {const el=element(ref);if(/^on/i.test(name)||['srcdoc'].includes(name))throw Error('Executable attribute effect refused');if(value===null)el.removeAttribute(name);else el.setAttribute(name,String(value));return true;},
    'browser.style': ({ref,name,value}) => {const el=element(ref);if(value===null)el.style.removeProperty(name);else el.style.setProperty(name,String(value));return true;},
    'browser.class': ({ref,name,value}) => {element(ref).classList.toggle(name,Boolean(value));return true;},
    'browser.content': ({ref,html}) => {element(ref).innerHTML=html;return true;},
    'browser.insert': ({ref,position,html}) => {if(!['beforebegin','afterbegin','beforeend','afterend'].includes(position))throw Error('Unknown DOM insertion position');element(ref).insertAdjacentHTML(position,html);return true;},
    'browser.replace': ({ref,html}) => {element(ref).outerHTML=html;return true;},
    'browser.remove': ({ref}) => {element(ref).remove();return true;},
    'browser.focus': ({ref,preventScroll}) => {element(ref).focus({preventScroll:Boolean(preventScroll)});return true;},
    'browser.scrollIntoView': ({ref,block,behavior}) => {element(ref).scrollIntoView({block,behavior});return true;},
    'browser.reflow': ({ref}) => element(ref).offsetWidth,
    'browser.on': ({ref,event,query,input,preventDefault,preventKeys,delegate}) => {
      const parent=target(ref),id=allocate();const listener=e=>{if(delegate&&!e.target?.closest?.(delegate))return;if(preventDefault||preventKeys?.includes(e.key))e.preventDefault();dispatch(query,{...input,event:eventValue(e),matched:delegate?describe(e.target.closest(delegate)):null}).catch(error=>host.reportError?.(error,query));};
      parent.addEventListener(event,listener);records.set(id,{kind:'event',parent,event,listener});return id;
    },
    'browser.intersection': ({selector,query,input,rootMargin,threshold}) => {
      const observer=new win.IntersectionObserver(entries=>{dispatch(query,{...input,entries:entries.map(e=>({ref:reference(e.target),isIntersecting:e.isIntersecting,ratio:e.intersectionRatio,rect:rect(e.boundingClientRect)}))}).catch(error=>host.reportError?.(error,query));},{rootMargin,threshold});
      for(const el of doc.querySelectorAll(selector))observer.observe(el);const id=allocate();records.set(id,{kind:'observer',observer});return id;
    },
    'browser.unobserve': ({id,ref}) => {records.get(id)?.observer?.unobserve(element(ref));return true;},
    'browser.cancel': ({id}) => {const record=records.get(id);if(!record)return false;if(record.kind==='event')record.parent.removeEventListener(record.event,record.listener);if(record.kind==='observer')record.observer.disconnect();if(record.kind==='frame')win.cancelAnimationFrame(record.handle);if(record.kind==='timer')win.clearTimeout(record.handle);records.delete(id);return true;},
    'browser.frame': ({query,input}) => {const id=allocate(),handle=win.requestAnimationFrame(time=>{records.delete(id);dispatch(query,{...input,time}).catch(error=>host.reportError?.(error,query));});records.set(id,{kind:'frame',handle});return id;},
    'browser.delay': ({milliseconds}) => new Promise(resolve=>win.setTimeout(()=>resolve(true),milliseconds)),
    'browser.timer': ({query,input,milliseconds}) => {const id=allocate(),handle=win.setTimeout(()=>{records.delete(id);dispatch(query,input).catch(error=>host.reportError?.(error,query));},milliseconds);records.set(id,{kind:'timer',handle});return id;},
    'browser.fontsReady': async () => {await doc.fonts?.ready;return true;},
    'browser.location': () => ({hash:win.location.hash,href:win.location.href,origin:win.location.origin,path:win.location.pathname,base:doc.baseURI}),
    'browser.navigate': ({hash}) => {win.location.hash=String(hash);return true;},
    'browser.title': ({value}) => {doc.title=String(value);return true;},
    'browser.scroll': ({top=0,left=0,behavior='instant'}) => {win.scrollTo({top,left,behavior});return true;},
    'browser.dialog': ({ref,open}) => {const node=element(ref);if(open&&!node.open)node.showModal();if(!open&&node.open)node.close();return true;},
    'document.fragment': ({html,selector,base,removeSelectors=[],urlAttributes=[],keepFragmentLinks=false}) => {
      const parsed=new win.DOMParser().parseFromString(html,'text/html');
      for(const removeSelector of removeSelectors)for(const node of parsed.querySelectorAll(removeSelector))node.remove();
      if(base)for(const name of urlAttributes)for(const node of parsed.querySelectorAll('['+name+']')){
        const value=node.getAttribute(name);if(value&&!(keepFragmentLinks&&value.startsWith('#')))node.setAttribute(name,new win.URL(value,base).href);
      }
      const selected=parsed.querySelector(selector);if(!selected)throw Error('Missing document fragment');return selected.innerHTML;
    },
    'browser.frameContent': ({ref,html,bindings=[],sandbox=[]}) => {
      // Native capability ceiling: this bridge never permits frame scripts.
      if(!Array.isArray(sandbox)||sandbox.some(token=>token!=='allow-same-origin'))throw Error('Unsupported frame capability');
      const frame=element(ref);frame.setAttribute('sandbox',sandbox.join(' '));
      frame.onload=()=>{for(const binding of bindings)frame.contentDocument.addEventListener(binding.event,event=>{
        const matched=binding.delegate?event.target.closest?.(binding.delegate):event.target;
        if(!matched)return;if(binding.preventDefault)event.preventDefault();
        dispatch(binding.query,{...binding.input,event:eventValue(event),matched:describe(matched),frame:reference(frame)}).catch(error=>host.reportError?.(error,binding.query));
      });};frame.srcdoc=html;return true;
    },
    'canvas.draw': ({ref,width,height,dpr,commands}) => {
      const canvas=element(ref);if(width!==undefined)canvas.width=width;if(height!==undefined)canvas.height=height;const ctx=canvas.getContext('2d'),gradients=new Map();if(dpr!==undefined)ctx.setTransform(dpr,0,0,dpr,0,0);
      const methods=['clearRect','fillRect','strokeRect','beginPath','closePath','moveTo','lineTo','arc','fill','stroke','fillText','setLineDash','save','restore','translate','rotate','scale','setTransform'];const properties=['globalAlpha','fillStyle','strokeStyle','lineWidth','font','textAlign','lineCap','lineJoin'];
      for(const command of commands){if(command.kind==='gradient'){const g=ctx.createRadialGradient(...command.args);for(const [offset,color]of command.stops)g.addColorStop(offset,color);gradients.set(command.id,g);}else if(command.kind==='set'){if(!properties.includes(command.name))throw Error('Unknown canvas property');ctx[command.name]=command.gradient?gradients.get(command.gradient):command.value;}else{if(!methods.includes(command.name))throw Error('Unknown canvas effect');ctx[command.name](...command.args);}}return true;
    },
    'image.rasterize': ({width,height,pixels,rows}) => {const canvas=doc.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d'),image=ctx.createImageData(width,height);image.data.set(rows?rows.flat():pixels);ctx.putImageData(image,0,0);return canvas.toDataURL();},
    'media.read': ({ref}) => {const video=element(ref);return {paused:video.paused,muted:video.muted,volume:video.volume,currentTime:video.currentTime,currentSrc:video.currentSrc,readyState:video.readyState,seekable:Array.from({length:video.seekable.length},(_,i)=>[video.seekable.start(i),video.seekable.end(i)])};},
    'media.write': ({ref,name,value}) => {if(!['muted','volume','currentTime','preload','controls','src'].includes(name))throw Error('Unknown media property');element(ref)[name]=value;return true;},
    'media.play': async ({ref}) => {try{await element(ref).play();return {ok:true};}catch(error){return {ok:false,name:error.name};}},
    'media.pause': ({ref}) => {element(ref).pause();return true;},
    'media.load': ({ref}) => {element(ref).load();return true;},
    'browser.once': ({ref,event}) => new Promise(resolve=>target(ref).addEventListener(event,e=>resolve(eventValue(e)),{once:true})),
    'asset.blobURL': async ({url}) => {const response=await (host.fetch??win.fetch)(url);if(!response.ok)throw Error('Asset request failed: '+response.status);return win.URL.createObjectURL(await response.blob());},
    'asset.json': async ({url,cache}) => {const response=await (host.fetch??win.fetch)(url,{cache});if(!response.ok)throw Error('Asset request failed: '+response.status);return response.json();},
    'asset.text': async ({url,cache}) => {const response=await (host.fetch??win.fetch)(url,{cache});if(!response.ok)throw Error('Asset request failed: '+response.status);return response.text();},
  };
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
startBrowser(model,factIndex,grants).catch(error=>reportBrowserError(error,model.entry));
