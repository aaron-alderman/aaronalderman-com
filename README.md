# Aaron Alderman

For the directory map, HTML/template inventory, build-output boundaries and
cleanup archive, see [the website catalogue](WEBSITE-CATALOGUE.md). Run
`node verification/site-catalogue.cjs --summary` for a current local inventory.
The [retention audit](RETENTION-AUDIT.md) identifies each remaining file's
purpose, canonical owner and evidence role, and records the completed historical
separation, compiler diagnostic correction and artwork provenance verification.
The [combined website audit](verification/combined-website-audit.rel) records
the review after common-projection work, the fresh check run and staging archive.

Static content enters as REL. Actual Encounter source is compiled by Encounter,
hydrated into typed REL, decoded, linked, lowered and admitted by Encounter
before an opaque handle can execute it. JSON files, raw model loading and native
application preparation scripts are excluded.

The owner authorized publication and preservation of the newer live changes on
2026-11-08. GitHub Pages publishes a fresh canonical build only after the
Encounter verification gate. Archived output and retired native authoring
helpers are never deployment inputs.

The main corpus shares the pinned [common projection definition](source/projection/definition.encounter). Its 322 pages, 24 stylesheets, sitemap and three generated SVG marks use the same private issuance and admission boundary. The [earlier closure](verification/common-projection-closure.md) retains its original 310-page scope. The live design guide is `/assurance/reading-palette/`.

The current main corpus publication is selected by `bootstrap/publication.rel`.
It includes **Growing Up in the Way of Jesus** and **Room to Grow** in the existing Dad
Threads page through the shared publisher, stylesheet and sitemap. The full
build produces 322 HTML routes, preserving the 319 newer live routes and adding
the series, article and design guide. Preservation tests and the preview read
the current output from `bootstrap/publication.rel`; preservation includes all
310 reading texts and passive assets pinned before this boundary repair in
`verification/site-preservation-baseline.rel`, with the reading QA and guide changes
scoped in `verification/reading-qa-preservation-amendments.rel`,
`verification/common-projection-preservation-amendments.rel` and
`verification/live-migration-preservation-amendments.rel`.

The [boundary closure receipt](verification/source-policy-gap-closure-20261108.rel)
records the earlier canonical build, 51 passing checks, unchanged 20,000,000-step
limits and zero unshared nested policy calls across all 14 phases. Refresh
parsing and admission remain Encounter; native code transports the private
caller counter and records successful and refused policy computations.

The [series integration receipt](verification/growing-up-main-corpus.rel) records
the initial main integration and checks. The [earlier foundation qualification](verification/source-policy-qualification-20261108.rel)
retains the original 307-route preservation and source/native boundary evidence.

The [reading QA receipt](verification/reading-qa.rel) records the new series
cover and opening feature, shared light header/footer contrast corrections,
focus and navigation improvements, compressed image derivatives, 51 passing
automated checks and the source-policy audit. Rendered desktop/mobile inspection
is not claimed: the supported browser connection was unavailable.

The subsequent [alignment receipt](verification/reading-alignment.rel) records
the removal of the bespoke series layout. The series now uses the same
`gate-hero`, `faith-feature` and `identity-thread-grid` components as Dad Threads,
including their existing typography, spacing, image treatment and breakpoints.
The dedicated illustrations and shared contrast fixes remain in place.

Content owners are `source/father/growing-up/room-to-grow.rel`, `series.rel` and
`publication.rel`. `source/reading-palette/index.rel` owns the palette and style
guide; its composition is selected by the main manifest. The publisher is
`algebra/publication/reading.series.build.encounter`, which calls the existing
`publication.document`, common projection and assurance owners. The standalone
preview renderer and copied reading-room styles are archived as historical
evidence outside the worktree; see the retention audit. The guide is
at `/assurance/reading-palette/`; it is not inserted into the reader's footer.

The [palette source index](source/reading-palette/README.md) locates the
consolidated base component styles, shared additions, light chrome, content
contracts and guide route. The guide now renders live specimens through the same
article/series component owners, with actual Dad colour tokens, native
disclosures and a keyboard/resize/zoom checklist. The established 81 component
rules were moved intact; room colours and essay content retain their own source.
The [design guide receipt](verification/palette-design-guide.rel) records this
consolidation and its validation.

The latest [reading theme and visual QA receipt](verification/palette-theme-visual-qa.rel)
records real headless Chrome screenshots and interaction checks at desktop and
phone widths. The shared cross now changes the four reading colour themes on
all 11 reading pages, preserving article content and canonical metadata. Guide
swatches and colour values follow the selected theme. A shared mobile navigation
alignment issue found in the screenshots was corrected. The in-app browser bridge
remains unavailable; the headless rendering pass provides the current visual evidence.

Owner feedback exposed gaps in that initial visual pass. The corrective
[full-page review](verification/palette-full-page-review.rel) records the fixed
bottom-right cross, actual screen-reader hiding utility, restored canonical dark
footer and shared spacing corrections. The complete guide, series and articles
were scrolled through at desktop and phone widths, with expanded components and
post-theme footer states captured and inspected. This is the latest visual receipt.

## Local publication

```powershell
node bootstrap/launch.cjs bootstrap/publication.rel
node bootstrap/test.cjs
node bootstrap/serve.mjs
```

The declaration selects canonical sources and ordered bounded phases. A run
requires a fresh `.local-*` output and literal zero JSON files before and after
execution. Generated outputs, migration directories and retired dependencies
cannot become authoring inputs. Use a new isolated output name for a rerun.
The preview defaults to `http://127.0.0.1:4186`.

Every test scenario and assertion is now authored in
[`verification/tests/`](verification/tests/), compiled from Encounter, hydrated
into REL and admitted before execution. Bootstrap contains the generic runner
and mechanical adapters; it contains no JavaScript test implementation. There
are zero `.mjs` files outside bootstrap. See
[the test source and migration guide](verification/ENCOUNTER-TESTS.md) for
selection commands, predecessor identities and the current run receipt.

Fact indexing, staging, inspection, composition groups and sealing are explicit
source-bound phases. Each retains the 20,000,000-step limit. Application calls
and dynamically compiled children share their caller's counter, including child
compilation and admission, host authorization, markup checks and runtime source
qualification. Only root computations outside an active invocation start their
own bounded counters. Actual policy calls/step use are recorded in the receipt.

## Exact ownership

The grammar and compiler are in `source/foundation/compiler/`; lowering is in
`algebra/lowering/`; validation is in `algebra/admission/`. The foundation's
Encounter files own grants, child restrictions, linking, markup permissions,
local declaration/path policy, static references and regex budgets.
`bootstrap/foundation.rel` pins those sources. `laws.encounter` and
`schema.encounter` produce the operative laws and schemas through real REL
hydration. The retained REL tables are display/application data, not policy
bootstrap inputs. The former native compiler/checker files are wrappers.

The remaining native foundation is primitive execution, typed REL, hashing,
identity/capability transport, inert parsing, mechanical effects and fixed
runtime packaging. One explicitly trusted bootstrap-only syntax reader remains:
Encounter re-parses its pinned inputs, performs real REL hydration, links and
admits the operative image before application compilation. Node and the small
launcher/loader remain the bootstrap trust root. Other native basis files are
hashed from the exact bytes compiled, then rechecked before the receipt.

See the [complete ownership and trust boundary](verification/compiler-policy-boundary.md)
and [reproducible audit](verification/source-policy-audit.cjs). Self-correspondence
and passing tests are not independent verification or a universal proof of no
backdoors. The [preserved-live release record](verification/live-migration-release.md)
records the fresh browser scope, corrections, remaining qualification and
repository-control transition; earlier records keep their historical scope.

Browser runtimes fetch the exact Encounter compiler/policy and application
sources, verify identities, hydrate actual REL and admit their closures before
dispatch. DOM changes require the private source-policy gate. Only issued
runtime bytes can become script artifacts, with verified integrity attributes.
Application regex work is interruptible; deadlines are source-owned and cannot
be swallowed by guest `try/catch`. Inspection models and receipts remain data.

Historical comparison models and authoring records now live under `evidence/`,
with physical aliases selected by the sole `bootstrap/publication.rel`
declaration. Current Encounter code remains under `algebra/` and `source/`.
Former JSON sources and native preparation helpers are archived intact outside
this worktree in the local Codex visualizations directory's
`mission-compiler-retirement` folder; that archive is never an input or fallback.
Earlier audit records and browser
captures retain their historical scope; consult current source-policy receipts
for this replacement. See also [the repository boundary](AGENTS.md).
