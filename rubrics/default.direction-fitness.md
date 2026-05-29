# Default direction-fitness oracle (oracle #1)

Defines the **measurable, task-based** signal that **ranks directions** in Phase A. This is oracle #1, separate from the polish rubric (`default.polish.md`): it ranks *which direction is better*, not how polished any one artifact is. A rough-but-better direction can win this fitness while still half-built.

**The goal must be measurable and task-based** — a number (or a yes/no on an operationalized task), not "looks better" or "feels cleaner." If you cannot phrase it as something a script or a stopwatch could measure, it is not a direction-fitness goal.

## Examples by target type

| Target type | Example measurable fitness goal |
|---|---|
| performance | benchmark elapsed `< baseline / 5` (or rows/sec, ops/sec — higher is better) |
| correctness | test-suite pass-rate (fraction of cases passing) |
| coverage | line / branch coverage % |
| size | bundle KB (smaller is better) |
| latency | p95 latency ms (smaller is better) |
| memory | peak RSS MB (smaller is better) |
| UI / visual (the hard case) | an **operationalized task**: "clicks/steps to find an orphan node" (fewer is better); "can the single riskiest item be spotted in one view? (y/n)" |

UI/visual is the hard case because there is no native objective number — you must *operationalize* the goal into a task with a countable outcome. Without that operationalization, a UI target has no direction-fitness signal.

## How to supply it

1. **Infer** from the target if a measurable goal is evident (e.g. an existing benchmark or test suite).
2. Else pass it explicitly: `--goal "<measurable fitness>"`.
3. Else **ASK the user once** for a measurable goal.

## Downgrade: polish-only mode (honesty warning)

> **Warning.** If no measurable goal is inferable from the target **and** none is supplied, the skill enters **polish-only mode**. Polish-only mode **cannot discover direction** — it has no fitness signal to rank directions with, so it only refines the single existing direction by the polish rubric. It will *not* find a better direction; it can only make the current one cleaner.

This downgrade is an explicit warning, never a silent fallback. The skill states that it has dropped to polish-only mode so direction-discovery is never faked using the polish rubric.
