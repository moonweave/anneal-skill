# anneal result: measured direction choice

## Step 1: operationalize fitness

The goal is converted into five task questions:

1. Find orphan items.
2. Spot the single riskiest item.
3. Trace override precedence.
4. See provider scope.
5. Identify cross-tool single points of failure.

Each question is scored `0-2`, for a total of `10`.

## Step 2: sketch directions

Candidate directions:

- node-link graph
- refined table
- grouped cards
- matrix

## Step 3: measure

| Direction | Score |
|---|---:|
| Refined table | 10 |
| Grouped cards | 7 |
| Matrix | 7 |
| Node-link graph | 6 |

## Step 4: pick by direction-fitness

Winner: refined table.

The graph direction is rejected as the primary view because its strongest signal
is connectivity, while the highest-value tasks are one-view scanning and
comparison.

## Step 5: polish only after direction choice

After the refined table wins, polish can address implementation details:

- keyboard-accessible chips or filters
- clear risk sorting
- consistent scope labels
- test coverage for orphan/risk/override rendering

Those polish checks should not be used to eliminate the table as a direction if
the issues are routine to fix.
