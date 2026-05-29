# Self-eval fixture: `dup-finder` — asserted convergence

This is anneal's own oracle: a known-good convergence target that validates the
mechanism on a **hard** (measurable) signal, not on taste. `target.py` is a
deliberately naive O(n²) duplicate finder; a hash-set O(n) rewrite is provably,
asymptotically faster. The expected anneal run is documented below — this file is
prose, not a test harness.

## Direction-fitness goal (oracle #1)

- **Signal:** `benchmark()` elapsed seconds, **lower is better**.
- **Baseline:** the naive O(n²) finder at n=9000 takes on the order of a second
  (≈1–1.4s, machine-dependent). The value printed by `python3 target.py` is the
  live baseline — use that, not a hardcoded number.
- **Dogfood goal:** `elapsed < baseline / 5`.

This is a measurable, task-based signal a stopwatch reads directly — exactly the
kind of goal oracle #1 requires, never "looks cleaner."

## Asserted winning direction (Phase A)

Phase A diverges at least two directions, e.g.:

- **D1 — optimize the nested O(n²) loop** (early exits, local var hoisting, etc.).
- **D2 — switch to a hash-set O(n)** (count sightings in a dict/set, emit a value
  on its second sighting).

**D2 must win the direction-fitness oracle.** O(n) vs O(n²) is asymptotically
decisive at this n: a fully polished O(n²) still does ~40M pair comparisons,
while a rough O(n) does ~9k lookups and finishes in well under a millisecond. The
challenger wins by measurement even while half-built — micro-optimizing the
incumbent loop cannot close an asymptotic gap.

## Correctness contract (so Phase B is unambiguous)

`find_duplicates` returns the **set** of values appearing more than once, as a
sorted list (each duplicated value once, not once per colliding pair). Correctness
= the O(n) rewrite returns the **same set of values** as the baseline. Returning
sorted output makes this order-independent: emission order differs between the
O(n²) and O(n) paths, and that difference does not matter.

## Phase B assertion (iterate-to-green)

After D2 is chosen, Phase B iterates it against the polish rubric to green:

1. **Correctness preserved** — same set of duplicates as the baseline (the
   `tests` hard gate).
2. **Elapsed comfortably under threshold** — the O(n) version clears
   `baseline / 5` (≈0.2s) by roughly three orders of magnitude.

## What this validates

The **two-oracle separation on a hard oracle**: anneal chooses the genuinely
better *direction* by measurement (oracle #1, elapsed time), then polishes only
the winner (oracle #2). It does **not** sink the run into polishing the incumbent
O(n²) loop — which is precisely the local-optimum trap the skill exists to escape.
This is the **opposite of the README's weak (taste) case**: here the oracle is
objective, so convergence on the best direction is provable, not a judgment call.
