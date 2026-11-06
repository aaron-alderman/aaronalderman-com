// Screening rooms: a visible sound toggle, scene chapters, pause when out of
// view, and the film's provenance read from its manifest.

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Seek, then play. A server without HTTP range support (like a simple local
// preview server) leaves the media unseekable; then re-open the same file as a
// blob, which the browser can always seek.
const seekable = (video, t) => {
  for (let i = 0; i < video.seekable.length; i += 1) {
    if (video.seekable.start(i) <= t && t <= video.seekable.end(i)) return true;
  }
  return false;
};

async function openAsBlob(video) {
  const response = await fetch(video.currentSrc);
  const url = URL.createObjectURL(await response.blob());
  const muted = video.muted;
  const loaded = new Promise(resolve => video.addEventListener('loadedmetadata', resolve, { once: true }));
  video.src = url;
  video.muted = muted;
  await loaded;
}

async function seekTo(video, t) {
  if (video.readyState < 1) {
    video.preload = 'auto';
    video.load();
    await new Promise(resolve => video.addEventListener('loadedmetadata', resolve, { once: true }));
  }
  if (!seekable(video, t) && video.currentSrc && !video.currentSrc.startsWith('blob:')) {
    try { await openAsBlob(video); } catch { /* play from wherever the browser allows */ }
  }
  video.currentTime = t;
  video.play().catch(() => {});
}

function initScreens() {
  for (const screen of document.querySelectorAll('[data-screen]')) {
    const video = screen.querySelector('video');
    const sound = screen.querySelector('[data-sound]');
    if (!video) continue;
    const syncSound = () => {
      const on = !video.muted;
      sound.textContent = on ? 'Sound on' : 'Sound off';
      sound.setAttribute('aria-pressed', String(on));
    };
    sound?.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 0.8;
      syncSound();
    });
    video.addEventListener('volumechange', syncSound);
    syncSound();

    // Never keep playing off-screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting && !video.paused) video.pause();
      }, { threshold: 0.2 }).observe(video);
    }

    const chapters = screen.parentElement.querySelector('.chapters');
    chapters?.addEventListener('click', event => {
      const button = event.target.closest('[data-seek]');
      if (!button) return;
      seekTo(video, Number(button.dataset.seek));
      video.focus({ preventScroll: true });
    });
  }
}

async function initProvenance() {
  const box = document.getElementById('provenance');
  if (!box) return;
  try {
    const response = await fetch('manifest.json', { cache: 'no-cache' });
    const m = await response.json();
    const rows = m.files.map(f => `
      <tr>
        <th scope="row"><a href="${esc(f.path.replace(/^films\//, ''))}">${esc(f.path.replace(/^films\//, ''))}</a></th>
        <td>${esc(f.kind)}${f.duration ? ` · ${esc(f.duration)} s` : ''}${f.codecs ? ` · ${esc(f.codecs.video)}/${esc(f.codecs.audio)}` : ''}</td>
        <td>${(f.bytes / 1e6).toFixed(2)} MB</td>
        <td><code title="${esc(f.sha256)}">${esc(f.sha256.slice(0, 16))}…</code></td>
      </tr>`).join('');
    box.innerHTML = `
      <dl class="prov-facts">
        <div><dt>Source hash</dt><dd><code>${esc(m.sourceHash)}</code></dd></div>
        <div><dt>Defined as</dt><dd>${esc(m.sourceHashDefinition)}</dd></div>
        <div><dt>Rendered with</dt><dd><code>${esc(m.ffmpeg)}</code></dd></div>
        <div><dt>Duration</dt><dd>${esc(m.duration)} s in ${esc(m.scenes.length)} scenes</dd></div>
      </dl>
      <table class="prov-table">
        <thead><tr><th scope="col">File</th><th scope="col">What</th><th scope="col">Size</th><th scope="col">SHA-256</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch {
    box.innerHTML = '<p class="fine">The manifest could not be read here. It sits beside the film as <a href="manifest.json">manifest.json</a>.</p>';
  }
}

initScreens();
initProvenance();
