# Direction-fitness oracle

Score each direction `0-2` per question.

- `0`: the direction does not answer the question without extra navigation or
  custom inspection.
- `1`: the direction can answer the question, but the answer is indirect,
  cluttered, or requires opening details.
- `2`: the direction answers the question in one view.

## Questions

1. Can the user find orphan items in one view?
2. Can the user spot the single riskiest item in one view?
3. Can the user trace override precedence without opening details?
4. Can the user see provider scope clearly?
5. Can the user identify cross-tool single points of failure?

Total score: `10`.

## Important separation

This oracle ranks directions only. It does not score typography, spacing,
animation, graph aesthetics, or implementation polish. Those belong to the
polish rubric after the winner is chosen.
