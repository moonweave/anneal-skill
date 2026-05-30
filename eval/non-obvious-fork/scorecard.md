# Scorecard

| Direction | Orphans | Riskiest | Override | Scope | SPOF | Total |
|---|---:|---:|---:|---:|---:|---:|
| Refined table | 2 | 2 | 2 | 2 | 2 | 10 |
| Grouped cards | 1 | 2 | 1 | 2 | 1 | 7 |
| Matrix | 1 | 1 | 2 | 1 | 2 | 7 |
| Node-link graph | 1 | 1 | 1 | 1 | 2 | 6 |

Winner: refined table.

## Why the table wins

The core user tasks are scanning and comparison tasks:

- Which item has no owner?
- Which item has high risk?
- Which scope applies?
- Which override wins?
- Which shared tool is a single point of failure?

A table can expose owner, scope, risk, override source, and tool dependencies in
columns with sorting and filtering. The graph shows connectivity, but it makes
owner, risk, and override precedence secondary labels or detail-panel content.

The graph can still be a useful secondary visualization, but it should not be
the primary direction for this dataset.
