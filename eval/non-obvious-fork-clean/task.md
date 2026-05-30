# Task

Choose the best UI direction for a developer-config inventory dashboard.

The dashboard needs to show relationships between:

- skills
- tools
- roles
- provider scopes
- override precedence
- risk ownership

Candidate directions:

1. Node-link graph.
2. Refined table.
3. Grouped cards.
4. Matrix.

The goal is not visual polish. The goal is helping a user answer
relationship-risk questions quickly, before the team invests in building a full
view.

The decision is non-obvious because "relationships" naturally suggests a graph,
but the underlying data can be mostly tree-shaped: each item usually has one
owner, one scope, and a small number of tool dependencies.
