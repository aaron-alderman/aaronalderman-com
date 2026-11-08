# Common projection boundary

The operative definition is
[`source/projection/definition.encounter`](../source/projection/definition.encounter),
pinned by `bootstrap/foundation.rel`. Application components produce a closed
tree, the definition renders it, and a private host instance records the exact
issued bytes. HTML, CSS and generated XML/SVG cannot cross the output boundary
using a serialized receipt, a caller-supplied issuer flag, or altered bytes.

The same definition runs in the browser. Markup insertion and frame adoption
require issuance from that browser runtime's instance. Classes and attributes
must belong to the common contract; CSS layout updates use declared slots.
Writing a style element requires a stylesheet issued by the same owner.

## Source and authority

| Layer | Owner | Authority |
| --- | --- | --- |
| Reading content and components | `source/reading-palette/`, `source/father/growing-up/` | Typed content and composition; cannot issue artifact identities. |
| Site, map, tool and source components | Encounter page-family builders | Produce the same element/fragment tree. |
| Tokens, style rules and captured stylesheet data | Declared REL sources and their lowering adapters | Produce the same closed stylesheet tree; no alternate CSS emitter. |
| Registered workshop component | `source/projection/components.rel` | Pins a pure Encounter component and entry by exact hash. The actual compiler hydrates and admits it before common projection; the original HTML is comparison evidence only. |
| Projection grammar, HTML/CSS rendering and output rules | Pinned `source/projection/definition.encounter` | The single operative projection definition. |
| Issuance transport | `bootstrap/projection-transport.cjs` | Private instance-owned identity bookkeeping and hashing; no application renderer or policy. |
| Publication and DOM effects | Generic host and browser mechanisms | Apply Encounter admission decisions before an effect. |

Reading layouts remain reading layouts. Maps, mathematical articles, SVG art,
interactive readers and specialist tools retain their own registered component
families. Their source adapters lower into the common tree; they do not confer
publication or DOM authority.

Document and sitemap declarations are emitted by the common definition itself.
Page builders do not prepend or rewrite serialized markup. Identity rebasing,
return links and runtime integrity attributes are structured tree transforms.
Reader and workshop shells are pure Encounter components, hydrated and admitted by the same
compiler before projection; nested work shares the caller's execution budget.
Identity catalogue fragments and activity components reach browser bundles as trees. Fetched reader fragments enter as inert DOM observations, hydrate into REL and use that same definition. Their 50 fixed layout
bindings become shared CSS classes.

## Checks and evidence

`node bootstrap/test.cjs test.projection` exercises the real
Encounter policy and the host's actual issuance transport, including the
previously accepted passive-custom-markup counterexample. It checks forged
claims, foreign instances, changed output, wrong artifact kinds, unknown page
families, undeclared attributes/classes, raw CSS injection and dynamic layout
effects before a DOM setter.

The execution receipt records `projectedArtifacts` with artifact, tree and
policy identities. Those records describe a completed run; they cannot be
replayed as an issuance capability. The explicit native trust root remains
Node and the captured-byte launcher/loader.

Release qualification additionally requires a completed fresh canonical build,
content/route/asset preservation checks, the foundation and source-policy tests,
and actual rendered browser review. A passing unit test or this document alone
does not establish corpus-wide migration or visual correctness.

The pre-migration [projection-path audit](PROJECTION-PATH-AUDIT.md) and its REL
counterexample remain historical evidence. Final migration and visual receipts
must identify the completed output and their precise coverage.

The earlier [closure receipt](common-projection-closure.rel) retains its 310-page
scope. The [preserved-live release record](live-migration-release.md) describes
the 322-page successor, browser corrections and publication control transition.
Declared SVG source assets are opaque graphics: their bytes and safe image
structure are checked separately; they cannot issue markup or DOM capabilities.
