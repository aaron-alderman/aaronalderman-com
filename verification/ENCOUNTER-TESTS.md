# Encounter test source

Run the full suite from this worktree:

```powershell
node bootstrap/test.cjs
```

Arguments select process-name substrings, combined as alternatives:

```powershell
node bootstrap/test.cjs test.front test.rel test.foundation
node bootstrap/test.cjs test.projection test.surface test.audit
node bootstrap/test.cjs test.application test.browser
node bootstrap/test.cjs test.reading test.preservation test.publication
node bootstrap/test.cjs test.boundary test.retention
node bootstrap/serve.mjs
```

| Encounter source | Checks |
| --- | --- |
| `tests/front-door.encounter` | Actual hydration/admission capabilities, caller isolation, child execution, reflection, facts, snapshots, exhaustion and local declarations |
| `tests/foundation.encounter` | REL round trips and refusals, descriptors, grammar, source spans, exact foundation/application compiler correspondence, lowering and diagnostics |
| `tests/projection.encounter` | Actual issuance transport, forged/foreign/mutated bytes, structured grammar, page families, CSS source fidelity, real DOM style effects and identity metadata |
| `tests/surfaces.encounter` | Passive markup, executable HTML/SVG/XML, frame/refresh/mutation restrictions and captured-byte injection refusal |
| `tests/browser.encounter` | Real emitted browser bootstrap and worker integration, tampered source refusal, portable compiler, exact UTF-8 hashing |
| `tests/application.encounter` | All selected static browser closures and actual Encounter view/edit/refusal paths |
| `tests/reading.encounter` | Reading content, shared components, exact style-library identity, AA colour calculations, links, accessible names, guide specimens and theme controls |
| `tests/preservation.encounter` | Frozen route/text/asset comparisons, 97 evidence relocations and original/derivative artwork provenance |
| `tests/audits.encounter` | Native regex isolation, compiler/caller accounting, completed publication identities and phase budgets, common projection closure and whole-worktree file boundaries |
| `tests/helpers.encounter` | Source-owned test helpers and behavioural callbacks; no JavaScript test code is embedded |

The runner uses the existing compiler/front door: Encounter source → hydrated
typed REL → link/lower/admit → retained primitive kernel. Each test retains the
20,000,000-step limit. Ordinary assertions use Encounter's `assert`; expected
refusals compare the actual observation with Encounter-owned criteria. A failure
sets the process exit code to one. There is no skip or expected-failure facility.

`bootstrap/test-mechanisms.cjs` supplies file/byte observations, hashes, codecs,
process transport, opaque native references and function invocation. Behavioural
callbacks execute admitted Encounter programmes. It contains no scenario
dispatch, expected outcomes or assertions. The browser transport emulates the
browser APIs needed to run actual emitted production bytes; it makes no claim
of rendered-browser qualification. The portable-module import also executes
the actual production emitter's bytes, not generated JavaScript tests.

The one legacy style-library hash uses the original JSON byte codec solely as
an observation of preserved values. It creates no JSON file and conveys no
programme or publication authority. No predecessor JavaScript suite is loaded,
renamed, moved into bootstrap or saved as an executable string.

The remaining native catalogue/retention commands can print descriptive
inventories. Their `--check` launchers, and the source-policy/projection audit
compatibility launchers, delegate pass/fail checks to Encounter. Current run
output is TAP, not the retired native audits' REL report format. Historical REL
receipts and negative findings keep their original meanings.

[`encounter-test-migration.rel`](encounter-test-migration.rel) records the exact
predecessor hashes, original case titles, successor owners and the duplicate
qualification test. The retired before-repair probes intentionally expected
former vulnerabilities; their dated findings remain evidence while current
Encounter tests assert refusal. [`encounter-tests.tap`](encounter-tests.tap)
records the latest complete run. The final affected recheck is in
[`encounter-tests-final-recheck.tap`](encounter-tests-final-recheck.tap).
[`encounter-test-result.rel`](encounter-test-result.rel) records the exact source
and transcript hashes: 86/89 passed in the full run; its three publication
checks ran before the execution receipt existed. After build completion and a
mechanical file-hashing optimization, all ten affected checks passed, including
the three publication checks and source stability. The other 79 test processes
were unchanged. Counts and pass/fail claims belong to their respective runs.

Preservation and publication tests read the output selected by
`bootstrap/publication.rel`. They never substitute an earlier successful build,
refresh preservation pins or create an admission capability from a receipt.
The pre-migration native preservation test already failed during the concurrent
common-projection work. Frozen baseline files remain intact. That work adds
explicit prior/new hash amendments and a separate stylesheet-fidelity check;
their scope and identity-chain assertions are visible in Encounter.

The file boundary test scans ignored and generated directories as well as source
directories. Only the root `bootstrap/` may contain `.mjs` files. It also rejects
native test suffixes, JSON files, symbolic links and executable/JSON files hidden
behind `.txt` suffixes. Git administrative metadata is outside this inventory.
Scope is this publication worktree; other Git worktrees and the deployed site
are separate.

Each run records its loaded policy basis and canonical declaration hash. The
last test checks that its Encounter sources, pinned policy inputs and canonical
declaration have not changed during execution. It cannot silently turn a run
across changing worktrees into a stable qualification result.
