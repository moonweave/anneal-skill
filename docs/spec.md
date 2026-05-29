# anneal — design spec

> **⚠️ Superseded — historical design record.** This spec describes the original *heavyweight
> multi-agent + git-worktree engine*. That engine was removed: review showed it cost ~10× the
> tokens, added failure modes, and didn't beat just prompting a capable agent well. anneal is now
> a **lightweight measure-first discipline** — see `SKILL.md` and `README.md`. Kept here for the
> design rationale and the two-oracle reasoning, which carried over.

> A user-invoked self-improvement loop for **any** software/agent project that can expose a
> verifiable signal. Given a target, it cheaply explores several candidate **directions**,
> picks the best by a direction-fitness oracle, then iterates that winner to completion —
> escaping the local-optimum trap of single-track polishing. The user reviews the destination
> and a decision log, not every step.

## Name

`anneal` — from simulated annealing: explore broadly, then converge toward a global optimum
while escaping local minima. It is a **development workflow skill**, not a science tool; the
name only describes the optimization behavior. Invoked as `/anneal`. (Published to
`github.com/moonweave/anneal-skill`.)

## Positioning (why this, vs. prior art)

- **Ralph / Smart Ralph**: single-track "iterate one thing until done." Solves *execution*,
  never changes direction → stuck at the local optimum.
- **GSD / BMAD / Spec Kit**: spec → multi-agent *execution*. Also single-direction once the
  spec is fixed.
- **anneal adds the missing stage on top of these:** cheap **direction discovery + judging**
  *before* the iterate-to-done loop. The execution half is deliberately the solved part
  (it can even delegate to GSD/Ralph); anneal's contribution is the direction-search half.

Justification for skill-hood (vs. a bare saved Workflow): it bundles a reusable protocol +
default direction-fitness oracle + polish rubric + safety defaults + honest-limit gating that
a raw script would force every user to re-derive.

## Where it shines vs. struggles (read this before using)

The mechanism is only as good as the **direction-fitness oracle** available for the target.

- **Sweet spot — hard oracle ranks directions:** performance ("make X faster" → benchmark),
  correctness ("pass this suite" → tests), coverage, build-size, latency, memory. Here anneal
  converges cleanly on the genuinely-best direction.
- **Weak case — direction quality is taste-laden:** UI/visual design. There is no cheap
  objective signal for "is a graph view a better direction than a table view," so anneal
  degrades toward whatever the rubric *can* measure (polish), unless the user supplies a
  **task-based** fitness definition (below). The motivating graph-vs-table dashboard example is
  deliberately the *worst* case for the mechanism; treat it as the honest stress test, not the
  showcase.

## The two oracles (the core design correction)

Conflating these is the failure mode the whole design exists to avoid:

1. **Direction-fitness oracle** — answers "which *direction* is better." Must be **task-based
   and measurable**, not an aesthetic of a built artifact. Examples: benchmark delta, test
   pass-rate, coverage, or for UI, an operationalized task ("steps/clicks to find an orphan
   node," "can the riskiest item be spotted in one view"). A rough-but-better direction can
   *win this* even while half-built.
2. **Polish rubric** — answers "how well is *this artifact* executed": lint, type-check, build,
   anti-patterns, a11y, style-guide conformance. Used to drive the iterate-to-green loop on the
   *already-chosen* direction.

**Critical rule:** polish rubric must NOT be used to choose direction. A polished incumbent
out-scores a rough challenger on polish every time, which would pull the loop back into the
local optimum. Direction is chosen by oracle #1 only; oracle #2 only refines the winner.

## Core mechanism: two phases

Engine = the built-in **`Workflow`** tool. The skill authors and runs a Workflow script; it
does not hand-orchestrate from the main loop.

**Phase A — Direction search (cheap, runs once or rarely).**
1. **Diverge.** Propose K distinct candidate directions and build each as a *lightweight
   prototype* — just enough to be scored by the direction-fitness oracle, not a full build.
   `log()` what directions were and were not explored (no silent caps).
2. **Score.** A judge panel scores each prototype on the **direction-fitness oracle** (oracle #1),
   distinct lenses per judge. The generator's self-assessment does not count.
3. **Pick.** Select the winning direction. If a non-incumbent wins, switch to it.

**Phase B — Iterate winner to completion (the expensive loop).**
4. Run the iterate-to-green loop (this is the Ralph/GSD-style solved part) on the winning
   direction, driven by the **polish rubric** (oracle #2): build → test/lint → fix → repeat.
5. **loop-until-dry:** stop when K consecutive rounds find no rubric improvement, OR max-rounds,
   OR token budget — whichever first.

**Bounded re-divergence (anti-oscillation).** Phase A may re-run at most R times (default low),
and proposed directions are deduped against the set of **already-seen** directions, not against
"confirmed/accepted" ones. (Dedup against accepted-only lets rejected directions reappear every
round and the loop never goes dry — an explicit safeguard, learned from the loop-until-dry
research.) Re-divergence is for genuinely-new directions only.

**Output:** the converged result **plus a decision log** ("why this direction won, what changed,
what was rejected and why"). The user reviews this, not every step.

## Cost model & defaults (distributable-tool discipline)

A naive N-directions × judge-panel × many-rounds × worktrees run can be a surprise bill on a
first `/anneal`. Therefore:

- **Default = cheap mode:** small K (e.g., 2 directions), single judge, low max-rounds, modest
  budget cap. Reports estimated cost before scaling.
- **Opt-in scaling:** `--directions N`, `--judges M`, `--max-rounds`, `--budget` raise the
  ceiling explicitly.
- The skill `log()`s the cost envelope and refuses to silently exceed the budget cap.

## Critic / rubric model (distributability)

- **Bundled defaults (work out of the box):** a default polish rubric (tests/lint/type/build +
  a generic "reduces real complexity vs. adds surface" heuristic) and a default direction-fitness
  prompt that asks the user to name the measurable goal if none is inferable.
- **Pluggable:** `--rubric <path>` to an `anneal.rubric.md` adding domain lenses; for UI targets
  the skill best-effort **detects** design references / a browser-a11y MCP if present and adds
  them as polish judges, else falls back. Detection is never required.
- Lenses score numerically so candidates are comparable.

## Safety (enforced inside the Workflow script — no settings.json edits required of installers)

- **Token budget cap** (hard), **worktree isolation** for parallel prototypes, **max-rounds**
  independent of the dry-streak, optional **human checkpoint** at direction-convergence
  (`--checkpoint direction|destination`, default `destination`). Changes land on a feature
  branch; the user reviews by PR/diff.

## Judge independence (known limit)

Judges are the same model as the generator → shared priors. Mitigation: distinct lenses per
judge, and if a second model is configured, route at least one judge to it (cross-model). The
skill states this limit rather than implying judge votes are independent.

## Invocation

```
/anneal <target>                                  # cheap default mode, bundled rubric
/anneal <target> --goal "<measurable fitness>"    # supply direction-fitness when not inferable
/anneal <target> --rubric <path>                  # pluggable polish rubric
/anneal <target> --directions N --judges M --max-rounds R --budget <tokens> --checkpoint direction
```

`<target>` is a path or short description. Without a target, the skill asks (does not guess).
If no direction-fitness oracle is inferable and none is supplied, the skill says so and asks
for a measurable goal rather than faking convergence on polish.

## Components

- `SKILL.md` — trigger ("Use when …"), invocation contract, two-phase protocol, the two-oracle
  rule, honest sweet-spot/weak-case framing, limits.
- Bundled Workflow script (or emitted template) implementing Phase A/B + safety wrappers.
- Default polish rubric + default direction-fitness prompt, shipped with the skill.
- `README.md`, `LICENSE`, `.gitignore`.

## Self-evaluation (the skill needs its own oracle)

Ship an **eval fixture**: a target with a known-good convergence on a *hard-oracle* axis (e.g.,
a slow function where a known algorithm is provably fastest), asserting anneal picks that
direction and reaches the benchmark. This validates the mechanism without relying on taste.

## Honest limits

- Logic/perf/coverage targets converge on "correct/best"; taste targets converge on "best per
  the encoded rubric," not objective best — and need a user-supplied task-based fitness or a
  human checkpoint. The skill says so up front.
- Loops are token-heavy; the budget cap is mandatory, not advisory.
- Divergence breadth bounds discovery; the skill logs what was not explored.
- Judges share model priors (see above).

## First testbed

The first real-world target is deliberately a *weak-case* UI dashboard with no test oracle yet —
the honest stress test, not the showcase. A first anneal run there should (a) build a hard logic
oracle (e.g. an adapter test suite) for the parts that admit one, then (b) for the UI direction,
require a task-based fitness ("steps to find an orphan item / spot the riskiest entry").
A conclusion like "a graph view beats a table" is a hypothesis to be tested by that task-oracle,
not a built-in assumption.

## Open questions (resolve in writing-plans)

1. Lightweight-prototype fidelity: how little can be built and still scored by the direction oracle?
2. Default direction-fitness prompt: how to elicit a measurable goal from the user when none is inferable.
3. Bundled Workflow script as committed file vs. emitted template.
4. Default polish-rubric contents + numeric scoring scheme per lens.
5. Re-divergence cap R + the seen-set dedup key.
6. UI-critic auto-detection: which references/MCPs to probe, and the fallback.
7. Cross-model judge routing: optional dependency or skip if unavailable.
8. Eval-fixture target choice for self-evaluation.
