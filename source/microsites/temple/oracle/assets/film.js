// The film: a starlit sky, scroll-driven scenes, the living witness chain and
// the federation of Temples. Everything degrades to a calm static page.

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 819px)');
const clamp01 = v => Math.max(0, Math.min(1, v));
const SVGNS = 'http://www.w3.org/2000/svg';

// ------------------------------------------------------------------ sky --

function initSky() {
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let stars = [];
  let motes = [];
  let raf = 0;
  let last = 0;

  function seed() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(460, (w * h) / 3300));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 1.7,
      r: Math.random() ** 2.2 * 1.5 + 0.25,
      a: Math.random() * 0.55 + 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.9 + 0.2,
      depth: Math.random() * 0.6 + 0.1,
      warm: Math.random() < 0.14,
    }));
    motes = Array.from({ length: Math.max(12, Math.round(count / 9)) }, () => spawnMote(true));
  }

  function spawnMote(anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? h - Math.random() * h * 0.5 : h + 6,
      r: Math.random() * 1.3 + 0.35,
      vy: -(Math.random() * 0.16 + 0.05),
      vx: (Math.random() - 0.5) * 0.08,
      a: Math.random() * 0.5 + 0.2,
      age: anywhere ? Math.random() : 0,
    };
  }

  function draw(t, still) {
    ctx.clearRect(0, 0, w, h);
    const scroll = window.scrollY;
    const span = h * 1.7;
    for (const s of stars) {
      let y = (s.y - scroll * s.depth * 0.22) % span;
      if (y < 0) y += span;
      y -= h * 0.35;
      if (y < -3 || y > h + 3) continue;
      const twinkle = still ? 0.85 : 0.62 + 0.38 * Math.sin(t * 0.0011 * s.speed + s.phase);
      ctx.globalAlpha = s.a * twinkle;
      ctx.fillStyle = s.warm ? '#ffe2a8' : '#dfe4ff';
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < motes.length; i += 1) {
      const m = motes[i];
      if (!still) {
        m.x += m.vx;
        m.y += m.vy;
        m.age += 0.0016;
        if (m.age > 1 || m.y < h * 0.4) { motes[i] = spawnMote(false); continue; }
      }
      ctx.globalAlpha = m.a * Math.sin(Math.PI * clamp01(m.age));
      ctx.fillStyle = '#f2c96f';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (t - last < 32) return; // ~30 fps is plenty for a night sky
    last = t;
    draw(t, false);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduced.matches || document.hidden) { draw(0, true); return; }
    raf = requestAnimationFrame(frame);
  }

  seed();
  start();
  let resizeTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { seed(); start(); }, 150); });
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener('change', start);
  window.addEventListener('scroll', () => { if (reduced.matches) draw(0, true); }, { passive: true });
}

// --------------------------------------------------------------- reveal --

function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  items.forEach(el => io.observe(el));
}

// ------------------------------------------------------- scroll scenes --

const KEYS = ['all', 'c', 'turn', 'ark', 'i', 's0', 'd', 'w', 's1', 'six'];

function initScenes() {
  const scene = document.querySelector('[data-scene]');
  const rail = scene ? [...scene.querySelectorAll('.scene-rail span')] : [];
  const progressed = [...document.querySelectorAll('[data-progress]')];
  let ticking = false;

  function mode() {
    if (!scene) return;
    const film = !reduced.matches && !narrow.matches;
    scene.classList.toggle('static', !film);
    if (!film) scene.dataset.step = 'all';
    update();
  }

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of progressed) {
      const r = el.getBoundingClientRect();
      const p = clamp01((vh - r.top) / (r.height + vh));
      el.style.setProperty('--p', clamp01((p - 0.2) / 0.55).toFixed(3));
    }
    if (scene && !scene.classList.contains('static')) {
      const r = scene.getBoundingClientRect();
      const total = r.height - vh;
      const p = total > 0 ? clamp01(-r.top / total) : 0;
      const idx = Math.min(KEYS.length - 1, Math.floor(p * KEYS.length * 0.999));
      if (scene.dataset.step !== KEYS[idx]) scene.dataset.step = KEYS[idx];
      rail.forEach((s, i) => s.classList.toggle('on', i === idx));
    }
  }

  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', mode);
  reduced.addEventListener('change', mode);
  narrow.addEventListener('change', mode);
  mode();
}

// ------------------------------------------------------- stone texture --

function initStone() {
  const size = 160;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 150 + Math.random() * 105;
    img.data[i] = v;
    img.data[i + 1] = v * 0.94;
    img.data[i + 2] = v * 0.82;
    img.data[i + 3] = Math.random() < 0.5 ? 10 : 4;
  }
  g.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--noise', `url(${c.toDataURL()})`);
}

// --------------------------------------------------------- witness chain --

function initChain() {
  const svg = document.getElementById('chain');
  const summary = document.getElementById('chain-summary');
  if (!svg) return;

  function el(name, attrs, text) {
    const node = document.createElementNS(SVGNS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text != null) node.textContent = text;
    return node;
  }

  function render(detail) {
    const entries = detail?.entries || [];
    const shown = entries.slice(-11);
    const hidden = entries.length - shown.length;
    const step = 28;
    const top = 34;
    const height = top + 24 + Math.max(1, shown.length) * step + 20;
    svg.setAttribute('viewBox', `0 0 420 ${height}`);
    svg.replaceChildren();
    const x = 96;
    svg.append(el('line', { class: 'spine', x1: x, y1: top, x2: x, y2: height - 18 }));
    svg.append(el('circle', { class: 'genesis', cx: x, cy: top, r: 8 }));
    svg.append(el('text', { class: 'lbl-caps', x: x + 20, y: top + 4 }, 'GENESIS'));
    if (hidden > 0) svg.append(el('text', { x: x + 20, y: top + 22 }, `… ${hidden} earlier witness${hidden === 1 ? '' : 'es'}`));
    shown.forEach((e, i) => {
      const y = top + 24 + (i + 1) * step - (hidden > 0 ? 0 : 6);
      if (e.outcome === 'accepted') {
        svg.append(el('circle', { class: 'acc', cx: x, cy: y, r: 6 }));
        svg.append(el('text', { x: x + 20, y: y + 4 }, `#${e.sequence} · ${e.identity} · ${e.purpose}`));
      } else {
        svg.append(el('line', { class: 'rej-link', x1: x, y1: y, x2: x + 34, y2: y }));
        svg.append(el('circle', { class: 'rej', cx: x + 40, cy: y, r: 5 }));
        svg.append(el('text', { x: x + 56, y: y + 4 }, `refused · ${e.identity} · stage ${e.stage}`));
      }
    });
    if (!entries.length) {
      summary.textContent = 'Your Temple so far: genesis, and nothing else yet. Try the gate above.';
    } else {
      const acc = entries.filter(e => e.outcome === 'accepted').length;
      const rej = entries.length - acc;
      summary.textContent = `Your Temple so far: genesis, ${acc} accepted transition${acc === 1 ? '' : 's'} and ${rej} refusal${rej === 1 ? '' : 's'} — every one witnessed. Only acceptances advance the state.`;
    }
  }

  document.addEventListener('temple:journal', e => render(e.detail));
  render(window.__templeJournal);
}

// ---------------------------------------------------- the constellation --

function initConstellation() {
  const canvas = document.getElementById('constellation');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const nodes = [
    [0.1, 0.34], [0.27, 0.13], [0.47, 0.3], [0.7, 0.12], [0.9, 0.36],
    [0.66, 0.6], [0.4, 0.68], [0.16, 0.8], [0.86, 0.84],
  ];
  const WEST = 6;
  const EAST = 5;
  const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 4], [WEST, EAST], [6, 7], [6, 2], [5, 8], [0, 7]];
  let w = 0;
  let h = 0;
  let raf = 0;
  let visible = false;
  let sparks = [];
  let rings = [];
  let nextSpark = 0;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const pos = i => [nodes[i][0] * (w - 60) + 30, nodes[i][1] * (h - 70) + 30];

  function temple(x, y, s, glow) {
    const grd = ctx.createRadialGradient(x, y, 0, x, y, s * 3.2);
    grd.addColorStop(0, `rgba(255,214,140,${0.28 * glow})`);
    grd.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, s * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e3c07a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - s, y - s * 0.35);
    ctx.lineTo(x, y - s * 0.95);
    ctx.lineTo(x + s, y - s * 0.35);
    ctx.closePath();
    for (const dx of [-0.66, -0.22, 0.22, 0.66]) {
      ctx.moveTo(x + dx * s, y - s * 0.2);
      ctx.lineTo(x + dx * s, y + s * 0.62);
    }
    ctx.moveTo(x - s * 1.1, y + s * 0.78);
    ctx.lineTo(x + s * 1.1, y + s * 0.78);
    ctx.stroke();
  }

  function draw(t, still) {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (const [a, b] of edges) {
      const [x1, y1] = pos(a);
      const [x2, y2] = pos(b);
      const lab = (a === WEST && b === EAST);
      ctx.strokeStyle = lab ? 'rgba(255,226,168,0.55)' : 'rgba(227,192,122,0.2)';
      ctx.setLineDash(lab ? [] : [3, 6]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (!still) {
      if (t > nextSpark) {
        const [a, b] = edges[Math.floor(Math.random() * edges.length)];
        const flip = Math.random() < 0.5;
        sparks.push({ from: flip ? b : a, to: flip ? a : b, t0: t, dur: 1700 + Math.random() * 700, ok: Math.random() < 0.72 });
        nextSpark = t + 900 + Math.random() * 900;
      }
      sparks = sparks.filter(s => {
        const k = (t - s.t0) / s.dur;
        if (k >= 1) { rings.push({ at: s.to, t0: t, ok: s.ok }); return false; }
        const [x1, y1] = pos(s.from);
        const [x2, y2] = pos(s.to);
        const e = k * k * (3 - 2 * k);
        const x = x1 + (x2 - x1) * e;
        const y = y1 + (y2 - y1) * e;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 9);
        grd.addColorStop(0, 'rgba(255,241,201,0.95)');
        grd.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      rings = rings.filter(r => {
        const k = (t - r.t0) / 1300;
        if (k >= 1) return false;
        const [x, y] = pos(r.at);
        ctx.strokeStyle = r.ok ? `rgba(227,192,122,${1 - k})` : `rgba(232,145,127,${1 - k})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(x, y, 12 + k * 22, 0, Math.PI * 2);
        ctx.stroke();
        return true;
      });
    }
    nodes.forEach((_, i) => {
      const [x, y] = pos(i);
      const glow = still ? 0.8 : 0.7 + 0.3 * Math.sin(t * 0.0013 + i);
      temple(x, y, i === WEST || i === EAST ? 12 : 9, glow);
    });
    ctx.font = 'italic 500 15px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#ffe2a8';
    ctx.textAlign = 'center';
    const [wx, wy] = pos(WEST);
    const [ex, ey] = pos(EAST);
    ctx.fillText('west', wx, wy + 30);
    ctx.fillText('east', ex, ey + 30);
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    draw(t, false);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (!visible || reduced.matches || document.hidden) { draw(0, true); return; }
    raf = requestAnimationFrame(frame);
  }

  size();
  draw(0, true);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }, { threshold: 0.05 }).observe(canvas);
  window.addEventListener('resize', () => { size(); start(); });
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener('change', start);
  document.fonts?.ready.then(() => draw(0, true));
}

// ------------------------------------------------------------------ CTA --

function initFollow() {
  const btn = document.getElementById('follow-btn');
  const note = document.getElementById('follow-note');
  btn?.addEventListener('click', () => {
    note.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  });
}

initSky();
initStone();
initReveal();
initScenes();
initChain();
initConstellation();
initFollow();
