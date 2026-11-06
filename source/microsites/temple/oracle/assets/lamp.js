// The Temple of the Lamp: a tiny Temple for the "Try the gate" miniature.
// Four cells, one covenant, three identities, and a journal of witnesses that
// any verifier can replay from genesis.

import {
  L, R, EQ, NOT, ALL, ANY, OPERATORS, LIMITS,
  identify, cellId, stateRoot, judge, commit, cloneState, canonical, measure,
} from './kernel.js';

export const IDENTITIES = [
  { id: 'steward', label: 'Steward', note: 'named in the role cell' },
  { id: 'visitor', label: 'Visitor', note: 'no grant' },
  { id: 'emissary', label: 'AI emissary', note: 'acting for the visitor' },
];

const RULE_B = { name: 'B', text: 'Oil never simply vanishes.', ast: ANY(EQ(R('consume.lamp.oil'), L(null)), NOT(EQ(R('create.lamp.oil'), L(null)))) };
const RULE_C = { name: 'C', text: 'The steward’s role is fixed.', ast: EQ(R('consume.role.steward'), L(null)) };
const RULE_D = { name: 'D', text: 'Only the steward may amend the covenant.', ast: ANY(EQ(R('successor'), L(null)), EQ(R('identity'), R('read.role.steward'))) };

function covenant(title, rules) {
  return { title, rules, ast: ALL(...rules.map(r => r.ast)) };
}

export const COVENANT_ORIGINAL = covenant('The Covenant of the Lamp', [
  { name: 'A', text: 'Oil moves only by the steward’s hand.', ast: ANY(EQ(R('consume.lamp.oil'), L(null)), EQ(R('identity'), R('read.role.steward'))) },
  RULE_B, RULE_C, RULE_D,
]);

export const COVENANT_AMENDED = covenant('The Covenant of the Lamp, amended', [
  { name: 'A', text: 'Oil moves by the steward’s hand — or a visitor’s.', ast: ANY(EQ(R('consume.lamp.oil'), L(null)), EQ(R('identity'), R('read.role.steward')), EQ(R('identity'), L('visitor'))) },
  RULE_B, RULE_C, RULE_D,
]);

// A successor that exceeds the Ark's depth bound. Even the steward cannot enact it.
function deepCovenant() {
  let node = L(true);
  for (let i = 0; i < 40; i += 1) node = NOT(node);
  return covenant('A covenant nested forty deep', [...COVENANT_ORIGINAL.rules, { name: 'E', text: 'Forty nested negations.', ast: node }]);
}
export const COVENANT_UNBOUNDED = deepCovenant();

export const PRESETS = [
  { id: 'tend', title: 'Tend the lamp', blurb: 'Burn one measure of oil and light the flame. Names the steward’s role in read.' },
  { id: 'tend-unseen', title: 'Tend the lamp, unseen', blurb: 'The same change — but the proposal doesn’t name the role cell, so the covenant cannot see who the steward is.' },
  { id: 'refill', title: 'Refill the lamp', blurb: 'Consume the oil cell and create a fuller one: three more measures.' },
  { id: 'take', title: 'Take the oil', blurb: 'Consume the oil and create nothing in its place.' },
  { id: 'note', title: 'Leave a note', blurb: 'Create a new note cell. Creation is open to anyone.' },
  { id: 'appoint', title: 'Appoint yourself steward', blurb: 'Consume the steward’s role cell and create one naming you.' },
  { id: 'amend', title: 'Amend the covenant', blurb: 'Propose a successor covenant that lets visitors tend the lamp too.' },
  { id: 'amend-beyond', title: 'Amend beyond the Ark', blurb: 'Propose a successor covenant nested forty deep. The Ark allows thirty-two.' },
];

export const GENESIS_CELLS = [
  { key: 'lamp.oil', value: '3' },
  { key: 'lamp.flame', value: 'unlit' },
  { key: 'role.steward', value: 'steward' },
  { key: 'note.1', value: 'The lamp is kept here.' },
];

const GENESIS_CONTEXT = { name: 'The Temple of the Lamp', purpose: 'A miniature running in your browser, for illustration.' };

// ------------------------------------------------------------- creation --

export async function createTemple() {
  const registry = new Map();
  for (const c of [COVENANT_ORIGINAL, COVENANT_AMENDED, COVENANT_UNBOUNDED]) {
    const id = await identify('predicate', c.ast);
    c.id = id;
    registry.set(id, c);
  }
  const arkId = await identify('ark', {
    name: 'Candidate Ark v0.1 (miniature)',
    operators: [...OPERATORS],
    bounds: { nodes: String(LIMITS.nodes), depth: String(LIMITS.depth), fuel: String(LIMITS.fuel), contextBytes: String(LIMITS.contextBytes) },
  });
  const cells = new Map();
  for (const cell of GENESIS_CELLS) cells.set(await cellId(cell), { ...cell });
  const state = { cells, predicateId: COVENANT_ORIGINAL.id };
  const { root, tree } = await stateRoot(state);
  const contextId = await identify('context', GENESIS_CONTEXT);
  const id = await identify('temple', { ark: arkId, initialStateRoot: root, genesisContext: contextId });
  const genesis = { state: cloneState(state), root, tree, id, arkId };
  return {
    id, arkId, registry, genesis,
    temple: { id, arkId, state, root, tree, predicates: registry, sequence: 0, tip: null, roots: [root] },
    journal: [],
  };
}

function findCell(state, key) {
  for (const [id, cell] of state.cells) if (cell.key === key) return { id, ...cell };
  return null;
}

export function cellsByKey(state) {
  return [...state.cells.entries()].map(([id, c]) => ({ id, ...c }));
}

export function presetAvailability(temple, presetId) {
  const oil = findCell(temple.state, 'lamp.oil');
  if ((presetId === 'tend' || presetId === 'tend-unseen') && oil && oil.value === '0') return 'The oil is spent. Refill the lamp first.';
  if ((presetId === 'tend' || presetId === 'tend-unseen' || presetId === 'take' || presetId === 'refill') && !oil) return 'There is no oil cell.';
  return null;
}

async function honestClaim(temple, delta, successorId) {
  const S1 = cloneState(temple.state);
  for (const id of delta.consume) S1.cells.delete(id);
  for (const c of delta.create) S1.cells.set(await cellId(c), { key: c.key, value: c.value });
  if (successorId) S1.predicateId = successorId;
  return (await stateRoot(S1)).root;
}

// Change a character early in the digest, so the difference is visible.
function flip(id) {
  const i = id.lastIndexOf(':') + 4;
  return id.slice(0, i) + (id[i] === '0' ? '1' : '0') + id.slice(i + 1);
}

// recipe: { preset, identity, stale, falseClaim, note, forgeOil }
export async function buildProposal(temple, registry, recipe) {
  const state = temple.state;
  const oil = findCell(state, 'lamp.oil');
  const flame = findCell(state, 'lamp.flame');
  const role = findCell(state, 'role.steward');
  const delta = { read: [], consume: [], create: [] };
  let successor = null;
  switch (recipe.preset) {
    case 'tend':
    case 'tend-unseen': {
      const next = recipe.forgeOil ?? String(Math.max(0, Number(oil.value) - 1));
      if (recipe.preset === 'tend' && role) delta.read.push(role.id);
      delta.consume.push(oil.id, flame.id);
      delta.create.push({ key: 'lamp.oil', value: next }, { key: 'lamp.flame', value: 'lit' });
      break;
    }
    case 'refill':
      if (role) delta.read.push(role.id);
      delta.consume.push(oil.id);
      delta.create.push({ key: 'lamp.oil', value: String(Number(oil.value) + 3) });
      break;
    case 'take':
      if (role) delta.read.push(role.id);
      delta.consume.push(oil.id);
      break;
    case 'note': {
      const n = cellsByKey(state).filter(c => c.key.startsWith('note.')).length + 1;
      const text = String(recipe.note || '').replace(/[\u0000-\u001f\u007f]/g, '').trim() || 'Thank you for the light.';
      delta.create.push({ key: `note.${n}`, value: text });
      break;
    }
    case 'appoint':
      delta.consume.push(role.id);
      delta.create.push({ key: 'role.steward', value: recipe.identity });
      break;
    case 'amend': {
      const active = registry.get(state.predicateId);
      successor = active === COVENANT_AMENDED ? COVENANT_ORIGINAL : COVENANT_AMENDED;
      if (role) delta.read.push(role.id);
      break;
    }
    case 'amend-beyond':
      successor = COVENANT_UNBOUNDED;
      if (role) delta.read.push(role.id);
      break;
    default:
      throw new Error(`Unknown preset ${recipe.preset}`);
  }
  const basis = recipe.stale && temple.roots.length > 1 ? temple.roots[temple.roots.length - 2] : temple.root;
  let claimed = await honestClaim(temple, delta, successor?.id);
  if (recipe.falseClaim) claimed = flip(claimed);
  const preset = PRESETS.find(p => p.id === recipe.preset);
  return {
    recipe,
    successor,
    wire: {
      identity: recipe.identity,
      context: { purpose: preset.title },
      delta: { basis, ...delta, nextPredicate: successor ? successor.id : null, claimedFinalStateRoot: claimed },
    },
  };
}

export async function propose(world, recipe) {
  const proposal = await buildProposal(world.temple, world.registry, recipe);
  const result = await judge(world.temple, proposal);
  await commit(world.temple, result);
  if (result.accepted) {
    world.temple.tree = result.tree;
    world.temple.roots.push(result.S1root);
  }
  world.journal.push({ id: result.witness.id, body: result.witness.body, recipe: { ...recipe } });
  return { proposal, result };
}

// ------------------------------------------------------------ verification --

function freshTemple(world) {
  const g = world.genesis;
  return { id: g.id, arkId: g.arkId, state: cloneState(g.state), root: g.root, predicates: world.registry, sequence: 0, tip: null, roots: [g.root] };
}

// A conforming verifier: recompute every witness id, check the chain, and
// re-judge every transition from genesis with the same kernel.
export async function replay(world, journal, publishedHead) {
  const lines = [];
  const t = freshTemple(world);
  const templeCheck = await identify('temple', {
    ark: world.genesis.arkId,
    initialStateRoot: t.root,
    genesisContext: await identify('context', GENESIS_CONTEXT),
  });
  if (templeCheck !== world.id) return { ok: false, lines: [{ ok: false, text: 'Genesis does not reproduce this Temple’s identity.' }] };
  lines.push({ ok: true, text: 'Genesis reproduces the Temple’s identity.' });
  let accepted = 0;
  let refused = 0;
  for (let i = 0; i < journal.length; i += 1) {
    const entry = journal[i];
    const label = `Witness ${i + 1}`;
    if ((await identify('witness', entry.body)) !== entry.id) {
      lines.push({ ok: false, text: `${label}: its contents no longer match its hash. The record was altered.` });
      return { ok: false, lines, at: i };
    }
    if (entry.body.previousWitness !== t.tip) {
      lines.push({ ok: false, text: `${label}: it does not follow the witness before it.` });
      return { ok: false, lines, at: i };
    }
    const proposal = {
      wire: { identity: entry.body.identity, context: entry.body.context, delta: { ...entry.body.delta } },
      successor: entry.body.delta.nextPredicate ? world.registry.get(entry.body.delta.nextPredicate) : null,
    };
    const again = await judge(t, proposal);
    if (again.witness.id !== entry.id) {
      lines.push({ ok: false, text: `${label}: re-judging it from genesis gives a different witness.` });
      return { ok: false, lines, at: i };
    }
    await commit(t, again);
    if (again.accepted) { accepted += 1; t.roots.push(again.S1root); } else refused += 1;
    lines.push({ ok: true, text: `${label}: re-judged — ${again.accepted ? `accepted, sequence ${again.witness.body.sequence}` : `refused at stage ${again.failure.stage}, state unchanged`}.` });
  }
  const summary = `${journal.length} witness${journal.length === 1 ? '' : 'es'} replayed from genesis: ${accepted} accepted, ${refused} refused.`;
  if (t.root !== publishedHead) {
    lines.push({ ok: false, text: `${summary} Internally consistent — but its head is not the head already witnessed. This is a different history, not a continuation of this Temple.` });
    return { ok: false, lines, forked: true };
  }
  lines.push({ ok: true, text: `${summary} The final root matches the head.` });
  return { ok: true, lines };
}

// Two kinds of forger, for the "try to rewrite history" demonstration.
export async function forge(world, mode) {
  const index = world.journal.findIndex(e => e.body.outcome === 'accepted' && e.body.delta.create.some(c => c.key === 'lamp.oil'));
  if (index < 0) return null;
  if (mode === 'edit') {
    const journal = structuredClone(world.journal);
    const cell = journal[index].body.delta.create.find(c => c.key === 'lamp.oil');
    cell.value = '9';
    return { journal, index, description: `Changed witness ${index + 1} so the lamp kept 9 measures of oil — without touching its hash.` };
  }
  // Rewrite everything from that point, recomputing every hash and root.
  const shadow = { ...world, temple: freshTemple(world), journal: [] };
  for (let i = 0; i < world.journal.length; i += 1) {
    const recipe = { ...world.journal[i].recipe };
    if (i === index) recipe.forgeOil = '9';
    await propose(shadow, recipe);
  }
  return { journal: shadow.journal, index, description: `Rewrote history from witness ${index + 1}: the lamp kept 9 measures, and every later hash and root was recomputed to match.` };
}

export function covenantSize(c) {
  return measure(c.ast);
}

export { canonical };
