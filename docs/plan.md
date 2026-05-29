# anneal skill — Implementation Plan

> **⚠️ Superseded — historical build record.** This plan built the original heavyweight
> Workflow-engine version. That engine was later removed in favor of a lightweight measure-first
> discipline (see `SKILL.md` / `README.md`). Kept for history; the task list below describes
> components that no longer ship (`workflow/`, the multi-agent run, the flags).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build `anneal`, a distributable Claude Code skill that runs any oracle-bearing project through a diverge→pick-best-direction→iterate-to-green loop, published to `github.com/moonweave/anneal-skill`.

**Architecture:** A single `SKILL.md` protocol (mirrors decide/compass) that, on `/anneal <target>`, authors+runs a **bundled committed Workflow script** implementing two phases: Phase A (cheap prototype + score K directions by a *direction-fitness oracle*, pick winner) and Phase B (iterate the winner to green by a *polish rubric*). Two oracles are kept strictly separate. Safety (budget cap, worktree isolation, max-rounds, checkpoint) lives inside the Workflow script so installers touch no settings.

**Tech Stack:** Markdown skill (`SKILL.md`), the built-in `Workflow` tool (JS orchestration script), markdown rubric files. No runtime package; the "tests" are structural checks + a self-eval fixture.

---

## Context

This builds the skill designed in `~/ai-skills-dev/my-skills/anneal-skill/docs/spec.md` (already committed). The skill packages the self-improvement loop the user wants — "complete a system, then keep improving and self-direct toward the best form, asking the user only at the destination" — as a reusable, publishable artifact rather than re-prompted prose. A prior critical review fixed the core hole (rubric measured *polish* while the thesis needed *direction-fitness*); this plan implements the corrected two-oracle, two-phase design. Mirror conventions from `~/ai-skills-dev/my-skills/decide-skill/` (single rich `SKILL.md`, `docs/`, `README.md`, `LICENSE`, independent git repo).

## Decisions locked (spec open questions 1-8 resolved)

1. **Prototype fidelity:** thin vertical slice = minimum to be scored by the direction oracle; enforced by a hard per-prototype token budget (`perPrototypeBudget`, default 40k).
2. **Direction-fitness elicitation:** if no measurable goal is inferable and no `--goal` given, ask the user once (AskUserQuestion) with concrete examples; if none can be given, drop to **polish-only mode** with an explicit "will not discover direction" warning.
3. **Workflow script:** a **committed file** `workflow/anneal.workflow.js`, run via `Workflow({scriptPath, args})`. Parameterized through `args` (not re-emitted each run).
4. **Default polish rubric:** `rubrics/default.polish.md`, lenses scored 0-3: tests (gate), lint/type, build, complexity-delta heuristic.
5. **Re-divergence:** v1 = **pick-once (R=0)** → no oscillation risk by construction. Re-divergence (R>0) is a deferred v1.1 extension and, when added, MUST dedup proposed directions against a `seen` set (not against accepted-only). Documented, not built in v1.
6. **UI-critic auto-detection:** best-effort probe for a `web-interface-guidelines*.md` on disk and a Playwright/browser MCP for a11y; absent → fall back to default polish rubric. Never required.
7. **Cross-model judges:** optional; default single-model with the shared-prior limit stated in SKILL.md. Skipped if no second model configured.
8. **Self-eval fixture:** `eval/dup-finder/` — a naive O(n²) duplicate finder with a benchmark; expected convergence = anneal picks the O(n) hashing direction and Phase B reaches the benchmark threshold.

## File structure

```
anneal-skill/
├── SKILL.md                         # protocol (frontmatter + numbered sections)
├── README.md                        # public usage
├── LICENSE                          # MIT (match decide/compass)
├── .gitignore
├── workflow/anneal.workflow.js      # bundled Workflow script (Phase A/B + safety)
├── rubrics/default.polish.md        # default polish rubric, 0-3 lenses
├── rubrics/default.direction-fitness.md  # direction-fitness elicitation template
├── eval/dup-finder/                 # self-eval fixture (known-good convergence)
│   ├── target.py                    # naive O(n^2) impl + benchmark harness
│   └── expected.md                  # asserted winning direction + threshold
└── docs/{spec.md, plan.md}          # spec exists; copy this plan to docs/plan.md
```

---

## Task 1: Repo scaffolding (LICENSE, .gitignore, README skeleton)

**Files:** Create `LICENSE`, `.gitignore`, `README.md` in `~/ai-skills-dev/my-skills/anneal-skill/`.

- [ ] **Step 1: Copy MIT LICENSE** from `~/ai-skills-dev/my-skills/decide-skill/LICENSE`, update year/author to match.
- [ ] **Step 2: Write `.gitignore`** — ignore `.DS_Store`, `node_modules/`, `*.log`, worktree scratch dirs (`.anneal-worktrees/`).
- [ ] **Step 3: Write `README.md` skeleton** — what anneal is (one-liner), sweet-spot vs weak-case table, install (`/plugin` or clone), `/anneal` usage examples, the two-oracle explanation, honest limits. (Public-facing; no personal paths.)
- [ ] **Step 4: Verify** `ls` shows the three files; `git status` clean-ish.

## Task 2: Default rubric files

**Files:** Create `rubrics/default.polish.md`, `rubrics/default.direction-fitness.md`.

- [ ] **Step 1: `default.polish.md`** — table of lenses, each 0-3: `tests` (0=fail→hard gate, 3=all pass), `lint_type` (0-3), `build` (0/3), `complexity_delta` (0-3, "reduces real complexity vs adds surface"). State: polish rubric scores an *already-chosen* artifact; never used to pick direction.
- [ ] **Step 2: `default.direction-fitness.md`** — template prompting for a *measurable* goal with examples (perf benchmark, test pass-rate, coverage, UI task "steps to find X"). Include the "if no measurable goal → polish-only mode" downgrade note.
- [ ] **Step 3: Verify** both files parse as markdown and contain the numeric scheme + the "not for direction" / "must be measurable" rules.

## Task 3: Bundled Workflow script (technical core)

**Files:** Create `workflow/anneal.workflow.js`.

- [ ] **Step 1: Write the script** with this structure (real `Workflow` API: `agent`, `parallel`, `phase`, `log`, `budget`, schema, `isolation:'worktree'`):

```js
export const meta = {
  name: 'anneal',
  description: 'Diverge directions, pick best by direction-fitness oracle, iterate winner to green',
  phases: [
    { title: 'DirectionSearch', detail: 'prototype + score K directions, pick winner' },
    { title: 'Iterate', detail: 'loop winner to green by polish rubric' },
  ],
}
// args: { target, goal, rubricPath, K=2, judges=1, maxRounds=4, perPrototypeBudget=40000, checkpoint='destination' }
const a = args ?? {}
const K = a.K ?? 2, JUDGES = a.judges ?? 1, MAX_ROUNDS = a.maxRounds ?? 4
const DIRECTIONS_SCHEMA = { type:'object', properties:{ items:{ type:'array', items:{
  type:'object', properties:{ key:{type:'string'}, summary:{type:'string'} }, required:['key','summary'] }}}, required:['items'] }
const PROTO_SCHEMA = { type:'object', properties:{ key:{type:'string'}, fitness:{type:'number'}, note:{type:'string'} }, required:['key','fitness'] }
const POLISH_SCHEMA = { type:'object', properties:{ improved:{type:'boolean'}, score:{type:'number'}, remaining:{type:'string'} }, required:['improved','score'] }

phase('DirectionSearch')
const dirs = await agent(`Propose ${K} DISTINCT candidate directions for improving: ${a.target}. Direction-fitness goal: ${a.goal}. One-line summary each. Do not build yet.`, { schema: DIRECTIONS_SCHEMA })
log(`Directions: ${dirs.items.map(d=>d.summary).join(' | ')}`)
const scored = (await parallel(dirs.items.map(d => () =>
  agent(`Build a LIGHTWEIGHT prototype of "${d.summary}" for ${a.target} — only enough to score it against the direction-fitness goal: ${a.goal}. Then score fitness 0-5. Hard token budget ~${a.perPrototypeBudget ?? 40000}. Do NOT polish.`,
        { label:`proto:${d.key}`, phase:'DirectionSearch', isolation:'worktree', schema: PROTO_SCHEMA })
    .then(s => ({...s, summary: d.summary}))))).filter(Boolean)
const winner = scored.sort((x,y)=>y.fitness-x.fitness)[0]
if (!winner) return { error: 'no scorable direction' }
log(`Winner: ${winner.summary} (fitness ${winner.fitness})`)

phase('Iterate')
let dry = 0, round = 0
const decisionLog = [`picked: ${winner.summary} (fitness ${winner.fitness}); rejected: ${scored.slice(1).map(s=>s.summary).join(', ')}`]
while (dry < 2 && round < MAX_ROUNDS && (!budget.total || budget.remaining() > 50_000)) {
  round++
  const r = await agent(`Improve the "${winner.summary}" implementation of ${a.target}. Run tests/lint/build; apply polish rubric at ${a.rubricPath ?? 'rubrics/default.polish.md'}. Report improved(bool), score, remaining issues.`,
                        { label:`iterate:${round}`, phase:'Iterate', isolation:'worktree', schema: POLISH_SCHEMA })
  decisionLog.push(`round ${round}: score ${r.score} improved=${r.improved} ${r.remaining ?? ''}`)
  if (r.improved) dry = 0; else dry++
}
return { winner, rounds: round, decisionLog }
```

- [ ] **Step 2: Verify it parses** — Run: `node --check workflow/anneal.workflow.js`. Expected: no syntax error. (Plain JS, no TS.)
- [ ] **Step 3: Sanity-check the API** against the Workflow tool contract: `meta` is a pure literal; only `agent/parallel/phase/log/budget/args` used; `Date.now`/`Math.random` absent.
- [ ] **Step 4: Commit** Tasks 1-3.

## Task 4: SKILL.md (the protocol)

**Files:** Create `SKILL.md`. Mirror decide-skill's shape: YAML frontmatter (`name: anneal`, multi-line `description` with explicit "Use when the user types `/anneal`" + "never auto-invoke", `allowed-tools` incl. `AskUserQuestion`, `Read`, `Bash`, and note that it uses the built-in Workflow tool), then numbered sections:

- [ ] **Step 1: Frontmatter** — name/description("Use when …, never auto")/allowed-tools.
- [ ] **Step 2: §1 When to Run** — only on `/anneal`, never auto. §2 Input resolution — `<target>` from args or ask; `--goal/--rubric/--directions/--judges/--max-rounds/--budget/--checkpoint`.
- [ ] **Step 3: §3 Sweet-spot vs weak-case gate** — if a hard direction-fitness oracle is inferable → proceed; if taste-only and no `--goal` → ask once, else polish-only mode with warning. (Encode the two-oracle rule: polish never picks direction.)
- [ ] **Step 4: §4 Run protocol** — author/run `Workflow({scriptPath:'workflow/anneal.workflow.js', args:{...}})`; default cheap mode (K=2, judges=1) + opt-in scaling; log cost envelope; never exceed budget cap.
- [ ] **Step 5: §5 Output** — present converged result + decision log; checkpoint behavior (`direction|destination`). §6 Honest limits (taste weak case, token cost, judge shared priors, divergence bounds discovery). §7 Error handling (no oracle → polish-only; budget hit → stop+report; prototype unscoreable → drop).
- [ ] **Step 6: Verify** structure — `grep` for required anchors: `name: anneal`, `Use when`, `never auto`, `two-oracle`/`direction-fitness`, `polish-only`, `Honest limits`. All present.
- [ ] **Step 7: Commit.**

## Task 5: Self-eval fixture

**Files:** Create `eval/dup-finder/target.py`, `eval/dup-finder/expected.md`.

- [ ] **Step 1: `target.py`** — naive O(n²) duplicate finder + a `benchmark()` that times it on a fixed large input; print elapsed.
- [ ] **Step 2: `expected.md`** — assert: Phase A should pick the "hash-set O(n)" direction over "optimize the nested loop"; Phase B should reach elapsed < threshold. This is anneal's own oracle.
- [ ] **Step 3: Verify** `python3 eval/dup-finder/target.py` runs and prints a baseline time.
- [ ] **Step 4: Commit.**

## Task 6: End-to-end dogfood + docs

- [ ] **Step 1:** Copy this plan to `docs/plan.md` in the repo.
- [ ] **Step 2: Dry dogfood** — invoke `/anneal eval/dup-finder --goal "elapsed < baseline/5" --directions 2 --max-rounds 2 --budget 150000` in cheap mode; confirm Phase A picks the O(n) direction and the decision log records the rejected one. (This is the real verification — the skill improving its own fixture.)
- [ ] **Step 3:** Fix any protocol/script gaps found by the dogfood.
- [ ] **Step 4: Commit**, then push to `github.com/moonweave/anneal-skill` (irreversible — confirm with user first).

---

## Verification

- **Structural:** `node --check workflow/anneal.workflow.js`; `grep` SKILL.md anchors (Step 4.6); `python3 eval/dup-finder/target.py` runs.
- **End-to-end (the real test):** the Task 6 dogfood — anneal run on its own eval fixture picks the known-best direction and converges to the benchmark, with a decision log naming the rejected direction. This validates the *mechanism* on a hard oracle (not taste).
- **Honesty checks:** SKILL.md states the weak-case (UI/taste), the token cost, the judge shared-prior limit, and refuses to fake convergence when no oracle exists.

## Self-review notes

- Spec coverage: two-oracle split (T2,T4), two-phase loop (T3), cheap default+scaling (T3 args, T4.4), safety in-script (T3), pluggable+detection rubric (T2,T4.3), self-eval fixture (T5,T6), honest limits + positioning (T4.5, README T1.3). Re-divergence intentionally deferred (decision 5) — no oscillation risk in v1 by construction.
- No placeholders: Workflow script is concrete code; rubric/SKILL sections enumerated; eval fixture concrete.
- Naming consistency: `target/goal/rubricPath/K/judges/maxRounds/perPrototypeBudget/checkpoint` used identically across T3 script and T4 invocation contract.
