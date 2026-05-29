export const meta = {
  name: 'anneal',
  description: 'Diverge directions, pick the best by a measurable direction-fitness oracle, then iterate the winner to green by a polish rubric',
  phases: [
    { title: 'DirectionSearch', detail: 'prototype + measure K directions, pick winner by fitness' },
    { title: 'Iterate', detail: 'loop the winner to green by the polish rubric' },
  ],
}

const a = args ?? {}
const K = a.K ?? a.directions ?? 2
const JUDGES = a.judges ?? 1
const MAX_ROUNDS = a.maxRounds ?? 4
const PER_PROTO_BUDGET = a.perPrototypeBudget ?? 40000
const RUBRIC = a.rubricPath ?? 'rubrics/default.polish.md'
const DRY_STREAK = 2 // consecutive no-improvement rounds before stopping (README/polish.md: "2 consecutive rounds")
const BUDGET_RESERVE_TOKENS = 50000 // stop iterating once remaining budget would dip below this reserve
const RUN_CAP = a.budget ?? null // explicit per-run token cap from --budget; null means fall back to the engine turn budget

const DIRECTIONS_SCHEMA = { type: 'object', properties: { items: { type: 'array', items: {
  type: 'object', properties: { key: { type: 'string' }, summary: { type: 'string' } }, required: ['key', 'summary'] } } }, required: ['items'] }
// Builder reports OBJECTIVE evidence + a measurement-derived fitness (not a subjective polish grade).
const BUILD_SCHEMA = { type: 'object', properties: {
  key: { type: 'string' }, evidence: { type: 'string' }, fitness: { type: 'number' }, note: { type: 'string' } },
  required: ['key', 'evidence', 'fitness'] }
const JUDGE_SCHEMA = { type: 'object', properties: { fitness: { type: 'number' }, rationale: { type: 'string' } }, required: ['fitness'] }
const POLISH_SCHEMA = { type: 'object', properties: { improved: { type: 'boolean' }, score: { type: 'number' }, remaining: { type: 'string' } }, required: ['improved', 'score'] }

phase('DirectionSearch')
let dirs
try {
  dirs = await agent(
    `Propose ${K} DISTINCT candidate directions for improving: ${a.target}. The direction-fitness goal (how a direction will be judged) is: ${a.goal}. Give a one-line summary each. Do NOT build anything yet.`,
    { schema: DIRECTIONS_SCHEMA })
} catch (err) {
  return { error: `direction proposal failed to finalize: ${err}` }
}
if (!dirs) return { error: 'no directions proposed' }
log(`Directions explored (K=${K}): ${dirs.items.map(d => d.summary).join(' | ')}. None beyond these were explored.`)

const built = (await parallel(dirs.items.map(d => () =>
  agent(`Build a LIGHTWEIGHT prototype of "${d.summary}" for ${a.target} — only enough to MEASURE it against the direction-fitness goal: ${a.goal}. Run that measurement. Report OBJECTIVE evidence (the measured value: e.g. benchmark elapsed, test pass-rate, coverage %) and a numeric fitness derived SOLELY from that measurement relative to the goal (higher = better meets the goal). Do NOT polish, and ignore code polish/quality entirely — that is judged in a separate later phase, never here. Hard token budget ~${PER_PROTO_BUDGET}.`,
    { label: `proto:${d.key}`, phase: 'DirectionSearch', isolation: 'worktree', schema: BUILD_SCHEMA })
    .then(b => b && { ...b, summary: d.summary }))))
  .filter(Boolean)

let scored
if (JUDGES > 1) {
  // Independent judges score the builder-REPORTED evidence against the goal (they cannot see the isolated worktree). Mean-aggregate.
  scored = (await parallel(built.map(b => () =>
    parallel(Array.from({ length: JUDGES }, (_unused, i) => () =>
      agent(`Score the direction-fitness of prototype "${b.summary}" for ${a.target} ONLY against the measurable goal: ${a.goal}. Reported evidence: ${b.evidence}. You are judge ${i + 1} of ${JUDGES}, scoring independently. Return a numeric fitness for how well this DIRECTION meets the goal. Consider ONLY goal attainment — ignore code polish/quality entirely, since that is judged in a separate later phase, never here.`,
        { label: `judge:${b.key}:${i + 1}`, phase: 'DirectionSearch', schema: JUDGE_SCHEMA })))
      .then(votes => {
        const valid = votes.filter(Boolean)
        // Builder fitness and judge fitness are the same goal-attainment scale, so the all-judges-null fallback to b.fitness stays comparable to peers carrying the judge mean.
        const mean = valid.length ? valid.reduce((sum, v) => sum + v.fitness, 0) / valid.length : b.fitness
        return { ...b, fitness: mean, judges: valid.length }
      }))))
    .filter(Boolean)
} else {
  scored = built
}
scored = scored.sort((x, y) => y.fitness - x.fitness)
const winner = scored[0]
if (!winner) return { error: 'no scorable direction', directions: dirs.items.map(d => d.summary) }
log(`Winner: ${winner.summary} (fitness ${winner.fitness}). Evidence: ${winner.evidence}`)

phase('Iterate')
let dry = 0, round = 0
const decisionLog = [
  `picked: ${winner.summary} (fitness ${winner.fitness}, evidence: ${winner.evidence})`,
  `rejected: ${scored.slice(1).map(s => `${s.summary} (${s.fitness})`).join(', ') || 'none'}`,
]
const startSpent = budget.spent() // measure THIS anneal run's spend against RUN_CAP, not the whole turn's
while (dry < DRY_STREAK && round < MAX_ROUNDS &&
  (RUN_CAP
    ? (budget.spent() - startSpent) < (RUN_CAP - BUDGET_RESERVE_TOKENS)
    : (!budget.total || budget.remaining() > BUDGET_RESERVE_TOKENS))) {
  let r
  try {
    r = await agent(
      `Improve the "${winner.summary}" implementation of ${a.target}. Run tests/lint/build and apply the POLISH rubric at ${RUBRIC}. This is oracle #2 — refine the ALREADY-CHOSEN winner; do NOT re-choose the direction. Report improved (bool), score, and remaining issues.`,
      { label: `iterate:${round + 1}`, phase: 'Iterate', isolation: 'worktree', schema: POLISH_SCHEMA })
  } catch (err) {
    decisionLog.push(`round ${round + 1}: iterate agent failed to finalize (${err}) — stopping early, winner from Phase A preserved`)
    break
  }
  if (!r) break
  round++
  decisionLog.push(`round ${round}: score ${r.score} improved=${r.improved} ${r.remaining ?? ''}`)
  if (r.improved) dry = 0; else dry++
}
return { winner, rounds: round, decisionLog }
