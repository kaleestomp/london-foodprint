import pandas as pd
import re
from server.scripts.clean_places_level_2.predict_cuisine_from_name.MAP_KEYWORD import KEYWORD_MAP, LOW_SIGNAL_KEYWORD_TYPES

def predict_cuisine_from_name(row: pd.Series) -> str:
    # Check from Name Characters (e.g. Chinese characters)
    cuisine = check_cuisine_from_language(row)
    if cuisine:
        return cuisine
    # Check from Keywords in Name and Primary Type
    cuisine = check_cuisine_from_keywords(row)
    if cuisine:
        return cuisine
    
    # Fallback
    return ""

def check_cuisine_from_language(row: pd.Series) -> str:
    text = str(row.get("displayName") or "")
    # Check for Chinese characters (CJK Unified Ideographs and Extension A)
    if any(
        ("\u3400" <= ch <= "\u4DBF") or # CJK Extension A
        ("\u4E00" <= ch <= "\u9FFF") # CJK Unified Ideographs
        for ch in text
    ): return "chinese_restaurant"

    # Check for Arabic script characters (commonly seen in Middle Eastern names).
    if any(
        ("\u0600" <= ch <= "\u06FF") or
        ("\u0750" <= ch <= "\u077F") or
        ("\u08A0" <= ch <= "\u08FF")
        for ch in text
    ):
        return "middle_eastern_restaurant"

    return ""

def check_cuisine_from_keywords(row: pd.Series) -> str:

    LOW_SIGNAL_SCORE_THRESHOLD = 0.6
    text = " ".join([
        str(row.get("displayName") or ""),
        str(row.get("primaryTypeDisplayName") or ""),
    ])
    scores: dict[str, float] = {}
    first_match_idx: dict[str, int] = {}

    for idx, (pattern, predicted_type) in enumerate(KEYWORD_MAP):
        if re.search(pattern, text, re.IGNORECASE):
            weight = LOW_SIGNAL_SCORE_THRESHOLD if predicted_type in LOW_SIGNAL_KEYWORD_TYPES else 1.0
            scores[predicted_type] = scores.get(predicted_type, 0.0) + weight
            if predicted_type not in first_match_idx:
                first_match_idx[predicted_type] = idx
    if scores:
        ranked = sorted(
            scores.items(),
            key=lambda item: (-item[1], first_match_idx[item[0]]),
        )
        best_type, best_score = ranked[0]
        second_score = ranked[1][1] if len(ranked) > 1 else 0.0

        # KEYWORD_MAP is ordered by specificity, so resolve exact score ties
        # in favor of the first matching pattern.
        if best_score >= 1.0 and (
            (best_score - second_score) >= 0.35
            or best_score == second_score
        ):
        # # Primary confidence gate for multi-signal matches.
        # if best_score >= 1.0 and (best_score - second_score) >= 0.35:
            return best_type

        # Fallback gate: if only one cuisine candidate matched, allow lower
        # confidence to recover obvious single-signal names (e.g. brands).
        if len(ranked) == 1 and best_score >= LOW_SIGNAL_SCORE_THRESHOLD:
            return best_type

    return ""