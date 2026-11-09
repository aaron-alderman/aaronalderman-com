# Website catalogue and directory map

This is the local `aaronalderman.com` publication worktree. The live deployment
is separate; local build files do not establish what is currently online.
`bootstrap/publication.rel` selects the local publication and output directory.
`AGENTS.md` controls its source boundary.

The [retention audit](RETENTION-AUDIT.md) is the detailed file-purpose and
source-of-truth review. Its [register](verification/retention-register.rel)
identifies every remaining file's owner and disposition. The 97 historical
records are now physically separated under `evidence/`; the audit records the
diagnostic correction, provenance resolution and verification results.
The [post-migration audit](verification/live-migration-audit.rel) records the
combined 322-page state and its separate, unfiltered full-suite transcript.

## Other directories with the same website

This folder is a Git worktree on `codex/scroll-mission-local`, not the Git
repository's `main` checkout. `applications/aaronalderman-site` holds that
checkout and the shared Git history. `git worktree list --porcelain` also lists
`aaronalderman-batch03-clean`, `aaronalderman-batch04`,
`aaronalderman-capability-cards`, `aaronalderman-child-publication`,
`aaronalderman-correction-article`, `aaronalderman-correction-illustrated`,
`aaronalderman-correction-release`, `aaronalderman-hierarchy`,
`aaronalderman-wordmark`, and two worktrees under `aaronalderman-site/.build/`
(`cross-alignment` and `css-ownership`).

Those are separate branch/detached workspaces, not this publication's declared
source or output directories. Their current users and uncommitted changes have
not been audited here. This audit does not alter them. The canonical release
and its publication history are recorded in `verification/live-migration-release.md`.
Do not treat `.build/` alone as
proof that a directory is disposable: two registered Git worktrees live there.

## What the completed local website contains

The completed local publication records 322 HTML routes; the selected output
and exact receipt are named in `bootstrap/publication.rel` and the route inventory. These
are local publication results, not a fresh crawl of the deployed domain.

| Route family | HTML routes | Content/function |
| --- | ---: | --- |
| `/worlds/` | 178 | The main world and reading corpus, including the Dad Threads reading series |
| `/places/` | 40 | The atlas's individual places |
| `/inspection/` | 35 | Source and programme inspection pages, including the restored Questions image inspector |
| `/assurance/` | 20 | Assurance views, reading palette, three measured reports and image diagnostics with deliberate negative controls |
| Root pages | 8 | Homepage, atlas, reading gate, reader, and Christian, software, Dad and author question entrances |
| `/writing/` | 6 | Writing pages |
| `/the-field/` | 4 | Field pages |
| `/retained/` | 4 | Retained website/workshop routes composed through the common projection |
| `/temple/`, `/sourcery/`, `/workshop/` | 6 | Two pages each, including the microsite screening rooms |
| Other named worlds/tools | 21 | Claimipedia, Worldwright, Kingdom, Encounter, simulation, mission and other landing pages |

`verification/published-routes.rel` records every route's title and SHA-256
against its named receipt. The audit can regenerate this list when the next
publication completes.

## Where to work

| Location | Purpose | Editing rule |
| --- | --- | --- |
| `source/` | REL content, presentation data, Encounter compiler/policy, browser programme sources, and attributed comparison evidence | Edit the selected owner, identified by the declaration and catalogue. This directory also contains evidence; its name alone does not confer source authority. |
| `algebra/` | Encounter publication, composition, lowering and admission programmes | Selected modules are listed in `bootstrap/publication.rel` and the pinned foundation. |
| `evidence/` | Separated historical models, authoring/migration records and artwork receipts | Static comparison/attribution data. The main declaration maps physical sources to preserved logical publication paths; this is not a second authoring path. |
| `assets/` | Original artwork, derivatives, fonts and their provenance | Preserve required originals, attribution and licenses. A derivative does not automatically replace its original. |
| `temple/`, `sourcery/` | Retained media used by the corresponding microsites | Passive publication assets, not separate application build roots. |
| `retained/` | Earlier HTML comparison originals and passive workshop material | HTML originals are evidence; current retained routes are composed by Encounter. Passive assets remain declared resources. |
| `bootstrap/` | Publication declaration, pinned foundation, generic native hosts, mechanical ports, test runner and preview server | Test scenarios and assertions belong in Encounter. Native trust and mechanisms are explicit. |
| `verification/` | Encounter tests in `tests/`, preservation pins, audit receipts and catalogue evidence | `node bootstrap/test.cjs` executes the current tests. Receipts describe the run they name. |
| `source/assurance/` | Encounter browser plan, assessment and report/image publishers, plus typed observation evidence | `experience.encounter` owns plan and assessment; `publication.encounter` owns the measured reports; `images.encounter` owns diagnostic variants. The general portfolio catalogue links to these reports without generating them. |
| `source/assurance/browser-capture.rel`, `observations/` | Bound measurement index and its 150 raw layout/keyboard records | Preserve exact hashes and original scope; recapture through the admitted Source plan when dependencies change. Expected image failures are declared fixtures, not stray broken content. |
| `tooling/` | Retained assurance material | Consult its exact catalogue role and receipt use before removal. |
| `LICENSES/`, root licenses/covenant, `CNAME`, `.nojekyll`, `.github/` | Attribution, governance, domain/publication configuration | Keep required attribution and configuration. The other chat owns current publishing workflow changes; this audit does not deploy. |
| `.local-*/` | Generated, local publication outputs or incomplete staging directories | Never edit as source. The declaration names the current output. Other directories require receipt/dependency review before retirement. |
| `bootstrap/serve.mjs` | Local static preview server | Reads the declaration's selected output by default. It does not generate the website. |

## Why HTML exists outside a build

These ten HTML files have different roles. The evidence is the last completed
publication receipt used by the catalogue, not a filename-extension exemption.

| Files | Recorded role | Disposition |
| --- | --- | --- |
| `evidence/projection-components/activity-before.html`, `reader-before.html`, `workshop.html` | Retired template comparison originals | Current components belong to `source/projection/reader.encounter` and `workshop.encounter`, indexed by `components.rel`. These originals are not publication inputs. |
| `retained/index.html`, `retained/workshop/index.html`, `retained/workshop/encounter-story.html` | Original retained-page comparison evidence, not read by the completed build | Current retained routes are composed by `algebra/reader-workshop-publication/readerworkshop.build.encounter` and `algebra/publication/publication.build.encounter`. |
| `source/microsites/temple/oracle/index.html`, `source/microsites/temple/oracle/films/index.html`, and the two equivalent `sourcery/oracle/` files | Captured comparison originals, not read by the inspected completed build | Keep attributed originals until their verification/reference dependencies are retired explicitly. They are not the current page generators. |

The generated HTML under `.local-*/` is the rendered website. The route inventory
records the exact completed output and route hashes; it includes retained pages.

## Live-content migration outputs

The declaration now selects `.local-common-projection-24`. It contains the 319
preserved live routes plus the series, article and design guide. All 322 HTML,
24 CSS, one sitemap and three generated SVG artifacts use the pinned common
projection owner. The 30 publication phases use four real admission cohorts;
their original 20,000,000-step limits and shared nested accounting remain.

After the other chat completed publication and live verification, seven
superseded migration output trees (16–21 and 23) were moved intact to:

```text
C:/Users/aaron/.codex/visualizations/2026/11/08/01a1b9ac-521c-73f3-b6da-db934a1e8719/website-live-migration-staging/
```

`inventory.rel` records the 13,891 original relative file paths, sizes and
SHA-256 values (4,216,844,314 bytes). Historical paths for those trees resolve
under that archive root. Output 22 did not exist. Output 24, the earlier
completed projection 15, and prior qualification/visual baselines remain
intact; they are separate output/evidence roots, never authoring fallbacks.

## What was cleaned on 8 November 2026

The cleanup preserved the other chat's active source edits, selected
`.local-palette-theme-02` and subsequent staging targets, and last completed
`.local-palette-theme-01` output. It did not rebuild, deploy or claim fresh
correspondence for the concurrently changing sources.

Twenty-one native generators with `.mjs.txt` suffixes were retired from
`source/authoring-predecessors/`. Their original bytes remain evidence outside
the worktree. The inspected completed execution receipt did not read them.
The historical index now lives at `evidence/source/authoring-predecessors.values.rel`,
selected through its original logical publication path. Its `archive` values name the former relative locations,
resolved under the external archive below. It is not a command to run them.
The unused `source/stylesheets/predecessors/` directory was also retired,
including an old JSON document named `activities.json.txt` and a CSS predecessor.

Six superseded output trees were relocated with their receipts and complete
contents: `.local-corpus-growing-up-01`, `.local-palette-guide-01`,
`.local-qualified-10`, `.local-qualified-11`, `.local-reading-alignment-01`,
and `.local-reading-qa-01`. Historical receipt paths in earlier audit records
now resolve under the external archive root; their recorded history is unchanged.

Archive root:

```text
C:/Users/aaron/.codex/visualizations/2026/11/08/01a1b9ac-521c-73f3-b6da-db934a1e8719/website-cleanup/
```

`inventory.rel` there records every relocated file's original relative path,
size and SHA-256. The same original relative path locates its archived copy.
`verification/site-cleanup.rel` records the disposition and verification result.
This archive is evidence, not a publication input or fallback.

`.local-qualified-01` stays as historical verification evidence. Its former
native reproducer was retired during the Encounter test migration; this does
not authorize deleting its evidence. Empty staging directories and active outputs stay
in place. Unselected files are labelled for review, not automatically discarded:
one build's unused input is not proof that a fixture, license, original or
verification source has no purpose.

## Reproduce the catalogue

From this worktree:

```powershell
node verification/site-catalogue.cjs --summary
node verification/site-catalogue.cjs --check
node verification/site-catalogue.cjs --rel
node verification/site-catalogue.cjs --routes
```

The audit only reads files and prints evidence. It never compiles application
code or changes authoring inputs. `--rel` enumerates every non-output file with
role, byte size and SHA-256, and summarizes all local output directories.
`--routes` lists HTML routes/titles/hashes against a completed execution receipt.
If the selected build is incomplete, the audit explicitly identifies a prior
completed receipt and says it does not match the selected output. Input drift
is reported, not silently accepted as a new verified build.

The checked-in `verification/site-catalogue.rel` and `published-routes.rel` are
dated snapshots, not live manifests. The catalogue excludes its own snapshot's
hash to avoid a self-reference. Refresh them only after confirming the active
publication work has settled. `--check` checks declaration targets, JSON files
and native/JSON programmes with `.txt` suffixes, including outputs; it is not a proof of the
entire source/admission boundary.

Older prose and receipts may refer to retired JSON files, `npm` commands or
native generators. Those are historical references, not current instructions.
Use the root README and declaration for current publication commands. The
completed separation is mapped in `evidence/relocations.rel`, and its exact
source/byte preservation and qualification are recorded in
`verification/retention-closure.rel`. The obsolete standalone preview and
duplicate test fact index remain in their separately recorded external archive.
