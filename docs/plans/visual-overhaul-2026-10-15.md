# Astronum — full visual overhaul plan

Date: 15 October 2026
Status: proposed implementation specification; website changes are not part of this deliverable.
Priority: Kundli first, followed by the complete public website, account flows, and administrative screens.

## 1. Design brief

Create a refined astrology product with Apple's clarity, material restraint, and attention to interaction, plus the distinctive art direction associated with ambitious Awwwards submissions. Treat award quality as a craft target, not a promised award.

The defining experience is a beautifully drawn Kundli that people can understand, explore, and return to. Everyday users receive a calm reading experience. Astrologers receive a complete analytical workspace. Both use the same birth data and calculation results.

Success means:

- A first-time visitor understands what the product offers and can create a chart immediately.
- A returning user reaches a chart, current dasha, or transit reading within two navigation actions from the result overview.
- Every existing Kundli capability has a documented destination.
- The chart, selected section, reading, analysis date, and URL agree.
- The website feels coherent across tools, editorial pages, account screens, Hindi, mobile, light mode, and dark mode.
- Visual richness does not obstruct reading, calculation, accessibility, or speed.

## 2. Audit findings and evidence limits

This plan is grounded in the repository's route inventory, global styles, Kundli navigation, chart workspace, and existing section rendering. Web references were researched for design direction. A complete rendered screenshot audit remains the first implementation milestone; this document does not claim every page has been visually inspected.

### Existing foundations to retain

- Next.js application with English and a partial Hindi route set.
- Existing light/dark theme variables and bilingual font infrastructure.
- User and astrologer modes, chart comparison, North/South Indian chart styles, transit overlays, analysis date controls, saved layouts, and chart inspection.
- Sixteen implemented divisional chart keys: D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60.
- Existing reports, lazy section loading, account/chart saving, PDF facilities, and astrology calculations.

### Problems to address

| Observation from the implementation | Design/engineering response |
| --- | --- |
| Several navigation and toolbar rows compete above content | One primary navigation system and a contextual toolbar |
| Chart selection and reading selection can be changed independently | Canonical workspace state and explicit contextual chart behavior |
| Current browser URL contains `tab=rasi` with `chartA=D9` | Reproduce as a state consistency case; chart heading and interpretation must identify the same context |
| User mode resets chart state when mode initializes | Define reload and mode-switch persistence deliberately |
| Some chart detail panels can render charts alongside the persistent chart pane | One authoritative chart canvas per task; intentional comparison only |
| Advanced sections are discoverable through multiple unrelated controls | Grouped explorer with search and stable destinations |
| Historical color variables and appended mode-specific CSS drive the redesign | Semantic tokens, scoped components, removal of superseded styles |
| Dense panels mix positions, interpretation, and controls | Summary, evidence, and detailed data presented in a clear hierarchy |
| Hindi labels and navigation require consistent treatment | Centralized labels and layout review with real Hindi content |

## 3. Reference direction

References are inspiration, not templates to copy. Proposed choices below are Astronum design decisions.

| Reference | Application to Astronum |
| --- | --- |
| [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) | Clear hierarchy, recognizable controls, predictable navigation, accessible interaction |
| [Apple materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials) | Restrained material treatment for navigation and floating controls; solid reading surfaces |
| [Apple MacBook Pro product page](https://www.apple.com/macbook-pro/) | Product-led storytelling, large focal imagery, concise chapters and clear actions |
| [Awwwards minimal website collection](https://www.awwwards.com/websites/minimal/?page=167) | Reference pool for composition, typography and restraint; select individual examples during the visual audit |
| [Awwwards art website collection](https://www.awwwards.com/websites/art/) | Reference pool for distinctive visual identity and editorial presentation |

Research limitation: direct retrieval of the Awwwards minimal collection root and a proposed Linear showcase failed. Do not treat those pages as visually reviewed or claim specific award credentials. During implementation, capture three accessible reference screens and annotate the precise spacing, composition, or motion principle being studied.

### Original signature: the celestial instrument

Develop an original SVG composition inspired by the geometry of astronomical instruments and the structure of the Kundli: fine orbital arcs, engraved degree marks, a precise central chart, and a restrained brass marker. Use it as the homepage's central object and in the Kundli introduction. Label illustrative imagery as a sample; live result charts always use calculated data.

The signature moment is an opening composition that resolves into a readable chart. Keep the results workspace quiet and immediate. Avoid making stars, gradients, glass, or perpetual motion the background of every panel.

## 4. Visual design system

### Palette

Primary public design reference: light. Respect an existing saved preference; new visitors follow system appearance. Offer System / Light / Dark. Both modes must be designed together.

| Semantic token | Light | Dark | Role |
| --- | --- | --- | --- |
| Canvas | #F5F6F8 | #101216 | Main background |
| Surface | #FFFFFF | #191C22 | Reading and chart surfaces |
| Elevated surface | #ECEFF3 | #242831 | Menus and secondary surfaces |
| Primary text | #171B24 | #F3F5F7 | Headings and body |
| Secondary text | #566170 | #ADB7C6 | Supporting information |
| Accent | #275CBA | #8AB5FF | Selection, links and primary actions |
| Instrument accent | #866321 | #D8B66D | Sparse celestial markers |
| Divider | #D7DCE4 | #353D49 | Boundaries |
| Transit | #06796D | #79D2C4 | Transit positions and legend |
| Error | #B42336 | #FF98A7 | Errors and validation |

These are initial tokens. Verify actual contrast in all foreground/background combinations before implementation sign-off. Encode state using text, shape, and icons as well as color. Gold is not the default color for every heading or action.

### Typography

- Interface and reading: retain Anek Latin and Anek Devanagari initially, with deliberate weight and spacing. Their shared family supports the bilingual identity already present in the project.
- Prototype a system sans alternative alongside Anek during the foundation milestone; choose one complete system after comparing real English and Hindi screens.
- No bundled Apple proprietary fonts. System fonts may resolve naturally on Apple devices.
- Marketing display: fluid 44–88px desktop, 36–48px mobile, weight 500–600, close but readable line height.
- Page title: 32–40px desktop, 28–32px mobile.
- Section title: 22–28px; panel title: 18–20px.
- Reading copy: 17–18px, line height 1.6, approximately 60–72 characters per line.
- Interface copy: 14–16px. Critical chart labels never depend on tiny footnotes.
- Numerical tables: tabular figures; align decimal values and units consistently.
- Give Devanagari adequate line height and vertical space; do not force Latin letter spacing onto Hindi.

### Geometry and materials

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px.
- Public content maximum: 1200–1280px. Reading column: 680–760px. Expert workspace may extend to 1600px.
- Desktop gutters 32–64px; mobile gutters 16–20px.
- Controls: 10–12px radius. Panels: 18–24px. Sheets: 24px at exposed corners. Use pills for actual segmented controls and compact status indicators.
- Use open sections and typographic hierarchy for articles; reserve cards for meaningful selectable objects or bounded tools.
- Soft elevation only for floating surfaces. Avoid stacking shadows on every nested card.
- Glass is limited to the global header, a floating contextual toolbar, and appropriate overlays. Supply solid fallbacks and a reduced-transparency preference.
- One consistent SVG icon family, consistent stroke weight, visible text labels for unfamiliar symbols.

## 5. Whole-site information architecture

Desktop header: brand, Kundli, Today, Explore, Learn, account; language and appearance in a compact utility area. Explore groups tools by task. Kundli is always directly accessible.

Mobile: compact brand/header and menu. Within Kundli, use its local navigation instead of simultaneously showing another persistent global bottom bar. Safe-area padding prevents controls covering content.

Explore groups:

- Personal charts: Kundli, matching, annual chart, rectification, Prashna.
- Daily guidance: today, horoscope, Panchang, Muhurat, festivals.
- Discovery: numerology, Lo Shu, nakshatra finder, baby names, palmistry.
- Practices and spaces: Rudraksha and Vastu.

Footer: product groups, learning, about/contact, consultation, language, and legal links. Reduce repeated promotional blocks on utility screens.

All existing URLs remain reachable. Preserve metadata, canonical URLs, sitemap behavior, internal links, and supported Hindi equivalents when restructuring presentation.

## 6. Kundli creation flow

### Entry screen

Large heading: “Your birth chart. Clearly explained.” Short supporting copy, one primary “Create your Kundli” action, and a secondary saved-chart entry when available. Show an original chart preview with restrained instrument artwork.

Desktop: introduction and preview beside the form. Mobile: concise introduction, then form; artwork must not push inputs far down the screen.

### Form design

1. Name, birth date, birth time, birthplace.
2. Place suggestions show city, region, country; selected place exposes timezone in a compact confirmation line.
3. Birth-time confidence is explicit. If unknown time is unsupported, explain the limitation and request a supported value; do not silently invent noon.
4. Advanced calculation settings live in a disclosure with readable defaults.
5. Validate inline; retain input on failures; focus the first invalid field.
6. Calculation progress uses honest stage messages and a stable skeleton, never fabricated percentages.
7. Back/edit returns to populated input. Retry does not erase birth data.

## 7. Kundli user view

Label the mode switch “Personal / Astrologer”; provide a brief accessible description. The label change does not require changing stored mode identifiers.

Primary destinations: Overview, Charts, Timing, Life areas, Report. Keep five clear destinations. On narrow screens use a horizontally scrollable labeled navigation strip with an obvious overflow affordance, not wrapped rows of tiny pills.

### Desktop concept

```text
┌──────────────────────────────────────────────────────────────────┐
│ Astronum                                    Language   Account   │
├──────────────────────────────────────────────────────────────────┤
│ Name / Birth details       Edit          Personal | Astrologer    │
│ Overview     Charts     Timing     Life areas     Report          │
├──────────────────────────────────────────────────────────────────┤
│ Your birth chart                 Your chart at a glance          │
│ ┌─────────────────────────┐      Ascendant / Moon / Nakshatra     │
│ │                         │      A short, readable introduction   │
│ │       Large chart       │                                      │
│ │                         │      Current period                  │
│ └─────────────────────────┘      Period dates + Open timeline     │
│ D1 Birth chart  ▾   Style ▾                                       │
│                                  Explore a life area             │
│                                  Career / Relationships / ...    │
└──────────────────────────────────────────────────────────────────┘
```

Overview shows one main chart, three identity facts, one current-period summary, and a short set of routes into deeper reading. Avoid an endless dashboard of all reports.

### Mini sections

Each destination has one compact section navigator. Each item has a clear name and, in the explorer, a one-line explanation. The active section has a persistent title. Mobile uses a labeled section picker or sheet. Keep charts and interpretations synchronized when navigating.

| Destination | Mini sections | Presentation |
| --- | --- | --- |
| Overview | Chart summary, current period, suggested exploration | Balanced chart and reading composition |
| Charts | Birth chart, Navamsa, divisional library, comparison, planets, houses | Large chart canvas with contextual explorer |
| Timing | Vimshottari, Yogini, Chara, transits, annual, monthly, life timeline | Timeline or transit canvas, shared date control |
| Life areas | Career, relationships, wealth, education, property, life sectors | Topic reading with linked evidence |
| Report | Full life report, remedies, export | Chapter navigation and print-friendly reading |

Specialist systems remain discoverable from the explorer with an “Opens Astrologer view” description. Do not silently switch modes when a link is selected.

### Charts and divisional library

- Default D1 with D9 adjacent as a frequent choice.
- “All charts” opens a searchable grouped library showing code, name, and a plain-language purpose, sourced from the existing `vargaInfo` metadata.
- Include all 16 implemented vargas. Do not list unsupported chart systems as functioning controls.
- Group common charts first: D1, D9, D10, D2, D4, D7, D24; put the full catalog directly below.
- North/South style is a display preference; changing it preserves the selected chart, date, and inspection target.
- D1 reference modes: Lagna, Moon, Bhava Chalit, Lal Kitab where supported. Clearly distinguish a reference change from selecting a divisional chart.
- Selected planet/house reveals a desktop inspector or mobile sheet with name, position, readable meaning, and links to evidence.
- Dense planet clusters use a deterministic collision strategy and a linked list; no overlapping glyphs.
- Comparison explicitly chooses chart A and B; provide D1+D9, D1+D10, and natal+transit presets.
- On mobile compare charts vertically with repeated compact labels; preserve readable chart size.
- One canvas owns chart selection. Detail panes do not independently select an unrelated varga.

### Dasha experience

Show current mahadasha and antardasha with explicit dates. A horizontal period timeline supports selecting a period; a synchronized list provides keyboard and small-screen access. Drill down through only the depths supported by the existing calculation output, with a breadcrumb back to the parent period.

Vimshottari, Yogini and Chara share navigation patterns while retaining their distinct labels and data structures. Do not imply identical calculations. Include “Today”, selected date, period start/end, and the timezone. Long periods use a readable scale and overflow rather than narrow, illegible blocks.

### Transit experience

Dedicated mini sections: Overview, Chart overlay, Planet positions, and available interpretation details. Add future event lists or exact ingress/aspect timing only after verifying calculation support; those are separate data work if missing.

- Selected analysis date/time and timezone stay visible.
- Provide previous/next day and Today; larger increments are available through the date control.
- Natal and transit positions differ by symbol, line treatment, color, and legend.
- Filters: all planets, slow planets, selected planet; a selected-planet filter offers a planet picker immediately.
- Plain-language summary links to the exact planetary placement or supported aspect behind it.
- Loading/error messages are local to transit data; natal chart remains available.
- Do not show old transit results beneath a newly selected date without a visible updating indicator.
- A transit view in Charts must expose the date control even when the Timing destination is not selected.

### Life readings

Use a consistent sequence: short interpretation, relevant chart/house factors, timing where supported, then expanded evidence. Keep technical references available without requiring the user to decode tables first. Present interpretations as traditional astrological readings rather than factual promises. Do not invent scores, predictions, or precision unsupported by the existing reports.

### Reports

Offer a clear chapter list and export selection. User PDF emphasizes readable summaries; expert PDF includes selected tables and chart settings. Provide progress, successful download, and recoverable failure states. Display birth details and analysis context on exported documents. Verify print layouts separately from interactive layouts.

## 8. Astrologer workspace

A dedicated application layout with a searchable left explorer, flexible central canvas, optional right inspector, and one shared analysis toolbar.

```text
┌────────────────────────────────────────────────────────────────────┐
│ Profile / Birth details      Analysis date      Mode     Export     │
├───────────────┬───────────────────────────────────┬────────────────┤
│ Search tools  │ Chart A ▾    Chart B ▾    Style ▾ │ Selection      │
│               │ ┌──────────────┬────────────────┐ │ Position       │
│ Overview      │ │ D1           │ D9             │ │ Dignity        │
│ Charts        │ │              │                │ │ Aspects        │
│ Timing        │ └──────────────┴────────────────┘ │ Evidence       │
│ Life areas    │ Dasha timeline / transit context │ Notes          │
│ Strengths     ├───────────────────────────────────┤                │
│ Systems       │ Selected table or report         │                │
│ Utilities     │                                  │                │
└───────────────┴───────────────────────────────────┴────────────────┘
```

- Explorer approximately 220px; inspector approximately 300px. Collapse the inspector first as width decreases.
- Two-chart layout becomes available only when both charts remain readable; single-chart focus is always available.
- Resizable panes support keyboard controls and sensible minimum sizes.
- Presets: Overview, Chart study, Dasha study, Transit study. Saved layouts restore presentation without replacing birth data.
- Default dashboard: D1/D9, selected-date dasha, compact planet table, and shortcuts to strengths and transits. Avoid every analysis module above the fold.
- Tables support visible sorting, optional columns where useful, sticky headers, units, and horizontal overflow boundaries.
- Tool search supports English, Hindi labels, chart codes, and synonyms.
- Notes clearly disclose device-local versus account persistence. Saving success must reflect actual persistence.

### Complete existing capability map

| Explorer group | Existing capabilities to preserve |
| --- | --- |
| Overview | Summary / existing dashboard and overview aliases |
| Charts | D1, D9, all vargas, compare, houses, planet readings, house lords, available D1 references |
| Timing | Transits, Vimshottari dashas, Yogini, Chara, annual reading, monthly forecast, life timeline |
| Life areas | Career, relationships, wealth, education, property, life report, life sectors |
| Strengths | Ashtakavarga, Shadbala, yogas and doshas |
| Systems | KP, Lal Kitab, special tables |
| Practices | Remedies, Rudraksha, Vastu and home |
| Utilities | Birth precision, event journal, calculation details, layout management, notes and export |

Mode switching preserves birth profile, analysis date, chart style, and compatible selection. When a specialist tool has no Personal equivalent, move to its nearest meaningful destination with a brief explanation. Reload, Back, Forward, and deep links restore the same context.

## 9. Remaining website: page-by-page direction

| Page family / existing route | Visual and interaction plan |
| --- | --- |
| Home `/` | Large instrument-led hero; primary create-chart action; real product preview; three chapters for chart, timing, exploration; concise learning and consultation entries |
| Today `/today` | Date/location header, daily essentials, one reading column, compact links into Panchang and horoscope |
| Horoscope `/horoscope`, sign, period, personal | Sign library, clear period switch, readable article layout; personal reading visibly distinguishes birth-based context |
| Panchang `/panchang`, `/panchang/month` | Precise date/location controls, grouped daily values, accessible month calendar and agenda alternative |
| Festivals `/festivals`, year and detail | Editorial calendar, year selection, upcoming list, clear region/date context; readable detail pages |
| Matching `/matching` | Two symmetric profile forms, clear calculated summary, expandable factor breakdown and evidence |
| Numerology `/numerology`, Lo Shu `/lo-shu` | Guided form, diagram as focal point, numbered meanings with plain-language explanations |
| Muhurat `/muhurat` | Task/date/location controls, result list with explicit time windows and timezone |
| Prashna `/prashna` | Focused question/context form and chart result; visible calculation context |
| Annual `/varshphal` | Year selector, annual chart, structured themes and timing; share visual language with Kundli annual section |
| Rectification `/rectification` | Guided birth-time/event workflow, comparison of candidate results, explicit uncertainty |
| Sade Sati `/sade-sati` | Clear supported phase timeline and contextual explanation; avoid alarmist visual treatment |
| Nakshatra finder `/nakshatra-finder` | Minimal input, primary result, supporting birth-position evidence and learn link |
| Baby names `/baby-names` | Search/filter results with readable pronunciation and meaning where data exists; graceful empty results |
| Palmistry `/palmistry` | Camera/upload capture, image-quality feedback, hand analysis, annotated overlays and synchronized text; full workflow in section 17 |
| Rudraksha `/rudraksha` | Consistent imagery/diagrams, accessible recommendation structure, clear traditional context |
| Vastu `/vastu` | Legible directional plan, selected area inspector, mobile list equivalent |
| Learn `/learn` and all topic pages | Topic library; sticky desktop contents; diagrams and glossary links; long-form reading rhythm |
| Blog `/blog`, article | Editorial index with intentional image proportions; strong article title, author/date, clear reading width |
| Consultation `/consultation` | Clear offering, actual pricing where provided, appointment/form progression, confirmation and payment failure states |
| About `/about`, contact `/contact` | Brand story, real team information where available, clear contact form and response expectations |
| Account `/account` | Saved charts as readable rows/cards, profile settings, notifications, explicit empty and signed-out states |
| Auth `/login`, `/signup`, `/forgot-password`, `/reset-password` | Quiet centered form, consistent validation, password visibility, accessible errors and success states |
| Admin `/admin`, login, post creation/editing | Reuse typography/form tokens; efficient table and editor layouts; clear save/publish status |
| Legal `/privacy`, `/terms`, `/refund-policy` | Readable document template, clear headings, update dates from real content |
| Unsubscribe `/unsubscribe` | Focused confirmation and recovery flow |
| Offline, loading, errors, not-found | Branded but functional recovery; retain valid form state and provide useful next actions |
| Existing `/hi/*` routes | Apply equivalent templates and translated labels; document missing Hindi routes rather than linking to nonexistent equivalents |

## 10. Motion and interaction specification

| Interaction | Proposed behavior |
| --- | --- |
| Homepage introduction | One optional 600–900ms instrument assembly; static final state for reduced motion |
| Navigation selection | 160–220ms opacity/selection change, no large layout jump |
| Sheet/dialog | 200–280ms entrance; focus moves inside and returns to trigger on close |
| Chart selection | Brief emphasis of the selected object; labels remain readable throughout |
| Date update | Keep canvas dimensions stable; indicate updating until matching data arrives |
| Expand evidence | 160–220ms disclosure when feasible; immediate with reduced motion |
| Save/export | Honest pending, success and failure states; no decorative artificial delays |

Use native scrolling. No scroll hijacking, custom cursor requirement, or continuous animation in reading screens. Hover effects always have keyboard and touch equivalents. Only introduce a motion dependency if existing primitives cannot achieve the required effect economically.

## 11. Responsive and accessible behavior

- Review at 360, 390, 768, 1024, 1440 and 1920px, plus 200% zoom and landscape mobile.
- Below approximately 768px: one column, full-width charts, inspector sheet, vertically stacked comparison.
- Between approximately 768–1199px: collapsible explorer, chart/reading layout only when each remains readable.
- At larger sizes: full expert composition with optional inspector. Base transitions on available content width, not device names alone.
- Touch targets target 44×44px or larger. Visible focus, logical heading order, skip links, labeled inputs and keyboard-operable charts are required.
- Target WCAG 2.2 AA; verify text contrast, UI contrast, reflow, focus visibility, and non-color cues.
- Provide a textual planet/house table as an equivalent to graphical charts. Tooltip-only information is insufficient.
- Menus/dialogs support Escape, appropriate focus management and focus restoration.
- Live announcements cover result updates and errors without reading the whole chart repeatedly.
- Tables scroll inside their own container, never expand the entire page sideways.
- Honor reduced motion; provide opaque alternatives for transparency-heavy controls.
- Translate complete navigation and state messages. Avoid text baked into graphics.

## 12. State model and engineering approach

### Canonical state

Separate birth profile, analysis context, navigation, and presentation preferences. Define a single transition function for changes that affect multiple fields.

- Birth: source profile and calculation inputs.
- Analysis: date/time/timezone, primary and secondary charts, reference, transit overlay/filter and selected object.
- Navigation: mode, destination and section.
- Presentation: chart style, density, theme, panes and saved layout.

Define which values belong in the URL and which are device/account preferences. Existing links must remain valid through a compatibility mapping. Unknown values fall back safely. Avoid adding personal birth information to analytics or new URL fields merely for convenience; review the existing sharing behavior separately.

Explicit transition cases: D1 to D9; chart library selection; entering/leaving transits; comparison toggling; mode switch; reload; Back/Forward; changing birth profile; changing date while a request is pending. Cancel or disregard stale asynchronous results.

### Component direction

Extract a section registry with ID, destination, bilingual label, summary, supported modes, data dependency, canonical URL alias and default chart behavior. Use it to generate explorer, mini sections and search results consistently.

Proposed component boundaries: SiteHeader, ExploreMenu, PageShell, ToolShell, KundliShell, ProfileBar, ModeSwitcher, SectionExplorer, ChartCanvas, ChartLibrary, ChartInspector, AnalysisToolbar, DashaTimeline, TransitWorkspace, ReadingSection, EvidenceDisclosure and ExportDialog. These are proposed boundaries, not claims that all components already exist.

### Existing file anchors

| File / area | Planned work |
| --- | --- |
| `src/app/globals.css` | Semantic theme tokens, typography, shared primitives; replace obsolete styles in controlled stages |
| `src/components/Header.tsx`, `Footer.tsx`, `MobileTabBar.tsx` | Shared navigation hierarchy and mobile behavior |
| `src/components/views/HomeView.tsx` | Signature homepage composition |
| `src/components/KundaliIntro.tsx`, `KundaliForm.tsx`, `QuickKundaliForm.tsx` | Unified creation flow and visual form system |
| `src/components/KundaliResult.tsx` | Extract registry, shells and section rendering; coordinate state transitions |
| `src/components/kundli/AnalysisContext.tsx` | Canonical state, persistence and URL behavior audit |
| `src/components/kundli/ChartWorkspace.tsx`, `src/components/KundliChart.tsx` | Shared canvas, library, selection and responsive chart behavior |
| `src/components/kundli/AnalysisCalendar.tsx`, `TimingStrip.tsx` | One timing context across chart and report views |
| `src/components/kundli/workspace.css` | Replace accumulating overrides with scoped layout rules |
| `src/components/views/*`, `src/app/(en)/*`, `src/app/hi/*` | Roll out page-family templates and localize |
| `src/lib/pdf/KundaliPdf.tsx` | Matching print typography, charts and report hierarchy |

Before implementation, read the relevant installed Next.js guides in `node_modules/next/dist/docs/`, as required by AGENTS.md. Preserve unrelated working-tree changes. Use existing calculation APIs first; keep visual refactoring separate from new astrology calculations.

## 13. Performance and reliability budgets

Targets to verify, not current measured results:

- Field p75 targets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. Use laboratory checks as early indicators, not substitutes for field measurements.
- Establish route bundle and image baselines before changes; investigate regressions above 10% rather than accepting them silently.
- Lazy-load specialist reports and heavy optional views; keep primary navigation responsive while data loads.
- Avoid retaining every visited expensive interactive panel indefinitely; preserve necessary state independently of mounting.
- Reserve chart and image dimensions to avoid layout shifts.
- Use SVG for the signature art where practical; no mandatory WebGL dependency for the Kundli experience.
- Limit font weights and preload only critical assets.
- Validate date input before recalculation; control rapid date changes and stale response races.
- Partial report failure must not blank the entire chart workspace.

## 14. Implementation milestones

Estimates are planning ranges for one experienced developer with design iteration, not delivery commitments. Reassess after the first audit. Allocate roughly 60% of the design/build effort to Kundli.

| Milestone | Work and deliverables | Exit condition | Estimate |
| --- | --- | --- | --- |
| 0. Baseline | Capture representative screens, route inventory, feature map, state bug reproductions, performance baseline | Existing features and visual issues recorded | 1–2 days |
| 1. Foundations | Token sheet, typography comparison, shared controls, light/dark reference screens | Desktop/mobile English/Hindi samples reviewed | 2–3 days |
| 2. Kundli design prototype | Entry, Personal overview, charts, timing, expert workspace and mobile sheets | Complete key journeys at realistic data density | 3–4 days |
| 3. Kundli shell and state | Registry, navigation, canonical transitions, deep-link compatibility | Chart/section/date state remains consistent | 3–5 days |
| 4. Kundli depth | All charts, dasha, transits, readings, expert tables, reports and states | Capability map complete and accessible | 5–8 days |
| 5. Site rollout | Homepage, daily tools, remaining tools, editorial, account/admin/legal templates | Route inventory visually covered | 4–7 days |
| 6. Finish and validation | Responsive critique, localization, accessibility, performance, print and regression fixes | Release checklist passes | 2–4 days |

Prototype screens should be reviewable artifacts within the project. Review can refine direction without blocking already-authorized routine work. This plan itself does not authorize deploying or publishing the redesign.

## 15. Validation and acceptance checklist

### Kundli correctness

- [ ] Every existing section has a reachable destination in the registry.
- [ ] All 16 vargas render from the existing calculations in both chart styles.
- [ ] Chart name, selected mini section and interpretation remain coherent.
- [ ] Transit date is accessible wherever transit overlays appear.
- [ ] Comparison, filtering, chart inspection and mode switching preserve appropriate state.
- [ ] Reload and Back/Forward reproduce supported workspace state.
- [ ] Missing sections, request failure and delayed responses have useful local states.
- [ ] PDF/print reflects selected report content and context.

### Visual quality

- [ ] Reference screenshots cover home, Kundli entry, Personal overview, chart library, dasha, transit, expert dashboard, one tool and one article.
- [ ] Screens are reviewed at desktop and mobile sizes in both themes.
- [ ] Real long names, dense charts, long Hindi labels and large tables fit.
- [ ] No page-wide horizontal overflow, overlapping chart labels or obscured actions.
- [ ] No duplicated navigation rows or repeated independent chart selectors for one task.
- [ ] Loading, empty, error, success, disabled and focus states match the design system.
- [ ] Original signature artwork is recognizable without dominating every page.

### Engineering and accessibility

- [ ] Type checks, lint and production build pass.
- [ ] Targeted tests cover state synchronization, URL restoration and stale-result handling.
- [ ] Existing calculation regression checks pass when affected; UI refactors do not alter values.
- [ ] Keyboard traversal and screen-reader spot checks cover form, chart alternatives, menus and dialogs.
- [ ] Contrast, zoom, reduced motion, mobile safe areas and touch targets are verified.
- [ ] Performance results are compared against baseline.
- [ ] Existing route metadata, links, supported Hindi pages and account/payment flows remain functional.

## 16. Scope boundaries and delivery artifacts

Visual overhaul includes navigation restructuring, shared UI components, responsive layouts, chart presentation, interaction polish, content hierarchy and fixing state inconsistencies directly exposed by the redesign.

New astrology algorithms, exact transit event calculation, additional chart systems, cloud synchronization and new commercial functionality are separate enhancements if the current application does not support them. Record gaps rather than creating controls with placeholder results.

Deliverables during implementation:

1. Before/after screenshot set and reference annotations.
2. Theme and typography token specification implemented in shared styles.
3. Complete Kundli capability registry and two finished mode layouts.
4. All existing public and supporting page families migrated.
5. Responsive English/Hindi and light/dark review evidence.
6. State-transition verification, accessibility findings and performance comparison.
7. Final list of resolved issues and any remaining limitations.

The first implementation slice should be the Kundli entry, Personal overview, chart canvas and one Timing screen. That slice establishes the visual standard and interaction model for the rest of the overhaul.

## 17. Completeness audit: supporting product behavior

Added after a second repository audit. Sections 17–21 extend the original scope and take precedence where they specify a more complete workflow. Coverage is based on source inspection, not a claim that every integration has been exercised.

### Offline, installed app and device preferences

The project already includes `public/sw.js`, a manifest, generated icons, IndexedDB chart storage, device preferences, haptics and pull-to-refresh components. Preserve these as explicit product requirements.

- Design installed-app icons, launch appearance, theme colors and standalone navigation consistently with the website.
- Distinguish account-saved charts from recently opened charts stored on this device. The existing offline store keeps up to five recent charts; do not imply unlimited or synchronized storage.
- Show when a chart is an offline snapshot and its saved time. Date-dependent analysis requiring a network request must explain its availability.
- Handle unavailable browser storage and quota failures without blocking reading. Do not claim persistent saving when only an in-memory fallback succeeded.
- Review service-worker cache invalidation for new styles and components. Test an upgrade from the prior build as well as a fresh visit.
- Preserve exclusions for API, account and administrative caching. Review personal birth details in cached navigation URLs and provide appropriate device-data controls as a defined enhancement if absent.
- Prevent pull-to-refresh from interfering with chart gestures, sheet scrolling or forms. Keep haptics optional and independent of correctness.
- Retain text-scale, appearance and other existing display preferences. Avoid a theme flash during hydration.

### Palmistry: full capture and interpretation flow

The page includes a real camera/upload workflow and MediaPipe assets; an annotated hand diagram alone would not cover it.

1. Choose camera or upload with clear hand-position guidance.
2. Handle camera permission denied, device unavailable, unsupported context and camera-switch failure.
3. Show model loading separately from camera loading. Preserve the existing MediaPipe asset-copy step in development and build.
4. Preview the image, retake/replace it, and identify left/right hand and mirrored capture correctly.
5. Handle image decoding failure, no hand detected, poor image quality and incomplete landmarks with actionable guidance.
6. Preserve available questionnaire, palm-line, mount and Kundli-linked interpretation features.
7. Give overlays readable labels and a synchronized text alternative; support mobile zoom without trapping normal navigation.
8. Stop camera tracks on exit; release object URLs and image resources. Describe actual image processing/storage behavior accurately after verifying the full data path.

### Account, save and notification lifecycle

- Preserve sign-up, login, logout, account loading, session expiry, password reset, saved-chart open/delete and existing profile actions.
- Save-chart actions retain the intended chart through authentication where supported; explicitly design the return destination.
- Define duplicate-save and failed-save feedback. Destructive actions use a clearly scoped confirmation or undo where the API permits it.
- Notification settings show persisted state, pending changes and failed updates. Preserve unsubscribe from both account and emailed links.
- Password-reset screens cover invalid/expired links and success. Existing reset invalidates sessions; the redesigned flow must explain the resulting sign-in step.
- Empty account screens lead to creating or saving a chart. They must not display fabricated example records as user data.

### Consultation, payments and administrative workflows

- Preserve request-only behavior when payment keys are absent. Checkout is shown only when the existing configuration enables it.
- Cover plan selection, customer details, initiating checkout, user cancellation, payment failure, verification pending, confirmed booking and email-delivery issues.
- A client-side success callback is not sufficient evidence of confirmed payment; keep existing server verification and webhook reconciliation.
- Prevent repeated submission from producing misleading duplicate confirmations; verify existing server guarantees before changing UI behavior.
- Preserve administrative booking visibility and blog list/create/edit flows. Read the admin screens before designing additional status actions.
- Blog editing includes rich text, validation, pending save, failed save, publication state and navigation away with unsaved changes.
- Design confirmation and reset emails to match the brand using email-safe layouts; preserve tokens, links and meaningful plain text.

### Sharing, exports and search appearance

- Preserve copy-link feedback, share actions, horoscope/matching share-image endpoints and Kundli PDF generation.
- Label personal share links clearly because current chart URLs contain birth data. Do not pretend a publicly shareable URL is private.
- Social preview images use original artwork, readable titles and safe margins at actual preview sizes; avoid personal data in generic metadata.
- Cover missing/invalid input and rendering failure for dynamic share images and exports.
- Review JSON-LD, canonical and alternate-language links, titles, descriptions, sitemap, robots rules and icons for every template.
- Prevent account/admin/private views from being accidentally surfaced through new public navigation or metadata.

## 18. Integration and feasibility map

This is a frontend-led overhaul on the existing stack. Retain Next.js 16.3.4, React 19, Tailwind 4, Motion, astronomy-engine, Prisma/SQLite, React PDF and MediaPipe unless a concrete blocker justifies a separate migration. Avoid combining framework upgrades with the visual rollout.

| Integration / source area | Requirement during redesign | Failure or dependency to cover |
| --- | --- | --- |
| `/api/geocode` and PlaceInput | Accessible suggestions, disambiguation, selected coordinates/timezone | Slow provider, no results, invalid response, unavailable network |
| `/api/kundali` and `/sections` | Stable chart shell and section-local loading | Invalid birth data, partial report failure, stale response |
| `/api/kundali/annual`, `/sensitivity` | Preserve analysis controls and contextual results | Invalid year/time range and independent request failure |
| `/api/matching`, `/prashna`, `/rectification` | Retain validated input/output contracts | Unsupported input and recoverable calculation errors |
| `/api/charts`, `/api/charts/[id]` | Real saved-chart lifecycle | Signed out, access denied, missing record, save/delete failure |
| `/api/auth/*` | Existing session and password-reset behavior | Rate limiting, expired session/token, unavailable email |
| `/api/account/notifications`, `/notifications/unsubscribe` | Persist preferences and unsubscribe state | Invalid link, failed update, already unsubscribed |
| `/api/consultation`, `/verify`, `/razorpay/webhook` | Existing booking/payment lifecycle | Keys unavailable, cancellation, delayed verification, webhook retries |
| `/api/cron/daily` and email helpers | Preserve scheduled notification behavior and templates | Missing mail configuration, delivery failure; do not trigger real campaigns for visual QA |
| `/api/admin/*` | Preserve authorization, booking visibility and post management | Expired admin session, validation and save failures |
| `/api/kundali/pdf`, `/api/share/*` | Consistent document/share presentation | Rendering failure, missing data, long content |
| Service worker / IndexedDB | Existing offline behavior and upgrade compatibility | Stale assets, storage denied, old chart snapshots |
| MediaPipe assets / camera | Existing palm capture and local analysis flow | Model download failure, denied permission, image decoding |

### Deployment constraints to resolve before release

- The database uses a local SQLite adapter. Choose a deployment topology with durable writable storage, or separately plan a database migration. Do not assume an ephemeral filesystem is production persistence.
- Existing README documents in-memory login rate limits. Multiple application instances require a shared strategy before scaling; record this as an existing operational limitation.
- Verify required environment variable names from `.env.example` and README without copying secret values into plans or screenshots.
- Confirm the production origin, email sender, payment configuration, persistent database location and scheduler before production smoke checks.
- Verify asset copying, Prisma generation and the production build on the intended runtime. Run migrations only when the implementation actually introduces schema changes.
- Keep real payment, email and notification sends out of ordinary visual verification; use supported sandbox/test configurations.

## 19. Concrete delivery backlog and dependencies

Each work item needs a code owner, a reviewer, status, screenshots where relevant, and evidence for its exit condition. In a one-person implementation these are roles fulfilled at separate review passes. All items below begin as planned.

| ID | Buildable work item | Depends on | Evidence of completion |
| --- | --- | --- | --- |
| A1 | Capture current site, inventories and known state defects | None | Baseline folder and issue list |
| A2 | Specify component/state inventory and semantic tokens | A1 | Tokens plus all control states |
| A3 | Implement shared shell, typography, controls and themes | A2 | Real English/Hindi reference screens |
| K1 | Consolidate Kundli section registry and state transitions | A1 | Complete feature map and state checks |
| K2 | Build entry form and Personal shell | A3, K1 | Create/edit/reopen chart journey |
| K3 | Build chart canvas, library, inspector and comparison | K2 | All vargas and reference modes checked |
| K4 | Build dasha and transit workspaces | K3 | Correct date/period/selection relationships |
| K5 | Migrate readings, reports and specialist tools | K4 | Every Kundli capability mapped and reachable |
| K6 | Complete expert layout, saved layouts and notes | K3, K5 | Desktop/tablet/mobile workflows |
| K7 | Complete export, sharing and offline integration | K5, K6 | Real output files and offline recovery |
| S1 | Homepage and global navigation | A3, K2 | Original artwork and working destination links |
| S2 | Daily/calendar/horoscope and learning templates | A3 | Actual content and all variants |
| S3 | Remaining calculators, matching and palm capture | A3 | Inputs, results and failure paths |
| S4 | Account/auth, consultation, admin and emails | A3 | Full integration journey checks |
| S5 | Legal, utility, error, loading and Hindi parity | S1–S4 | Exact route register signed off |
| R1 | Accessibility, responsive, performance and regressions | K7, S5 | Recorded checks with resolved blockers |
| R2 | Release rehearsal and rollback verification | R1 | Staging evidence and recovery procedure |

Work can overlap after shared foundations are stable. The original estimates are initial ranges; the newly explicit integration, offline and email coverage must be estimated after A1. Do not keep the original schedule unchanged if the expanded audit reveals additional work.

### Required interaction-state inventory

Every interactive component is reviewed for default, hover where relevant, focus, selected, disabled, loading, empty, error and success states. Apply only meaningful states; do not invent unnecessary screens.

Components include buttons, links, icon actions, menus, segmented controls, date/time/place fields, search, validation, disclosure, table, chart marker, timeline period, sheet, dialog, toast/status message, skeleton, profile selector, file input and camera preview.

### Design decisions settled for the first build

- First design prototype uses the existing Anek families; the typography comparison may refine this once, before the site rollout.
- Existing saved appearance takes precedence. New visitors follow system appearance; the light design is the primary marketing reference, avoiding contradictory theme behavior.
- Use the installed Motion package for justified animation and existing SVG chart infrastructure for the signature object.
- Keep the current chart algorithms and supported calculation settings. Additional astronomical features receive their own scoped implementation item.
- Keep screenshots and design assets in the repository's established asset/documentation locations, creating an organized location if none exists.
- Use realistic, clearly synthetic chart fixtures for review; verify clustering, long names, historical dates, timezone offsets and narrow layouts.

## 20. Release, rollback and final completion criteria

Roll out in coherent slices: shared foundation, Kundli, public templates, supporting flows. Avoid a site where each screen retains a different temporary theme. Each slice must have a usable end-to-end path before the next visual layer is added.

Before release:

1. Confirm every route-register row has an implementation decision and validation evidence.
2. Run `npx tsc --noEmit`, `npm run lint`, relevant existing Vitest suites, and `npm run build`. Select tests according to changed behavior; run the full existing regression suite for the final release gate.
3. Check production-mode navigation, refresh/deep links, offline upgrade, export, login and configured integration flows in staging.
4. Review Safari/iOS, Chromium/Android and Firefox behavior, especially camera, sticky panels, blur fallbacks, date inputs and chart zoom.
5. Preserve a known-good release revision and documented restoration steps. If schema changes are separately approved, include backup and compatibility planning before rollout.
6. Version caches deliberately. Rollback must recover a compatible asset set and avoid leaving users on a broken cached shell.
7. Check post-release errors and performance through existing observability; add minimal monitoring if absent without logging birth details, palm images or authentication tokens.

The overhaul is complete only when all existing routes and Kundli features are accounted for, key journeys work with real calculations, the visual review passes, and remaining issues are explicitly documented with severity and ownership. A polished homepage alone does not satisfy completion.

## 21. Exact page-route coverage register

Generated from `src/app/**/page.tsx` during this audit. Dynamic paths require representative valid content, missing content and invalid-parameter checks. The register records coverage obligations, not completed redesign work. Future routes must be added before release. API and non-page surfaces are covered separately above.

For each row record: template used, implemented status, mobile/theme review, functional check and remaining issue. Check the box only after that route has passed its applicable review.

Inventory at audit: **67 page route patterns**.

- [ ] `/` — source: `src/app/(en)/page.tsx`
- [ ] `/about` — source: `src/app/(en)/about/page.tsx`
- [ ] `/account` — source: `src/app/(en)/account/page.tsx`
- [ ] `/admin` — source: `src/app/(en)/admin/page.tsx`
- [ ] `/admin/login` — source: `src/app/(en)/admin/login/page.tsx`
- [ ] `/admin/posts/[id]` — source: `src/app/(en)/admin/posts/[id]/page.tsx`
- [ ] `/admin/posts/new` — source: `src/app/(en)/admin/posts/new/page.tsx`
- [ ] `/baby-names` — source: `src/app/(en)/baby-names/page.tsx`
- [ ] `/blog` — source: `src/app/(en)/blog/page.tsx`
- [ ] `/blog/[slug]` — source: `src/app/(en)/blog/[slug]/page.tsx`
- [ ] `/consultation` — source: `src/app/(en)/consultation/page.tsx`
- [ ] `/contact` — source: `src/app/(en)/contact/page.tsx`
- [ ] `/festivals` — source: `src/app/(en)/festivals/page.tsx`
- [ ] `/festivals/[year]` — source: `src/app/(en)/festivals/[year]/page.tsx`
- [ ] `/festivals/[year]/[slug]` — source: `src/app/(en)/festivals/[year]/[slug]/page.tsx`
- [ ] `/forgot-password` — source: `src/app/(en)/forgot-password/page.tsx`
- [ ] `/hi` — source: `src/app/hi/page.tsx`
- [ ] `/hi/festivals` — source: `src/app/hi/festivals/page.tsx`
- [ ] `/hi/festivals/[year]` — source: `src/app/hi/festivals/[year]/page.tsx`
- [ ] `/hi/festivals/[year]/[slug]` — source: `src/app/hi/festivals/[year]/[slug]/page.tsx`
- [ ] `/hi/horoscope` — source: `src/app/hi/horoscope/page.tsx`
- [ ] `/hi/horoscope/[sign]` — source: `src/app/hi/horoscope/[sign]/page.tsx`
- [ ] `/hi/kundali` — source: `src/app/hi/kundali/page.tsx`
- [ ] `/hi/lo-shu` — source: `src/app/hi/lo-shu/page.tsx`
- [ ] `/hi/palmistry` — source: `src/app/hi/palmistry/page.tsx`
- [ ] `/hi/panchang` — source: `src/app/hi/panchang/page.tsx`
- [ ] `/hi/rudraksha` — source: `src/app/hi/rudraksha/page.tsx`
- [ ] `/hi/vastu` — source: `src/app/hi/vastu/page.tsx`
- [ ] `/horoscope` — source: `src/app/(en)/horoscope/page.tsx`
- [ ] `/horoscope/[sign]` — source: `src/app/(en)/horoscope/[sign]/page.tsx`
- [ ] `/horoscope/[sign]/[period]` — source: `src/app/(en)/horoscope/[sign]/[period]/page.tsx`
- [ ] `/horoscope/personal` — source: `src/app/(en)/horoscope/personal/page.tsx`
- [ ] `/kundali` — source: `src/app/(en)/kundali/page.tsx`
- [ ] `/learn` — source: `src/app/(en)/learn/page.tsx`
- [ ] `/learn/compatibility` — source: `src/app/(en)/learn/compatibility/page.tsx`
- [ ] `/learn/dasha-system` — source: `src/app/(en)/learn/dasha-system/page.tsx`
- [ ] `/learn/divisional-charts` — source: `src/app/(en)/learn/divisional-charts/page.tsx`
- [ ] `/learn/gemstones` — source: `src/app/(en)/learn/gemstones/page.tsx`
- [ ] `/learn/glossary` — source: `src/app/(en)/learn/glossary/page.tsx`
- [ ] `/learn/houses` — source: `src/app/(en)/learn/houses/page.tsx`
- [ ] `/learn/nakshatras` — source: `src/app/(en)/learn/nakshatras/page.tsx`
- [ ] `/learn/planets` — source: `src/app/(en)/learn/planets/page.tsx`
- [ ] `/learn/signs` — source: `src/app/(en)/learn/signs/page.tsx`
- [ ] `/learn/yogas` — source: `src/app/(en)/learn/yogas/page.tsx`
- [ ] `/lo-shu` — source: `src/app/(en)/lo-shu/page.tsx`
- [ ] `/login` — source: `src/app/(en)/login/page.tsx`
- [ ] `/matching` — source: `src/app/(en)/matching/page.tsx`
- [ ] `/muhurat` — source: `src/app/(en)/muhurat/page.tsx`
- [ ] `/nakshatra-finder` — source: `src/app/(en)/nakshatra-finder/page.tsx`
- [ ] `/numerology` — source: `src/app/(en)/numerology/page.tsx`
- [ ] `/offline` — source: `src/app/(en)/offline/page.tsx`
- [ ] `/palmistry` — source: `src/app/(en)/palmistry/page.tsx`
- [ ] `/panchang` — source: `src/app/(en)/panchang/page.tsx`
- [ ] `/panchang/month` — source: `src/app/(en)/panchang/month/page.tsx`
- [ ] `/prashna` — source: `src/app/(en)/prashna/page.tsx`
- [ ] `/privacy` — source: `src/app/(en)/privacy/page.tsx`
- [ ] `/rectification` — source: `src/app/(en)/rectification/page.tsx`
- [ ] `/refund-policy` — source: `src/app/(en)/refund-policy/page.tsx`
- [ ] `/reset-password` — source: `src/app/(en)/reset-password/page.tsx`
- [ ] `/rudraksha` — source: `src/app/(en)/rudraksha/page.tsx`
- [ ] `/sade-sati` — source: `src/app/(en)/sade-sati/page.tsx`
- [ ] `/signup` — source: `src/app/(en)/signup/page.tsx`
- [ ] `/terms` — source: `src/app/(en)/terms/page.tsx`
- [ ] `/today` — source: `src/app/(en)/today/page.tsx`
- [ ] `/unsubscribe` — source: `src/app/(en)/unsubscribe/page.tsx`
- [ ] `/varshphal` — source: `src/app/(en)/varshphal/page.tsx`
- [ ] `/vastu` — source: `src/app/(en)/vastu/page.tsx`

Non-page surface checklist:

- [ ] English and Hindi layouts and locale routing
- [ ] English and Hindi error/not-found boundaries; global not-found
- [ ] All route-specific loading states
- [ ] Manifest, app icons, Apple icon and Open Graph image
- [ ] Sitemap, robots rules and JSON-LD
- [ ] Service worker, offline snapshots and installed-app updates
- [ ] PDF output, horoscope share image and matching share image
- [ ] Transactional emails, notification settings and unsubscribe
- [ ] API error surfaces and session/proxy behavior

## 22. Implementation progress — 15 October 2026

The first implementation slice has started. This log records actual work; unchecked items in the route register remain pending.

- Kundli entry now has the original instrument SVG, a clearer bilingual introduction and a more prominent birth-details form. Its layout responds to narrow screens.
- Personal overview now leads with calculated ascendant, Moon sign and birth nakshatra before timing and life-area links.
- Initial User mode no longer resets the selected chart; chart-specific sections synchronize the primary chart and transit overlay with the open section.
- TypeScript, ESLint and whitespace checks pass for this slice. The English entry route returned HTTP 200 from the local development server and was inspected in the in-app browser. A conflicting `tab=rasi&chartA=D9` link resolved to `chartA=D1` after the chart loaded.
- The default Turbopack development cache failed during preview; a Webpack development server is running on port 3010 for this implementation session.
- The personal workspace now has Overview, Charts, Timing, Life areas and Report destinations. The astrologer workspace separates detailed Methods and saved Workspace tools; existing charts, transits, Dashas, life readings and calculation panels remain reachable.
- Picking D1, D9, a divisional chart or Transits from the personal chart toolbar now opens the matching section. The transit date control appears whenever an overlay or transit comparison is visible.
- The workspace navigation, active section controls and chart canvas have a unified visual hierarchy, including a shorter mobile header. These changes were inspected on a narrow Kundli preview.
- Shared dark and light tokens now use graphite, paper and blue across the site; English and Hindi browser theme colors match. The chart URL restore keeps D1, D9 and Transit deep links aligned with their sections, while expert chart selection stays independent while working inside a section.
- The timing strip now shows the current three Dasha levels as readable cards above the period tracks. The personal Report destination gives the long-form reading a focused full-width canvas.
- Shared birth-detail tool pages now have calmer entry and result headers. The homepage, English/Hindi Kundli, English/Hindi horoscope and Panchang, matching and numerology routes returned HTTP 200 in the local preview. TypeScript, ESLint and whitespace checks pass after these changes.
- Accessible names for rendered charts now identify the active D1/divisional chart, transit overlay or comparison, instead of announcing every canvas as a birth chart.
- The divisional chart reading panes now use the persistent chart canvas instead of repeating chart and style controls. More Vargas provides a searchable library of all 16 charts, with seven common charts visible first and the rest in a disclosure.
- Transit reading uses the shared analysis date control and persistent transit chart, with the month calendar retained and the Moon-reference chart available on request. Varga comparison uses the shared chart pair; birth-time candidate comparison keeps its distinct pair.
- Personal and Astrologer modes have clearer labels and an explanation when a specialist-only section changes modes. D1, D9, More Vargas and Transits now clear incompatible chart overlays/comparisons when entered, including via deep links.
- The More Vargas route was opened in the local browser after this change: D10 was selected in the single chart canvas and the seven primary chart cards appeared with the remaining nine in a disclosure. TypeScript, ESLint and whitespace checks passed; the existing Vitest suite passed all 545 tests across 75 files.
- Remaining: chart canvas and timing visualization redesign, full site-wide design-system pass, all route audits, complete state registry, mobile/desktop and English/Hindi screenshot review. The route and non-page checklists above remain authoritative; unchecked items are not complete.
