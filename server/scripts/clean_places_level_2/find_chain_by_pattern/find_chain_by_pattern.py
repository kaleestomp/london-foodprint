import numpy as np
import pandas as pd
from rapidfuzz import process, fuzz
from server.scripts.clean_places_level_2.find_chain_by_pattern.COMMON_PREFIX_WORDS import COMMON_PREFIX_WORDS

MIN_MATCHES = 1
MATCH_COLUMN = "displayName"
MIN_SHARED_TOKENS = 2

def find_chain_by_pattern(df, threshold=95.0, scorer=fuzz.token_set_ratio, min_matches=MIN_MATCHES):

    # FIND PATTERN IN DISPLAY NAMES
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
    source_indexes = df.index.to_numpy()
    result = []
    unvisited = set(np.flatnonzero(match_mask.any(axis=1)))

    while unvisited:
        component = set()
        to_visit = [unvisited.pop()]

        while to_visit:
            current_index = to_visit.pop()
            if current_index in component:
                continue

            component.add(current_index)
            neighbors = set(np.flatnonzero(match_mask[current_index]))
            to_visit.extend(neighbors & unvisited)
            unvisited -= neighbors

        if len(component) - 1 < min_matches:
            continue

        component_positions = sorted(component)
        similar_names = sorted({df[MATCH_COLUMN].iat[index] for index in component_positions})
        matched_idxs = source_indexes[component_positions].tolist()
        rep_name = min(similar_names, key=lambda name: (len(name), name))
        result.append({
            "name": rep_name,
            "count": len(matched_idxs),
            "matched": similar_names,
            "idx": matched_idxs
        })
    result = pd.DataFrame(result)

    return result


# similar_name_rows[["displayName", "primaryType", "similar_count", "similar_names"]].head(20)