# One authoring path

`npm run author -- request.json` invokes `author.run`. Its dispatcher, migration
correspondence, retirement plan, validation decision and clean-verification policy
are authored in [workflow.encounter](workflow.encounter). The existing Encounter
frontend compiles that source; the existing lowerer, admission checks and Temple
kernel execute it together with `algebra/authoring.process.json`. There is no
migration interpreter or second migration command.

The source is selected by `source/authoring-contract.json` and the hash-pinned
`bootstrap/frontends/authoring-workflow.json`. This is the authoring programme's
explicit effect profile, separate from the browser programme's narrower grants.
`tooling/author.mjs` supplies contained file observations, directory entries,
existing compiler/lowerer calls, file staging/CAS/rollback, process execution and
receipts. It does not compare modules, select source ownership, decide which
helpers to retire, select checks, or decide whether a candidate passed.

## Source ownership

A `worldwright/source-migration/1` request supplies an explicit `apply` boolean
and `transitions`, each with `json`, `source`, `frontend`, `beforeSha256`,
`frontendSha256` and the proposed readable `text`. The grammar is the existing
frontend; the authoring programme does not generate or parse Encounter itself.

The algebra requires the declared, unchanged JSON owner and frontend, an absent
bounded source destination, exact ordered surface-module correspondence and
equal whole-module lowering. Only then does it plan a hash-addressed predecessor
archive, source creation, JSON retirement, explicit build-manifest selections and
the authoring contract's owner bindings. Unrelated contract fields remain intact.
There is no fallback to a generated output as an authoring source.

The six retained batch-02 predecessors are replayed through this actual policy
with the actual shared compiler and lowerer in `authoring-workflow.test.mjs`.
That replay is a historical test fixture, not another ownership switch or an
independent confirmation of the original migration. Earlier batch receipts and
candidate sources retain their original claims and attribution.

## Evidence-preserving retirement

`requests/retire-helpers.json` uses the same `author.run` and transaction. The
algebra selects only top-level regular `.cjs`, `.mjs`, `.js` and `.py` helper files
in the declared `.build` directory. It plans exact UTF-8 byte archives as inactive
`.txt` evidence under `source/retired-build-helpers`, checks archive collisions and
indexes original paths and SHA-256 hashes before retiring the executables.
The native text port refuses lossy UTF-8 conversion. Symlinks and escaping paths
are refused by the host.

Logs, proposals, candidate trees and prior authoring receipts remain untouched.
`.build/authoring` remains a legitimate **output** location for new candidate
snapshots and validation logs; browser QA also writes an output receipt there.
Neither supplies functional inputs to the publication or portable tests.

## One acceptance decision

The algebra selects locked dependency installation, the normal publication build,
the declared portable tests and the full microsite presentation comparison.
The host reports command identity, exit status, errors and logs. The algebra
checks every selected result in order. An `ok` field or `PASS` text cannot authorize
a commit. No source changes commit on failure; the validated input snapshot is
compared again immediately before applying changes, with rollback on write error.

The presentation verifier imports pinned `parse5` from normal `node_modules` and
reads the declared presentation/navigation evidence without rewriting it. The
fixture reader resolves explicit owners only; the old `BATCH_PROCESS_LEG` cache
override and `DOCUMENT_PROPOSAL` test overlay have been removed. CI installs the
lockfile dependency before validation. Authoring candidates install into their
own `node_modules` with a fresh `.npm-cache` output directory.
The full check list also includes the four previously omitted test files. Their
source-capture checks use the tracked, hash-bound corpus captures rather than
assuming a surrounding grand-theory checkout. This verifies retained capture and
publication correspondence; it does not claim a new comparison to upstream
corpus bytes. The historical preservation receipt is an explicit staging input.

## Reproduce without inherited build state

Commit the intended source, then run `npm run verify:clean`. The same algebra asks
the host for a fresh archive of the clean tracked revision in an OS temporary
directory. The archive preserves tracked deployment output as evidence; only
inside that fresh directory are the explicitly selected `.build`, `node_modules`
and `dist` roots removed before checks. The user's working output is untouched.

The programme requires those roots to be absent, installs from `package-lock.json`,
rebuilds `dist`, runs the declared tests and the presentation comparison, and
writes `verification/workflow-clean-checkout.json`. Its revision, archive hash,
command results and build source hashes identify exactly what was verified.
Node, npm, Git and tar are host prerequisites. No project-local dependency cache
or ignored helper is required. The temporary checkout and logs are retained as
evidence; the tracked receipt is a follow-up record of the verified revision.

## Required authoring provenance

`worldwright/provenance-gate/1` is implemented in `workflow.encounter`. The PR
check runs the programme and runner from the trusted base revision, not the
candidate. Native Git supplies the complete, unfiltered raw change observation;
the algebra replays `source/authoring/requests/release.proposal`, checks current
predecessor hashes and authority, then matches every functional changed byte to
the planned writes. A historical receipt, its `ok` flag, or passing visual tests
cannot replace this replay. Native script changes, unowned JSON and direct edits
to generated module outputs refuse. Generated `dist/` and the three declared
assurance captures/reports are regenerated and checked by the publication job.
The main-branch job independently repeats the gate before building or observing.
The base-policy PR check must be a required branch-protection status with admin
enforcement; changing the candidate workflow cannot replace the base check.

`worldwright/source-registration/1` registers a readable `.encounter` owner.
Its frontend/profile JSON, manifest selection and owner bindings are generated
by the authoring programme. The selected ports must already exist in the build
or workshop profiles. There is no new native adapter, interpreter or raw JSON
application source. Existing declared legacy JSON owners remain editable only
through the same checked proposal route; their filename alone grants nothing.
Authoring-control maintenance is a separate explicitly authorized trust-anchor
change, not an exception an ordinary release proposal can grant itself.

`worldwright/apply-release/1` reads that same committed proposal, checks for active
helpers and derives the write flag inside the programme. The proposal stays a
read-only replay request for CI. Registration generates the Questions publication
hook and bounded diagnostic route selection, so those JSON structures are not
hand-authored application policies. The source and image-observation acceptance
rules live in `workflow.encounter` and `source/assurance/image-verification.encounter`.
The image report is a derived data output. Existing `browser.property` mechanisms
observe image completion and natural dimensions; no new JavaScript observer is
required. The image verification step is mandatory before publication.

Ordinary candidate validation uses the preceding `dist/` only as an evidence
preparation seed. It refreshes pending evidence, builds from declared owners,
refreshes exact artifact bindings, rebuilds, and checks the full test set. Seeded
bytes do not become source owners or browser passes. Clean verification removes
that seed and still rebuilds with `.build`, dependencies and output absent.
