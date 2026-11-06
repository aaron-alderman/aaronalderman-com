/* Cast a spell: a template-based broom turns an intent into an itemised proposal.
   Nothing happens until the reader seals it or sends it back; both are witnessed
   in a hash-chained ledger that can be verified (and tampered with, to see it break). */
(function () {
  'use strict';

  var W = window.Witness;
  var form = document.getElementById('spell-form');
  var input = document.getElementById('spell-intent');
  var stage = document.getElementById('spell-stage');
  var list = document.getElementById('ledger-list');
  var verifyBtn = document.getElementById('ledger-verify');
  var tamperBtn = document.getElementById('ledger-tamper');
  var result = document.getElementById('ledger-result');
  if (!W || !form || !input || !stage || !list) return;

  var ledger = [];          // { record, witness } — record is exactly what was hashed
  var tampered = null;      // original record of № 1 while tampering
  var current = null;       // the proposal on the desk

  /* ---------- Reading the intent (deliberately simple rules) ---------- */
  var STOP = ('a an the our my your their his her its which what who whom whose each every all this that these those ' +
    'last went go goes going gone is are was were be been being have has had need needs needed get gets got do does did ' +
    'over under before after when where why how to for with and or of in on at by from about into than then so if ' +
    'holds hold held runs run ran borrowed borrow borrows lent lend took take takes came come left leave arrived arrive ' +
    'due ordered order orders out up down off anything something everything whether keep kept track tell show let me us').split(' ');
  var STOPSET = {};
  STOP.forEach(function (w) { STOPSET[w] = true; });

  var EVENT_VERBS = [
    [/\bwent out\b|\bgo out\b|\blet (?:them|him|her|it) out\b/, 'outing'],
    [/\bwalk(?:ed|s)?\b/, 'walk'], [/\bfed\b|\bfeed(?:ing)?\b/, 'feed'], [/\bwater(?:ed|ing)\b/, 'watering'],
    [/\bclean(?:ed|ing)?\b/, 'clean'], [/\bcall(?:ed|s)?\b/, 'call'], [/\bvisit(?:ed|s)?\b/, 'visit'],
    [/\bmedication\b|\bmeds\b|\bpills?\b|\bdose\b/, 'dose'], [/\bservic(?:ed|e)\b/, 'service'], [/\bpaid\b|\bpay(?:ment)?\b/, 'payment'],
    [/\bcheck(?:ed)?\b/, 'check'], [/\bchang(?:ed|e)\b/, 'change']
  ];

  var ARCHETYPES = [
    { key: 'claim', re: /\b(true|claim|evidence|prove|holds? up|fact|sources?|research)\b/i },
    { key: 'approval', re: /\b(approv\w*|sign[- ]?off|permission|authori[sz]\w*|over \$?\d)/i },
    { key: 'loan', re: /\b(borrow\w*|lend|lent|loan\w*|who has|returned|check(?:ed)? out)\b/i },
    { key: 'inventory', re: /\b(stock|inventory|how many|supplies|running low|run out|count)\b/i },
    { key: 'schedule', re: /\b(schedul\w*|roster|shifts?|book(?:ing)?s?|calendar|appointments?)\b/i },
    { key: 'queue', re: /\b(list|to-?dos?|tasks?|queue|backlog|chores?)\b/i },
    { key: 'log', re: /\b(when|last|since|log|track|record|how long|history|keep an eye)\b/i }
  ];

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function plural(s) { return /(s|x|ch|sh)$/.test(s) ? s + 'es' : s + 's'; }

  function subjectOf(text, fallback) {
    var m = text.toLowerCase().match(/\b(the|our|my|your|their|which|each|every|all)\s+([a-z][a-z'’-]*(?:\s+[a-z][a-z'’-]*){0,2})/);
    if (!m) return fallback;
    var words = [];
    m[2].split(/\s+/).some(function (w) {
      if (STOPSET[w]) return true;
      words.push(w);
      return words.length >= 2;
    });
    if (!words.length) return fallback;
    var det = { the: 'the', our: 'our', my: 'my', your: 'your', their: 'their' }[m[1]] || 'the';
    return det + ' ' + words.join(' ');
  }

  function refusals(text) {
    var out = [];
    var re = /\b(?:no|without|don['’]?t|do not|never)\s+([a-z]+(?:\s+(?:or|and)\s+[a-z]+)?)/gi;
    var m;
    while ((m = re.exec(text)) && out.length < 2) {
      out.push('No ' + m[1].toLowerCase() + ', as you asked');
    }
    return out;
  }

  function draft(text) {
    var lower = text.toLowerCase();
    var arch = ARCHETYPES.filter(function (a) { return a.re.test(lower); })[0] || { key: 'generic' };
    var p = { pattern: '', title: '', creates: [], rules: [], asks: [], wont: [] };
    var subject, noun, amount;
    switch (arch.key) {
      case 'log':
        subject = subjectOf(text, 'it');
        noun = 'entry';
        EVENT_VERBS.some(function (v) { if (v[0].test(lower)) { noun = v[1]; return true; } return false; });
        p.pattern = 'an event log';
        p.title = 'A little log for ' + subject;
        p.creates = [
          ['Record', cap(noun), 'when it happened, what kind, who noted it'],
          ['Action', 'Note ' + (/^[aeiou]/.test(noun) ? 'an ' : 'a ') + noun + ' now', 'one tap; the time fills itself in'],
          ['Action', 'Correct an entry', 'the original stays on the record'],
          ['View', 'Time since the last ' + noun, 'readable at a glance']
        ];
        p.rules = ['Every ' + noun + ' has a time and a person', 'Corrections supersede entries; they never delete them'];
        p.asks = ['How long is too long between ' + plural(noun) + '?'];
        p.wont = ['Guess who did something it didn’t see'];
        break;
      case 'loan':
        subject = subjectOf(text, 'the tools');
        p.pattern = 'a custody ledger';
        p.title = 'Who has ' + subject + '?';
        p.creates = [
          ['Record', 'Loan', 'which item, who has it, since when'],
          ['Action', 'Lend', 'names the person and the item'],
          ['Action', 'Mark returned', 'keeps the loan’s history'],
          ['View', 'Who has what', 'and what’s been out longest']
        ];
        p.rules = ['An item can be with only one person at a time', 'Returning closes a loan; it doesn’t erase it'];
        p.asks = ['When does a loan count as overdue?'];
        p.wont = ['Chase anyone on your behalf'];
        break;
      case 'approval':
        amount = (text.match(/\$\s?\d[\d,]*(?:\.\d+)?/) || [''])[0].replace(/\s/g, '');
        p.pattern = 'an approval gate';
        p.title = 'A gate' + (amount ? ' at ' + amount : '') + ' before anything goes out';
        p.creates = [
          ['Record', 'Request', 'what, how much, and why'],
          ['Record', 'Decision', 'who decided, when, under which rule'],
          ['Action', 'Ask for sign-off', 'goes to a named approver'],
          ['View', 'Waiting for me', 'and everything decided this month']
        ];
        p.rules = [
          (amount ? 'Requests over ' + amount : 'Requests over the limit') + ' need a named approver',
          'Approving is not ordering: placing the order is a separate, recorded step'
        ];
        p.asks = ['Who can approve, and up to what amount?'];
        p.wont = ['Approve anything itself', 'Place orders'];
        break;
      case 'inventory':
        subject = subjectOf(text, 'the supplies');
        p.pattern = 'a conservation ledger';
        p.title = 'A count of ' + subject + ' that adds up';
        p.creates = [
          ['Record', 'Stock movement', 'in or out, how many, why'],
          ['Action', 'Receive', 'adds stock with a reason'],
          ['Action', 'Use', 'takes stock with a reason'],
          ['View', 'On hand, running low', 'derived from the movements']
        ];
        p.rules = ['Stock can’t go below zero', 'Counts are derived from movements, never typed over'];
        p.asks = ['What counts as “running low” for each thing?'];
        p.wont = ['Reorder anything automatically'];
        break;
      case 'schedule':
        subject = subjectOf(text, 'the bookings');
        p.pattern = 'a planned occurrence';
        p.title = 'A calendar for ' + subject;
        p.creates = [
          ['Record', 'Booking', 'who, what, when, where'],
          ['Action', 'Book', 'a booking can exist before it has a time'],
          ['Action', 'Reschedule', 'keeps the original on record'],
          ['View', 'This week, and still unscheduled', 'side by side']
        ];
        p.rules = ['Nobody is booked in two places at once', 'Rescheduling supersedes; it never erases'];
        p.asks = ['Who may book on someone else’s behalf?'];
        p.wont = ['Confirm anything with other people for you'];
        break;
      case 'queue':
        subject = subjectOf(text, 'the list');
        p.pattern = 'an ordered queue';
        p.title = 'An ordered list for ' + subject;
        p.creates = [
          ['Record', 'Item', 'what it is, who it’s for, its status'],
          ['Action', 'Add, reorder, mark done', 'one order for the whole list'],
          ['View', 'Up next', 'and a quiet pile of done']
        ];
        p.rules = ['There is one order for the whole list', 'Done stays done unless someone reopens it, with a note'];
        p.asks = ['Can anyone add to the list, or only you?'];
        p.wont = ['Assign items to people who didn’t agree'];
        break;
      case 'claim':
        subject = subjectOf(text, 'the claim');
        p.pattern = 'claims and evidence (Claimipedia’s kind of spell)';
        p.title = 'A fair hearing for ' + subject;
        p.creates = [
          ['Record', 'Claim', 'a permanent address; the wording can be versioned'],
          ['Record', 'Evidence', 'source, direction, and where it came from'],
          ['Action', 'Run a review method', 'written down, versioned, repeatable'],
          ['View', 'Why this result?', 'every step, in order']
        ];
        p.rules = ['Methods are published before they judge anything', 'No universal truth score: each result names its method'];
        p.asks = ['Which review method should count, and whose?'];
        p.wont = ['Declare what’s true for everyone'];
        break;
      default:
        subject = subjectOf(text, 'this');
        p.pattern = 'a plain record with history';
        p.title = 'A careful home for ' + subject;
        p.creates = [
          ['Record', cap(subject.replace(/^(the|our|my|your|their) /, '')), 'the thing you care about'],
          ['Action', 'Create and update', 'every change keeps its history'],
          ['View', 'Everything, newest first', 'with who changed what']
        ];
        p.rules = ['Every change says who made it, and when'];
        p.asks = ['Who else should be able to see or change this?'];
        p.wont = ['Share anything outside this workspace'];
    }
    p.wont = refusals(text).concat(p.wont, ['Make any of this real before you seal it']);
    return p;
  }

  /* ---------- Rendering ---------- */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function section(title, items, render, listClass) {
    var sec = el('div', 'scroll-sec');
    sec.appendChild(el('h5', null, title));
    var ul = el('ul', listClass || null);
    items.forEach(function (item) { ul.appendChild(render(item)); });
    sec.appendChild(ul);
    return sec;
  }

  function head() { return ledger.length ? ledger[ledger.length - 1].witness : 'genesis'; }

  var BROOM_SVG = '<svg viewBox="-70 -250 140 262" aria-hidden="true" focusable="false"><use href="#broom" x="-60" y="-240" width="120" height="250"/></svg>';

  function summon(text) {
    var p = draft(text);
    var broomNo = 1 + (parseInt(W.sha256HexSync(text).slice(0, 4), 16) % 40);
    var proposal = {
      kind: 'proposal',
      intent: text,
      pattern: p.pattern,
      creates: p.creates.map(function (c) { return c[0] + ': ' + c[1] + ' (' + c[2] + ')'; }),
      rules: p.rules,
      asks: p.asks,
      wont: p.wont,
      emissary: 'broom-' + broomNo,
      askedBy: 'you',
      basis: head()
    };
    stage.innerHTML = '';
    var arrival = el('p', 'arrival' + (document.documentElement.classList.contains('reduce') ? '' : ' is-flying'));
    arrival.innerHTML = BROOM_SVG;
    arrival.appendChild(document.createTextNode('Broom №\u00a0' + broomNo + ' is back with a proposal.'));
    stage.appendChild(arrival);

    var scroll = el('article', 'scroll is-unrolling');
    scroll.setAttribute('aria-labelledby', 'proposal-title');
    var top = el('div', 'scroll-head');
    var h = el('h4', null, p.title);
    h.id = 'proposal-title';
    h.tabIndex = -1;
    top.appendChild(h);
    top.appendChild(el('span', 'scroll-state', 'Proposal · not yet real'));
    scroll.appendChild(top);
    scroll.appendChild(el('p', 'scroll-meta', 'From Broom №\u00a0' + broomNo + ', an emissary · asked by you · basis: ' +
      (proposal.basis === 'genesis' ? 'the empty ledger' : 'witness ' + W.short(proposal.basis))));
    var words = el('p', 'scroll-words');
    words.appendChild(el('span', null, 'Your exact words, kept as written'));
    words.appendChild(document.createTextNode('“' + text + '”'));
    scroll.appendChild(words);
    scroll.appendChild(section('It would create', p.creates, function (c) {
      var li = el('li');
      li.appendChild(el('span', 'kind', c[0]));
      var what = el('span', 'what');
      what.appendChild(el('b', null, c[1]));
      what.appendChild(document.createTextNode(': ' + c[2]));
      li.appendChild(what);
      return li;
    }, 'kinds'));
    scroll.appendChild(section('It would add these house rules', p.rules, function (r) { return el('li', null, r); }));
    scroll.appendChild(section('It needs one answer from you', p.asks, function (q) { return el('li', null, q); }));
    scroll.appendChild(section('It will not', p.wont, function (w) { return el('li', null, w); }));
    var built = el('p', 'scroll-meta', 'Built from a reusable pattern: ' + p.pattern + '.');
    scroll.appendChild(built);
    var seal = el('div', 'scroll-seal');
    var sealText = el('p', 'seal-text');
    sealText.appendChild(el('span', 'seal-label', 'Seal preview: '));
    var hashEl = el('span', 'hash', 'computing…');
    sealText.appendChild(hashEl);
    seal.appendChild(sealText);
    scroll.appendChild(seal);

    var actions = el('div', 'scroll-actions');
    var sealBtn = el('button', 'btn btn--seal', 'Seal it');
    sealBtn.type = 'button';
    var backBtn = el('button', 'btn btn--ghost', 'Send it back');
    backBtn.type = 'button';
    actions.appendChild(sealBtn);
    actions.appendChild(backBtn);
    scroll.appendChild(actions);
    stage.appendChild(scroll);

    current = { proposal: proposal, scroll: scroll, hash: null, actions: actions, broomNo: broomNo };
    W.sha256Hex(W.canonical(proposal)).then(function (hex) {
      current.hash = hex;
      hashEl.textContent = 'sha256:' + hex.slice(0, 16) + '…';
      hashEl.title = 'sha256:' + hex;
    });

    sealBtn.addEventListener('click', function () { decide('sealed', ''); });
    backBtn.addEventListener('click', function () { askWhy(); });
    requestAnimationFrame(function () { h.focus({ preventScroll: true }); });
    scroll.scrollIntoView({ block: 'nearest', behavior: document.documentElement.classList.contains('reduce') ? 'auto' : 'smooth' });
  }

  function askWhy() {
    if (!current || current.scroll.querySelector('.return-note')) return;
    var wrap = el('div', 'return-note');
    var label = el('label', null, 'Why send it back? (optional, and it goes on the record)');
    label.htmlFor = 'return-why';
    var why = el('input');
    why.id = 'return-why';
    why.type = 'text';
    why.maxLength = 120;
    why.placeholder = 'e.g. not yet, ask me about the six hours first';
    var go = el('button', 'btn btn--ghost', 'Send it back');
    go.type = 'button';
    wrap.appendChild(label);
    wrap.appendChild(why);
    wrap.appendChild(go);
    current.actions.replaceWith(wrap);
    current.actions = wrap;
    why.focus();
    function send() { decide('returned', why.value.trim()); }
    go.addEventListener('click', send);
    why.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  }

  function decide(verdict, note) {
    if (!current || current.decided) return;
    current.decided = true;
    var c = current;
    var ready = c.hash ? Promise.resolve(c.hash) : W.sha256Hex(W.canonical(c.proposal));
    ready.then(function (proposalHash) {
      var record = {
        kind: 'witness',
        n: ledger.length + 1,
        verdict: verdict,
        by: 'you',
        emissary: c.proposal.emissary,
        intent: c.proposal.intent,
        note: note,
        proposal: proposalHash,
        previous: head(),
        at: new Date().toISOString()
      };
      return W.sha256Hex(W.canonical(record)).then(function (witness) {
        ledger.push({ record: record, witness: witness });
        renderLedger();
        c.actions.remove();
        if (verdict === 'sealed') {
          var stamp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          stamp.setAttribute('viewBox', '0 0 100 100');
          stamp.setAttribute('class', 'stamp');
          stamp.setAttribute('aria-hidden', 'true');
          stamp.innerHTML = '<path d="M50 6c9 0 11 5 18 6s12 6 13 13 5 11 5 18-5 11-5 18-6 12-13 13-9 6-18 6-11-5-18-6-12-6-13-13-5-11-5-18 5-11 5-18 6-12 13-13 9-6 18-6z" fill="#9c3550" stroke="#221d2e" stroke-width="2"/>' +
            '<circle cx="50" cy="50" r="27" fill="none" stroke="#6d1f33" stroke-width="2.4"/>' +
            '<path d="M38 36l16 18" stroke="#fbf3df" stroke-width="3.4" stroke-linecap="round"/><path d="M52 52l6-5 10 16-5 4z" fill="#fbf3df"/>';
          c.scroll.querySelector('.scroll-seal').appendChild(stamp);
          c.scroll.querySelector('.seal-label').textContent = 'Sealed: ';
          c.scroll.querySelector('.scroll-state').textContent = 'Sealed · witnessed';
        } else {
          var mark = el('span', 'stamp stamp--returned', 'RETURNED');
          mark.setAttribute('aria-hidden', 'true');
          c.scroll.querySelector('.scroll-seal').appendChild(mark);
          c.scroll.querySelector('.seal-label').textContent = 'Fingerprint: ';
          c.scroll.querySelector('.scroll-state').textContent = 'Returned · witnessed';
        }
        var out = el('p', 'outcome' + (verdict === 'returned' ? ' is-returned' : ''));
        out.textContent = verdict === 'sealed'
          ? 'Sealed, and witnessed as №\u00a0' + record.n + '. In Sourcery, this is the moment the change would be checked, admitted and built into a working app, with this receipt attached.'
          : 'Sent back, and witnessed as №\u00a0' + record.n + '. Nothing changed, and the attempt is still on the record. No silent failure.';
        c.scroll.after(out);
        var again = el('button', 'btn btn--ghost again', 'Cast another spell');
        again.type = 'button';
        again.addEventListener('click', function () {
          stage.innerHTML = '';
          current = null;
          input.value = '';
          input.focus();
        });
        out.after(again);
      });
    });
  }

  /* ---------- The ledger ---------- */
  function renderLedger(marks) {
    list.innerHTML = '';
    if (!ledger.length) {
      list.appendChild(el('li', 'ledger-empty', 'No spells yet. The first entry will be witness №\u00a01.'));
    }
    ledger.forEach(function (entry, i) {
      var r = entry.record;
      var li = el('li', 'entry' + (marks ? (marks[i] ? ' is-ok' : ' is-broken') : ''));
      var top = el('div', 'entry-top');
      top.appendChild(el('span', 'entry-n', '№\u00a0' + r.n));
      top.appendChild(el('span', 'entry-verdict ' + (r.verdict === 'sealed' ? 'is-sealed' : 'is-returned'),
        r.verdict === 'sealed' ? 'Sealed by you' : 'Returned by you'));
      li.appendChild(top);
      li.appendChild(el('p', 'entry-words', '“' + r.intent + '”'));
      if (r.note) li.appendChild(el('p', 'entry-note', 'Note: ' + r.note));
      var dl = el('dl');
      [['proposal', W.short(r.proposal)], ['previous', r.previous === 'genesis' ? 'genesis' : W.short(r.previous)], ['witness', W.short(entry.witness)]]
        .forEach(function (pair) {
          dl.appendChild(el('dt', null, pair[0]));
          var dd = el('dd', 'hash', pair[1]);
          dl.appendChild(dd);
        });
      li.appendChild(dl);
      list.appendChild(li);
    });
    if (verifyBtn) verifyBtn.disabled = !ledger.length;
    if (tamperBtn) {
      tamperBtn.disabled = !ledger.length;
      tamperBtn.textContent = tampered ? 'Undo the tampering' : 'Try tampering with №\u00a01';
    }
  }

  function verify() {
    var checks = ledger.map(function (entry) { return W.sha256Hex(W.canonical(entry.record)); });
    Promise.all(checks).then(function (recomputed) {
      var marks = [];
      var firstBad = -1;
      for (var i = 0; i < ledger.length; i++) {
        var selfOk = recomputed[i] === ledger[i].witness;
        var linkOk = i === 0 ? ledger[i].record.previous === 'genesis' : ledger[i].record.previous === recomputed[i - 1];
        var ok = selfOk && linkOk && (firstBad === -1);
        if (!ok && firstBad === -1) firstBad = i;
        marks.push(ok);
      }
      renderLedger(marks);
      if (firstBad === -1) {
        result.className = 'ledger-result is-ok';
        result.textContent = '✓ ' + ledger.length + (ledger.length === 1 ? ' witness' : ' witnesses') + ' recomputed. The chain is intact.';
      } else {
        result.className = 'ledger-result is-bad';
        result.textContent = '✗ №\u00a0' + (firstBad + 1) + ' no longer matches its witness' +
          (ledger.length > firstBad + 1 ? ', so every entry after it has lost its footing.' : '.') + ' Rewriting history shows.';
      }
    });
  }

  function tamper() {
    if (!ledger.length) return;
    if (!tampered) {
      tampered = JSON.parse(JSON.stringify(ledger[0].record));
      ledger[0].record.intent = ledger[0].record.intent + ' (and the neighbour’s cat)';
      result.className = 'ledger-result';
      result.textContent = 'Entry №\u00a01 now reads differently, but its witness hasn’t changed. Try verifying.';
    } else {
      ledger[0].record = tampered;
      tampered = null;
      result.className = 'ledger-result';
      result.textContent = 'Tampering undone. Verify again to see the chain restored.';
    }
    renderLedger();
  }

  /* ---------- Wiring ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.replace(/\s+/g, ' ').trim();
    if (!text) {
      text = input.placeholder;
      input.value = text;
    }
    summon(text.slice(0, 160));
  });
  document.querySelectorAll('.chip[data-example]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      input.value = chip.dataset.example;
      summon(chip.dataset.example);
    });
  });
  if (verifyBtn) verifyBtn.addEventListener('click', verify);
  if (tamperBtn) tamperBtn.addEventListener('click', tamper);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('reduce');
})();
