# Observed Claude run: 2026-05-30

This note summarizes the first control/dogfood run reported from Claude Code.
It is a summary, not a raw transcript.

## Control prompt

The control prompt instructed Claude not to use `/anneal` and not to read:

- `SKILL.md`
- `README.md`
- `rubrics/`
- `fitness.md`
- `scorecard.md`
- `baseline-result.md`
- `anneal-result.md`

It allowed reading only:

- `task.md`
- `fixture.json`

## Control result

Chosen direction: refined table.

This was a stronger baseline than expected. Claude reasoned that the fixture is
mostly attributes rather than topology:

- owner, scope, and risk are columns
- overrides are thin row-level badges
- shared tools are a secondary many-to-many question
- risk ownership triage benefits from sorting and filtering

## /anneal dogfood result

Chosen direction: refined table.

The `/anneal` result produced the expected five-question fitness oracle and the
expected score ordering:

| Direction | Score |
|---|---:|
| Refined table | 10 |
| Grouped cards | 7 |
| Matrix | 7 |
| Node-link graph | 6 |

It also explicitly separated direction-fitness from polish and called out
fixable polish issues that should not disqualify the table.

## Interpretation

This run does not prove that anneal uniquely finds a better final direction than
a capable baseline. The control also picked the table.

What it does show:

- anneal turns the choice into an auditable score table
- anneal records rejected-direction reasons
- anneal keeps polish from choosing or eliminating the direction

## Caveat

The control prompt restricted expected-result files, but the `/anneal` prompt
targeted the fixture directory. Unless the raw transcript proves otherwise, the
dogfood run may have had access to `scorecard.md` and the expected-result files.

That stronger verification was run next; see
`observed-run-2026-05-30-clean.md`.
