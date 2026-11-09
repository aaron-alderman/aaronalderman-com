# Compiler and admission source boundary

The operative application path is actual Encounter text → Encounter compiler
→ emitted typed REL → REL decode → Encounter linking/lowering/admission →
an opaque, instance-owned execution handle. Displayed source models, REL
receipts and caller-supplied objects cannot be imported as those handles.

## What is written in Encounter

| Responsibility | Actual source |
| --- | --- |
| Grammar, lexer, indentation, expressions, statements, names and source ranges | `source/foundation/compiler/entry.encounter` and the nineteen compiler programmes beside it |
| Derived operation lowering and hygienic names | Seven programmes in `algebra/lowering/` |
| Operative lowering laws and admission schema, each hydrated into REL | `source/foundation/laws.encounter` and `schema.encounter` |
| Core expression, statement and binding validation | `algebra/admission/admit.binding.encounter`, `admit.expression.encounter`, `admit.programme.encounter`, `admit.model.encounter` |
| Source guards, complete effect checks, child grant ceiling | `source/foundation/admission.encounter` |
| Duplicate definitions, selected roots and dependency closure | `source/foundation/link.encounter` |
| Source identity, actual REL hydration, profiles, bindings, child entry checks, execution limits and regex budgets | `source/foundation/boundary.encounter` |
| HTML/XML/DOM permissions, URLs, frames, refreshes and issued script identities | `source/foundation/surface.encounter` |
| Local declaration, paths, input/output types, static references, runtime selection and static fact ownership | `source/foundation/host.encounter` |
| Existing website composition, inspection projections and application behaviour | The Encounter files selected by `bootstrap/publication.rel` |

`bootstrap/foundation.rel` declares and hashes every compiler/policy source.
The operative lowering laws and admission schema are produced by Encounter,
then actually encoded and decoded as REL. The retained REL tables remain
display/application data and correspondence oracles; the policy bootstrap does
not read them. Existing application inspection REL is likewise readable data
with no execution authority.

## What remains native

- `temple-seed.cjs` executes the fixed primitive expression/statement instruction
  set. `seed-sync.cjs` drives the same primitives synchronously for pure source
  computations. They implement primitive execution and object-access semantics,
  not the application compiler, lowering laws or grant decisions.
- `seed-source-reader.cjs` is an explicit bootstrap-only syntax reader. It reads
  only the descriptor's pinned foundation texts in the operative path. Encounter
  then re-parses those texts, emits and decodes actual REL, links and admits the
  operative compiler image. Normal application and dynamic child source never
  use this reader. This small native reader is irreducible bootstrap trust; it
  is not being represented as Encounter code or a self-proving foundation.
- `rel-values.cjs` implements the inert typed REL codec and inspects own data
  descriptors before reading caller values. It has no programme loader.
- `source-policy-machine.cjs` supplies primitive observations, runs the declared
  source policy, checks pins and caches immutable source-checked observations.
  `encounter-source-front.cjs` keeps private identity maps, immutable images and
  execution transport. Native identity checks prevent forged/cross-instance
  handles from acquiring authority. The former native compiler/checker files
  are forwarding/read-only wrappers.
- The local host performs contained filesystem I/O, strict UTF-8 decoding,
  hashing, byte identity checks and fixed runtime packaging. The browser host
  fetches exact Encounter sources and performs the same source-policy bootstrap.
  DOM/XML/HTML parsers observe inert syntax. DOM adoption requires the private
  source-policy gate before mutation. Supported native math, canvas, media and
  other existing effects remain a fixed mechanical instruction set.
- `isolated-regexp.cjs` runs application regex requests in a fixed worker. Caller
  strings cross as structured-clone data, never worker source. Encounter sets
  input limits and deadlines. Deadline faults are uncatchable by guest code.
  Pinned trusted compiler/surface programmes retain synchronous fixed-pattern
  regex observations; these are not exposed as an application bypass.
- `launch.cjs` and `native-loader.cjs` are the explicit Node bootstrap trust root.
  Basis modules are hashed from the exact captured bytes passed to `_compile`,
  with a final on-disk recheck. Node and the launcher/loader are not claimed to
  have independently certified themselves.

Root source compilation/admission and checks outside an active invocation are
bounded pure policy computations. During an invocation, all host authorization,
markup checks, runtime qualification and dynamic child compilation/admission
borrow the caller's private execution counter. Native code transports that
counter through a private gate; public hydration cannot supply an evaluator.
Actual policy calls and maximum step use are recorded as `policyChecks`.
Each execution phase also records call, shared-call and step deltas; the audit
requires every nested call to share the phase counter and its policy work to
fit within the phase's reported usage.
Immutable, exact-input hydration results may be reused after source bounds and
identity checks; a cache miss runs on the caller counter. Child images may be
reused within a dispatch after an Encounter entry check. Reuse grants no new
execution counter. The refresh grammar uses Encounter delimiter scans and only
linear fixed-pattern checks, avoiding overlapping wildcard/whitespace matching.
Call-target validation uses an existing direct query lookup in Encounter rather
than repeatedly scanning the query table. Whole-model validation still checks
every target programme. Explicit assurance composition groups preserve their
dependency order within the same 20,000,000-step ceiling.

## Audit scope

`tests/audits.encounter` exercises the actual admitted DOM and regex ports,
facts intake, forged capabilities and the current source pins. The publication
audit also checks loaded native bytes and policy identities against its receipt.
The earlier audit documents are retained as historical counterexamples.

`source-policy-audit.cjs` is now only a compatibility launcher for the Encounter
runner; it contains no scenarios or assertions.

These are same-session implementation checks. They close the reproduced gaps
within the inspected interfaces; they are not independent compiler verification,
a universal proof of no backdoors, hostile-Node/OS isolation, or a fresh rendered
browser/mobile qualification. Existing JSON HTTP wire data and primitive value
serialization have no programme authority. The worktree and output must contain
zero JSON files. No deployment is enabled by this replacement.
