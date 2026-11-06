# Aaron Alderman — a personal expedition

REL facts, process JSON and the Encounter example/presentation JSON listed in `source/authoring-contract.json` are the sole current authoring sources. The previous JavaScript generators are retired; exact bytes and hashes remain under `source/authoring-predecessors/` as inert text. There is no regeneration order or second executable owner.

Use `npm run author -- proposal.json` to propose an edit. `algebra/authoring.process.json` owns authority checks, stale-source and duplicate-target refusal, preview/apply sequencing, validation and receipt policy. `tooling/author.mjs` supplies generic file observation, isolated staging, process execution and compare-before-write mechanisms. It does not supply page composition or editorial changes. This authoring workflow grants no authority over native mechanisms or execution budgets.

A proposal is a JSON record with `protocol: "worldwright/authoring-proposal/1"`, an explicit boolean `apply`, and a nonempty `changes` array. Each change supplies `file` (an allowed canonical path), `beforeSha256` (the SHA-256 of its current bytes), and `text` (the complete replacement UTF-8 document). This supports coordinated changes to facts, presentation and process definitions without interpreting replacement text as host code. Native mechanisms, admission/lowering definitions, preserved engines, provenance contracts and legacy components are outside ordinary authoring authority.

For example, create a preview from an edited copy of a canonical source:

```js
// Save as .build/propose.mjs; run from the site directory with node .build/propose.mjs.
import fs from 'node:fs';
import crypto from 'node:crypto';
const file='source/front-doors.rel';
fs.writeFileSync('.build/proposal.json', JSON.stringify({
  protocol:'worldwright/authoring-proposal/1', apply:false,
  changes:[{file, beforeSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    text:fs.readFileSync('.build/edited-front-doors.rel','utf8')}]
}, null, 2));
```

Then run `npm run author -- .build/proposal.json`. A preview performs the real algebra build and portable publication checks in `.build/authoring/candidate-*`, leaves sources untouched, and returns the candidate and receipt paths. A failed candidate keeps its `validation.json` log and cannot reach the commit effect. To apply, set `apply` to `true` and rerun the same proposal; it is staged and validated again. The host checks the full validated input snapshot before writing, refuses concurrent authoring sessions, and restores already-written files if a write fails. Receipts identify the authoring policy, contract, predecessor/successor hashes and the validated build. This is a local transaction with rollback, not a crash-atomic multi-file filesystem transaction. After applying, run `npm run build` to refresh the local `dist/`; GitHub Pages builds committed sources itself. No deploy or commit is implicit.

The homepage separates project cards (Temple, Sourcery, Claimipedia and Worldwright) from a smaller Capabilities card grid: Encounter, Kingdom, World Modelling, Creativity and The Field. `CapabilitySet` facts and `frontdoors.home` own this second list; these REL and process definitions are the authoritative authoring sources. Encounter links to its live example at `/encounter/`; each other capability has its own microsite introduction, linking onward to existing reading paths and scenes.

Encounter's live title example uses the existing `ec.prepare`, `ec.run` and `ec.patch` contracts. The story and row inherit the source title; the web menu retains its local label. Changes last for the browser session only; Reset restores the original source.

`algebra/encounter-demo.process.json` owns the events, transitions, inspection choices and projections. `algebra/encounter.process.json` composes the page and admitted browser runtime through the main publication algebra. The three `encounter-code-*` modules are exact copies of the retained Encounter engine. The existing Encounter interpreter, type contracts and kernel budget are reused. Generic browser mechanism successors are documented in source/publication-contract.json. `source/encounter/reuse.json` records reuse origins and hashes.

Inspect exposes the Encounter definition, current session facts, closed type contracts, change process and inspector's own process. Shared `source.lex`, `sp.present`, `sp.listing`, HTML and CSS algebras provide highlighting and readable process listings. The digest identifies the displayed text; definitions are not execution traces. Raw authoritative sources are linked below the inspector.

Encounter’s page, demo, source facts and presentation JSON are authored directly through the algebra-governed proposal path below. No JavaScript generator owns or regenerates them. `node --test encounter-microsite.test.mjs` checks admission, contract-routed edits, refusals, source fidelity, highlighting, self-inspection and reset, and pins the reused engine and unchanged kernel budget.

“Inside the mind of a modern-day sourcerer.” A static personal site at https://aaronalderman.com/, with Worldwright credited as its supporting platform.

The current publication is owned by source/expedition.rel (identity, readings, sources, routes and compatibility aliases), source/presentation.rel (colour, layout, responsive rules and finite motion), and algebra/publication.process.json (page compilation, metadata, navigation and output policy). Edit these owners; dist/ is disposable output.

The corpus gate at /gate.html connects the personal expedition to the separately published research library. Its seven doors, descriptions and destinations belong to source/gateway.rel; its presentation belongs to source/gateway-presentation.rel; algebra/gateway.process.json compiles it through the shared document projection. source/gateway-provenance.json preserves Aaron’s exact supplied names, the evidence used and the distinction between established project framing and provisional reading paths for Kingdom, The Field and World. The gate links the existing public corpus; it does not claim to synchronize that publication with this checkout.

npm run build compiles forty encounter pages and the homepage through the existing Temple lowering, admission, fact-index and HTML/CSS algebras. bootstrap/ retains the Temple seed and execution budget. Explicit native successors and their predecessors are recorded in source/publication-contract.json; the atlas adds three generic localStorage text operations. The reader/workshop successor adds only generic browser and file effects; all application rules remain algebra. The build receipt records source/artifact hashes, admission passes and actual step use against the unchanged 20,000,000-step limit. It is a build receipt, not scientific validation.

The reader, all forty activities and both workshop URLs now execute admitted process algebra. Original JavaScript in retained/ is a local comparison oracle and is excluded from build execution and the published JavaScript graph. Library files, passive styles and source documents remain byte-pinned; changed entry documents and native mechanisms have explicit successors in source/publication-contract.json. Canonical reading pages continue to work without JavaScript. The reader reuses their projections rather than maintaining another narrative copy.


Reader/workshop ownership: source/reader/activities.json owns passive activity artwork and instructions; source/reader/navigation.json owns the migrated three entrances, ten regions and theme membership; source/reader/source-receipts.json retains the pinned source fingerprints. Narrative text, scope and source notes remain in source/expedition.rel. reader-navigation.process.json owns routing, visits, filtering, dialogs and motion preferences; reader-models.process.json owns the finite calculations; reader-activities.process.json owns their controls, presentation changes and animation policy. reader-workshop-publication.process.json composes and admits their bundles.

source/workshop/document.html and workshop-session.process.json own the workshop interface, tabs, source inspection, revision basis, receipts, sandboxed preview navigation and commit-after-verification policy. workshop-lab.process.json reuses the original checked edit/snapshot programmes, and source/encounter/example.json remains the canonical input. State is volatile and event dispatch remains serialized. The old worker, browser-host, engine, listing and app modules are not published. No second application interpreter or kernel-budget extension is introduced.

reader-workshop-algebra.test.mjs compares the migrated slider models, both memory trajectories, source and overlay edits, HTML, diffs and refusals against one predecessor family. Browser checks exercise the real controls and inspector; these are bounded same-run engineering checks, not independent verification or scientific evidence. source/reader/migration.json identifies the predecessor bytes and source boundaries.

`npm run test:browser` runs the checked-in browser driver against a local publication at `http://127.0.0.1:4194` and a separate disposable Chromium profile with remote debugging on `127.0.0.1:9229`. Set `WORLDWRIGHT_PORT=4194` when starting `serve.mjs`; `READER_TEST_BASE_URL` and `READER_BROWSER_DEBUG_URL` override the driver's endpoints. Use an isolated test profile. The driver creates and closes its own tab, writes `.build/reader-workshop-browser-qa.json`, and never authors application files. `source/reader/qualification.json` records the exact source hashes, reproducible build, 91 automated tests and 138 browser cases for this migration.
