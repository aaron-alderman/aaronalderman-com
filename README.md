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

`algebra/encounter-demo.process.json` owns the events, transitions, inspection choices and projections. `algebra/encounter.process.json` composes the page and admitted browser runtime through the main publication algebra. The three `encounter-code-*` modules are exact copies of the retained Encounter engine. No new interpreter, editor, native port implementation or execution-budget extension is introduced. `source/encounter/reuse.json` records reuse origins and hashes.

Inspect exposes the Encounter definition, current session facts, closed type contracts, change process and inspector's own process. Shared `source.lex`, `sp.present`, `sp.listing`, HTML and CSS algebras provide highlighting and readable process listings. The digest identifies the displayed text; definitions are not execution traces. Raw authoritative sources are linked below the inspector.

Encounter’s page, demo, source facts and presentation JSON are authored directly through the algebra-governed proposal path below. No JavaScript generator owns or regenerates them. `node --test encounter-microsite.test.mjs` checks admission, contract-routed edits, refusals, source fidelity, highlighting, self-inspection and reset, and pins the reused engine and unchanged kernel budget.

“Inside the mind of a modern-day sourcerer.” A static personal site at https://aaronalderman.com/, with Worldwright credited as its supporting platform.

The current publication is owned by source/expedition.rel (identity, readings, sources, routes and compatibility aliases), source/presentation.rel (colour, layout, responsive rules and finite motion), and algebra/publication.process.json (page compilation, metadata, navigation and output policy). Edit these owners; dist/ is disposable output.

The corpus gate at /gate.html connects the personal expedition to the separately published research library. Its seven doors, descriptions and destinations belong to source/gateway.rel; its presentation belongs to source/gateway-presentation.rel; algebra/gateway.process.json compiles it through the shared document projection. source/gateway-provenance.json preserves Aaron’s exact supplied names, the evidence used and the distinction between established project framing and provisional reading paths for Kingdom, The Field and World. The gate links the existing public corpus; it does not claim to synchronize that publication with this checkout.

npm run build compiles forty encounter pages and the homepage through the existing Temple lowering, admission, fact-index and HTML/CSS algebras. bootstrap/ retains the Temple seed and execution budget. Explicit native successors and their predecessors are recorded in source/publication-contract.json; the atlas adds only three generic localStorage text operations. The build receipt records source/artifact hashes, admission passes and actual step use against the unchanged 20,000,000-step limit. It is a build receipt, not scientific validation.

The original reader, interactive examples and workshop remain byte-pinned compatibility inputs under retained/. The new reader embeds their examples through a separate, algebra-generated activity document. The original full reader is available at /reader.html. Existing workshop, library and module URLs remain exact-byte aliases. This is a bounded publication migration; it does not claim all legacy JavaScript is algebra-authored or that the broader authoring reconstitution is complete. Reading and navigation work without JavaScript. The atlas adds an admitted browser runtime for remembered visits and mobile previews.

Each encounter has server-visible title/description, canonical URL, Open Graph and Twitter large-image metadata. sitemap.xml and robots.txt are compiled by the same algebra. The landscape is decorative, imagined artwork; research and personal-account scope remain in the readings and source notes. Artwork provenance and the exact generation prompt are in source/artwork-provenance.json.

GitHub Pages runs the algebra build and portable checks in .github/workflows/pages.yml, then publishes dist/. node --test reading.test.mjs publication.test.mjs algebra-publication.test.mjs checks the portable publication, unchanged mechanisms, links, metadata, retained bytes and reproducibility. npm test also checks the scientific examples and workshop against the surrounding research checkout. node serve.mjs previews the compiled site locally.

source/publication-contract.json records the reason, target, goal, ownership boundaries and original compatibility/native hashes. Research source snapshots remain byte-identical to the prior public edition.

The independent /atlas.html has forty native place links over the illustrated map. algebra/atlas.process.json owns the document; source/atlas.rel owns positions, presentation and finite motion; algebra/atlas-journey.process.json owns preview events, visit validation, storage, seen labels and reset. Destination pages mark themselves on load, including direct links. Only worldwright.atlas.seen.v1 is written or removed; the newline-separated list is bounded and filtered against known place IDs. No analytics or network service is involved. Blocked storage is nonfatal and disclosed in the interface. The browser runtime uses a separate 2,000,000-step event budget, within the existing build limit. atlas-journey.test.mjs checks the compiled algebra, including repeat visits, invalid saved text, failure handling, mobile preview and reset isolation.
