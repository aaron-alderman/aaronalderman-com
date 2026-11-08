# Reading palette

The shared reading design system and its live design guide have one source home.
Open `/assurance/reading-palette/` in the canonical local preview.

- `styles.values.rel`: the 81 established reading component rules, moved intact
  from `source/reading/rooms.values.rel`. Page typography, feature panels, cards,
  image treatment and responsive behaviour keep their existing declarations.
- `components.rel`: shared reading additions and inspection-only swatches.
- `chrome.rel`: shared masthead, canonical dark footer, focus and navigation corrections.
- `spacing.rel`: shared card insets, guide alignment, mobile gutters and fixed-control clearance.
- `index.rel`: component index, closed content contracts, guidance and manual checks.
- `composition.encounter`: the shared article and series component owners.
- `guide.encounter`: the guide composes those same owners with real article data.
- `publication.rel`: the guide's route binding, selected by the main publisher.
- `theme.encounter`: the shared cross control and admitted browser behaviour.

The reading palette covers the four identity thread pages, their four opening
essays, the teenage series and article, and this guide (11 pages). Home, map,
question, project and retained interactive pages keep their own page families.
The reading cross cycles Christian, Dad, Sourcerer and Author colours on the
current page. It preserves article content and canonical metadata. On the guide,
swatches and displayed token values follow the selected theme.
It is fixed at bottom right, outside the masthead and footer. The live status is
screen-reader-only; the site footer retains its canonical dark presentation.

Room palettes and essay content remain in `source/reading/rooms.values.rel`;
series-specific prose and illustrations remain under `source/father/growing-up`.
The normal publisher loads `styles.values.rel` as typed REL and renders it through
the existing CSS owner. There is no separate guide theme or copied component CSS.
The superseded standalone `projection.encounter`, its preview declaration and
copied reading-room styles are archived outside the worktree. Their locations
are recorded in [the retention audit](../../RETENTION-AUDIT.md). The canonical
publisher uses the site's shared HTML and CSS owners.

Use the guide to inspect the real feature, cards, prose, source disclosure,
pause, examples, reflection and practice. The native disclosures and comparison
links support keyboard checks. Resize and zoom the browser for responsive checks;
these manual checks are not reported as passing until actually observed.

Alignment is checked against the actual canonical output with:

```text
node bootstrap/test.cjs test.reading test.preservation test.projection
```

The checks cover the shared shell and stylesheet across all five Dad comparison
pages, every base palette rule and its media context, real guide/component
equivalence, token values, absence of inline overrides and guide-only CSS scope.
The [alignment assurance](../../verification/palette-alignment-assurance.rel)
records the latest pass and its rendered-browser limitation.

The subsequent [theme and visual QA receipt](../../verification/palette-theme-visual-qa.rel)
records actual headless Chrome rendering, model-reviewed screenshots, theme
cycling and Enter/Space interaction at desktop and phone widths. It supersedes
the earlier pending visual status for that stated scope.

The corrective [full-page review](../../verification/palette-full-page-review.rel)
supersedes the earlier incomplete visual assurance for post-theme footers and
spacing. It covers full scroll-throughs, open disclosures, image-free card
insets, fixed-control geometry and footers after every theme change.

The reading palette is the reading-family facet of the pinned
[common projection definition](../projection/definition.encounter). The main
publication, specialist components and browser mounts share that owner. The
[closure receipt](../../verification/common-projection-closure.rel) indexes the
completed build and the precise preservation and rendered-browser coverage.
