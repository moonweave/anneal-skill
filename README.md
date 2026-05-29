# anneal

A Claude Code skill that drives an oracle-bearing project through a **diverge → pick-best-direction → iterate-to-green** loop, escaping the local-optimum trap of single-track polishing. Named after simulated annealing: explore broadly, then converge.

## Why

The default way an agent improves something is to keep polishing one approach. That hill-climbs into a local optimum — the current direction gets shinier, but a genuinely better direction is never tried because the first step away from the incumbent looks worse.

`anneal` separates two questions that polishing conflates, and keeps them strictly apart:

1. **Direction-fitness** — *which direction is better?* Answered by a **task-based, measurable** oracle (benchmark delta, test pass-rate, coverage; for UI, an operationalized task such as "clicks to find an orphan node"). A rough-but-better direction can win this even while half-built.
2. **Polish** — *how well is this artifact executed?* Answered by a rubric over lint, type, build, complexity. This drives the iterate-to-green loop on the *already-chosen* direction.

**The polish rubric must never choose direction.** A polished incumbent out-scores a rough challenger on polish every time, so using polish to pick direction pulls the loop straight back into the local optimum. Direction is chosen by the fitness oracle alone; the polish rubric only refines the winner.

## Install

Clone into your Claude Code skills directory:

```
mkdir -p ~/.claude/skills/anneal
cp -r anneal-skill/* ~/.claude/skills/anneal/
```

Once published to a plugin marketplace, it will also be installable with `/plugin`.

## Usage

```
/anneal <target>                                  # cheap default: K=2 directions, 1 judge, bundled rubric
/anneal <target> --goal "<measurable fitness>"    # supply direction-fitness when not inferable
/anneal <target> --rubric <path>                  # pluggable polish rubric
/anneal <target> --directions N --judges M --max-rounds R --budget <tokens> --checkpoint direction
```

`<target>` is a path or a short description. Without a target, the skill asks. If no direction-fitness oracle is inferable and none is supplied, the skill asks for a measurable goal rather than faking convergence on polish.

### Examples

```
/anneal ./src/parser --goal "csv-bench rows/sec, higher is better"
/anneal "the graph layout component" --goal "clicks to find an orphan node, fewer is better" --checkpoint direction
/anneal ./solver --directions 4 --judges 2 --max-rounds 6 --budget 400000
```

## How it works

Two phases, two oracles.

**Phase A — direction search.** Propose K (default 2) distinct directions. Build a cheap prototype of each — just enough to score it under the **direction-fitness oracle**. Rank by fitness only. Pick the winner.

**Phase B — iterate to green.** Take the winning direction and loop it against the **polish rubric**. Stop on whichever comes first: two consecutive rounds with no improvement (loop-until-dry), max-rounds, or the token budget.

## Behavior summary

| Aspect | Phase A (direction search) | Phase B (iterate to green) |
|---|---|---|
| Question answered | Which direction is better? | How well is this executed? |
| Oracle | Direction-fitness (task-based, measurable) | Polish rubric (lint, type, build, complexity) |
| Artifacts | Cheap prototypes per direction | The chosen direction, refined |
| Picks direction? | Yes — solely | Never |
| Stop condition | All K directions scored, winner chosen | 2 dry rounds, max-rounds, or budget |

## Sweet spot vs weak case

| | Sweet spot | Weak case |
|---|---|---|
| **Target** | A hard oracle ranks directions | Taste-laden directions |
| **Examples** | performance → benchmark, correctness → tests, coverage, build-size, latency, memory | UI / visual design, "make it feel nicer" |
| **Signal** | Cheap, objective fitness per direction | No cheap objective signal |
| **Result** | Converges on the genuinely best direction | Degrades toward whatever the rubric can measure (polish) — unless you supply a task-based fitness definition |

For taste-laden targets, pass `--goal` with an operationalized task ("clicks to complete", "time to locate X") or use `--checkpoint direction` to put a human in the loop before Phase B.

## Design principles

1. **Two oracles, kept apart.** Direction-fitness and polish answer different questions and are never mixed.
2. **Polish never picks direction.** This is the rule that prevents the local-optimum collapse.
3. **Fitness must be measurable.** No measurable goal, no honest convergence — the skill asks rather than faking it on polish.
4. **Cheap prototypes for the search.** Build only enough of each direction to score it; the winner gets the real investment.
5. **Bounded loops.** The token budget is a hard cap, not advice. Loops stop when dry, capped, or out of budget.

## What it doesn't do

- It does not converge on objective best for taste targets. Logic, performance, and coverage converge on the best direction; taste targets converge on "best per the encoded rubric" and need user-supplied task-based fitness or a human checkpoint.
- It does not run free. Loops are token-heavy; the budget cap is mandatory.
- It does not explore exhaustively. Divergence breadth bounds discovery — it logs what it did not explore.
- It does not give you a truly independent referee. Judges share the generator's model priors.

## Status

Early. The two-oracle framing and the loop are the stable core; flags and defaults may move.

## License

MIT — see [LICENSE](LICENSE).

## Author

[@moonweave](https://github.com/moonweave)
