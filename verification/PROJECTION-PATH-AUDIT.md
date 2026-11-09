# Projection path audit

This is a historical pre-repair observation. The counterexample, findings and
commands below describe that saved run, not current policy. The retired native
reproducer's hash is in `encounter-test-migration.rel`. Current checks are
Encounter programmes: `node bootstrap/test.cjs test.projection test.publication`.
They assert refusal and use the canonical declaration without an output override.

The local website does **not** yet have an exclusive, corpus-wide palette
projection grammar. The reading palette is a shared component owner for its
reading pages. It is not the type system for every published page.

This review concerns the website application, not the scientific corpus, other
Git worktrees, or the live deployment. It makes no new visual-QA claim.

## What is common, and what remains open

| Boundary | Observed implementation | Finding |
| --- | --- | --- |
| Execution authority | `bootstrap/launch.cjs`, the declaration in `bootstrap/publication.rel`, Encounter hydration/linking/admission and opaque execution handles | The official local publication path. This audit does not establish universal non-bypass of the native trust root. |
| Final markup safety | `source/foundation/surface.encounter`, invoked by the host | Checks executable elements, attributes, URLs and issued runtime identities. It does not require palette components. |
| Reading content types | `source/reading-palette/composition.encounter`, process `reading.check` | Deliberately checks the `grow.` namespace and instances of declared palette types. Other corpus types are explicitly outside this check. |
| Document composition | `algebra/publication/publication.document.encounter` | Shared shell for reading and several other page families; not the sole document composer. |
| HTML serialization | `algebra/html/html.serialize.encounter` and `algebra/publication/publication.serialize.encounter` | Two selected recursive serializers accept generic tag/attribute trees. Neither requires a palette component constructor. |
| Reader/workshop composition | `algebra/reader-workshop-publication/readerworkshop.build.encounter` | Reads three HTML templates and writes projected documents. This is an alternate composition route inside official admission. |
| Identity projections | `algebra/publication/identity.journeys.build.encounter` | Rebases and rewrites rendered HTML, including inserting serialized context into an existing main element. |
| Styles | `algebra/publication/publication.styles.encounter` | Combines general `StyleRule` facts, identity rules, scroll rules, reading rules and motion CSS. Sharing this renderer does not close the set of styles or components. |

These are alternate ways of expressing a projection **within** the admitted
publication. They are not evidence of a second executable admission authority.
Specialist interfaces need their own components; they still need an explicit
relationship to a common projection definition if that definition is to be
exclusive.

## Reproduce the counterexample

The retired read-only [audit record](projection-path-audit-before.rel) checks the named build's HTML
artifact hashes against its execution receipt, counts reading-room markers,
lists selected module call sites and hashes the relevant owners. It also asks
the actual Encounter-owned final surface policy to admit a document with an
arbitrary class, inline CSS and a style block outside the palette. The policy
accepts it. An event-handler control is refused by the same policy.

That is a counterexample to palette enforcement at the final surface boundary,
not an attempt to publish the probe and not proof that every other boundary is
bypassable. A `data-reading-room` marker is an inventory signal, not evidence
that every descendant was constructed by the palette.

```text
node verification/projection-path-audit.cjs --summary --output=.local-palette-spacing-03
node verification/projection-path-audit.cjs --require-closed --output=.local-palette-spacing-03
```

The second command intentionally exits with status 1. A successful safety check
must not silently become a claim of closed design projection. The saved
[REL observation](projection-path-audit.rel) names the exact output, receipt,
hashes, source drift and whether the evidence matches the current selection.
An explicit output option is necessary when another task has selected an
unfinished build. The audit never silently substitutes an older build.

The saved observation verified all 310 HTML artifact hashes in
`.local-palette-spacing-03`: 11 routes have a reading-room marker and 299 do not.
It recorded 99 changed or moved receipt input paths during concurrent retention
cleanup, and a different selected output, `.local-retention-closed-01`. Those
facts prevent this snapshot from certifying the newly selected build. The
custom-projection acceptance and event-handler refusal probes both completed.

## What exclusive projection would require

1. Define a common typed projection contract, with named page/component families
   for reading, navigation, specialist tools and retained material. Share tokens,
   spacing and chrome through those definitions; do not force tools into an
   article layout.
2. Make the allowed constructors the application-facing expression path. Keep
   generic tag trees, serialization and CSS emission private to that owner.
3. Migrate template reads and rendered-HTML rewriting to those constructors, or
   declare bounded retained surfaces with explicit ownership. An exception is
   still an alternate path until it is represented and checked in the contract.
4. Enforce the contract at admission and final artifact acceptance. A new
   catalogue, import convention or stylesheet alone cannot enforce exclusivity.
5. Add refusal cases for unknown components, raw HTML/CSS, undeclared page
   families and direct output writes. Then preserve all routes/content and
   visually review migrated families at desktop and phone widths.

No renderer or admission policy was changed by this audit. The architectural
gap remains open; the existing reading-page visual review retains its narrower
scope in [the full-page receipt](palette-full-page-review.rel).
