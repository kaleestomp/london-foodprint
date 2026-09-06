import numpy as np
import pandas as pd
from rapidfuzz import process, fuzz
from server.scripts.clean_places_level_2.find_chain_by_pattern.COMMON_PREFIX_WORDS import COMMON_PREFIX_WORDS

MIN_MATCHES = 1
MATCH_COLUMN = "displayName"
MIN_SHARED_TOKENS = 2

def find_similar_name_rows(df, threshold=95.0, scorer=fuzz.token_set_ratio, min_matches=MIN_MATCHES):
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

    token_lists = [name.split() for name in name_list]
    shared_prefix_counts = np.fromiter(
        (next(
            (index for index, (left_token, right_token) in enumerate(zip(left_tokens, right_tokens))
             if left_token != right_token),
            min(len(left_tokens), len(right_tokens)),
        )
         for left_tokens in token_lists
         for right_tokens in token_lists),
        dtype=np.int16,
        count=len(token_lists) ** 2,
    ).reshape(len(token_lists), len(token_lists))
    leading_words = np.array([tokens[0] if tokens else "" for tokens in token_lists])
    numeric_leading_words = np.array([word.isdigit() for word in leading_words])
    distinctive_shared_leading_word = (
        (shared_prefix_counts == 1)
        & (leading_words[:, None] == leading_words[None, :])
        & ~np.isin(leading_words[:, None], tuple(COMMON_PREFIX_WORDS))
        & ~numeric_leading_words[:, None]
    )
    match_mask = (scores > 0) & (
        (shared_prefix_counts >= MIN_SHARED_TOKENS) | distinctive_shared_leading_word
    )
    match_counts = match_mask.sum(axis=1)
    keep_idx = match_counts >= min_matches

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