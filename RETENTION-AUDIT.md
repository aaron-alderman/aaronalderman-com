# Retention audit and cleanup closure — 8 November 2026

The three remaining cleanup findings are resolved: the 97 historical records
have a separate physical home under `evidence/`, the compiler diagnostic points
to the operative Encounter law source, and the series artwork has verified
original-to-derivative provenance.

`bootstrap/publication.rel` remains the sole canonical publication declaration.
Its resource `path` fields preserve the existing published/inspection names;
its `source` fields now select the physical evidence files. Generated current
inspection models remain inside the selected output. Historical data is not a
second authoring or admission path.

## Where to make each change

| Concern | Canonical owner | Comparison or generated material |
| --- | --- | --- |
| Publication resources, phases and selected output | `bootstrap/publication.rel` | Old catalogue data and execution receipts do not select the current build. |
| Controlling source boundary | `AGENTS.md` | Historical authoring contracts are attributed evidence. |
| Compiler, lowering and admission | `bootstrap/foundation.rel` and its pinned Encounter files | Old operator/process tables are display/comparison data under `evidence/`. |
| Operative derived laws | `source/foundation/laws.encounter` | `evidence/algebra/operators.expression.values.rel` is a comparison table, not the place to author laws. |
| Application behaviour | The Encounter files selected by `local.module` | Generated inspection models and runtime JavaScript belong to output. |
| Common projection | `source/projection/definition.encounter`, pinned by `bootstrap/foundation.rel` | Composition, imports and components call this owner; native code only transports its private issuance identities. |
| Homepage, territories and shared presentation | `source/expedition.rel`, `front-doors.rel`, `presentation.rel`, with selected publication programmes | Rendered HTML and old builds are not editable owners. |
| Atlas and question entrances | `source/atlas.rel`, `questions.rel`, and selected programmes/resources | Archived generators and prior HTML are not alternatives. |
| Reading room content/palettes | `source/reading/rooms.values.rel` | The standalone reading-room style copy was retired. |
| Reading styles and components | `source/reading-palette/styles.values.rel`, `components.rel`, `chrome.rel`, `spacing.rel`, `composition.encounter` | Generated stylesheets and the retired preview renderer are not owners. |
| Reading theme and guide | Selected `theme.encounter`, `index.rel`, `publication.rel`, `guide.encounter` under `source/reading-palette/` | Generated guide HTML and theme runtime are output. |
| Teenage series/article | `source/father/growing-up/series.rel`, `room-to-grow.rel`, `publication.rel` | The old standalone preview declaration was retired. |
| Other stylesheet families | `source/stylesheets/contract.values.rel` selects structured REL owners | Captured CSS remains comparison evidence. |
| Reader, activity and workshop frames | `source/projection/reader.encounter`, `workshop.encounter` and `components.rel` | Former HTML templates are comparison originals under `evidence/projection-components/`; none is a live input. |
| Retained pages and sandbox fixtures | Selected Encounter publication owners and declared passive resources | The three `retained/` HTML originals are comparison evidence; their routes now use common projection components. |
| Test scenarios and audit decisions | `verification/tests/*.encounter` | `bootstrap/test.cjs` discovers and runs admitted Source tests; native inventory tools only describe observations or delegate checks. |
| Artwork provenance | `assets/father/growing-up/provenance.rel` | Original attributed receipts and encoding verification live under `evidence/artwork/`. |
| Preview and preservation checks | The output selected by `bootstrap/publication.rel` | Neither modification time nor a directory's name selects the current publication. |

The [retention register](verification/retention-register.rel) records each
non-output file's purpose, owner, authority, disposition and observed references.
It excludes Git metadata and self-referential snapshot hashes. Existing output
directories are recorded separately with their protected purpose. References
alone are not proof of indispensability; the register does not claim a
universally smallest possible file set.

## Historical records: physically separated

All **97 records**, totalling **15,257,024 bytes**, moved without a byte change:
54 process models/maps and operator display data previously under `algebra/`,
and 43 authoring, request, migration and retirement records previously under
`source/`.

[evidence/relocations.rel](evidence/relocations.rel) records every original
logical path, new physical path, size and SHA-256. Each declared logical binding
still has exactly one physical source. The originals were removed only after
both copies matched the pre-move identity. Empty obsolete historical directories
were removed without touching current content or programme directories.

Current Encounter code is now physically separate from these records.
Historical commands, source locations and assertions inside the records retain
their original attribution and date. They do not override current instructions.
The older browser captures under `source/assurance/historical-capture/` and
other explicitly named comparison collections retain their existing evidence
roles; this move does not turn copies into independent confirmations.

## Compiler diagnostic: corrected and pinned

An actual unknown lowering operation now directs an editor to
`source/foundation/laws.encounter`, explains the foundation pin update, and
names the current foundation qualification command. The change is in
`algebra/lowering/lower.expression.encounter`; its exact new SHA-256 is pinned
in `bootstrap/foundation.rel`.

The regression test invokes the actual lowering operation and checks the
resulting diagnostic. It does not merely search source text. Compiler laws,
admission rules and the 20,000,000-step limits were not changed.

## Artwork provenance: resolved against an existing receipt

The original receipt was found at
`deliverables/growing-up-in-the-way-of-jesus/imagery-provenance.rel` in the
surrounding repository. Its PNG and served JPEG identities match the retained
files exactly. A byte-identical receipt is retained at
[evidence/artwork/imagery-provenance-20261108.rel](evidence/artwork/imagery-provenance-20261108.rel).

The canonical artwork metadata now binds the series original, served derivative,
tool/prompt attribution and receipt identity. Encoding the retained 1536×1024 PNG
with the recorded Windows JPEG codec at quality 85 reproduced the served JPEG's
exact SHA-256:

`dadc1434189cee9e4346fab2e914bfca63046f647e41aca351b5bd6ca1de23a7`.

The [encoding verification](evidence/artwork/encoding-reproduction-20261108.rel)
records that check. No image file was rewritten. Tool and prompt claims remain
attributed to the original receipt; this local reproduction verifies the
derivation, not independent authorship.

## Preserving the other chat's work

The cleanup waited until the other chat completed its spacing/footer/theme QA
turn. Its last completed `.local-palette-spacing-03` output and preview were
left intact. Its selected source state was captured before cutover.

The publication declaration differs from that state only in the 97 physical
resource aliases, the additional evidence input root, and the fresh cleanup
output selection. **1,476 other selected inputs**, including the moved records,
were checked byte-for-byte against that completed receipt. The other chat's
content, spacing, footer, wrapping and theme-control source edits were retained.

The only intentional programme-source change is the lowering diagnostic.
The foundation descriptor records its new identity; artwork metadata records
the provenance resolution. The comparison test now reads the physical evidence
table directly. No commit, push or deployment is part of this cleanup.

## Outputs, scoped holds and verification

Generated files remain under isolated `.local-*/` output roots, never selected
as authoring inputs. The cleanup uses a fresh `.local-retention-closed-01`
output. Its receipt, test results, source-policy audit and identities are
recorded in [the closure receipt](verification/retention-closure.rel).

The other chat's staging/completed outputs remain protected.
`.local-qualified-01` remains historical verification evidence. Its former
native reproducer is retired and identified in the Encounter test migration
receipt; current qualification uses `verification/tests/`. Other registered
website Git worktrees and their uncommitted changes were not altered.

`verification/tests/preservation.encounter` checks all 97 physical identities,
unique logical aliases and absence of the old files, and source-attributed
original/derivative artwork identities. `verification/tests/foundation.encounter`
checks the actual compiler diagnostic.
The full bootstrap/foundation, publication/palette and preservation checks are
complete: **62 distinct tests passed**, with three cleanup tests repeated in
the completed-output suite and counted once. The source-policy audit passed,
all **310 routes** passed preservation with no expectation amendments, and all
14 phases stayed within the unchanged limit (maximum **19,119,367 steps**).
The new receipt has zero input drift, zero JSON files and zero unshared nested
policy calls. Consult the closure receipt for the exact identities and logs.

The source inspector still has logical input/artifact names with transformed
output bytes. Those generated inspection and retained-page transformations are
confined to output; the separated historical inputs keep their original hashes.
At that cleanup cutover, three retained page/README transformations shared the
same physical input-relative and output-relative names with different bytes.
The subsequent common projection removed the HTML template inputs; the current
inventory records only one such path. Historical model inputs retain their own
physical evidence paths.
Process names are checked for unique ownership within each admitted image,
with cross-image demonstration/compiler names recorded separately.

After the cleanup build and its 62 checks completed, the other chat completed
the common-projection enforcement and Encounter test migration. Its changes
are preserved. The selected completed output is `.local-common-projection-15`;
the earlier cleanup receipt retains its original scope. The combined audit is
recorded in [verification/combined-website-audit.rel](verification/combined-website-audit.rel).

Thirteen superseded `.local-common-projection-*` staging trees (01–11, 13 and
14) were moved intact outside this worktree after reference review. Their exact
relative paths and file identities are recorded in `inventory.rel` under:

```text
C:/Users/aaron/.codex/visualizations/2026/11/08/01a1b9ac-521c-73f3-b6da-db934a1e8719/website-projection-staging/
```

Earlier receipts naming those staging paths resolve under this archive root;
their history is unchanged. Output 15 and prior qualification/visual baselines
remain intact. The archive is evidence, never a fallback publication input.

The combined audit covers all **90 distinct current checks**: 78 unaffected
checks passed in the full run, and the final affected recheck passed **12/12**.
The full runs correctly reported source changes during execution; the new
output-membership check also exposed a duplicate-counting error in its receipt
allowlist. The Encounter correction counts each recorded receipt once and
preserves the extra-file rejection case. Exact outcomes and transcript hashes
are retained in the combined receipt, without treating interrupted runs as
fully passing runs.

Final checks confirm all 310 routes, artwork/evidence identities, unchanged
phase limits, zero recorded input drift, unique selected process owners and
source/output separation. The selected output contains exactly 1,909 recorded
files, with no additional file. The worktree has zero JSON files and no `.mjs`
outside root `bootstrap/`. Later live-content migration and publishing work
remains preserved and outside this completed projection snapshot's scope.

```powershell
node verification/retention-audit.cjs --check
node bootstrap/test.cjs test.retention
node verification/site-catalogue.cjs --check
```
