// "Try the gate": the interface for the Temple of the Lamp miniature.

import {
  createTemple, propose, buildProposal, replay, forge,
  PRESETS, IDENTITIES, presetAvailability, cellsByKey, covenantSize,
} from './lamp.js';
import { STAGES, LIMITS, short, digestOf, render, canonical } from './kernel.js';

const $ = id => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const wait = ms => new Promise(r => setTimeout(r, reduced.matches ? 0 : ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const labelOf = id => IDENTITIES.find(i => i.id === id)?.label || id;

let world;
let busy = false;
let forged = null;
let seenCells = new Set();
let seenDigests = new Set();
let lastReport = null;

// ---------------------------------------------------------------- setup --

function renderChoices() {
  $('identities').innerHTML = IDENTITIES.map((p, i) => `
    <label><input type="radio" name="identity" value="${p.id}"${i === 0 ? ' checked' : ''}>
      <b>${esc(p.label)}</b><small>${esc(p.note)}</small></label>`).join('');
  $('presets').innerHTML = PRESETS.map((p, i) => `
    <label class="preset" data-preset="${p.id}" title="${esc(p.blurb)}"><input type="radio" name="preset" value="${p.id}"${i === 0 ? ' checked' : ''}>
      <b>${esc(p.title)}</b></label>`).join('');
}

function recipe() {
  const form = $('composer');
  return {
    preset: form.elements.preset.value,
    identity: form.elements.identity.value,
    stale: $('stale').checked && !$('stale').disabled,
    falseClaim: $('false-claim').checked,
    note: $('note-text').value,
  };
}

function renderStages(states = {}) {
  $('stages').innerHTML = STAGES.map(s => {
    const st = states[s.n] || {};
    const cls = st.state ? ` class="${st.state}"` : '';
    const mark = st.state === 'ok' ? '✓' : st.state === 'fail' ? '✗' : String(s.n);
    return `<li${cls}><span class="dot" aria-hidden="true">${mark}</span><span><b>${esc(s.title)}</b><small>${esc(st.detail || s.gloss)}</small></span></li>`;
  }).join('');
}

// --------------------------------------------------------------- temple --

function el(name, attrs = {}, text) {
  const node = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text != null) node.textContent = text;
  return node;
}

function drawTree(tree, root, predicateId, fresh) {
  const svg = $('tree');
  svg.replaceChildren();
  const levels = tree.levels;
  const leaves = levels[0];
  const L = levels.length;
  const x0 = 34;
  const x1 = 326;
  const yLeaf = 132;
  const yTop = 66;
  const pos = levels.map(() => []);
  leaves.forEach((_, i) => { pos[0][i] = leaves.length === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (leaves.length - 1); });
  for (let k = 1; k < L; k += 1) {
    levels[k].forEach((_, j) => {
      const a = pos[k - 1][2 * j];
      const b = pos[k - 1][2 * j + 1];
      pos[k][j] = b === undefined ? a : (a + b) / 2;
    });
  }
  const yOf = k => (L === 1 ? yTop : yLeaf - (k * (yLeaf - yTop)) / (L - 1));
  const hot = d => fresh && !seenDigests.has(d);
  // edges
  for (let k = 1; k < L; k += 1) {
    levels[k].forEach((d, j) => {
      for (const c of [2 * j, 2 * j + 1]) {
        if (pos[k - 1][c] === undefined) continue;
        const child = levels[k - 1][c];
        svg.append(el('line', { class: `edge${hot(d) && hot(child) ? ' hot' : ''}`, x1: pos[k - 1][c], y1: yOf(k - 1), x2: pos[k][j], y2: yOf(k) }));
      }
    });
  }
  const cellRoot = levels[L - 1][0];
  const kx = 180;
  const ky = 18;
  const px = 300;
  const py = yTop;
  svg.append(el('line', { class: `edge${hot(cellRoot) ? ' hot' : ''}`, x1: pos[L - 1][0], y1: yTop, x2: kx, y2: ky + 12 }));
  svg.append(el('line', { class: `edge${hot(digestOf(predicateId)) ? ' hot' : ''}`, x1: px, y1: py, x2: kx + 20, y2: ky + 12 }));
  // nodes
  for (let k = 0; k < L; k += 1) {
    levels[k].forEach((d, j) => {
      svg.append(el('circle', { class: `node${hot(d) ? ' hot' : ''}`, cx: pos[k][j], cy: yOf(k), r: k === 0 ? 5 : 4 }));
      if (k === 0) svg.append(el('text', { class: 'leaf-label', x: pos[k][j], y: yLeaf + (j % 2 ? 26 : 16), 'text-anchor': 'middle' }, d.slice(0, 5)));
    });
  }
  svg.append(el('rect', { class: `node${hot(digestOf(predicateId)) ? ' hot' : ''}`, x: px - 5, y: py - 5, width: 10, height: 10, transform: `rotate(45 ${px} ${py})` }));
  svg.append(el('text', { class: 'leaf-label', x: px + 12, y: py + 3 }, 'covenant'));
  svg.append(el('path', { class: `keystone${hot(digestOf(root)) ? ' hot' : ''}`, d: `M${kx - 42} ${ky - 12} H${kx + 42} L${kx + 34} ${ky + 12} H${kx - 34} Z` }));
  svg.append(el('text', { class: 'root-label', x: kx, y: ky + 3, 'text-anchor': 'middle' }, `root ${digestOf(root).slice(0, 8)}`));
  // remember what is now known, for the next highlight
  seenDigests = new Set([...levels.flat(), digestOf(root), digestOf(predicateId)]);
}

function renderTemple(fresh = false) {
  const t = world.temple;
  const covenant = world.registry.get(t.state.predicateId);
  $('t-id').textContent = short(world.id, 10, 6);
  $('t-id').title = world.id;
  const rootEl = $('t-root');
  const changed = rootEl.title && rootEl.title !== t.root;
  rootEl.textContent = short(t.root, 10, 6);
  rootEl.title = t.root;
  if (changed) { rootEl.classList.remove('pulse'); void rootEl.offsetWidth; rootEl.classList.add('pulse'); }
  $('t-seq').textContent = String(t.sequence);
  $('t-cov').textContent = covenant.title;

  const cells = cellsByKey(t.state).sort((a, b) => digestOf(a.id).localeCompare(digestOf(b.id)));
  const oil = cells.find(c => c.key === 'lamp.oil');
  const flame = cells.find(c => c.key === 'lamp.flame');
  $('lamp').dataset.lit = String(flame?.value === 'lit');
  const measures = Number(oil?.value || 0);
  $('oil-label').textContent = `Oil: ${measures} measure${measures === 1 ? '' : 's'} · flame ${flame?.value || 'absent'}`;
  $('oil-drops').innerHTML = '<i></i>'.repeat(Math.min(measures, 12));

  $('cells').innerHTML = cells.map(c => `
    <li class="${fresh && !seenCells.has(c.id) ? 'new' : ''}" title="${esc(c.id)}">
      <span class="k">${esc(c.key)}</span><span class="v">${esc(c.value)}</span><span class="id">${digestOf(c.id).slice(0, 12)}…</span>
    </li>`).join('');
  seenCells = new Set(cells.map(c => c.id));
  drawTree(t.tree, t.root, t.state.predicateId, fresh);
}

function renderCovenant(report = null, fresh = false) {
  const covenant = world.registry.get(world.temple.state.predicateId);
  $('covenant-name').textContent = covenant.title;
  const states = new Map((report?.rules || []).map(r => [r.name, r.ok]));
  $('rules').innerHTML = covenant.rules.map(r => {
    const s = states.has(r.name) ? (states.get(r.name) ? 'held' : 'broken') : '';
    const txt = s === 'held' ? '✓ held' : s === 'broken' ? '✗ broken' : '';
    return `<li class="${s}${fresh ? ' changed' : ''}"><span class="rule-name">${r.name}</span><span>${esc(r.text)}</span><span class="rule-state">${txt}</span></li>`;
  }).join('');
  $('ast').textContent = render(covenant.ast);
  const m = covenantSize(covenant);
  $('ast-size').textContent = `${m.nodes} nodes · depth ${m.depth} · the Ark allows ${LIMITS.nodes} nodes and depth ${LIMITS.depth}${report ? ` · this judgment used ${report.fuel} of ${LIMITS.fuel} fuel` : ''}. Every operator is from the closed set.`;
}

function journalItems(journal, forgedIndex = -1) {
  if (!journal.length) return '<li class="empty">No witnesses yet. The first proposal — accepted or refused — will leave one.</li>';
  return journal.map((e, i) => ({ e, i })).reverse().map(({ e, i }) => {
    const b = e.body;
    const acc = b.outcome === 'accepted';
    const cls = [acc ? 'accepted' : 'rejected', i === journal.length - 1 && forgedIndex < 0 ? 'fresh' : '', i === forgedIndex ? 'forged' : ''].filter(Boolean).join(' ');
    const out = acc
      ? `accepted · sequence ${b.sequence} · root → ${short(b.finalStateRoot, 8, 0)}`
      : `refused at stage ${b.failure.stage} · ${b.failure.code} · state unchanged`;
    return `<li class="${cls}"><span class="seq">${acc ? `#${b.sequence}` : '—'}</span>
      <span><span class="what"><b>${esc(labelOf(b.identity))}</b> · ${esc(b.context.purpose)}</span>
      <span class="out">${esc(out)}</span><code class="wid" title="${esc(e.id)}">witness ${short(e.id, 12, 6)}</code></span></li>`;
  }).join('');
}

function renderJournal() {
  const journal = forged ? forged.journal : world.journal;
  $('journal').innerHTML = journalItems(journal, forged ? forged.index : -1);
  const acc = world.journal.filter(e => e.body.outcome === 'accepted').length;
  $('journal-count').textContent = world.journal.length
    ? `${world.journal.length} witness${world.journal.length === 1 ? '' : 'es'} · ${acc} accepted · ${world.journal.length - acc} refused`
    : 'No witnesses yet.';
}

function emitJournal() {
  const detail = {
    entries: world.journal.map(e => ({
      outcome: e.body.outcome,
      sequence: e.body.sequence,
      identity: labelOf(e.body.identity),
      purpose: e.body.context.purpose,
      stage: e.body.failure?.stage,
    })),
    head: world.temple.root,
  };
  window.__templeJournal = detail;
  document.dispatchEvent(new CustomEvent('temple:journal', { detail }));
}

// ------------------------------------------------------------- preview --

let previewToken = 0;
async function updatePreview() {
  const r = recipe();
  $('note-field').hidden = r.preset !== 'note';
  $('preset-blurb').textContent = PRESETS.find(p => p.id === r.preset)?.blurb || '';
  const staleBox = $('stale');
  const canStale = world.temple.roots.length > 1;
  staleBox.disabled = !canStale;
  if (!canStale) staleBox.checked = false;
  $('stale-hint').textContent = canStale ? '(the state before the last acceptance)' : '(accept a change first)';
  document.querySelectorAll('.preset').forEach(label => {
    label.classList.toggle('unavailable', Boolean(presetAvailability(world.temple, label.dataset.preset)));
  });
  const blocked = presetAvailability(world.temple, r.preset);
  $('availability').textContent = blocked || '';
  $('propose').disabled = Boolean(blocked) || busy;
  const token = ++previewToken;
  try {
    const p = await buildProposal(world.temple, world.registry, r);
    if (token !== previewToken) return;
    const bytes = new TextEncoder().encode(canonical(p.wire)).length;
    $('wire').textContent = `${JSON.stringify(p.wire, null, 1)}\n\n— ${bytes} canonical bytes. The witness hashes the canonical form.`;
  } catch (err) {
    $('wire').textContent = blocked || String(err.message || err);
  }
}

// --------------------------------------------------------------- lesson --

function lesson(r, result, covenantTitle) {
  const f = result.failure;
  const amended = /amended/.test(covenantTitle);
  if (result.accepted) {
    switch (r.preset) {
      case 'tend':
      case 'tend-unseen':
        return {
          text: r.identity === 'visitor'
            ? 'The amended covenant welcomes a visitor’s hand on the oil. The law changed first — by a witnessed act — and only then did this become possible.'
            : 'The steward’s hand is on the oil. The proposal named the role cell, the covenant could see it, and the fixed algebra did the rest.',
          ref: 'The lamp is lit',
        };
      case 'refill': return { text: 'The oil cell was consumed and a fuller one created — the only way anything changes here. Cells are never edited in place.', ref: 'III · No hidden mutation' };
      case 'note': return { text: 'Creation is open to anyone — even an AI emissary. What it cannot do is move what the covenant guards.', ref: 'Creation is open; consumption is governed' };
      case 'amend': return { text: `The covenant is now “${world.registry.get(world.temple.state.predicateId).title}”. It becomes active only in the resulting state — it did not judge its own installation. Try tending the lamp as the visitor.`, ref: 'VII · No retrospective law' };
      default: return { text: 'Accepted, and witnessed.', ref: '' };
    }
  }
  switch (f.stage) {
    case 1: return { text: 'Something in the proposal was not canonical or not bounded. It never reached the law.', ref: 'IV · No ambient context' };
    case 2: return { text: 'The proposal was built on a state that no longer exists. A stale basis is never applied — no one can slip a change in “before” another.', ref: 'Stage 2 · the exact starting point' };
    case 3: return { text: 'The fixed algebra could not apply this delta to the current state.', ref: 'V · No executable mutation authority' };
    case 4: return { text: 'The proposer claimed a result the algebra does not produce. What you say will happen must be what happens.', ref: 'A supplied answer cannot stand in for verification' };
    case 6: return { text: 'Refused — even for the steward. A covenant may narrow the Ark; it can never exceed it. This one was nested beyond the Ark’s bound.', ref: 'II · No absolute local policy' };
    default: break;
  }
  const rules = f.rules || [];
  if (rules.includes('C')) return { text: 'The steward’s role is fixed in this covenant. No one proposes their way into it.', ref: 'Covenant rule C' };
  if (rules.includes('D')) return { text: 'Only the steward may amend the covenant — and the steward must be seen to be the steward.', ref: 'Covenant rule D' };
  if (rules.includes('B')) return { text: 'Oil never simply vanishes here. Consuming it means creating it again, fuller or emptier, in plain sight.', ref: 'Covenant rule B' };
  if (rules.includes('A')) {
    if (r.identity === 'emissary') return { text: 'The emissary holds a full copy of the Temple and a capable mind — and neither is authority. Acting for the visitor is not being the visitor.', ref: 'I · No implicit authority' };
    if (r.identity === 'steward' && r.preset === 'tend-unseen') return { text: 'Refused — even for the steward. The proposal never named the role cell, so the covenant could not see who the steward is. A covenant sees only what a proposal names.', ref: 'Information access is authority too' };
    if (r.identity === 'visitor' && !amended) return { text: 'Under this covenant, oil moves only by the steward’s hand. The steward could amend the covenant to welcome visitors — try it.', ref: 'Covenant rule A' };
    return { text: 'Oil moves only by the hands this covenant names.', ref: 'Covenant rule A' };
  }
  return { text: 'The covenant said no.', ref: '' };
}

// -------------------------------------------------------------- propose --

async function onPropose(event) {
  event.preventDefault();
  if (busy) return;
  const r = recipe();
  if (presetAvailability(world.temple, r.preset)) return;
  busy = true;
  $('propose').disabled = true;
  if (forged) restore();
  const covenantBefore = world.registry.get(world.temple.state.predicateId).title;
  renderStages();
  $('verdict').className = 'verdict';
  $('verdict').innerHTML = '<p class="verdict-idle">Judging…</p>';
  const { result } = await propose(world, r);
  const states = {};
  const byN = new Map(result.stages.map(s => [s.n, s]));
  for (const s of STAGES) {
    states[s.n] = { state: 'running' };
    renderStages(states);
    await wait(210);
    const got = byN.get(s.n);
    if (!got) {
      for (const rest of STAGES.filter(x => x.n >= s.n)) states[rest.n] = { state: 'skipped', detail: 'Not reached.' };
      renderStages(states);
      break;
    }
    states[s.n] = { state: got.ok ? 'ok' : 'fail', detail: got.detail };
    renderStages(states);
    if (!got.ok) {
      for (const rest of STAGES.filter(x => x.n > s.n)) states[rest.n] = { state: 'skipped', detail: 'Not reached.' };
      renderStages(states);
      break;
    }
  }
  const L = lesson(r, result, covenantBefore);
  const w = result.witness;
  $('verdict').className = `verdict ${result.accepted ? 'accepted' : 'refused'}`;
  $('verdict').innerHTML = result.accepted
    ? `<h4>Accepted · sequence ${esc(w.body.sequence)}</h4><p>${esc(L.text)}</p>
       <p class="ref">${esc(L.ref)}</p><p><code>${esc(w.id)}</code></p>`
    : `<h4>Refused at stage ${esc(result.failure.stage)} · ${esc(result.failure.code)}</h4><p>${esc(L.text)}</p>
       <p>The refusal has its own witness. The state did not move.</p>
       <p class="ref">${esc(L.ref)}${L.ref ? ' · ' : ''}VIII · No silent failure</p><p><code>${esc(w.id)}</code></p>`;
  lastReport = result.covenantReport;
  renderTemple(result.accepted);
  renderCovenant(lastReport, true);
  renderJournal();
  emitJournal();
  $('replay-lines').innerHTML = '';
  busy = false;
  await updatePreview();
}

// ------------------------------------------------------ replay & forgery --

async function showLines(lines) {
  const list = $('replay-lines');
  list.innerHTML = '';
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const li = document.createElement('li');
    li.className = `${line.ok ? '' : 'bad'} ${i === lines.length - 1 ? 'final' : ''}`.trim();
    li.textContent = line.text;
    list.append(li);
    await wait(lines.length > 12 ? 60 : 120);
  }
}

function setReplayBusy(state) {
  for (const id of ['replay', 'forge-edit', 'forge-rewrite', 'restore']) $(id).disabled = state;
}

async function onReplay() {
  setReplayBusy(true);
  const journal = forged ? forged.journal : world.journal;
  const result = await replay(world, journal, world.temple.root);
  await showLines(result.lines);
  setReplayBusy(false);
}

async function onForge(mode) {
  setReplayBusy(true);
  if (forged) restore();
  const f = await forge(world, mode);
  if (!f) {
    $('forgery').hidden = false;
    $('forgery').textContent = 'There is no history worth forging yet. Tend the lamp first, as the steward.';
    setReplayBusy(false);
    return;
  }
  forged = f;
  $('forgery').hidden = false;
  $('forgery').textContent = `${f.description} Now a verifier replays it:`;
  $('restore').hidden = false;
  renderJournal();
  const result = await replay(world, f.journal, world.temple.root);
  await showLines(result.lines);
  setReplayBusy(false);
}

function restore() {
  forged = null;
  $('forgery').hidden = true;
  $('restore').hidden = true;
  $('replay-lines').innerHTML = '';
  renderJournal();
}

// ----------------------------------------------------------------- boot --

async function init() {
  if (!globalThis.crypto?.subtle) {
    $('verdict').innerHTML = '<p class="verdict-idle">This miniature needs Web Crypto (a secure context such as https:// or localhost).</p>';
    return;
  }
  renderChoices();
  renderStages();
  world = await createTemple();
  renderTemple(false);
  renderCovenant();
  renderJournal();
  emitJournal();
  await updatePreview();
  $('composer').addEventListener('submit', onPropose);
  $('composer').addEventListener('change', () => { updatePreview(); });
  $('note-text').addEventListener('input', () => { updatePreview(); });
  $('replay').addEventListener('click', onReplay);
  $('forge-edit').addEventListener('click', () => onForge('edit'));
  $('forge-rewrite').addEventListener('click', () => onForge('rewrite'));
  $('restore').addEventListener('click', restore);
}

init().catch(err => {
  console.error(err);
  $('verdict').innerHTML = `<p class="verdict-idle">The miniature could not start: ${esc(err.message || err)}</p>`;
});
