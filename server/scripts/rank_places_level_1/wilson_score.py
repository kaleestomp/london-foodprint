import numpy as np
import pandas as pd
# ── Wilson Score lower bound ─────────────────────────────────────────────────
# Treats mean star rating (1–5) as a proportion p = (rating - 1) / 4 ∈ [0, 1],
# then returns the lower bound of the Wilson confidence interval.
# A higher confidence makes the ranking more conservative (favours many reviews).
# Reference: https://mattsayar.com/where-are-the-best-restaurants-in-my-city-a-statistical-analysis/

Z_TABLE = {0.90: 1.645, 0.95: 1.960, 0.99: 2.576}
def wilson_score(rating: float, count: int, confidence: float = 0.99) -> float:
    if count == 0:
        return 0.0
    z = Z_TABLE.get(confidence, 2.576)
    p = (rating - 1) / 4.0          # normalise [1, 5] → [0, 1]
    n = count
    return (
        p + z**2 / (2 * n) - z * np.sqrt(p * (1 - p) / n + z**2 / (4 * n**2))
    ) / (1 + z**2 / n)

# ── Bayesian Average (IMDb-style) ─────────────────────────────────────────────
# WR = v/(v+m) * R  +  m/(v+m) * C
# v = item's review count, R = item's mean rating
# m = prior count (median review count across dataset)
# C = global mean rating across all items

def add_bayesian_avg(df: "pd.DataFrame", rating_col="rating", count_col="userRatingCount") -> "pd.Series":
    C = df[rating_col].mean()                   # global mean
    m = df[count_col].median()                  # prior count
    v = df[count_col]
    R = df[rating_col]
    return (v / (v + m)) * R + (m / (v + m)) * C