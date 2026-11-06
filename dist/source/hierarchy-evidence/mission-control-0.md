# Research Control Plane Runtime v1.0

This runtime is a sidecar to the existing Claimipedia research workbench. It does not replace or mutate the upstream workbench. Its authoritative state is the append-only Research Control Plane Kernel log, with a Temple REL projection for relational inspection.

## Authority ladder

1. `OFF` — maintenance, replay and inspection only.
2. `SHADOW` — scheduler recommendations, baseline comparisons and calibration observations; no execution.
3. `SUPERVISED` — a named human may accept a decision and issue an expiring, packet-bounded capability lease.
4. `BOUNDED_AUTONOMOUS` — a named human must both enable the mode and issue a separate finite grant. A cycle can then select only an already accepted, frozen packet within the grant's stream, time, lease and failure budgets.

Modes cannot self-enable. A mode change is not a lease. A lease is not a result approval. A completed run stops in review until a named human records an outcome.

## Execution chain

`recommendation → human disposition → frozen general packet → operating mode → expiring lease or finite grant → encrypted capability custody → registered worker → transactional content-addressed artifacts → independent reviewer → named-human scientific outcome → governed reconciliation proposal`

Every link is replayed and validated. The capability token is encrypted under AES-256-GCM, bound to the lease and worker, and claimable once; the browser receives only an opaque handle and durable events persist only a token hash. Wrong-agent, wrong-token, second-claim, out-of-scope phase, expired lease, absent disposition and disabled-mode attempts are rejected.

The general compiler covers every research-inbox item. Its initial handlers inventory the frozen source snapshot, define a question and convention contract, build a MECE method/rival plan, and adjudicate readiness. They operate only on the frozen packet and local store. They cannot use the network, send messages, use credentials, purchase resources, access hardware or write upstream.

Every source is recursively scanned as untrusted data. Instruction-like content quarantines the packet, and quarantined packets cannot be leased in supervised or autonomous mode.

## Independent verification

A registered reviewer must differ from the worker. Review recomputes artifact hashes, checks source lineage, scans artifacts for untrusted instructions, validates phase and resource scope, and confirms the absence of external effects. A passing review stops at `verification-pass-awaiting-human-scientific-outcome`; it cannot manufacture a scientific verdict.

Artifacts are committed through a persistent transaction journal. Recovery verifies the bytes and hash and idempotently completes any missing artifact, execution-step or resource-usage event while the run remains valid. Missing, mismatched or incompatible state becomes a durable security finding and a human hold.

## Failure and continuation semantics

An execution failure produces four durable consequences:

1. A classified failure record.
2. An open root-cause analysis with immediate containment.
3. A typed continuation routed to literature, nursery or process assurance.
4. An evidence-linked priority change for the affected work item.

Reviewed terminal outcomes distinguish `accepted`, `rejected`, `partial`, `failed-no-continuation` and `failed-with-continuations`. A failure can therefore end locally while still creating work elsewhere in the stack.

## Streams and inboxes

The common kernel hosts eight separately governed streams: mainline research, speculative nursery, attributed claim intake, literature intelligence, mathematical verification, ansatz laboratory, process assurance and internal operations. Each has its own inbox, admission rule, promotion gate, priority ordering and terminal vocabulary. Internal operations reuses the mission kernel but has a distinct authority grammar: observation is periodic and read-only, semantic streamlining requires review, and destructive retirement or garbage collection requires exact recovery evidence and explicit authorization.

The method catalogue contains fifteen reusable physics and mathematics approaches. A live dead end should be routed through one or more of these methods before it is classified as `failed-no-continuation`.

## Literature intelligence

External sources are examined through eight mandatory angles: atomic claims, methods and assumptions, data provenance, mathematical dependencies, rivals, cross-domain consequences, negative space and replication surface. This explicitly supports the case where a paper presented as field A materially affects field B or topic C. Migration entries remain `identity-only-unfrozen` until exact source bytes, retrieval time, licence and a content hash exist.

## Meta-reflexive loop

The process monitor checks for open leases while off, missing human feedback, failures without RCA and outcome backlogs. Critical findings create process-change proposals. A proposal cannot alter the process directly; a human may accept it only for shadow testing, reject it or defer it.

## Operation

- Maintain non-executing state: `node applications/claimipedia/run-research-control-plane-runtime-maintenance.mjs`
- Run only the Internal Operations inventory/classification pass: `node applications/claimipedia/run-internal-operations-maintenance.mjs` (optionally add `--temple <temple.sqlite>`, `--lanes <registry.sqlite>` and `--full-hash` to bypass the metadata-validated semantic cache).
- Inspect and operate locally: `/research-control-plane/kernel#runtime`
- Inspect the live production state: `/research-control-plane/operations`
- Inspect structured state: `/api/research-control-plane/kernel`
- Initialize production structures safely: `node applications/claimipedia/run-research-control-plane-production.mjs --initialize`
- Run one restart-safe production cycle: `node applications/claimipedia/run-research-control-plane-production.mjs`
- Run read-only assurance: `node applications/claimipedia/research-control-plane-production-assurance.mjs`

No recurring schedule is installed by this implementation. The daemon additionally requires `RCP_DAEMON_EXPLICIT=YES`; autonomous execution also requires named `RCP_GRANT_ID` and `RCP_WORKER_ID` values. Scheduling, enabling autonomous mode and granting work remain separate explicit operator decisions.

## Honest boundary

Engineering readiness is not scientific maturity. Real use must still supply human scheduler dispositions, independent review, scientific outcomes, source-byte capture, calibration history and a deliberate service-deployment choice. These remain visible holds rather than fabricated evidence. See `RESEARCH-CONTROL-PLANE-PRODUCTION-RUNBOOK.md`.
