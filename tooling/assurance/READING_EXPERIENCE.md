# Reading experience and plain-language assurance

The domain policy is `algebra/reading-experience.process.json`. Scope, selectors,
viewports, input sequences and review prompts are authored in
`source/assurance/reading-experience.json`. The assessor lowers and admits the
policy against the existing kernel profile and workshop computational grants.
No kernel, native permission or execution-budget extension is required.

The DOM observer supplies computed paint ancestry, rectangles and native
keyboard-event observations. It contains no contrast thresholds or assessment
verdicts. The Linux CI transport executes the admitted plan in an isolated
Chromium profile; it refuses to control a desktop browser. The first pass uses
the declared reduced-motion media setting for stable captures. Screenshots and raw
observations accompany each CI run as an artifact. Its single run is one
evidence family, regardless of the number of repeated measurements.

The initial scope covers twenty reader routes at desktop, 200%-equivalent and
400%-equivalent CSS widths, plus a text-spacing override. Reflow equivalence
does not claim to exercise browser-toolbar zoom. Contrast is calculated only
for supported opaque sRGB paint stacks. Imagery, transparency, blending and
filters remain review work. Keyboard input follows skip links, home returns,
four Questions entrances and an atlas-place link; focus visibility and hit-test
observations remain bounded measures rather than accessibility certification.
Keyboard journeys use the first declared desktop viewport; its observed size
is retained in each journey. These checks do not evaluate animation behaviour.
The spacing profile also checks the computed line height, letter spacing, word
spacing and paragraph gap; an inserted stylesheet alone is not sufficient.
Native media controls, textless hosts and visually hidden inputs remain review
work. Repeated identical host observations are grouped. Attributed edge cases
from the first CI run are retained under `fixtures/first-browser-edge-cases.json`.

Missing browser evidence is a release gate in this first rollout. Observed
failures remain published triage work, alongside review candidates; they are
never converted into passes. `experience.gate` owns that rollout policy.

Plain-language review scans the first twelve non-code prose blocks and forty
main-content link labels of every generated HTML route. Specialist terms,
sentence length and vague labels are prompts, not a readability grade. A dated
reader paraphrase, reviewer, method and current document hash form a separate
review receipt. Receipt metadata does not authenticate a reviewer or certify
understanding. Zero automatic prompts cannot promote human comprehension.

## Reproduction

```text
node tooling/assess-reading-experience.mjs
node tooling/assess-reading-contrast.mjs
node bootstrap/run.cjs . dist bootstrap/site.json
node tooling/assess-reading-experience.mjs
node tooling/assess-reading-contrast.mjs
node bootstrap/run.cjs . dist bootstrap/site.json
node --test reading-experience.test.mjs
```

The first build after adding or changing a page establishes the new artifact
inventory. Replaying the assessors then binds the final source evidence to it.
In Linux CI, `run-reading-browser-ci.mjs` captures real browser observations
between the initial and final build. Dynamic evidence lives in JSON; report
page HTML and the report runtime stay stable through this binding cycle.

The published reports include source-document hashes, browser/plan/observer
identity and the raw observation path. Those bindings establish consistency;
they do not independently authenticate an observation's origin. The CI run,
artifact and recorded commit provide the accompanying execution provenance.

Verification and publishing are separate workflow jobs. Retrying a failed
Pages deployment reuses the exact artifact named by the successful verification
job rather than rebuilding an unverified replacement.
