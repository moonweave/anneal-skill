# Default direction-fitness oracle (oracle #1)

Defines the **measurable, task-based** signal that **ranks directions**. This is oracle #1, separate from the polish rubric (`default.polish.md`): it ranks *which direction is better*, not how polished any one artifact is. A rough-but-better direction can win this fitness while still half-built.

**The goal must be measurable and task-based** — a number (or a yes/no on an operationalized task), not "looks better" or "feels cleaner." If you cannot phrase it as something a script or a stopwatch could measure, it is not a direction-fitness goal.

A good direction-fitness oracle also creates an **improvement surface**. The
score should show which task questions are weak so the next change is concrete:
"Q2 tool fan-in scored `1 / 2`, so add a shared-tool filter" is useful;
"this feels less elegant" is not.

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

## How to get it

1. **Infer** it from the target if a measurable goal is evident (an existing benchmark or test suite).
2. Else **operationalize** it — turn the goal into a task with a countable outcome (see the UI row above).
3. Else **ask the user once** for a measurable goal.

## When there is no measurable signal (honesty)

> **Warning.** If you cannot infer, operationalize, or obtain any measurable signal — the target is pure taste — then anneal **cannot rank directions for you.** It degrades to *decision-support*: lay out the candidate options honestly and let the user pick. It will not discover the "best" direction, and it must not fake one by scoring polish.

Say this out loud rather than silently substituting polish for fitness.
