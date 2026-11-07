# Reading component contrast

The source policy lives in `assurance.contrast.*` in
`algebra/publication.process.json`. The offline helper supplies file IO,
admission and numeric effects already granted to the workshop; it does not
choose the assessment verdict.

`contrast-baseline.json` freezes the authored inputs from the reported
dark-on-dark regression. Do not overwrite it. `contrast-evidence.json`
contains the admitted policy, current inputs and replayed before/after results.
The publication refuses stale source inputs or policy and requires no failing
or unresolved source pairings in this bounded component contract.

Regenerate after an intentional source or policy change:

```text
node tooling/assess-reading-contrast.mjs
node bootstrap/run.cjs . dist bootstrap/site.json
node tooling/assess-reading-contrast.mjs
node bootstrap/run.cjs . dist bootstrap/site.json
node tooling/assess-reading-contrast.mjs --check
node --test reading-contrast.test.mjs
```

The second replay binds evidence currentness to the newly generated artifacts.
Evidence JSON is excluded from its own artifact-hash inputs. The portable suite
independently compares stored inputs and currentness against actual generated
bytes and replays the arithmetic, original failure and current source result.

The contract covers exact authored selector branches and opaque reading palette
pairs for mastheads, footers and essay title surfaces. Palette declarations must
match the room metadata. It is not a general cascade interpreter: media rules,
gradients, interaction states, other templates and computed browser colours
require additional observation. The 4.5:1 threshold protects the small supporting
text within these components; pass decisions use the unrounded ratio.
Replay comparisons allow at most 1e-12 difference in the reported ratio for
cross-engine floating-point arithmetic. Thresholds, verdicts, source colour
pairs and every other evidence field must agree exactly.

The previous browser observer measured geometry, not colours. Its snapshots,
original artifact bindings and geometry-policy replay remain unchanged.
Changed shared dependencies conservatively invalidate current geometry claims
across the inventory. Historical findings stay visible; they do not establish
current visual verification. Fresh browser colour evidence remains pending.
