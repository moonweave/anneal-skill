# Non-obvious fork: relationship dashboard direction

This fixture packages the table-vs-graph decision from the README into a small,
inspectable case. Its job is narrower than a benchmark: make the claimed value
of anneal easy to audit against a no-skill baseline.

The fork: choose a UI direction for showing relationships between skills, tools,
roles, overrides, and risk in a developer-config inventory dashboard.

The tempting direction is a node-link graph because the problem says
"relationships." The measured winner is a refined table because the data is
mostly tree-shaped and the important user questions are scanning tasks. In a
fresh no-anneal control, Claude also picked the table; the useful contrast is
therefore the decision record, not a different final winner.

## Files

- `task.md` describes the decision fork.
- `fixture.json` gives a small representative dataset.
- `fitness.md` defines the direction-fitness questions.
- `scorecard.md` records the original reference direction scores.
- `baseline-result.md` describes the no-anneal/control result.
- `anneal-result.md` describes the first measured anneal result.
- `observed-run-2026-05-30.md` summarizes the first Claude control/dogfood run
  and its caveats.
- `observed-run-2026-05-30-clean.md` summarizes the cleaner run against a
  two-file fixture with no expected scorecard present.

## What this fixture should prove

anneal is not claiming to make the final artifact prettier. It should make the
direction choice measurable and auditable before expensive work starts.

In this case:

- Baseline/control path: refined table, selected by free-form reasoning.
- anneal path: refined table, selected by explicit task-fitness scoring.
- Reason: the measured task fitness favors one-view scanning over spatial graph
  exploration, and anneal records that reasoning in a repeatable table.

## How to use this fixture

Read `task.md`, then compare `baseline-result.md` with `anneal-result.md`.
The scoring basis is in `fitness.md`; the summarized numbers are in
`scorecard.md`.

Future improvement: add a harder control case where a capable baseline is more
likely to overbuild the graph, or add a transcript-capture flow that stores raw
control and `/anneal` runs next to this fixture.
