import numpy as np
import pandas as pd

def assign_tier(normal_score: pd.Series) -> pd.Series:
    return pd.cut(
        normal_score,
        bins=[-np.inf, 0.5, 0.75, 0.9, 0.95, np.inf],
        labels=[0, 1, 2, 3, 4],
        right=False,
    ).astype(int)
