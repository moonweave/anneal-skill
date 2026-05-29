# anneal — design spec

> A user-invoked self-improvement loop for software/agent systems. Given a target,
> it generates several candidate directions, judges them against a rubric, converges
> on the best, and iterates that winner to completion — escaping the local-optimum
> trap of single-track polishing. The user reviews the destination and a decision
> log, not every step.

## Name

`anneal` — borrowed from simulated annealing: explore broadly, then converge toward a
global optimum while escaping local minima. It is a **development workflow skill**, not a
science tool; the name only describes the optimization behavior. Invoked as `/anneal`.

## The problem it solves

A plain iterate-to-done loop (Ralph-style) keeps improving whatever it started with — so it
gets stuck in a local optimum (e.g., "a nicer table view") and never *discovers* that a
different direction (e.g., a graph view) is better. anneal adds an explicit **divergence +
judging** stage so the loop can change direction on its own evidence, then converge.

## When to use / when NOT to use

**Use when:** the target has (or can be given) a **verifiable oracle** — a test suite,
linter, type-checker, build, or measurable criterion — so candidates can be scored without
a human in the loop each round. Good for: building out a bounded system, refactoring toward
a target, exploring "which architecture/UI direction is best" where direction quality is
checkable against a rubric.

**Do NOT use when:** there is no verifiable signal and success is pure taste or novel product
direction. The skill states this honestly and refuses to fake convergence. (It can still run
with a weak oracle, but says so and recommends human checkpoints.)

## Core mechanism: diverge → evaluate → converge → loop-until-dry

Engine = the built-in **`Workflow`** tool (deterministic multi-agent orchestration). The skill
authors and runs a Workflow script; it does not hand-orchestrate from the main loop.

1. **Diverge.** Generate N candidate directions for the target (e.g., view types, architectures,
   information structures). Divergence breadth is a parameter — narrow breadth = narrow
   discovery, so the skill picks ≥3 distinct directions by default and `log()`s them.
2. **Evaluate (judge panel).** Score each candidate against the rubric with independent judge
   agents (distinct lenses, not N identical voters). A candidate must win on the rubric, not
   on the generator's self-assessment.
3. **Converge.** Select the winner; if a non-incumbent direction wins, switch to it. Iterate
   the winner toward completion.
4. **loop-until-dry.** Keep improving the winner until K consecutive rounds find no rubric
   improvement, or the token budget is hit. Re-run divergence periodically so a late-emerging
   better direction can still be found.
5. **Output.** The converged result **plus a decision log** ("why this direction, why these
   changes" — a REFLECTION). The user reviews this, not every step.

## Critic / rubric model (the distributability crux)

The critic is what makes autonomy work, and what makes the skill usable by people other than
the author. Two-part design:

- **Bundled default rubric (works out of the box):** logic oracle (tests pass + lint/typecheck
  + build green) plus a generic quality heuristic ("does this candidate answer a real question
  / reduce real complexity, vs. add surface?"). No private dependencies required.
- **Pluggable rubric (power users):** the user points `/anneal` at a rubric file
  (`anneal.rubric.md` or a path arg) that adds domain lenses. For UI/frontend targets, the
  skill **detects** common design references if present (e.g., a web-interface-guidelines file,
  an accessibility audit via a browser MCP) and uses them as additional judges; otherwise it
  falls back to the default. Detection is best-effort and never required.

Rubric entries are scored numerically per lens so the judge panel produces a comparable score
across candidates.

## Safety (enforced inside the Workflow script, no settings.json edits required)

Bundled so installers don't have to touch their harness:

- **Token budget cap** — hard ceiling; the loop stops and reports when reached.
- **Worktree isolation** — parallel candidates run in isolated git worktrees so they cannot
  clobber each other.
- **Max-rounds** — bound on total rounds independent of the dry-streak counter.
- **Human checkpoint** — optional pause at direction-convergence (configurable: destination-only
  vs. one checkpoint when the winning direction is chosen).
- Changes land on a feature branch; the user reviews via PR / diff at the destination.

## Invocation

```
/anneal <target>                       # use bundled default rubric
/anneal <target> --rubric <path>       # pluggable rubric
/anneal <target> --budget <tokens> --max-rounds <n> --checkpoint direction|destination
```

`<target>` is a path or a short description of the system to improve. Without a target, the
skill asks for one (it does not guess).

## Components

- `SKILL.md` — trigger ("Use when …"), invocation contract, the loop protocol, honest limits.
- Bundled Workflow script (or an inline script template the skill emits) implementing
  diverge→evaluate→converge→loop-until-dry with the safety wrappers.
- Default rubric file shipped with the skill.
- `README.md` — public usage; `LICENSE`; `.gitignore`.

## Human role

Define the target (and optionally a rubric). Review the **destination + decision log**, not
every step. Optionally a single direction-convergence checkpoint. This is the "automate the
work + automate the verification, keep the judgment" split.

## Honest limits

- Pure logic converges on "correct"; UI/taste converges on "best per the encoded rubric," not
  objective best. The skill says so.
- Loops are token-heavy; the budget cap is mandatory, not advisory.
- Divergence breadth bounds discovery: too few candidates → it cannot find a far-better
  direction. The skill `log()`s what was and wasn't explored (no silent caps).

## First testbed

AgentOps (`~/AgentOps/`) — the author's cross-tool agent-config dashboard, currently table-centric
with no test oracle. Expected (not forced) convergence toward a graph view. First anneal round
on AgentOps should likely build the adapter test oracle (logic scorer) before UI divergence.
See `~/AgentOps/SELF_IMPROVEMENT_LOOP_SPEC.md` and `DASHBOARD_GRAPH_VIZ_RESEARCH.md`.

## Distribution

Self-contained git repo at `~/ai-skills-dev/my-skills/anneal-skill/`, published to
`github.com/moonweave/anneal-skill` (mirrors decide-skill / compass-skill).

## Open questions (resolve in writing-plans)

1. Bundled Workflow script as a committed file vs. a template the skill emits each run.
2. Default-rubric concrete contents and the numeric scoring scheme per lens.
3. Divergence candidate count default + how directions are proposed (one generator agent vs. a
   diverse panel).
4. UI-critic auto-detection: which references/MCPs to probe for, and the fallback rubric.
5. Re-divergence cadence (every round vs. every K rounds vs. on dry-streak).
6. Checkpoint default (destination-only vs. direction-convergence).
