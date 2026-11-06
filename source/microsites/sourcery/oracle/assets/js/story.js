/* Storybook behaviour: scene playback, the flood, contents, stones and the call to action. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = reduceQuery.matches;

  /* ---------- Play scenes only while they are on screen ---------- */
  var scenes = document.querySelectorAll('.scene, .reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('is-playing', e.isIntersecting && !reduce);
        if (e.isIntersecting) e.target.classList.add('is-in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    scenes.forEach(function (el) { io.observe(el); });
  } else {
    scenes.forEach(function (el) { el.classList.add('is-in'); if (!reduce) el.classList.add('is-playing'); });
  }

  /* ---------- Contents: toggle on small screens, mark the current chapter ---------- */
  var toggle = document.querySelector('.contents-toggle');
  var toc = document.getElementById('toc');
  if (toggle && toc) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toc.classList.toggle('is-open', open);
    });
    toc.addEventListener('click', function (e) {
      if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); toc.classList.remove('is-open'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toc.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false'); toc.classList.remove('is-open'); toggle.focus();
      }
    });
  }
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  var chapters = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && chapters.length) {
    var current = null;
    var chapterIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) current = e.target.id;
      });
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + current;
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    chapters.forEach(function (c) { chapterIo.observe(c); });
  }

  /* ---------- The flood ---------- */
  var flood = document.getElementById('flood');
  var scene = document.getElementById('flood-scene');
  var broomLayer = document.getElementById('flood-brooms');
  var water = document.getElementById('flood-water');
  var waveBack = document.getElementById('wave-back');
  var waveFront = document.getElementById('wave-front');
  var foam = document.getElementById('wave-foam');
  if (flood && scene && broomLayer && water) {
    var NS = 'http://www.w3.org/2000/svg';
    var FLOOR = 562;
    var MAX_BROOMS = 40;
    var tags = Array.prototype.slice.call(scene.querySelectorAll('.float-tag'));
    var countBrooms = scene.querySelector('[data-count="brooms"]');
    var countBuckets = scene.querySelector('[data-count="buckets"]');

    // Deterministic scatter so the picture is the same for everyone.
    var seed = 20260928;
    function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var brooms = [];
    var xs = [560, 470, 650, 380, 520, 290, 720, 430, 150, 610, 340, 90, 250, 760, 500, 190, 580, 60, 680, 400];
    for (var i = 0; i < MAX_BROOMS; i++) {
      var x = i < xs.length ? xs[i] + (rand() - 0.5) * 24 : 40 + rand() * 730;
      var s = 0.26 + rand() * 0.16;
      var g = document.createElementNS(NS, 'g');
      var inner = document.createElementNS(NS, 'g');
      var use = document.createElementNS(NS, 'use');
      use.setAttribute('href', '#broom');
      use.setAttribute('x', '-60'); use.setAttribute('y', '-240');
      use.setAttribute('width', '120'); use.setAttribute('height', '250');
      inner.appendChild(use);
      g.appendChild(inner);
      g.style.display = 'none';
      broomLayer.appendChild(g);
      brooms.push({ el: g, x: x, s: s, flip: rand() < 0.4 ? -1 : 1, phase: rand() * Math.PI * 2, tilt: (rand() - 0.5) * 10, sink: 6 + rand() * 16 });
    }

    var progress = reduce ? 0.72 : 0;
    var level = FLOOR + 30;
    var shown = 0;

    function broomCount(p) { return Math.max(1, Math.min(MAX_BROOMS, Math.round(Math.pow(2, p * 5.35)))); }

    function computeProgress() {
      var r = flood.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var travel = Math.max(1, r.height - vh * 0.6);
      var p = (vh * 0.35 - r.top) / travel;
      return Math.max(0, Math.min(1, p));
    }

    function waveD(baseY, amp, len, phase, t) {
      var d = 'M-20 ' + baseY.toFixed(1);
      for (var x = -20; x <= 820; x += 20) {
        var y = baseY + Math.sin((x / len) * Math.PI * 2 + phase + t) * amp + Math.sin((x / (len * 0.43)) * Math.PI * 2 - t * 1.3) * amp * 0.35;
        d += ' L' + x + ' ' + y.toFixed(1);
      }
      return d;
    }

    function render(t) {
      var target = FLOOR + 30 - progress * 300; // from under the floor to the windowsill
      level += (target - level) * (reduce ? 1 : 0.12);
      var amp = 4 + progress * 7;
      var frontLine = waveD(level, amp, 260, 0, t);
      waveFront.setAttribute('d', frontLine + ' L820 640 L-20 640 Z');
      foam.setAttribute('d', frontLine);
      waveBack.setAttribute('d', waveD(level - 9, amp * 0.8, 340, 1.7, t * 0.8) + ' L820 640 L-20 640 Z');

      var n = broomCount(progress);
      if (n !== shown) {
        for (var i = 0; i < MAX_BROOMS; i++) brooms[i].el.style.display = i < n ? '' : 'none';
        shown = n;
        if (countBrooms) countBrooms.textContent = String(n);
        if (countBuckets) countBuckets.textContent = String(n * 2);
      }
      for (var j = 0; j < n; j++) {
        var b = brooms[j];
        var floating = level < FLOOR - 4;
        var y = floating ? level + b.sink + Math.sin(t * 2 + b.phase) * 3 : FLOOR;
        var rot = floating ? b.tilt + Math.sin(t * 1.6 + b.phase) * 5 : Math.sin(t * 5 + b.phase) * 3;
        var hopY = floating ? 0 : -Math.abs(Math.sin(t * 5 + b.phase)) * 8;
        b.el.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + (y + hopY).toFixed(1) + ') rotate(' + rot.toFixed(1) + ') scale(' + (b.s * b.flip).toFixed(3) + ' ' + b.s.toFixed(3) + ')');
      }
      tags.forEach(function (tag) { tag.classList.toggle('is-on', progress >= parseFloat(tag.dataset.at)); });
    }

    var running = false;
    var visible = false;
    function frame(now) {
      if (!running) return;
      render(now / 1000);
      requestAnimationFrame(frame);
    }
    function setRunning() {
      var should = visible && !reduce && document.visibilityState === 'visible';
      if (should && !running) { running = true; requestAnimationFrame(frame); }
      if (!should) running = false;
    }
    function onScroll() { if (!reduce) progress = computeProgress(); }

    if (reduce) {
      render(0);
    } else {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) onScroll();
          setRunning();
        }).observe(flood);
      } else { visible = true; setRunning(); }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      document.addEventListener('visibilitychange', setRunning);
      render(0);
    }
    reduceQuery.addEventListener && reduceQuery.addEventListener('change', function (e) {
      reduce = e.matches;
      if (reduce) { progress = 0.72; render(0); }
      setRunning();
    });
  }

  /* ---------- The foundation stones ---------- */
  var stones = document.querySelectorAll('.stone');
  var caption = document.getElementById('stone-caption');
  stones.forEach(function (stone, index) {
    stone.addEventListener('click', function () {
      stones.forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
      stone.setAttribute('aria-pressed', 'true');
      if (caption) {
        caption.innerHTML = '';
        var title = document.createElement('b');
        title.textContent = (index + 1) + '. ' + stone.textContent.trim() + '.';
        caption.appendChild(title);
        caption.appendChild(document.createTextNode(stone.dataset.full));
      }
    });
  });

  /* ---------- Films: loops play muted only while in view, never under reduced motion ---------- */
  document.querySelectorAll('video[data-autoplay]').forEach(function (video) {
    var toggle = video.parentElement.querySelector('.video-toggle');
    video.muted = true;
    if (reduce) { video.controls = true; return; }
    var userPaused = false;
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', function () {
        if (video.paused) { userPaused = false; video.play().catch(function () {}); } else { userPaused = true; video.pause(); }
      });
      video.addEventListener('play', function () { toggle.textContent = 'Pause'; });
      video.addEventListener('pause', function () { toggle.textContent = 'Play'; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !userPaused) video.play().catch(function () {});
          else if (!e.isIntersecting) video.pause();
        });
      }, { threshold: 0.4 }).observe(video);
    }
  });

  /* ---------- Call to action: an honest placeholder ---------- */
  var cta = document.getElementById('cta-button');
  var note = document.getElementById('cta-note');
  if (cta && note) {
    cta.addEventListener('click', function () {
      var open = note.hasAttribute('hidden');
      if (open) note.removeAttribute('hidden'); else note.setAttribute('hidden', '');
      cta.setAttribute('aria-expanded', String(open));
    });
  }
})();
