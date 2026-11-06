// A miniature of Temple3's kernel judgment, running in the browser.
//
//   C |-_(Ark and P, i) S0 --d / W--> S1
//
// It is an illustration of the idea, not Temple3 itself: identities are real
// SHA-256 digests of canonical bytes, but the state commitment is a simplified
// binary Merkle tree (Temple3 uses a 256-level sparse Merkle tree), the error
// codes are this miniature's own, and the covenant language is the kernel's
// operator vocabulary without `verify`.

const encoder = new TextEncoder();

export const LIMITS = Object.freeze({
  nodes: 512,
  depth: 32,
  fuel: 2048,
  contextBytes: 65536,
  deltaCells: 8,
  valueLength: 80,
});

export const OPERATORS = Object.freeze(['literal', 'read', 'eq', 'not', 'all', 'any']);

// Canonical form: strings, booleans, null, arrays and objects with sorted keys.
// Like Temple3's wire format, numbers are deliberately not a value type.
export function canonical(value) {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string': return JSON.stringify(value);
    case 'boolean': return value ? 'true' : 'false';
    case 'object':
      if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
      return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
    default:
      throw new TypeError(`Non-canonical value of type ${typeof value}`);
  }
}

export function isCanonical(value) {
  try { canonical(value); return true; } catch { return false; }
}

export async function sha256(text) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

// Content addressing: <kind>:sha256:<digest of canonical bytes>.
export async function identify(kind, value) {
  return `${kind}:sha256:${await sha256(canonical({ kind, value }))}`;
}

export const digestOf = id => id.slice(id.lastIndexOf(':') + 1);
export const short = (id, head = 10, tail = 4) => {
  const d = digestOf(id);
  return tail > 0 ? `${d.slice(0, head)}…${d.slice(-tail)}` : `${d.slice(0, head)}…`;
};

// ---------------------------------------------------------------- covenant --

export const L = value => ({ op: 'literal', value });
export const R = path => ({ op: 'read', path });
export const EQ = (a, b) => ({ op: 'eq', args: [a, b] });
export const NOT = x => ({ op: 'not', args: [x] });
export const ALL = (...xs) => ({ op: 'all', args: xs });
export const ANY = (...xs) => ({ op: 'any', args: xs });

export function measure(ast) {
  let nodes = 0;
  let depth = 0;
  let closed = true;
  (function walk(node, d) {
    nodes += 1;
    depth = Math.max(depth, d);
    if (!OPERATORS.includes(node.op)) closed = false;
    for (const child of node.args || []) walk(child, d + 1);
  })(ast, 1);
  return { nodes, depth, closed };
}

class FuelExhausted extends Error {}

// A path such as "read.role.steward" names a namespace ("read") and a cell key.
function readPath(view, path) {
  const dot = path.indexOf('.');
  if (dot < 0) return Object.hasOwn(view, path) ? view[path] : null;
  const space = view[path.slice(0, dot)];
  const key = path.slice(dot + 1);
  return space && Object.hasOwn(space, key) ? space[key] : null;
}

const truthy = v => v === true;

export function evaluate(ast, view, fuel = LIMITS.fuel) {
  let remaining = fuel;
  function ev(node) {
    remaining -= 1;
    if (remaining < 0) throw new FuelExhausted('Evaluation fuel exhausted');
    switch (node.op) {
      case 'literal': return node.value;
      case 'read': return readPath(view, node.path);
      case 'eq': return canonical(ev(node.args[0])) === canonical(ev(node.args[1]));
      case 'not': return !truthy(ev(node.args[0]));
      case 'all': for (const a of node.args) { if (!truthy(ev(a))) return false; } return true;
      case 'any': for (const a of node.args) { if (truthy(ev(a))) return true; } return false;
      default: throw new TypeError(`Operator outside the closed set: ${node.op}`);
    }
  }
  const value = truthy(ev(ast));
  return { value, fuelUsed: fuel - remaining };
}

// Render an AST in the kernel's operator vocabulary.
export function render(node, indent = '') {
  const pad = indent + '  ';
  switch (node.op) {
    case 'literal': return `literal ${node.value === null ? 'null' : JSON.stringify(node.value)}`;
    case 'read': return `read ${node.path}`;
    case 'eq': return `eq(${render(node.args[0])}, ${render(node.args[1])})`;
    case 'not': return `not(${render(node.args[0], indent)})`;
    default:
      return `${node.op}(\n${node.args.map(a => pad + render(a, pad)).join(',\n')}\n${indent})`;
  }
}

// ------------------------------------------------------------------ state --

export async function cellId(cell) {
  return identify('cell', { key: cell.key, value: cell.value });
}

// Simplified commitment: a binary Merkle tree over the sorted cell digests.
export async function merkle(ids) {
  let level = [...ids].map(digestOf).sort();
  if (level.length === 0) return { root: await sha256('empty'), levels: [[]] };
  const levels = [level];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? await sha256(level[i] + level[i + 1]) : level[i]);
    }
    level = next;
    levels.push(level);
  }
  return { root: level[0], levels };
}

export async function stateRoot(state) {
  const tree = await merkle([...state.cells.keys()]);
  const root = await identify('state', { activePredicateId: state.predicateId, cellSetRoot: tree.root });
  return { root, tree };
}

export function cloneState(state) {
  return { cells: new Map(state.cells), predicateId: state.predicateId };
}

// ------------------------------------------------------------- judgment --

export const STAGES = [
  { n: 1, title: 'Canonical and bounded', gloss: 'Every input is canonical, and within its bounds.' },
  { n: 2, title: 'The basis is the current root', gloss: 'The proposal names the exact state it starts from.' },
  { n: 3, title: 'The algebra applies', gloss: 'S₁ = (S₀ − consume) ∪ create' },
  { n: 4, title: 'The claimed root is the computed root', gloss: 'What the proposer says will happen is what does happen.' },
  { n: 5, title: 'The covenant says yes', gloss: 'The active predicate returns true.' },
  { n: 6, title: 'Every Ark invariant holds', gloss: 'Universal law, which no covenant can widen.' },
];

const KEY = /^[a-z]+(\.[a-z0-9-]+)+$/;

function checkCanonical(proposal) {
  if (!isCanonical(proposal.wire)) return 'Proposal contains a non-canonical value.';
  const bytes = encoder.encode(canonical(proposal.wire)).length;
  if (bytes > LIMITS.contextBytes) return `Proposal is ${bytes} bytes; the bound is ${LIMITS.contextBytes}.`;
  for (const list of ['read', 'consume', 'create']) {
    if (proposal.wire.delta[list].length > LIMITS.deltaCells) return `Too many cells in ${list}.`;
  }
  for (const cell of proposal.wire.delta.create) {
    if (typeof cell.key !== 'string' || !KEY.test(cell.key)) return `Malformed cell key ${JSON.stringify(cell.key)}.`;
    if (typeof cell.value !== 'string') return 'Cell values must be strings.';
    if (cell.value.length > LIMITS.valueLength) return `A value exceeds ${LIMITS.valueLength} characters.`;
  }
  return null;
}

// temple: { id, arkId, state, root, predicates: Map<id, covenant>, sequence, tip }
// proposal: { recipe, wire: { identity, context, delta: { basis, read, consume, create,
//             nextPredicate, claimedFinalStateRoot } }, successor? }
export async function judge(temple, proposal) {
  const { wire } = proposal;
  const d = wire.delta;
  const stages = [];
  let failure = null;
  let S1 = null;
  let S1root = null;
  let covenantReport = null;
  const fail = (n, code, detail, extra = {}) => {
    stages.push({ n, ok: false, detail });
    failure = { stage: n, code, detail, ...extra };
  };

  // 1. Canonical and bounded
  const bad = checkCanonical(proposal);
  if (bad) fail(1, 'NONCANONICAL', bad);
  else stages.push({ n: 1, ok: true, detail: `${encoder.encode(canonical(wire)).length} bytes, within bounds.` });

  // 2. The basis is the current root
  if (!failure) {
    if (d.basis !== temple.root) fail(2, 'STALE_BASIS', `Basis ${short(d.basis, 8, 0)} is not the current root ${short(temple.root, 8, 0)}.`);
    else stages.push({ n: 2, ok: true, detail: `Basis ${short(d.basis, 8, 0)} is current.` });
  }

  // 3. Apply(S0, d) = S1, by the fixed algebra only
  let created = [];
  if (!failure) {
    const S0 = temple.state;
    S1 = cloneState(S0);
    for (const id of d.consume) {
      if (!S0.cells.has(id)) { fail(3, 'CONSUMED_CELL_ABSENT', `Consumed cell ${short(id, 8, 0)} is not in S₀.`); break; }
      S1.cells.delete(id);
    }
    if (!failure) {
      for (const id of d.read) {
        if (!S0.cells.has(id)) { fail(3, 'READ_CELL_ABSENT', `Read cell ${short(id, 8, 0)} is not in S₀.`); break; }
      }
    }
    if (!failure) {
      created = await Promise.all(d.create.map(async c => ({ ...c, id: await cellId(c) })));
      const seen = new Set();
      for (const c of created) {
        if (seen.has(c.id) || S1.cells.has(c.id)) { fail(3, 'CELL_ALREADY_PRESENT', `Created cell ${c.key} already exists.`); break; }
        seen.add(c.id);
        S1.cells.set(c.id, { key: c.key, value: c.value });
      }
    }
    if (!failure && d.nextPredicate) {
      const body = proposal.successor;
      const expected = body ? await identify('predicate', body.ast) : null;
      if (expected !== d.nextPredicate) fail(3, 'SUCCESSOR_UNRESOLVED', 'The successor predicate does not match its id.');
      else S1.predicateId = d.nextPredicate;
    }
    if (!failure) stages.push({ n: 3, ok: true, detail: `−${d.consume.length} cell${d.consume.length === 1 ? '' : 's'}, +${d.create.length} cell${d.create.length === 1 ? '' : 's'}${d.nextPredicate ? ', successor covenant attached' : ''}.` });
  }

  // 4. The claimed final root is Root(S1)
  let tree = null;
  if (!failure) {
    ({ root: S1root, tree } = await stateRoot(S1));
    if (d.claimedFinalStateRoot !== S1root) fail(4, 'CLAIMED_ROOT_MISMATCH', `Claimed ${short(d.claimedFinalStateRoot, 8, 0)}, computed ${short(S1root, 8, 0)}.`);
    else stages.push({ n: 4, ok: true, detail: `Claimed and computed: ${short(S1root, 8, 0)}.` });
  }

  // 5. The active covenant returns true — over only the cells the delta names
  if (!failure) {
    const covenant = temple.predicates.get(temple.state.predicateId);
    const cells = ids => Object.fromEntries(ids.map(id => { const c = temple.state.cells.get(id); return [c.key, c.value]; }));
    const view = {
      identity: wire.identity,
      read: cells(d.read),
      consume: cells(d.consume),
      create: Object.fromEntries(d.create.map(c => [c.key, c.value])),
      successor: d.nextPredicate || null,
    };
    let fuel = 0;
    const rules = covenant.rules.map(rule => {
      const r = evaluate(rule.ast, view);
      fuel += r.fuelUsed;
      return { name: rule.name, text: rule.text, ok: r.value };
    });
    const whole = evaluate(covenant.ast, view);
    covenantReport = { covenant: covenant.title, rules, fuel: whole.fuelUsed, view };
    const broken = rules.filter(r => !r.ok);
    if (!whole.value) fail(5, 'COVENANT_FALSE', `Rule ${broken.map(r => r.name).join(', ')}: ${broken[0]?.text || 'the covenant returned false.'}`, { rules: broken.map(r => r.name) });
    else stages.push({ n: 5, ok: true, detail: `All ${rules.length} rules hold · fuel ${whole.fuelUsed} of ${LIMITS.fuel}.` });
  }

  // 6. Every Ark invariant holds
  if (!failure) {
    let arkIssue = null;
    if (proposal.successor) {
      const m = measure(proposal.successor.ast);
      if (!m.closed) arkIssue = 'The successor covenant uses an operator outside the closed set.';
      else if (m.depth > LIMITS.depth) arkIssue = `The successor covenant is ${m.depth} deep; the Ark allows ${LIMITS.depth}.`;
      else if (m.nodes > LIMITS.nodes) arkIssue = `The successor covenant has ${m.nodes} nodes; the Ark allows ${LIMITS.nodes}.`;
    }
    if (arkIssue) fail(6, 'ARK_INVARIANT', arkIssue);
    else stages.push({ n: 6, ok: true, detail: 'Bounds, operators and structure are within the Ark.' });
  }

  const accepted = !failure;
  const body = {
    kind: 'witness',
    temple: temple.id,
    predicate: temple.state.predicateId,
    identity: wire.identity,
    context: wire.context,
    initialStateRoot: temple.root,
    delta: {
      basis: d.basis,
      read: d.read,
      consume: d.consume,
      create: d.create,
      nextPredicate: d.nextPredicate || null,
      claimedFinalStateRoot: d.claimedFinalStateRoot,
    },
    outcome: accepted ? 'accepted' : 'rejected',
    failure: failure ? { stage: String(failure.stage), code: failure.code } : null,
    finalStateRoot: accepted ? S1root : null,
    sequence: accepted ? String(temple.sequence + 1) : null,
    previousWitness: temple.tip,
  };
  const id = await identify('witness', body);
  return { accepted, stages, failure, covenantReport, witness: { id, body }, S1: accepted ? S1 : null, S1root, tree, created };
}

// Advance a temple with an accepted judgment (rejections never advance state).
export async function commit(temple, result) {
  temple.tip = result.witness.id;
  if (!result.accepted) return temple;
  temple.state = result.S1;
  temple.root = result.S1root;
  temple.sequence += 1;
  return temple;
}
