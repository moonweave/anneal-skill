# Observed clean Claude run: 2026-05-30

This note summarizes the clean control/dogfood run reported from Claude Code.
It is a summary, not a raw transcript.

The clean fixture was:

- `eval/non-obvious-fork-clean/task.md`
- `eval/non-obvious-fork-clean/fixture.json`

No `fitness.md`, `scorecard.md`, or expected-result files were present in the
clean fixture directory.

## Clean control result

Chosen direction: refined table.

The no-anneal control also identified the dataset shape correctly:

- each item has one owner, one scope, and one risk value
- relationships are sparse item-to-tool edges
- overrides are only two shallow precedence records
- a table answers risk-ownership triage with the lowest build cost

This is a stronger baseline than the original expected failure. The control did
not fall into the "relationships therefore graph" trap.

## Clean /anneal dogfood result

Chosen direction: refined table.

The `/anneal` run generated its own five-question direction-fitness oracle and
scored candidates as follows:

| Direction | Score |
|---|---:|
| Refined table | 9 |
| Grouped cards | 8 |
| Node-link graph | 7 |
| Matrix | 2 |

Important detail: the generated oracle deliberately included a graph-favorable
question about tool fan-in. The graph won that question, but still lost overall.

## Interpretation

This clean run supports a narrower, more defensible claim:

- anneal did not change the final winner versus a capable baseline
- anneal did produce a measurable decision artifact
- anneal gave the graph a fair home-ground question before rejecting it
- anneal separated direction-fitness from polish and listed fixable table issues

So the market-facing claim should be: anneal makes non-obvious direction choices
auditable and repeatable. This fixture does not prove that anneal uniquely finds
a winner a good baseline would miss.

## Mismatch against the earlier held-out scorecard

The earlier scorecard expected `table=10`, `cards=7`, `matrix=7`, `graph=6`.
The clean run produced `table=9`, `cards=8`, `graph=7`, `matrix=2`.

That mismatch is acceptable and useful:

- the winner stayed stable
- the clean run used a more adversarial question set by giving graph a fair
  chance on tool fan-in
- matrix scored lower because the clean run treated it as a specialist view that
  cannot represent owner, scope, risk, and override together

Future evals should compare winner stability and decision quality, not exact
score identity.
