# Astronum — interpretation, evidence, timing, and workspace plan

Date: 18 October 2026
Status: specification ready for implementation; phases below are not implemented by this document.
Scope: the Kundli interpretation engine and every surface that publishes its conclusions.
Previous plan: [Visual overhaul and whole-site inventory](docs/plans/visual-overhaul-2026-10-15.md), preserved unchanged. This plan supersedes its interpretation priorities; unrelated route work remains in that backlog.

Implementation note, 18 October 2026: the first shared topic synthesis is now wired into the Personal overview, Life areas, Astrologer desk, the five matching report chapters, and PDF output. It traces primary/related evidence and the exact house relation behind a current dasha link. A previous timeline adjustment that assumed children follow marriage and suppressed repeat themes has been removed. Tests cover mixed evidence, ordering/duplication, name independence, locale parity, and report parity. This is an initial slice: calculation reference audit, birth-time gating, refined transit windows, practitioner evaluation, broader narrative review, and optional AI remain open. A production build in the current environment is blocked by Google font downloads; TypeScript and the test suite run locally.

## 1. Product decision

Build one auditable interpretation service that turns calculated chart facts into a small set of contextual conclusions. Personal overview, life-area detail, astrologer desk, timing calendar, reports, and PDF must consume the same assessment objects.

The desired experience: “This is the main pattern in your chart, these factors explain it, this other factor limits it, and this is the period in which the topic becomes relevant.” Every sentence can be expanded into its reasoning and underlying calculation.

More rules, longer paragraphs, more charts, and an unconstrained language model will not by themselves solve the present problem. The central work is relevance, synthesis, contradiction handling, uncertainty, and evaluation. Build a strong deterministic baseline first. Add optional language generation only after its input and output contracts are stable.

Software correctness, agreement with a documented astrological tradition, reader usefulness, and empirical predictive accuracy are four separate goals. Passing one does not establish the others. Do not advertise improved predictive accuracy without prospective evidence. The design below is an engineering proposal informed by the existing traditional-rule system, not a claim that astrology has established forecasting accuracy.

## 2. Repository findings that drive the plan

| Inspected code | Finding | Required response |
| --- | --- | --- |
| `src/lib/astrology/topicAssessment.ts` | Chooses the first supporting and first demanding item after sorting by method; lead mainly reflects the primary lord's house | Replace selection-only logic with a structured synthesis of interactions, relevance, and conflicts |
| `src/lib/astrology/topicReading.ts` | Supplies topic houses, karakas, vargas, and active periods | Retain as an adapter; introduce explicit topic/question definitions and typed activation relationships |
| `src/lib/astrology/readingEvidence.ts` | Evidence already carries observations, rules, limitations, methods, and destinations | Extend this foundation with machine-readable facts, dependencies, provenance, and stable identifiers |
| `src/lib/astrology/lifeEvents.ts` | Adds multiple traditional methods into a score named `confidence`, clamps it to 0–97, and labels results Strong/Likely/Possible | Audit this heuristic; migrate to named rule support, remove implied probability, and separate method profiles |
| `src/lib/astrology/lifeTimeline.ts` | Further adjusts event scores using age and repeat-event handling | Make adjustments explicit; never silently treat demographic defaults or marriage assumptions as chart evidence |
| `src/lib/astrology/astrologerCalendar.ts` | Reuses timeline events; sorts by date and then score, with period/peak fields | Share the new assessment and window contracts; distinguish chronological view from ranked priority view |
| `src/lib/astrology/planetDiagnosis.ts` | Combines strength, dignity, vargas, and conditions into a single grade; some copy prescribes remedies | Separate capacity, functional role, context, and condition; remove automatic remedies from strength verdicts |
| `src/lib/birthReliability.ts` | Uses selected precision plus sampled field stability; precision zero returns “exact” | Treat zero as user-reported precision, not verified accuracy; propagate uncertainty into each claim |
| `src/components/kundli/WorkspaceOverview.tsx` | Recent UI improvement still paraphrases evidence inside the component | Move interpretation into the shared service; UI only renders typed results |
| `src/components/TopicReadingPanel.tsx`, `DeepReportPanels.tsx` | Detailed views draw on different existing result paths | Migrate together to prevent different conclusions for the same chart/context |

These are findings from targeted source inspection, not a complete calculation audit. The previous turn passed 551 tests; that is a regression baseline, not proof of interpretation quality.

## 3. Non-negotiable contracts

1. Every substantive chart claim references at least one fact and one versioned rule or synthesis policy.
2. Evidence role is explicit: primary topic, secondary topic, natural significator, modifier, timing activation, or context only.
3. A repeated fact across D1 dignity, vargottama, and aggregate strength cannot count as three independent confirmations.
4. Contradictory indicators remain visible. Missing data is not a negative indicator.
5. Strength describes capacity; it does not automatically mean a favorable outcome. Activation does not determine an event or its direction.
6. Birth-time sensitivity can limit or suppress a conclusion, not merely attach a decorative warning.
7. A timing interval identifies what was calculated, its resolution, and its reason. No exact event date is invented from monthly samples.
8. Personal and Astrologer views change depth and vocabulary, not underlying conclusions.
9. No numeric probability until a separately validated probability model exists. Heuristic ranks are labeled as such.
10. Unsupported conclusions are omitted or explicitly marked unresolved. Longer output is not a quality target.

## 4. Calculation and convention audit

Before expanding interpretation, establish a reproducible calculation manifest and fixture suite.

Record birth date/time as entered, timezone identifier and resolved offset, coordinate precision, calendar convention, time source/uncertainty, ephemeris version, ayanamsa, node convention, house system, varga algorithms, aspect conventions, dasha year length, and engine/rule versions.

Audit:

- UTC conversion, historical timezone offsets, DST ambiguity/nonexistent times, leap days, and date rollover.
- Longitude wrapping, latitude/longitude signs, ascendant behavior at high latitude, and sidereal conversion.
- Mean versus true nodes; geocentric versus other position conventions; distinguish display rounding from calculation precision.
- D1 house ownership and occupancy, bhava-chalit interpretation, and which house model each rule expects.
- Every supported varga algorithm, especially sign/degree boundaries. Never substitute a generic division algorithm where a selected convention differs.
- Dasha balance at birth, nested boundaries, end-exclusive intervals, year-length convention, and timezone display.
- Shadbala components and references, Ashtakavarga raw/reduced distinctions, dignity degree limits, combustion, retrogression, aspects, yogas and cancellation conditions.
- Transit ephemeris dates, reference frame, speed/stations, and exact crossing versus sampled occupancy.

Compare independently generated reference fixtures under matched conventions. Swiss Ephemeris is a possible reference, not a mandatory migration. Record reference version/settings and per-quantity tolerances before accepting differences. Tolerances must be selected from the required precision and measured error, not chosen after seeing a mismatch. Review licensing before incorporating reference software into the product.

Gate: every discrepancy has a classification—implementation defect, convention difference, reference limitation, or unresolved. Unresolved inputs/calculations restrict downstream claims.

## 5. Shared architecture

```text
Birth input + calculation settings + declared uncertainty
                        ↓
Versioned calculation snapshot + typed facts
                        ↓
Topic/question relevance + method-specific rule evaluation
                        ↓
Dependency grouping + contradictions + sensitivity gating
                        ↓
Structured topic synthesis + bounded timing windows
                        ↓
Validated narrative (deterministic first, optional model later)
                        ↓
Personal / Astrologer / calendar / report / PDF
```

Suggested modules under `src/lib/astrology/interpretation/`:

- `schema.ts`: versioned contracts, runtime validation, migration adapters.
- `facts.ts`: normalize existing calculations; never recalculate astronomy in the presentation layer.
- `topics.ts`: question taxonomy, primary/secondary factors, applicable methods.
- `ruleRegistry.ts`: predicates, exceptions, provenance, method profile, review status.
- `relevance.ts`: named connections between a factor and a question.
- `dependencies.ts`: shared-fact groups and duplicate influence handling.
- `synthesis.ts`: interactions, competing readings, limits, and conclusion selection.
- `timing.ts`: interval computation, intersection, exclusions, and rank explanations.
- `sensitivity.ts`: claim-specific birth-time applicability.
- `narrative.ts`: bilingual rendering from approved semantic content.
- `validate.ts`: citations, missing-data handling, prohibited unsupported detail, cross-surface consistency.
- `index.ts`: one assessment entry point, cancellation, caching, and diagnostics.

Use existing modules as calculation providers. Avoid a big-bang rewrite or a second astronomical engine.

## 6. Data model

Each assessment must be reproducible from its context. Proposed fields:

| Object | Required information |
| --- | --- |
| `ReadingContext` | Chart/settings fingerprint; selected instant/range and timezone; question; method profile; birth-time uncertainty; engine/rule versions; optional consented user context |
| `ChartFact` | ID; subject; typed value and unit; chart/reference frame; calculation source/version; precision; dependencies |
| `RuleEvidence` | ID; fact IDs; rule ID/version; topic role; polarity; method; applicability; exceptions checked; provenance; unavailable inputs |
| `DependencyGroup` | Shared fact/derivation IDs; reason for grouping; how redundant contributions are prevented |
| `SynthesisClaim` | ID; semantic conclusion; supporting and opposing evidence IDs; interaction explanation; primary/secondary relationship; alternative explanation; applicability state |
| `TimingWindow` | Start/end; timezone; computation resolution; active periods; qualifying transit intervals; exclusions; boundary reasons; sensitivity; rank explanation |
| `TopicAssessmentV2` | Main conclusion; supporting claims; tensions; timing; practical reflection; unknowns; reason trace; method disagreements; narrative version |
| `Observation` | Chart/assessment/window IDs; event date or range; recording timestamp; user wording; optional category; consent and storage scope |

Separate reliability dimensions: input quality, calculation availability, rule applicability, agreement within a method, birth-time sensitivity, and timing resolution. Do not compress them into a reassuring “confidence 87%.”

## 7. Topic and question design

A topic is broader than an event. Start with five current areas, then add advanced areas only after reviewed rules exist.

| Area | Initial questions | Context required before greater specificity |
| --- | --- | --- |
| Work | Work pattern, responsibility, stability/change themes, current emphasis | Employed, studying, self-employed, seeking work, or prefer not to say |
| Relationships | Partnership pattern, communication/commitment themes, current emphasis | Relationship status only if volunteered; no assumed desire for marriage |
| Money | Earning versus saving themes, resource pressures, current emphasis | Broad goals, not account balances; no investment or return predictions |
| Learning | Study habits, qualifications, mentoring, current emphasis | Stage and purpose of study |
| Home | Stability, family environment, relocation/property themes | Rent/buy/move interest only if supplied |
| Later | Creativity, travel, spiritual interests, caregiving and family themes | Explicit topic selection and reviewed scope |

Start with one optional question: “What would you like clarity on?” Allow browsing without an intake questionnaire. Record user statements as context, never as chart-derived findings. Do not infer intimate attributes or diagnose health conditions from a chart.

Keep marriage, job change, purchase, and relocation as distinct candidate interpretations. A broad house activation is insufficient to assert any one event.

## 8. Synthesis policy

For each question:

1. Establish the primary factors under the selected, documented tradition.
2. Trace each secondary factor to the primary question through named relations. No vague “related factor” without a navigable explanation.
3. Evaluate condition, capacity, role, and context separately.
4. Group dependencies and suppress duplicated contributions.
5. Apply documented exceptions/cancellations only when their predicates are satisfied. Partial satisfaction stays partial.
6. Explain interactions: reinforcing, qualifying, conflicting, or irrelevant to this question.
7. Evaluate whether timing activates a supported theme. Do not create a natal conclusion solely because a transit happens.
8. Apply sensitivity and missing-data gates.
9. Select a small number of material conclusions with the contrary evidence intact.
10. Produce a semantic reading with alternatives and unresolved questions before rendering prose.

Initial method profile: explicitly documented D1 + Vimshottari + selected transit conventions, with relevant vargas and strength measures as contextual modifiers. This is a proposed product default requiring practitioner review, not a universal astrological hierarchy.

KP, Jaimini/Chara, Yogini, annual methods, and other systems remain separate profiles or named comparisons until reviewed combination policies exist. Agreement between methods is not automatically statistical independence. Preserve disagreements rather than voting them away.

Markers such as retrograde, combustion, exaltation, debilitation, and vargottama need typed meaning, applicability, explanation, and evidence links. Never equate a single marker with “good” or “bad.”

### Example based on the current test chart

Known from the current evidence: the primary career lord Saturn has supportive D1 dignity, while its Shadbala is below its reference. A present dasha link involves Mercury.

Better synthesis: “The career indicators are mixed: Saturn's placement supports this area, but its measured strength gives a reason to moderate that reading. Mercury connects the selected period to work-related factors. That supports discussing work now; it does not identify a promotion or job change.”

The full trace must state exactly how Mercury connects. If it cannot, omit the timing claim. Do not invent an exact window, occupation, salary, psychological trait, or life history to make the example sound personal.

## 9. Timing engine

Replace vague activation copy and score-only ranking with auditable intervals.

- Represent all internal intervals in UTC with a documented half-open boundary convention; display the selected timezone.
- Use actual Mahadasha/Antardasha boundaries; deeper levels only when time quality and rule applicability permit them.
- Build transit intervals from relevant ingresses/aspects/stations under the chosen convention. Coarse scanning can find candidates; refine boundaries only to the declared numerical tolerance.
- Intersect qualifying intervals and period windows. Preserve separate retrograde passes and gaps; never turn disconnected matches into one continuous “peak.”
- Separate a long background period from a shorter period of extra emphasis.
- Rank by a documented tuple such as primary relevance, usable evidence, contradiction severity, sensitivity, and proximity. These are prioritization criteria, not event probabilities.
- Provide chronological and priority views with labels that explain the distinction.
- Recompute or invalidate when birth data, calculation settings, date, uncertainty, or method changes.
- Distinguish not activated, conflicting, insufficient data, and not evaluated.

Window copy: “This topic receives additional emphasis during [computed interval] because [period relationship] overlaps [transit relationship]. [Counterpoint] limits the interpretation.” If only a broad period is available, show only that broad period.

Do not introduce exact dates, “best day,” favorable outcomes, or a percentage merely because the UI has space for them.

## 10. Birth-time sensitivity

- Capture documented time, remembered time, approximate range, and unknown. “Exact” is a declaration about the input, not verified ground truth.
- Test the specific dependencies of each claim: ascendant, relevant planetary division, house assignment, and timing boundaries as needed.
- Use adaptive refinement near detected discontinuities. State the sampling resolution and residual limitations; endpoint or minute-sample agreement does not prove invariance between samples.
- Claim states: usable under declared input, stable in tested samples, changes in tested range, untested, or unavailable.
- If a material dependency changes, provide competing scenarios or suppress the specific claim. Broaden timing where justified.
- Unknown time must not silently become noon. Offer only calculations that the available input supports; explain what cannot be established.
- Keep D60 and other highly sensitive detail out of a default Personal conclusion until its dependencies pass the policy.
- Store sensitivity results with chart/settings/algorithm fingerprints. Changing settings invalidates old results.

## 11. Narrative and optional AI

The deterministic renderer must already produce useful readings. It renders meaning objects into English/Hindi, with ordinary language first and exact terms on expansion. Remove regex parsing of rendered evidence strings from the interpretation path.

If a language model is later added:

- Give it approved claims, evidence, contradictions, context, and permitted intervals—not an open-ended instruction to predict from birth data.
- Require structured output linking each factual sentence to claim IDs.
- Disallow new events, dates, probabilities, diagnoses, remedies, sources, or user traits.
- Validate output against the allowed semantics; reject unsupported assertions and fall back to deterministic text.
- Treat free-text journal/context as untrusted data. It cannot modify system instructions or the evidence hierarchy.
- Version prompts/models, cache by full context, record evaluation results, and set latency/cost budgets.
- Minimize external personal data. Send no name, exact birthplace, or raw birth details when structured claims suffice; make external generation transparent and optional.
- Test Hindi for semantic equivalence and natural reading, not just literal translation.

Model choice is secondary to these contracts. A more capable model cannot establish facts absent from the evidence.

## 12. Personal experience

Default order:

1. Selected person, birth-time reliability, and reading date in a compact header.
2. Life-area/question buttons, with the selected question persistent and shareable.
3. One concise main reading: main pattern → why it matters → counterpoint → current timing.
4. A useful reflection or practical question clearly identified as guidance, not a calculated event.
5. “Why this reading?” expands evidence and the chart relationship.
6. “Explore timing” opens the same window and highlighted factors.
7. D1/D9 and detailed tables follow; journal and full report remain accessible.

Show at most three main takeaways initially as a design target, not a quota. One well-supported point is better than filling three cards. Do not force caution text into every sentence; show specific limits beside the affected claim and one concise overall scope statement.

Keep blue and gold. Improve readability through hierarchy, spacing, copy, and contrast before changing the palette again. No decorative motion in the reading flow; reserve cinematic treatment for introductions and transitions that do not delay access.

## 13. Astrologer experience

Default order: Case overview → Topic analysis → Timing calendar → Charts and strengths → Methods → Observations.

Desktop: persistent chart/context panel with a reading/evidence panel; adjustable split; chart selection by labeled buttons/library. Selecting a claim highlights the relevant planet, house, varga, or period. Selecting a calendar item restores its context and journal references.

Show primary versus secondary factors, raw measurements, source rules, exceptions, contradictions, dependency groups, omitted claims and omission reasons, convention settings, and sensitivity scenarios. Allow comparison of method profiles without combining them silently.

Observations preserve original wording and date, distinguish user report from practitioner interpretation, and link to the assessment version seen at the time. Notes do not retroactively rewrite a previously issued prediction. Practitioner corrections require an attributed annotation or versioned rule proposal.

## 14. Mobile, accessibility, and state

- Personal is a single reading column; Astrologer uses Chart / Reading / Evidence segmented buttons and an accessible detail sheet. Avoid nested persistent navigation bars.
- No native dropdown for chart selection. Use common chart buttons plus a searchable, scrollable library with selected state and clear return behavior.
- Date selection opens a focused sheet/dialog with presets, explicit date/time/timezone, Apply/Cancel, focus handling, and retained draft values.
- Back navigation, reload, deep links, and mode switches preserve the intended question, chart, date, and evidence selection.
- Use one canonical state model. Async responses carry context IDs; discard stale results after date/person changes.
- Design at 320, 390, 430, 768, 1024, and 1440px; test portrait/landscape, browser zoom, text enlargement, Hindi, and both themes.
- Target WCAG 2.2 AA; propose 44px touch targets as the product baseline. Keyboard, screen-reader names, focus restoration, contrast, non-color state cues, reduced motion, and safe-area padding are release checks.
- No sideways page overflow, clipped chart labels, hidden primary actions, or controls covered by the mobile bottom bar.
- Consolidate accumulated CSS overrides into scoped components/tokens after behavior stabilizes.

## 15. Evaluation: correctness, usefulness, and claims

### Engineering fixtures

Cover varied ascendants, dates/timezones, boundaries, uncertain birth times, absent inputs, opposing indicators, nodes, retrograde passes, and method differences. Include the current Jaipur chart as a regression, not the entire benchmark.

Required invariants:

- Renaming a person cannot change the interpretation.
- Switching locale preserves claim IDs and meaning.
- Changing only analysis date preserves natal facts and changes relevant timing.
- Reordering evidence cannot change the result.
- Duplicating derived evidence cannot increase support.
- Removing unavailable data cannot be presented as negative evidence.
- Small time changes affect only dependencies that actually change.
- Summary, detail, calendar, and export agree for the same versioned context.
- Every retained claim has a complete trace; all sensitive claims obey their applicability state.

### Practitioner and reader evaluation

Initial target: 30 diverse, consented or synthetic cases, independently reviewed by at least two practitioners using declared methods. Score relevance, reasoning completeness, contradiction treatment, scope, and unsupported specificity separately. Record reviewer disagreement; do not call consensus ground truth about future events.

Reader study target: 5 everyday users and 3 practitioners initially. Ask them to identify the main message, why it was produced, its limit, and how to inspect timing. Record completion/errors and comprehension before tuning aesthetics.

### Prediction evaluation

If pursuing predictive claims, preregister event definitions, forecast windows, scoring, baselines, and evaluation dates. Use timestamped prospective forecasts; collect non-events as well as matches. Split by person and time to prevent leakage. Do not tune against the held-out evaluation set. Measure false positives and selective reporting. Determine sample size before claims using a suitable study design. Satisfaction, retrospective anecdotes, and rule agreement are not calibration.

## 16. Performance, privacy, and operations

- Compute natal facts once per settings fingerprint; cache time-dependent assessments separately.
- Lazy-load expensive sensitivity and long calendar work; use a worker/server job where measured necessary, with cancellation and bounded horizons.
- Initial product targets: warm topic switches under 200ms and warm assessment retrieval under 500ms on a documented reference device. Measure cold calculations before setting their budget; no fake progress percentages.
- Minimize birth/context data in logs and analytics. Define retention, export, deletion, account boundaries, and local/shared storage behavior for observations.
- Instrument stale-result rejection, calculation failures, narrative validation failures, missing evidence, and latency without storing personal reading text by default.
- Use feature flags, versioned outputs, rollout cohorts, and rollback. Cache invalidation includes engine, rules, conventions, locale, context, and uncertainty.
- Audit API/SSR/PDF caches for cross-user leakage. Redact personal data in support diagnostics.

## 17. Implementation phases and gates

| Phase | Deliverable | Gate |
| --- | --- | --- |
| 0 — Baseline and audit | Calculation manifest, source inventory, current-output fixtures, convention and scoring audit | Every current conclusion path inventoried; discrepancies and heuristic scores documented |
| 1 — Evidence contracts | Typed facts/rules, primary/secondary links, dependencies, provenance, adapters | Trace coverage and duplicate-evidence invariants pass |
| 2 — Career vertical slice | Synthesis, contradictions, deterministic bilingual narrative, overview + detail | Same claim IDs across views; reviewer can reconstruct every conclusion; unsupported specifics absent |
| 3 — Sensitivity and timing | Claim gating, bounded intervals, calendar adapters, stale-state protection | Uncertain-time and disjoint-window fixtures pass; dates have explicit resolution |
| 4 — Five-area coverage | Relationships, money, learning, home under reviewed policies | Each area passes the same rubric; no generic filler added to reach a word count |
| 5 — Workspace integration | Personal/Astrologer views, chart/evidence links, mobile, report/PDF parity | End-to-end navigation/state/accessibility matrix passes |
| 6 — Quality pilot | Practitioner and reader studies, corrections, observability, rollback | No unresolved critical defects; agreed comprehension/reasoning targets met |
| 7 — Optional language model | Constrained generation, validator, fallback, privacy/cost controls | Beats deterministic baseline on blinded usefulness without increasing unsupported claims |
| 8 — Extended traditions and outcomes research | Reviewed method profiles; prospective study if desired | Each new method independently evaluated; no accuracy marketing ahead of evidence |

Do not wait for every phase to deliver value. Ship a coherent Career slice behind a flag, evaluate it, then generalize. Leave existing expert tools available during migration.

## 18. First implementation sprint

- [ ] Capture current Career/Relationship outputs and list their producing modules.
- [ ] Define `ReadingContext`, `ChartFact`, `RuleEvidence`, `SynthesisClaim`, and `TopicAssessmentV2` schemas.
- [ ] Add adapters from `readingEvidence.ts` and `topicReading.ts` without changing calculations.
- [ ] Implement primary/secondary relevance, shared-fact grouping, missing-data semantics, and explicit conflict representation.
- [ ] Implement a Career synthesis policy that explains the current Saturn contradiction and traces Mercury activation.
- [ ] Remove interpretation text construction from `WorkspaceOverview.tsx`; render the shared result.
- [ ] Connect `TopicReadingPanel.tsx` to the same Career assessment under a feature flag.
- [ ] Add meaningful invariant tests for duplicate evidence, ordering, absent data, locale parity, and context changes.
- [ ] Capture desktop/mobile screenshots and test question → evidence → chart → return.
- [ ] Document what remains on the legacy engine, especially scored event windows and exports.

Sprint acceptance: the current test chart gets a readable, reproducible explanation of its mixed Career indicators; another materially different chart gets a meaningfully different explanation; neither invents an event. This is the concrete starting point, before broad styling or AI integration.

## 19. Completion checklist

- [ ] Independent calculation fixtures and conventions documented.
- [ ] One shared assessment service used by every migrated surface.
- [ ] All material claims have evidence, exceptions, limits, and version IDs.
- [ ] Contradictions and method disagreements survive summarization.
- [ ] Birth-time uncertainty affects claim availability and timing granularity.
- [ ] No heuristic score presented as an event probability.
- [ ] English/Hindi semantic parity; desktop/mobile, light/dark, accessibility checks complete.
- [ ] Personal and Astrologer workflows tested with intended users.
- [ ] Sensitive context/observations have clear storage and deletion behavior.
- [ ] Performance measured, stale responses rejected, errors recoverable.
- [ ] Report/PDF and calendar match their source assessment.
- [ ] Practitioner review, limitations, release notes, and rollback documented.

## 20. Reference notes

- [Swiss Ephemeris programming documentation](https://www.astro.com/swisseph/swephprg.htm): reference for matching position/time/sidereal conventions and reviewing integration licensing; it does not validate astrological interpretation.
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/): accessibility acceptance reference.
- [Apple Human Interface Guidelines — disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls): design reference for optional depth. The page required JavaScript during this audit and its linked Markdown fetch failed; no specific rule from that page is claimed as verified here.
- Traditional rules require an edition/translation, exact location, convention, exceptions, and practitioner review in the rule registry. Do not fabricate classical citations. Forum requests can inform usability research but do not establish rule validity.

All proposed numerical study sizes and performance targets above are initial project targets, not achieved measurements or evidence of predictive accuracy.
