# Baseline result: no anneal

This is the observed no-anneal control result from a fresh Claude Code prompt.
The control was instructed not to read `SKILL.md`, `README.md`, `rubrics/`, or the
expected-result files.

## Prompt shape

The control prompt provided only:

- `task.md`
- `fixture.json`

Then it asked Claude to choose the best primary UI direction from:

1. node-link graph
2. refined table
3. grouped cards
4. matrix

## Observed baseline choice

Refined table.

The baseline reasoned that the fixture is mostly attributes rather than dense
topology:

- owner, scope, and risk are per-item fields
- overrides are a thin precedence layer
- shared tools are the only substantial many-to-many relationship
- risk ownership triage is fastest in a sortable, filterable table

## What this means

This control did **not** produce the expected graph failure. A capable baseline
agent also found the table direction from the fixture.

That weakens the claim that this fixture proves anneal changes the final
direction versus ordinary prompting. The honest comparison is narrower:

- Baseline chose the same winner, but used free-form reasoning.
- anneal chose the same winner with explicit fitness questions, a score table,
  rejected-direction scores, and a two-oracle separation between direction choice
  and polish.

So this fixture currently supports "anneal makes the decision auditable and
repeatable," not "anneal uniquely discovers the winner."
