# Deliberately naive O(n^2) duplicate finder — the baseline anneal's self-eval
# improves on. Do NOT replace the nested loop with a set/dict here: the hash-set
# O(n) rewrite is the direction anneal is supposed to discover, not pre-bake.
import random
import time


def find_duplicates(items: list[int]) -> list[int]:
    seen_again: list[int] = []
    for outer in range(len(items)):
        for inner in range(outer + 1, len(items)):
            if items[outer] == items[inner]:
                seen_again.append(items[outer])
                break  # one match is enough to flag items[outer] as a duplicate
    # Dedupe + sort once at the end (O(n log n)), so result is the *set* of
    # duplicated values in a stable order. Keeping this out of the inner loop
    # leaves the n^2/2 pair comparisons the dominant cost.
    return sorted(set(seen_again))


def benchmark() -> None:
    # n=9000 with ~150 duplicated values lands the naive baseline near ~1s on
    # CPython: slow enough that the O(n) win is unmistakable, fast enough that
    # `python3 target.py` returns promptly. Unique values dominate the cost —
    # each scans the full inner loop; duplicates short-circuit on first match.
    random.seed(42)
    size = 9000
    distinct_duplicates = 150
    items = list(range(size - distinct_duplicates))
    items += [
        random.randrange(size - distinct_duplicates) for _ in range(distinct_duplicates)
    ]
    random.shuffle(items)

    start = time.perf_counter()
    duplicates = find_duplicates(items)
    elapsed = time.perf_counter() - start

    print(f"input size: {len(items)}")
    print(f"duplicate values found: {len(duplicates)}")
    print(f"elapsed: {elapsed:.4f}s")


if __name__ == "__main__":
    benchmark()
