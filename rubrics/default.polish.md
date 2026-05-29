# Default polish rubric (oracle #2)

Scores **how well an *already-chosen* artifact is executed** when you iterate the winning direction to done (step 5 of the discipline).

**This rubric is never used to pick — or eliminate — a direction.** Direction is ranked and chosen by the direction-fitness oracle alone (`default.direction-fitness.md`). A polished incumbent out-scores a rough challenger on polish every time, so using polish to choose direction pulls you straight back into the local optimum — the exact failure this skill exists to prevent.

**Corollary (learned the hard way): a *fixable* hygiene issue must not knock the substantively-best candidate out of contention.** If the best-on-substance option fails a lint/a11y/style check that is routine to fix, *remediate it and then compare* — never let an eligibility gate hand the win to a worse-but-cleaner option. Polish refines the winner; it does not select it and it does not disqualify it.

## Lenses

Each lens scores `0-3` unless noted.

| Lens | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| `tests` | any test fails (**HARD GATE** — a `0` here blocks acceptance regardless of every other score) | most tests fail | a few fail or flaky | all pass |
| `lint_type` | errors that block the build / pervasive | a handful of errors | warnings only | clean lint + type-check |
| `build` | build broken | — | — | builds clean |
| `complexity_delta` | pure addition — adds surface area while removing nothing (strictly grows: new branches, params, abstractions, no offsetting deletion) | adds *and* removes, but nets more surface than it removes | roughly neutral / small real simplification | clearly reduces real complexity (deletes branches/abstractions, collapses special cases) |

`build` is **binary: `0` or `3` only** — a build either works or it does not; there is no partial credit.

## Combining

Score = sum of the four lenses, **except** `tests = 0` is an overriding gate *for the final winning artifact*: you don't ship a chosen direction whose tests fail. (This gate applies to finishing the winner — not to comparing direction candidates, where fixable failures are remediated first per the corollary above.) Stop iterating when no lens improves across **2 consecutive rounds**, or once it's good enough — keep it cheap.
