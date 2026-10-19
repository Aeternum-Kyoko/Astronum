# Astronum design reference audit

Reviewed: 18 October 2026. This is an implementation research record, not a claim that every template has been tested or that the redesign is finished.

## Coverage and evidence

Reviewed the public catalogue/navigation of all three requested libraries. Inspected selected relevant examples more deeply, distinguishing actual interactive pages from recorded previews and written specifications. No paid source, account creation, or subscription was used. Browser inspection was at the available desktop viewport; reference mobile behavior below comes from published specifications, not a real-device test.

### Scrollhaus

Sources: [catalogue](https://scrollhaus.ai/), [effects](https://scrollhaus.ai/effects/), [backgrounds](https://scrollhaus.ai/backgrounds/), [components](https://scrollhaus.ai/components/), [prompts](https://scrollhaus.ai/prompts/), [performance guide](https://scrollhaus.ai/blog/scroll-animation-performance-guide/).

The browser catalogue exposed 191 premium and 19 free website entries. Reviewed the free collection list and the broader catalogue. These counts describe the catalogue, not the number of demos tested.

| Example | Inspection performed | Finding and Astronum application |
| --- | --- | --- |
| [Vesper Atlas](https://scrollhaus.ai/sites/vesper-atlas/) | Opened working page, inspected screenshots, changed world, observed Serein → Thalassa, scrolled through the pinned opening, atlas entries and ending | A single celestial object gives the page a recognizable identity. Use a restrained celestial composition on the landing page. Keep direct navigation and a motion-pause option. Its long pinned journey should not delay access to a client's chart. |
| [Zenith](https://scrollhaus.ai/sites/zenith/) | Opened working page; compared initial and scrolled views | Atmospheric background and a compact navigation establish a memorable opening. The page is predominantly a hero composition; it provides little guidance for a dense analytical workspace. |
| [Kestrel](https://scrollhaus.ai/sites/kestrel/index.html) | Opened catalogue preview and full page; inspected lower sections; ran the signal demo and verified its completion text | Clear sections progress from context to method to a visible demonstration. Adapt that sequence to placement → relationship → timing → interpretation. Demonstrations should be explicitly labeled when illustrative. |
| [Meridian](https://scrollhaus.ai/sites/meridian/) | Opened page | Premium preview shell and upgrade link; full interactive build not inspected. |
| [Tide Oracle](https://scrollhaus.ai/sites/tide-oracle/) | Opened page and screenshot | Premium preview shell; no interactive behavior verified. Do not base implementation claims on it. |

The effects and performance material supports choosing a small number of purposeful effects and keeping essential content independent of animation. That is an implementation constraint, not evidence of measured Astronum performance.

### HeroPrompts

Source: [public library](https://heroprompts.io/browse). Read catalogue descriptions across its 52 advertised examples, then opened the following detailed pages. The inspected preview pages explicitly describe their media as recordings at 1280 × 800; those recordings are not interactive production demos.

| Example | Inspection performed | Finding and Astronum application |
| --- | --- | --- |
| [Tidemark](https://heroprompts.io/prompts/tidemark-task-planning) | Detailed specification, preview and lower-page content | Duration-scaled timeline with a clear time marker. Apply to real dasha intervals and the selected analysis date. Do not animate time forward independently of the user's date. |
| [Verity](https://heroprompts.io/prompts/verity-ai-hero) | Current browser specification and recorded preview; checked because the search-rendered page was older | Sentence-level citations connect an answer to its sources. This is the strongest interpretation-workspace reference: selecting a claim should reveal its exact chart evidence and limitations. Do not copy decorative trust meters as prediction confidence. |
| [Form Studio](https://heroprompts.io/prompts/obsidian-architecture-minimal) | Detailed specification and recorded preview | Leader lines and labeled annotations explain a visual without covering it. Apply to selected planet aspects and house ownership, with click/tap and keyboard equivalents. |
| [Cendre](https://heroprompts.io/prompts/luxury-perfume-cendre) | Current browser specification and recorded preview | Fine gold rings and staged disclosure suit the brand. Its specification changes to a static list on mobile. Adapt that principle to simplify relationships on narrow screens rather than shrinking a desktop diagram. |
| [Nexus](https://heroprompts.io/prompts/nexus-analytics-dashboard) | Text page and catalogue description only | Potential comparison-matrix reference. Not visually or interactively verified; lower priority. |

Full premium prompt bodies were not accessed. Public descriptions and preview observations are sufficient to design original implementations. In-page controls within recorded previews were not tested as if they were live controls.

### MotionPrompt

Sources: [library](https://prompt-library-lemon-omega.vercel.app/), [design tokens](https://prompt-library-lemon-omega.vercel.app/patterns). Reviewed the catalogue, inspected the Mobile filter's nine entries, and read three complete specifications using Inspect Full Details. Entry IDs below are those shown by the library; it does not expose a distinct URL for each inspected modal.

| Entry | Inspection performed | Finding and Astronum application |
| --- | --- | --- |
| Forecast Center, ID 24 | Full specification, modal layout and weather preview | Useful desktop information grouping: primary view, contextual rail, timeline. Its mobile specification reflows to a column and bottom dock. Reject its proportional absolute desktop grid for our variable-length readings. |
| F1 Racing Hub, ID 30 | Full specification | Strong separation of profile, statistics and context. It is three phone mockups, not a finished responsive application. Reject scaled inner screens, extreme type sizes and tight line heights for birth details and chart readings. |
| Travel Journal, ID 43 | Full specification | Saved-item collections and a consistent bottom navigation are relevant to saved charts and observations. Reject fixed phone framing, clipped titles and hiding scrollbars everywhere. |

Some catalogue media initially reported playback failures. Forecast Center's preview subsequently rendered. The other two were evaluated primarily from their full text specifications; this is not a claim that their mobile interactions were tested.

## Proposed design direction: a celestial study

Keep the requested blue and gold. Use the actual chart as the distinctive object inside the workspace; reserve celestial illustration for introductory pages.

Proposed tokens, to reconcile with existing theme variables before implementation:

| Role | Value | Use |
| --- | --- | --- |
| Deep blue | #0B1628 | Page canvas |
| Panel blue | #14243D | Reading and inspector surfaces |
| Warm gold | #E4C58A | Active state and selected relationship |
| Light ink | #EDF1F5 | Primary text |
| Muted ink | #AEBACB | Secondary labels |
| Teal | #73B8AA | Transit layer, always paired with a label |

Retain the existing font assets where possible. Use a restrained serif for page and chart titles, a readable sans serif for interpretation, and tabular numerals for dates/degrees. Gold should locate the selection; it should not decorate every paragraph.

## Workspace arrangement

### Personal view

Start with the user's question or life area. Show one synthesized reading, the factors supporting it, the factors complicating it, and what the selected date changes. Offer the chart evidence next to each claim. Keep detailed chart controls one deliberate step away.

```text
Person / birth details / birth-time reliability
Overview     Charts     Timing     Notes
Selected life area and selected analysis date
Main reading                 D1 / D9 context
Supporting + limiting factors
Relevant period → evidence → practical action
```

### Astrologer view

Give the chart a persistent place. Use a compact client rail, a chart canvas, and a related evidence inspector. Put dasha and transit time navigation under the chart. Selection should survive navigation between evidence, notes and timing.

```text
Client / method / birth-time reliability / analysis date
Tools     D1 or selected varga       Evidence inspector
          Optional comparison       Selected factor + relationships
          Dasha / transit timeline  Notes and observations
```

### Mobile

Use full-width content with a stable section navigation and safe-area spacing. Chart → selection → detail sheet → return to the same chart is the primary loop. Avoid nested scrolling where possible. Keep the selected chart and planet/house visible in the sheet header. Comparison should offer explicit A/B buttons and preserve both selections. Do not rely on hover or dragging as the sole input.

## Most valuable changes, in order

### 1. Claim-to-evidence navigation

Existing `EvidenceEntry.tsx` exposes a statement, observation, rule and limitation, but its source action goes to a section. Extend evidence with a typed destination: chart key, planet/house, analysis date where applicable, and evidence identifier. A claim click should select the exact source, open the inspector, and offer a return to the original reading. The new chart inspector is groundwork, not completion of this flow.

Acceptance: a D10 claim opens D10 evidence; switching to D1 cannot silently retain a D10 claim label. Empty/unsupported evidence has a plain explanation. Browser Back and keyboard focus return correctly.

### 2. Relationship highlighting

In `KundliChart.tsx`, distinguish selection, occupants, house lord and receiving aspects. Use thin directional annotations with a compact textual legend. Show only the selected relationship set. Use the same calculation source as `chartInspection.ts`; don't create separate visual-only geometry rules. Birth-time sensitivity stays attached to relevant divisional claims.

Acceptance: incoming/outgoing relationships match inspector values for all divisions; touch targets don't overlap; chart labels remain readable at 360px.

### 3. Timeline that explains the selected date

`TimingStrip.tsx` already uses real duration proportions. Build on that with a selected-date marker, previous/next boundary buttons, an explicit Today action, and a readable list alternative for narrow intervals. Link a period to the activated factors and saved observations. Distinguish broad natal periods from transit triggers.

Acceptance: selection updates all dependent readings consistently; exact period boundaries and timezone behavior remain tested; small intervals remain accessible without precision tapping.

### 4. Summary with progressive detail

Replace dense uninterrupted prose with a short conclusion and expandable support/complication evidence. Separate measured positions from traditional interpretation and practical suggestions. Show contradictory factors together. Do not present rule scores as empirical event probabilities. A polished layout cannot fix generic synthesis or unsupported claims.

Acceptance: each displayed interpretation has inspectable evidence; major limitations appear near the claim; Hindi and English receive equivalent readable structure.

### 5. A distinctive landing page

Use the Vesper/Cendre direction as inspiration for an original celestial composition with blue and restrained gold. Keep the entry form and primary action immediately available. Prefer lightweight SVG/CSS first; heavier rendering requires a measured benefit. Give motion a pause/static alternative. Avoid compulsory cinematic loading sequences before birth entry.

Acceptance: essential content renders before animation; keyboard navigation works; no layout shifts from media; low-motion and narrow-screen layouts remain complete.

## Motion policy

- Respond to a user selection with a short highlight or connector reveal.
- Do not replay the whole page entrance when changing chart or date.
- Avoid fake streaming delays for already-calculated readings.
- Use text and shape as well as color to identify layers and states.
- Keep long-form reading backgrounds still.
- Measure performance after implementation; no performance score is claimed by this audit.

## Remaining verification

This audit is a deeper, targeted review across all three libraries, not an exhaustive execution of hundreds of builds. Premium examples remain restricted. Real phone testing, reduced-motion verification, keyboard audits and performance measurements of the reference builds were not performed. Those checks belong in Astronum's implementation acceptance work.

## Implementation progress

The first workspace step is implemented locally: reading evidence has a typed chart destination, opens its selected planet or house in the mobile or desktop inspector, links to the calculation section, and returns to the originating claim. Browser Back closes the inspector. A mobile browser walkthrough and automated destination tests cover this path. Relationship annotations, selected-date timeline controls, broader summary restructuring, and the landing-page redesign remain the next stages.
