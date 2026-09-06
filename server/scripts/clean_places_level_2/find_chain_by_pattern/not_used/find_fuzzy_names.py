import numpy as np
import pandas as pd
from rapidfuzz import process, fuzz
MIN_MATCHES = 1
MATCH_COLUMN = "displayName"

def find_similar_name_rows(df, threshold=85.0, scorer=fuzz.token_sort_ratio):
    # Normalize names so punctuation/casing don't affect similarity
    names = (df[MATCH_COLUMN].fillna("").astype(str).str.strip()
             .str.casefold()
             .str.replace(r"[^\w\s]", "", regex=True)
             .str.replace(r"\s+", " ", regex=True))
    name_list = names.tolist()

    # Pairwise similarity matrix (0 where score < threshold)
    scores = process.cdist(name_list, name_list, scorer=scorer,
                           score_cutoff=threshold, workers=-1)
    np.fill_diagonal(scores, 0)  # exclude self-matches

    match_mask = scores > 0
    match_counts = match_mask.sum(axis=1)
    keep_idx = match_counts >= MIN_MATCHES

    result_df = df.loc[keep_idx].copy()
    result_df["similar_count"] = match_counts[keep_idx]
    result_df["similar_names"] = [
        sorted({df[MATCH_COLUMN].iat[j] for j in np.flatnonzero(row)})
        for row in match_mask[keep_idx]
    ]
    result_df = result_df.sort_values("similar_count", ascending=False)
    result = []
    for match, group in result_df.groupby(MATCH_COLUMN):
        result.append({
            "match": match,
            "count": group["similar_count"].iloc[0],
            "matched": group["similar_names"].iloc[0]
        })
    result = pd.DataFrame(result)

    return result


# similar_name_rows[["displayName", "primaryType", "similar_count", "similar_names"]].head(20)