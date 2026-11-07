# Aaron Alderman

[aaronalderman.com](https://aaronalderman.com/) contains illustrated encounters, four identity perspectives, Questions, reading paths, an atlas, project introductions and source inspection. Interactive pages run admitted Temple process algebra. Canonical reading pages work without JavaScript.

## Build and verify

CI uses Node.js 22 and the dependencies declared in `package-lock.json`.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm test
npm run verify:presentation
npm run dev
```

`npm test` delegates to `test:portable`, the suite also used by CI. The development server serves `dist/` at `http://127.0.0.1:4186`; `WORLDWRIGHT_ROOT` and `WORLDWRIGHT_PORT` override its directory and port. Edit source owners and rebuild. `dist/` is generated output.

For browser checks, start the server with `WORLDWRIGHT_PORT=4194` and an isolated Chromium profile with remote debugging on `127.0.0.1:9229`, then run `npm run test:browser`. `READER_TEST_BASE_URL` and `READER_BROWSER_DEBUG_URL` override those endpoints. The driver closes its tab and writes `.build/reader-workshop-browser-qa.json`.

`npm run verify:clean` verifies a clean committed revision in an isolated checkout, installing its declared dependencies and rebuilding without inherited output. [The Pages workflow](.github/workflows/pages.yml) installs, builds and checks pushes to `main` before publishing. `dist/build-receipt.json` records source/artifact hashes, grants, admission results and execution steps. Test counts belong to run receipts.

## Source ownership

| Area | Owners |
| --- | --- |
| Identity, encounter narratives, source notes, routes and metadata | `source/expedition.rel`, `source/presentation.rel`, `source/social-sharing.rel`, `algebra/publication.process.json` |
| Homepage catalogue, purpose types, entrances and source inspection | `source/hierarchy.json`, `source/hierarchy.rel`, `source/hierarchy-evidence.json`, `algebra/hierarchy.process.json` |
| Identity Questions, Threads, Maps and destination relationships | `source/questions.rel`, `source/hierarchy.json`, `algebra/hierarchy.process.json`, `algebra/publication.process.json` |
| Corpus reading paths | `source/gateway.rel`, `source/gateway-presentation.rel`, `algebra/gateway.process.json` |
| Illustrated atlas and visit storage | `source/atlas.rel`, `algebra/atlas.process.json`, `algebra/atlas-journey.process.json` |
| Reader, activities and household examples | `source/reader/`, `algebra/reader-navigation.process.json`, `algebra/reader-models.process.json`, `algebra/reader-activities.process.json` |
| Workshop | `source/workshop/`, `source/encounter/example.json`, `algebra/workshop-session.process.json`, `algebra/workshop-lab.process.json` |
| Reader/workshop publication | `algebra/reader-workshop-publication.process.json` |
| Project-specific demos, readable processes and presentation | The REL/JSON and Encounter sources explicitly selected by `bootstrap/site.json` |
| CSS catalogue, compatibility styles and inline artwork bindings | `source/stylesheets/contract.json`, its selected JSON trees, `algebra/stylesheet.process.json` |

The CSS catalogue is the single owner of reader/compatibility stylesheet routing and inline binding selection. Main and project styles use their REL/process projections. Reader and compatibility styles use structured CSS trees; empty formatting is omitted. The algebra renders inline bindings and HTML-escapes their attributes before creating the runtime snapshot. Captured CSS is comparison evidence, excluded from active build inputs. Shared stylesheet changes also require updating `site.stylesheetVersion` in `source/expedition.rel`.

The homepage separates editorial purpose from availability. `frontdoors.home` delegates to `hierarchy.home`; `frontdoors.capabilities` composes standalone introductions. Inspect pages show exact selected snapshots, hashes and original line bindings. Shared edges come only from explicit `dependsOn` and `pack` declarations. Upstream synchronization is manual.

Source highlighting, listings and bounded Markdown preview are authored in `source/encounter/source-algebra.encounter`. The manifest selects its frontend and generated output. Generated process JSON is not an additional editable owner. Compiler profiles, pinned bootstrap inputs and correspondence fixtures live under `source/process-authoring/`.

The reader projects canonical encounter pages. Algebra owns navigation, visits, filters, dialogs, motion choices and activity calculations. The workshop uses `ec.prepare`, `ec.run` and `ec.patch` for checked edits, with tab-local revisions, inspection, receipts and script-free previews. Its changes reset on reload. The atlas stores a bounded place-ID list under `worldwright.atlas.seen.v1`; blocked storage is disclosed and does not stop navigation.

## Author a change

[source/authoring-contract.json](source/authoring-contract.json) declares editable paths, selected process frontends and validation checks. Submit complete UTF-8 replacements with current SHA-256 hashes:

```json
{
  "protocol": "worldwright/authoring-proposal/1",
  "apply": false,
  "changes": [{
    "file": "source/front-doors.rel",
    "beforeSha256": "<SHA-256 of the file's current bytes>",
    "text": "<complete replacement document>"
  }]
}
```

Run `npm run author -- proposal.json`. A preview stages sources, installs dependencies, builds, runs checks and returns a receipt. Set `apply` to `true` to stage and validate again before writing. The policy refuses stale hashes, duplicate targets, no-ops and edits outside its authority. The host compares validated inputs before writing and rolls back completed writes if a write fails. Rebuild after applying. Authoring does not commit or deploy.

`source/authoring/workflow.encounter` and `algebra/authoring.process.json` own policy; `tooling/author.mjs` supplies generic file and process mechanisms. Native mechanisms, admission/lowering definitions, evidence contracts and comparison fixtures require explicit maintenance outside ordinary authoring grants.

## Execution and evidence

`bootstrap/site.json` selects modules, frontends and admission policy. Generic JavaScript in `bootstrap/` supplies the kernel and browser/file mechanisms. Algebra supplies application rules, transformations and rendering plans. [source/publication-contract.json](source/publication-contract.json) pins native mechanisms and their receipts. The build limit is 20,000,000 steps.

`retained/` contains comparison fixtures and passive resources; its application JavaScript is excluded from build execution and publication. `source/authoring-predecessors/` contains inert generator captures indexed by hash. These bytes are evidence, not authoring paths.

Tests verify models, checked edits, source fidelity, reproducible output, CSS ownership and complete browser-bundle envelopes. The browser audit checks HTML/SVG execution surfaces and reader/workshop interactions. Receipts in `verification/` identify their exact source version and scope. They are engineering evidence, not independent or scientific validation.

Repository care: [licensing](LICENSE.md), [Christian stewardship covenant](CHRISTIAN_STEWARDSHIP_COVENANT.md), and [source/evidence hygiene](STEWARDSHIP.md).

## The Field article

[Can power leave room for correction?](https://aaronalderman.com/the-field/correction/) is a sectioned long-form inquiry with optional mathematics, a synthetic intervention comparison and a bounded methods note and selected-result table. `source/the-field/correction-article.json` owns its prose and semantic blocks. `hierarchy.correctionArticle.build` in `algebra/hierarchy.process.json` projects the reading page through the existing HTML algebra; `source/stylesheets/field-correction.json` owns the stylesheet through the existing CSS catalogue. The main Field page and catalogue link to it, and its canonical URL is registered for the sitemap. Artwork provenance is in `source/the-field/correction-artwork.json`.
