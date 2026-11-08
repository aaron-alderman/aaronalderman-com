# Retained evidence

This directory holds comparison models, historical authoring/migration records
and attributed receipts. It is separate from the current Encounter programme
sources and canonical content owners. It is not an alternate authoring or
admission path.

`bootstrap/publication.rel` is the sole publication declaration. Its resource
`path` fields preserve existing published/inspection names; their `source` fields
select the physical files here. Historical strings describing old commands or
locations remain original evidence, not current instructions.

`relocations.rel` maps the 97 original relative paths to their physical evidence
locations and records their unchanged SHA-256 and byte sizes. Generated current
inspection projections remain in the selected `.local-*` output, never here.

`projection-components/` holds the three retired HTML template originals for
comparison. Current reader/activity/workshop components are Encounter under
`source/projection/`, with component registration in `components.rel`. These
HTML originals are not selected publication inputs or fallback renderers.

`artwork/imagery-provenance-20261108.rel` is a byte-identical copy of the original
series-artwork receipt in the surrounding deliverables. The canonical artwork
metadata remains `assets/father/growing-up/provenance.rel`; that metadata links
this receipt and the original-to-served image identities.

See `RETENTION-AUDIT.md` at the worktree root for ownership and verification.
