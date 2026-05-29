# Default polish rubric (oracle #2)

Scores **how well an *already-chosen* artifact is executed** during Phase B (iterate-to-green) on the single winning direction.

**This rubric is never used to pick direction.** Direction is ranked and chosen in Phase A by the direction-fitness oracle alone (`default.direction-fitness.md`). A polished incumbent out-scores a rough challenger on polish every time, so using polish to choose direction would pull the loop straight back into the local optimum — the exact failure this skill exists to prevent. Polish only refines the winner; it does not select it.

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

Score = sum of the four lenses, **except** `tests = 0` is an overriding gate: a failing test suite blocks acceptance no matter how high the total. The loop stops when no lens improves across **2 consecutive rounds** (loop-until-dry); the workflow enforces this alongside max-rounds and the budget cap.
