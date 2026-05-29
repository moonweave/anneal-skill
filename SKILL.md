---
name: anneal
description: |
  User-invoked self-improvement loop. Diverges K candidate directions for a
  target, picks the best by a measurable direction-fitness oracle (NOT by
  polish), then iterates the winning direction to green by a polish rubric —
  escaping the local-optimum trap of single-track polishing. Manually triggered
  via `/anneal` only — never auto-invoked. Use when the user types `/anneal`
  optionally followed by a target. Without a target, resolve the pending target
  from the prior assistant message, else ask. Drives the bundled `Workflow`
  engine script `workflow/anneal.workflow.js`, isolating each prototype and
  iterate round in its own worktree.
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
  - Workflow
---

# /anneal — Diverge, Pick Best Direction, Iterate to Green

## 1. When to Run

Only when the user types `/anneal`, optionally followed by a target. Never auto-invoke. The description gate above explicitly forbids automatic firing — even when the user is mid-task on something that looks improvable, do not fire unless they type `/anneal`.

## 2. Input Resolution

Resolve the target using these rules in order:

1. **If `/anneal` is followed by text** → the leading text (before any `--flag`) is the `target`. Use it verbatim. It is a path or a short description.
2. **If `/anneal` has no leading target** → take the obvious pending target from the most recent assistant message (the file, component, or artifact the prior turn was working on). If exactly one candidate is evident, use it and announce: `Annealing: <target>. If wrong, re-run with /anneal <target>.`
3. **If no target is resolvable** → ASK (AskUserQuestion) for the target. Do not guess.

Parse optional flags after the target. Map each to a workflow arg exactly:

| Flag | Workflow arg | Notes |
|---|---|---|
| `--goal "<measurable fitness>"` | `goal` | the direction-fitness goal string (§3) |
| `--rubric <path>` | `rubricPath` | absolute or repo-relative path to the polish rubric |
| `--directions N` | `directions` | K, number of candidate directions (default 2) |
| `--judges M` | `judges` | independent direction-fitness judges (default 1) |
| `--max-rounds R` | `maxRounds` | hard cap on Phase B iterate rounds (default 4) |
| `--budget <tokens>` | `budget` | hard per-run token cap for Phase B (default none) |
| `--checkpoint direction\|destination` | controls run flow (§4/§5) | NOT a workflow arg — the skill reads it (default `destination`) |

`perPrototypeBudget` (default 40000) has no flag and is not exposed — leave it at the engine default (omit it from `args`).

**`args.goal` is ALWAYS materialized.** The concrete measurable goal must be set on `args.goal` as an explicit string before invoking the workflow — whether it was inferred from the target (§3.1) OR supplied via `--goal`. When inferring, synthesize a specific measurable goal string yourself (e.g. for `./src/parser` with a test suite: `goal: "test suite pass-rate (passing tests / total)"`; for a perf target with a bench: `goal: "csv-bench rows/sec, higher is better"`). The engine has NO default for `goal` — it interpolates `${a.goal}` raw into every proposer/builder/judge prompt — so an unmaterialized/empty goal sends "undefined" downstream and guts the direction-fitness oracle the entire skill exists for.

**judges semantics.** `judges=1` (the cheap default) ranks directions DIRECTLY by each prototype's measured fitness — NO extra judge agents are spawned. `judges>1` spawns that many independent judges per prototype to score the builder-reported evidence, mean-aggregated. Default to 1; only raise it when the user asks for cross-checked scoring.

## 3. Sweet-spot vs weak-case gate (the two-oracle rule)

**Two-oracle rule (load-bearing — read before running):** there are two distinct oracles and they must never be conflated. Oracle #1 is the **direction-fitness** oracle: a hard, measurable, task-based signal that ranks WHICH direction is better. Oracle #2 is the **polish** rubric: it grades how well the already-chosen artifact is executed. **The polish rubric must NEVER be used to choose direction.** Direction is chosen only by the measurable direction-fitness oracle; polish only refines the already-chosen winner. A polished incumbent out-scores a rough challenger on polish every time, so letting polish pick direction pulls the loop straight back into the local optimum — the exact failure this skill exists to prevent.

Before running, determine the direction-fitness signal:

1. **Is a hard, measurable oracle inferable from the target** — performance → a benchmark, correctness → a test suite, plus coverage %, bundle size, p95 latency, peak memory — OR was one supplied via `--goal`? If yes → **materialize it into `args.goal` as an explicit measurable goal string** (synthesize one when inferring, per §2's "`args.goal` is ALWAYS materialized" rule), then proceed to §4.

2. **If no oracle is inferable from the target AND no `--goal` was supplied** (taste-laden UI/visual is the canonical example, but any non-measurable target qualifies — e.g. "improve this CLI's error messages", "make this prose clearer") → ASK ONCE (AskUserQuestion) for a **task-based** measurable fitness. Give concrete examples in the prompt so the user can answer in kind:
   - "clicks/steps to find an orphan node" (fewer is better)
   - "can the single riskiest item be spotted in one view? (y/n)"
   - "seconds to locate setting X" (smaller is better)
   The goal must be a number or a yes/no on an operationalized task — not "looks better" or "feels cleaner."

3. **If the user still cannot give a measurable goal** → enter **polish-only mode**, but ONLY after an explicit warning and the user's acceptance. State plainly: *polish-only mode cannot discover direction — it has no fitness signal to rank directions with, so it only refines the single existing direction by the polish rubric. It will not find a better direction; it can only make the current one cleaner.* Proceed only if the user accepts that limitation. Never silently fall back — direction-discovery is never faked using the polish rubric.

## 4. Run protocol

**Cost envelope (announce in one line before running).** Estimate the isolated agents this run may spawn — each prototype and each iterate round runs in its own worktree:

```
≈ 1 proposer + <directions> builders + (judges>1 ? directions×judges judge agents : 0) + up to <maxRounds> iterate rounds
```

For the cheap default (directions=2, judges=1, maxRounds=4): ≈ 1 proposer + 2 builders + 0 judges + up to 4 iterate rounds. State this as an upper bound before invoking.

This envelope is **per workflow call**. `checkpoint=direction` makes TWO calls (§4 steps 1 and 4), and the second re-runs Phase A — so that path spawns Phase A roughly twice (≈ 2 proposers + 2×directions builders [+ 2×judges if judges>1]) on top of the iterate rounds. Announce the doubled Phase A when `--checkpoint direction` is in effect.

**Paths.** Use the skill's base directory (provided when the skill loads) to build the absolute `scriptPath`. Do NOT hardcode any personal `/Users/...` path.
- `scriptPath` = `<SKILL_BASE_DIR>/workflow/anneal.workflow.js`
- `rubricPath` = `<SKILL_BASE_DIR>/rubrics/default.polish.md` unless `--rubric` was given (then use the user's path, absolute or repo-relative).

**The workflow is invoked with the built-in `Workflow` tool** (listed in `allowed-tools`): `Workflow({ scriptPath, args })`, where `args` carries the §2-mapped fields (`target`, `goal`, `directions`, `judges`, `maxRounds`, `rubricPath`, and `budget` when set; omit `perPrototypeBudget`). It returns `{ winner, rounds, decisionLog }`, or `{ error, ... }` if no scorable direction.

### checkpoint=destination (default)

Invoke `Workflow({ scriptPath, args })` once for the full run (Phase A direction search → Phase B iterate). Then go to §5.

### checkpoint=direction

1. **First call — Phase A only.** Invoke the workflow with the SAME `args` but `args.maxRounds = 0`. With `maxRounds = 0`, Phase B runs zero rounds: the workflow diverges, builds, scores, picks the winner, and returns `rounds: 0` with a `decisionLog`.
2. **Present the direction decision.** From `decisionLog`, surface the winning direction (with its evidence) and the rejected ones (with why each lost).
3. **Gate.** Use AskUserQuestion to let the user approve the winning direction, or abort, or redirect.
4. **On approval — second call, full iterate.** Invoke the workflow AGAIN with the SAME `args` except restore `maxRounds` to the user's value (default 4). Only `maxRounds` differs between the two calls.
5. **Honest caveat.** The second call re-runs Phase A (direction search), so it may re-confirm the same winner or, rarely, pick a different direction. State this plainly to the user. The user's final safety net is the branch diff.

**Budget.** Never silently exceed the budget cap. The `budget` arg enforces the per-run cap, and the loop keeps a ~50,000-token reserve: **a `budget` below ~50k yields zero Phase B rounds** (the loop's remaining-budget guard is already below the reserve). Surface that to the user if they pass a tiny budget.

## 5. Output

Present the converged result plus the decision log:

- **Winner** — the chosen direction and its measured fitness evidence (why this direction won).
- **Rejected** — the other directions with their fitness (the `decisionLog` rejected entries are `summary (fitness)`); add the one-line reason the winner beat them.
- **Rounds** — Phase B iterate rounds and their polish scores (`rounds: 0` means Phase B did not run — e.g. checkpoint=direction first call, or a sub-reserve budget).

For checkpoint=direction, the direction decision was already surfaced before Phase B (per §4) — do not re-litigate it; report the iterate outcome and the final state.

Changes land on the working branch (the worktrees fold back in). The user reviews by diff or PR — name that explicitly.

## 6. Honest limits

State these to the user when relevant; do not oversell convergence.

1. **Taste / UI is the weak case.** It converges on "best per the encoded rubric," not objective best. It needs a user-supplied task-based fitness (§3) or the `--checkpoint direction` human-in-the-loop gate.
2. **Loops are token-heavy.** The budget cap is mandatory, not advisory — and the ~50k reserve means a tiny budget does no iterating at all (zero Phase B rounds).
3. **Divergence breadth bounds discovery.** Only the K proposed directions are explored; the run logs what was and was not explored. Raising `--directions` widens the search at linear cost.
4. **Judges share the generator's model priors.** They are not independent evidence; distinct framing helps but does not remove shared bias. More judges reduce variance, not shared error.
5. **checkpoint=direction re-runs direction search on approval** (re-divergence caveat, §4). It may re-confirm or rarely differ; the diff is the safety net.
6. **Agents can broaden scope inside a rich repo.** When the target sits in a project with other tempting files, the worktree agents may improve the surrounding code rather than the target. Isolate the target or scope the goal tightly (e.g. "optimize only this file; do not touch anything else").
7. **A non-finalizing sub-agent aborts the run.** If any prototype or iterate agent finishes without emitting its structured result, the whole run errors (no graceful degradation). Re-run if it happens.

## 7. Error handling

- **No inferable or supplied oracle** → take the §3 polish-only path: ask first for a task-based goal, warn that polish-only cannot discover direction, and proceed only on acceptance. Never silently default to polish.
- **Budget hit** → stop and report what was reached (winner, rounds completed, final polish score). Do not exceed the cap to "finish."
- **A prototype that cannot be scored** → the engine drops it (`.filter(Boolean)`) and the run continues with the remaining directions; note the drop. If NO direction is scorable, the workflow returns `{ error: 'no scorable direction', directions: [...] }` → report the error and the attempted directions, then stop.
- **Workflow returns `{ error: 'no directions proposed' }`** → report it and stop; the proposer produced nothing usable.
- **Target missing or unresolvable** → ASK (§2). Do not guess a target.
