---
name: anneal
description: |
  A measurement-first decision discipline for choosing HOW to build something.
  Before pouring effort into one approach, operationalize a measurable fitness,
  sketch a few candidate directions, cheaply score each by that fitness, and
  pick the winner by the number — not by taste, and not by polish. Lightweight
  and inline: it is a discipline, not a multi-agent engine. Manually triggered
  via `/anneal` only — never auto-invoked. Use when the user types `/anneal`,
  typically at a fork where the best approach is not obvious.
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

# /anneal — Measure Before You Commit

A lightweight discipline: at a fork, explore a few directions and let a **cheap measurement** pick the winner, before you invest in the expensive build. Named for simulated annealing (explore, then converge) — but it is a checklist you run inline, not an engine you launch.

## 1. When to run

Only when the user types `/anneal`. Never auto-invoke.

Run it at a **decision fork where the best approach is not obvious** — and run it **cheap and early**, before significant effort goes into any one direction.

- **Skip it when the direction is obvious** (e.g. an O(n) hash-set plainly beats an O(n²) loop). Measuring obvious choices is pure overhead — just build it.
- **Use it when your intuition might be wrong** — competing approaches where only a measurement can say which wins (cache vs. better algorithm vs. precompute; table vs. graph; index vs. denormalize).

## 2. The two oracles — the rule this skill exists to enforce

There are two different scorers, and conflating them is the failure mode:

1. **Direction-fitness oracle** — answers *"which direction is better?"* It must be **measurable and task-based**: a benchmark number, a test pass-rate, coverage, or for taste targets an operationalized task ("clicks to find an orphan node"). This, and only this, picks the direction.
2. **Polish rubric** — answers *"how well is this one executed?"*: tests, lint, build, complexity. It refines the **already-chosen winner**.

**Polish must never pick or eliminate a direction.** And the sharp corollary, learned the hard way: **a *fixable* hygiene issue must not disqualify the substantively-best candidate.** If the best-on-substance option has a couple of lint/a11y/style violations that are routine to fix, *remediate them and then judge* — do not let an eligibility gate hand the win to a worse-but-cleaner option. (That mistake quietly carries the weakest idea forward; see §4.)

## 3. The discipline — run this inline, in one pass

Do this yourself (or with a single helper) — **do not spin up parallel agents or git worktrees.** The whole point is that it is cheap.

1. **Operationalize the fitness.** Turn the goal into 2–5 concrete, measurable questions. For a perf goal that is one benchmark. For a taste/UI goal, convert it to task-based questions ("how many steps to spot the riskiest item?", "can X be found in one view? y/n"). If you cannot make *any* measurable question, say so — anneal degrades to "show options, you pick," and you should know that up front.
2. **Sketch K = 2–3 distinct directions.** Genuinely different approaches, not tweaks of one.
3. **Prototype each cheaply and MEASURE it.** Build only enough of each to run the measurement; record the actual number per question. Keep prototypes throwaway. Run the measurement — do not estimate, and do not trust a model's self-assessment of which "feels" best.
4. **Pick by substance, reading the numbers yourself.** The highest measured fitness wins. Hygiene only breaks a near-tie, and only after the fixable issues on the substance leader are remediated (§2). If your intuitive favorite measured worse, pick the faster/better-measured one anyway — that is the entire value.
5. **Iterate the winner** with the polish rubric (`rubrics/default.polish.md`) to finish it. Now polish is welcome — the direction is already settled.

## 4. Why cheap-and-early is load-bearing

The expensive mistake is building deep in a direction your intuition picked, only to find a cheaper measurement would have flagged it wrong.

Illustration: faced with "show entity relationships," the instinct is often a node-link **graph**, and it is tempting to build several graph variants. But operationalizing the goal into five task-questions and scoring a quick **table** against them can reveal the table answers them better — because the data is tree-structured (one owner per entity), which a table renders at least as well. Teams that build the graphs first burn that effort; teams that *measure first, cheaply* spend a few minutes and skip the wrong track. Put the measurement before the build.

## 5. Honest limits

- **It is decision-support, not autonomy.** You read the scores and pick. Its value is forcing *measurement over intuition*, cheaply — not removing you from the loop.
- **No measurable fitness ⇒ no real convergence.** If even operationalized questions don't yield a signal (pure taste), anneal can only lay out options for you to choose; it will not discover the "best" direction. Say so rather than faking it on polish.
- **It is a discipline, not a moat.** "Generate candidates, score by an objective signal, keep the best" is established practice (best-of-N, AlphaCodium-style flows). anneal's contribution is packaging the two-oracle rule + measure-first habit so they are hard to forget — not a new mechanism.
