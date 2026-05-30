# Derivation: fuzzy goal → measurement sheet

`fitness.md` shows the *finished* five questions. This file shows how they were
derived from the fuzzy goal by the SKILL.md §3 Step-1 algorithm — the hard move
the skill exists to make repeatable. The point: the questions are not invented to
flatter a chosen direction; they fall out of the task.

Fuzzy goal (from `task.md`): *"help a user answer relationship-risk questions
quickly, before the team invests in building a full view."*

## a. Actor and task
- **Actor:** a developer auditing their own multi-tool agent config.
- **Task (verbs):** *find* orphaned items, *spot* the riskiest one, *trace* an
  override, *see* a provider's scope, *identify* a cross-tool single point of
  failure — fast, by scanning, before any full view is built.
- Actor + task exist ⇒ not pure taste ⇒ do not degrade.

## b. Task questions (answerable on the same `fixture.json` for every candidate)
1. Can the user find orphan items in one view?
2. Can the user spot the single riskiest item in one view?
3. Can the user trace override precedence without opening details?
4. Can the user see provider scope clearly?
5. Can the user identify cross-tool single points of failure?

Each is a *scanning* task on the shared dataset — not "is the graph pretty?"

## c. Countable outcome (one scale, all questions)
`0/1/2`: `2` = answered directly in one view, `1` = answerable but indirect,
`0` = not answerable without extra navigation/inspection. (Matches `fitness.md`.)

## d. Worst / ideal, fixed before seeing candidates
- **Worst = 0/10:** nothing answerable without digging.
- **Ideal = 10/10:** every question answered in one view.
- Direction-neutral: the scale rewards *answering the scanning task*, never graph
  aesthetics, table styling, typography, or implementation completeness.

## e. Improvement surface (a low score names the next fix)
- Q2 = 0 → "no risk-ranking affordance" → add a risk column/sort, not a prettier node.
- Q3 = 1 → "precedence requires opening a detail" → surface the winning override inline.
- Q5 = 0 → "tool fan-in invisible" → add shared-tool highlighting.
A score that can only say "feels worse" would be discarded; none here are.

## f. Gate
All five questions are countable on cheap prototypes of each candidate ⇒ ≥2
measurable ⇒ anneal can rank this fork. Proceed to measure (`scorecard.md`).

---

Why this matters for the fork: "relationships" *suggests* a graph, but every
question above is a one-view scanning task, and the data is mostly tree-shaped
(one owner / one scope per item). The derivation — not intuition — is what
exposes that a table can answer all five, which is why the measured winner is the
table. See `scorecard.md` for the numbers and `baseline-result.md` /
`anneal-result.md` for the two paths.
