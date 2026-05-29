# Worked example: `dup-finder`

A walk-through of the discipline on a measurable target. `target.py` is a
deliberately naive O(n²) duplicate finder; a hash-set O(n) rewrite is provably,
asymptotically faster. This file is prose, not a test harness.

> **Caveat:** this is a *known-answer* case — the O(n) direction is obvious, so in
> practice you'd **skip** anneal here and just write it. It's used only to
> illustrate the steps cleanly. The discipline earns its keep on a *non-obvious*
> fork, which by nature has no fixed answer to ship as a fixture.

## Step 1 — operationalize the fitness (the measurable signal)

- **Signal:** `benchmark()` elapsed seconds, **lower is better**.
- **Baseline:** the naive O(n²) finder at n=9000 takes on the order of a second
  (≈1–1.4s, machine-dependent). The value printed by `python3 target.py` is the
  live baseline — use that, not a hardcoded number.
- **Goal:** `elapsed < baseline / 5`.

A stopwatch reads this directly — exactly the kind of signal oracle #1 requires,
never "looks cleaner."

## Steps 2–4 — sketch directions, measure, pick by the number

Sketch at least two distinct directions:

- **D1 — optimize the nested O(n²) loop** (early exits, local var hoisting, etc.).
- **D2 — switch to a hash-set O(n)** (count sightings in a dict/set, emit a value
  on its second sighting).

**D2 wins by measurement.** O(n) vs O(n²) is asymptotically decisive at this n: a
fully polished O(n²) still does ~40M pair comparisons, while a rough O(n) does
~9k lookups and finishes in well under a millisecond. The challenger wins on the
*number* even while half-built — micro-optimizing the incumbent loop cannot close
an asymptotic gap. (This is the whole point: you pick by the measurement, not by
which is more polished.)

**Correctness contract:** `find_duplicates` returns the **set** of values
appearing more than once, as a sorted list. Correctness = the O(n) rewrite returns
the **same set of values** as the baseline; sorting makes the comparison
order-independent (emission order differs between the two paths and doesn't matter).

## Step 5 — refine the winner

After D2 is chosen, polish it to done (now polish is welcome):

1. **Correctness preserved** — same set of duplicates as the baseline.
2. **Elapsed comfortably under threshold** — the O(n) version clears `baseline / 5`
   (≈0.2s) by roughly three orders of magnitude.

## What it illustrates

The **two-oracle separation**: you choose the genuinely better *direction* by
measurement (oracle #1, elapsed time), then polish only the winner (oracle #2) —
you do **not** sink effort into polishing the incumbent O(n²) loop, which is the
local-optimum trap the discipline exists to avoid. Because the oracle here is
objective, the better direction is provable rather than a judgment call — the easy
case, deliberately, so the steps are clear.
